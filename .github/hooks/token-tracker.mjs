#!/usr/bin/env node
// GitHub Copilot variant of the token tracker. Maintains a single MARKDOWN file
// (no JSON): reports/token-usage-copilot.md — separate from the Claude run.
// Self-contained datastore (parses its own Events table). Three kinds:
//   - agentStop / Stop  → kind = main  (main agent: whole session, cumulative,
//                                        exact; UPSERTED — one row per session)
//   - subagentStop      → kind = agent (subagent: own transcript, exact, per run;
//                                        custom agents keep their name, others → main)
//   - postToolUse/skill → kind = skill (inline skill: COUNT ONLY, token cells "—")
//
// Columns: Model (from transcript), Input (new uncached), Cache write
// (cache_creation), Output (generated), Total = sum. Cache reads excluded.
// Field-name tolerant. Never breaks.

import { readFileSync, writeFileSync, mkdirSync, existsSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

const REPORT = 'token-usage-copilot.md';
const EVENTS_HEADER = '| Time (UTC) | Feature | Type | Name | Model | Input | Cache write | Output | Total |';

const fmt = (n) => Math.round(n).toLocaleString('en-US');
const avg = (n, runs) => (runs ? Math.round(n / runs) : 0);

function sumUsage(path) {
  let input = 0, cacheWrite = 0, output = 0;
  const models = new Set();
  if (!path) return { input, cacheWrite, output, total: 0, model: '—' };
  let raw;
  try { raw = readFileSync(path, 'utf8'); } catch { return { input, cacheWrite, output, total: 0, model: '—' }; }
  for (const line of raw.split('\n')) {
    if (!line.trim()) continue;
    let o;
    try { o = JSON.parse(line); } catch { continue; }
    const u = o?.message?.usage || o?.usage;
    if (!u) continue;
    input += u.input_tokens || u.inputTokens || 0;
    cacheWrite += u.cache_creation_input_tokens || u.cacheCreationInputTokens || 0;
    output += u.output_tokens || u.outputTokens || 0;
    const m = o?.message?.model || o?.model;
    if (m && !m.startsWith('<')) models.add(m);   // skip harness markers like <synthetic>
  }
  return { input, cacheWrite, output, total: input + cacheWrite + output, model: [...models].join(', ') || '—' };
}

function currentFeature(projectDir) {
  try {
    const f = JSON.parse(readFileSync(join(projectDir, '.specify', 'feature.json'), 'utf8'));
    const base = (f.feature_directory || '').split('/').filter(Boolean).pop();
    return base || '(none)';
  } catch { return '(none)'; }
}

function isCustomAgent(name, projectDir) {
  if (!name) return false;
  return existsSync(join(projectDir, '.claude', 'agents', `${name}.md`))
    || existsSync(join(projectDir, '.github', 'agents', `${name}.agent.md`));
}

function findAgentName(p, projectDir) {
  const t = p.agent_type || p.subagent_type || p.agentType || p.subagentType
    || p.tool_input?.subagent_type || p.toolInput?.subagent_type;
  return (t && isCustomAgent(String(t), projectDir)) ? String(t) : 'main';
}

// Every Skill tool_use across the main transcript AND all subagent transcripts —
// counts every invocation, fully rebuildable. Returns [{ skill, time }].
function skillInvocations(mainTranscript) {
  const result = [];
  if (!mainTranscript) return result;
  const files = [mainTranscript];
  const subDir = `${mainTranscript.replace(/\.jsonl$/, '')}/subagents`;
  try { for (const f of readdirSync(subDir)) if (f.endsWith('.jsonl')) files.push(join(subDir, f)); } catch { /* none */ }
  for (const file of files) {
    let raw;
    try { raw = readFileSync(file, 'utf8'); } catch { continue; }
    for (const line of raw.split('\n')) {
      if (!line.trim()) continue;
      let o;
      try { o = JSON.parse(line); } catch { continue; }
      const content = o?.message?.content;
      if (!Array.isArray(content)) continue;
      const ts = String(o.timestamp || '').replace('T', ' ').slice(0, 19);
      for (const it of content) {
        if (it?.type === 'tool_use' && it?.name === 'Skill') {
          const sk = it?.input?.skill || it?.input?.command;
          if (sk) result.push({ skill: String(sk), time: ts });
        }
      }
    }
  }
  return result;
}

function parseEvents(md) {
  const rows = [];
  let inEvents = false;
  const num = (s) => Number(String(s).replace(/[^0-9]/g, '')) || 0;
  const clean = (s) => s.replace(/`/g, '');
  for (const line of md.split('\n')) {
    if (line.trim() === EVENTS_HEADER) { inEvents = true; continue; }
    if (!inEvents) continue;
    if (/^\|\s*-+/.test(line)) continue;
    if (!line.startsWith('|')) { if (rows.length) break; else continue; }
    const c = line.split('|').slice(1, -1).map((x) => x.trim());
    if (c.length >= 9) {
      rows.push({ time: c[0], feature: clean(c[1]), kind: c[2], name: clean(c[3]), model: clean(c[4]), input: num(c[5]), cacheWrite: num(c[6]), output: num(c[7]), total: num(c[8]) });
    } else if (c.length === 8) {
      rows.push({ time: c[0], feature: clean(c[1]), kind: c[2], name: clean(c[3]), model: '—', input: num(c[4]), cacheWrite: num(c[5]), output: num(c[6]), total: num(c[7]) });
    }
  }
  return rows;
}

function groupBy(events, keyFn) {
  const agg = {};
  for (const e of events) {
    const k = keyFn(e);
    const a = agg[k] || (agg[k] = { runs: 0, input: 0, cacheWrite: 0, output: 0, total: 0, models: new Set(), skill: e.kind === 'skill' });
    a.runs++; a.input += e.input; a.cacheWrite += e.cacheWrite; a.output += e.output; a.total += e.total;
    if (e.model && e.model !== '—') a.models.add(e.model);
  }
  return agg;
}

const modelsOf = (set) => ([...set].join(', ') || '—');

function render(events, lastKeys, lastEvent) {
  const out = [];
  const c = (isSkill, n) => (isSkill ? '—' : fmt(n));
  out.push('# Token usage report (GitHub Copilot)');
  out.push('');
  out.push(`_Generated: ${new Date().toISOString()} · Events: ${events.length}_`);
  out.push('');

  const byEntity = groupBy(events, (e) => `${e.kind}|${e.name}`);
  const entRows = Object.entries(byEntity)
    .map(([k, a]) => ({ kind: k.split('|')[0], name: k.split('|').slice(1).join('|'), ...a }))
    .sort((x, y) => y.total - x.total);
  out.push('## Summary by main agent, subagents & skills');
  out.push('');
  out.push('| Type | Name | Model | Runs | Input | Cache write | Output | Total | Avg total/run |');
  out.push('|------|------|-------|-----:|------:|------------:|-------:|------:|--------------:|');
  for (const r of entRows) {
    const s = r.skill;
    out.push(`| ${r.kind} | \`${r.name}\` | ${modelsOf(r.models)} | ${r.runs} | ${c(s, r.input)} | ${c(s, r.cacheWrite)} | ${c(s, r.output)} | ${c(s, r.total)} | ${c(s, avg(r.total, r.runs))} |`);
  }
  const T = entRows.reduce((a, r) => ({ runs: a.runs + r.runs, input: a.input + r.input, cacheWrite: a.cacheWrite + r.cacheWrite, output: a.output + r.output, total: a.total + r.total }), { runs: 0, input: 0, cacheWrite: 0, output: 0, total: 0 });
  out.push(`| **All** | | | ${T.runs} | **${fmt(T.input)}** | **${fmt(T.cacheWrite)}** | **${fmt(T.output)}** | **${fmt(T.total)}** | |`);
  out.push('');

  const byKind = groupBy(events, (e) => e.kind);
  out.push('### By kind');
  out.push('');
  out.push('| Kind | Runs | Input | Cache write | Output | Total |');
  out.push('|------|-----:|------:|------------:|-------:|------:|');
  for (const [kind, a] of Object.entries(byKind).sort((x, y) => y[1].total - x[1].total)) {
    const s = kind === 'skill';
    out.push(`| ${kind} | ${a.runs} | ${c(s, a.input)} | ${c(s, a.cacheWrite)} | ${c(s, a.output)} | ${c(s, a.total)} |`);
  }
  out.push('');

  const byFeature = groupBy(events, (e) => e.feature || '(none)');
  out.push('## By speckit feature');
  out.push('');
  out.push('| Feature | Events | Input | Cache write | Output | Total |');
  out.push('|---------|-------:|------:|------------:|-------:|------:|');
  for (const [feat, a] of Object.entries(byFeature).sort((x, y) => y[1].total - x[1].total)) {
    out.push(`| \`${feat}\` | ${a.runs} | ${fmt(a.input)} | ${fmt(a.cacheWrite)} | ${fmt(a.output)} | ${fmt(a.total)} |`);
  }
  out.push('');
  out.push('> **main** = main agent (cumulative, upserted). **agent** = subagent (own');
  out.push('> transcript, per run; custom agents keep their name, others → `main`). **skill**');
  out.push('> = inline invocation — **count only** (`—`). **Model** from transcript · **Input**');
  out.push('> = new uncached · **Cache write** = cache_creation · **Output** = generated ·');
  out.push('> **Total** = sum. Cache reads excluded. For "real work", read Input + Output.');
  out.push('');

  out.push('## Events (most recent last)');
  out.push('');
  out.push(EVENTS_HEADER);
  out.push('|------------|---------|------|------|-------|------:|------------:|-------:|------:|');
  for (const e of events) {
    const s = e.kind === 'skill';
    out.push(`| ${e.time} | \`${e.feature}\` | ${e.kind} | \`${e.name}\` | ${e.model} | ${s ? '—' : e.input} | ${s ? '—' : e.cacheWrite} | ${s ? '—' : e.output} | ${s ? '—' : e.total} |`);
  }
  out.push('');
  out.push(`<!-- diag · last event: ${lastEvent} · payload keys: ${lastKeys} -->`);
  out.push('');
  return out.join('\n');
}

function main() {
  let raw = '';
  try { raw = readFileSync(0, 'utf8'); } catch { /* no stdin */ }
  let p = {};
  try { p = JSON.parse(raw || '{}'); } catch { p = {}; }

  const projectDir = process.env.CLAUDE_PROJECT_DIR || process.env.GITHUB_WORKSPACE || p.cwd || process.cwd();
  const reportsDir = join(projectDir, 'reports');
  const reportFile = join(reportsDir, REPORT);
  mkdirSync(reportsDir, { recursive: true });

  const session = p.session_id || p.sessionId || 'unknown';
  const event = String(p.hook_event_name || p.hookEventName || p.event || p.eventName || '').toLowerCase();
  const now = new Date().toISOString().replace('T', ' ').slice(0, 19);
  const feature = currentFeature(projectDir);

  let md = '';
  try { md = readFileSync(reportFile, 'utf8'); } catch { /* first run */ }
  let events = parseEvents(md);

  if (event.includes('subagentstop')) {
    const name = findAgentName(p, projectDir);
    const u = sumUsage(p.agent_transcript_path || p.agentTranscriptPath || p.transcript_path || p.transcriptPath);
    events.push({ time: now, feature, kind: 'agent', name, model: u.model, input: u.input, cacheWrite: u.cacheWrite, output: u.output, total: u.total });
  } else if (event.includes('stop')) {                            // agentStop / Stop
    const transcript = p.transcript_path || p.transcriptPath;
    const name = `main:${String(session).slice(0, 8)}`;
    const u = sumUsage(transcript);
    events = events.filter((e) => !(e.kind === 'main' && e.name === name));
    events.push({ time: now, feature, kind: 'main', name, model: u.model, input: u.input, cacheWrite: u.cacheWrite, output: u.output, total: u.total });
    events = events.filter((e) => e.kind !== 'skill');
    for (const se of skillInvocations(transcript)) {
      events.push({ time: se.time || now, feature, kind: 'skill', name: se.skill, model: '—', input: 0, cacheWrite: 0, output: 0, total: 0 });
    }
  } else {
    return;
  }

  writeFileSync(reportFile, render(events, Object.keys(p).join(', ') || '(none)', event || '(none)'));
}

try { main(); } catch { /* never break the session */ }
process.exit(0);

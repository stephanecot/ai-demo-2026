#!/usr/bin/env node
// Token-usage tracker hook. Maintains a single MARKDOWN file (no JSON):
//   reports/token-usage.md
// Self-contained datastore: parses its own "Events" table, appends/upserts the
// new event, recomputes summaries, rewrites the file. Three kinds:
//   - Stop          → kind = main  (MAIN agent: whole session, cumulative, exact;
//                                    UPSERTED — one row per session)
//   - SubagentStop  → kind = agent (subagent: own transcript, exact, per run;
//                                    custom agents keep their name, Claude-managed
//                                    ones are bucketed as "main")
//   - PostToolUse/Skill → kind = skill (inline skill: COUNT ONLY, token cells "—")
//
// Columns: Model (from the transcript's message.model), Input (new uncached),
// Cache write (cache_creation — inflates on long agents via cache refresh),
// Output (generated), Total = Input + Cache write + Output. Cache READS excluded.
// Never breaks the session.

import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const REPORT = 'token-usage.md';
const EVENTS_HEADER = '| Time (UTC) | Feature | Type | Name | Model | Input | Cache write | Output | Total |';

const fmt = (n) => Math.round(n).toLocaleString('en-US');
const avg = (n, runs) => (runs ? Math.round(n / runs) : 0);

// Returns { input, cacheWrite, output, total, model }. model = distinct
// message.model values seen in the transcript (usually one).
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
    input += u.input_tokens || 0;
    cacheWrite += u.cache_creation_input_tokens || 0;
    output += u.output_tokens || 0;
    const m = o?.message?.model;
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

// A "custom agent" is defined by this project (.claude/agents/ or Copilot mirror).
// Anything else (Claude-managed: Explore, general-purpose, internal…) → "main".
function isCustomAgent(name, projectDir) {
  if (!name) return false;
  return existsSync(join(projectDir, '.claude', 'agents', `${name}.md`))
    || existsSync(join(projectDir, '.github', 'agents', `${name}.agent.md`));
}

function findAgentName(p, projectDir) {
  const t = p.agent_type || p.subagent_type || p.agentType || p.subagentType
    || p.tool_input?.subagent_type;
  return (t && isCustomAgent(String(t), projectDir)) ? String(t) : 'main';
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
    } else if (c.length === 8) { // legacy rows without Model
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
  out.push('# Token usage report');
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
  out.push('> **main** = main agent (whole session, cumulative, exact, upserted). **agent**');
  out.push('> = subagent (own transcript, exact, per run; custom agents keep their name,');
  out.push('> Claude-managed ones → `main`). **skill** = inline invocation — **count only** (`—`).');
  out.push('>');
  out.push('> **Model** from the transcript · **Input** = new uncached · **Cache write** =');
  out.push('> cache_creation (inflates on long agents via cache refresh) · **Output** =');
  out.push('> generated · **Total** = the three summed. Cache *reads* excluded. For "real');
  out.push('> work", read Input + Output.');
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

  const projectDir = process.env.CLAUDE_PROJECT_DIR || p.cwd || process.cwd();
  const reportsDir = join(projectDir, 'reports');
  const reportFile = join(reportsDir, REPORT);
  mkdirSync(reportsDir, { recursive: true });

  const session = p.session_id || p.sessionId || 'unknown';
  const event = String(p.hook_event_name || p.hookEventName || '').toLowerCase();

  let kind, name, u;
  if (event.includes('posttooluse')) {
    kind = 'skill';
    name = p.tool_input?.skill || p.tool_input?.name || 'unknown-skill';
    u = { input: 0, cacheWrite: 0, output: 0, total: 0, model: '—' };   // count only
  } else if (event.includes('subagentstop')) {
    kind = 'agent';
    name = findAgentName(p, projectDir);
    u = sumUsage(p.agent_transcript_path || p.transcript_path || p.transcriptPath);
  } else if (event === 'stop') {
    kind = 'main';
    name = `main:${String(session).slice(0, 8)}`;
    u = sumUsage(p.transcript_path || p.transcriptPath);
  } else {
    return;
  }

  let md = '';
  try { md = readFileSync(reportFile, 'utf8'); } catch { /* first run */ }
  let events = parseEvents(md);
  if (kind === 'main') events = events.filter((e) => !(e.kind === 'main' && e.name === name));
  events.push({
    time: new Date().toISOString().replace('T', ' ').slice(0, 19),
    feature: currentFeature(projectDir),
    kind, name, model: u.model, input: u.input, cacheWrite: u.cacheWrite, output: u.output, total: u.total,
  });

  writeFileSync(reportFile, render(events, Object.keys(p).join(', ') || '(none)', event || '(none)'));
}

try { main(); } catch { /* never break the session */ }
process.exit(0);

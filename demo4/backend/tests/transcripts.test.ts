import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { litDossierTranscripts } from '../src/transcripts/lecture.js';

function fixture(chemin: string): string {
  return fileURLToPath(new URL(`./fixtures/${chemin}`, import.meta.url));
}

describe('litDossierTranscripts', () => {
  it('cas nominal : reconstitue les sessions à partir de lignes valides, réparties sur deux fichiers', async () => {
    const rapport = await litDossierTranscripts(fixture('transcripts-valides'));

    expect(rapport.fichiersLus).toBe(2);
    expect(rapport.sessions).toHaveLength(2);

    const principale = rapport.sessions.find((s) => s.id === 'sess-abc123');
    expect(principale).toBeDefined();
    expect(principale?.projet).toBe('projet-demo');
    expect(principale?.branche).toBe('main');
    expect(principale?.tours).toHaveLength(2);
    expect(principale?.tours[0]?.modele).toBe('claude-opus-5');
    expect(principale?.tours[0]?.outil).toBe('Edit');
    expect(principale?.tours[1]?.modele).toBe('claude-sonnet-5');
    expect(principale?.tours[1]?.libelle).toContain('Résumé de la modification');
    // Les index sont réattribués après tri chronologique, 1-based.
    expect(principale?.tours.map((t) => t.index)).toEqual([1, 2]);

    // Le fichier dans le sous-dossier est bien lu : la lecture est récursive.
    const secondaire = rapport.sessions.find((s) => s.id === 'sess-def456');
    expect(secondaire).toBeDefined();
    expect(secondaire?.tours).toHaveLength(1);
    expect(secondaire?.tours[0]?.modele).toBe('claude-haiku-4-5');
  });

  it("compte les lignes illisibles sans faire tomber l'import (JSON invalide, usage absent, modèle inconnu)", async () => {
    const rapport = await litDossierTranscripts(fixture('transcripts-valides'));
    // session1.jsonl : 2 lignes valides, 1 JSON invalide, 1 sans bloc usage, 1 modèle inconnu.
    // session2.jsonl : 1 ligne valide.
    expect(rapport.lignesLues).toBe(6);
    expect(rapport.lignesIgnorees).toBe(3);
  });

  it('cas limite : un dossier entièrement illisible renvoie zéro session, sans planter', async () => {
    const rapport = await litDossierTranscripts(fixture('transcripts-tout-illisible'));
    expect(rapport.sessions).toEqual([]);
    expect(rapport.fichiersLus).toBe(1);
    expect(rapport.lignesIgnorees).toBe(2);
  });

  it("cas d'erreur : un dossier absent ne lève pas d'exception et renvoie un rapport vide", async () => {
    const rapport = await litDossierTranscripts(fixture('ce-dossier-n-existe-pas'));
    expect(rapport).toEqual({ sessions: [], fichiersLus: 0, lignesLues: 0, lignesIgnorees: 0 });
  });
});

# US-009 — Export du CRA en PDF et Excel

## User Story

**En tant que** consultant ou manager,
**je veux** exporter un CRA au format PDF ou Excel,
**afin de** le transmettre au client ou au service de facturation.

## Critères d'acceptation

- [ ] Un bouton « Exporter » est disponible sur tout CRA (quel que soit son statut), avec le choix **PDF** ou **Excel**.
- [ ] Le PDF contient : nom du consultant, mois, détail jour par jour, totaux par mission, total d'absences par type, statut du CRA et date de validation le cas échéant.
- [ ] Le PDF comporte un emplacement de signature (consultant et manager).
- [ ] L'export Excel contient les mêmes données sous forme tabulaire exploitable (une ligne par jour et par entrée).
- [ ] Le fichier généré est nommé `CRA_<nom>_<annee>-<mois>.<ext>` (ex. : `CRA_Dupont_2026-08.pdf`).
- [ ] Un manager peut exporter en une fois tous les CRA validés d'un mois donné (archive ZIP).

## Règles métier

- Un CRA non validé exporté porte un filigrane « PROVISOIRE » sur le PDF.
- L'export ne modifie jamais le statut du CRA.

## Notes techniques

- Endpoints backend : `GET /api/cra/{id}/export?format=pdf|xlsx`, `GET /api/exports/mois/{annee}/{mois}` (ZIP, rôle Manager).
- Génération des fichiers côté backend ; le frontend déclenche un simple téléchargement.

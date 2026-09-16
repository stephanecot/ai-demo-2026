# Exemple 3 — résultat attendu

Exécution réelle du prompt `exemple3.MD` le 16/09/2026.

**Le canevas** : https://claude.ai/artifact/XcSt4iox7ixesEoNQAcmzb

## Ce qui a été produit

Trois artboards mobiles 390 × 844 côte à côte sur un même canevas, plus une note de
cadrage qui rappelle la direction artistique :

| Artboard | Fichier | Contenu |
|----------|---------|---------|
| Accueil | `Main.dc.html` | en-tête « Bonjour Camille » + avatar, carte *Mon vélo* (Cargo Longtail C2, autonomie 72 % avec la valeur écrite à côté de la jauge, révision le 12 juin), trois raccourcis (déverrouiller en action principale, signaler un problème, trouver une agence), barre d'onglets |
| Mon abonnement | `Abonnement.dc.html` | formule Confort à 59,00 € / mois sur carte bleue pleine, prochain prélèvement le 1er juin, 184 km ce mois-ci avec histogramme sur 7 jours, trois derniers paiements, bouton « Changer de formule » |
| Assistance | `Assistance.dc.html` | état du vélo sur deux lignes (« Conforme » / « À surveiller », libellé **et** icône, jamais la couleur seule), trois motifs de demande avec sous-titre, engagement « Intervention sous 24 h », bouton d'appel et horaires en pied |

## Direction artistique retenue

Le prompt interdit de valider entre chaque écran : une seule direction a été engagée et
elle est annoncée, pas négociée. Fond clair chaud `#f4f4f1`, encre `#14181d`, **un seul
accent** bleu profond `#12408c`, Archivo (titres) + Public Sans (texte), angles de 16 à
22 px, cartes blanches sur fond crème.

Contraintes du prompt vérifiées à la construction :

- tous les textes en français, montants au format `59,00 €` ;
- aucune information portée par la couleur seule — la jauge d'autonomie porte « 72 % »,
  les états portent leur libellé et une icône distincte ;
- aucun texte sous 14 px, cibles tactiles à 56-68 px (au-dessus du minimum de 44 px) ;
- icônes en SVG en ligne, aucun emoji, aucune librairie ;
- pas de fausse barre d'état iOS ni de faux clavier : sur un vrai téléphone, le système
  les dessine par-dessus.

## Fichiers

`Main.dc.html`, `Abonnement.dc.html`, `Assistance.dc.html`, `canvas.json` sont les
fichiers de travail — toute modification repart d'eux puis régénère
`velocite-app-mobile.html`, la page publiée.

## Ce qu'il reste à faire

Les écrans sont des maquettes statiques : rien n'est cliquable, aucun écran n'en appelle
un autre. Le prénom, le modèle de vélo, les montants et les dates sont des valeurs
d'exemple cohérentes entre les trois écrans, à remplacer par de vraies données avant
toute présentation client.

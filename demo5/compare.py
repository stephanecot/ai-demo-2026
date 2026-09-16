"""Compare deux captures et mesure la fidélité pixel.

    python compare.py interface.png result/rendu.png
    python compare.py interface.png result/rendu.png --seuil 16 --sortie result/diff.png

Écrit une carte des écarts (`diff.png` par défaut, à côté du rendu) et affiche un
score : part des pixels conformes, écart moyen, et les cinq bandes horizontales les
plus fautives — de quoi dire à Claude « la zone 600-700 px n'y est pas ».
"""

from __future__ import annotations

import argparse
import sys
from pathlib import Path

import numpy as np
from PIL import Image


sys.stdout.reconfigure(encoding="utf-8", errors="replace")


def charge(chemin: Path) -> np.ndarray:
    return np.asarray(Image.open(chemin).convert("RGB"), dtype=np.int16)


def recadre(a: np.ndarray, b: np.ndarray) -> tuple[np.ndarray, np.ndarray, bool]:
    """Ramène les deux images à leur intersection (haut-gauche)."""
    h, l = min(a.shape[0], b.shape[0]), min(a.shape[1], b.shape[1])
    recadree = a.shape[:2] != b.shape[:2]
    return a[:h, :l], b[:h, :l], recadree


def main() -> int:
    arg = argparse.ArgumentParser(description="Fidélité pixel entre maquette et rendu.")
    arg.add_argument("reference", type=Path, help="la maquette (interface.png)")
    arg.add_argument("rendu", type=Path, help="la capture du rendu")
    arg.add_argument("--seuil", type=int, default=16, help="écart toléré par canal (0-255)")
    arg.add_argument("--sortie", type=Path, default=None, help="carte des écarts à écrire")
    opts = arg.parse_args()

    reference, rendu = charge(opts.reference), charge(opts.rendu)
    print(f"référence : {reference.shape[1]} × {reference.shape[0]}")
    print(f"rendu     : {rendu.shape[1]} × {rendu.shape[0]}")

    reference, rendu, recadree = recadre(reference, rendu)
    if recadree:
        print(f"⚠ tailles différentes — comparaison sur {reference.shape[1]} × {reference.shape[0]}")

    ecart = np.abs(reference - rendu).max(axis=2)
    conformes = float((ecart <= opts.seuil).mean()) * 100
    moyen = float(ecart.mean())

    print(f"\npixels conformes (écart ≤ {opts.seuil}) : {conformes:.1f} %")
    print(f"écart moyen par pixel        : {moyen:.1f} / 255")

    hauteur = ecart.shape[0]
    pas = max(hauteur // 20, 1)
    bandes = [
        (int((ecart[y : y + pas] > opts.seuil).mean() * 100), y, min(y + pas, hauteur))
        for y in range(0, hauteur, pas)
    ]
    print("\nbandes les plus fautives (y, % de pixels hors seuil) :")
    for part, debut, fin in sorted(bandes, reverse=True)[:5]:
        print(f"  {debut:>4}-{fin:<4} px : {part:>3} %")

    sortie = opts.sortie or opts.rendu.with_name("diff.png")
    fond = (reference.mean(axis=2) * 0.35 + 165).astype(np.uint8)
    carte = np.dstack([fond, fond, fond])
    faute = ecart > opts.seuil
    carte[faute] = np.dstack(
        [np.full_like(fond, 220), np.full_like(fond, 40), np.full_like(fond, 40)]
    )[faute]
    Image.fromarray(carte).save(sortie)
    print(f"\ncarte des écarts : {sortie}")

    return 0


if __name__ == "__main__":
    raise SystemExit(main())

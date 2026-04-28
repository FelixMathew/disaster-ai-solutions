"""
prepare_dataset.py
==================
Converts the xBD / xView2 dataset into binary classification format.

Usage:
    python prepare_dataset.py --xbd_root <path_to_xbd> --out_dir dataset --limit 600

xBD folder layout expected:
    <xbd_root>/
        train/
            images/   *.png
            labels/   *.json
        test/
            images/   *.png
            labels/   *.json

Output:
    dataset/
        train/
            SAFE/
            DAMAGE/
        test/
            SAFE/
            DAMAGE/
"""

import os
import json
import shutil
import argparse
import random
from pathlib import Path
from typing import Tuple

# ─── Label Mapping ───────────────────────────────────────────────────────────
SAFE_LABELS    = {"no-damage", "un-classified"}
DAMAGE_LABELS  = {"minor-damage", "major-damage", "destroyed"}

def classify_label(subtype: str) -> str | None:
    s = subtype.lower().strip()
    if s in SAFE_LABELS:
        return "SAFE"
    if s in DAMAGE_LABELS:
        return "DAMAGE"
    return None  # skip

def parse_xbd_label(json_path: Path) -> str | None:
    """Read an xBD JSON annotation and return SAFE / DAMAGE / None."""
    try:
        data = json.loads(json_path.read_text(encoding="utf-8"))
        features = data.get("features", {})
        # post-disaster annotations are under "xy" key
        xy_features = features.get("xy", [])
        if not xy_features:
            return None

        votes = {"SAFE": 0, "DAMAGE": 0}
        for feat in xy_features:
            subtype = feat.get("properties", {}).get("subtype", "")
            label = classify_label(subtype)
            if label:
                votes[label] += 1

        if votes["DAMAGE"] > 0:
            return "DAMAGE"
        if votes["SAFE"] > 0:
            return "SAFE"
        return None
    except Exception as e:
        print(f"  [WARN] Failed to parse {json_path.name}: {e}")
        return None

def process_split(
    xbd_split_dir: Path,
    out_split_dir: Path,
    limit_per_class: int,
    split_name: str,
):
    images_dir = xbd_split_dir / "images"
    labels_dir = xbd_split_dir / "labels"

    if not images_dir.exists() or not labels_dir.exists():
        print(f"[ERROR] Missing images/ or labels/ under {xbd_split_dir}")
        return

    # Only look at *_post_disaster.png images
    post_images = sorted(images_dir.glob("*_post_disaster.png"))
    print(f"\n[{split_name.upper()}] Found {len(post_images)} post-disaster images")

    buckets: dict[str, list[Path]] = {"SAFE": [], "DAMAGE": []}

    for img_path in post_images:
        # Derive matching label JSON  e.g. xxx_post_disaster.json
        json_name = img_path.stem + ".json"
        json_path = labels_dir / json_name
        if not json_path.exists():
            continue

        label = parse_xbd_label(json_path)
        if label:
            buckets[label].append(img_path)

    print(f"  Before balancing → SAFE: {len(buckets['SAFE'])}  DAMAGE: {len(buckets['DAMAGE'])}")

    # Balance
    min_count = min(len(buckets["SAFE"]), len(buckets["DAMAGE"]), limit_per_class)
    print(f"  Using {min_count} images per class (limit={limit_per_class})")

    for cls in ["SAFE", "DAMAGE"]:
        dest_dir = out_split_dir / cls
        dest_dir.mkdir(parents=True, exist_ok=True)

        selected = random.sample(buckets[cls], min_count)
        for src in selected:
            shutil.copy2(src, dest_dir / src.name)

        print(f"  Copied {min_count} → {dest_dir}")

def main():
    parser = argparse.ArgumentParser(description="Prepare xBD dataset for binary classification")
    parser.add_argument("--xbd_root", type=str, required=True,
                        help="Root xBD directory containing train/ and test/ splits")
    parser.add_argument("--out_dir",  type=str, default="dataset",
                        help="Output directory (default: dataset/)")
    parser.add_argument("--limit",    type=int, default=600,
                        help="Max images per class per split (default: 600)")
    parser.add_argument("--seed",     type=int, default=42)
    args = parser.parse_args()

    random.seed(args.seed)

    xbd_root = Path(args.xbd_root)
    out_root  = Path(args.out_dir)

    print("=" * 60)
    print("  DisasterAI — xBD Dataset Preprocessor")
    print("=" * 60)
    print(f"  Source  : {xbd_root}")
    print(f"  Output  : {out_root}")
    print(f"  Limit   : {args.limit} images/class/split")

    for split in ["train", "test"]:
        xbd_split = xbd_root / split
        out_split = out_root  / split
        if xbd_split.exists():
            process_split(xbd_split, out_split, args.limit, split)
        else:
            print(f"\n[SKIP] {xbd_split} not found — skipping {split} split")

    print("\n✅  Dataset preparation complete!")
    # Summary
    for split in ["train", "test"]:
        for cls in ["SAFE", "DAMAGE"]:
            p = out_root / split / cls
            if p.exists():
                count = len(list(p.glob("*.png")))
                print(f"  {split}/{cls}: {count} images")

if __name__ == "__main__":
    main()

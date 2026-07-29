#!/usr/bin/env python3

from __future__ import annotations

import argparse
import shutil
import sys
from pathlib import Path
import zipfile


def ensure_safe_path(target_dir: Path, member_name: str) -> Path:
    candidate = (target_dir / member_name).resolve()
    base = target_dir.resolve()
    if not (candidate == base or base in candidate.parents):
        raise ValueError(f"Unsafe path in archive: {member_name}")
    return candidate


def unpack(zip_path: Path, output_dir: Path) -> None:
    if not zip_path.exists():
        raise FileNotFoundError(f"Archive not found: {zip_path}")

    output_dir.mkdir(parents=True, exist_ok=True)

    with zipfile.ZipFile(zip_path, "r") as archive:
        for member in archive.infolist():
            destination = ensure_safe_path(output_dir, member.filename)
            if member.is_dir():
                destination.mkdir(parents=True, exist_ok=True)
                continue

            destination.parent.mkdir(parents=True, exist_ok=True)
            with archive.open(member) as source, destination.open("wb") as target:
                shutil.copyfileobj(source, target)


def main() -> int:
    parser = argparse.ArgumentParser(
        description="Unpack eternalcyberia-repo.zip into a target directory."
    )
    parser.add_argument(
        "--zip",
        default="eternalcyberia-repo.zip",
        help="Path to the zip archive (default: eternalcyberia-repo.zip).",
    )
    parser.add_argument(
        "--out",
        default=".",
        help="Output directory for extracted files (default: current directory).",
    )
    args = parser.parse_args()

    try:
        unpack(Path(args.zip), Path(args.out))
    except (
        FileNotFoundError,
        ValueError,
        zipfile.BadZipFile,
        OSError,
        PermissionError,
    ) as exc:
        print(f"Error: {exc}", file=sys.stderr)
        return 1
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

#!/usr/bin/env python3

from __future__ import annotations

import argparse
import shutil
import sys
import time
from pathlib import Path
import zipfile


def positive_float(value: str) -> float:
    parsed = float(value)
    if parsed <= 0:
        raise argparse.ArgumentTypeError(
            "Polling interval must be a positive number (in seconds)."
        )
    return parsed


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


def wait_for_archive(
    zip_path: Path, interval_seconds: float, timeout_seconds: float | None = None
) -> None:
    started = time.monotonic()
    while not zip_path.exists():
        if timeout_seconds is not None and (time.monotonic() - started) >= timeout_seconds:
            raise TimeoutError(f"Timed out waiting for archive: {zip_path}")
        time.sleep(interval_seconds)


def main() -> int:
    parser = argparse.ArgumentParser(
        description="Unpack a zip archive into a target directory."
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
    parser.add_argument(
        "--no-wait",
        action="store_true",
        help="Fail immediately if the zip file does not exist.",
    )
    parser.add_argument(
        "--interval",
        type=positive_float,
        default=1.0,
        help="Polling interval in seconds while waiting for the zip (default: 1.0).",
    )
    parser.add_argument(
        "--timeout",
        type=positive_float,
        default=None,
        help="Optional maximum seconds to wait for zip detection.",
    )
    args = parser.parse_args()

    try:
        zip_path = Path(args.zip)
        if not args.no_wait:
            wait_for_archive(zip_path, args.interval, args.timeout)
        unpack(zip_path, Path(args.out))
    except (
        FileNotFoundError,
        ValueError,
        TimeoutError,
        zipfile.BadZipFile,
        OSError,
        PermissionError,
    ) as exc:
        print(f"Error: {exc}", file=sys.stderr)
        return 1
    return 0


if __name__ == "__main__":
    sys.exit(main())

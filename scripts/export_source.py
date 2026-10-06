#!/usr/bin/env python3
"""Export current publishable source files without Git history or local artifacts."""
import argparse
from pathlib import Path
import subprocess
import zipfile

from check_public_files import ROOT, main as check_public


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("output", type=Path)
    args = parser.parse_args()
    output = args.output.resolve()
    if output.is_relative_to(ROOT):
        parser.error("Choose an output path outside the source repository")
    if output.exists():
        parser.error("Output already exists; choose a new archive path")
    if check_public():
        raise SystemExit(1)
    paths = subprocess.check_output(
        ["git", "ls-files", "--cached", "--others", "--exclude-standard", "-z"], cwd=ROOT,
    ).decode().split("\0")
    paths = sorted(set(filter(None, paths)))
    if any((ROOT / name).is_symlink() for name in paths):
        parser.error("Source contains symlinks; inspect their targets before exporting")
    missing = [name for name in paths if not (ROOT / name).is_file()]
    if missing:
        parser.error("Tracked source files are missing: " + ", ".join(missing))
    output.parent.mkdir(parents=True, exist_ok=True)
    with zipfile.ZipFile(output, "x", compression=zipfile.ZIP_DEFLATED) as archive:
        for name in paths:
            archive.write(ROOT / name, arcname="FLAAA/" + name)
    print(f"Exported {len(paths)} source files to {output}")


if __name__ == "__main__":
    main()

#!/usr/bin/env python3
"""Convert a real recorded video to silent H.264 MP4; requires FFmpeg."""
import argparse
from pathlib import Path
import shutil
import subprocess


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('input', type=Path)
    parser.add_argument('output', type=Path)
    parser.add_argument('--force', action='store_true')
    args = parser.parse_args()
    executable = shutil.which('ffmpeg')
    if not executable:
        parser.exit(1, 'FFmpeg is unavailable. Keep the original video; no MP4 was produced.\n')
    if not args.input.is_file() or args.output.suffix.lower() != '.mp4':
        parser.exit(1, 'Provide an existing input video and an .mp4 output path.\n')
    if args.input.resolve() == args.output.resolve():
        parser.exit(1, 'Input and output must be different files.\n')
    if args.output.exists() and not args.force:
        parser.exit(1, 'Output already exists. Use --force to replace it.\n')
    args.output.parent.mkdir(parents=True, exist_ok=True)
    subprocess.run([executable, '-hide_banner', '-loglevel', 'error', '-y' if args.force else '-n', '-i', str(args.input.resolve()), '-vf', 'scale=trunc(iw/2)*2:trunc(ih/2)*2', '-an', '-c:v', 'libx264', '-crf', '18', '-pix_fmt', 'yuv420p', '-movflags', '+faststart', str(args.output.resolve())], check=True)
    print(args.output.resolve())


if __name__ == '__main__':
    main()

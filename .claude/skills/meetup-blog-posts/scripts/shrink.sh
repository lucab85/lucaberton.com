#!/usr/bin/env bash
# Resize a photo to the repo's CI limits and strip EXIF.
# Usage: shrink.sh SRC DEST EDGE MAXBYTES
#   event photos  (static/blog/events/<slug>/):  EDGE=1280  MAXBYTES=$((300*1024))   (CI limit 320 KB)
#   thumbnails    (static/blog/thumbnails/):      EDGE=1200  MAXBYTES=$((205*1024))   (CI limit 220 KB)
# Starts at JPEG quality 80 and lowers it until the file is small enough.
set -e
src="$1"; dest="$2"; edge="$3"; max="$4"
here="$(cd "$(dirname "$0")" && pwd)"
for q in 80 76 72 68 64 60 56 52 48; do
  sips -Z "$edge" -s format jpeg -s formatOptions "$q" "$src" --out "$dest" >/dev/null
  python3 -I "$here/strip_exif.py" "$dest"
  sz=$(stat -f%z "$dest")
  [ "$sz" -le "$max" ] && { echo "$(basename "$dest") q=$q ${sz}B"; exit 0; }
done
echo "FAILED to get $dest under $max bytes" >&2; exit 1

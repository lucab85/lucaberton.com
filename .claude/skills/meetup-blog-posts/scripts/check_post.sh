#!/usr/bin/env bash
# Verify that every image and internal /blog/ link used by one or more posts resolves.
# Usage (from repo root): .claude/skills/meetup-blog-posts/scripts/check_post.sh <slug> [<slug>...]
# Also reports leftover TODO markers and leftover EXIF/GPS in the post's photos.
set -u
cd "$(git rev-parse --show-toplevel)" || exit 2
rc=0
for slug in "$@"; do
  f="src/content/blog/$slug.mdx"
  [ -f "$f" ] || { echo "NO POST   $f"; rc=1; continue; }
  echo "== $slug  ($(grep -m1 '^draft:' "$f"))"
  # images: frontmatter src and markdown images
  grep -oE '/blog/[A-Za-z0-9/_.-]+\.(jpg|jpeg|png|webp)' "$f" | sort -u | while read -r p; do
    [ -f "static$p" ] || { echo "MISSING   $p"; }
  done
  # internal post links
  grep -oE '\]\(/blog/[a-z0-9-]+/\)' "$f" | sed -E 's/^\]\(//; s/\)$//' | sort -u | while read -r l; do
    [ -f "src/content/blog/$(basename "$l").mdx" ] || echo "BROKEN    link $l"
  done
  # EXIF / GPS left in event photos and thumbnail
  for img in static/blog/events/"$slug"/* static/blog/thumbnails/"$slug".*; do
    [ -f "$img" ] || continue
    python3 -I - "$img" <<'PY'
import sys
d=open(sys.argv[1],'rb').read()
if d[:2]!=b'\xff\xd8': sys.exit(0)
i=2
while i<len(d)-4 and d[i]==0xFF and d[i+1]!=0xDA:
    if d[i+1] in (0xE1,0xED):
        print("EXIF/APP1 ", sys.argv[1]); break
    i+=2+int.from_bytes(d[i+2:i+4],'big')
PY
  done
  n=$(grep -c 'TODO' "$f"); [ "$n" -gt 0 ] && echo "TODO      $n marker(s) left"
done
echo "check finished"
exit $rc

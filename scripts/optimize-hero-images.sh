#!/bin/zsh
set -e
cd "$(dirname "$0")/.."

mkdir -p .img-originals
[ -f .img-originals/FikaWorksDay2025.jpg ] || cp src/assets/photos/FikaWorksDay2025.jpg .img-originals/
[ -f .img-originals/luca-hero.jpg ] || cp src/assets/luca-hero.jpg .img-originals/
[ -f .img-originals/hero-stage-1.jpg ] || cp static/hero-stage-1.jpg .img-originals/
[ -f .img-originals/hero-stage-2.jpg ] || cp static/hero-stage-2.jpg .img-originals/

# FikaWorksDay2025: crop centered to 16:9 then resize to 1600x900 (matches displayed aspect ratio)
magick .img-originals/FikaWorksDay2025.jpg -gravity center -crop 1800x1012+0+0 +repage -resize 1600x900 -quality 82 -strip src/assets/photos/FikaWorksDay2025.jpg
[ -d static/blog/conferences ] && cp src/assets/photos/FikaWorksDay2025.jpg static/blog/conferences/FikaWorksDay2025.jpg

# luca-hero: resize to 800x1120 from 1714x2400
magick .img-originals/luca-hero.jpg -resize 800x1120 -quality 82 -strip src/assets/luca-hero.jpg
[ -f static/luca-hero.jpg ] && cp src/assets/luca-hero.jpg static/luca-hero.jpg

# hero-stage-1: 2000x1126 -> 1600x900 WebP + smaller JPG fallback
cwebp -q 78 -resize 1600 0 .img-originals/hero-stage-1.jpg -o static/hero-stage-1.webp >/dev/null 2>&1
magick .img-originals/hero-stage-1.jpg -resize 1600x900 -quality 78 -strip static/hero-stage-1.jpg

# hero-stage-2: 1200x675 -> WebP + re-encoded JPG fallback
cwebp -q 78 .img-originals/hero-stage-2.jpg -o static/hero-stage-2.webp >/dev/null 2>&1
magick .img-originals/hero-stage-2.jpg -quality 78 -strip static/hero-stage-2.jpg

echo '=== Final sizes ==='
ls -la src/assets/photos/FikaWorksDay2025.jpg src/assets/luca-hero.jpg static/hero-stage-1.* static/hero-stage-2.* static/luca-hero.jpg static/blog/conferences/FikaWorksDay2025.jpg 2>/dev/null

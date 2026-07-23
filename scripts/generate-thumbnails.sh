#!/bin/bash
# Generate unique blog thumbnails (1200x630) for posts using placeholder image
# Color-coded by category with title text overlay

BLOG_DIR="src/content/blog"
IMG_DIR="static/blog/thumbnails"
mkdir -p "$IMG_DIR"

# Category color schemes (gradient start, gradient end, accent)
declare -A CAT_COLORS
CAT_COLORS["AI"]="#1a1a2e,#16213e"
CAT_COLORS["Platform Engineering"]="#0f3460,#1a1a2e"
CAT_COLORS["Automation"]="#1b2838,#2d4059"
CAT_COLORS["DevOps"]="#162447,#1f4068"
CAT_COLORS["Open Source"]="#1a1a2e,#533483"

get_colors() {
  local cat="$1"
  echo "${CAT_COLORS[$cat]:-#1a1a2e,#16213e}"
}

count=0
total=$(grep -rl "Practical RHEL AI Dyone Dekker" "$BLOG_DIR/" | wc -l)

grep -rl "Practical RHEL AI Dyone Dekker" "$BLOG_DIR/" | while read -r file; do
  count=$((count + 1))
  
  # Extract title and category from frontmatter
  title=$(sed -n 's/^title: *"\(.*\)"/\1/p' "$file" | head -1)
  category=$(sed -n 's/^category: *"\(.*\)"/\1/p' "$file" | head -1)
  
  if [ -z "$title" ]; then
    echo "[$count/$total] SKIP (no title): $file"
    continue
  fi
  
  # Generate filename from the mdx filename
  basename=$(basename "$file" .mdx)
  imgfile="$IMG_DIR/${basename}.jpg"
  
  if [ -f "$imgfile" ]; then
    echo "[$count/$total] EXISTS: $basename"
    continue
  fi
  
  # Get category colors
  colors=$(get_colors "$category")
  color1=$(echo "$colors" | cut -d, -f1)
  color2=$(echo "$colors" | cut -d, -f2)
  
  # Wrap title text (max ~35 chars per line)
  wrapped_title=$(echo "$title" | fold -s -w 32)
  
  # Count lines for vertical positioning
  num_lines=$(echo "$wrapped_title" | wc -l)
  
  # Generate image: gradient background + category badge + title
  convert -size 1200x630 \
    \( -size 1200x630 gradient:"${color1}-${color2}" \) \
    \( -size 1200x630 xc:none \
       -fill "rgba(255,255,255,0.03)" \
       -draw "circle 900,100 900,300" \
       -draw "circle 200,500 200,650" \
    \) -composite \
    -fill "rgba(255,255,255,0.08)" \
    -draw "roundrectangle 60,60 1140,570 8,8" \
    -font "DejaVu-Sans-Bold" -pointsize 44 \
    -fill white \
    -gravity NorthWest \
    -annotate +90+100 "$wrapped_title" \
    -font "DejaVu-Sans" -pointsize 22 \
    -fill "rgba(255,255,255,0.7)" \
    -annotate +90+$(( 120 + num_lines * 55 )) "$category" \
    -font "DejaVu-Sans" -pointsize 20 \
    -fill "rgba(255,255,255,0.5)" \
    -gravity SouthEast \
    -annotate +90+80 "lucaberton.com" \
    -quality 82 \
    "$imgfile"
  
  if [ $? -eq 0 ]; then
    # Update the MDX file to reference the new image
    sed -i "s|/blog/books/Practical RHEL AI Dyone Dekker.jpg|/blog/thumbnails/${basename}.jpg|" "$file"
    echo "[$count/$total] OK: $basename ($(du -h "$imgfile" | cut -f1))"
  else
    echo "[$count/$total] FAIL: $basename"
  fi
done

echo "Done! Generated thumbnails in $IMG_DIR"

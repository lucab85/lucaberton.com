#!/bin/bash

# Make sure cwebp is installed
if ! command -v cwebp &> /dev/null; then
  echo "❌ 'cwebp' not found. Please install it with 'brew install webp'"
  exit 1
fi

# Step 1: Rename files to replace spaces with underscores
for file in *\ *; do
  [ -e "$file" ] || continue
  new_name="${file// /_}"
  mv "$file" "$new_name"
  echo "✅ Renamed: '$file' -> '$new_name'"
done

# Step 2: Convert .jpg/.jpeg files to .webp
for img in *.jpg *.jpeg; do
  [ -e "$img" ] || continue
  base="${img%.*}"
  webp_name="$base.webp"
  cwebp -q 80 "$img" -o "$webp_name"
  echo "🖼️ Converted: '$img' -> '$webp_name'"
done

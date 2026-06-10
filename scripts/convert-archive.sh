#!/bin/bash
# Convert all PNG files in archive to WebP, then delete the PNGs
# Usage: just double-click or run: bash scripts/convert-archive.sh

DIR="$(dirname "$0")/../images/archive"
QUALITY=85

count=0
for png in "$DIR"/*.png; do
  [ -f "$png" ] || continue
  name=$(basename "$png" .png)
  webp="$DIR/${name}.webp"
  echo "Converting $name.png → $name.webp (q${QUALITY})..."
  cwebp -q $QUALITY "$png" -o "$webp" -quiet
  if [ -f "$webp" ]; then
    rm "$png"
    count=$((count + 1))
  fi
done

if [ $count -eq 0 ]; then
  echo "No PNGs to convert."
else
  echo "Done — converted $count file(s)."
fi

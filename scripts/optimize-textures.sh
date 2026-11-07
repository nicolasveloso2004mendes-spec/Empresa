#!/usr/bin/env bash
# Downscales captures to GPU-safe WebP textures (<= 4096px on any side).
set -e
for d in public/projects/*/; do
  ffmpeg -v error -y -i "$d/desktop.jpg" -vf "scale=1440:-1" -quality 82 "$d/desktop.webp"
  ffmpeg -v error -y -i "$d/desktop-full.jpg" -vf "scale='if(gt(ih,4096),-2,iw)':'min(ih,4096)'" -quality 78 "$d/desktop-full.webp"
  ffmpeg -v error -y -i "$d/mobile.jpg" -quality 82 "$d/mobile.webp"
  ffmpeg -v error -y -i "$d/mobile-full.jpg" -vf "scale='if(gt(ih,4096),-2,iw)':'min(ih,4096)'" -quality 78 "$d/mobile-full.webp"
  rm -f "$d"/*.jpg
done
ls -la public/projects/*

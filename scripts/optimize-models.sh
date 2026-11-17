#!/usr/bin/env bash
# Rebuilds the web-ready fish models in public/models/ from the originals in models-src/.
#   - textures -> KTX2 (UASTC for the normal map, ETC1S for colour and occlusion/roughness)
#   - geometry and animation -> Meshopt
# Needs KTX-Software (the `ktx` binary) on PATH: https://github.com/KhronosGroup/KTX-Software/releases
# Run from the repo root:  npm run models
set -euo pipefail
gt() { npx --yes @gltf-transform/cli@4 "$@"; }
tmp=$(mktemp -d)
trap 'rm -rf "$tmp"' EXIT
mkdir -p public/models
for size in 2k 1k; do
  gt dedup    "models-src/betta-$size.glb" "$tmp/a.glb"
  gt prune    "$tmp/a.glb" "$tmp/a.glb"
  gt resample "$tmp/a.glb" "$tmp/a.glb"
  gt uastc    "$tmp/a.glb" "$tmp/b.glb" --slots "normalTexture" --level 2 --rdo --zstd 18
  gt etc1s    "$tmp/b.glb" "$tmp/c.glb" --slots "{baseColorTexture,occlusionTexture,metallicRoughnessTexture}" --quality 255
  gt meshopt  "$tmp/c.glb" "public/models/betta-$size.glb" --level medium
done
ls -la public/models

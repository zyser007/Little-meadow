// Asset pipeline. Real art is optional: drop PNGs into public/assets/ with the keys below and they
// load automatically; anything missing falls back to a placeholder drawn in sprites.ts. This lets
// the prototype run today and accept the user's sliced sprites later with zero code changes.
//
// Expected files (transparent PNG), referenced by key -> `assets/<key>.png`:
//   Terrain (iso diamond, ~96x48 + height for raised edges):
//     tile_grass, tile_path, tile_water, tile_sand, tile_soil, tile_soil_wet
//   Crops (anchored bottom-centre, ~64x80), one per stage index:
//     crop_<id>_0 .. crop_<id>_<stages-1>   e.g. crop_turnip_0 ... crop_turnip_3
//   Buildings (anchored bottom-centre, ~120x140): build_house, build_shop, build_coop, build_barn, build_well
//   Player (anchored bottom-centre, ~48x72): player_down, player_up, player_left, player_right
//
// To register files you actually ship, add their keys to MANIFEST.

export interface SpriteEntry {
  key: string;
  src: string;
}

// Empty by default: no real art committed yet, so every draw uses a placeholder (no 404 noise).
export const MANIFEST: SpriteEntry[] = [];

export type AssetMap = Map<string, HTMLImageElement>;

export async function loadAssets(): Promise<AssetMap> {
  const map: AssetMap = new Map();
  await Promise.all(
    MANIFEST.map(
      (e) =>
        new Promise<void>((resolve) => {
          const img = new Image();
          img.onload = () => {
            map.set(e.key, img);
            resolve();
          };
          img.onerror = () => resolve(); // missing file -> placeholder fallback
          img.src = e.src;
        }),
    ),
  );
  return map;
}

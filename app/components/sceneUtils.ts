// Small helpers shared by the scenes.

import * as THREE from 'three';

// A random number generator that gives the same numbers every time for a given seed,
// so flowers, clouds, etc. stay in the same place on every reload.
export function seededRandom(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Turns a canvas drawing into a repeating texture
export function canvasTexture(
  width: number,
  height: number,
  draw: (ctx: CanvasRenderingContext2D, w: number, h: number) => void,
  repeat: [number, number] = [1, 1]
) {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  draw(canvas.getContext('2d')!, width, height);
  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(repeat[0], repeat[1]);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;
  return tex;
}

// Speckled "fuzzy" texture, used for grass and carpet
export function fuzzTexture(base: string, light: string, dark: string, seed: number, repeat: [number, number]) {
  const rand = seededRandom(seed);
  return canvasTexture(
    256,
    256,
    (ctx, w, h) => {
      ctx.fillStyle = base;
      ctx.fillRect(0, 0, w, h);
      for (let i = 0; i < 6000; i++) {
        ctx.fillStyle = rand() > 0.5 ? light : dark;
        ctx.globalAlpha = 0.25 + rand() * 0.35;
        const x = rand() * w;
        const y = rand() * h;
        ctx.fillRect(x, y, 1 + rand() * 1.5, 2 + rand() * 4); // short strands
      }
      ctx.globalAlpha = 1;
    },
    repeat
  );
}

// Positions for the six surfaces of a box room (floor at y = 0), all facing inward
export function roomSurfaces(w: number, d: number, h: number) {
  type V = [number, number, number];
  return {
    floor: { position: [0, 0, 0] as V, rotation: [-Math.PI / 2, 0, 0] as V, size: [w, d] as [number, number] },
    ceiling: { position: [0, h, 0] as V, rotation: [Math.PI / 2, 0, 0] as V, size: [w, d] as [number, number] },
    back: { position: [0, h / 2, -d / 2] as V, rotation: [0, 0, 0] as V, size: [w, h] as [number, number] },
    front: { position: [0, h / 2, d / 2] as V, rotation: [0, Math.PI, 0] as V, size: [w, h] as [number, number] },
    left: { position: [-w / 2, h / 2, 0] as V, rotation: [0, Math.PI / 2, 0] as V, size: [d, h] as [number, number] },
    right: { position: [w / 2, h / 2, 0] as V, rotation: [0, -Math.PI / 2, 0] as V, size: [d, h] as [number, number] },
  };
}

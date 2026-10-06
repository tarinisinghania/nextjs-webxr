'use client';

// A room whose walls, floor and ceiling are covered in a pattern,
// furnished with the lounge seating from the Cloud lounge.
// The pattern, colors and light all come from the active "location".

import { useEffect, useMemo } from 'react';
import * as THREE from 'three';
import { CurvedSofa, Ottoman } from './LoungeSeating';
import type { PatternStyle, Pattern } from './locations';

// Room size in meters
const W = 12; // width
const D = 12; // depth
const H = 5;  // height

/* ---------- PATTERN TEXTURES ---------- */

// Draws ONE tile of a pattern. The tile repeats across each surface,
// so every pattern is drawn to line up seamlessly with its neighbors.
function drawTile(ctx: CanvasRenderingContext2D, pattern: Pattern, bg: string, line: string, s: number) {
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, s, s);
  ctx.fillStyle = line;
  ctx.strokeStyle = line;

  switch (pattern) {
    case 'grid':
      ctx.fillRect(0, 0, s, 14);
      ctx.fillRect(0, 0, 14, s);
      break;

    case 'fineGrid':
      ctx.fillRect(0, 0, s, 6);
      ctx.fillRect(0, 0, 6, s);
      ctx.fillRect(0, s / 2 - 1.5, s, 3);
      ctx.fillRect(s / 2 - 1.5, 0, 3, s);
      break;

    case 'dots':
      ctx.beginPath();
      ctx.arc(s / 2, s / 2, s * 0.13, 0, Math.PI * 2);
      ctx.fill();
      break;

    case 'stripes':
      ctx.fillRect(0, 0, s * 0.18, s);
      break;

    case 'waves':
      ctx.lineWidth = 12;
      ctx.beginPath();
      for (let x = 0; x <= s; x += 2) {
        const y = s / 2 + Math.sin((x / s) * Math.PI * 2) * s * 0.18;
        if (x === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();
      break;

    case 'diamond':
      ctx.lineWidth = 10;
      ctx.beginPath();
      ctx.moveTo(s / 2, 0);
      ctx.lineTo(s, s / 2);
      ctx.lineTo(s / 2, s);
      ctx.lineTo(0, s / 2);
      ctx.closePath();
      ctx.stroke();
      break;

    case 'brick': {
      // "line" is the mortar color, "bg" is the brick color
      ctx.fillStyle = line;
      ctx.fillRect(0, 0, s, s);
      ctx.fillStyle = bg;
      const g = 5; // half the mortar gap
      ctx.fillRect(g, g, s - g * 2, s / 2 - g * 2);
      ctx.fillRect(-s / 2 + g, s / 2 + g, s - g * 2, s / 2 - g * 2);
      ctx.fillRect(s / 2 + g, s / 2 + g, s - g * 2, s / 2 - g * 2);
      break;
    }
  }
}

// Creates a repeating texture sized for a surface of (width x height) meters
function makePatternTexture(pattern: Pattern, bg: string, line: string, width: number, height: number, cell: number) {
  const size = 256;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  drawTile(canvas.getContext('2d')!, pattern, bg, line, size);

  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(width / cell, height / cell);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8; // keeps lines crisp at sharp viewing angles
  return tex;
}

/* ---------- ROOM SHELL ---------- */

function Surface({
  map,
  size,
  position,
  rotation,
}: {
  map: THREE.Texture;
  size: [number, number];
  position: [number, number, number];
  rotation: [number, number, number];
}) {
  return (
    <mesh position={position} rotation={rotation} receiveShadow>
      <planeGeometry args={size} />
      <meshStandardMaterial map={map} roughness={0.9} />
    </mesh>
  );
}

function Shell({ location }: { location: PatternStyle }) {
  // Rebuild the textures whenever the location changes
  const tex = useMemo(() => {
    const { wallPattern, floorPattern, wall, floor, line, cell } = location;
    return {
      floor: makePatternTexture(floorPattern, floor, line, W, D, cell),
      ceiling: makePatternTexture(wallPattern, wall, line, W, D, cell),
      wideWall: makePatternTexture(wallPattern, wall, line, W, H, cell),
      deepWall: makePatternTexture(wallPattern, wall, line, D, H, cell),
    };
  }, [location]);

  // Free the old textures from GPU memory when switching locations
  useEffect(() => () => Object.values(tex).forEach((t) => t.dispose()), [tex]);

  return (
    <group>
      <Surface map={tex.floor} size={[W, D]} position={[0, 0, 0]} rotation={[-Math.PI / 2, 0, 0]} />
      <Surface map={tex.ceiling} size={[W, D]} position={[0, H, 0]} rotation={[Math.PI / 2, 0, 0]} />
      <Surface map={tex.wideWall} size={[W, H]} position={[0, H / 2, -D / 2]} rotation={[0, 0, 0]} />
      <Surface map={tex.wideWall} size={[W, H]} position={[0, H / 2, D / 2]} rotation={[0, Math.PI, 0]} />
      <Surface map={tex.deepWall} size={[D, H]} position={[-W / 2, H / 2, 0]} rotation={[0, Math.PI / 2, 0]} />
      <Surface map={tex.deepWall} size={[D, H]} position={[W / 2, H / 2, 0]} rotation={[0, -Math.PI / 2, 0]} />
    </group>
  );
}

/* ---------- FULL SCENE ---------- */

export function PatternRoom({ style }: { style: PatternStyle }) {
  const color = style.furniture;

  return (
    <group>
      {/* Soft fill light so the pastel colors stay bright */}
      <ambientLight intensity={style.ambient} />

      {/* "Sun" coming in from the upper right, casting the diagonal shadows */}
      <directionalLight
        position={[6, 7, 3]}
        intensity={1.6}
        color={style.sun}
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-camera-left={-8}
        shadow-camera-right={8}
        shadow-camera-top={8}
        shadow-camera-bottom={-8}
        shadow-bias={-0.0005}
      />

      <Shell location={style} />

      {/* Lounge seating from the Cloud lounge, tinted to match this room */}
      <CurvedSofa position={[0, 0, -2.4]} r={1.8} arc={Math.PI * 0.75} color={color} />
      <Ottoman position={[0, 0, -0.6]} r={0.55} color={color} />
      <CurvedSofa position={[-3, 0, 0.8]} rotationY={1.83} r={1.1} color={color} />
      <Ottoman position={[2.6, 0, 0.6]} r={0.7} color={color} />
    </group>
  );
}

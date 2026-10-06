'use client';

// SKY CEILING
// The projected moving sky and the ceiling track lights from the Sky hill,
// shared so other rooms can use the same ceiling.

import { useEffect, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { canvasTexture, seededRandom } from './sceneUtils';

/* ---------- SKY PROJECTION ---------- */

export function useSkyTexture() {
  const tex = useMemo(() => {
    const rand = seededRandom(42);
    return canvasTexture(1024, 512, (ctx, w, h) => {
      // Blue sky gradient
      const g = ctx.createLinearGradient(0, 0, 0, h);
      g.addColorStop(0, '#1f63d8');
      g.addColorStop(1, '#5aa6f2');
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, w, h);

      // Clouds: clusters of soft white puffs (drawn twice so the texture wraps sideways)
      for (let c = 0; c < 45; c++) {
        const cx = rand() * w;
        const cy = rand() * h;
        const spread = 30 + rand() * 90;
        const puffs = 10 + Math.floor(rand() * 20);
        for (let p = 0; p < puffs; p++) {
          const x = cx + (rand() - 0.5) * spread * 2;
          const y = cy + (rand() - 0.5) * spread * 0.7;
          const r = 12 + rand() * 40;
          for (const offset of [-w, 0, w]) {
            const grad = ctx.createRadialGradient(x + offset, y, 0, x + offset, y, r);
            grad.addColorStop(0, 'rgba(255,255,255,0.85)');
            grad.addColorStop(0.6, 'rgba(240,246,255,0.45)');
            grad.addColorStop(1, 'rgba(255,255,255,0)');
            ctx.fillStyle = grad;
            ctx.beginPath();
            ctx.arc(x + offset, y, r, 0, Math.PI * 2);
            ctx.fill();
          }
        }
      }
    });
  }, []);

  // Slowly drift the clouds, like a moving projection
  useFrame((_, delta) => {
    tex.offset.x += delta * 0.004;
  });

  useEffect(() => () => tex.dispose(), [tex]);
  return tex;
}

/* ---------- TRACK LIGHTS ---------- */

export function TrackLights({ width, depth, height }: { width: number; depth: number; height: number }) {
  const fixtures: React.ReactElement[] = [];
  const rowX = width * 0.2;
  for (const x of [-rowX, rowX]) {
    fixtures.push(
      <mesh key={`rail${x}`} position={[x, height - 0.03, 0]}>
        <boxGeometry args={[0.05, 0.04, depth - 2]} />
        <meshStandardMaterial color="#111" />
      </mesh>
    );
    for (let z = -depth / 2 + 2; z <= depth / 2 - 2; z += 2) {
      fixtures.push(
        <mesh key={`${x}${z}`} position={[x, height - 0.15, z]} rotation={[0.4, 0, 0]}>
          <cylinderGeometry args={[0.07, 0.07, 0.22, 16]} />
          <meshStandardMaterial color="#111" emissive="#fff6dd" emissiveIntensity={0.2} />
        </mesh>
      );
    }
  }
  return <group>{fixtures}</group>;
}

/* A ceiling covered in the moving sky, with track lights */
export function SkyCeiling({ width, depth, height }: { width: number; depth: number; height: number }) {
  const sky = useSkyTexture();
  return (
    <group>
      <mesh position={[0, height, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <planeGeometry args={[width, depth]} />
        <meshBasicMaterial map={sky} toneMapped={false} />
      </mesh>
      <TrackLights width={width} depth={depth} height={height} />
    </group>
  );
}

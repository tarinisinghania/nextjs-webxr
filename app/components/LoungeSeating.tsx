'use client';

// LOUNGE SEATING
// The soft, ribbed cream sofas and round ottomans from the Cloud lounge.
// Used in every room. Pass a "color" to tint them.

import * as THREE from 'three';
import { canvasTexture } from './sceneUtils';

const CREAM = '#f4ede2';

/* Ribbed upholstery texture, created once and shared by every seat */
let ribTexture: THREE.CanvasTexture | null = null;
function getRibTexture() {
  if (!ribTexture) {
    ribTexture = canvasTexture(
      128,
      128,
      (ctx, w, h) => {
        const g = ctx.createLinearGradient(0, 0, w, 0);
        g.addColorStop(0, '#d9d0c3');
        g.addColorStop(0.5, '#ffffff');
        g.addColorStop(1, '#d9d0c3');
        ctx.fillStyle = g;
        ctx.fillRect(0, 0, w, h);
      },
      [24, 1]
    );
  }
  return ribTexture;
}

/* Round tufted ottoman */
export function Ottoman({
  position,
  r = 0.9,
  color = CREAM,
}: {
  position: [number, number, number];
  r?: number;
  color?: string;
}) {
  const rib = getRibTexture();
  return (
    <group position={position}>
      <mesh position={[0, 0.2, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[r, r * 0.95, 0.4, 48]} />
        <meshStandardMaterial color={color} map={rib} roughness={1} />
      </mesh>
      <mesh position={[0, 0.4, 0]} rotation={[Math.PI / 2, 0, 0]} castShadow>
        <torusGeometry args={[r - 0.1, 0.1, 16, 48]} />
        <meshStandardMaterial color={color} roughness={1} />
      </mesh>
    </group>
  );
}

/* Curved booth sofa: a curved ribbed backrest wrapped around a curved seat */
export function CurvedSofa({
  position,
  rotationY = 0,
  r = 1.6,
  arc = Math.PI * 0.8,
  color = CREAM,
}: {
  position: [number, number, number];
  rotationY?: number;
  r?: number;
  arc?: number;
  color?: string;
}) {
  const rib = getRibTexture();
  const start = Math.PI - arc / 2; // centers the opening toward +Z
  return (
    <group position={position} rotation={[0, rotationY, 0]}>
      {/* Seat */}
      <mesh position={[0, 0.22, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[r, r, 0.44, 64, 1, false, start, arc]} />
        <meshStandardMaterial color={color} roughness={1} />
      </mesh>
      {/* Backrest */}
      <mesh position={[0, 0.7, 0]} castShadow>
        <cylinderGeometry args={[r + 0.05, r + 0.05, 0.6, 64, 1, true, start, arc]} />
        <meshStandardMaterial color={color} map={rib} roughness={1} side={THREE.DoubleSide} />
      </mesh>
      {/* Rounded top edge */}
      <mesh position={[0, 1.0, 0]} rotation={[Math.PI / 2, 0, -start - arc + Math.PI / 2]}>
        <torusGeometry args={[r + 0.05, 0.09, 12, 64, arc]} />
        <meshStandardMaterial color={color} roughness={1} />
      </mesh>
    </group>
  );
}


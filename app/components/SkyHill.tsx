'use client';

// SKY HILL
// A tall gallery with a moving sky projected on the walls and ceiling,
// and a grass-covered hill with a winding staircase cut into it.

import { useEffect, useMemo } from 'react';
import * as THREE from 'three';
import { fuzzTexture, roomSurfaces } from './sceneUtils';
import { useSkyTexture, TrackLights } from './SkyCeiling';
import { CurvedSofa, Ottoman } from './LoungeSeating';

const W = 10;
const D = 18;
const H = 8;

/* ---------- HILL SHAPE ---------- */
// The hill is a flat sheet pushed up by a height formula.

const HILL_W = 7;
const HILL_D = 14;

// The staircase winds left and right as it climbs
const pathX = (z: number) => 0.8 * Math.sin(z * 0.45);
const pathSlope = (z: number) => 0.8 * 0.45 * Math.cos(z * 0.45);

const smoothstep = (a: number, b: number, x: number) => {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
};

function hillHeight(x: number, z: number) {
  // Rises from the front (z = 7) to a crest near the back
  const rise = 3.6 * smoothstep(7, -5, z) * smoothstep(-7, -5.6, z);
  // Rounded cross-section
  const width = 1.9 + 0.5 * smoothstep(7, -5, z);
  const profile = Math.exp(-(x * x) / (2 * width * width));
  const edgeFade = Math.max(0, 1 - Math.pow(Math.abs(x) / (HILL_W / 2), 6));
  const full = rise * profile * edgeFade;

  // Trench where the stairs are cut in
  const dx = x - pathX(z);
  const trench = 0.35 * Math.exp(-(dx * dx) / (2 * 0.28 * 0.28)) * Math.min(1, full / 0.5);
  return Math.max(0, full - trench);
}

function Hill() {
  const geometry = useMemo(() => {
    const geo = new THREE.PlaneGeometry(HILL_W, HILL_D, 140, 280);
    geo.rotateX(-Math.PI / 2);
    const pos = geo.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      pos.setY(i, hillHeight(pos.getX(i), pos.getZ(i)));
    }
    geo.computeVertexNormals();
    return geo;
  }, []);

  const grass = useMemo(() => fuzzTexture('#3f9a2b', '#6cc742', '#2a6e1c', 7, [10, 20]), []);

  useEffect(
    () => () => {
      geometry.dispose();
      grass.dispose();
    },
    [geometry, grass]
  );

  return (
    <mesh geometry={geometry} receiveShadow castShadow>
      <meshStandardMaterial map={grass} color="#7fd65a" roughness={1} />
    </mesh>
  );
}

/* ---------- STAIRS ---------- */

function Stairs() {
  const steps = useMemo(() => {
    const list: { x: number; y: number; z: number; rot: number }[] = [];
    for (let z = 6.9; z > -5.6; z -= 0.22) {
      const x = pathX(z);
      const y = Math.round(hillHeight(x, z) / 0.07) * 0.07; // flat treads
      if (y <= 0) continue;
      list.push({ x, y, z, rot: Math.atan2(pathSlope(z), 1) });
    }
    return list;
  }, []);

  return (
    <group>
      {steps.map((s, i) => (
        <mesh key={i} position={[s.x, s.y / 2, s.z]} rotation={[0, s.rot, 0]} receiveShadow>
          <boxGeometry args={[0.75, s.y, 0.24]} />
          <meshStandardMaterial color="#5b5e64" roughness={0.8} />
        </mesh>
      ))}
    </group>
  );
}

/* ---------- FULL SCENE ---------- */

export function SkyHill() {
  const s = roomSurfaces(W, D, H);
  const sky = useSkyTexture();

  return (
    <group>
      <color attach="background" args={['#0d1018']} />

      <hemisphereLight args={['#bcd8ff', '#14210f', 1.1]} />
      <directionalLight position={[3, 10, 6]} intensity={1.2} color="#fff7e6" castShadow />
      <pointLight position={[0, 6, -4]} intensity={20} distance={14} color="#dfeaff" />

      {/* Dark, slightly glossy floor */}
      <mesh {...s.floor} receiveShadow>
        <planeGeometry args={s.floor.size} />
        <meshStandardMaterial color="#14171d" roughness={0.3} metalness={0.3} />
      </mesh>

      {/* Projected sky: walls and ceiling glow on their own (basic material ignores lights) */}
      {[s.ceiling, s.back, s.front, s.left, s.right].map((w, i) => (
        <mesh key={i} position={w.position} rotation={w.rotation}>
          <planeGeometry args={w.size} />
          <meshBasicMaterial map={sky} toneMapped={false} />
        </mesh>
      ))}

      {/* Doorways in the side walls */}
      {[
        { x: -W / 2 + 0.01, ry: Math.PI / 2, z: -5 },
        { x: W / 2 - 0.01, ry: -Math.PI / 2, z: -4 },
      ].map((d, i) => (
        <mesh key={i} position={[d.x, 1.2, d.z]} rotation={[0, d.ry, 0]}>
          <planeGeometry args={[1.3, 2.4]} />
          <meshBasicMaterial color="#0c0e12" />
        </mesh>
      ))}

      <Hill />
      <Stairs />
      <TrackLights width={W} depth={D} height={H} />

      {/* Lounge seating along the sides of the hill, facing it */}
      <CurvedSofa position={[-4.1, 0, 2.5]} rotationY={Math.PI / 2} r={0.85} />
      <CurvedSofa position={[4.1, 0, -1.5]} rotationY={-Math.PI / 2} r={0.85} />
      <Ottoman position={[-4.2, 0, -2.5]} r={0.6} />
      <Ottoman position={[4.2, 0, 3.5]} r={0.6} />
    </group>
  );
}

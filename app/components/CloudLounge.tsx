'use client';

// CLOUD LOUNGE
// A dark warehouse with lighting truss overhead, filled with clouds that glow
// warm from inside, and soft cream sofas sitting in the haze.

import { useEffect, useMemo } from 'react';
import * as THREE from 'three';
import { Clouds, Cloud } from '@react-three/drei';
import { canvasTexture, roomSurfaces } from './sceneUtils';
import { CurvedSofa, Ottoman } from './LoungeSeating';

const W = 16;
const D = 16;
const H = 7;

const GLOW = '#ffb45e';

/* Backlit white curtain for the far wall */
function useCurtainTexture() {
  const tex = useMemo(
    () =>
      canvasTexture(
        256,
        64,
        (ctx, w, h) => {
          ctx.fillStyle = '#f2f2f4';
          ctx.fillRect(0, 0, w, h);
          for (let x = 0; x < w; x += 4) {
            ctx.fillStyle = x % 8 === 0 ? '#dcdde3' : '#ffffff';
            ctx.fillRect(x, 0, 2, h);
          }
        },
        [8, 1]
      ),
    []
  );
  useEffect(() => () => tex.dispose(), [tex]);
  return tex;
}

/* Lighting truss hanging under the dark ceiling */
function Truss() {
  const beams: React.ReactElement[] = [];
  const mat = <meshStandardMaterial color="#8a8d93" metalness={0.7} roughness={0.4} />;
  for (let x = -6; x <= 6; x += 3) {
    for (const y of [H - 0.4, H - 0.75]) {
      beams.push(
        <mesh key={`x${x}${y}`} position={[x, y, 0]}>
          <boxGeometry args={[0.06, 0.06, D]} />
          {mat}
        </mesh>
      );
    }
  }
  for (let z = -6; z <= 6; z += 4) {
    beams.push(
      <mesh key={`z${z}`} position={[0, H - 0.4, z]}>
        <boxGeometry args={[W, 0.06, 0.06]} />
        {mat}
      </mesh>
    );
  }
  return <group>{beams}</group>;
}

export function CloudLounge() {
  const s = roomSurfaces(W, D, H);
  const curtain = useCurtainTexture();

  return (
    <group>
      <color attach="background" args={['#1b1c20']} />
      {/* Warm haze that fades distant things into the clouds */}
      <fog attach="fog" args={['#e8dccb', 7, 24]} />

      <hemisphereLight args={['#fff2e0', '#3a3026', 0.9]} />
      <ambientLight intensity={0.35} />
      <directionalLight position={[2, 6, 4]} intensity={0.6} color="#fff1dc" castShadow />

      {/* Warm lights hidden inside the low clouds */}
      {[
        [-4, 0.5, 1],
        [3.5, 0.5, 0.5],
        [0, 0.4, 3.5],
        [-2.5, 0.6, -3],
        [4.5, 0.8, -3],
        [-5, 1.5, -1],
      ].map((p, i) => (
        <pointLight key={i} position={p as [number, number, number]} color={GLOW} intensity={10} distance={6} decay={2} />
      ))}

      {/* Room */}
      <mesh {...s.floor} receiveShadow>
        <planeGeometry args={s.floor.size} />
        <meshStandardMaterial color="#cdc5ba" roughness={1} />
      </mesh>
      <mesh {...s.ceiling}>
        <planeGeometry args={s.ceiling.size} />
        <meshStandardMaterial color="#25272c" roughness={1} />
      </mesh>
      <mesh {...s.back}>
        <planeGeometry args={s.back.size} />
        <meshStandardMaterial map={curtain} emissive="#ffffff" emissiveMap={curtain} emissiveIntensity={0.7} />
      </mesh>
      {[s.front, s.left, s.right].map((w, i) => (
        <mesh key={i} position={w.position} rotation={w.rotation}>
          <planeGeometry args={w.size} />
          <meshStandardMaterial color="#d8d2c8" roughness={1} />
        </mesh>
      ))}
      <Truss />

      {/* Clouds: big ones overhead, banks on the sides, low ones on the floor */}
      <Clouds material={THREE.MeshLambertMaterial} limit={400}>
        {/* Overhead */}
        <Cloud seed={1} position={[-3, 5, -1]} bounds={[4, 1, 2]} segments={40} volume={6} color="#fffaf2" />
        <Cloud seed={2} position={[3, 5.3, -2]} bounds={[4, 1, 2]} segments={40} volume={6} color="#fff6ea" />
        <Cloud seed={3} position={[0, 4.6, 2]} bounds={[3, 0.8, 1.5]} segments={25} volume={4} color="#ffffff" />
        {/* Side banks */}
        <Cloud seed={4} position={[-6, 2.2, -2]} bounds={[1.5, 2, 3]} segments={30} volume={5} color="#ffe9cf" />
        <Cloud seed={5} position={[6, 2.4, -1]} bounds={[1.5, 2, 3]} segments={30} volume={5} color="#ffe9cf" />
        {/* Distant, around the curtain */}
        <Cloud seed={6} position={[0, 2.5, -6.5]} bounds={[5, 1.5, 0.8]} segments={30} volume={5} color="#ffffff" />
        {/* Low clouds drifting around the sofas */}
        <Cloud seed={7} position={[-3.5, 0.4, 1]} bounds={[2, 0.3, 1.5]} segments={20} volume={2} color="#ffe2bf" />
        <Cloud seed={8} position={[3.5, 0.4, 1]} bounds={[2, 0.3, 1.5]} segments={20} volume={2} color="#ffe2bf" />
        <Cloud seed={9} position={[0, 0.3, 3.2]} bounds={[2.5, 0.25, 1]} segments={18} volume={2} color="#ffe6c8" />
        <Cloud seed={10} position={[0, 0.4, -3.5]} bounds={[4, 0.3, 1]} segments={20} volume={2} color="#ffe6c8" />
      </Clouds>

      {/* Seating */}
      <CurvedSofa position={[0, 0, -2]} r={2.2} arc={Math.PI * 0.75} />
      <CurvedSofa position={[3.6, 0, -0.5]} rotationY={-0.9} r={1.3} />
      <CurvedSofa position={[-3.8, 0, 1.5]} rotationY={0.8} r={1.3} />
      <Ottoman position={[-1.5, 0, 0.5]} r={0.7} />
      <Ottoman position={[1.8, 0, 2]} r={0.8} />
      <Ottoman position={[-4.5, 0, -2.5]} r={0.9} />
    </group>
  );
}

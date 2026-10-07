'use client';

// FLOWER ROOM
// A pink room under a projected moving sky, a green carpet meadow,
// a meadow of flowers loaded from GLB models, stepping stones, and scalloped mirrors.

import { Suspense, useEffect, useLayoutEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { MeshReflectorMaterial, useGLTF } from '@react-three/drei';
import { fuzzTexture, roomSurfaces, seededRandom } from './sceneUtils';
import { SkyCeiling } from './SkyCeiling';
import { CurvedSofa, Ottoman } from './LoungeSeating';

const W = 7;
const D = 10;
const H = 4;

const PINK = '#f2a19c';
const PINK_DARK = '#e57f7a';


/* ---------- STEPPING STONE PATH ---------- */
// The path winds from the front of the room to the center mirror.
const pathX = (z: number) => 0.6 * Math.sin(z * 0.7);
const STONE_Z = [4.0, 3.1, 2.2, 1.3, 0.4, -0.5, -1.4, -2.3, -3.2, -4.0];

function Stones() {
  return (
    <group>
      {STONE_Z.map((z, i) => (
        <mesh key={i} position={[pathX(z), 0.025, z]} scale={[1.2, 1, 0.9]} receiveShadow>
          <cylinderGeometry args={[0.38, 0.4, 0.05, 40]} />
          <meshStandardMaterial color="#d9b78f" roughness={1} />
        </mesh>
      ))}
    </group>
  );
}

/* ---------- FLOWERS (your downloaded GLB models) ---------- */
// Put your three .glb files in the project's  public/models/  folder
// and make sure the names below match your file names exactly.

const FLOWER_MODELS = ['/models/flower2.glb', '/models/flower3.glb', '/models/flower4.glb', '/models/flower5.glb'];

const FLOWER_COUNT = 120;          // how many flowers in total
const MIN_HEIGHT = 0.5;            // shortest flower, in meters
const MAX_HEIGHT = 1.4;            // tallest flower, in meters

/*
  Loads a GLB and prepares it for instancing:
  - finds every mesh inside the model
  - scales the whole model to exactly 1 m tall
  - sits its base on the ground and centers it
  Each mesh becomes one "part" that can be drawn hundreds of times in one go.
*/
function usePreparedFlower(url: string) {
  const { scene } = useGLTF(url);

  const parts = useMemo(() => {
    scene.updateMatrixWorld(true);
    const box = new THREE.Box3().setFromObject(scene);
    const size = box.getSize(new THREE.Vector3());
    const center = box.getCenter(new THREE.Vector3());
    const scale = 1 / (size.y || 1);

    // Moves the model so its base is at y = 0 and it is 1 m tall
    const normalize = new THREE.Matrix4()
      .makeScale(scale, scale, scale)
      .multiply(new THREE.Matrix4().makeTranslation(-center.x, -box.min.y, -center.z));

    const list: { geometry: THREE.BufferGeometry; material: THREE.Material | THREE.Material[] }[] = [];
    scene.traverse((obj) => {
      const mesh = obj as THREE.Mesh;
      if (!mesh.isMesh) return;
      const geometry = mesh.geometry.clone();
      geometry.applyMatrix4(new THREE.Matrix4().multiplyMatrices(normalize, mesh.matrixWorld));
      list.push({ geometry, material: mesh.material });
    });
    return list;
  }, [scene]);

  useEffect(() => () => parts.forEach((p) => p.geometry.dispose()), [parts]);
  return parts;
}

/* Decides where every flower goes, and which of the three models it uses */
function buildPlacements() {
  const rand = seededRandom(11);
  const byModel: THREE.Matrix4[][] = FLOWER_MODELS.map(() => []);
  const dummy = new THREE.Object3D();

  let placed = 0;
  let tries = 0;
  while (placed < FLOWER_COUNT && tries < 5000) {
    tries++;
    const x = (rand() - 0.5) * (W - 0.4);
    const z = (rand() - 0.5) * (D - 1.2) + 0.2;
    if (Math.abs(x - pathX(z)) < 0.6 && z < 4.6) continue;                   // keep the path clear
    if (z < -4.3) continue;                                                 // keep the mirrors clear
    if (CLEARINGS.some((c) => Math.hypot(x - c.x, z - c.z) < c.r)) continue; // keep seats clear
    placed++;

    // Taller flowers toward the front of the room, like the reference photo
    const frontBoost = z > 2.5 ? 0.25 : 0;
    const height = MIN_HEIGHT + rand() * (MAX_HEIGHT - MIN_HEIGHT) + frontBoost;

    dummy.position.set(x, 0, z);
    dummy.rotation.set((rand() - 0.5) * 0.2, rand() * Math.PI * 2, (rand() - 0.5) * 0.2); // slight lean, random turn
    dummy.scale.setScalar(height);
    dummy.updateMatrix();

    byModel[Math.floor(rand() * FLOWER_MODELS.length)].push(dummy.matrix.clone());
  }
  return byModel;
}

/* Draws one mesh of a model at many positions */
function InstancedPart({
  geometry,
  material,
  matrices,
}: {
  geometry: THREE.BufferGeometry;
  material: THREE.Material | THREE.Material[];
  matrices: THREE.Matrix4[];
}) {
  const ref = useRef<THREE.InstancedMesh>(null);

  useLayoutEffect(() => {
    const mesh = ref.current;
    if (!mesh) return;
    matrices.forEach((m, i) => mesh.setMatrixAt(i, m));
    mesh.instanceMatrix.needsUpdate = true;
    mesh.computeBoundingSphere();
  }, [matrices]);

  if (matrices.length === 0) return null;
  return <instancedMesh ref={ref} args={[geometry, material, matrices.length]} />;
}

/* All copies of one flower model */
function FlowerModel({ url, matrices }: { url: string; matrices: THREE.Matrix4[] }) {
  const parts = usePreparedFlower(url);
  return (
    <group>
      {parts.map((p, i) => (
        <InstancedPart key={i} geometry={p.geometry} material={p.material} matrices={matrices} />
      ))}
    </group>
  );
}

function Flowers() {
  const placements = useMemo(buildPlacements, []);
  return (
    // Suspense shows nothing until the models finish loading, instead of crashing
    <Suspense fallback={null}>
      {FLOWER_MODELS.map((url, i) => (
        <FlowerModel key={url} url={url} matrices={placements[i]} />
      ))}
    </Suspense>
  );
}

// Start downloading the models as soon as the page loads
FLOWER_MODELS.forEach((url) => useGLTF.preload(url));

/* ---------- SEATING ---------- */
// A small clearing near the front of the room with a curved sofa and ottomans.
// Flowers are kept out of these circles.
const SEATS = {
  sofa: { position: [-2.2, 0, 2.9] as [number, number, number], rotationY: 2.49, r: 1.0 },
  ottomans: [
    { position: [2.3, 0, 3.4] as [number, number, number], r: 0.55 },
    { position: [2.4, 0, -1.2] as [number, number, number], r: 0.5 },
  ],
};
const CLEARINGS: { x: number; z: number; r: number }[] = [
  { x: SEATS.sofa.position[0], z: SEATS.sofa.position[2], r: SEATS.sofa.r + 0.35 },
  ...SEATS.ottomans.map((o) => ({ x: o.position[0], z: o.position[2], r: o.r + 0.25 })),
];

// Where the ceiling lights hang
const LIGHT_SPOTS: [number, number][] = [
  [-1.6, -2.3],
  [1.6, -2.3],
  [-1.6, 2.3],
  [1.6, 2.3],
];

/* ---------- SCALLOPED MIRRORS ---------- */

// A tall rounded shape with a wavy, scalloped edge
function scallopShape(a: number, b: number, bumps: number, bumpSize: number) {
  const shape = new THREE.Shape();
  const steps = 400;
  for (let i = 0; i <= steps; i++) {
    const t = (i / steps) * Math.PI * 2;
    const c = Math.cos(t);
    const s = Math.sin(t);
    // Rounded rectangle (superellipse)
    const x = a * Math.sign(c) * Math.pow(Math.abs(c), 0.5);
    const y = b * Math.sign(s) * Math.pow(Math.abs(s), 0.5);
    // Push outward in waves to make scallops
    const k = 1 + (bumpSize * Math.abs(Math.sin(t * bumps))) / Math.max(a, b);
    if (i === 0) shape.moveTo(x * k, y * k);
    else shape.lineTo(x * k, y * k);
  }
  return shape;
}

function Mirror({
  position,
  scale = 1,
  rotationY = 0,
}: {
  position: [number, number, number];
  scale?: number;
  rotationY?: number;
}) {
  const { frame, glass } = useMemo(() => {
    const outer = scallopShape(0.75, 1.3, 9, 0.12);
    const inner = scallopShape(0.62, 1.15, 9, 0.08);
    return {
      frame: new THREE.ExtrudeGeometry(outer, { depth: 0.06, bevelEnabled: false }),
      glass: new THREE.ShapeGeometry(inner, 64),
    };
  }, []);

  useEffect(
    () => () => {
      frame.dispose();
      glass.dispose();
    },
    [frame, glass]
  );

  return (
    <group position={position} rotation={[0, rotationY, 0]} scale={scale}>
      <mesh geometry={frame}>
        <meshStandardMaterial color={PINK_DARK} roughness={0.7} />
      </mesh>
      <mesh geometry={glass} position={[0, 0, 0.065]}>
        <MeshReflectorMaterial mirror={1} resolution={512} mixStrength={1} color="#ffffff" />
      </mesh>
    </group>
  );
}

/* ---------- FULL SCENE ---------- */

export function FlowerRoom() {
  const s = roomSurfaces(W, D, H);
  const carpet = useMemo(() => fuzzTexture('#2f9c4f', '#59c76f', '#1f7a3a', 3, [6, 8]), []);
  useEffect(() => () => carpet.dispose(), [carpet]);

  return (
    <group>
      <color attach="background" args={[PINK]} />

      <ambientLight intensity={1.0} />
      <hemisphereLight args={['#ffffff', '#2f9c4f', 0.5]} />
      {LIGHT_SPOTS.map(([x, z], i) => (
        <pointLight key={i} position={[x, H - 0.4, z]} intensity={4} distance={6} color="#f2f7ff" />
      ))}

      {/* Fuzzy green carpet */}
      <mesh {...s.floor}>
        <planeGeometry args={s.floor.size} />
        <meshStandardMaterial map={carpet} roughness={1} />
      </mesh>

      {/* Pink walls */}
      {[s.back, s.front, s.left, s.right].map((w, i) => (
        <mesh key={i} position={w.position} rotation={w.rotation}>
          <planeGeometry args={w.size} />
          <meshStandardMaterial color={PINK} roughness={1} />
        </mesh>
      ))}

      {/* Projected moving sky ceiling with track lights, same as the Sky hill */}
      <SkyCeiling width={W} depth={D} height={H} />

      {/* Mirrors on the back wall, the center one at the end of the path */}
      <Mirror position={[0, 1.55, -D / 2 + 0.01]} scale={1.05} />
      <Mirror position={[-2.4, 1.4, -D / 2 + 0.01]} scale={0.8} />
      <Mirror position={[2.4, 1.4, -D / 2 + 0.01]} scale={0.8} />

      <Stones />
      <Flowers />

      {/* Lounge seating in the clearings */}
      <CurvedSofa position={SEATS.sofa.position} rotationY={SEATS.sofa.rotationY} r={SEATS.sofa.r} />
      {SEATS.ottomans.map((o, i) => (
        <Ottoman key={i} position={o.position} r={o.r} />
      ))}
    </group>
  );
}

'use client';

// FLOWER ROOM
// A pink room under a projected moving sky, a green carpet meadow,
// hundreds of oversized realistic flowers, stepping stones, and scalloped mirrors.

import { useEffect, useLayoutEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { MeshReflectorMaterial } from '@react-three/drei';
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

/* ---------- FLOWERS ---------- */
// Four kinds of flowers (daisies, lilies, tulips and peonies), built from curved,
// tapered petals with a soft color gradient, plus leaves and stamens.
// Everything is "instanced": each part type is drawn in one go, so hundreds of
// flowers stay fast enough for VR.

/*
  Builds one petal (or leaf) shape: a thin sheet that tapers to a point,
  cups sideways and bends along its length. It points along +Z from the origin.
  Vertex colors darken the base slightly so each petal has a natural gradient.
*/
function petalGeometry({
  width,     // half-width relative to length
  peak,      // where the petal is widest (lower = near base, higher = near tip)
  cup,       // how much the sides curl up
  curl,      // how much the petal bends up (+) or back (-) along its length
  baseShade, // brightness at the base (tip is 1)
}: {
  width: number;
  peak: number;
  cup: number;
  curl: number;
  baseShade: number;
}) {
  const geo = new THREE.PlaneGeometry(1, 1, 4, 10);
  geo.translate(0, 0.5, 0);
  const pos = geo.attributes.position;
  const colors: number[] = [];

  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i); // -0.5 to 0.5 across
    const t = pos.getY(i); // 0 (base) to 1 (tip)
    const shape = Math.max(Math.sin(Math.PI * Math.pow(t, peak)), 0.12 * (1 - t));
    const w = width * shape;
    const nx = x * 2 * w;
    const z = cup * (x * 2) ** 2 * w + curl * t * t;
    pos.setXYZ(i, nx, t, z);

    // Darker at the base, with a faint lighter vein down the middle
    const shade = baseShade + (1 - baseShade) * t;
    const vein = 1 + 0.06 * (1 - Math.abs(x) * 2);
    colors.push(shade * vein, shade * vein, shade * vein);
  }

  geo.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
  geo.rotateX(-Math.PI / 2); // lay it flat, cup facing up
  geo.rotateY(Math.PI);      // point the tip along +Z
  geo.computeVertexNormals();
  return geo;
}

type Item = { m: THREE.Matrix4; c: THREE.Color };
type FlowerParts = {
  stems: Item[];
  leaves: Item[];
  daisyPetals: Item[];
  lilyPetals: Item[];
  cupPetals: Item[];
  centers: Item[];
  stamens: Item[];
  anthers: Item[];
};

const COLORS = {
  daisy: ['#ffffff', '#fdf6ec', '#f9c9d8', '#f7d84b', '#c9b6f2'],
  daisyCenter: ['#f2b52a', '#e9a21b', '#5b3a1e'],
  lily: ['#f48fb1', '#ffffff', '#f5873b', '#e0407a', '#fbd3e2', '#b38be8'],
  tulip: ['#d7263d', '#f6c945', '#f06a99', '#7b4fc9', '#f28b3a', '#fff1f4'],
  peony: ['#f7c6cf', '#e05a8a', '#f4876f', '#fbefe6', '#c2185b'],
  leaf: ['#3f8f3a', '#4ea345', '#2f7a33', '#5bb04d'],
};

function buildFlowers(): FlowerParts {
  const rand = seededRandom(11);
  const pick = (list: string[]) => new THREE.Color(list[Math.floor(rand() * list.length)]);
  const vary = (c: THREE.Color, amount = 0.05) =>
    c.clone().offsetHSL((rand() - 0.5) * 0.02, (rand() - 0.5) * 0.1, (rand() - 0.5) * amount);

  const parts: FlowerParts = {
    stems: [], leaves: [], daisyPetals: [], lilyPetals: [],
    cupPetals: [], centers: [], stamens: [], anthers: [],
  };
  const local = new THREE.Object3D();

  // Places a part relative to the flower head
  const atHead = (head: THREE.Matrix4, list: Item[], color: THREE.Color) => {
    local.updateMatrix();
    list.push({ m: new THREE.Matrix4().multiplyMatrices(head, local.matrix), c: color });
  };

  let placed = 0;
  let tries = 0;
  while (placed < 260 && tries < 5000) {
    tries++;
    const x = (rand() - 0.5) * (W - 0.4);
    const z = (rand() - 0.5) * (D - 1.2) + 0.2;
    if (Math.abs(x - pathX(z)) < 0.6 && z < 4.6) continue; // keep the path clear
    if (z < -4.3) continue;                                // keep the mirrors clear
    if (CLEARINGS.some((c) => Math.hypot(x - c.x, z - c.z) < c.r)) continue; // keep seats clear
    placed++;

    const height = 0.35 + rand() * 1.15;
    const size = 0.8 + rand() * (z > 2.5 ? 1.0 : 0.6); // bigger flowers near the front
    const lean = new THREE.Euler((rand() - 0.5) * 0.25, 0, (rand() - 0.5) * 0.25);
    const base = new THREE.Vector3(x, 0, z);
    const up = new THREE.Vector3(0, 1, 0).applyEuler(lean);
    const headPos = base.clone().addScaledVector(up, height);

    /* Stem */
    local.position.copy(base);
    local.rotation.copy(lean);
    local.scale.set(0.007, height, 0.007);
    local.updateMatrix();
    parts.stems.push({ m: local.matrix.clone(), c: new THREE.Color('#3f8f3a') });

    /* Leaves along the stem */
    const leafCount = 1 + Math.floor(rand() * 3);
    for (let l = 0; l < leafCount; l++) {
      local.position.copy(base).addScaledVector(up, height * (0.15 + rand() * 0.4));
      local.rotation.set(0, rand() * Math.PI * 2, 0);
      local.rotateX(-(0.5 + rand() * 0.5));
      local.scale.setScalar((0.16 + rand() * 0.14) * Math.min(size, 1.3));
      local.updateMatrix();
      parts.leaves.push({ m: local.matrix.clone(), c: vary(pick(COLORS.leaf)) });
    }

    /* Flower head: tipped slightly, so flowers face different ways */
    const nod = new THREE.Euler(lean.x + (rand() - 0.5) * 0.7, rand() * Math.PI * 2, lean.z + (rand() - 0.5) * 0.7);
    const head = new THREE.Matrix4().compose(headPos, new THREE.Quaternion().setFromEuler(nod), new THREE.Vector3(1, 1, 1));
    const spin = rand() * Math.PI * 2;
    const kind = rand();

    // Adds a ring of petals around the head
    const ring = (list: Item[], count: number, tilt: number, len: number, color: THREE.Color, offset = 0) => {
      for (let p = 0; p < count; p++) {
        local.position.set(0, 0, 0);
        local.rotation.set(0, spin + offset + (p / count) * Math.PI * 2 + (rand() - 0.5) * 0.15, 0);
        local.rotateX(-(tilt + (rand() - 0.5) * 0.15));
        local.scale.setScalar(len * (0.9 + rand() * 0.2));
        atHead(head, list, vary(color));
      }
    };

    if (kind < 0.3) {
      /* DAISY: many slim petals, almost flat, with a domed center */
      const color = pick(COLORS.daisy);
      ring(parts.daisyPetals, 14 + Math.floor(rand() * 6), 0.15, 0.09 * size, color);
      local.position.set(0, 0.006 * size, 0);
      local.rotation.set(0, 0, 0);
      local.scale.set(0.025 * size, 0.014 * size, 0.025 * size);
      atHead(head, parts.centers, pick(COLORS.daisyCenter));
    } else if (kind < 0.55) {
      /* LILY: six long petals that open up and curl back, with long stamens */
      const color = pick(COLORS.lily);
      ring(parts.lilyPetals, 3, 0.75, 0.15 * size, color);
      ring(parts.lilyPetals, 3, 0.85, 0.14 * size, color, Math.PI / 3);
      for (let s = 0; s < 6; s++) {
        const len = 0.11 * size;
        local.position.set(0, 0, 0);
        local.rotation.set(0, spin + (s / 6) * Math.PI * 2, 0);
        local.rotateX(0.45);
        local.scale.set(0.003, len, 0.003);
        atHead(head, parts.stamens, new THREE.Color('#e8d9a8'));
        local.translateY(len);
        local.scale.set(0.006, 0.006, 0.014);
        atHead(head, parts.anthers, new THREE.Color(rand() > 0.5 ? '#b5502a' : '#7a2e1c'));
      }
    } else if (kind < 0.8) {
      /* TULIP: two layers of wide cupped petals standing almost upright */
      const color = pick(COLORS.tulip);
      ring(parts.cupPetals, 3, 1.2, 0.075 * size, color);
      ring(parts.cupPetals, 3, 1.3, 0.07 * size, color.clone().offsetHSL(0, 0, -0.04), Math.PI / 3);
    } else {
      /* PEONY: layered rings, tighter and smaller toward the middle */
      const color = pick(COLORS.peony);
      ring(parts.cupPetals, 7, 0.35, 0.075 * size, color);
      ring(parts.cupPetals, 6, 0.75, 0.062 * size, color.clone().offsetHSL(0, 0, 0.03), 0.4);
      ring(parts.cupPetals, 5, 1.1, 0.048 * size, color.clone().offsetHSL(0, 0, 0.06), 0.8);
      local.position.set(0, 0.01 * size, 0);
      local.rotation.set(0, 0, 0);
      local.scale.setScalar(0.014 * size);
      atHead(head, parts.centers, new THREE.Color('#f6dd7a'));
    }
  }
  return parts;
}

/* Draws a list of items with one shared geometry */
function Instanced({
  items,
  geometry,
  vertexColors = false,
  doubleSide = false,
  roughness = 0.6,
}: {
  items: Item[];
  geometry: THREE.BufferGeometry;
  vertexColors?: boolean;
  doubleSide?: boolean;
  roughness?: number;
}) {
  const ref = useRef<THREE.InstancedMesh>(null);

  useLayoutEffect(() => {
    const mesh = ref.current;
    if (!mesh) return;
    items.forEach(({ m, c }, i) => {
      mesh.setMatrixAt(i, m);
      mesh.setColorAt(i, c);
    });
    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
  }, [items]);

  if (items.length === 0) return null;
  return (
    <instancedMesh ref={ref} args={[geometry, undefined, items.length]}>
      <meshStandardMaterial
        vertexColors={vertexColors}
        side={doubleSide ? THREE.DoubleSide : THREE.FrontSide}
        roughness={roughness}
      />
    </instancedMesh>
  );
}

function Flowers() {
  const parts = useMemo(buildFlowers, []);

  const geo = useMemo(() => {
    const stem = new THREE.CylinderGeometry(0.7, 1, 1, 6);
    stem.translate(0, 0.5, 0); // base at the ground, grows upward
    const stamen = new THREE.CylinderGeometry(1, 1, 1, 4);
    stamen.translate(0, 0.5, 0);
    return {
      stem,
      stamen,
      sphere: new THREE.SphereGeometry(1, 12, 8),
      daisy: petalGeometry({ width: 0.14, peak: 1.0, cup: 0.25, curl: 0.05, baseShade: 0.85 }),
      lily: petalGeometry({ width: 0.17, peak: 0.9, cup: 0.35, curl: -0.3, baseShade: 0.7 }),
      cup: petalGeometry({ width: 0.42, peak: 1.5, cup: 0.45, curl: 0.12, baseShade: 0.72 }),
      leaf: petalGeometry({ width: 0.16, peak: 1.0, cup: 0.3, curl: -0.25, baseShade: 0.8 }),
    };
  }, []);

  useEffect(() => () => Object.values(geo).forEach((g) => g.dispose()), [geo]);

  return (
    <group>
      <Instanced items={parts.stems} geometry={geo.stem} roughness={0.8} />
      <Instanced items={parts.leaves} geometry={geo.leaf} vertexColors doubleSide roughness={0.7} />
      <Instanced items={parts.daisyPetals} geometry={geo.daisy} vertexColors doubleSide />
      <Instanced items={parts.lilyPetals} geometry={geo.lily} vertexColors doubleSide />
      <Instanced items={parts.cupPetals} geometry={geo.cup} vertexColors doubleSide />
      <Instanced items={parts.centers} geometry={geo.sphere} roughness={0.9} />
      <Instanced items={parts.stamens} geometry={geo.stamen} />
      <Instanced items={parts.anthers} geometry={geo.sphere} roughness={0.9} />
    </group>
  );
}

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

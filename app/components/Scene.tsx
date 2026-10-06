'use client';

// Picks which room to build for the active location,
// moves the desktop camera into it, and shows the 3D location orbs (for VR).

import { useEffect, useState } from 'react';
import * as THREE from 'three';
import { useThree } from '@react-three/fiber';
import { XROrigin } from '@react-three/xr';
import type { Location } from './locations';
import { CloudLounge } from './CloudLounge';
import { SkyHill } from './SkyHill';
import { FlowerRoom } from './FlowerRoom';
import { PatternRoom } from './PatternRoom';

/* Moves the desktop camera when the location changes */
function CameraRig({ location }: { location: Location }) {
  const camera = useThree((s) => s.camera);
  const controls = useThree((s) => s.controls) as unknown as {
    target: THREE.Vector3;
    update: () => void;
  } | null;

  useEffect(() => {
    camera.position.set(...location.camera);
    if (controls) {
      controls.target.set(...location.target);
      controls.update();
    } else {
      camera.lookAt(...location.target);
    }
  }, [location, camera, controls]);

  return null;
}

/* A row of glowing orbs in front of you. Click (or point and trigger in VR) to switch rooms. */
function LocationOrbs({
  locations,
  active,
  onSelect,
}: {
  locations: Location[];
  active: Location;
  onSelect: (id: string) => void;
}) {
  const [hovered, setHovered] = useState<string | null>(null);
  const spacing = 0.32;
  const startX = -((locations.length - 1) * spacing) / 2;
  const [sx, , sz] = active.spawn;

  return (
    <group position={[sx, 1.15, sz - 1.4]}>
      {locations.map((loc, i) => {
        const isActive = loc.id === active.id;
        const big = isActive || hovered === loc.id;
        return (
          <mesh
            key={loc.id}
            position={[startX + i * spacing, 0, 0]}
            scale={big ? 1.35 : 1}
            onClick={() => onSelect(loc.id)}
            onPointerOver={() => setHovered(loc.id)}
            onPointerOut={() => setHovered(null)}
          >
            <sphereGeometry args={[0.07, 32, 32]} />
            <meshStandardMaterial color={loc.accent} emissive={loc.accent} emissiveIntensity={isActive ? 1.2 : 0.4} />
          </mesh>
        );
      })}
    </group>
  );
}

export function Scene({
  location,
  locations,
  onSelect,
}: {
  location: Location;
  locations: Location[];
  onSelect: (id: string) => void;
}) {
  return (
    <>
      {/* Where you stand in VR. y = 0 keeps your feet on the floor. */}
      <XROrigin position={location.spawn} />
      <CameraRig location={location} />

      {location.kind === 'clouds' && <CloudLounge />}
      {location.kind === 'sky' && <SkyHill />}
      {location.kind === 'garden' && <FlowerRoom />}
      {location.kind === 'pattern' && location.pattern && <PatternRoom style={location.pattern} />}

      <LocationOrbs locations={locations} active={location} onSelect={onSelect} />
    </>
  );
}

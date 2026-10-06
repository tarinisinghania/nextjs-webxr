// This directive tells Next.js that this component runs on the client-side
// It's needed because we're using browser-specific features like 3D graphics and WebXR
'use client';

import { useEffect, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { XR, createXRStore } from '@react-three/xr';

import { Scene } from './components/Scene';
import { LocationUI } from './components/LocationUI';
import { LOCATIONS } from './components/locations';

// Create an XR store that manages the WebXR session state
const store = createXRStore();

export default function Home() {
  // Which room is currently showing
  const [activeId, setActiveId] = useState(LOCATIONS[0].id);
  const active = LOCATIONS.find((l) => l.id === activeId) ?? LOCATIONS[0];

  // Left / right arrow keys cycle through rooms
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
      const i = LOCATIONS.findIndex((l) => l.id === activeId);
      const step = e.key === 'ArrowRight' ? 1 : -1;
      setActiveId(LOCATIONS[(i + step + LOCATIONS.length) % LOCATIONS.length].id);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [activeId]);

  return (
    <div style={{ position: 'relative', width: '100vw', height: '100vh' }}>
      {/*
        shadows: turns on shadow rendering
        flat: turns off tone mapping so colors stay true
      */}
      <Canvas shadows flat camera={{ position: active.camera, fov: 60 }}>
        <XR store={store}>
          <Scene location={active} locations={LOCATIONS} onSelect={setActiveId} />

          {/* Desktop navigation. makeDefault lets the scene move it between rooms. */}
          <OrbitControls makeDefault maxDistance={8} maxPolarAngle={Math.PI / 2 - 0.05} />
        </XR>
      </Canvas>

      {/* Room menu and info card on top of the 3D view */}
      <LocationUI locations={LOCATIONS} active={active} onSelect={setActiveId} />
    </div>
  );
}

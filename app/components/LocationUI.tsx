'use client';

// The on-screen interface (desktop and phone):
// a menu of locations on the right, and an info card at the bottom.
// In a VR headset, use the glowing orbs inside the room instead.

import type { CSSProperties } from 'react';
import type { Location } from './locations';

const panel: CSSProperties = {
  background: 'rgba(58, 52, 74, 0.72)',
  backdropFilter: 'blur(10px)',
  WebkitBackdropFilter: 'blur(10px)',
  color: '#fff',
  borderRadius: 16,
  boxShadow: '0 6px 24px rgba(30, 20, 60, 0.25)',
};

const ACTIVE = '#ffd35c'; // yellow highlight, like the reference image

export function LocationUI({
  locations,
  active,
  onSelect,
}: {
  locations: Location[];
  active: Location;
  onSelect: (id: string) => void;
}) {
  return (
    <>
      {/* Location menu, right side */}
      <nav
        aria-label="Choose a location"
        style={{
          ...panel,
          position: 'absolute',
          right: 20,
          top: '50%',
          transform: 'translateY(-50%)',
          padding: 8,
          display: 'flex',
          flexDirection: 'column',
          gap: 2,
          zIndex: 10,
        }}
      >
        {locations.map((loc) => {
          const isActive = loc.id === active.id;
          return (
            <button
              key={loc.id}
              onClick={() => onSelect(loc.id)}
              aria-pressed={isActive}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                padding: '8px 14px 8px 10px',
                border: 'none',
                borderRadius: 999,
                background: isActive ? 'rgba(255,255,255,0.12)' : 'transparent',
                color: isActive ? ACTIVE : '#fff',
                font: 'inherit',
                fontSize: 13,
                textAlign: 'left',
                cursor: 'pointer',
              }}
            >
              {/* Small swatch showing the location's pattern color */}
              <span
                aria-hidden
                style={{
                  width: 12,
                  height: 12,
                  borderRadius: '50%',
                  background: loc.accent,
                  boxShadow: '0 0 0 2px rgba(255,255,255,0.35)',
                  flexShrink: 0,
                }}
              />
              {loc.name}
            </button>
          );
        })}
      </nav>

      {/* Info card, bottom center */}
      <section
        aria-live="polite"
        style={{
          ...panel,
          position: 'absolute',
          left: '50%',
          bottom: 28,
          transform: 'translateX(-50%)',
          width: 'min(320px, calc(100vw - 40px))',
          padding: '16px 18px',
          zIndex: 10,
        }}
      >
        <h2
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            margin: '0 0 6px',
            fontSize: 15,
            fontWeight: 600,
          }}
        >
          <span
            aria-hidden
            style={{ width: 14, height: 14, borderRadius: '50%', background: ACTIVE }}
          />
          {active.name}
        </h2>
        <p style={{ margin: 0, fontSize: 12.5, lineHeight: 1.5, opacity: 0.88 }}>
          {active.description}
        </p>
      </section>
    </>
  );
}

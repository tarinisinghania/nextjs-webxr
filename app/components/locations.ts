// Each "location" is a different room you can switch between.
// "kind" picks which scene is built; the other values tune it.

export type Pattern = 'grid' | 'fineGrid' | 'dots' | 'stripes' | 'waves' | 'diamond' | 'brick';

// Only used by the patterned "studio" style rooms
export type PatternStyle = {
  wallPattern: Pattern;
  floorPattern: Pattern;
  wall: string;
  floor: string;
  line: string;
  furniture: string;
  sun: string;
  ambient: number;
  cell: number;
};

export type SceneKind = 'clouds' | 'sky' | 'garden' | 'pattern';

type Vec3 = [number, number, number];

export type Location = {
  id: string;
  name: string;
  description: string;
  kind: SceneKind;
  accent: string;   // color used in the menu and for the 3D orb
  spawn: Vec3;      // where you stand in VR (feet on the floor)
  camera: Vec3;     // desktop camera position
  target: Vec3;     // what the desktop camera looks at
  pattern?: PatternStyle;
};

export const LOCATIONS: Location[] = [
  {
    id: 'clouds',
    name: 'Cloud lounge',
    description:
      'A warehouse filled with low clouds lit from inside. Soft round sofas sit in the haze like islands.',
    kind: 'clouds',
    accent: '#ffcf8a',
    spawn: [0, 0, 5.5],
    camera: [0, 1.6, 6],
    target: [0, 1.4, 0],
  },
  {
    id: 'sky',
    name: 'Sky hill',
    description:
      'A gallery with the sky projected on every wall. A grass hill rises through the middle, with stairs to the top.',
    kind: 'sky',
    accent: '#6fb8ff',
    spawn: [0, 0, 8.2],
    camera: [0, 1.8, 8.6],
    target: [0, 2, 0],
  },
  {
    id: 'garden',
    name: 'Flower room',
    description:
      'A pink room overgrown with oversized flowers. Stepping stones lead through the meadow toward the mirrors.',
    kind: 'garden',
    accent: '#f28ab6',
    spawn: [0, 0, 4.3],
    camera: [0, 1.5, 4.6],
    target: [0, 1, -2],
  },
  {
    id: 'studio',
    name: 'Grid studio',
    description:
      'A digital twin of a living room, drawn as a measuring grid. Every line is one unit of space the system has mapped.',
    kind: 'pattern',
    accent: '#62e4e8',
    spawn: [0, 0, 4],
    camera: [0, 1.6, 4.5],
    target: [0, 0.8, -1],
    pattern: {
      wallPattern: 'grid',
      floorPattern: 'grid',
      wall: '#8f72e6',
      floor: '#d9bdf4',
      line: '#62e4e8',
      furniture: '#f2c9f4',
      sun: '#ffffff',
      ambient: 1.4,
      cell: 0.75,
    },
  },
];

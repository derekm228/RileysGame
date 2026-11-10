// Level layout. Coordinates are in pixels; y grows downward.
// Surfaces are described by their TOP edge (where feet stand).
export const WORLD_W = 6400;
export const GROUND_Y = 480;
export const GROUND_H = 60;

export interface Rect { x: number; y: number; w: number; h: number }
export interface Point { x: number; y: number }

// Ground segments [left, right]. Spaces between them are pits.
export const ground: [number, number][] = [
  [0, 1100],
  [1260, 2200],
  [2500, 3400],
  [3700, 4300],
  [4600, WORLD_W],
];

// Floating rooftops (left x, top y, width).
export const platforms: Rect[] = [
  { x: 600, y: 400, w: 140, h: 24 },   // practice hop
  { x: 1480, y: 400, w: 160, h: 24 },  // up...
  { x: 1700, y: 330, w: 160, h: 24 },  // ...and over
  { x: 1920, y: 400, w: 160, h: 24 },
  { x: 2290, y: 410, w: 120, h: 24 },  // stepping stone over pit 2
  { x: 3500, y: 420, w: 100, h: 24 },  // stepping stone over pit 3
  { x: 3850, y: 410, w: 120, h: 24 },  // staircase...
  { x: 4030, y: 340, w: 120, h: 24 },
  { x: 4200, y: 270, w: 120, h: 24 },
  { x: 4420, y: 310, w: 120, h: 24 },  // ...across the big pit
];

// Crates (top-left corner, 48x48).
export const CRATE = 48;
export const crates: Point[] = [
  { x: 2850, y: 432 },
  { x: 2898, y: 432 },
  { x: 2898, y: 384 },
  // chase zone obstacles
  { x: 5500, y: 432 },
  { x: 5950, y: 432 },
];

export const PLAYER_START: Point = { x: 100, y: 420 };
export const CHASE_START = 4600;
export const VILLAIN_START = 5150;
export const VILLAIN_END = 6300; // dead end: he's cornered here

function trail(x1: number, x2: number, y: number, step = 80): Point[] {
  const out: Point[] = [];
  for (let x = x1; x <= x2; x += step) out.push({ x, y });
  return out;
}

// The bad guy's footprints. They show the safe path through the level.
export const tracks: Point[] = [
  ...trail(220, 560, GROUND_Y),
  ...trail(625, 705, 400),
  ...trail(800, 1060, GROUND_Y),
  ...trail(1300, 1440, GROUND_Y),
  ...trail(1500, 1620, 400),
  ...trail(1720, 1840, 330),
  ...trail(1940, 2060, 400),
  ...trail(2110, 2190, GROUND_Y),
  ...trail(2315, 2395, 410),
  ...trail(2540, 2780, GROUND_Y),
  { x: 2874, y: 432 },
  { x: 2922, y: 384 },
  ...trail(2990, 3390, GROUND_Y),
  ...trail(3525, 3585, 420),
  ...trail(3720, 3800, GROUND_Y),
  ...trail(3870, 3950, 410),
  ...trail(4050, 4130, 340),
  ...trail(4220, 4300, 270),
  ...trail(4440, 4520, 310),
  ...trail(4640, 4880, GROUND_Y),
];

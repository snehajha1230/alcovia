/**
 * Procedural grove generator — port of Flash Math Creativity stem/leaf logic.
 * Leaves attach when session progress crosses height / point.y (bottom-up along stem).
 */

export const VIEWBOX_WIDTH = 550;
export const VIEWBOX_HEIGHT = 400;
export const GROUND_Y = VIEWBOX_HEIGHT;

/** Reference leaf shape */
export const LEAF_PATH = 'M0,0 Q5,-5 10,0 5,5 0,0z';

export const CENTER_X = 275;
export const OFFSET_X = 175;

export type Point = { x: number; y: number };

export type GroveStem = {
  id: string;
  path: string;
  strokeWidth: number;
};

export type GroveLeaf = {
  id: string;
  x: number;
  y: number;
  scaleX: number;
  scaleY: number;
  rotation: number;
  fill: string;
  appearAt: number;
};

export type GrovePlant = {
  id: string;
  stems: GroveStem[];
  leaves: GroveLeaf[];
};

function hashSeed(seed: string): number {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

export function createRng(seed: string) {
  let state = hashSeed(seed) || 1;
  return () => {
    state = (state * 1664525 + 1013904223) >>> 0;
    return state / 0xffffffff;
  };
}

function randomInt(rng: () => number, min: number, max: number) {
  return Math.floor(rng() * (max - min + 1)) + min;
}

/** Smooth cubic-bezier path through control points. */
export function solve(data: number[]): string {
  const size = data.length;
  const last = size - 4;
  let path = `M${data[0]},${data[1]}`;

  for (let i = 0; i < size - 2; i += 2) {
    const x0 = i ? data[i - 2] : data[0];
    const y0 = i ? data[i - 1] : data[1];
    const x1 = data[i];
    const y1 = data[i + 1];
    const x2 = data[i + 2];
    const y2 = data[i + 3];
    const x3 = i !== last ? data[i + 4] : x2;
    const y3 = i !== last ? data[i + 5] : y2;

    const cp1x = (-x0 + 6 * x1 + x2) / 6;
    const cp1y = (-y0 + 6 * y1 + y2) / 6;
    const cp2x = (x1 + 6 * x2 - x3) / 6;
    const cp2y = (y1 + 6 * y2 - y3) / 6;

    path += `C${cp1x},${cp1y},${cp2x},${cp2y},${x2},${y2}`;
  }

  return path;
}

export function createPoints(rng: () => number): Point[] {
  const x = randomInt(rng, CENTER_X - OFFSET_X, CENTER_X + OFFSET_X);
  const y = GROUND_Y;
  const dy = 5;
  const offset = 0.007;
  const count = randomInt(rng, 30, 55);
  const points: Point[] = [{ x, y }];

  for (let i = 1; i <= count; i++) {
    points.push({
      x: points[i - 1].x + i * offset * (randomInt(rng, 0, 20) - 10),
      y: 395 - dy * i,
    });
  }

  return points;
}

function createPlant(rng: () => number, index: number, leafCount: number): GrovePlant {
  const points = createPoints(rng);
  const length = points.length;
  const height = points[length - 1].y;
  const coords: number[] = [];

  for (let i = 0; i < length; i++) {
    coords.push(points[i].x, points[i].y);
  }

  const stem: GroveStem = {
    id: `grow-${index}`,
    path: solve(coords),
    strokeWidth: 2,
  };

  const leaves: GroveLeaf[] = [];
  for (let i = 0; i < leafCount; i++) {
    const point = points[length - 1 - i];
    const scaleX = 1 + 0.1 * i;
    const scaleY = 1 + 0.05 * i;
    const green = randomInt(rng, 110, 160);

    leaves.push({
      id: `leaf-${index}-${i}`,
      x: point.x,
      y: point.y,
      scaleX,
      scaleY,
      rotation: randomInt(rng, 0, 359) - 180,
      fill: `rgb(0,${green},0)`,
      appearAt: height / point.y,
    });
  }

  return {
    id: `plant-${index}`,
    stems: [stem],
    leaves,
  };
}

export function generateGrove(seed: string, plantCount = 10, leafCount = 30): GrovePlant[] {
  const rng = createRng(seed);
  return Array.from({ length: plantCount }, (_, index) => createPlant(rng, index, leafCount));
}

export function countVisibleLeaves(plants: GrovePlant[], sessionProgress: number) {
  let visible = 0;
  let total = 0;
  for (const plant of plants) {
    total += plant.leaves.length;
    visible += plant.leaves.filter((leaf) => sessionProgress >= leaf.appearAt).length;
  }
  return { visible, total };
}

/** @deprecated use generateGrove */
export const generateShrubs = generateGrove;

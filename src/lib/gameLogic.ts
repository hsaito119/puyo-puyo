import type { Board, Cell, PuyoColor, PuyoPair, Rotation } from "./types";

export const BOARD_COLS = 6;
export const BOARD_ROWS = 13; // row 0 is hidden spawn row

export const COLORS: PuyoColor[] = ["red", "green", "blue", "yellow", "purple"];

export function emptyBoard(): Board {
  return Array.from({ length: BOARD_ROWS }, () => Array(BOARD_COLS).fill(null));
}

export function randomColor(): PuyoColor {
  return COLORS[Math.floor(Math.random() * COLORS.length)];
}

export function randomPair(): [PuyoColor, PuyoColor] {
  return [randomColor(), randomColor()];
}

/** Returns [mainX, mainY, subX, subY] for the current pair */
export function getPuyoPositions(pair: PuyoPair): [number, number, number, number] {
  const { x, y, rotation } = pair;
  const offsets: Record<Rotation, [number, number]> = {
    0: [0, -1], // sub above main
    1: [1, 0],  // sub right of main
    2: [0, 1],  // sub below main
    3: [-1, 0], // sub left of main
  };
  const [dx, dy] = offsets[rotation];
  return [x, y, x + dx, y + dy];
}

export function isValidPosition(board: Board, pair: PuyoPair): boolean {
  const [mx, my, sx, sy] = getPuyoPositions(pair);
  return (
    inBounds(mx, my) && inBounds(sx, sy) &&
    board[my][mx] === null && board[sy][sx] === null
  );
}

function inBounds(x: number, y: number): boolean {
  return x >= 0 && x < BOARD_COLS && y >= 0 && y < BOARD_ROWS;
}

export function lockPair(board: Board, pair: PuyoPair): Board {
  const next = board.map(r => [...r]);
  const [mx, my, sx, sy] = getPuyoPositions(pair);
  next[my][mx] = pair.colors[0];
  next[sy][sx] = pair.colors[1];
  return next;
}

/** Apply gravity: cells fall down to fill empty spaces */
export function applyGravity(board: Board): Board {
  const next = board.map(r => [...r]);
  for (let col = 0; col < BOARD_COLS; col++) {
    const cells: Cell[] = [];
    for (let row = BOARD_ROWS - 1; row >= 0; row--) {
      if (next[row][col] !== null) cells.push(next[row][col]);
    }
    for (let row = BOARD_ROWS - 1; row >= 0; row--) {
      next[row][col] = cells[BOARD_ROWS - 1 - row] ?? null;
    }
  }
  return next;
}

/** BFS flood fill to find connected group */
function flood(board: Board, startRow: number, startCol: number, color: PuyoColor): string[] {
  const queue: [number, number][] = [[startRow, startCol]];
  const visited = new Set<string>();
  while (queue.length) {
    const [r, c] = queue.shift()!;
    const key = `${r},${c}`;
    if (visited.has(key)) continue;
    if (!inBounds(c, r) || board[r][c] !== color) continue;
    visited.add(key);
    queue.push([r - 1, c], [r + 1, c], [r, c - 1], [r, c + 1]);
  }
  return [...visited];
}

/** Find all groups of 4+ connected same-color puyos */
export function findClearingCells(board: Board): Set<string> {
  const visited = new Set<string>();
  const toRemove = new Set<string>();
  for (let r = 0; r < BOARD_ROWS; r++) {
    for (let c = 0; c < BOARD_COLS; c++) {
      const key = `${r},${c}`;
      if (visited.has(key) || board[r][c] === null) continue;
      const group = flood(board, r, c, board[r][c]!);
      group.forEach(k => visited.add(k));
      if (group.length >= 4) group.forEach(k => toRemove.add(k));
    }
  }
  return toRemove;
}

export function clearCells(board: Board, cells: Set<string>): Board {
  const next = board.map(r => [...r]);
  for (const key of cells) {
    const [r, c] = key.split(",").map(Number);
    next[r][c] = null;
  }
  return next;
}

export function calcScore(chain: number, cleared: number): number {
  const chainBonus = [0, 0, 8, 16, 32, 64, 96, 128, 160, 192, 224, 256][Math.min(chain, 11)];
  const colorBonus = 3;
  return (10 * cleared) * (Math.max(1, chainBonus) + colorBonus);
}

export function isGameOver(board: Board): boolean {
  // Game over if column 3 (0-indexed 2) in the hidden spawn row is filled
  return board[1][2] !== null;
}

export function spawnPair(colors: [PuyoColor, PuyoColor]): PuyoPair {
  return { x: 2, y: 1, rotation: 0, colors };
}

export function rotatePair(board: Board, pair: PuyoPair, dir: 1 | -1): PuyoPair {
  const newRotation = ((pair.rotation + dir + 4) % 4) as Rotation;
  let next = { ...pair, rotation: newRotation };
  if (!isValidPosition(board, next)) {
    // Try wall kick left
    const kicked = { ...next, x: next.x + (dir === 1 ? -1 : 1) };
    if (isValidPosition(board, kicked)) return kicked;
    // Try wall kick other direction
    const kicked2 = { ...next, x: next.x + (dir === 1 ? 1 : -1) };
    if (isValidPosition(board, kicked2)) return kicked2;
    return pair; // rotation failed
  }
  return next;
}

/** Returns the lowest valid position for the pair (ghost/shadow). */
export function getGhostPosition(board: Board, pair: PuyoPair): PuyoPair {
  let ghost = { ...pair };
  while (isValidPosition(board, { ...ghost, y: ghost.y + 1 })) {
    ghost = { ...ghost, y: ghost.y + 1 };
  }
  return ghost;
}

export function dropSpeed(level: number): number {
  return Math.max(100, 800 - level * 60);
}

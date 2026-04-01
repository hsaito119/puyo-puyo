export type PuyoColor = "red" | "green" | "blue" | "yellow" | "purple";
export type Cell = PuyoColor | null;
export type Board = Cell[][];

export type Rotation = 0 | 1 | 2 | 3; // 0=up, 1=right, 2=down, 3=left

export interface PuyoPair {
  x: number;
  y: number;
  rotation: Rotation;
  colors: [PuyoColor, PuyoColor]; // [main, sub]
}

export interface GameState {
  board: Board;
  current: PuyoPair;
  next: [PuyoColor, PuyoColor][];
  score: number;
  level: number;
  lines: number;
  chain: number;
  phase: "playing" | "clearing" | "gameover";
  clearingCells: Set<string>;
  flashFrame: number;
}

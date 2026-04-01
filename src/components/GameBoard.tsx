import type { Board, PuyoColor, PuyoPair } from "@/lib/types";
import { getPuyoPositions, getGhostPosition, BOARD_COLS, BOARD_ROWS } from "@/lib/gameLogic";
import PuyoCell from "./PuyoCell";

interface Props {
  board: Board;
  current: PuyoPair | null;
  clearingCells: Set<string>;
  flashFrame: number;
}

export default function GameBoard({ board, current, clearingCells, flashFrame }: Props) {
  // Build overlay from current piece (skip hidden row 0)
  const overlay: Record<string, { color: PuyoColor; isGhost?: boolean }> = {};

  if (current) {
    // Ghost — written first so active piece overwrites when at same position
    const ghost = getGhostPosition(board, current);
    const [gx, gy, gsx, gsy] = getPuyoPositions(ghost);
    overlay[`${gy},${gx}`]   = { color: current.colors[0], isGhost: true };
    overlay[`${gsy},${gsx}`] = { color: current.colors[1], isGhost: true };
    // Active piece
    const [mx, my, sx, sy] = getPuyoPositions(current);
    overlay[`${my},${mx}`] = { color: current.colors[0] };
    overlay[`${sy},${sx}`] = { color: current.colors[1] };
  }

  return (
    <div
      className="relative rounded-2xl overflow-hidden border border-white/10 shadow-[0_0_60px_rgba(139,92,246,0.3)]"
      style={{ background: "linear-gradient(180deg, #0f0c29 0%, #1a1040 100%)" }}
    >
      {/* Grid lines */}
      <div
        className="absolute inset-0 pointer-events-none opacity-10"
        style={{
          backgroundImage: `
            linear-gradient(rgba(255,255,255,0.3) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.3) 1px, transparent 1px)
          `,
          backgroundSize: `${100 / BOARD_COLS}% ${100 / (BOARD_ROWS - 1)}%`,
        }}
      />

      <div
        className="grid"
        style={{
          gridTemplateColumns: `repeat(${BOARD_COLS}, 48px)`,
          gridTemplateRows: `repeat(${BOARD_ROWS - 1}, 48px)`, // hide row 0
        }}
      >
        {/* Start from row 1 to hide spawn row */}
        {Array.from({ length: BOARD_ROWS - 1 }, (_, visRow) => {
          const row = visRow + 1;
          return Array.from({ length: BOARD_COLS }, (_, col) => {
            const key = `${row},${col}`;
            const boardColor = board[row][col];
            const overlayCell = overlay[key];
            const isClearing = clearingCells.has(key);
            const color: PuyoColor | null = overlayCell?.color ?? boardColor ?? null;
            const flash = isClearing && flashFrame % 2 === 1;

            return (
              <div key={key} className="p-[2px]">
                <PuyoCell color={color} flash={flash} isActive={!!overlayCell} isGhost={overlayCell?.isGhost} />
              </div>
            );
          });
        })}
      </div>
    </div>
  );
}

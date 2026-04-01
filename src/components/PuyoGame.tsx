"use client";

import { useCallback, useEffect, useReducer, useRef } from "react";
import type { GameState, PuyoPair } from "@/lib/types";
import {
  applyGravity, calcScore, clearCells, dropSpeed, emptyBoard,
  findClearingCells, isValidPosition, lockPair,
  randomPair, rotatePair, spawnPair,
} from "@/lib/gameLogic";
import GameBoard from "./GameBoard";
import NextPuyos from "./NextPuyos";

// ── Initial state ─────────────────────────────────────────────────────────────

function makeInitialState(): GameState {
  const next = [randomPair(), randomPair(), randomPair()];
  return {
    board: emptyBoard(),
    current: spawnPair(next[0]),
    next: next.slice(1),
    score: 0,
    level: 1,
    lines: 0,
    chain: 0,
    phase: "playing",
    clearingCells: new Set(),
    flashFrame: 0,
  };
}

// ── Reducer ───────────────────────────────────────────────────────────────────

type Action =
  | { type: "MOVE"; dx: number }
  | { type: "ROTATE"; dir: 1 | -1 }
  | { type: "SOFT_DROP" }
  | { type: "HARD_DROP" }
  | { type: "TICK" }
  | { type: "TICK_CLEAR" }
  | { type: "RESET" };

function reducer(state: GameState, action: Action): GameState {
  if (action.type === "RESET") return makeInitialState();
  if (state.phase === "gameover") return state;

  switch (action.type) {
    case "MOVE": {
      const next: PuyoPair = { ...state.current, x: state.current.x + action.dx };
      if (isValidPosition(state.board, next)) return { ...state, current: next };
      return state;
    }
    case "ROTATE": {
      const next = rotatePair(state.board, state.current, action.dir);
      return { ...state, current: next };
    }
    case "SOFT_DROP":
    case "TICK": {
      const next: PuyoPair = { ...state.current, y: state.current.y + 1 };
      if (isValidPosition(state.board, next)) return { ...state, current: next };
      return lockAndCheck(state);
    }
    case "HARD_DROP": {
      let cur = state.current;
      while (isValidPosition(state.board, { ...cur, y: cur.y + 1 })) cur = { ...cur, y: cur.y + 1 };
      return lockAndCheck({ ...state, current: cur });
    }
    case "TICK_CLEAR": {
      if (state.phase === "clearing") {
        if (state.flashFrame < 3) return { ...state, flashFrame: state.flashFrame + 1 };
        const board = applyGravity(clearCells(state.board, state.clearingCells));
        const clearing = findClearingCells(board);
        const newChain = state.chain + 1;
        const score = state.score + calcScore(newChain, state.clearingCells.size);
        const lines = state.lines + state.clearingCells.size;
        const level = Math.floor(lines / 20) + 1;
        if (clearing.size > 0) {
          return { ...state, board, score, lines, level, chain: newChain, clearingCells: clearing, flashFrame: 0, phase: "clearing" };
        }
        // No more chains — spawn next
        return spawnNext({ ...state, board, score, lines, level, chain: 0, clearingCells: new Set(), phase: "playing" });
      }
      return state;
    }
    default:
      return state;
  }
}

function lockAndCheck(state: GameState): GameState {
  const board = lockPair(state.board, state.current);
  const clearing = findClearingCells(board);
  if (clearing.size > 0) {
    return { ...state, board, phase: "clearing", clearingCells: clearing, flashFrame: 0, chain: 0 };
  }
  const newBoard = applyGravity(board);
  return spawnNext({ ...state, board: newBoard });
}

function spawnNext(state: GameState): GameState {
  const [nextColors, ...rest] = state.next;
  const newPair = spawnPair(nextColors);
  const next = [...rest, randomPair()];
  if (!isValidPosition(state.board, newPair)) {
    return { ...state, phase: "gameover" };
  }
  return { ...state, current: newPair, next };
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function PuyoGame() {
  const [state, dispatch] = useReducer(reducer, undefined, makeInitialState);
  const tickRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const clearTickRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Game tick
  useEffect(() => {
    if (state.phase !== "playing") return;
    tickRef.current = setTimeout(() => dispatch({ type: "TICK" }), dropSpeed(state.level));
    return () => { if (tickRef.current) clearTimeout(tickRef.current); };
  }, [state.current, state.phase, state.level]);

  // Clear animation tick
  useEffect(() => {
    if (state.phase !== "clearing") return;
    clearTickRef.current = setInterval(() => dispatch({ type: "TICK_CLEAR" }), 80);
    return () => { if (clearTickRef.current) clearInterval(clearTickRef.current); };
  }, [state.phase, state.clearingCells]);

  // Keyboard
  const handleKey = useCallback((e: KeyboardEvent) => {
    if (state.phase !== "playing") return;
    switch (e.code) {
      case "ArrowLeft":  e.preventDefault(); dispatch({ type: "MOVE", dx: -1 }); break;
      case "ArrowRight": e.preventDefault(); dispatch({ type: "MOVE", dx: 1 }); break;
      case "ArrowDown":  e.preventDefault(); dispatch({ type: "SOFT_DROP" }); break;
      case "ArrowUp":
      case "KeyZ":       e.preventDefault(); dispatch({ type: "ROTATE", dir: -1 }); break;
      case "KeyX":       e.preventDefault(); dispatch({ type: "ROTATE", dir: 1 }); break;
      case "Space":      e.preventDefault(); dispatch({ type: "HARD_DROP" }); break;
    }
  }, [state.phase]);

  useEffect(() => {
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [handleKey]);

  return (
    <div className="flex items-start justify-center gap-6 select-none">
      {/* Left panel */}
      <div className="flex flex-col gap-4 pt-2">
        <ScorePanel label="SCORE" value={state.score} />
        <ScorePanel label="LEVEL" value={state.level} />
        <ScorePanel label="LINES" value={state.lines} />
        {state.chain > 1 && (
          <div className="text-center animate-bounce">
            <span className="text-2xl font-black text-yellow-300 drop-shadow-[0_0_12px_rgba(253,224,71,0.8)]">
              {state.chain}連鎖!
            </span>
          </div>
        )}
      </div>

      {/* Board */}
      <div className="relative">
        <GameBoard
          board={state.board}
          current={state.phase === "playing" ? state.current : null}
          clearingCells={state.clearingCells}
          flashFrame={state.flashFrame}
        />
        {state.phase === "gameover" && (
          <div className="absolute inset-0 flex flex-col items-center justify-center rounded-2xl bg-black/70 backdrop-blur-sm">
            <p className="text-4xl font-black text-white mb-2">GAME OVER</p>
            <p className="text-zinc-400 mb-6">Score: {state.score.toLocaleString()}</p>
            <button
              onClick={() => dispatch({ type: "RESET" })}
              className="px-8 py-3 rounded-full bg-gradient-to-r from-purple-500 to-blue-500 text-white font-bold text-lg hover:scale-105 active:scale-95 transition-transform"
            >
              もう一度
            </button>
          </div>
        )}
      </div>

      {/* Right panel */}
      <div className="flex flex-col gap-4 pt-2">
        <div className="text-xs font-bold text-zinc-400 tracking-widest mb-1">NEXT</div>
        <NextPuyos pairs={state.next} />
        <div className="mt-6 text-xs text-zinc-500 space-y-1">
          <p>← → 移動</p>
          <p>↑ / Z 反時計回り</p>
          <p>X 時計回り</p>
          <p>↓ ソフトドロップ</p>
          <p>Space ハードドロップ</p>
        </div>
      </div>
    </div>
  );
}

function ScorePanel({ label, value }: { label: string; value: number }) {
  return (
    <div className="bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-center min-w-[90px]">
      <div className="text-xs font-bold text-zinc-400 tracking-widest">{label}</div>
      <div className="text-2xl font-black text-white mt-1">{value.toLocaleString()}</div>
    </div>
  );
}

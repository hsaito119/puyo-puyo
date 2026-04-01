import type { PuyoColor } from "@/lib/types";
import PuyoCell from "./PuyoCell";

interface Props {
  pairs: [PuyoColor, PuyoColor][];
}

export default function NextPuyos({ pairs }: Props) {
  return (
    <div className="flex flex-col gap-3">
      {pairs.map(([top, bottom], i) => (
        <div
          key={i}
          className={`flex flex-col items-center gap-1 p-2 rounded-xl border border-white/10 bg-white/5 transition-all ${
            i === 0 ? "scale-100 opacity-100" : "scale-90 opacity-50"
          }`}
        >
          <div className="w-10 h-10"><PuyoCell color={top} /></div>
          <div className="w-10 h-10"><PuyoCell color={bottom} /></div>
        </div>
      ))}
    </div>
  );
}

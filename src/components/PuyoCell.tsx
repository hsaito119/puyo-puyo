import type { PuyoColor } from "@/lib/types";

const COLOR_STYLES: Record<PuyoColor, { bg: string; glow: string; inner: string }> = {
  red: {
    bg: "from-red-400 to-red-600",
    glow: "shadow-[0_0_12px_rgba(239,68,68,0.8)]",
    inner: "bg-red-300",
  },
  green: {
    bg: "from-green-400 to-green-600",
    glow: "shadow-[0_0_12px_rgba(34,197,94,0.8)]",
    inner: "bg-green-300",
  },
  blue: {
    bg: "from-blue-400 to-blue-600",
    glow: "shadow-[0_0_12px_rgba(59,130,246,0.8)]",
    inner: "bg-blue-300",
  },
  yellow: {
    bg: "from-yellow-300 to-yellow-500",
    glow: "shadow-[0_0_12px_rgba(234,179,8,0.8)]",
    inner: "bg-yellow-200",
  },
  purple: {
    bg: "from-purple-400 to-purple-600",
    glow: "shadow-[0_0_12px_rgba(168,85,247,0.8)]",
    inner: "bg-purple-300",
  },
};

interface Props {
  color: PuyoColor | null;
  flash?: boolean;
  isActive?: boolean;
  isGhost?: boolean;
}

export default function PuyoCell({ color, flash, isActive, isGhost }: Props) {
  if (!color) {
    return <div className="w-full h-full rounded-lg" />;
  }

  const style = COLOR_STYLES[color];

  return (
    <div
      className={`
        w-full h-full rounded-full bg-gradient-to-br ${style.bg}
        ${isGhost ? "opacity-30" : style.glow}
        flex items-center justify-center transition-all duration-75
        ${!isGhost && flash ? "opacity-20 scale-75" : (!isGhost ? "opacity-100 scale-100" : "")}
        ${isActive && !isGhost ? "ring-2 ring-white/40" : ""}
      `}
    >
      {/* Specular highlight */}
      <div
        className={`w-[35%] h-[35%] rounded-full ${style.inner} opacity-70 -translate-x-[20%] -translate-y-[20%]`}
      />
    </div>
  );
}

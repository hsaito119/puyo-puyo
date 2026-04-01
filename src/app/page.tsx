import PuyoGame from "@/components/PuyoGame";

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center py-8 px-4"
      style={{ background: "radial-gradient(ellipse at top, #1e1040 0%, #0a0a0f 60%)" }}
    >
      <h1 className="text-4xl font-black mb-8 tracking-tight"
        style={{
          background: "linear-gradient(135deg, #a78bfa, #60a5fa, #34d399)",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
          filter: "drop-shadow(0 0 20px rgba(167,139,250,0.5))",
        }}
      >
        ぷよぷよ
      </h1>
      <PuyoGame />
    </main>
  );
}

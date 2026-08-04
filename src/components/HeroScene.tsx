import { useEffect, useRef } from "react";
import { useMotionProfile } from "@/hooks/use-motion-profile";

type Node = {
  id: string;
  label: string;
  role: string;
  tint: string;
  /** position inside the scene, in % of the stage box */
  x: number;
  y: number;
  /** depth in px */
  z: number;
};

/**
 * The five Azure services, arranged as the intake → reasoning pipeline of the
 * AI Suite case study rather than an abstract ring.
 */
export const heroNodes: Node[] = [
  {
    id: "speech",
    label: "Speech",
    role: "Voice report in",
    tint: "card-skin",
    x: 2,
    y: 12,
    z: 110,
  },
  { id: "vision", label: "Vision", role: "Photo triage", tint: "card-mint", x: 58, y: 4, z: 70 },
  {
    id: "language",
    label: "Language",
    role: "Urgency + entities",
    tint: "card-lilac",
    x: 64,
    y: 50,
    z: 130,
  },
  {
    id: "rag",
    label: "RAG Search",
    role: "City bylaw lookup",
    tint: "card-sand",
    x: 1,
    y: 56,
    z: 60,
  },
  {
    id: "openai",
    label: "OpenAI",
    role: "Dispatch plan out",
    tint: "card-grey",
    x: 30,
    y: 76,
    z: 150,
  },
];

export function HeroScene() {
  const stageRef = useRef<HTMLDivElement>(null);
  const layerRef = useRef<HTMLDivElement>(null);
  const { reduced, lite } = useMotionProfile();

  useEffect(() => {
    const stage = stageRef.current;
    const layer = layerRef.current;
    if (!stage || !layer || reduced) return;

    const amp = lite ? 0.5 : 1;
    let targetX = 0;
    let targetY = 0;
    let curX = 0;
    let curY = 0;
    let raf = 0;
    let t = 0;
    let active = false;

    const loop = () => {
      t += 0.006;
      // gentle idle drift keeps the scene alive without the pointer
      const idleX = active ? 0 : Math.sin(t) * 4 * amp;
      const idleY = active ? 0 : Math.cos(t * 0.8) * 3 * amp;
      curX += (targetX + idleX - curX) * 0.075;
      curY += (targetY + idleY - curY) * 0.075;
      layer.style.transform = `rotateX(${(-curY).toFixed(3)}deg) rotateY(${curX.toFixed(3)}deg)`;
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);

    const onMove = (e: PointerEvent) => {
      const r = stage.getBoundingClientRect();
      const nx = (e.clientX - r.left) / r.width - 0.5;
      const ny = (e.clientY - r.top) / r.height - 0.5;
      active = true;
      targetX = nx * 22 * amp;
      targetY = ny * 16 * amp;
    };
    const onLeave = () => {
      active = false;
      targetX = 0;
      targetY = 0;
    };

    stage.addEventListener("pointermove", onMove);
    stage.addEventListener("pointerleave", onLeave);
    return () => {
      cancelAnimationFrame(raf);
      stage.removeEventListener("pointermove", onMove);
      stage.removeEventListener("pointerleave", onLeave);
    };
  }, [reduced, lite]);

  return (
    <div ref={stageRef} className="hero-stage" data-tour="orbit">
      <div ref={layerRef} className="hero-layer">
        <div className="hero-core">
          <p className="label-mono text-muted-foreground">AI SUITE</p>
          <p className="mt-1 font-display text-lg leading-none md:text-2xl">Response core</p>
          <p className="mt-2 text-[11px] leading-snug text-muted-foreground">
            One report in · one dispatch plan out
          </p>
          <span aria-hidden className="hero-core-ring" />
          <span aria-hidden className="hero-core-ring hero-core-ring-2" />
        </div>

        {heroNodes.map((n) => (
          <div
            key={n.id}
            className={`hero-node ${n.tint}`}
            style={{
              left: `${n.x}%`,
              top: `${n.y}%`,
              ["--node-z" as string]: `${n.z}px`,
            }}
          >
            <p className="label-mono text-muted-foreground">{n.role}</p>
            <p className="mt-1 font-display text-base leading-none">{n.label}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

export default HeroScene;

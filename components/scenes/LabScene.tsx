"use client";
import { SceneSection } from "@/components/cinematic/SceneSection";
import { Blueprint } from "@/components/transitions/Blueprint";
import { LabObject } from "@/components/lab/LabObject";
import { AutomationSim } from "@/components/lab/AutomationSim";
import { BuildInterface } from "@/components/lab/BuildInterface";

const EXPERIMENTS = [
  { n: "EXP · 01", title: "Objeto 3D interativo", hint: "Arraste para orbitar. Troque o material. Separe as peças.", C: LabObject },
  { n: "EXP · 02", title: "Automação com IA", hint: "Escreva uma mensagem e veja o fluxo classificar, rotear e responder.", C: AutomationSim },
  { n: "EXP · 03", title: "Interface que se constrói", hint: "Controle a timeline do enxame que monta a interface.", C: BuildInterface },
];

export function LabScene() {
  return (
    <SceneSection id="lab" label="Laboratório NicoTech" pinned={false}>
      <div className="relative px-[var(--gutter)] pb-[10svh] pt-[12svh] md:pb-[30svh] md:pt-[24svh]">
        <Blueprint mode="self" cursors={10} className="max-w-3xl">
          <p data-bp className="eyebrow">05 — Laboratório NicoTech</p>
          <h2 data-bp className="display mt-4 text-[clamp(3rem,9vw,8.5rem)]">
            O <span className="text-gold">laboratório.</span>
          </h2>
          <p data-bp className="mt-6 max-w-xl text-lg leading-relaxed text-bone/80">
            Experimentos reais, rodando agora no seu navegador. Nada aqui é vídeo ou imagem estática: toque, arraste, escreva.
          </p>
        </Blueprint>

        <div className="mt-10 grid gap-6 md:mt-20 lg:grid-cols-3">
          {EXPERIMENTS.map(({ n, title, hint, C }) => (
            <Blueprint key={n} mode="self" cursors={8} className="h-full">
              <article className="flex h-full flex-col border border-white/10 bg-graphite/85 p-5 backdrop-blur-md">
                <header data-bp className="mb-5">
                  <p className="font-mono text-[10px] tracking-[0.24em] text-gold">{n}</p>
                  <h3 className="display mt-2 text-4xl">{title}</h3>
                  <p className="mt-2 text-sm text-bone/65">{hint}</p>
                </header>
                <div className="flex-1">
                  <C />
                </div>
              </article>
            </Blueprint>
          ))}
        </div>
      </div>
    </SceneSection>
  );
}

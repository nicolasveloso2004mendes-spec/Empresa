"use client";
import { useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";

/**
 * Experiment 02 — automation pipeline, running for real in the browser.
 * Deterministic rules (no network, no data sent): intent → entities → routing → reply.
 */
type Intent = { key: string; label: string; queue: string; words: string[]; reply: string };
const INTENTS: Intent[] = [
  {
    key: "site",
    label: "Orçamento de site",
    queue: "Comercial · Sites",
    words: ["site", "página", "pagina", "landing", "loja virtual", "portfólio", "portfolio", "institucional"],
    reply: "Perfeito! Para montar o orçamento do seu site, me conta: qual é o seu negócio e você já tem domínio e logo?",
  },
  {
    key: "ads",
    label: "Tráfego pago",
    queue: "Comercial · Tráfego",
    words: ["anúncio", "anuncio", "tráfego", "trafego", "google ads", "instagram", "impulsionar", "campanha", "meta"],
    reply: "Ótimo! Você já anuncia hoje ou seria a primeira campanha? Qual cidade ou região quer alcançar?",
  },
  {
    key: "ai",
    label: "Agente de IA",
    queue: "Projetos · IA",
    words: ["ia", "inteligência", "inteligencia", "agente", "chatbot", "bot", "atendimento automático", "whatsapp", "automação", "automacao", "automatizar"],
    reply: "Dá para automatizar sim. Quantas mensagens você recebe por dia e quais perguntas se repetem mais?",
  },
  {
    key: "support",
    label: "Suporte",
    queue: "Suporte · Prioritário",
    words: ["saiu do ar", "fora do ar", "erro", "quebrou", "não abre", "nao abre", "problema", "bug", "parou"],
    reply: "Entendi, vamos olhar isso agora. Pode me mandar o endereço do site e um print do erro?",
  },
];
const SEGMENTS = ["loja", "restaurante", "clínica", "clinica", "oficina", "transportadora", "salão", "salao", "escritório", "escritorio", "academia", "imobiliária", "imobiliaria", "pet"];
const PRESETS = [
  "Quero um site para minha loja, quanto custa?",
  "Vocês fazem anúncios no Instagram para restaurante?",
  "Preciso de um agente de IA para responder o WhatsApp da clínica",
  "Meu site saiu do ar, é urgente!",
];

type Result = {
  intent: Intent | null;
  confidence: number;
  segment: string | null;
  urgent: boolean;
  queue: string;
  reply: string;
  id: string;
};

function analyze(raw: string): Result {
  const text = raw.toLowerCase();
  let best: Intent | null = null;
  let hits = 0;
  for (const it of INTENTS) {
    // short tokens ("ia", "bot") must match whole words, not "pARA" / "clínICA"
    const h = it.words.filter((w) => (w.length <= 3 ? new RegExp(`(^|[^a-zà-ú])${w}([^a-zà-ú]|$)`).test(text) : text.includes(w))).length;
    if (h > hits) {
      hits = h;
      best = it;
    }
  }
  const urgent = /urgente|agora|hoje|rápido|rapido|socorro|saiu do ar/.test(text);
  const segment = SEGMENTS.find((s) => text.includes(s)) ?? null;
  const confidence = best ? Math.min(0.98, 0.55 + hits * 0.18 + (segment ? 0.06 : 0)) : 0.2;
  const id = "LD-" + (Math.abs([...raw].reduce((a, c) => (a * 31 + c.charCodeAt(0)) | 0, 7)) % 90000 + 10000);
  return {
    intent: best,
    confidence,
    segment,
    urgent: urgent || best?.key === "support",
    queue: best ? best.queue : "Humano · Triagem",
    reply: best ? best.reply : "Obrigado pela mensagem! Vou te passar para um especialista da equipe agora mesmo.",
    id,
  };
}

const STEPS = ["Recebido", "Intenção", "Dados", "Roteamento", "Resposta"];

export function AutomationSim() {
  const [msg, setMsg] = useState(PRESETS[0]);
  const [step, setStep] = useState(-1);
  const [res, setRes] = useState<Result | null>(null);
  const [log, setLog] = useState<string[]>([]);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  const run = () => {
    const text = msg.trim().slice(0, 280);
    if (!text) return;
    timers.current.forEach(clearTimeout);
    const r = analyze(text);
    setRes(r);
    setStep(0);
    const t0 = performance.now();
    const ts = () => `+${String(Math.round(performance.now() - t0)).padStart(4, "0")}ms`;
    const lines = [
      () => `${ts()}  webhook  whatsapp.message  (${text.length} chars)`,
      () => `${ts()}  classify intent=${r.intent?.key ?? "unknown"}  conf=${r.confidence.toFixed(2)}`,
      () => `${ts()}  extract  segment=${r.segment ?? "—"}  urgent=${r.urgent}`,
      () => `${ts()}  route    queue="${r.queue}"  ${r.urgent ? "priority=HIGH" : "priority=normal"}`,
      () => `${ts()}  reply    sent · crm.lead ${r.id} created`,
    ];
    setLog([lines[0]()]);
    for (let i = 1; i < STEPS.length; i++) {
      timers.current.push(
        setTimeout(() => {
          setStep(i);
          setLog((l) => [...l, lines[i]()]);
        }, i * 650),
      );
    }
  };

  return (
    <div className="flex h-full flex-col gap-4">
      <div data-bp>
        <label htmlFor="sim-msg" className="mb-2 block font-mono text-[10px] uppercase tracking-[0.2em] text-bone/55">
          Mensagem do cliente (WhatsApp)
        </label>
        <textarea
          id="sim-msg"
          value={msg}
          maxLength={280}
          onChange={(e) => setMsg(e.target.value)}
          rows={2}
          className="w-full resize-none border border-white/15 bg-void/80 p-3 text-sm text-bone outline-none focus:border-gold"
        />
        <div className="mt-2 flex flex-wrap gap-1.5">
          {PRESETS.map((p) => (
            <button
              key={p}
              onClick={() => setMsg(p)}
              className="min-h-9 border border-white/10 px-2.5 text-left text-[11px] text-bone/65 transition-colors hover:border-gold/60 hover:text-bone"
            >
              {p.length > 34 ? p.slice(0, 34) + "…" : p}
            </button>
          ))}
        </div>
        <button
          onClick={run}
          className="mt-3 min-h-11 w-full bg-gold font-mono text-[11px] font-medium uppercase tracking-[0.22em] text-void transition-colors hover:bg-gold-hi"
        >
          Processar mensagem
        </button>
      </div>

      {/* pipeline */}
      <div data-bp className="relative flex items-center justify-between px-1 py-3" aria-label="Etapas da automação">
        <div className="absolute inset-x-4 top-1/2 h-px -translate-y-1/2 bg-white/10" />
        <motion.div
          className="absolute left-4 top-1/2 h-px -translate-y-1/2 bg-gold"
          animate={{ width: step < 0 ? 0 : `calc(${(step / (STEPS.length - 1)) * 100}% - ${(step / (STEPS.length - 1)) * 2}rem)` }}
          transition={{ duration: 0.6, ease: [0.7, 0, 0.2, 1] }}
        />
        {STEPS.map((s, i) => (
          <div key={s} className="relative flex flex-col items-center gap-2">
            <motion.span
              className="block h-3 w-3 rotate-45 border"
              animate={{
                backgroundColor: i <= step ? "#D4AF37" : "#050505",
                borderColor: i <= step ? "#F2D67B" : "rgba(255,255,255,0.25)",
                scale: i === step ? 1.35 : 1,
              }}
            />
            <span className={`font-mono text-[9px] uppercase tracking-[0.14em] ${i <= step ? "text-gold-hi" : "text-bone/40"}`}>{s}</span>
          </div>
        ))}
      </div>

      <div data-bp className="min-h-[7.5rem] bg-void/80 p-3 font-mono text-[10px] leading-5 text-bone/65" aria-live="polite">
        {log.length === 0 ? <span className="text-bone/35">$ aguardando mensagem…</span> : log.map((l, i) => <div key={i}>{l}</div>)}
      </div>

      <AnimatePresence>
        {res && step >= STEPS.length - 1 && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="grid gap-3 sm:grid-cols-2"
          >
            <div className="border border-gold/30 p-3">
              <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-gold">Resposta enviada</p>
              <p className="mt-1.5 text-sm leading-relaxed text-bone/85">{res.reply}</p>
            </div>
            <div className="border border-white/10 p-3 font-mono text-[10px] leading-5 text-bone/70">
              <p className="text-[9px] uppercase tracking-[0.2em] text-gold">CRM · {res.id}</p>
              <p>intenção: {res.intent?.label ?? "Não identificada"}</p>
              <p>segmento: {res.segment ?? "—"}</p>
              <p>fila: {res.queue}</p>
              <p>prioridade: {res.urgent ? "ALTA" : "normal"}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      <p className="mt-auto font-mono text-[9px] uppercase leading-4 tracking-[0.16em] text-bone/40">
        Simulação local: regras determinísticas rodando no seu navegador. Nada é enviado.
      </p>
    </div>
  );
}

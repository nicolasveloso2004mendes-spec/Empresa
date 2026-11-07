# NicoTech — Cinematic Digital Experience

Portfólio oficial da NicoTech: um filme interativo controlado pelo scroll. É **um único mundo 3D contínuo** (React Three Fiber) por onde a câmera viaja, com uma camada editorial em DOM (GSAP + ScrollTrigger + Lenis) sincronizada por progresso normalizado.

```bash
npm install
npm run dev        # http://localhost:3000
npm run build && npm start
npm run lint       # TypeScript (tsc --noEmit)
npm run capture    # recaptura screenshots REAIS dos projetos (Playwright + ffmpeg)
```

Deploy: importe o repositório na Vercel (preset Next.js, sem variáveis obrigatórias). Opcional: `NEXT_PUBLIC_SITE_URL` com o domínio final (canonical, sitemap, OG). Sem ela, a Vercel usa `VERCEL_PROJECT_PRODUCTION_URL` automaticamente.

---

## 1. Análise do vídeo de referência

O vídeo (42 s, vertical) é **um celular filmando um monitor** com um portfólio aberto. Observado quadro a quadro:

| Observado no site do vídeo | Como foi traduzido aqui |
|---|---|
| Um **enxame de cursores** entra na tela vazia | `components/transitions/Blueprint.tsx`: cursores voam das bordas |
| Os cursores **desenham wireframes** com etiquetas de medida (`450 × 120`), cantos com alças | Caixas douradas medidas do elemento real, com alças e etiqueta `W × H` |
| O conteúdo real **materializa dentro do wireframe** e o andaime some | `clip-path` revela o conteúdo; as caixas e os cursores se dissolvem |
| O ciclo se repete a cada seção | Hero (CTA), Lab (todos os painéis), Final (botão START A PROJECT) e o **EXP 03 do Lab**, onde o visitante controla essa timeline |
| Tipografia condensada gigante, fundo quase preto, uma cor de destaque | Anton display + paleta preto/dourado da NicoTech |

**Limitações honestas:** o movimento de câmera em perspectiva do vídeo vem do celular, não do site. Não há WebGL nem dolly no site filmado. A direção de câmera 3D daqui (dolly, órbita, tracking, travessia do símbolo) atende ao briefing e não copia o vídeo. As cores do site do vídeo (vermelho/ciano) não foram usadas, só a linguagem de movimento.

## 2. Storyboard (o que o scroll controla)

| # | Cena | Câmera / 3D | DOM |
|---|---|---|---|
| 00 | **Intro** (`intro`, 2.6 vh) | Tela preta → nasce uma luz dourada no centro (tempo) → a luz varre o monograma metálico → scroll: dolly in, **o símbolo se abre como uma porta** e a câmera atravessa | "NICOTECH" surge com a luz; "WE CREATE DIGITAL EXPERIENCES." no scroll; flash dourado na travessia |
| 01 | **Hero** | Órbita de 0 → 0,85 rad ao redor da escultura; a escultura gira, abre as placas com o scroll e se inclina para o cursor | "BEYOND / THE DIGITAL." com máscaras; CTA montado pelo Blueprint |
| 02 | **Manifesto** | Recua da escultura, o ambiente escurece (fog + exposição), avança por um campo de 300 fragmentos que **explodem** em sincronia com o texto | "WE DON'T JUST BUILD WEBSITES." se fragmenta em 3D → "WE BUILD EXPERIENCES." se monta |
| 03 | **Showcase** (1 cena por projeto, 4.6 vh) | Aproximação → a tampa do notebook abre → órbita revela o cliente → push-in até **a tela ocupar o viewport, rolando o site real** → recuo, o celular sobe com a versão mobile | Nome do cliente, leitura "Live capture %", controles Desktop/Mobile (trava a câmera), Detalhes (gaveta), Estudo de caso, Abrir site |
| 04 | **Capabilities** (6.5 vh) | Travelling lateral por 6 metáforas: painéis flutuantes, nó metálico, rede neural, fluxo de dados com pacotes, painéis/barras em perspectiva, giroscópio | Lista 01–06 sincronizada com a câmera; clique leva a câmera ao serviço |
| 05 | **Lab** (fluxo normal) | Piso blueprint infinito | EXP 01 objeto 3D manipulável · EXP 02 pipeline de automação · EXP 03 interface que se constrói |
| 06 | **Final** | Escuridão → a luz dourada sobe e revela a marca | "LET'S BUILD / SOMETHING / EXTRAORDINARY." + START A PROJECT (abre o Instagram) |

## 3. Arquitetura

```
app/                      layout (fontes, metadata), page, /projetos/[slug], sitemap, robots
components/cinematic/     Experience (orquestra), SceneSection (cena pinada + timeline), SmoothScroll (Lenis↔GSAP), Header, Hud, Loader
components/scenes/        Intro, Hero, Manifesto, Work, Capabilities, Lab, Final, Footer
components/three/         Stage (canvas único), DirectorRig, Logo3D, Sculpture, Shards, ProjectStage, Capabilities3D, Dust, LabFloor, Effects
components/transitions/   Blueprint (assinatura de movimento do vídeo)
components/lab/           LabObject, AutomationSim, BuildInterface
components/ui/            LogoMark, ProjectDetails
data/                     site (canal de contato), projects, capabilities
hooks/                    useDeviceTier (WebGL, tier, reduced motion)
lib/animation/            store (estado compartilhado), director (câmera/luz por cena), world (layout 3D), gsap, math
```

### Como GSAP e R3F convivem sem conflito
- `lib/animation/store.ts` é um objeto mutável simples. **O GSAP só escreve** progresso 0..1 por cena. **O R3F só lê**, dentro de `useFrame`. Nenhum estado React entra no caminho quente.
- `lib/animation/director.ts` é a "folha de direção": uma função pura `progresso → plano` (posição, alvo, luz principal, exposição, fog). Para mudar o timing do filme, mexa aqui.
- `DirectorRig` aplica o plano com amortecimento crítico (`maath/easing.damp3`). O scroll dá a intenção, o rig dá a inércia, e saltos (cliques no menu) viram voos de câmera.
- Cenas pinadas usam `position: sticky` (estável com Lenis) e se sobrepõem por 1 viewport, então o progresso passa de uma cena para a próxima sem gap.

## 4. Adicionar um projeto
1. Adicione o objeto em `data/projects.ts` (slug único, textos **reais** do site).
2. Adicione `{ slug, url }` em `scripts/capture-projects.mjs` e rode `npm run capture`. O script gera capturas reais (desktop, página longa, mobile, mobile longo) e converte para WebP ≤ 4096 px (limite seguro de textura).
3. Pronto: cena 3D exclusiva, rota `/projetos/<slug>`, sitemap, HUD e rodapé são gerados automaticamente.

## 5. Performance e acessibilidade
- Um só canvas, `dpr` limitado por tier (1.75 / 1.4 / 1.15), `PerformanceMonitor` reduz o `dpr` e desliga a profundidade de campo se o FPS cair.
- Instancing: placas da escultura, fragmentos, nós, pacotes e barras são um draw call cada. A poeira é um shader que se recicla em volta da câmera.
- Visibilidade por cena: só a cena ativa e as vizinhas renderizam.
- Ambiente PBR procedural (`Lightformer`): nenhum HDR baixado. Texturas WebP com cache imutável. O WebGL fica em chunk separado (`next/dynamic`, `ssr: false`).
- Pós-processamento: bloom, DOF que segue o foco da câmera (só desktop forte), grão e vinheta. Desligado no tier baixo.
- **Fallback sem WebGL** (ou `?lite` na URL): fundo estático e capturas reais em molduras CSS, ainda guiadas pelo scroll.
- `prefers-reduced-motion`: sem Lenis, sem autoplay, sem Blueprint, câmera sem voo longo.
- Teclado: foco visível, HUD navegável, gaveta de detalhes com focus trap e Esc. Alvos ≥ 44 px, `lang="pt-BR"`.
- Headers de segurança (CSP, HSTS, nosniff, Referrer-Policy, Permissions-Policy, X-Frame-Options) em `next.config.ts`.

## 6. Honestidade dos dados
- As capturas dos projetos são **reais**, feitas dos sites publicados.
- Os textos dos estudos de caso foram tirados dos próprios sites. Nenhuma métrica, depoimento ou número foi inventado.
- EXP 02 do Lab é uma **simulação local**: regras determinísticas no navegador, sem IA real e sem envio de dados. Isso está escrito no próprio painel.

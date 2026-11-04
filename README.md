# BBM Imports — Showroom 3D

Site da BBM Imports com um **showroom 3D interativo de smartphones**: modelos GLB/GLTF reais
renderizados em tempo real no navegador (Three.js + React Three Fiber + Drei), com rotação 360°,
zoom limitado, troca de cores com transição, hotspots com ficha técnica, tela cheia, vistas
rápidas, scroll storytelling (GSAP ScrollTrigger) e painel administrativo para cadastrar
aparelhos e enviar modelos 3D.

> **Modelos atuais são demonstrativos.** Os cinco arquivos em `public/models/` (`demo-pro`,
> `demo-compact`, `demo-ultra`, `demo-round`, `demo-fold`) são geometrias e texturas originais
> geradas por código (`scripts/build-demo-models.mjs` + `scripts/lib/textures.mjs`), sem direitos de
> terceiros. Cada um é um arquétipo de formato (linha Pro, padrão, Android ultra com caneta,
> câmera circular com traseira em couro, dobrável tipo livro). Elas **não** representam fielmente nenhum iPhone. A interface mostra o selo
> “Modelo 3D demonstrativo” e as fichas técnicas aparecem como “não verificadas”. Substitua pelos
> arquivos definitivos (licenciados) pelo painel.

## Rodar localmente

```bash
npm install            # também copia os decoders Draco/KTX2 para public/decoders
cp .env.example .env.local   # preencha as variáveis
npm run dev            # http://localhost:3000
```

Produção: `npm run build && npm start`.

### Variáveis de ambiente

| Variável | Obrigatória | Descrição |
| --- | --- | --- |
| `NEXT_PUBLIC_WHATSAPP_NUMBER` | sim (antes de publicar) | Número da BBM com DDI+DDD, só dígitos (ex.: `5511999999999`). Sem ele, os botões abrem o WhatsApp para o visitante escolher o contato. |
| `ADMIN_PASSWORD` | para o painel | Senha do `/admin` (12+ caracteres). Sem ela o painel fica desativado. |
| `SESSION_SECRET` | para o painel | 32+ caracteres aleatórios para assinar a sessão. |
| `NEXT_PUBLIC_SITE_URL` | sim | URL pública (canonical, sitemap). |
| `MAX_MODEL_MB` | não | Limite de upload de modelos (padrão 25 MB). |
| `PRODUCTS_FILE` / `UPLOAD_DIR` | não | Caminhos alternativos do arquivo de produtos e dos uploads. |

## Estrutura

```
src/
  app/
    page.tsx                  Home: hero cinematográfica + storytelling + catálogo
    showroom/[slug]/          Showroom de tela ampla (visualizador + painel de compra)
    produtos/, produtos/[slug]  Catálogo e página do produto
    admin/                    Painel (login, lista, editor com preview 3D)
    api/admin/*               Login, CRUD de produtos, upload (autenticados)
    api/models|uploads/[file] Entrega dos arquivos enviados (nome UUID validado)
  components/three/
    Product3DViewer.tsx       Componente reutilizável do visualizador
    PhoneModel.tsx            Carrega o GLB, clona materiais, transição de cor
    CameraRig.tsx             OrbitControls com limites e voos de câmera
    Hotspots.tsx              Marcadores 3D (ocultos quando de costas)
    Studio.tsx                Environment map procedural, luzes, sombras de contato
  lib/schema.ts               Estrutura de dados (zod) de produto/variante/hotspot
data/products.json            Produtos cadastrados
scripts/build-demo-models.mjs Gera os GLBs demonstrativos (Draco)
scripts/e2e.cjs               Testes de aceitação (Playwright)
```

### Estrutura de dados do produto

Cada produto (`src/lib/schema.ts`) tem: identificador, slug, nome, condição, publicado,
`demo`, `model` (url do GLB, escala, posição, rotação, materiais que recebem a cor, material
da tela), `camera` (FOV, câmera inicial, frontal, traseira, lateral, zoom mín./máx.), `colors`
(nome, swatch, disponível, acabamento por material, `modelUrl` opcional quando a variante tem
geometria/textura própria), `capacities` (rótulo, preço ou `null`, disponível), `hotspots`
(posição e normal no espaço local do modelo, câmera de foco, ficha técnica, `verified`) e
`specs`.

## Categorias

`data/categories.json` (editável em **/admin → Categorias**): iPhone, Samsung Galaxy, Xiaomi e
Dobráveis vêm cadastradas. O catálogo mostra abas só das categorias com produtos publicados, cada
categoria tem página própria (`/categorias/<slug>`) e o showroom prioriza aparelhos da mesma
categoria na navegação. Uma categoria com produtos não pode ser excluída.

## Peças móveis (dobráveis)

`model.articulations` descreve nós do GLB que giram: cada articulação tem um valor 0..1 que
interpola o ângulo de cada parte (`node`, `axis`, `from`, `to` em radianos) e, opcionalmente,
desloca o modelo inteiro (`shift`) para mantê-lo centralizado. O visualizador mostra um botão e
um controle deslizante ("Abrir"/"Fechar"). Hotspots podem depender da articulação
(`hotspot.articulation = { id, value }`): somem quando o aparelho está na posição errada e, ao
serem escolhidos, abrem/fecham o aparelho antes do voo da câmera. Para um dobrável real, nomeie
no arquivo 3D o nó da metade móvel (ex.: `FoldHinge`) com o pivô na dobradiça.

## Realismo dos modelos demonstrativos

- Cantos contínuos (superelipse), laterais retas ou curvas por arquétipo.
- Materiais físicos glTF: verniz (clearcoat) em vidros e lentes, anisotropia no metal escovado,
  IOR de safira nas lentes, *sheen* no couro.
- Texturas procedurais WebP (EXT_texture_webp): metal escovado, vidro jateado, couro granulado,
  revestimento das lentes e microlentes do flash.
- Regerar: `npm run models:build` (ou `node scripts/build-demo-models.mjs fold` para um só) e, com
  o servidor rodando, `node scripts/render-posters.cjs` para as imagens do catálogo.

## Preparando um modelo definitivo

1. Use apenas arquivos com licença de uso comercial.
2. Exporte em **GLB** (glTF 2.0, autocontido). Nomeie os materiais (ex.: `Frame`, `BackGlass`)
   para poder trocar cores por material.
3. Comprima: `npx @gltf-transform/cli optimize in.glb out.glb --compress draco --texture-compress ktx2`
   (ou `--compress meshopt`). O visualizador decodifica Draco, Meshopt e KTX2.
4. No painel: **Cadastrar smartphone → Modelo 3D → enviar arquivo**, clique em
   “Auto-ajustar”, marque os materiais que recebem a cor, defina as câmeras com
   “Usar câmera atual”, cadastre hotspots com “Posicionar no modelo”, preencha as cores,
   capacidades e preços e marque **Publicado**.
5. Só marque um hotspot como **verificado** depois de conferir os dados com a ficha oficial.

## Segurança do painel

- Sessão assinada com HMAC-SHA256, cookie `HttpOnly`, `SameSite=Strict`, `Secure` em produção, 8 h.
- Limite de 5 tentativas de login por IP a cada 15 min; comparação em tempo constante; honeypot.
- Todas as rotas `/api/admin/*` verificam sessão e origem (CSRF).
- Upload: limite de tamanho, verificação de assinatura binária (GLB `glTF` v2, PNG/JPG/WebP),
  JSON do glTF analisado, recursos externos recusados, nome aleatório (UUID), gravado fora de
  `/public` com permissão 0640 e servido com `Content-Type` fixo e `nosniff`.
- Headers: CSP restrita ao próprio domínio, HSTS, `X-Frame-Options`, `Referrer-Policy`,
  `Permissions-Policy`.

## Hospedagem

O armazenamento atual é em disco (`data/products.json` e `storage/uploads/`), ideal para VPS,
Docker ou qualquer servidor Node com disco persistente. **Na Vercel o disco é somente leitura**:
o site público funciona, mas o painel não consegue salvar. Para Vercel, troque
`src/lib/store.ts` e `src/lib/files.ts` por um banco (ex.: Postgres) e um storage de objetos
(ex.: Vercel Blob / S3) — as interfaces já estão isoladas nesses dois módulos.

## Otimização

- 3D carregado só no cliente (`next/dynamic`), depois do HTML; a home carrega apenas o modelo em destaque.
- Draco / Meshopt / KTX2 com decoders servidos localmente (`public/decoders`).
- Pixel ratio limitado (1,5 em telas de toque, 2 no desktop) e resolução adaptativa (`PerformanceMonitor`).
- Renderização suspensa quando o visualizador sai da tela ou a aba fica oculta.
- Fallback com imagem estática sem WebGL; tratamento de falha de carregamento e de perda de contexto com “Tentar novamente”.
- `prefers-reduced-motion`: sem introdução animada, sem rotação automática, transições instantâneas e storytelling estático.

## Testes

```bash
npm run typecheck && npm run lint && npm test         # tipos, lint, testes unitários
npm run build && npm start &                          # servidor
ADMIN_PASSWORD=... npm run e2e                        # aceitação (Playwright)
```

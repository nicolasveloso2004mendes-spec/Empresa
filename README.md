# Quick Pack · Babadopulos Embalagens — site

Site de página única para gerar pedidos de orçamento pelo WhatsApp.
Feito com Next.js 16 (App Router), React 19 e TypeScript. Não tem backend, rastreadores nem banco de dados.

## Executar

```bash
npm install
npm run dev        # http://localhost:3000
npm run build && npm start   # versão de produção
npm run lint && npm run typecheck
```

Requer Node 20.9 ou mais recente.

## Publicar na Vercel

1. Envie o repositório para o GitHub e, na Vercel, use **Add New → Project** e importe o repositório. O framework é detectado como Next.js; não é preciso mudar nenhuma configuração de build.
2. (Opcional, recomendado quando houver domínio) Em **Settings → Environment Variables**, crie `NEXT_PUBLIC_SITE_URL` com a URL definitiva, sem barra no final (ex.: `https://www.seudominio.com.br`). Isso ativa canonical, sitemap e a URL no JSON-LD. Sem ela, o site não declara canonical, para não apontar para o domínio atual.
3. Faça o deploy e, se quiser, conecte o domínio em **Settings → Domains**.

## Estrutura

```
app/            layout (SEO, fontes), page, estilos globais, robots, sitemap, ícone
components/
  PackagingBox3D/   caixa 3D interativa (componente reutilizável + CSS Module isolado)
  Header, Hero, Applications, ProductLine, CustomSize, About (+HowTo),
  QuoteForm, Faq, Contact (+Footer), MobileCta, Illustrations, Wordmark
lib/
  site.ts          dados da empresa, aplicações, linhas de embalagem e materiais  ← edite textos aqui
  whatsapp.ts      validação e montagem da mensagem do WhatsApp
  quote-context.tsx estado do orçamento compartilhado entre seções (somente em memória)
  seo.ts           dados estruturados (LocalBusiness)
```

## PackagingBox3D

Componente convertido de `caixa-3d.html`. Mantém do original a geometria (280 × 220 × 200 px), a textura kraft, os pivôs das quatro abas, os ângulos aberta/fechada, a rotação por arraste e o controle de ângulo.

```tsx
<PackagingBox3D
  frontPrint={<MinhaArte />}   // impressão na face frontal
  sidePrint={<Simbolos />}     // impressão na lateral direita
  initialRotation={-28}
  initialTilt={-22}
  autoOpen                      // abre uma única vez quando visível
  label="Caixa de papelão em 3D"
/>
```

- Aparece fechada, faz uma entrada curta e abre as abas uma vez. Depois disso não há nenhum movimento automático.
- Arraste horizontal, setas do teclado (Shift gira 45°), Home restaura a vista. Também há botões Abrir/Fechar e Restaurar vista e um controle deslizante de ângulo.
- No desktop, a caixa reage levemente ao cursor. Isso acontece numa camada separada da rotação manual e fica desligado durante o arraste.
- No celular, a escala se ajusta à largura disponível, a rolagem vertical continua livre (`touch-action: pan-y`) e o objeto fica contido na área reservada.
- Com `prefers-reduced-motion`, a caixa já aparece aberta e não há entrada, abertura automática, reação ao cursor nem transições. Abrir e fechar continuam funcionando, só que sem animação.
- Fora da tela, a abertura automática e a reação ao cursor ficam pausadas.
- Se o navegador não suportar `transform-style: preserve-3d`, aparece uma ilustração estática em SVG.
- Todos os listeners, observers e temporizadores são removidos quando o componente é desmontado.

## Pendências de conteúdo (cliente)

- **Logotipo oficial**: o site usa a assinatura tipográfica provisória da demonstração (`components/Wordmark.tsx` e a impressão da caixa em `components/Hero.tsx`). Substituir quando houver arquivo vetorial (SVG).
- **Fotografias reais** de produtos e da operação: hoje as embalagens aparecem como ilustrações vetoriais, identificadas como tal.
- Horário de atendimento, para incluir no site e no JSON-LD.
- Imagem Open Graph própria (1200 × 630), para compartilhamento.

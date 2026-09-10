# Auditoria de UX / UI — Liplip

Data: 2026-09-10. Âmbito: `src/app`, `src/components`, `src/app/globals.css`.
Método: revisão de código em 4 dimensões (acessibilidade, responsividade, formulários/feedback,
consistência visual/microcopy) + captura de ecrãs reais (desktop 1280px e telemóvel 390px).

## Veredito

Plataforma num bom nível. Sistema de componentes disciplinado (`SubmitButton`, `ConfirmButton`,
`flash`/`FlashFromSearch`, `useActionState`), landing forte, fluxos do convidado bem feitos para
telemóvel, sem XSS refletido, `<html lang="pt">` correto. Os problemas são concentrados e
corrigíveis; nenhum é estrutural.

## Prioridades

### P0 — Bloqueios (corrigir já)

1. **Perda de dados no assistente de novo evento.** `NewEventWizard.tsx` — os campos do passo 3
   (nomes, data, local, mensagem) são não-controlados e sem `defaultValue`; ao voltar a um passo
   anterior e avançar, o passo 3 é desmontado e reaparece vazio, apesar de a pré-visualização
   ainda mostrar o texto. Corrigir com `defaultValue={draft.X}` (o estado `draft` já sobrevive).
2. **Rótulos de formulário não associados (acessibilidade).** Padrão `<label className="label">` sem
   `htmlFor` e `<input>` sem `id` em: `EventForm.tsx`, `account/page.tsx`, `guests/page.tsx`,
   `guests/[guestId]/page.tsx`, `vendors/page.tsx`, `budget/page.tsx`, `gifts/page.tsx`,
   `tasks/page.tsx`, `team/page.tsx`, `content/page.tsx`, `design/page.tsx` (input de cor).
   Leitores de ecrã não anunciam o nome do campo; clicar no rótulo não foca o campo.
3. **Campos do convidado sem nome acessível.** `GuestbookForm.tsx` (textarea só com placeholder) e
   `CheckinForm.tsx` (código de bilhete só com placeholder). Adicionar `aria-label`/`<label>`.

### P1 — Importante

4. **Estados de carregamento em falta (duplo-envio/sem feedback).** Botões simples (não `SubmitButton`)
   em: check-in (`checkin/page.tsx`, `CheckinForm.tsx`), receção (`r/[token]/page.tsx`),
   "Alterar palavra-passe" (`account/page.tsx`), "Completar checklist" (`tasks/page.tsx`).
   O check-in à porta é a interação mais frequente — duplo toque inverte o estado.
5. **Ação destrutiva sem confirmação.** "Remover dispositivos" (`guests/[guestId]/page.tsx`) —
   único botão sensível da página sem `ConfirmButton`.
6. **Contraste abaixo de WCAG AA.** Token `--color-muted: #8c7b87` (~3,7:1) e greys ad-hoc para texto
   pequeno: `#a1939c` (`NotificationsBell.tsx`), `#8c7585` (`ui/index.tsx` StatCard), `#95818f`/`#9e8d96`
   (`page.tsx`, `TemplatePicker.tsx`). Escurecer o token e alinhar os hex.
7. **Admin não consegue terminar sessão no telemóvel.** `admin/layout.tsx` — o bloco de logout é
   `hidden ... lg:flex` sem alternativa mobile (o painel do cliente tem o botão "Sair" em `lg:hidden`).
8. **Toque do convidado pequeno na conversão.** `GiftList.tsx` — "Reservar"/"Quero contribuir" em
   `btn-sm` (~28px), abaixo do mínimo ~40px, na ação principal do convite.
9. **Sem `<h1>` nos convites da colecção 2026.** `InvitationArt.tsx` desenha os nomes como `<h3>`; as
   secções usam `<h2>`. Adicionar um `<h1>` (visível ou `sr-only`) ao cartaz.
10. **Sem foco visível ao navegar templates por teclado.** `design/page.tsx` — radio `sr-only` com
    `peer-checked:ring` mas sem `peer-focus-visible:ring`.
11. **"Hora de fim" é texto livre.** `EventForm.tsx` — sem `type="time"`.

### P2 — Consistência (dívida de design-system)

- **Cor "muted" hardcoded em ~6 valores concorrentes** em vez do token `text-muted` (30+ ocorrências).
- **Paletas de badges de estado copiadas** em 10+ ficheiros; só existe `RsvpBadge`. Criar `StatusBadge`.
- **Voz da marca mistura 1ª e 2ª pessoa** ("A minha conta"/"Os meus eventos" vs "As suas celebrações").
- **A secção "Eventos" tem 3 nomes** (nav "Eventos", título "As suas celebrações", link "Os meus eventos").
- **Logout com 2 rótulos** ("Sair" vs "Terminar sessão") e afordâncias diferentes.
- **`PageHeader` não usado** em 2 títulos de topo; **títulos de cartão** misturam Fraunces e Inter.
- **Grelha de templates duplicada** em 3 páginas com raios de canto diferentes (`xl`/`2xl`/`3xl`).
- **Círculo de avatar / número** e **pills de filtro** duplicados; extrair componentes.

### P3 — Polimento

- `strokeWidth` de ícones inconsistente (1.25/1.5/1.75/2) — padronizar em 1.75.
- Escala de raios inconsistente para superfícies semelhantes.
- `text-stone-*` em vez de greys da marca em alguns sítios.
- Vários tamanhos de texto <12px em rótulos secundários (telemóveis de gama baixa).
- Estados vazios em `<p>` simples em vez de `EmptyState` (várias listas).
- Wordmark `.wordmark` ignora `text-white` no `/admin-login` (fundo escuro) — baixo contraste.
- Pill ativo da navegação mobile é cortado na margem direita (falta `pr` no contentor com scroll).
- Mensagens `?ok=`/`?error=` ficam no URL após o redirect (banner "preso" ao recarregar).

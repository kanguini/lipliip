# Lipliip · Convites digitais

Plataforma web para criar e enviar convites digitais **pessoais e intransmissíveis** para casamentos, noivados, aniversários e outros eventos, com confirmação de presença, lista de presentes, livro de mensagens e check-in por QR code.

## Funcionalidades

**Para quem organiza**
- Conta própria; vários eventos por conta.
- Assistente de criação: tipo de evento → template → detalhes (nomes, data, local, mensagem, programa do dia, dress code, foto de capa, cor personalizada).
- 5 templates: Clássico Elegante, Botânico, Moderno Minimal, Festa Colorida e Noite Dourada.
- Gestão de convidados: adicionar um a um ou importar lista colada do Excel (`Nome; Telefone; Acompanhantes; Grupo`), limite de acompanhantes por convidado, grupos, mesa.
- Envio do link pessoal por **WhatsApp** (mensagem pré-escrita), **SMS** (via fornecedor configurável) ou cópia do link; registo de "enviado / aberto / validado".
- Painel com estatísticas: confirmados, pessoas previstas, sem resposta, presentes reservados, contribuições.
- Lista de presentes com produtos reserváveis (quantidade, preço, link da loja, imagem) e contribuições em dinheiro (IBAN / MB WAY / valor livre).
- Livro de mensagens moderado.
- Check-in no dia do evento: leitura do QR code pela câmara ou código curto, aviso de entrada duplicada, contagem de quem já entrou.
- Histórico de acessos por convidado e alerta de tentativas suspeitas; revogar e regerar link; remover dispositivos.

- Conteúdo do convite: história (linha do tempo com fotos), galeria, padrinhos/madrinhas, música de fundo, hashtag, informações úteis (alojamento, transporte).
- Plano de mesas, lembretes por WhatsApp a quem não respondeu, exportação para Excel/CSV, lista de músicas pedidas e restrições alimentares.

**Para o convidado**
- Link pessoal `/c/<token>`; para abrir tem de validar o telemóvel com um código SMS (OTP).
- Envelope animado de abertura, música de fundo, contagem decrescente ao segundo, mapa, "adicionar ao calendário" (Google ou .ics), programa, história, galeria, padrinhos.
- RSVP: sim/não, número e nomes dos acompanhantes (dentro do limite), restrições alimentares, pedido de música, mensagem; pode alterar até ao prazo.
- Lista de presentes: reservar um produto (desaparece para os outros) ou contribuir com um valor; QR code de transferência SEPA (EPC) gerado a partir do IBAN.
- Livro de mensagens e QR code de entrada pessoal.

## Como os convites ficam intransmissíveis

1. **Link nominativo e imprevisível** por convidado (token aleatório de 192 bits). Nunca há um link "geral" do evento.
2. **Validação por telemóvel (OTP)**: ao abrir o link pela primeira vez num dispositivo, é enviado um código de 6 dígitos por SMS para o número que o organizador registou. Quem recebeu o link reencaminhado não recebe o código. O código expira em 10 minutos, permite 5 tentativas e no máximo 3 envios por 10 minutos.
3. **Limite de dispositivos**: cada validação bem sucedida autoriza um dispositivo (cookie `httpOnly` ligada ao convidado). O organizador define quantos dispositivos são permitidos (por omissão 2). Acima disso, o acesso é bloqueado e registado.
4. **Histórico e alertas**: todas as aberturas, envios de código, falhas e bloqueios ficam no histórico do convidado. O organizador pode remover dispositivos ou **revogar o link** e gerar outro.
5. **Check-in individual**: o QR/código de entrada é único e só vale uma vez; uma segunda leitura dispara aviso de entrada duplicada.
6. O organizador pode desligar a validação por SMS num evento (ex.: festa informal) nas Definições.

> Nota: nenhum sistema impede uma captura de ecrã. O que se garante é que o **acesso ao convite e a entrada no evento** ficam ligados ao telemóvel e à identidade do convidado.

## Segurança e fiabilidade

- URLs fornecidos pelo organizador (fotos, loja, mapa, música) só são aceites em http(s); nunca `javascript:` ou `data:`.
- Limite de tentativas em login, registo e pedidos de código SMS, por IP (em memória; com várias réplicas use Redis).
- Cabeçalhos de segurança (`X-Frame-Options`, `nosniff`, `Referrer-Policy`), `robots.txt` a excluir convites e painel dos motores de busca.
- Exportação CSV protegida contra injeção de fórmulas no Excel.
- Datas guardadas em UTC e mostradas sempre no fuso horário do evento (configurável por evento), incluindo contagem decrescente, .ics e Google Calendar.
- Ações destrutivas (eliminar evento/convidado/presente, revogar link) pedem confirmação. Alterar a palavra-passe termina todas as sessões.

## Stack

- [Next.js 15](https://nextjs.org) (App Router, Server Actions) + React 19 + TypeScript
- Tailwind CSS 4
- Prisma 6 com PostgreSQL
- Autenticação própria por sessão (cookie `httpOnly`) com `bcryptjs`
- `libphonenumber-js` para normalizar telefones (E.164), `qrcode` para os QR de entrada
- Vitest para testes unitários

## Começar

```bash
docker run -d --name lipliip-db -e POSTGRES_PASSWORD=lipliip -e POSTGRES_DB=lipliip -p 5432:5432 postgres:16
cp .env.example .env      # ajuste APP_URL, SMS_PROVIDER, etc.
npm install               # gera o Prisma Client
npm run db:push           # cria as tabelas
npm run db:seed           # (opcional) conta demo@lipliip.pt / demo12345 com eventos de exemplo
npm run dev               # http://localhost:3000
```

Em desenvolvimento, com `SMS_PROVIDER=console` e `SHOW_OTP_IN_DEV=true`, o código OTP aparece no terminal e no próprio ecrã do convidado, para testar sem gastar SMS.

Testes: `npm test`. Build de produção: `npm run build && npm start`.

## Deploy no Railway

O repositório inclui `railway.json`: build com `npm run build` e arranque com `npm run start:railway` (aplica o esquema à base de dados e inicia o servidor). Serviços necessários:

- **Postgres** (imagem `postgres:16` com volume em `/var/lib/postgresql/data`, `PGDATA=/var/lib/postgresql/data/pgdata`).
- **Web** ligado a este repositório, com as variáveis `DATABASE_URL` (via rede privada, ex.: `postgresql://postgres:<senha>@postgres.railway.internal:5432/railway`), `APP_URL` (o domínio público), `SMS_PROVIDER` e, para SMS reais, as credenciais Twilio.

## Configuração de SMS

| Variável | Descrição |
| --- | --- |
| `SMS_PROVIDER` | `console` (dev) ou `twilio` |
| `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN` | credenciais Twilio |
| `TWILIO_FROM` | número remetente; use `whatsapp:+1415…` para enviar o OTP por WhatsApp |

Outros fornecedores (Vonage, Infobip, Africa's Talking, operadora local) implementam a interface `SmsProvider` em `src/lib/sms.ts`.

## Estrutura

```
prisma/schema.prisma        modelo de dados (User, Event, Guest, GuestDevice, OtpCode, AccessLog, GiftItem, GiftReservation, GuestbookEntry)
src/app/(auth)              registo / login
src/app/dashboard           painel do organizador (eventos, convidados, presentes, mensagens, check-in, design, definições)
src/app/c/[token]           convite do convidado (OTP, RSVP, presentes, livro, QR, .ics)
src/app/preview/[template]  pré-visualização pública dos templates
src/components/templates    os 5 templates visuais
src/components/invite       secções do convite (RSVP, presentes, livro, OTP)
src/lib                     domínio: auth, tokens/OTP, telefones, SMS, CSV, ICS, templates
tests/                      testes unitários
```

## Ideias para as próximas versões

- Envio de convites por email e lembretes automáticos (ex.: 7 dias antes do prazo de RSVP) aos que não responderam.
- Save the date antes do convite completo; mudança de última hora com notificação a todos os confirmados.
- Upload direto de fotos de capa e galeria pós-evento partilhada com os convidados.
- Plano de mesas visual com arrastar e largar, exportação para Excel/PDF da lista de presenças e das restrições alimentares.
- Pagamentos integrados na lista de presentes (Stripe, MB WAY, Multicaixa Express) com recibo automático.
- Multi-idioma do convite (PT/EN/FR) escolhido por convidado.
- Sub-eventos (jantar de ensaio, brunch) com listas de convidados diferentes.
- Planos pagos: marca de água nos convites gratuitos, domínio personalizado, remoção do "criado com Lipliip".

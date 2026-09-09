/** Checklists por tipo de evento. `days` = dias antes do evento em que a tarefa deve estar feita. */
export type ChecklistItem = { title: string; category: string; days: number; description?: string };

const WEDDING: ChecklistItem[] = [
  { title: "Definir orçamento global e quem contribui", category: "Orçamento", days: 365 },
  { title: "Escolher a data e reservar o local da cerimónia", category: "Local", days: 330 },
  { title: "Reservar o espaço da festa", category: "Local", days: 320 },
  { title: "Contratar fotógrafo e vídeo", category: "Fotografia", days: 300 },
  { title: "Escolher e contratar catering", category: "Catering", days: 270 },
  { title: "Contratar DJ ou banda", category: "Música", days: 240 },
  { title: "Fazer a lista de convidados com contactos", category: "Convidados", days: 210 },
  { title: "Escolher vestido / fato", category: "Vestuário", days: 200 },
  { title: "Escolher padrinhos e madrinhas", category: "Cerimónia", days: 180 },
  { title: "Reservar alojamento para convidados de fora", category: "Logística", days: 150 },
  { title: "Tratar dos documentos (conservatória / igreja)", category: "Cerimónia", days: 120 },
  { title: "Decoração e flores: fechar proposta", category: "Decoração", days: 120 },
  { title: "Criar a lista de presentes", category: "Presentes", days: 100 },
  { title: "Preparar e enviar os convites", category: "Convidados", days: 70 },
  { title: "Encomendar o bolo", category: "Catering", days: 60 },
  { title: "Comprar alianças", category: "Cerimónia", days: 60 },
  { title: "Prova de menu", category: "Catering", days: 45 },
  { title: "Lembrar quem ainda não confirmou presença", category: "Convidados", days: 30 },
  { title: "Fechar a contagem final com o catering", category: "Catering", days: 10, description: "Use o número de confirmados no painel" },
  { title: "Fazer o plano de mesas", category: "Convidados", days: 10 },
  { title: "Confirmar horários com todos os fornecedores", category: "Logística", days: 7 },
  { title: "Preparar o cronograma do dia e partilhar com a equipa", category: "Logística", days: 5 },
  { title: "Pagar os restantes fornecedores", category: "Orçamento", days: 2 },
  { title: "Enviar agradecimentos", category: "Pós-evento", days: -14 },
];

const ENGAGEMENT: ChecklistItem[] = [
  { title: "Definir orçamento", category: "Orçamento", days: 90 },
  { title: "Escolher e reservar o local", category: "Local", days: 75 },
  { title: "Fazer a lista de convidados com contactos", category: "Convidados", days: 60 },
  { title: "Contratar catering ou definir menu", category: "Catering", days: 50 },
  { title: "Fotógrafo (opcional)", category: "Fotografia", days: 45 },
  { title: "Preparar e enviar os convites", category: "Convidados", days: 35 },
  { title: "Decoração e flores", category: "Decoração", days: 30 },
  { title: "Playlist ou DJ", category: "Música", days: 20 },
  { title: "Lembrar quem ainda não confirmou", category: "Convidados", days: 10 },
  { title: "Contagem final e confirmação com o local", category: "Catering", days: 5 },
];

const BIRTHDAY: ChecklistItem[] = [
  { title: "Definir orçamento e número de convidados", category: "Orçamento", days: 60 },
  { title: "Escolher e reservar o local", category: "Local", days: 50 },
  { title: "Fazer a lista de convidados com contactos", category: "Convidados", days: 40 },
  { title: "Preparar e enviar os convites", category: "Convidados", days: 30 },
  { title: "Comida e bebida: encomendar ou contratar", category: "Catering", days: 21 },
  { title: "Bolo", category: "Catering", days: 14 },
  { title: "Decoração e playlist", category: "Decoração", days: 10 },
  { title: "Lembrar quem ainda não confirmou", category: "Convidados", days: 7 },
  { title: "Confirmar quantidades com a contagem final", category: "Catering", days: 3 },
];

const OTHER: ChecklistItem[] = [
  { title: "Definir orçamento", category: "Orçamento", days: 60 },
  { title: "Reservar o local", category: "Local", days: 45 },
  { title: "Fazer a lista de convidados", category: "Convidados", days: 35 },
  { title: "Enviar os convites", category: "Convidados", days: 25 },
  { title: "Fechar fornecedores", category: "Logística", days: 14 },
  { title: "Lembrar quem ainda não confirmou", category: "Convidados", days: 7 },
  { title: "Confirmar contagem final", category: "Catering", days: 3 },
];

export const CHECKLISTS: Record<string, ChecklistItem[]> = { WEDDING, ENGAGEMENT, BIRTHDAY, OTHER };

export const BUDGET_CATEGORIES = [
  "Local", "Catering", "Fotografia", "Música", "Decoração", "Vestuário", "Cerimónia", "Convites", "Bolo", "Transporte", "Alojamento", "Lua de mel", "Presentes", "Logística", "Outros",
];

export const VENDOR_STATUS: Record<string, string> = {
  CONTACTING: "A contactar",
  PROPOSAL: "Proposta recebida",
  HIRED: "Contratado",
  REJECTED: "Não escolhido",
};

/** Gera as tarefas com prazos a partir da data do evento. Tarefas cujo prazo já passou ficam com o prazo de hoje. */
export function buildChecklist(type: string, eventDate: Date, now: Date = new Date()) {
  const list = CHECKLISTS[type] ?? OTHER;
  return list.map((item, i) => {
    const due = new Date(eventDate.getTime() - item.days * 86_400_000);
    return {
      title: item.title,
      category: item.category,
      description: item.description ?? null,
      dueAt: item.days > 0 && due < now ? now : due,
      sortOrder: i,
    };
  });
}

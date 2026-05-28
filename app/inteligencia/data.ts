export interface EditalAtivo {
  id: string
  titulo: string
  orgao: string
  cargo: string
  vagas: number
  status: "aberto" | "inscricoes" | "pos-prova"
  progressoEstudo: number
  disciplinas: { nome: string; peso: number }[]
  dataProva: string
  inscricaoAte: string
}

export interface ConcursoHomologado {
  id: string
  titulo: string
  orgao: string
  vagasOcupadas: number
  vagasTotais: number
  ultimaConvocacao: string
  dataHomologacao: string
  movimentacoes: { data: string; texto: string }[]
}

export interface Candidato {
  posicao: number
  nome: string
  nota: number
  lista: "AC" | "PPP" | "PCD"
  status: "convocado" | "aguardando" | "finalizado"
}

export const editaisAtivos: EditalAtivo[] = [
  {
    id: "1",
    titulo: "Concurso Público para Analista de TI",
    orgao: "Ministério da Gestão e Inovação",
    cargo: "Analista de Tecnologia da Informação",
    vagas: 150,
    status: "inscricoes",
    progressoEstudo: 65,
    disciplinas: [
      { nome: "Engenharia de Software", peso: 30 },
      { nome: "Banco de Dados", peso: 20 },
      { nome: "Redes e Infraestrutura", peso: 15 },
      { nome: "Direito Administrativo", peso: 10 },
      { nome: "Língua Portuguesa", peso: 10 },
      { nome: "Raciocínio Lógico", peso: 15 },
    ],
    dataProva: "2026-08-15",
    inscricaoAte: "2026-06-30",
  },
  {
    id: "2",
    titulo: "Concurso Público para Analista de Infraestrutura",
    orgao: "Tribunal de Contas da União",
    cargo: "Analista de Infraestrutura de TI",
    vagas: 80,
    status: "aberto",
    progressoEstudo: 42,
    disciplinas: [
      { nome: "Infraestrutura e Cloud", peso: 35 },
      { nome: "Segurança da Informação", peso: 25 },
      { nome: "Redes", peso: 15 },
      { nome: "Direito Constitucional", peso: 10 },
      { nome: "Português", peso: 15 },
    ],
    dataProva: "2026-09-20",
    inscricaoAte: "2026-07-15",
  },
  {
    id: "3",
    titulo: "Concurso Público para Desenvolvedor de Sistemas",
    orgao: "Prefeitura de São Paulo",
    cargo: "Desenvolvedor de Sistemas Pleno",
    vagas: 200,
    status: "pos-prova",
    progressoEstudo: 100,
    disciplinas: [
      { nome: "Desenvolvimento Web", peso: 40 },
      { nome: "API e Microsserviços", peso: 25 },
      { nome: "Banco de Dados", peso: 15 },
      { nome: "DevOps", peso: 10 },
      { nome: "Legislação", peso: 10 },
    ],
    dataProva: "2026-05-10",
    inscricaoAte: "2026-03-20",
  },
  {
    id: "4",
    titulo: "Concurso para Analista de Dados",
    orgao: "Banco Central do Brasil",
    cargo: "Analista de Dados e BI",
    vagas: 60,
    status: "aberto",
    progressoEstudo: 28,
    disciplinas: [
      { nome: "Data Science", peso: 35 },
      { nome: "Estatística", peso: 20 },
      { nome: "SQL e Modelagem", peso: 20 },
      { nome: "Machine Learning", peso: 15 },
      { nome: "Economia", peso: 10 },
    ],
    dataProva: "2026-10-05",
    inscricaoAte: "2026-08-10",
  },
]

export const concursoHomologado: ConcursoHomologado = {
  id: "h1",
  titulo: "Concurso PPSA — Pré-Sal Petróleo S.A.",
  orgao: "PPSA — Empresa Brasileira de Administração de Petróleo",
  vagasOcupadas: 15,
  vagasTotais: 50,
  ultimaConvocacao: "3ª Convocação",
  dataHomologacao: "2026-04-10",
  movimentacoes: [
    { data: "2026-05-15", texto: "Publicado Edital de 3ª Convocação — 12 novos convocados" },
    { data: "2026-04-28", texto: "Convocados 2ª chamada — 8 candidatos (5 AC, 2 PPP, 1 PCD)" },
    { data: "2026-04-10", texto: "Concurso homologado no DOU — 50 vagas totais" },
    { data: "2026-03-22", texto: "Resultado final divulgado — 150 aprovados na listagem geral" },
    { data: "2026-03-01", texto: "Publicado gabarito definitivo após recursos" },
  ],
}

export const candidatos: Candidato[] = [
  { posicao: 1, nome: "Carlos Eduardo Mendes", nota: 92.5, lista: "AC", status: "convocado" },
  { posicao: 2, nome: "Ana Beatriz Oliveira", nota: 91.8, lista: "AC", status: "convocado" },
  { posicao: 3, nome: "Roberto Alves Santos", nota: 90.2, lista: "AC", status: "convocado" },
  { posicao: 4, nome: "Juliana Costa Lima", nota: 89.7, lista: "AC", status: "convocado" },
  { posicao: 5, nome: "Fernando Souza Neto", nota: 88.9, lista: "AC", status: "convocado" },
  { posicao: 6, nome: "Marina Dias Ferreira", nota: 88.1, lista: "AC", status: "convocado" },
  { posicao: 7, nome: "Lucas Gabriel Rocha", nota: 87.5, lista: "PPP", status: "convocado" },
  { posicao: 8, nome: "Patrícia Campos Andrade", nota: 87.0, lista: "AC", status: "convocado" },
  { posicao: 9, nome: "Rafael Martins Torres", nota: 86.4, lista: "AC", status: "convocado" },
  { posicao: 10, nome: "Camila Rocha Nunes", nota: 85.9, lista: "AC", status: "convocado" },
  { posicao: 11, nome: "Thiago Barbosa Lins", nota: 85.2, lista: "AC", status: "convocado" },
  { posicao: 12, nome: "Larissa Mendes Pinto", nota: 84.8, lista: "AC", status: "convocado" },
  { posicao: 13, nome: "Eduardo Nogueira Reis", nota: 84.0, lista: "PPP", status: "convocado" },
  { posicao: 14, nome: "Isabela Cristina Faria", nota: 83.5, lista: "AC", status: "convocado" },
  { posicao: 15, nome: "Gustavo Henrique Braga", nota: 82.9, lista: "AC", status: "convocado" },
  { posicao: 16, nome: "Daniela Oliveira Santos", nota: 82.3, lista: "AC", status: "aguardando" },
  { posicao: 17, nome: "Felipe Augusto Lima", nota: 81.7, lista: "PPP", status: "aguardando" },
  { posicao: 18, nome: "Vanessa Cristina Rocha", nota: 81.0, lista: "PCD", status: "aguardando" },
  { posicao: 19, nome: "Bruno César Martins", nota: 80.4, lista: "AC", status: "aguardando" },
  { posicao: 20, nome: "Aline Pereira Duarte", nota: 79.8, lista: "AC", status: "aguardando" },
  { posicao: 21, nome: "Marcelo Viana Costa", nota: 79.2, lista: "PPP", status: "aguardando" },
  { posicao: 22, nome: "Renata Souza Oliveira", nota: 78.5, lista: "AC", status: "aguardando" },
  { posicao: 23, nome: "João Pedro Carvalho", nota: 77.9, lista: "PCD", status: "aguardando" },
  { posicao: 24, nome: "Paula Fernanda Gomes", nota: 77.0, lista: "AC", status: "aguardando" },
  { posicao: 25, nome: "Diego Almeida Santos", nota: 76.3, lista: "AC", status: "aguardando" },
  { posicao: 26, nome: "Amanda Cristina Borges", nota: 75.5, lista: "PPP", status: "aguardando" },
  { posicao: 27, nome: "Ricardo Teixeira Neves", nota: 74.8, lista: "AC", status: "finalizado" },
  { posicao: 28, nome: "Carla Dias Moura", nota: 74.0, lista: "AC", status: "finalizado" },
  { posicao: 29, nome: "Vinícius Araújo Lopes", nota: 73.2, lista: "PCD", status: "finalizado" },
  { posicao: 30, nome: "Tatiana Nunes Barbosa", nota: 72.5, lista: "AC", status: "finalizado" },
]

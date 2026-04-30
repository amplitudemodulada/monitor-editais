const CATEGORIAS: Record<string, string[]> = {
  'TI / Tecnologia':   ['tecnologia', 'informática', 'ti ', 'sistemas', 'analista de sistemas', 'desenvolvedor', 'suporte', 'banco de dados'],
  'Saúde':             ['saúde', 'enfermagem', 'médico', 'farmácia', 'odontologia', 'psicólogo', 'sus', 'hospital', 'ubs'],
  'Educação':          ['educação', 'professor', 'pedagogo', 'docente', 'ensino', 'escola', 'magistério'],
  'Administrativo':    ['administração', 'administrativo', 'secretário', 'assistente', 'auxiliar', 'agente admin'],
  'Jurídico':          ['advogado', 'jurídico', 'procurador', 'defensor', 'promotor', 'juiz', 'delegado'],
  'Engenharia':        ['engenheiro', 'engenharia', 'arquiteto', 'arquitetura', 'obras', 'infraestrutura'],
  'Segurança Pública': ['policial', 'delegado', 'bombeiro', 'guarda municipal', 'gcm', 'pm ', 'polícia', 'penal', 'agente penitenciário'],
  'Fiscal / Receita':  ['fiscal', 'auditor', 'receita', 'tributário', 'imposto', 'fazenda'],
  'Concurso Militar':  ['militar', 'marinha', 'exército', 'aeronáutica', 'cfn', 'esa', 'ime'],
  'Geral':             [],
}

export function detectarCategoria(titulo: string, resumo: string): string {
  const texto = (titulo + ' ' + resumo).toLowerCase()
  for (const [cat, palavras] of Object.entries(CATEGORIAS)) {
    if (cat === 'Geral') continue
    if (palavras.some(p => texto.includes(p))) return cat
  }
  return 'Geral'
}

export function extrairOrgao(titulo: string): string {
  const padroes = [
    /(?:prefeitura(?:\s+municipal)?\s+(?:de|do|da)\s+[\w\s]{2,30})/i,
    /(?:governo\s+(?:do\s+estado|federal|estadual)\s+(?:de|do|da)?\s*[\w\s]{0,20})/i,
    /(?:ministério\s+(?:da|do|de)\s+[\w\s]{2,30})/i,
    /(?:secretaria\s+(?:de|da|do|municipal|estadual)?\s+[\w\s]{2,30})/i,
    /(?:tribunal\s+[\w\s]{2,20})/i,
    /(?:câmara\s+(?:municipal|federal|dos\s+deputados)?\s*[\w\s]{0,20})/i,
    /(?:inss|receita\s+federal|pf|prf|dpu|mpu|agu|cgu|tcu|stj|stf|tjdft)/i,
  ]
  for (const re of padroes) {
    const m = titulo.match(re)
    if (m) return m[0].trim()
  }
  // tenta extrair "Concurso ORGÃO" ou "Edital ORGÃO"
  const m2 = titulo.match(/(?:concurso|edital)\s+([A-ZÁÀÉÍÓÚÂÊÔÃÕÇ][^\-–:,]{3,40})/i)
  if (m2) return m2[1].trim()
  return 'Não identificado'
}

export function inferirNivel(titulo: string): 'federal' | 'estadual' | 'municipal' {
  const t = titulo.toLowerCase()
  if (/federal|inss|receita|tcu|stj|stf|mpu|dpu|cgu|agu|pf|prf|fnde|ibama|anatel|anac|cvm/.test(t)) return 'federal'
  if (/municipal|câmara|prefeitura|gcm|guarda municipal/.test(t)) return 'municipal'
  return 'estadual'
}

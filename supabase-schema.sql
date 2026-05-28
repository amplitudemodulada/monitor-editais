-- Tabela principal de editais coletados
create table if not exists editais (
  id               uuid primary key default gen_random_uuid(),
  titulo           text not null,
  orgao            text,
  data_publicacao  date,
  url              text unique,
  categoria        text,
  banca            text default '',
  resumo           text,
  palavras_chave   text[],
  nivel            text check (nivel in ('federal','estadual','municipal')),
  fonte            text default 'LexML',
  status           text default 'aberto' check (status in ('aberto','previsto','em_andamento','encerrado')),
  created_at       timestamptz default now()
);

create index if not exists idx_editais_categoria       on editais(categoria);
create index if not exists idx_editais_data_publicacao on editais(data_publicacao desc);
create index if not exists idx_editais_nivel           on editais(nivel);

-- Configuração de alertas por usuário
create table if not exists alertas_config (
  id              uuid primary key default gen_random_uuid(),
  email           text not null,
  nome            text,
  areas           text[] default '{}',
  nivel           text[] default '{federal}',
  palavras_extras text[] default '{}',
  ativo           boolean default true,
  created_at      timestamptz default now()
);

create unique index if not exists idx_alertas_email on alertas_config(email);

-- Log de alertas enviados
create table if not exists alertas_enviados (
  id         uuid primary key default gen_random_uuid(),
  edital_id  uuid references editais(id) on delete cascade,
  email      text not null,
  enviado_em timestamptz default now()
);

create index if not exists idx_alertas_enviados_email on alertas_enviados(email);

-- Log de execuções do scraper
create table if not exists scraper_log (
  id           uuid primary key default gen_random_uuid(),
  executado_em timestamptz default now(),
  inseridos    int default 0,
  duplicados   int default 0,
  erros        int default 0,
  fonte        text default 'LexML',
  status       text default 'ok'
);

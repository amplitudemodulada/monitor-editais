-- Tabela principal de editais coletados
create table if not exists editais (
  id               uuid primary key default gen_random_uuid(),
  titulo           text not null,
  orgao            text,
  data_publicacao  date,
  url              text unique,
  categoria        text,
  resumo           text,
  palavras_chave   text[],
  nivel            text check (nivel in ('federal','estadual','municipal')),
  fonte            text default 'LexML',
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

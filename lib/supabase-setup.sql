-- Tabela de Clientes com Comissões
CREATE TABLE IF NOT EXISTS clientes_comissoes (
  id BIGSERIAL PRIMARY KEY,
  cliente TEXT NOT NULL,
  cpf_cnpj TEXT UNIQUE NOT NULL,
  email TEXT,
  telefone TEXT,
  grupo TEXT,
  cota INTEGER,
  num_contrato INTEGER,
  situacao TEXT DEFAULT 'Normal',
  tipo_produto TEXT NOT NULL, -- 'Imóvel' ou 'Veicular'
  prazo_dias INTEGER,
  valor_credito DECIMAL(15,2) NOT NULL,
  valor_parcela DECIMAL(10,2),
  parcelas_pagas INTEGER DEFAULT 0,
  parcelas_atraso INTEGER DEFAULT 0,
  data_venda DATE NOT NULL,
  mes_inicio_comissao INTEGER,
  ano_inicio_comissao INTEGER,
  taxa_comissao DECIMAL(5,4) NOT NULL, -- 0.1288 ou 0.1538
  comissao_mensal DECIMAL(12,2) NOT NULL,
  comissao_paga DECIMAL(12,2) DEFAULT 0,
  comissao_atraso DECIMAL(12,2) DEFAULT 0,
  comissao_pendente DECIMAL(12,2) DEFAULT 0,
  comissao_total DECIMAL(12,2) NOT NULL,
  alerta_atraso BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de Calendário de Comissões (uma linha por parcela)
CREATE TABLE IF NOT EXISTS calendario_comissoes (
  id BIGSERIAL PRIMARY KEY,
  cliente_id BIGINT REFERENCES clientes_comissoes(id) ON DELETE CASCADE,
  cliente TEXT NOT NULL,
  cpf_cnpj TEXT NOT NULL,
  parcela_numero INTEGER NOT NULL, -- 1 a 13
  mes INTEGER NOT NULL, -- 1-12
  ano INTEGER NOT NULL,
  valor_comissao DECIMAL(12,2) NOT NULL,
  data_prevista DATE NOT NULL,
  status TEXT DEFAULT 'pendente', -- 'pendente', 'recebida', 'atrasada'
  data_recebimento DATE,
  em_atraso BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(cliente_id, parcela_numero)
);

-- Tabela de Alertas
CREATE TABLE IF NOT EXISTS alertas_clientes (
  id BIGSERIAL PRIMARY KEY,
  cliente_id BIGINT REFERENCES clientes_comissoes(id) ON DELETE CASCADE,
  cliente TEXT NOT NULL,
  cpf_cnpj TEXT NOT NULL,
  tipo_alerta TEXT NOT NULL, -- 'atraso_parcela', 'atraso_comissao', 'vencimento_proximo'
  descricao TEXT NOT NULL,
  parcelas_atrasadas INTEGER,
  valor_atraso DECIMAL(12,2),
  ativo BOOLEAN DEFAULT TRUE,
  data_criacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  data_resolucao TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_clientes_comissoes_cpf ON clientes_comissoes(cpf_cnpj);
CREATE INDEX IF NOT EXISTS idx_clientes_comissoes_alerta ON clientes_comissoes(alerta_atraso);
CREATE INDEX IF NOT EXISTS idx_calendario_status ON calendario_comissoes(status);
CREATE INDEX IF NOT EXISTS idx_calendario_cliente ON calendario_comissoes(cliente_id);
CREATE INDEX IF NOT EXISTS idx_alertas_ativo ON alertas_clientes(ativo);

-- RLS (Row Level Security)
ALTER TABLE clientes_comissoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE calendario_comissoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE alertas_clientes ENABLE ROW LEVEL SECURITY;

-- Políticas de acesso (permitir leitura para todos, escrita apenas para admin)
CREATE POLICY "Clientes readable by all" ON clientes_comissoes FOR SELECT USING (TRUE);
CREATE POLICY "Calendario readable by all" ON calendario_comissoes FOR SELECT USING (TRUE);
CREATE POLICY "Alertas readable by all" ON alertas_clientes FOR SELECT USING (TRUE);

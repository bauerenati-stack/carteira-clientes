import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type CarteiraCliente = {
  id: string;
  cliente: string;
  cpf_cnpj: string;
  email: string;
  telefone: string;
  endereco: string;
  bairro: string;
  cidade: string;
  estado: string;
  cep: string;
  grupo: string;
  cota: string;
  num_contrato: string;
  segmento: string;
  situacao: string;
  data_venda: string;
  valor_credito: number;
  parcelas_pagas: number;
  parcelas_a_pagar: number;
  valor_parcela: number;
  saldo_devedor: number;
  pct_saldo_devedor: number;
};

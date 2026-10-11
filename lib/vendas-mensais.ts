export interface VendaDaCarteira { nome: string; cpf_cnpj: string; grupo: string; cota: number; credito: number; data_venda: string }
export const META_CREDITO_MENSAL = 2_000_000;
const nome = (s: string) => s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim().replace(/\s+/g, " ").toUpperCase();
export function vendasMensais(clientes: VendaDaCarteira[], periodo: string) {
  const pessoaPorNome = new Map<string, string>();
  for (const c of clientes) if (c.cpf_cnpj) pessoaPorNome.set(nome(c.nome), c.cpf_cnpj.replace(/\D/g, ""));
  const pessoa = (c: VendaDaCarteira) => pessoaPorNome.get(nome(c.nome)) || nome(c.nome);
  const anteriores = new Set(clientes.filter(c => c.data_venda.slice(0,7) < periodo).map(pessoa));
  const cotas = new Map<string, VendaDaCarteira>();
  for (const c of clientes) if (c.data_venda.slice(0,7) === periodo) cotas.set(`${c.grupo.padStart(6,"0")}:${c.cota}`, c);
  const vendas = Array.from(cotas.values());
  const compradores = new Set(vendas.map(pessoa));
  const novosClientes = Array.from(compradores).filter(p => !anteriores.has(p)).length;
  const credito = vendas.reduce((s,c) => s + Math.round(c.credito * 100),0) / 100;
  return { vendas, compradores: compradores.size, novosClientes, contratos: vendas.length, credito,
    falta: Math.max(0, META_CREDITO_MENSAL - credito), excedente: Math.max(0, credito - META_CREDITO_MENSAL), percentual: credito / META_CREDITO_MENSAL * 100 };
}

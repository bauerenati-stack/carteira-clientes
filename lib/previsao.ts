export interface CotaPrevisao {
  nome: string; credito: number; data_venda: string; num_contrato: number;
  situacao: string; parcelas_atraso: number;
}
export interface ItemPrevisao {
  nome: string; credito: number; data_venda: string; comissao: number;
  num_contrato?: number; grupo?: string; cota?: number;
}
export function cotaCancelada(c: Pick<CotaPrevisao, 'situacao'>) {
  return c.situacao.trim().toLowerCase().startsWith('cancelad');
}
export function separarPrevisao<T extends { clientes_previstos: ItemPrevisao[]; clientes_em_risco?: ItemPrevisao[]; clientes_cancelados?: ItemPrevisao[] }>(p: T, cotas: CotaPrevisao[]) {
  const principal: ItemPrevisao[] = [], risco: ItemPrevisao[] = [], cancelados: ItemPrevisao[] = [];
  const used = new Set<number>();
  for (const row of [...p.clientes_previstos, ...(p.clientes_em_risco || []), ...(p.clientes_cancelados || [])]) {
    const matches = cotas.filter(c => !used.has(c.num_contrato) && (row.num_contrato ? c.num_contrato === row.num_contrato :
      c.nome === row.nome && c.credito === row.credito && c.data_venda === row.data_venda));
    if (!matches.length) { risco.push(row); continue; }
    const c = matches[0];
    used.add(c.num_contrato);
    const enriched = { ...row, num_contrato: c.num_contrato };
    if (cotaCancelada(c)) cancelados.push(enriched);
    else if (c.parcelas_atraso >= 3) risco.push(enriched);
    else principal.push(enriched);
  }
  const sum = (rows: ItemPrevisao[]) => Math.round(rows.reduce((s, r) => s + r.comissao, 0) * 100) / 100;
  return { ...p, clientes_previstos: principal, clientes_em_risco: risco, clientes_cancelados: cancelados,
    projecao_total: sum(principal), projecao_em_risco: sum(risco), projecao_cancelados: sum(cancelados),
    clientes_elegibles: principal.filter(r => r.comissao > 0).length };
}

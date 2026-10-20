"use client";
import { useState } from "react";
export interface LancamentoComissao {
  id: string; cliente: string; cliente_id: string; num_contrato: number | null;
  grupo: string; cota: number; numero_parcela: number | null;
  competencia_parcela: string | null; referencia_relatorio: string | null;
  mes_pagamento_cliente: string | null; mes_recebimento: string | null;
  data_recebimento: string | null; data_recebimento_prevista?: string;
  valor_comissao: number; status: string; observacao?: string;
}
export interface HistoricoComissoes {
  lancamentos: LancamentoComissao[];
  ajustes: { id: string; mes_recebimento: string; descricao: string; valor: number }[];
}
const money = (n: number) => n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const mes = (s: string | null) => s ? new Date(s + "-01T12:00:00").toLocaleDateString("pt-BR", { month: "short", year: "numeric" }) : "Não informado";
export function Historico({ dados, clienteId }: { dados: HistoricoComissoes; clienteId?: string }) {
  const [periodo, setPeriodo] = useState("");
  const [busca, setBusca] = useState("");
  const [situacao, setSituacao] = useState("");
  const base = dados.lancamentos.filter(x => !clienteId || x.cliente_id === clienteId);
  const periods = Array.from(new Set(base.map(x => x.mes_recebimento).filter((m): m is string => Boolean(m)))).sort();
  const rows = base.filter(x => (!periodo || x.mes_recebimento === periodo) && (!situacao || x.status === situacao) && `${x.cliente} ${x.num_contrato || ""} ${x.grupo} ${x.cota}`.toLocaleLowerCase().includes(busca.toLocaleLowerCase())).sort((a,b) => (b.mes_recebimento || "").localeCompare(a.mes_recebimento || "") || a.cliente.localeCompare(b.cliente) || (a.numero_parcela || 0) - (b.numero_parcela || 0));
  const confirmed = rows.filter(x => x.status === "recebida");
  const bruto = confirmed.reduce((s,x) => s + Math.round(x.valor_comissao * 100),0) / 100;
  const previsao = rows.filter(x => x.status === "prevista").reduce((s,x) => s + Math.round(x.valor_comissao * 100),0) / 100;
  const adjustments = clienteId || (situacao && situacao !== "recebida") || busca ? [] : dados.ajustes.filter(x => !periodo || x.mes_recebimento === periodo);
  const desconto = adjustments.reduce((s,x) => s + Math.round(x.valor * 100),0) / 100;
  const ultima = base.filter(x => x.status === "recebida").reduce((s,x) => Math.max(s,x.numero_parcela || 0),0);
  return <section className="panel commission-ledger">
    <div className="panel-heading"><div><h2>Histórico de comissões por parcela</h2><p>{clienteId && ultima ? `Última parcela de comissão confirmada: ${ultima}. ` : ""}Cada parcela mantém seu próprio registro, mesmo quando recebida junto com outra.</p></div></div>
    <div className="ledger-filters">
      <label>Mês do recebimento<select value={periodo} onChange={e => setPeriodo(e.target.value)}><option value="">Todos</option>{periods.map(p => <option key={p} value={p}>{mes(p)}</option>)}</select></label>
      <label>Situação<select value={situacao} onChange={e => setSituacao(e.target.value)}><option value="">Todas as situações</option><option value="recebida">Recebidas</option><option value="prevista">Previstas</option><option value="pendente">Não paga / fora da previsão</option></select></label>
      {!clienteId && <label>Cliente, contrato ou cota<input value={busca} onChange={e => setBusca(e.target.value)} placeholder="Buscar no histórico" /></label>}
    </div>
    <div className="info-note"><p>Confirmado bruto: <strong>{money(bruto)}</strong>{!clienteId && !busca && (!situacao || situacao === "recebida") ? <> · Ajustes: {money(desconto)} · Líquido: <strong>{money(bruto + desconto)}</strong></> : null}</p><p>Previsão separada: <strong>{money(previsao)}</strong>. O número da comissão é independente da quantidade de boletos pagos.</p></div>
    {adjustments.map(a => <p key={a.id}>{a.descricao} · {mes(a.mes_recebimento)}: {money(a.valor)}</p>)}
    <div className="table-scroll"><table><thead><tr>{!clienteId && <th>Cliente / cota</th>}<th>Parcela da comissão</th><th>Mês do boleto</th><th>Recebimento</th><th>Valor</th><th>Situação</th></tr></thead><tbody>{rows.map(x => <tr key={x.id}>
      {!clienteId && <td>{x.cliente}<small style={{display:"block"}}>Grupo {x.grupo} · Cota {x.cota} · Contrato {x.num_contrato || "A confirmar"}</small></td>}
      <td>{x.numero_parcela ? `${x.numero_parcela}ª` : "A confirmar"}</td>
      <td>{mes(x.competencia_parcela)}{x.referencia_relatorio && <small style={{display:"block"}}>Relatório ref. {mes(x.referencia_relatorio)}</small>}</td>
      <td>{x.status === "pendente" ? "Sem previsão" : mes(x.mes_recebimento)}{x.status === "prevista" && <small style={{display:"block"}}>Previsão para dia 5</small>}</td>
      <td>{money(x.valor_comissao)}</td><td><span className={"badge " + (x.status === "prevista" ? "gold-badge" : "neutral")} title={x.observacao}>{x.status === "recebida" ? "Recebida" : x.status === "pendente" ? "Não paga / fora da previsão" : "Prevista"}</span></td>
    </tr>)}</tbody></table></div>
    {!rows.length && <p>Nenhuma comissão registrada neste filtro.</p>}
    <p>Atrasos e regularizações são atualizados conforme você informar. A referência do relatório fica separada do mês do boleto quando esse mês não foi informado.</p>
  </section>;
}

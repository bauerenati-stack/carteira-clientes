"use client";

import { useState } from "react";
import source from "@/public/consultores.json";
interface ContratoEquipe {
  id: string; consultor: string; cliente: string; grupo: string; cota: number; credito: number; data_venda: string;
  matricula_informada: string | null; comissao_consultor: number | null; repasse_supervisao: number | null;
  tipo_produto: string | null; consultor_situacao?: string; valor_mensal_informado?: number;
  parcela_referencia?: number; mes_referencia?: string; observacao?: string; divergencias_carteira?: string[];
}
const data: { contratos: ContratoEquipe[] } = source;
const referencia = (s?: string) => s ? s.split("-").reverse().join("/") : "Não informada";

const money = (n: number) => n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const normalize = (s: string) => s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
const date = (s: string) => s.split("-").reverse().join("/");

export function Consultores() {
  const [consultor, setConsultor] = useState("");
  const [query, setQuery] = useState("");
  const [situacao, setSituacao] = useState("");
  const [mes, setMes] = useState("");
  const nomes = [...new Set(data.contratos.map(c => c.consultor))].sort();
  const contratos = data.contratos.filter(c => (!consultor || c.consultor === consultor) && (!mes || c.data_venda.startsWith(mes)) && (!situacao || c.consultor_situacao === situacao) && normalize(`${c.cliente} ${c.consultor} ${c.grupo} ${c.cota}`).includes(normalize(query.trim())));
  const credito = contratos.reduce((sum, c) => sum + c.credito, 0);

  const informadas = contratos.filter(c => c.comissao_consultor !== null);
  const totalInformado = informadas.reduce((s,c) => s + (c.comissao_consultor ?? 0),0);

  function exportar() {
    const lines = [["Consultor", "Situação consultor", "Cliente", "Grupo", "Cota", "Crédito", "Data da venda", "Modalidade", "Comissão total informada", "Valor mensal informado", "Parcela de referência", "Mês de referência", "Repasse supervisão", "Status", "Observação"], ...contratos.map(c => [c.consultor, c.consultor_situacao ?? "Não informado", c.cliente, c.grupo, c.cota, c.credito.toFixed(2).replace(".", ","), date(c.data_venda), c.tipo_produto ?? "A confirmar", c.comissao_consultor === null ? "A configurar" : c.comissao_consultor.toFixed(2).replace(".", ","), c.valor_mensal_informado?.toFixed(2).replace(".", ",") ?? "Não informado", c.parcela_referencia ?? "", referencia(c.mes_referencia), "A configurar", "Pagamento não confirmado", c.observacao ?? ""])];
    const csv = "\uFEFF" + lines.map(row => row.map(v => `"${String(v).replace(/"/g, '""')}"`).join(";")).join("\r\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    const a = document.createElement("a"); a.href = url; a.download = "contratos-consultores.csv"; a.click(); URL.revokeObjectURL(url);
  }

  return <>
    <section className="stats" aria-label="Resumo dos consultores">
      <div className="stat"><div className="stat-label">Consultores no período</div><strong>{new Set(contratos.map(c => c.consultor)).size}</strong><small>Responsáveis pelos contratos filtrados</small></div>
      <div className="stat"><div className="stat-label">Contratos</div><strong>{contratos.length}</strong><small>{new Set(contratos.map(c => c.cliente)).size} clientes no período</small></div>
      <div className="stat"><div className="stat-label">Crédito vendido</div><strong>{money(credito)}</strong><small>Carteira dos consultores</small></div>
      <div className="stat"><div className="stat-label">Comissões</div><strong>{informadas.length ? money(totalInformado) : "A configurar"}</strong><small>Total contratado informado em {informadas.length} cotas. Recebimento não confirmado.</small></div>
    </section>
    <section className="panel">
      <div className="panel-heading"><div><span className="eyebrow">EQUIPE BAUER</span><h2>Clientes e contratos dos consultores</h2><p>Vendas da equipe acompanhadas separadamente da carteira de Ricardo e Natália.</p></div><button className="button" onClick={exportar} disabled={!contratos.length}>Exportar contratos</button></div>
      <div className="filters" style={{display:"flex",flexWrap:"wrap",gap:16,marginBottom:24}}>
        <label>Consultor<select aria-label="Consultor" value={consultor} onChange={e => setConsultor(e.target.value)}><option value="">Todos os consultores</option>{nomes.map(n => <option key={n}>{n}</option>)}</select></label>
        <label>Mês da venda<select aria-label="Mês das vendas da equipe" value={mes} onChange={e => setMes(e.target.value)}><option value="">Todos os períodos</option>{[...new Set(data.contratos.map(c => c.data_venda.slice(0,7)))].sort().map(m => <option key={m} value={m}>{referencia(m)}</option>)}</select></label>
        <label>Situação do consultor<select aria-label="Situação do consultor" value={situacao} onChange={e => setSituacao(e.target.value)}><option value="">Todas as situações</option><option>Ativo</option><option>Desligado</option><option>Não informado</option></select></label>
        <label>Buscar cliente ou cota<input aria-label="Buscar nos contratos dos consultores" placeholder="Nome, grupo ou cota" value={query} onChange={e => setQuery(e.target.value)} /></label>
        <button className="button small" onClick={() => {setConsultor("");setQuery("");setMes("");setSituacao("");}}>Limpar filtros</button>
      </div>
      {nomes.filter(n => !consultor || n === consultor).map(n => {
        const rows = contratos.filter(c => c.consultor === n);
        if (!rows.length) return null;
        return <article key={n} style={{borderTop:"3px solid #b89543",paddingTop:20,marginBottom:32}}>
          <h3>{n}</h3><p>{rows[0].consultor_situacao ?? "Não informado"}</p><p>{rows.length} contratos · {new Set(rows.map(c => c.cliente)).size} clientes · {money(rows.reduce((s,c) => s+c.credito,0))}</p>
          <div className="table-scroll"><table><thead><tr><th>Cliente</th><th>Grupo / cota</th><th>Modalidade</th><th>Crédito</th><th>Venda</th><th>Comissão total informada</th><th>Valor mensal informado</th><th>Parcela / referência</th><th>Repasse supervisão</th><th>Observações</th></tr></thead><tbody>{rows.map(c => <tr key={c.id}><td>{c.cliente}</td><td>{c.grupo} / {c.cota}</td><td>{c.tipo_produto ?? "A confirmar"}</td><td>{money(c.credito)}</td><td>{date(c.data_venda)}</td><td>{c.comissao_consultor === null ? "A configurar" : money(c.comissao_consultor)}</td><td>{c.valor_mensal_informado === undefined ? "A configurar" : money(c.valor_mensal_informado)}</td><td>{c.parcela_referencia ? `Parcela ${c.parcela_referencia}` : "Não informada"}<br />{referencia(c.mes_referencia)}</td><td>A configurar</td><td>{c.observacao}<br />{c.divergencias_carteira?.map(v => <small key={v}>{v}</small>)}</td></tr>)}</tbody></table></div>
        </article>;
      })}
      {!contratos.length && <div className="empty">Nenhum contrato encontrado para estes filtros.</div>}
    </section>
    <section className="panel"><h2>Controle de comissões da equipe</h2><p>Os totais e valores mensais informados foram preservados conforme sua relação. Mês e parcela são referências da planilha, sem confirmação de recebimento ou repasse. Os valores mensais de referências diferentes não representam uma previsão única do mês atual.</p><p>Desligamento do consultor não cancela a cota do cliente. Contratos vinculados à carteira mantêm o histórico de pagamento existente, sem duplicar créditos ou alterar suas comissões pessoais.</p><p>Falta confirmar as regras das comissões ainda não informadas e do repasse para a supervisão. CPF, chave Pix, e-mail e senha não são exibidos nesta aba pública. A matrícula 13135 permanece conforme a relação anterior.</p></section>
  </>;
}

"use client";

import { useState } from "react";
import data from "@/public/consultores.json";

const money = (n: number) => n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const normalize = (s: string) => s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
const date = (s: string) => s.split("-").reverse().join("/");

export function Consultores() {
  const [consultor, setConsultor] = useState("");
  const [query, setQuery] = useState("");
  const [mes, setMes] = useState("2026-10");
  const nomes = [...new Set(data.contratos.map(c => c.consultor))].sort();
  const contratos = data.contratos.filter(c => (!consultor || c.consultor === consultor) && (!mes || c.data_venda.startsWith(mes)) && normalize(`${c.cliente} ${c.consultor} ${c.grupo} ${c.cota}`).includes(normalize(query.trim())));
  const credito = contratos.reduce((sum, c) => sum + c.credito, 0);

  function exportar() {
    const lines = [["Consultor", "Cliente", "Grupo", "Cota", "Crédito", "Data da venda", "Matrícula informada", "Comissão consultor", "Repasse supervisão"], ...contratos.map(c => [c.consultor, c.cliente, c.grupo, c.cota, c.credito.toFixed(2).replace(".", ","), date(c.data_venda), c.matricula_informada, "A configurar", "A configurar"])];
    const csv = "\uFEFF" + lines.map(row => row.map(v => `"${String(v).replace(/"/g, '""')}"`).join(";")).join("\r\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    const a = document.createElement("a"); a.href = url; a.download = "contratos-consultores.csv"; a.click(); URL.revokeObjectURL(url);
  }

  return <>
    <section className="stats" aria-label="Resumo dos consultores">
      <div className="stat"><div className="stat-label">Consultores no período</div><strong>{new Set(contratos.map(c => c.consultor)).size}</strong><small>Responsáveis pelos contratos filtrados</small></div>
      <div className="stat"><div className="stat-label">Contratos</div><strong>{contratos.length}</strong><small>{new Set(contratos.map(c => c.cliente)).size} clientes no período</small></div>
      <div className="stat"><div className="stat-label">Crédito vendido</div><strong>{money(credito)}</strong><small>Carteira dos consultores</small></div>
      <div className="stat"><div className="stat-label">Comissões</div><strong>A configurar</strong><small>Percentuais ainda não informados</small></div>
    </section>
    <section className="panel">
      <div className="panel-heading"><div><span className="eyebrow">EQUIPE BAUER</span><h2>Clientes e contratos dos consultores</h2><p>Vendas da equipe acompanhadas separadamente da carteira de Ricardo e Natália.</p></div><button className="button" onClick={exportar} disabled={!contratos.length}>Exportar contratos</button></div>
      <div className="filters" style={{display:"flex",flexWrap:"wrap",gap:16,marginBottom:24}}>
        <label>Consultor<select aria-label="Consultor" value={consultor} onChange={e => setConsultor(e.target.value)}><option value="">Todos os consultores</option>{nomes.map(n => <option key={n}>{n}</option>)}</select></label>
        <label>Mês da venda<select aria-label="Mês das vendas da equipe" value={mes} onChange={e => setMes(e.target.value)}><option value="">Todos os períodos</option><option value="2026-10">Outubro de 2026</option><option value="2026-11">Novembro de 2026</option></select></label>
        <label>Buscar cliente ou cota<input aria-label="Buscar nos contratos dos consultores" placeholder="Nome, grupo ou cota" value={query} onChange={e => setQuery(e.target.value)} /></label>
        <button className="button small" onClick={() => {setConsultor("");setQuery("");setMes("2026-10");}}>Limpar filtros</button>
      </div>
      {nomes.filter(n => !consultor || n === consultor).map(n => {
        const rows = contratos.filter(c => c.consultor === n);
        if (!rows.length) return null;
        return <article key={n} style={{borderTop:"3px solid #b89543",paddingTop:20,marginBottom:32}}>
          <h3>{n}</h3><p>{rows.length} contratos · {new Set(rows.map(c => c.cliente)).size} clientes · {money(rows.reduce((s,c) => s+c.credito,0))}</p>
          <div className="table-scroll"><table><thead><tr><th>Cliente</th><th>Grupo / cota</th><th>Crédito</th><th>Venda</th><th>Matrícula informada</th><th>Comissão consultor</th><th>Repasse supervisão</th></tr></thead><tbody>{rows.map(c => <tr key={c.id}><td>{c.cliente}</td><td>{c.grupo} / {c.cota}</td><td>{money(c.credito)}</td><td>{date(c.data_venda)}</td><td>{c.matricula_informada}</td><td>A configurar</td><td>A configurar</td></tr>)}</tbody></table></div>
        </article>;
      })}
      {!contratos.length && <div className="empty">Nenhum contrato encontrado para estes filtros.</div>}
    </section>
    <section className="panel"><h2>Controle de comissões da equipe</h2><p>Os contratos estão registrados. Para calcular as comissões, falta informar a modalidade de cada contrato, os percentuais dos consultores e a regra de repasse para a supervisão.</p><p>Comissões previstas, recebidas e repassadas serão registradas separadamente. Nenhum recebimento ou repasse foi confirmado nesta relação.</p><p>A matrícula 13135 foi mantida conforme sua tabela, sem atribuí-la como matrícula pessoal de cada consultor.</p></section>
  </>;
}

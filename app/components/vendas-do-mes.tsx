"use client";
import { useEffect, useState } from "react";
import { META_CREDITO_MENSAL, vendasMensais, type VendaDaCarteira } from "@/lib/vendas-mensais";
const dinheiro = (n: number) => n.toLocaleString("pt-BR", {style:"currency",currency:"BRL"});
export function VendasDoMes({ clientes }: { clientes: VendaDaCarteira[] }) {
  const [periodo, setPeriodo] = useState("");
  useEffect(() => {
    const partes = new Intl.DateTimeFormat("en-US", {timeZone:"America/Sao_Paulo",year:"numeric",month:"2-digit"}).formatToParts(new Date());
    setPeriodo(`${partes.find(p => p.type === "year")!.value}-${partes.find(p => p.type === "month")!.value}`);
  }, []);
  if (!periodo) return <section className="panel" aria-busy="true">Carregando vendas do mês...</section>;
  const resumo = vendasMensais(clientes, periodo);
  const titulo = new Date(periodo + "-01T12:00:00").toLocaleDateString("pt-BR",{month:"long",year:"numeric"});
  const grupos = Array.from(new Set(resumo.vendas.map(c => c.grupo))).sort();
  return <section className="panel monthly-sales">
    <div className="panel-heading"><div><span className="eyebrow">MEU MÊS · {titulo.toLocaleUpperCase()}</span><h2>Vendas e meta de crédito</h2><p>Atualizado conforme as vendas entram na carteira. O período muda automaticamente a cada mês.</p></div></div>
    <div className="monthly-metrics">
      <div><small>Novos clientes</small><strong>{resumo.novosClientes}</strong><span>Primeira venda na carteira neste mês</span></div>
      <div><small>Novos contratos</small><strong>{resumo.contratos}</strong><span>Uma cota por grupo conta como um contrato</span></div>
      <div><small>Clientes com vendas no mês</small><strong>{resumo.compradores}</strong><span>Inclui quem já era seu cliente</span></div>
      <div><small>Crédito vendido no mês</small><strong>{dinheiro(resumo.credito)}</strong><span>Meta mensal: {dinheiro(META_CREDITO_MENSAL)}</span></div>
    </div>
    <div className="monthly-goal"><div><strong>{resumo.falta > 0 ? `Faltam ${dinheiro(resumo.falta)} para a meta` : "Meta atingida"}</strong><span>{resumo.percentual.toLocaleString("pt-BR",{maximumFractionDigits:2})}% atingidos{resumo.excedente > 0 ? ` · ${dinheiro(resumo.excedente)} acima da meta` : ""}</span></div><progress aria-label="Progresso da meta mensal de crédito" value={Math.min(100,resumo.percentual)} max={100} /></div>
    <details><summary>Ver contratos do mês por grupo e cota</summary><div className="table-scroll"><table><thead><tr><th>Cliente</th><th>Grupo</th><th>Cota</th><th>Crédito vendido</th><th>Data da venda</th></tr></thead><tbody>{resumo.vendas.map(c => <tr key={`${c.grupo}:${c.cota}`}><td>{c.nome}</td><td>{c.grupo}</td><td>{c.cota}</td><td>{dinheiro(c.credito)}</td><td>{new Date(c.data_venda.slice(0,10)+"T12:00:00").toLocaleDateString("pt-BR")}</td></tr>)}</tbody></table></div>{!resumo.vendas.length && <p>Nenhuma venda registrada neste mês.</p>}<div className="monthly-groups">{grupos.map(g => { const a=resumo.vendas.filter(c => c.grupo===g);return <p key={g}>Grupo {g}: <strong>{a.length} {a.length===1?"contrato":"contratos"}</strong> · {dinheiro(a.reduce((s,c)=>s+c.credito,0))}</p>;})}</div></details>
  </section>;
}

"use client";

import { useState } from "react";
import clientes from "@/public/clientes_novos.json";
import historico from "@/public/historico_comissoes.json";
import { gerarFluxoEquipe, type ContratoFinanceiro, type ClienteFinanceiro, type RecebimentoEquipe, type RepasseConfirmado } from "@/lib/financeiro-equipe";

const money=(v:number)=>v.toLocaleString("pt-BR",{style:"currency",currency:"BRL"});
const date=(v:string|null)=>v ? v.split("-").reverse().join("/") : "A confirmar";

export function FinanceiroEquipe({contratos,repasses=[],feriados=[]}:{contratos:ContratoFinanceiro[];repasses?:RepasseConfirmado[];feriados?:string[]}) {
  const [mes,setMes]=useState(()=>new Intl.DateTimeFormat("en-CA",{timeZone:"America/Sao_Paulo",year:"numeric",month:"2-digit"}).format(new Date()).replace(/^(\d{2})\/(\d{4})$/,"$2-$1"));
  const [somentePendentes,setSomentePendentes]=useState(false);
  const fluxo=gerarFluxoEquipe(contratos,clientes as ClienteFinanceiro[],historico.lancamentos as RecebimentoEquipe[],repasses,feriados);
  const meses=[...new Set(fluxo.map(x=>x.mes_recebimento).concat(mes))].sort();
  const periodo=fluxo.filter(x=>x.mes_recebimento===mes);
  const previstas=periodo.filter(x=>x.status==="Prevista"),recebidas=periodo.filter(x=>x.status==="Recebida na matrícula");
  const sum=(rows:typeof fluxo,field:"bruto"|"repasse"|"saldo"|"bonificacao"|"recebido"|"repassado"|"repasse_pendente")=>Math.round(rows.reduce((s,r)=>s+(r[field]??0),0)*100)/100;
  const excluidas=periodo.filter(x=>["Cliente em atraso","Em risco: 3+ atrasos","Cancelada","Modalidade a confirmar"].includes(x.status));
  const rows=somentePendentes ? periodo.filter(x=>x.repasse_pendente>0) : periodo;
  function exportar(){
    const csvRows=[["Consultor","Cliente","Grupo","Cota","Parcela","Competência-base","Vencimento cliente","Mês recebimento","Bruto matrícula","Repasse previsto consultor","Saldo previsto Bauer","Bonificação incluída no bruto","Recebido confirmado","Repassado confirmado","A repassar após recebimento","Prazo repasse","Status entrada","Pagamento cliente","Fonte recebimento"],...rows.map(r=>[r.consultor,r.cliente,r.grupo,r.cota,r.numero,r.competencia,r.vencimento??"",r.mes_recebimento,r.bruto??"A confirmar",r.repasse,r.saldo??"A confirmar",r.bonificacao,r.recebido,r.repassado,r.repasse_pendente,r.prazo_repasse??"",r.status+"; "+r.regra_repasse,r.pagamento_cliente,r.fonte_recebimento??""])];
    const csv="\uFEFF"+csvRows.map(row=>row.map(v=>`"${String(v).replace(/"/g,'""')}"`).join(";")).join("\r\n");
    const url=URL.createObjectURL(new Blob([csv],{type:"text/csv;charset=utf-8"}));const a=document.createElement("a");a.href=url;a.download=`repasses-equipe-${mes}.csv`;a.click();URL.revokeObjectURL(url);
  }
  return <section className="panel" style={{borderTop:"3px solid #b89543",marginBottom:24}}>
    <div className="panel-heading"><div><span className="eyebrow">ENTRADAS E REPASSES</span><h2>Comissões na matrícula e saldo Bauer</h2><p>A administradora deposita o bruto na sua matrícula; o repasse ao consultor e a sua diferença ficam separados.</p></div><button className="button" onClick={exportar} disabled={!rows.length}>Exportar fluxo do mês</button></div>
    <div style={{display:"flex",gap:16,flexWrap:"wrap",alignItems:"center",marginBottom:20}}><label>Mês de recebimento e repasse <select aria-label="Mês de recebimento da equipe" value={mes} onChange={e=>setMes(e.target.value)}>{meses.map(m=><option key={m} value={m}>{m.split("-").reverse().join("/")}</option>)}</select></label><label><input type="checkbox" checked={somentePendentes} onChange={e=>setSomentePendentes(e.target.checked)}/> Somente repasses pendentes de entradas confirmadas</label></div>
    <div className="stats">
      <div className="stat"><div className="stat-label">Recebido na matrícula</div><strong>{money(sum(recebidas,"recebido"))}</strong><small>Confirmado no histórico, sem duplicar o lançamento original</small></div>
      <div className="stat"><div className="stat-label">Bruto previsto</div><strong>{money(sum(previstas,"bruto"))}</strong><small>Estimativa; depende do pagamento dos clientes</small></div>
      <div className="stat"><div className="stat-label">Repasse previsto</div><strong>{money(sum(previstas,"repasse"))}</strong><small>Parte dos consultores nas entradas previstas</small></div>
      <div className="stat"><div className="stat-label">Saldo Bauer previsto</div><strong>{money(sum(previstas,"saldo"))}</strong><small>Bruto menos repasses; bonificação já incluída</small></div>
      <div className="stat"><div className="stat-label">Repasses confirmados</div><strong>{money(sum(periodo,"repassado"))}</strong><small>Somente pagamentos informados como efetuados</small></div>
      <div className="stat"><div className="stat-label">A repassar</div><strong>{money(sum(recebidas,"repasse_pendente"))}</strong><small>Entradas confirmadas, descontados os repasses registrados</small></div>
    </div>
    <p>{excluidas.length} parcelas fora da previsão neste mês por atraso, risco, cancelamento ou modalidade a confirmar.</p>
    <div className="table-scroll"><table><thead><tr><th>Consultor / cliente</th><th>Cota / parcela</th><th>Vencimento cliente</th><th>Bruto matrícula</th><th>Repasse consultor</th><th>Saldo Bauer</th><th>Entrada</th><th>Repasse e prazo</th></tr></thead><tbody>{rows.map(r=><tr key={r.id}>
      <td><strong>{r.consultor}</strong><br/>{r.cliente}</td><td>{r.grupo} / {r.cota}<br/>Parcela {r.numero}{r.bonificacao>0 ? " · bonificação" : ""}<br/>Competência-base: {r.competencia.split("-").reverse().join("/")}</td>
      <td>{date(r.vencimento)}<br/>{r.pagamento_cliente}</td><td>{r.bruto===null ? "Modalidade a confirmar" : money(r.bruto)}</td><td>{money(r.repasse)}<br/><small>{r.regra_repasse}</small></td><td>{r.saldo===null ? "A confirmar" : money(r.saldo)}</td>
      <td>{r.status}<br/>{r.data_recebimento ? date(r.data_recebimento) : r.recebimento_previsto ? `Previsto: ${date(r.recebimento_previsto)}` : r.recebido>0 ? "Mês confirmado; dia não informado" : "Sem previsão"}</td>
      <td>{r.repasse===0 ? "Sem repasse" : r.repassado>=r.repasse ? "Repassado" : r.repasse_pendente>0 ? `A repassar: ${money(r.repasse_pendente)}` : "Aguarda recebimento na matrícula"}<br/>{r.prazo_repasse ? `Até ${date(r.prazo_repasse)}` : "Prazo a confirmar"}{r.data_repasse && <p>Repasse registrado: {date(r.data_repasse)}</p>}</td>
    </tr>)}</tbody></table></div>
    {!rows.length && <div className="empty">Nenhum lançamento para este filtro.</div>}
    <details style={{marginTop:20}}><summary>Regras dos valores e prazos</summary><p>Imóveis: 0,1288% da 1ª à 10ª; 0,2374% da 11ª à 13ª; zero na 14ª e bonificação de 0,3% na 15ª. Veículos: 0,1538% até a 13ª, sem bonificação imobiliária. Consultor Prévia: 1,5% do crédito dividido em 13 repasses, com ajuste na última parcela.</p><p>O saldo Bauer é a diferença entre o bruto e o repasse. A bonificação da 15ª fica integralmente com Bauer e já compõe o bruto, sem soma em duplicidade.</p><p>O quinto dia útil usa o calendário bancário nacional, de segunda a sexta, com feriados nacionais. Feriados locais podem ser incluídos no cadastro do calendário. Fonte: <a href="https://feriadosbancarios.febraban.org.br/" target="_blank" rel="noreferrer">Febraban</a>.</p><p>Previsão no dia 5 não confirma recebimento. Repasse só vira pendência de pagamento após entrada confirmada e nunca é marcado automaticamente como efetuado. Se a entrada chegar depois do prazo, a data de repasse precisará ser informada.</p><p>Calendário-base calculado pela venda; referências originais da planilha foram preservadas. Valores históricos confirmados prevalecem sobre estimativas. Após o desligamento, os clientes ficam sob cuidados de Bauer e as entradas seguintes ficam integralmente com Bauer, sem repasse ao ex-consultor. O mês da saída, quando sem dia exato, fica sujeito a conferência. Repasses históricos confirmados são preservados.</p></details>
  </section>;
}

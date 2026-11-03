"use client";
import {useState} from "react";
import oficial from "@/public/relatorio_oficial_outubro2026.json";
import equipe from "@/public/consultores.json";
import clientes from "@/public/clientes_novos.json";
import historico from "@/public/historico_comissoes.json";
import {gerarFluxoEquipe,resumirPrevisaoMensal,type ClienteFinanceiro,type RecebimentoEquipe} from "@/lib/financeiro-equipe";
const money=(n:number)=>n.toLocaleString("pt-BR",{style:"currency",currency:"BRL"});
export function PrevisaoMensal(){
 const [mes,setMes]=useState("2026-11");
 const fluxo=gerarFluxoEquipe(equipe.contratos,clientes as ClienteFinanceiro[],historico.lancamentos as RecebimentoEquipe[],equipe.repasses_confirmados,equipe.feriados_locais);
 const meses=[...new Set([...fluxo.map(r=>r.mes_recebimento),...historico.lancamentos.map(r=>r.mes_recebimento).filter((x):x is string=>Boolean(x))])].sort();
 const resumo=resumirPrevisaoMensal(mes,equipe.contratos,fluxo,historico.lancamentos as RecebimentoEquipe[],mes===oficial.mes_recebimento ? oficial.desconto_total : 0);
 return <section className="panel" style={{borderTop:"3px solid #b89543",marginBottom:24}}>
  <div className="panel-heading"><div><span className="eyebrow">SEU DINHEIRO, SEPARADO DOS REPASSES</span><h2>Sua previsão de recebimento por mês</h2><p>Somente sua parte entra nesta previsão. O dinheiro dos consultores fica separado. Vendas após 15/10/2026 começam na competência de novembro, com primeira comissão em dezembro.</p></div><label>Mês de recebimento<select aria-label="Mês da sua previsão líquida" value={mes} onChange={e=>setMes(e.target.value)}>{meses.map(m=><option key={m} value={m}>{m.split("-").reverse().join("/")}</option>)}</select></label></div>
  {mes===oficial.mes_recebimento && <div className="info-note"><strong>Relatório oficial de outubro/2026: confirmado a receber em novembro.</strong><p>Bruto {money(oficial.bruto)} · descontos Safra {money(oficial.desconto_total)} · líquido na matrícula {money(oficial.liquido_matricula)}. Do líquido, {money(oficial.repasse_consultores)} são dos consultores e {money(oficial.liquido_bauer)} ficam com você. Ainda não confirmado como dinheiro recebido em conta.</p><details><summary>Conferência do relatório oficial</summary><p>Comissões regulares: {money(oficial.comissoes_regulares)}. Ecommerce: {money(oficial.ecommerce)}, incluído separadamente no bruto. Marco: parcelas 8 e 9 de R$ 600,80 cada, prevalecendo sobre a estimativa. Ana Carolina: consta no relatório com venda em 15/10, incluída oficialmente em novembro.</p><p>Previsões ausentes no relatório, sem presumir falta de pagamento: {oficial.ausentes_previsao.map(x=>`${x.cliente} (${x.grupo}/${x.cota})`).join("; ")}.</p></details></div>}
  <div className="stats">
   <div className="stat"><div className="stat-label">Sua previsão</div><strong>{money(resumo.sua_previsao)}</strong><small>Carteira própria {money(resumo.base_propria)} + sua parte da equipe {money(resumo.parte_bauer_equipe)} · descontos {money(resumo.ajustes)}</small></div>
   <div className="stat"><div className="stat-label">Previsão dos consultores</div><strong>{money(resumo.repasses_previstos)}</strong><small>Separada da sua previsão</small></div>
   <div className="stat"><div className="stat-label">Total previsto na matrícula</div><strong>{money(resumo.bruto_matricula_previsto)}</strong><small>Bruto antes dos descontos: sua parte + consultores + descontos</small></div>
  </div>
  <p>Entradas da equipe já confirmadas neste mês: {money(resumo.bruto_equipe_recebido)}. Parte dos consultores nessas entradas: {money(resumo.repasses_sobre_recebidos)}. Sua parte: {money(resumo.parte_bauer_recebida)}. Esses valores confirmados ficam fora da previsão.</p>
  <p>Contratos presentes na carteira e na equipe entram uma única vez. Atrasos e modalidades pendentes ficam fora da previsão; {resumo.excluidas} parcelas da equipe excluídas neste mês.</p>
  <details><summary>Comparar meses</summary><div className="table-scroll"><table><thead><tr><th>Recebimento</th><th>Sua previsão</th><th>Previsão dos consultores</th><th>Total previsto na matrícula</th><th>Equipe já recebida</th><th>Repasses a pagar após entrada confirmada</th></tr></thead><tbody>{meses.map(m=>{const r=resumirPrevisaoMensal(m,equipe.contratos,fluxo,historico.lancamentos as RecebimentoEquipe[],m===oficial.mes_recebimento ? oficial.desconto_total : 0);return <tr key={m}><td>{m.split("-").reverse().join("/")}</td><td>{money(r.sua_previsao)}</td><td>{money(r.repasses_previstos)}</td><td>{money(r.bruto_matricula_previsto)}</td><td>{money(r.bruto_equipe_recebido)}</td><td>{money(r.a_repassar)}</td></tr>;})}</tbody></table></div></details>
  <small>Base: parcelas registradas da carteira própria e calendário da equipe. Meses futuros com poucos registros da carteira própria apresentam previsão parcial. Recebimentos e repasses só ficam confirmados quando informados.</small>
 </section>;
}

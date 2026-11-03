"use client";

import { useState } from "react";
import { FinanceiroEquipe } from "@/app/components/financeiro-equipe";
import source from "@/public/consultores.json";
interface ContratoEquipe {
  consultor_situacao?: string; desligamento_mes_informado?: string | null; regra_desligamento_confirmada_em?: string;
  id: string; consultor: string; cliente: string; grupo: string; cota: number; credito: number; data_venda: string;
  matricula_informada: string | null; comissao_consultor: number | null; repasse_supervisao: number | null;
  comissao_calculada_total: number; comissao_calculada_mensal: number; quantidade_parcelas_comissao: number;
  calendario_comissoes: { numero_parcela: number; competencia: string; vencimento_parcela: string | null; recebimento_previsto: string | null; valor: number; status: string; observacao: string }[];
  tipo_produto: string | null; valor_mensal_informado?: number;
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

  const informadas = contratos;
  const totalInformado = informadas.reduce((s,c) => s + c.comissao_calculada_total,0);

  function exportar() {
    const lines = [["Consultor", "Situação consultor", "Cliente", "Grupo", "Cota", "Crédito", "Data da venda", "Modalidade", "Comissão total informada", "Valor mensal informado", "Parcela de referência", "Mês de referência", "Diferença Bauer", "Status", "Observação"], ...contratos.map(c => [c.consultor, c.consultor_situacao ?? "Não informado", c.cliente, c.grupo, c.cota, c.credito.toFixed(2).replace(".", ","), date(c.data_venda), c.tipo_produto ?? "A confirmar", c.comissao_calculada_total.toFixed(2).replace(".", ","), c.comissao_calculada_mensal.toFixed(2).replace(".", ","), c.parcela_referencia ?? "", referencia(c.mes_referencia), "Consultar fluxo mensal", "Pagamento não confirmado", c.observacao ?? ""])];
    const csv = "\uFEFF" + lines.map(row => row.map(v => `"${String(v).replace(/"/g, '""')}"`).join(";")).join("\r\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    const a = document.createElement("a"); a.href = url; a.download = "contratos-consultores.csv"; a.click(); URL.revokeObjectURL(url);
  }

  return <>
    <section className="stats" aria-label="Resumo dos consultores">
      <div className="stat"><div className="stat-label">Consultores no período</div><strong>{new Set(contratos.map(c => c.consultor)).size}</strong><small>Responsáveis pelos contratos filtrados</small></div>
      <div className="stat"><div className="stat-label">Contratos</div><strong>{contratos.length}</strong><small>{new Set(contratos.map(c => c.cliente)).size} clientes no período</small></div>
      <div className="stat"><div className="stat-label">Crédito vendido</div><strong>{money(credito)}</strong><small>Carteira dos consultores</small></div>
      <div className="stat"><div className="stat-label">Referência contratual de 1,5%</div><strong>{informadas.length ? money(totalInformado) : "A configurar"}</strong><small>Total original de {informadas.length} cotas, antes dos desligamentos. Consulte a divisão mensal abaixo.</small></div>
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
      <FinanceiroEquipe contratos={contratos} repasses={source.repasses_confirmados} feriados={source.feriados_locais} />
      {nomes.filter(n => !consultor || n === consultor).map(n => {
        const rows = contratos.filter(c => c.consultor === n);
        if (!rows.length) return null;
        return <article key={n} style={{borderTop:"3px solid #b89543",paddingTop:20,marginBottom:32}}>
          <h3>{n}</h3><p>{rows[0].consultor_situacao ?? "Não informado"}</p><p>{rows.length} contratos · {new Set(rows.map(c => c.cliente)).size} clientes · {money(rows.reduce((s,c) => s+c.credito,0))}</p>
          <div className="table-scroll"><table><thead><tr><th>Cliente</th><th>Grupo / cota</th><th>Modalidade</th><th>Crédito</th><th>Venda</th><th>Comissão total · Prévia</th><th>Parcela mensal · 13 vezes</th><th>Parcela / referência</th><th>Diferença Bauer</th><th>Observações</th></tr></thead><tbody>{rows.map(c => <tr key={c.id}><td>{c.cliente}</td><td>{c.grupo} / {c.cota}</td><td>{c.tipo_produto ?? "A confirmar"}</td><td>{money(c.credito)}</td><td>{date(c.data_venda)}</td><td>{money(c.comissao_calculada_total)}</td><td>{money(c.comissao_calculada_mensal)}</td><td>{c.parcela_referencia ? `Parcela ${c.parcela_referencia}` : "Não informada"}<br />{referencia(c.mes_referencia)}</td><td>Bruto menos repasse<br/>Ver fluxo do mês</td><td><details><summary>Regra original: 13 parcelas</summary><p>Cronograma original da regra Prévia, sem confirmação de recebimento. Para saber o repasse devido após desligamento e o valor que fica com Bauer, consulte o fluxo financeiro acima. As referências originais foram preservadas.</p><ol>{c.calendario_comissoes.map(parcela => <li key={parcela.numero_parcela}>Parcela {parcela.numero_parcela}: {money(parcela.valor)} · competência {referencia(parcela.competencia)} · vencimento {parcela.vencimento_parcela ? date(parcela.vencimento_parcela) : "modalidade a confirmar"} · recebimento previsto {parcela.recebimento_previsto ? date(parcela.recebimento_previsto) : "sem previsão"} · {parcela.status}<p>{parcela.observacao}</p></li>)}</ol></details>{c.observacao}<br />{c.divergencias_carteira?.map(v => <small key={v}>{v}</small>)}</td></tr>)}</tbody></table></div>
        </article>;
      })}
      {!contratos.length && <div className="empty">Nenhum contrato encontrado para estes filtros.</div>}
    </section>
    <section className="panel"><h2>Regra de comissão: consultor Prévia</h2><p>Comissão total de <strong>1,5% do crédito comercializado</strong>. Exemplo: R$ 100.000,00 em crédito corresponde a R$ 1.500,00 de comissão total.</p><p>Aplicação conforme plano de carreira confirmado do consultor. Pagamento em 13 parcelas, com ajuste dos centavos na última para fechar o total. Imóveis vencem dia 15 e veículos dia 7; primeira parcela no ato da venda e recebimento previsto no dia 5 do mês seguinte. Valores originais informados permanecem no histórico. O bruto entra na matrícula Bauer. O repasse ao consultor é de 1,5% em 13 parcelas; a diferença e a bonificação imobiliária ficam com Bauer. Prazo do repasse: quinto dia útil do mês de recebimento, após confirmação da entrada.</p></section>
    <section className="panel"><h2>Controle de comissões da equipe</h2><p>Os totais e valores mensais informados foram preservados conforme sua relação. Mês e parcela são referências da planilha, sem confirmação de recebimento ou repasse. Os valores mensais de referências diferentes não representam uma previsão única do mês atual.</p><p>Desligamento do consultor não cancela a cota do cliente. Contratos vinculados à carteira mantêm o histórico de pagamento existente, sem duplicar créditos ou alterar suas comissões pessoais.</p><p>Regra Prévia aplicada ao calendário da equipe conforme orientação. Atrasos conhecidos e cotas com três ou mais atrasos ficam separados da previsão. Após desligamento, o cliente fica sob responsabilidade de Bauer e os recebimentos seguintes ficam integralmente com Bauer, sem novo repasse ao ex-consultor. Histórico anterior preservado. O fluxo financeiro acima separa bruto, repasse ao consultor e saldo Bauer. CPF, chave Pix, e-mail e senha não são exibidos nesta aba pública. A matrícula 13135 permanece conforme a relação anterior.</p></section>
  </>;
}

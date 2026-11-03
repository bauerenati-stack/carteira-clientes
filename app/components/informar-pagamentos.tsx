"use client";
import { useEffect, useState } from "react";
import data from "@/public/consultores.json";

interface Informe { id:string;consultor:string;mes:string;valor:number;data:string;cotas:string;observacao:string; }
const key="bauer-informes-repasse-v1";
const money=(n:number)=>n.toLocaleString("pt-BR",{style:"currency",currency:"BRL"});
export function InformarPagamentos(){
  const [informes,setInformes]=useState<Informe[]>([]),[consultor,setConsultor]=useState(""),[mes,setMes]=useState(""),[valor,setValor]=useState(""),[dataPago,setDataPago]=useState(""),[cotas,setCotas]=useState(""),[observacao,setObservacao]=useState(""),[erro,setErro]=useState(""),[aviso,setAviso]=useState(""),[pronto,setPronto]=useState(false);
  const nomes=[...new Set(data.contratos.map(c=>c.consultor))].sort();
  useEffect(()=>{try{const saved=JSON.parse(localStorage.getItem(key)||"[]");if(Array.isArray(saved))setInformes(saved.filter((x:Informe)=>x && typeof x.id==="string" && nomes.includes(x.consultor) && /^\d{4}-\d{2}$/.test(x.mes) && typeof x.valor==="number" && Number.isFinite(x.valor) && x.valor>0));}catch{setErro("Não foi possível ler os rascunhos deste navegador.");}setPronto(true);},[]); // eslint-disable-line react-hooks/exhaustive-deps
  function salvar(e:React.FormEvent){e.preventDefault();setErro("");setAviso("");const v=Number(valor);
    if(!consultor || !/^\d{4}-\d{2}$/.test(mes) || !Number.isFinite(v) || v<=0){setErro("Informe consultor, mês e valor positivo.");return;}
    const registro={id:crypto.randomUUID(),consultor,mes,valor:Math.round(v*100)/100,data:dataPago,cotas:cotas.trim(),observacao:observacao.trim()};
    if(informes.some(i=>i.consultor===consultor && i.mes===mes && i.valor===registro.valor && i.data===dataPago && i.cotas===registro.cotas)){setErro("Esse informe já está na lista. Confira antes de duplicar um pagamento.");return;}
    const next=[...informes,registro];try{localStorage.setItem(key,JSON.stringify(next));setInformes(next);setAviso("Informe salvo neste navegador. Copie a confirmação abaixo e envie no chat para atualizar o registro oficial.");setValor("");setCotas("");setObservacao("");}catch{setErro("O navegador não conseguiu salvar. Copie os dados antes de sair desta página.");}
  }
  const mensagem=informes.map(i=>`Confirmo que paguei ao consultor ${i.consultor} o valor de ${money(i.valor)}, referente ao mês de recebimento ${i.mes.split("-").reverse().join("/")}.${i.data ? ` Data do repasse: ${i.data.split("-").reverse().join("/")}.` : " Data exata do repasse não informada."}${i.cotas ? ` Grupos/cotas e parcelas: ${i.cotas}.` : " Conferir a distribuição entre as cotas antes de baixar parcelas."}${i.observacao ? ` Observação: ${i.observacao}` : ""}`).join("\n\n");
  async function copiar(){try{await navigator.clipboard.writeText(mensagem);setAviso("Confirmação copiada. Cole e envie no nosso chat para registrar os repasses oficialmente.");}catch{setAviso("Selecione e copie o texto da confirmação abaixo.");}}
  function backup(){const url=URL.createObjectURL(new Blob([JSON.stringify({versao:1,tipo:"informes_pendentes_registro_oficial",informes},null,2)],{type:"application/json"}));const a=document.createElement("a");a.href=url;a.download="informes-pagamentos-consultores.json";a.click();URL.revokeObjectURL(url);}
  return <>
    <section className="panel"><span className="eyebrow">CONFIRMAÇÃO DE REPASSES</span><h2>Informar consultores que você já pagou</h2><p>Preencha somente pagamentos já efetuados. Informe o mês do recebimento ao qual o repasse se refere, mesmo que a transferência tenha ocorrido em outro mês.</p><p><strong>Os informes ficam neste navegador como rascunhos.</strong> Copie a confirmação e envie no chat para atualizar o histórico oficial, o GitHub e o backup. Preencher aqui não efetua transferências e não baixa comissões automaticamente.</p>
    <form onSubmit={salvar} style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(220px,1fr))",gap:16,marginTop:20}}>
      <label>Consultor<select aria-label="Consultor pago" required value={consultor} onChange={e=>setConsultor(e.target.value)}><option value="">Selecione</option>{nomes.map(n=><option key={n}>{n}</option>)}</select></label>
      <label>Mês de referência do recebimento<input aria-label="Mês de referência do repasse" required type="month" value={mes} onChange={e=>setMes(e.target.value)}/></label>
      <label>Valor efetivamente pago (R$)<input aria-label="Valor do repasse pago" required type="number" min="0.01" step="0.01" value={valor} onChange={e=>setValor(e.target.value)}/></label>
      <label>Data do repasse, se souber<input aria-label="Data do repasse" type="date" value={dataPago} onChange={e=>setDataPago(e.target.value)}/></label>
      <label>Grupos, cotas e parcelas<input aria-label="Cotas e parcelas do repasse" placeholder="Ex.: grupo 012210, cota 933, parcela 1" value={cotas} onChange={e=>setCotas(e.target.value)}/></label>
      <label>Observação<input aria-label="Observação do pagamento" value={observacao} onChange={e=>setObservacao(e.target.value)}/></label>
      <button className="button" type="submit" disabled={!pronto}>Adicionar informe de pagamento</button>
    </form>{erro && <p role="alert">{erro}</p>}{aviso && <p role="status">{aviso}</p>}</section>
    <section className="panel"><div className="panel-heading"><div><h2>Informes preparados</h2><p>{informes.length} informes aguardando envio no chat e registro oficial.</p></div><button className="button" disabled={!informes.length} onClick={backup}>Baixar cópia dos informes</button></div>
      <div className="table-scroll"><table><thead><tr><th>Consultor</th><th>Referência</th><th>Valor pago informado</th><th>Data</th><th>Cotas / parcelas</th><th>Situação</th></tr></thead><tbody>{informes.map(i=><tr key={i.id}><td>{i.consultor}</td><td>{i.mes.split("-").reverse().join("/")}</td><td>{money(i.valor)}</td><td>{i.data ? i.data.split("-").reverse().join("/") : "Não informada"}</td><td>{i.cotas || "Distribuição a conferir"}</td><td>Rascunho local, registro oficial a conferir</td></tr>)}</tbody></table></div>
      {!informes.length && <div className="empty">Nenhum pagamento informado neste navegador.</div>}
      {informes.length>0 && <><h3>Mensagem para enviar no chat</h3><textarea aria-label="Confirmação para enviar ao chat" readOnly value={mensagem} rows={Math.min(18,informes.length*4+2)} style={{width:"100%",padding:16}}/><button className="button" onClick={copiar}>Copiar confirmação para o chat</button></>}
    </section>
  </>;
}

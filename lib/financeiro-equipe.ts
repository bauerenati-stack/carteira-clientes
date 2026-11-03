export interface ContratoFinanceiro {
  id: string; consultor: string; cliente: string; grupo: string; cota: number; credito: number;
  consultor_situacao?: string; desligamento_mes_informado?: string | null; regra_desligamento_confirmada_em?: string;
  data_venda: string; tipo_produto: string | null; numero_contrato?: number | null;
}
export interface ClienteFinanceiro {
  id: string; grupo: string; cota: number; num_contrato: number | null; tipo_produto: string;
  situacao: string; parcelas_atraso: number;
  pagamentos_mensais?: Record<string, { status: string; comissao_recebimento_previsto?: string }>;
}
export interface RecebimentoEquipe {
  id: string; grupo?: string; cota?: number; num_contrato: number | null; numero_parcela: number;
  status: string; valor_comissao: number; mes_recebimento: string | null; data_recebimento?: string | null;
}
export interface RepasseConfirmado {
  contrato_id: string; numero_parcela: number; valor: number; data_repasse: string;
}
export interface FluxoEquipe {
  id: string; contrato_id: string; consultor: string; cliente: string; grupo: string; cota: number;
  numero: number; competencia: string; modalidade: string | null; vencimento: string | null;
  mes_planejado: string; mes_recebimento: string; recebimento_previsto: string | null;
  data_recebimento: string | null; prazo_repasse: string | null; bruto: number | null;
  repasse: number; saldo: number | null; bonificacao: number; recebido: number;
  repassado: number; repasse_pendente: number; data_repasse: string | null;
  regra_repasse: string;
  status: string; pagamento_cliente: string; fonte_recebimento: string | null;
}
const cents = (v: number) => Math.round((v + Number.EPSILON) * 100);
const iso = (d: Date) => d.toISOString().slice(0,10);
export function adicionarMes(competencia: string, offset: number) {
  const [ano, mes] = competencia.split("-").map(Number);
  return new Date(Date.UTC(ano, mes - 1 + offset, 1)).toISOString().slice(0,7);
}
function pascoa(ano: number) {
  const a=ano%19,b=Math.floor(ano/100),c=ano%100,d=Math.floor(b/4),e=b%4,f=Math.floor((b+8)/25),g=Math.floor((b-f+1)/3);
  const h=(19*a+b-d-g+15)%30,i=Math.floor(c/4),k=c%4,l=(32+2*e+2*i-h-k)%7,m=Math.floor((a+11*h+22*l)/451);
  const mes=Math.floor((h+l-7*m+114)/31),dia=(h+l-7*m+114)%31+1;
  return new Date(Date.UTC(ano,mes-1,dia));
}
export function quintoDiaUtil(mes: string, feriadosLocais: string[] = []) {
  const [ano,numero]=mes.split("-").map(Number);
  const feriados=new Set(["01-01","04-21","05-01","09-07","10-12","11-02","11-15","11-20","12-25"].map(d=>`${ano}-${d}`));
  const domingo=pascoa(ano);
  for(const offset of [-48,-47,-2,60]) { const d=new Date(domingo);d.setUTCDate(d.getUTCDate()+offset);feriados.add(iso(d)); }
  feriadosLocais.forEach(d=>feriados.add(d));
  let count=0;
  for(let dia=1;dia<=31;dia++) {
    const d=new Date(Date.UTC(ano,numero-1,dia));
    if(d.getUTCDay()!==0 && d.getUTCDay()!==6 && !feriados.has(iso(d))) count++;
    if(count===5) return iso(d);
  }
  throw new Error("Mês inválido para prazo de repasse");
}
export function valorRepasse(credito: number, numero: number) {
  if(numero<1 || numero>13) return 0;
  const total=Math.round(credito*1.5); // centavos de 1,5% do crédito
  const mensal=Math.round(total/13);
  return (numero===13 ? total-12*mensal : mensal)/100;
}
export function brutoMatricula(credito: number, numero: number, modalidade: string | null) {
  if(!modalidade) return null;
  const taxa=modalidade==="Veicular" ? (numero<=13 ? .1538 : 0) : numero<=10 ? .1288 : numero<=13 ? .2374 : numero===15 ? .3 : 0;
  return cents(credito*taxa/100)/100;
}
export function gerarFluxoEquipe(contratos: ContratoFinanceiro[], clientes: ClienteFinanceiro[], historico: RecebimentoEquipe[], repasses: RepasseConfirmado[] = [], feriadosLocais: string[] = []) {
  const rows: FluxoEquipe[]=[];
  for(const c of contratos) {
    const core=clientes.find(x=>Number(x.grupo)===Number(c.grupo) && x.cota===c.cota);
    const tipos=[...new Set(clientes.filter(x=>Number(x.grupo)===Number(c.grupo)).map(x=>x.tipo_produto))];
    const modalidade=c.tipo_produto || core?.tipo_produto || (tipos.length===1 ? tipos[0] : null);
    for(let numero=1;numero<=15;numero++) {
      const competencia=adicionarMes(c.data_venda.slice(0,7),numero-1),mesPlanejado=adicionarMes(competencia,1);
      const pagamento=core?.pagamentos_mensais?.[competencia];
      const recebido=historico.find(x=>x.status==="recebida" && x.numero_parcela===numero &&
        ((core?.num_contrato && x.num_contrato===core.num_contrato) || (Number(x.grupo)===Number(c.grupo) && x.cota===c.cota)));
      const bruto=recebido ? recebido.valor_comissao : brutoMatricula(c.credito,numero,modalidade);
      let repasse=valorRepasse(c.credito,numero);
      const pagos=repasses.filter(x=>x.contrato_id===c.id && x.numero_parcela===numero);
      const repassado=cents(pagos.reduce((s,x)=>s+x.valor,0))/100;
      const cancelada=core?.situacao.toLowerCase().startsWith("cancelad");
      const bloqueio=cancelada ? "Cancelada" : pagamento?.status==="atrasada" ? "Cliente em atraso" : (core?.parcelas_atraso ?? 0)>=3 ? "Em risco: 3+ atrasos" : null;
      const mes=recebido?.mes_recebimento || pagamento?.comissao_recebimento_previsto || mesPlanejado;
      const desligado=c.consultor_situacao==="Desligado";
      const aposSaida=desligado && (c.desligamento_mes_informado ? mes>c.desligamento_mes_informado : mes>=(c.regra_desligamento_confirmada_em || "2026-11-03").slice(0,7));
      const saidaIncerta=desligado && !aposSaida && (!c.desligamento_mes_informado || mes===c.desligamento_mes_informado);
      if(aposSaida) repasse=0;
      const regraRepasse=aposSaida ? "Sem repasse: consultor desligado; cliente sob cuidados de Bauer" : saidaIncerta ? "Conferir data de desligamento antes do repasse" : "Prévia: 1,5% em 13 parcelas";
      const naoRemunerada=bruto===0 && repasse===0;
      const status=recebido ? "Recebida na matrícula" : naoRemunerada ? "Sem comissão" : bloqueio || (bruto===null ? "Modalidade a confirmar" : "Prevista");
      const previsao=!recebido && !bloqueio && !naoRemunerada && bruto!==null ? `${mes}-05` : null;
      rows.push({id:`${c.id}_${numero}`,contrato_id:c.id,consultor:c.consultor,cliente:c.cliente,grupo:c.grupo,cota:c.cota,numero,competencia,modalidade,
        vencimento:numero===1 ? c.data_venda : modalidade ? `${competencia}-${modalidade==="Veicular" ? "07" : "15"}` : null,
        mes_planejado:mesPlanejado,mes_recebimento:mes,recebimento_previsto:previsao,data_recebimento:recebido?.data_recebimento || null,
        prazo_repasse:!saidaIncerta && repasse>0 && (!bloqueio || recebido) && (recebido || previsao) ? quintoDiaUtil(mes,feriadosLocais) : null,
        bruto,repasse,saldo:bruto===null ? null : (cents(bruto)-cents(repasse))/100,
        bonificacao:numero===15 && modalidade==="Imóvel" ? bruto || 0 : 0,
        recebido:recebido?.valor_comissao || 0,repassado,repasse_pendente:recebido && !saidaIncerta ? Math.max(0,cents(repasse)-cents(repassado))/100 : 0,
        data_repasse:pagos.length ? pagos.map(x=>x.data_repasse).sort().at(-1) || null : null,
        regra_repasse:regraRepasse,status,pagamento_cliente:pagamento?.status || "não confirmado",fonte_recebimento:recebido?.id || null});
    }
  }
  return rows;
}

export function resumirPrevisaoMensal(mes: string, contratos: ContratoFinanceiro[], fluxo: FluxoEquipe[], historico: RecebimentoEquipe[]) {
  const pertenceEquipe=(x:RecebimentoEquipe)=>contratos.some(c=>
    (c.numero_contrato && x.num_contrato===c.numero_contrato) ||
    (Number(c.grupo)===Number(x.grupo) && c.cota===x.cota));
  const proprias=historico.filter(x=>x.status==="prevista" && x.mes_recebimento===mes && !pertenceEquipe(x));
  const equipe=fluxo.filter(x=>x.mes_recebimento===mes);
  const previstas=equipe.filter(x=>x.status==="Prevista"),recebidas=equipe.filter(x=>x.status==="Recebida na matrícula");
  const somar=(values:number[])=>values.reduce((s,x)=>s+Math.round(x*100),0)/100;
  const basePropria=somar(proprias.map(x=>x.valor_comissao));
  const margem=somar(previstas.map(x=>x.saldo??0));
  const brutoEquipe=somar(previstas.map(x=>x.bruto??0));
  const repasseEquipe=somar(previstas.map(x=>x.repasse));
  return {mes,base_propria:basePropria,parte_bauer_equipe:margem,sua_previsao:somar([basePropria,margem]),
    bruto_equipe_previsto:brutoEquipe,repasses_previstos:repasseEquipe,bruto_matricula_previsto:somar([basePropria,brutoEquipe]),
    bruto_equipe_recebido:somar(recebidas.map(x=>x.recebido)),repasses_sobre_recebidos:somar(recebidas.map(x=>x.repasse)),
    parte_bauer_recebida:somar(recebidas.map(x=>x.saldo??0)),repasses_confirmados:somar(equipe.map(x=>x.repassado)),
    a_repassar:somar(recebidas.map(x=>x.repasse_pendente)),
    repasse_total_mes:somar([...previstas,...recebidas].map(x=>x.repasse)),
    contratos_proprios_previstos:proprias.length,
    excluidas:equipe.filter(x=>!["Prevista","Recebida na matrícula","Sem comissão"].includes(x.status)).length};
}

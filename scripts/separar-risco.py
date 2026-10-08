"""Separar estimativas; quantidade em atraso não comprova cancelamento."""
import json
from pathlib import Path
from decimal import Decimal, ROUND_HALF_UP
root=Path(__file__).resolve().parents[1]/'public'
c=json.loads((root/'clientes_novos.json').read_text());p=json.loads((root/'projecao_outubro.json').read_text())
rows=p['clientes_previstos']+p.get('clientes_em_risco',[])+p.get('clientes_cancelados',[])
p['clientes_previstos']=[];p['clientes_em_risco']=[];p['clientes_cancelados']=[]
used=set()
for r in rows:
 matches=[x for x in c if str(x['num_contrato'])==str(r['num_contrato'])] if r.get('num_contrato') else [x for x in c if (x['nome'],x['credito'],x['data_venda'])==(r['nome'],r['credito'],r['data_venda'])]
 matches=[x for x in matches if x['num_contrato'] not in used]
 if not matches:p['clientes_em_risco'].append(r);continue
 x=matches[0];used.add(x['num_contrato']);r.update(num_contrato=x['num_contrato'],grupo=x['grupo'],cota=x['cota'],parcelas_atraso=x['parcelas_atraso'])
 key='clientes_cancelados' if x['situacao'].lower().startswith('cancelad') else 'clientes_em_risco' if x['parcelas_atraso']>=3 else 'clientes_previstos'
 p[key].append(r)
def total(rows):return float(sum((Decimal(str(r['comissao'])) for r in rows),Decimal(0)).quantize(Decimal('.01'),rounding=ROUND_HALF_UP))
p.update(projecao_total=total(p['clientes_previstos']),projecao_em_risco=total(p['clientes_em_risco']),projecao_cancelados=total(p['clientes_cancelados']),clientes_elegibles=len(p['clientes_previstos']),regra_risco='3 ou mais parcelas em atraso ficam fora da previsão principal. Cancelamento exige situação confirmada no relatório.',data_calculo='2026-10-08')
(root/'projecao_outubro.json').write_text(json.dumps(p,ensure_ascii=False,indent=2)+'\n')
a=json.loads((root/'analise_corrigida.json').read_text())
for r in a['meses']:
 if (r['ano'],r['mes'])==(2026,10) and r['recebido'] is None:r['projecao']=p['projecao_total']
(root/'analise_corrigida.json').write_text(json.dumps(a,ensure_ascii=False,indent=2)+'\n')
print(p['projecao_total'],p['projecao_em_risco'],len(p['clientes_em_risco']))

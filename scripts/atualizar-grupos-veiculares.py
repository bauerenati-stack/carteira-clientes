"""Correção por contrato. Recebimentos importados não são recalculados."""
import json
from decimal import Decimal, ROUND_HALF_UP
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
GROUPS = {'001656', '001687', '001704', '001706', '001710'}
RATE = Decimal('0.001538')
def money(value):
    return float(Decimal(str(value)).quantize(Decimal('0.01'), rounding=ROUND_HALF_UP))
def read(name):
    return json.loads((ROOT / 'public' / (name + '.json')).read_text())
def write(name, value):
    (ROOT / 'public' / (name + '.json')).write_text(json.dumps(value, ensure_ascii=False, indent=2) + '\n')
def matches(c):
    return str(c.get('grupo', '')).zfill(6) in GROUPS

clients = read('clientes_novos')
matched = [c for c in clients if matches(c)]
assert len(matched) == 6
by_contract = {str(c['num_contrato']): c for c in matched}
for name in ('clientes_novos', 'clientes', 'dados_clientes', 'clientes_processados'):
    data = read(name)
    for c in data:
        if not matches(c):
            continue
        credit = Decimal(str(c.get('credito', c.get('valor_credito', 0))))
        installment = money(credit * RATE)
        paid = min(max(int(c['parcelas_pagas']), 0), 13)
        overdue = min(max(int(c['parcelas_atraso']), 0), 13 - paid)
        c.update(tipo_produto='Veicular', taxa_comissao=0.1538,
                 comissao_mensal=installment, comissao_proxima_parcela=installment if paid < 13 else 0,
                 limite_parcelas_comissao=13, dia_vencimento=7, dia_recebimento_comissao=5)
        if 'comissao_total' in c:
            c.update(comissao_total=money(credit * RATE * 13),
                     comissao_paga=money(credit * RATE * paid),
                     comissao_atraso=money(credit * RATE * overdue),
                     comissao_pendente=money(credit * RATE * (13 - paid)),
                     natureza_comissoes='Estimativa pelo número de parcelas pagas pelo cliente. Não comprova recebimento pelo consultor.')
    write(name, data)

projection = read('projecao_outubro')
# Identificar contrato por nome, crédito e data, nunca pelo nome sozinho.
for c in matched:
    rows = [r for r in projection['clientes_previstos'] if
            (r['nome'], r['credito'], r['data_venda']) == (c['nome'], c['credito'], c['data_venda'])]
    assert len(rows) <= 1
    if not rows:
        rows = [dict(nome=c['nome'], credito=c['credito'], data_venda=c['data_venda'])]
        projection['clientes_previstos'].extend(rows)
    for r in rows:
        r.update(tipo='Veicular', grupo=c['grupo'], cota=c['cota'], num_contrato=c['num_contrato'],
                 taxa_comissao=0.1538, comissao=money(Decimal(str(c['credito'])) * RATE) if c['parcelas_pagas'] < 13 else 0)
projection['projecao_total'] = money(sum(Decimal(str(r['comissao'])) for r in projection['clientes_previstos']))
projection['clientes_elegibles'] = sum(r['comissao'] > 0 for r in projection['clientes_previstos'])
projection['data_calculo'] = '2026-10-08'
projection['aviso'] = 'Estimativa do relatório revisada por contrato. Grupos veiculares: 0,1538% por parcela, até a 13ª. Recebimento depende do pagamento do cliente; valores recebidos não foram alterados.'
write('projecao_outubro', projection)
analysis = read('analise_corrigida')
for row in analysis['meses']:
    if (row['ano'], row['mes']) == (2026, 10) and row['recebido'] is None:
        row['projecao'] = projection['projecao_total']
analysis['metodologia'] = 'Estimativa atual revisada por contrato, conforme projecao_outubro. Meses encerrados preservados conforme os relatórios importados; não há confirmação automática de pagamentos.'
write('analise_corrigida', analysis)

agenda = read('calendario_comissoes')
for c in matched:
    if c['parcelas_pagas'] >= 13:
        continue
    row_id = 'estimativa_veicular_' + str(c['num_contrato']) + '_2026_10'
    if any(r['id'] == row_id for r in agenda):
        continue
    agenda.append(dict(id=row_id, cliente=c['nome'], cliente_id=c['id'],
                      grupo=c['grupo'], cota=c['cota'], num_contrato=c['num_contrato'],
                      mes=11, ano=2026, data_vencimento='2026-11-05',
                      competencia_parcela='2026-10', vencimento_parcela='2026-10-07',
                      numero_parcela=c['parcelas_pagas'] + 1, tipo_produto='Veicular',
                      valor_comissao=money(Decimal(str(c['credito'])) * RATE), taxa_comissao=0.1538,
                      status='prevista', pagamento_cliente_status='não confirmado',
                      observacao='Estimativa condicionada à próxima parcela efetivamente paga. Vencimento veicular dia 7; comissão dia 5 do mês seguinte. Não confirma pagamento de outubro.'))
write('calendario_comissoes', agenda)
print(json.dumps({'cotas_corrigidas': len(matched), 'comissao_seis_cotas': money(sum(Decimal(str(c['credito'])) * RATE for c in matched)), 'projecao_revisada': projection['projecao_total']}, ensure_ascii=False))

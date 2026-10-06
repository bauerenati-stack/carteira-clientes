'use client';

import { useEffect, useState } from 'react';

interface Cliente {
  id: string;
  nome: string;
  cpf_cnpj: string;
  email: string;
  telefone: string;
  credito: number;
  tipo_produto: string;
  data_venda: string;
  status: string;
}

interface Parcela {
  id: string;
  cliente_id: string;
  cliente_nome: string;
  numero_parcela: number;
  tipo_produto: string;
  valor_credito: number;
  taxa_comissao: number;
  valor_comissao: number;
  data_vencimento: string;
  mes_vencimento: number;
  ano_vencimento: number;
  data_venda: string;
  status: string;
  mes_recebimento?: number;
  ano_recebimento?: number;
}

interface Recebimento {
  id: string;
  cliente: string;
  numero_parcela: number;
  tipo_produto: string;
  valor_comissao: number;
  status: string;
  data_recebimento: string;
}

interface RecebimentoMensal {
  mes: number;
  ano: number;
  data_relatorio: string;
  vendedora: string;
  cpf_vendedora: string;
  total_bruto: number;
  total_descontos: number;
  total_liquido: number;
  parcelas_recebidas: Recebimento[];
}

type Aba = 'dashboard' | 'recebimentos' | 'projecao' | 'novos-clientes' | 'importacao';

export default function Home() {
  const [abaAtiva, setAbaAtiva] = useState<Aba>('dashboard');
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [parcelas, setParcelas] = useState<Parcela[]>([]);
  const [recebimentoMensal, setRecebimentoMensal] = useState<RecebimentoMensal | null>(null);
  const [loading, setLoading] = useState(true);
  const [mesSelecionado, setMesSelecionado] = useState(new Date().getMonth() + 1);
  const [anoSelecionado, setAnoSelecionado] = useState(new Date().getFullYear());

  useEffect(() => {
    carregarDados();
  }, []);

  const carregarDados = async () => {
    try {
      const [clientesRes, parcelasRes, recebimentosRes] = await Promise.all([
        fetch('/clientes.json'),
        fetch('/parcelas.json'),
        fetch('/recebimentos_mensais.json'),
      ]);

      const [clientesData, parcelasData, recebimentosData] = await Promise.all([
        clientesRes.json(),
        parcelasRes.json(),
        recebimentosRes.json(),
      ]);

      setClientes(clientesData);
      setParcelas(parcelasData);
      setRecebimentoMensal(recebimentosData);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    } finally {
      setLoading(false);
    }
  };

  const calcularMetricasMes = (mes: number, ano: number) => {
    // Parcelas que DEVEM VENCER neste mês (PROJEÇÃO)
    const parcelasVencimento = parcelas.filter(
      p => p.mes_vencimento === mes && p.ano_vencimento === ano
    );

    // Total esperado (projeção)
    const totalProjecao = parcelasVencimento.reduce((sum, p) => sum + p.valor_comissao, 0);

    // Total realmente recebido (do Excel)
    const totalRecebido = recebimentoMensal &&
      recebimentoMensal.mes === mes &&
      recebimentoMensal.ano === ano
      ? recebimentoMensal.total_liquido
      : 0;

    // Diferença
    const diferenca = totalProjecao - totalRecebido;
    const percentualRecebimento = totalProjecao > 0 ? (totalRecebido / totalProjecao * 100) : 0;

    return {
      totalProjecao: parseFloat(totalProjecao.toFixed(2)),
      totalRecebido: parseFloat(totalRecebido.toFixed(2)),
      diferenca: parseFloat(diferenca.toFixed(2)),
      percentualRecebimento: parseFloat(percentualRecebimento.toFixed(1)),
      parcelasEsperadas: parcelasVencimento.length,
      parcelasRecebidas: recebimentoMensal?.parcelas_recebidas.length || 0,
    };
  };

  const obterClientesNovos = (mes: number, ano: number) => {
    return clientes.filter(c => {
      const dataParts = c.data_venda.split('-');
      const mesPrimeiraComissao = parseInt(dataParts[1]) + (c.tipo_produto === 'Imóvel' ? 1 : 1);
      const anoPrimeiraComissao = parseInt(dataParts[0]);

      if (mesPrimeiraComissao > 12) {
        return anoPrimeiraComissao + 1 === ano && mesPrimeiraComissao - 12 === mes;
      }
      return anoPrimeiraComissao === ano && mesPrimeiraComissao === mes;
    });
  };

  const metricas = calcularMetricasMes(mesSelecionado, anoSelecionado);
  const clientesNovos = obterClientesNovos(mesSelecionado, anoSelecionado);
  const parcelasRecebidas = recebimentoMensal?.parcelas_recebidas || [];

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: '#0f172a' }}>
        <p style={{ color: '#94a3b8' }}>Carregando...</p>
      </div>
    );
  }

  return (
    <div style={{ background: '#0f172a', color: '#e2e8f0', minHeight: '100vh', padding: '20px' }}>
      {/* HEADER */}
      <div style={{ marginBottom: '40px' }}>
        <h1 style={{ margin: '0 0 30px 0', fontSize: '28px', fontWeight: '600' }}>
          💰 Gerenciador de Comissões com Projeção
        </h1>

        {/* FILTROS */}
        <div style={{ display: 'flex', gap: '20px', marginBottom: '30px', flexWrap: 'wrap' }}>
          <div>
            <label style={{ fontSize: '12px', color: '#cbd5e1', display: 'block', marginBottom: '8px', textTransform: 'uppercase' }}>
              Mês
            </label>
            <select
              value={mesSelecionado}
              onChange={(e) => setMesSelecionado(parseInt(e.target.value))}
              style={{
                background: '#1e293b',
                border: '1px solid #334155',
                color: '#e2e8f0',
                padding: '8px 12px',
                borderRadius: '6px',
              }}
            >
              {Array.from({ length: 12 }, (_, i) => (
                <option key={i + 1} value={i + 1}>
                  {new Date(2026, i, 1).toLocaleString('pt-BR', { month: 'long' })}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label style={{ fontSize: '12px', color: '#cbd5e1', display: 'block', marginBottom: '8px', textTransform: 'uppercase' }}>
              Ano
            </label>
            <select
              value={anoSelecionado}
              onChange={(e) => setAnoSelecionado(parseInt(e.target.value))}
              style={{
                background: '#1e293b',
                border: '1px solid #334155',
                color: '#e2e8f0',
                padding: '8px 12px',
                borderRadius: '6px',
              }}
            >
              <option value={2025}>2025</option>
              <option value={2026}>2026</option>
              <option value={2027}>2027</option>
            </select>
          </div>
        </div>
      </div>

      {/* KPI CARDS */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '20px',
        marginBottom: '40px',
      }}>
        {/* Total Esperado (Projeção) */}
        <div style={{
          background: 'linear-gradient(135deg, #3b82f6 0%, #1e40af 100%)',
          padding: '24px',
          borderRadius: '12px',
          boxShadow: '0 8px 16px rgba(59, 130, 246, 0.2)',
        }}>
          <p style={{ margin: '0 0 12px 0', fontSize: '12px', color: 'rgba(255,255,255,0.8)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            📊 Total Esperado (Projeção)
          </p>
          <p style={{ margin: '0', fontSize: '32px', fontWeight: '700' }}>
            R$ {metricas.totalProjecao.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </p>
          <p style={{ margin: '8px 0 0 0', fontSize: '12px', color: 'rgba(255,255,255,0.7)' }}>
            {metricas.parcelasEsperadas} parcelas
          </p>
        </div>

        {/* Total Recebido */}
        <div style={{
          background: 'linear-gradient(135deg, #10b981 0%, #047857 100%)',
          padding: '24px',
          borderRadius: '12px',
          boxShadow: '0 8px 16px rgba(16, 185, 129, 0.2)',
        }}>
          <p style={{ margin: '0 0 12px 0', fontSize: '12px', color: 'rgba(255,255,255,0.8)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            ✅ Total Recebido (Excel)
          </p>
          <p style={{ margin: '0', fontSize: '32px', fontWeight: '700' }}>
            R$ {metricas.totalRecebido.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </p>
          <p style={{ margin: '8px 0 0 0', fontSize: '12px', color: 'rgba(255,255,255,0.7)' }}>
            {metricas.parcelasRecebidas} parcelas pagas
          </p>
        </div>

        {/* Diferença */}
        <div style={{
          background: metricas.diferenca > 0
            ? 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)'
            : 'linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%)',
          padding: '24px',
          borderRadius: '12px',
          boxShadow: metricas.diferenca > 0
            ? '0 8px 16px rgba(245, 158, 11, 0.2)'
            : '0 8px 16px rgba(139, 92, 246, 0.2)',
        }}>
          <p style={{ margin: '0 0 12px 0', fontSize: '12px', color: 'rgba(255,255,255,0.8)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            {metricas.diferenca > 0 ? '⚠️ Diferença (Pendente)' : '✨ Diferença (Bônus)'}
          </p>
          <p style={{ margin: '0', fontSize: '32px', fontWeight: '700' }}>
            R$ {Math.abs(metricas.diferenca).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </p>
          <p style={{ margin: '8px 0 0 0', fontSize: '12px', color: 'rgba(255,255,255,0.7)' }}>
            {metricas.diferenca > 0 ? 'Faltam vir' : 'Acima da projeção'}
          </p>
        </div>

        {/* Taxa de Recebimento */}
        <div style={{
          background: 'linear-gradient(135deg, #ec4899 0%, #be185d 100%)',
          padding: '24px',
          borderRadius: '12px',
          boxShadow: '0 8px 16px rgba(236, 72, 153, 0.2)',
        }}>
          <p style={{ margin: '0 0 12px 0', fontSize: '12px', color: 'rgba(255,255,255,0.8)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            📈 Taxa de Recebimento
          </p>
          <p style={{ margin: '0', fontSize: '32px', fontWeight: '700' }}>
            {metricas.percentualRecebimento.toFixed(1)}%
          </p>
          <p style={{ margin: '8px 0 0 0', fontSize: '12px', color: 'rgba(255,255,255,0.7)' }}>
            Do total esperado
          </p>
        </div>
      </div>

      {/* ABAS */}
      <div style={{ marginBottom: '30px', borderBottom: '1px solid #334155', display: 'flex', gap: '40px' }}>
        {(['dashboard', 'recebimentos', 'projecao', 'novos-clientes', 'importacao'] as Aba[]).map((aba) => (
          <button
            key={aba}
            onClick={() => setAbaAtiva(aba)}
            style={{
              background: 'none',
              border: 'none',
              color: abaAtiva === aba ? '#60a5fa' : '#64748b',
              padding: '12px 0',
              fontSize: '14px',
              fontWeight: abaAtiva === aba ? '600' : '400',
              borderBottom: abaAtiva === aba ? '2px solid #60a5fa' : 'none',
              cursor: 'pointer',
              transition: 'all 0.2s',
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
            }}
          >
            {aba === 'dashboard' && '📊 Dashboard'}
            {aba === 'recebimentos' && '✅ Recebimentos'}
            {aba === 'projecao' && '📈 Projeção'}
            {aba === 'novos-clientes' && '⭐ Clientes Novos'}
            {aba === 'importacao' && '📥 Importar Excel'}
          </button>
        ))}
      </div>

      {/* CONTEÚDO DAS ABAS */}
      {abaAtiva === 'dashboard' && (
        <div style={{ background: '#1e293b', padding: '24px', borderRadius: '12px', marginBottom: '40px' }}>
          <h2 style={{ margin: '0 0 24px 0', fontSize: '18px' }}>Resumo de {mesSelecionado}/{anoSelecionado}</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px' }}>
            <div style={{ padding: '16px', background: '#0f172a', borderRadius: '8px', borderLeft: '4px solid #3b82f6' }}>
              <p style={{ margin: '0 0 8px 0', fontSize: '12px', color: '#94a3b8' }}>PROJEÇÃO MENSAL</p>
              <p style={{ margin: '0', fontSize: '20px', fontWeight: '600', color: '#60a5fa' }}>
                R$ {metricas.totalProjecao.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </p>
            </div>
            <div style={{ padding: '16px', background: '#0f172a', borderRadius: '8px', borderLeft: '4px solid #10b981' }}>
              <p style={{ margin: '0 0 8px 0', fontSize: '12px', color: '#94a3b8' }}>RECEBIDO (EXCEL)</p>
              <p style={{ margin: '0', fontSize: '20px', fontWeight: '600', color: '#10b981' }}>
                R$ {metricas.totalRecebido.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </p>
            </div>
            <div style={{ padding: '16px', background: '#0f172a', borderRadius: '8px', borderLeft: '4px solid #f59e0b' }}>
              <p style={{ margin: '0 0 8px 0', fontSize: '12px', color: '#94a3b8' }}>DIFERENÇA</p>
              <p style={{ margin: '0', fontSize: '20px', fontWeight: '600', color: '#f59e0b' }}>
                R$ {Math.abs(metricas.diferenca).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </p>
            </div>
          </div>
        </div>
      )}

      {abaAtiva === 'recebimentos' && (
        <div style={{ background: '#1e293b', padding: '24px', borderRadius: '12px', marginBottom: '40px' }}>
          <h2 style={{ margin: '0 0 24px 0', fontSize: '18px' }}>Comissões Recebidas em {mesSelecionado}/{anoSelecionado}</h2>
          {parcelasRecebidas.length > 0 ? (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid #334155' }}>
                    <th style={{ padding: '12px', textAlign: 'left', color: '#cbd5e1', fontSize: '12px', fontWeight: '600', textTransform: 'uppercase' }}>Cliente</th>
                    <th style={{ padding: '12px', textAlign: 'left', color: '#cbd5e1', fontSize: '12px', fontWeight: '600', textTransform: 'uppercase' }}>Parcela</th>
                    <th style={{ padding: '12px', textAlign: 'left', color: '#cbd5e1', fontSize: '12px', fontWeight: '600', textTransform: 'uppercase' }}>Tipo</th>
                    <th style={{ padding: '12px', textAlign: 'right', color: '#cbd5e1', fontSize: '12px', fontWeight: '600', textTransform: 'uppercase' }}>Valor</th>
                  </tr>
                </thead>
                <tbody>
                  {parcelasRecebidas.map((parcela, idx) => (
                    <tr key={idx} style={{ borderBottom: '1px solid #1e293b' }}>
                      <td style={{ padding: '12px', color: '#e2e8f0' }}>{parcela.cliente}</td>
                      <td style={{ padding: '12px', color: '#94a3b8' }}>{parcela.numero_parcela}ª</td>
                      <td style={{ padding: '12px', color: '#94a3b8' }}>{parcela.tipo_produto}</td>
                      <td style={{ padding: '12px', textAlign: 'right', color: '#10b981', fontWeight: '600' }}>
                        R$ {parcela.valor_comissao.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </td>
                    </tr>
                  ))}
                  <tr style={{ background: '#0f172a' }}>
                    <td colSpan={3} style={{ padding: '12px', fontWeight: '600', color: '#cbd5e1' }}>TOTAL</td>
                    <td style={{ padding: '12px', textAlign: 'right', fontWeight: '700', color: '#10b981', fontSize: '16px' }}>
                      R$ {metricas.totalRecebido.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          ) : (
            <p style={{ color: '#94a3b8', textAlign: 'center', padding: '40px' }}>Nenhuma comissão recebida neste mês</p>
          )}
        </div>
      )}

      {abaAtiva === 'projecao' && (
        <div style={{ background: '#1e293b', padding: '24px', borderRadius: '12px', marginBottom: '40px' }}>
          <h2 style={{ margin: '0 0 24px 0', fontSize: '18px' }}>Projeção de Comissões para {mesSelecionado}/{anoSelecionado}</h2>
          <p style={{ margin: '0 0 24px 0', color: '#94a3b8', fontSize: '14px' }}>
            Parcelas com vencimento neste mês (se cliente pagar no prazo)
          </p>
          {parcelas.filter(p => p.mes_vencimento === mesSelecionado && p.ano_vencimento === anoSelecionado).length > 0 ? (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid #334155' }}>
                    <th style={{ padding: '12px', textAlign: 'left', color: '#cbd5e1', fontSize: '12px', fontWeight: '600', textTransform: 'uppercase' }}>Cliente</th>
                    <th style={{ padding: '12px', textAlign: 'left', color: '#cbd5e1', fontSize: '12px', fontWeight: '600', textTransform: 'uppercase' }}>Parcela</th>
                    <th style={{ padding: '12px', textAlign: 'left', color: '#cbd5e1', fontSize: '12px', fontWeight: '600', textTransform: 'uppercase' }}>Vencimento</th>
                    <th style={{ padding: '12px', textAlign: 'left', color: '#cbd5e1', fontSize: '12px', fontWeight: '600', textTransform: 'uppercase' }}>Tipo</th>
                    <th style={{ padding: '12px', textAlign: 'right', color: '#cbd5e1', fontSize: '12px', fontWeight: '600', textTransform: 'uppercase' }}>Valor</th>
                  </tr>
                </thead>
                <tbody>
                  {parcelas
                    .filter(p => p.mes_vencimento === mesSelecionado && p.ano_vencimento === anoSelecionado)
                    .map((parcela, idx) => (
                      <tr key={idx} style={{ borderBottom: '1px solid #1e293b' }}>
                        <td style={{ padding: '12px', color: '#e2e8f0' }}>{parcela.cliente_nome}</td>
                        <td style={{ padding: '12px', color: '#94a3b8' }}>{parcela.numero_parcela}ª</td>
                        <td style={{ padding: '12px', color: '#94a3b8' }}>
                          {new Date(parcela.data_vencimento).toLocaleDateString('pt-BR')}
                        </td>
                        <td style={{ padding: '12px', color: '#94a3b8' }}>{parcela.tipo_produto}</td>
                        <td style={{ padding: '12px', textAlign: 'right', color: '#60a5fa', fontWeight: '600' }}>
                          R$ {parcela.valor_comissao.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </td>
                      </tr>
                    ))}
                  <tr style={{ background: '#0f172a' }}>
                    <td colSpan={4} style={{ padding: '12px', fontWeight: '600', color: '#cbd5e1' }}>TOTAL ESPERADO</td>
                    <td style={{ padding: '12px', textAlign: 'right', fontWeight: '700', color: '#60a5fa', fontSize: '16px' }}>
                      R$ {metricas.totalProjecao.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          ) : (
            <p style={{ color: '#94a3b8', textAlign: 'center', padding: '40px' }}>Nenhuma parcela com vencimento neste mês</p>
          )}
        </div>
      )}

      {abaAtiva === 'novos-clientes' && (
        <div style={{ background: '#1e293b', padding: '24px', borderRadius: '12px', marginBottom: '40px' }}>
          <h2 style={{ margin: '0 0 24px 0', fontSize: '18px' }}>Clientes Novos em {mesSelecionado}/{anoSelecionado}</h2>
          {clientesNovos.length > 0 ? (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid #334155' }}>
                    <th style={{ padding: '12px', textAlign: 'left', color: '#cbd5e1', fontSize: '12px', fontWeight: '600', textTransform: 'uppercase' }}>Cliente</th>
                    <th style={{ padding: '12px', textAlign: 'left', color: '#cbd5e1', fontSize: '12px', fontWeight: '600', textTransform: 'uppercase' }}>CPF/CNPJ</th>
                    <th style={{ padding: '12px', textAlign: 'left', color: '#cbd5e1', fontSize: '12px', fontWeight: '600', textTransform: 'uppercase' }}>Tipo</th>
                    <th style={{ padding: '12px', textAlign: 'right', color: '#cbd5e1', fontSize: '12px', fontWeight: '600', textTransform: 'uppercase' }}>Crédito</th>
                  </tr>
                </thead>
                <tbody>
                  {clientesNovos.map((cliente, idx) => (
                    <tr key={idx} style={{ borderBottom: '1px solid #1e293b' }}>
                      <td style={{ padding: '12px', color: '#e2e8f0' }}>{cliente.nome}</td>
                      <td style={{ padding: '12px', color: '#94a3b8', fontFamily: 'monospace' }}>{cliente.cpf_cnpj}</td>
                      <td style={{ padding: '12px', color: '#94a3b8' }}>{cliente.tipo_produto}</td>
                      <td style={{ padding: '12px', textAlign: 'right', color: '#a78bfa', fontWeight: '600' }}>
                        R$ {cliente.credito.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </td>
                    </tr>
                  ))}
                  <tr style={{ background: '#0f172a' }}>
                    <td colSpan={3} style={{ padding: '12px', fontWeight: '600', color: '#cbd5e1' }}>TOTAL DE NOVOS CLIENTES</td>
                    <td style={{ padding: '12px', textAlign: 'right', fontWeight: '700', color: '#a78bfa', fontSize: '16px' }}>
                      R$ {clientesNovos.reduce((sum, c) => sum + c.credito, 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          ) : (
            <p style={{ color: '#94a3b8', textAlign: 'center', padding: '40px' }}>Nenhum cliente novo neste mês</p>
          )}
        </div>
      )}

      {abaAtiva === 'importacao' && (
        <div style={{ background: '#1e293b', padding: '24px', borderRadius: '12px', marginBottom: '40px' }}>
          <h2 style={{ margin: '0 0 24px 0', fontSize: '18px' }}>📥 Importar Excel da Ademicon</h2>
          <p style={{ color: '#94a3b8', marginBottom: '20px' }}>
            Funcionalidade em desenvolvimento. Você importará o Excel mensal da Ademicon aqui para atualizar os dados de recebimento.
          </p>
          <div style={{
            border: '2px dashed #334155',
            borderRadius: '8px',
            padding: '40px',
            textAlign: 'center',
            background: '#0f172a',
          }}>
            <p style={{ color: '#64748b', marginBottom: '16px' }}>📄 Arraste o arquivo Excel aqui ou clique para selecionar</p>
            <input
              type="file"
              accept=".xlsx,.xls,.csv"
              id="fileInput"
              style={{
                display: 'none',
              }}
            />
            <button style={{
              background: '#3b82f6',
              color: 'white',
              border: 'none',
              padding: '10px 20px',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '14px',
            }}>
              Selecionar Arquivo
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

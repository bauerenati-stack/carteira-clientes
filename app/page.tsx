'use client';

import { useEffect, useState } from 'react';

type Module = 'dashboard' | 'carteira' | 'comissoes' | 'alertas' | 'calendario' | 'pipeline';

interface Cliente {
  cliente: string;
  cpf_cnpj: string;
  email: string;
  telefone: string;
  grupo: string;
  cota: number;
  num_contrato: number;
  situacao: string;
  tipo_produto: string;
  valor_credito: number;
  valor_parcela: number;
  parcelas_pagas: number;
  parcelas_atraso: number;
  data_venda: string;
  mes_inicio_comissao: number;
  ano_inicio_comissao: number;
  taxa_comissao: number;
  comissao_mensal: number;
  comissao_paga: number;
  comissao_atraso: number;
  comissao_pendente: number;
  comissao_total: number;
}

interface Alerta {
  cliente: string;
  cpf_cnpj: string;
  tipo_produto: string;
  tipo_alerta: string;
  descricao: string;
  parcelas_atrasadas: number;
  valor_atraso: number;
  ativo: boolean;
}

interface Parcela {
  cliente: string;
  cpf_cnpj: string;
  tipo_produto: string;
  parcela_numero: number;
  mes: number;
  ano: number;
  valor_comissao: number;
  data_prevista: string;
  status: string;
  em_atraso: boolean;
}

export default function Home() {
  const [activeModule, setActiveModule] = useState<Module>('dashboard');
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [alertas, setAlertas] = useState<Alerta[]>([]);
  const [calendario, setCalendario] = useState<Parcela[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const [filterTipo, setFilterTipo] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchDados();
  }, []);

  const fetchDados = async () => {
    try {
      const [clientesRes, alertasRes, calendarioRes] = await Promise.all([
        fetch('/clientes_processados.json'),
        fetch('/alertas_clientes.json'),
        fetch('/calendario_comissoes.json'),
      ]);

      const [clientesData, alertasData, calendarioData] = await Promise.all([
        clientesRes.json(),
        alertasRes.json(),
        calendarioRes.json(),
      ]);

      setClientes(clientesData);
      setAlertas(alertasData);
      setCalendario(calendarioData);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    } finally {
      setLoading(false);
    }
  };

  const calcularMetricasGerais = () => {
    const totalCredito = clientes.reduce((acc, c) => acc + c.valor_credito, 0);
    const totalComissoes = clientes.reduce((acc, c) => acc + c.comissao_total, 0);
    const comissoesPagas = clientes.reduce((acc, c) => acc + c.comissao_paga, 0);
    const comissoesAtraso = clientes.reduce((acc, c) => acc + c.comissao_atraso, 0);
    const comissoesPendentes = clientes.reduce((acc, c) => acc + c.comissao_pendente, 0);
    const percentualRecebido = totalComissoes > 0 ? (comissoesPagas / totalComissoes * 100) : 0;

    return {
      totalClientes: clientes.length,
      totalCredito,
      totalComissoes,
      comissoesPagas,
      comissoesAtraso,
      comissoesPendentes,
      percentualRecebido,
      clientesComAtraso: alertas.length,
    };
  };

  const filtrarClientes = () => {
    let filtered = clientes;
    if (filterTipo) filtered = filtered.filter(c => c.tipo_produto === filterTipo);
    if (searchTerm) {
      filtered = filtered.filter(c =>
        c.cliente.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.cpf_cnpj.includes(searchTerm)
      );
    }
    return filtered;
  };

  const metrics = calcularMetricasGerais();
  const clientesFiltrados = filtrarClientes();
  const paginados = clientesFiltrados.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
  const totalPages = Math.ceil(clientesFiltrados.length / itemsPerPage);

  const KPICard = ({ label, valor, subtexto, color, isAlert }: any) => (
    <div style={{
      background: isAlert ? 'rgba(239,68,68,0.1)' : 'rgba(255,255,255,0.05)',
      border: isAlert ? '1px solid rgba(239,68,68,0.3)' : '1px solid rgba(255,255,255,0.1)',
      borderRadius: '12px',
      padding: '20px',
      backdropFilter: 'blur(10px)'
    }}>
      <p style={{ margin: '0 0 12px 0', fontSize: '12px', color: '#cbd5e1', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
        {label}
      </p>
      <p style={{ margin: '0', fontSize: '28px', fontWeight: '700', color: isAlert ? '#ef4444' : '#e0e7ff' }}>
        {valor}
      </p>
      {subtexto && <p style={{ margin: '8px 0 0 0', fontSize: '11px', color: '#94a3b8' }}>{subtexto}</p>}
    </div>
  );

  const TableCard = ({ title, children }: any) => (
    <div style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', padding: '20px', backdropFilter: 'blur(10px)' }}>
      <h3 style={{ margin: '0 0 16px 0', fontSize: '14px', color: '#f1f5f9' }}>{title}</h3>
      {children}
    </div>
  );

  const exportToCSV = (data: any[], filename: string) => {
    const headers = Object.keys(data[0] || {});
    const rows = data.map(item => headers.map(h => item[h]));
    const csv = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
  };

  if (loading) {
    return (
      <div style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>
        <p>Carregando dados...</p>
      </div>
    );
  }

  return (
    <div style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)', minHeight: '100vh', padding: '24px', color: '#fff' }}>
      {/* Header */}
      <div style={{ marginBottom: '32px', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
          <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: 'linear-gradient(135deg, #10b981 0%, #06b6d4 100%)' }}></div>
          <h1 style={{ margin: '0', fontSize: '28px', fontWeight: '600', letterSpacing: '-0.5px' }}>Ademicon CRM</h1>
          <span style={{ marginLeft: 'auto', fontSize: '12px', color: '#94a3b8', background: 'rgba(16,185,129,0.1)', padding: '6px 12px', borderRadius: '6px' }}>v3.0 - Com Alertas</span>
        </div>

        <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '8px' }}>
          {[
            { id: 'dashboard', label: '📊 Dashboard' },
            { id: 'carteira', label: '👥 Carteira' },
            { id: 'comissoes', label: '💰 Comissões' },
            { id: 'alertas', label: `🚨 Alertas (${alertas.length})` },
            { id: 'calendario', label: '📅 Calendário' },
          ].map(mod => (
            <button
              key={mod.id}
              onClick={() => { setActiveModule(mod.id as Module); setCurrentPage(1); }}
              style={{
                padding: '10px 16px',
                background: activeModule === mod.id ? 'linear-gradient(135deg, #10b981 0%, #06b6d4 100%)' : 'rgba(255,255,255,0.05)',
                border: activeModule === mod.id ? 'none' : '1px solid rgba(255,255,255,0.15)',
                borderRadius: '8px',
                color: activeModule === mod.id ? '#fff' : '#cbd5e1',
                fontSize: '13px',
                fontWeight: activeModule === mod.id ? '600' : '500',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
              }}
            >
              {mod.label}
            </button>
          ))}
        </div>
      </div>

      {/* Dashboard */}
      {activeModule === 'dashboard' && (
        <div>
          {/* Alerta em destaque se tiver atrasos */}
          {alertas.length > 0 && (
            <div style={{ background: 'rgba(239,68,68,0.15)', border: '2px solid rgba(239,68,68,0.3)', borderRadius: '12px', padding: '16px', marginBottom: '24px' }}>
              <p style={{ margin: '0 0 8px 0', fontSize: '14px', fontWeight: '600', color: '#ef4444' }}>⚠️ Clientes com Atraso Detectados</p>
              <p style={{ margin: '0', fontSize: '13px', color: '#fca5a5' }}>
                {alertas.length} cliente(s) com parcelas atrasadas • R$ {metrics.comissoesAtraso.toFixed(2)} em comissões afetadas
              </p>
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '16px', marginBottom: '32px' }}>
            <KPICard label="Total de Clientes" valor={metrics.totalClientes} />
            <KPICard label="Crédito Total" valor={`R$ ${(metrics.totalCredito / 1000000).toFixed(1)}M`} subtexto="Carteira" />
            <KPICard label="Comissões" valor={`R$ ${(metrics.totalComissoes / 1000).toFixed(0)}k`} subtexto="13 parcelas cada" />
            <KPICard label="Já Recebido" valor={`R$ ${(metrics.comissoesPagas / 1000).toFixed(0)}k`} subtexto={`${metrics.percentualRecebido.toFixed(1)}% do total`} />
            <KPICard label="Em Atraso" valor={`R$ ${(metrics.comissoesAtraso / 1000).toFixed(0)}k`} isAlert={true} subtexto={`${alertas.length} clientes`} />
            <KPICard label="Pendente" valor={`R$ ${(metrics.comissoesPendentes / 1000).toFixed(0)}k`} subtexto="Próximas parcelas" />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
            <TableCard title="Top 5 Clientes por Crédito">
              {clientes
                .sort((a, b) => b.valor_credito - a.valor_credito)
                .slice(0, 5)
                .map((c, i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0', borderBottom: '1px solid rgba(255,255,255,0.05)', fontSize: '13px' }}>
                    <div>
                      <p style={{ margin: '0', color: '#f1f5f9', fontWeight: '500' }}>{c.cliente}</p>
                      <p style={{ margin: '4px 0 0 0', color: '#94a3b8', fontSize: '11px' }}>{c.tipo_produto}</p>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <p style={{ margin: '0', color: '#f1f5f9' }}>R$ {(c.valor_credito / 1000).toFixed(0)}k</p>
                      <p style={{ margin: '0', color: '#10b981', fontSize: '11px', fontWeight: '600' }}>R$ {(c.comissao_total / 1000).toFixed(1)}k</p>
                    </div>
                  </div>
                ))}
            </TableCard>

            <TableCard title={`Clientes com Atraso (${alertas.length})`}>
              {alertas.length > 0 ? (
                alertas.slice(0, 5).map((a, i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0', borderBottom: '1px solid rgba(255,255,255,0.05)', fontSize: '13px' }}>
                    <div>
                      <p style={{ margin: '0', color: '#ef4444', fontWeight: '600' }}>{a.cliente}</p>
                      <p style={{ margin: '4px 0 0 0', color: '#fca5a5', fontSize: '11px' }}>{a.parcelas_atrasadas} parcela(s)</p>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <p style={{ margin: '0', color: '#ef4444', fontWeight: '600' }}>-R$ {(a.valor_atraso / 1000).toFixed(1)}k</p>
                    </div>
                  </div>
                ))
              ) : (
                <p style={{ color: '#10b981', textAlign: 'center', padding: '20px 0' }}>✅ Nenhum cliente com atraso</p>
              )}
            </TableCard>
          </div>
        </div>
      )}

      {/* Alertas */}
      {activeModule === 'alertas' && (
        <TableCard title={`Clientes com Atraso (${alertas.length})`}>
          {alertas.length === 0 ? (
            <p style={{ color: '#10b981', textAlign: 'center', padding: '40px 0', fontSize: '16px', fontWeight: '600' }}>
              ✅ Nenhum cliente com atraso no momento
            </p>
          ) : (
            <div style={{ display: 'grid', gap: '16px' }}>
              {alertas.map((a, i) => (
                <div
                  key={i}
                  style={{
                    background: 'rgba(239,68,68,0.1)',
                    border: '1px solid rgba(239,68,68,0.3)',
                    borderRadius: '10px',
                    padding: '16px',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '12px' }}>
                    <div>
                      <p style={{ margin: '0', fontSize: '15px', fontWeight: '600', color: '#f1f5f9' }}>
                        {a.cliente}
                      </p>
                      <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: '#94a3b8' }}>
                        CPF/CNPJ: {a.cpf_cnpj} • {a.tipo_produto}
                      </p>
                    </div>
                    <span style={{ background: 'rgba(239,68,68,0.2)', color: '#ef4444', padding: '6px 12px', borderRadius: '6px', fontSize: '12px', fontWeight: '600' }}>
                      🚨 Alerta Ativo
                    </span>
                  </div>

                  <p style={{ margin: '0 0 12px 0', fontSize: '13px', color: '#fca5a5' }}>
                    {a.descricao}
                  </p>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    <div>
                      <p style={{ margin: '0 0 4px 0', fontSize: '11px', color: '#cbd5e1', textTransform: 'uppercase' }}>
                        Parcelas Atrasadas
                      </p>
                      <p style={{ margin: '0', fontSize: '18px', fontWeight: '700', color: '#ef4444' }}>
                        {a.parcelas_atrasadas}
                      </p>
                    </div>
                    <div>
                      <p style={{ margin: '0 0 4px 0', fontSize: '11px', color: '#cbd5e1', textTransform: 'uppercase' }}>
                        Impacto na Comissão
                      </p>
                      <p style={{ margin: '0', fontSize: '18px', fontWeight: '700', color: '#ef4444' }}>
                        -R$ {(a.valor_atraso / 1000).toFixed(1)}k
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </TableCard>
      )}

      {/* Calendário */}
      {activeModule === 'calendario' && (
        <TableCard title={`Calendário de Recebimento (${calendario.length} parcelas)`}>
          <div style={{ marginBottom: '16px' }}>
            <button
              onClick={() => exportToCSV(calendario, `calendario_comissoes_${new Date().toISOString().split('T')[0]}.csv`)}
              style={{ padding: '10px 16px', background: 'linear-gradient(135deg, #10b981 0%, #06b6d4 100%)', border: 'none', borderRadius: '8px', color: '#fff', fontSize: '13px', cursor: 'pointer', fontWeight: '500' }}
            >
              Exportar Calendário
            </button>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', fontSize: '12px', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                  <th style={{ textAlign: 'left', padding: '12px 0', color: '#cbd5e1', fontWeight: '500' }}>Cliente</th>
                  <th style={{ textAlign: 'center', padding: '12px 0', color: '#cbd5e1', fontWeight: '500' }}>Parcela</th>
                  <th style={{ textAlign: 'center', padding: '12px 0', color: '#cbd5e1', fontWeight: '500' }}>Mês</th>
                  <th style={{ textAlign: 'right', padding: '12px 0', color: '#cbd5e1', fontWeight: '500' }}>Valor</th>
                  <th style={{ textAlign: 'left', padding: '12px 0', color: '#cbd5e1', fontWeight: '500' }}>Data Prevista</th>
                  <th style={{ textAlign: 'center', padding: '12px 0', color: '#cbd5e1', fontWeight: '500' }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {calendario.slice(0, 100).map((p, i) => {
                  const statusColor = p.status === 'recebida' ? '#10b981' : p.status === 'atrasada' ? '#ef4444' : '#fb923c';
                  const statusLabel = p.status === 'recebida' ? '✅ Recebida' : p.status === 'atrasada' ? '⚠️ Atrasada' : '⏳ Pendente';
                  return (
                    <tr key={i} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                      <td style={{ padding: '12px 0', color: '#f1f5f9', fontWeight: '500' }}>{p.cliente.substring(0, 25)}</td>
                      <td style={{ padding: '12px 0', textAlign: 'center', color: '#cbd5e1' }}>{p.parcela_numero}/13</td>
                      <td style={{ padding: '12px 0', textAlign: 'center', color: '#cbd5e1' }}>{p.ano}-{String(p.mes).padStart(2, '0')}</td>
                      <td style={{ padding: '12px 0', textAlign: 'right', color: '#e0e7ff', fontWeight: '500' }}>R$ {p.valor_comissao.toFixed(2)}</td>
                      <td style={{ padding: '12px 0', color: '#94a3b8' }}>{new Date(p.data_prevista).toLocaleDateString('pt-BR')}</td>
                      <td style={{ padding: '12px 0', textAlign: 'center' }}>
                        <span style={{ color: statusColor, fontWeight: '600', fontSize: '11px' }}>{statusLabel}</span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <p style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid rgba(255,255,255,0.1)', fontSize: '12px', color: '#94a3b8', textAlign: 'center' }}>
            Mostrando primeiras 100 parcelas • Total: {calendario.length}
          </p>
        </TableCard>
      )}

      {/* Comissões */}
      {activeModule === 'comissoes' && (
        <div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '16px', marginBottom: '32px' }}>
            <KPICard label="Comissão Total" valor={`R$ ${(metrics.totalComissoes / 1000).toFixed(0)}k`} />
            <KPICard label="Já Recebido" valor={`R$ ${(metrics.comissoesPagas / 1000).toFixed(0)}k`} subtexto={metrics.percentualRecebido.toFixed(1) + '%'} />
            <KPICard label="Em Atraso" valor={`R$ ${(metrics.comissoesAtraso / 1000).toFixed(0)}k`} isAlert={true} />
            <KPICard label="Pendente" valor={`R$ ${(metrics.comissoesPendentes / 1000).toFixed(0)}k`} />
          </div>

          <TableCard title={`Comissões por Cliente (${clientesFiltrados.length})`}>
            <div style={{ display: 'flex', gap: '12px', marginBottom: '16px', flexWrap: 'wrap' }}>
              <select
                value={filterTipo}
                onChange={e => { setFilterTipo(e.target.value); setCurrentPage(1); }}
                style={{ padding: '10px 12px', background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '8px', color: '#fff', fontSize: '13px' }}
              >
                <option value="">Todos os tipos</option>
                <option value="Imóvel">Imóvel (1,675%)</option>
                <option value="Veicular">Veicular (15,38%)</option>
              </select>

              <button
                onClick={() => { setFilterTipo(''); setSearchTerm(''); setCurrentPage(1); }}
                style={{ padding: '10px 16px', background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '8px', color: '#cbd5e1', fontSize: '13px', cursor: 'pointer', marginLeft: 'auto' }}
              >
                Limpar
              </button>

              <button
                onClick={() => exportToCSV(clientesFiltrados, `comissoes_${new Date().toISOString().split('T')[0]}.csv`)}
                style={{ padding: '10px 16px', background: 'linear-gradient(135deg, #10b981 0%, #06b6d4 100%)', border: 'none', borderRadius: '8px', color: '#fff', fontSize: '13px', cursor: 'pointer', fontWeight: '500' }}
              >
                Exportar
              </button>
            </div>

            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', fontSize: '12px', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                    <th style={{ textAlign: 'left', padding: '12px 0', color: '#cbd5e1', fontWeight: '500' }}>Cliente</th>
                    <th style={{ textAlign: 'left', padding: '12px 0', color: '#cbd5e1', fontWeight: '500' }}>Tipo</th>
                    <th style={{ textAlign: 'right', padding: '12px 0', color: '#cbd5e1', fontWeight: '500' }}>Comissão/Mês</th>
                    <th style={{ textAlign: 'right', padding: '12px 0', color: '#cbd5e1', fontWeight: '500' }}>Total (13x)</th>
                    <th style={{ textAlign: 'center', padding: '12px 0', color: '#cbd5e1', fontWeight: '500' }}>Parcelas</th>
                    <th style={{ textAlign: 'right', padding: '12px 0', color: '#cbd5e1', fontWeight: '500' }}>Recebido</th>
                    <th style={{ textAlign: 'right', padding: '12px 0', color: '#cbd5e1', fontWeight: '500' }}>Atraso</th>
                    <th style={{ textAlign: 'right', padding: '12px 0', color: '#cbd5e1', fontWeight: '500' }}>Pendente</th>
                  </tr>
                </thead>
                <tbody>
                  {paginados.map((c, i) => (
                    <tr key={i} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                      <td style={{ padding: '12px 0', color: '#f1f5f9', fontWeight: '500' }}>{c.cliente.substring(0, 25)}</td>
                      <td style={{ padding: '12px 0', color: c.tipo_produto === 'Imóvel' ? '#3b82f6' : '#a855f7', fontWeight: '500', fontSize: '11px' }}>
                        {c.tipo_produto === 'Imóvel' ? '🏠 Imóvel' : '🚗 Veicular'}
                      </td>
                      <td style={{ padding: '12px 0', color: '#cbd5e1', textAlign: 'right' }}>R$ {c.comissao_mensal.toFixed(2)}</td>
                      <td style={{ padding: '12px 0', color: '#10b981', textAlign: 'right', fontWeight: '600' }}>R$ {(c.comissao_total / 1000).toFixed(1)}k</td>
                      <td style={{ padding: '12px 0', textAlign: 'center', color: c.parcelas_atraso > 0 ? '#ef4444' : '#10b981', fontWeight: '500' }}>
                        {c.parcelas_pagas}/{c.parcelas_pagas + c.parcelas_atraso}
                      </td>
                      <td style={{ padding: '12px 0', textAlign: 'right', color: '#10b981', fontWeight: '500' }}>R$ {(c.comissao_paga / 1000).toFixed(1)}k</td>
                      <td style={{ padding: '12px 0', textAlign: 'right', color: c.comissao_atraso > 0 ? '#ef4444' : '#cbd5e1', fontWeight: c.comissao_atraso > 0 ? '600' : '400' }}>
                        {c.comissao_atraso > 0 ? `R$ ${(c.comissao_atraso / 1000).toFixed(1)}k` : '-'}
                      </td>
                      <td style={{ padding: '12px 0', textAlign: 'right', color: '#fb923c', fontWeight: '500' }}>R$ {(c.comissao_pendente / 1000).toFixed(1)}k</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '16px', paddingTop: '16px', borderTop: '1px solid rgba(255,255,255,0.1)', fontSize: '12px', color: '#94a3b8' }}>
              <span>Página {currentPage} de {totalPages}</span>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                  style={{ padding: '6px 10px', background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '4px', color: '#cbd5e1', cursor: currentPage === 1 ? 'not-allowed' : 'pointer', opacity: currentPage === 1 ? 0.5 : 1 }}
                >
                  ← Anterior
                </button>
                <button
                  onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage === totalPages}
                  style={{ padding: '6px 10px', background: 'linear-gradient(135deg, #10b981 0%, #06b6d4 100%)', border: 'none', borderRadius: '4px', color: '#fff', cursor: currentPage === totalPages ? 'not-allowed' : 'pointer', fontWeight: '500', opacity: currentPage === totalPages ? 0.5 : 1 }}
                >
                  Próxima →
                </button>
              </div>
            </div>
          </TableCard>
        </div>
      )}

      {/* Carteira (simplificado) */}
      {activeModule === 'carteira' && (
        <TableCard title={`Carteira de Clientes (${clientes.length})`}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', fontSize: '12px', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                  <th style={{ textAlign: 'left', padding: '12px 0', color: '#cbd5e1', fontWeight: '500' }}>Cliente</th>
                  <th style={{ textAlign: 'left', padding: '12px 0', color: '#cbd5e1', fontWeight: '500' }}>Email</th>
                  <th style={{ textAlign: 'left', padding: '12px 0', color: '#cbd5e1', fontWeight: '500' }}>Tipo</th>
                  <th style={{ textAlign: 'right', padding: '12px 0', color: '#cbd5e1', fontWeight: '500' }}>Crédito</th>
                </tr>
              </thead>
              <tbody>
                {clientes.slice(0, 20).map((c, i) => (
                  <tr key={i} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                    <td style={{ padding: '12px 0', color: '#f1f5f9' }}>{c.cliente.substring(0, 30)}</td>
                    <td style={{ padding: '12px 0', color: '#60a5fa', fontSize: '11px' }}>{c.email}</td>
                    <td style={{ padding: '12px 0', color: '#cbd5e1', fontSize: '11px' }}>{c.tipo_produto}</td>
                    <td style={{ padding: '12px 0', color: '#f1f5f9', textAlign: 'right' }}>R$ {(c.valor_credito / 1000).toFixed(0)}k</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </TableCard>
      )}

      {/* Pipeline (placeholder) */}
      {activeModule === 'pipeline' && (
        <TableCard title="Pipeline - Em Desenvolvimento">
          <p style={{ color: '#94a3b8', textAlign: 'center', padding: '40px 0' }}>
            Pipeline de vendas será implementado em breve
          </p>
        </TableCard>
      )}
    </div>
  );
}

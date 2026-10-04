'use client';

import { useEffect, useState } from 'react';

type Module = 'dashboard' | 'carteira' | 'comissoes' | 'pipeline' | 'oportunidades' | 'tarefas';

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

export default function Home() {
  const [activeModule, setActiveModule] = useState<Module>('dashboard');
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const [filterTipo, setFilterTipo] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchDados();
  }, []);

  const fetchDados = async () => {
    try {
      const response = await fetch('/dados_clientes.json');
      const data = await response.json();
      setClientes(data);
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
    };
  };

  const filtrarClientes = () => {
    let filtered = clientes;
    if (filterTipo) filtered = filtered.filter(c => c.tipo_produto === filterTipo);
    if (filterStatus) {
      if (filterStatus === 'com_atraso') filtered = filtered.filter(c => c.parcelas_atraso > 0);
      if (filterStatus === 'sem_atraso') filtered = filtered.filter(c => c.parcelas_atraso === 0);
    }
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

  const KPICard = ({ label, valor, subtexto, color = '#10b981' }: any) => (
    <div style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', padding: '20px', backdropFilter: 'blur(10px)' }}>
      <p style={{ margin: '0 0 12px 0', fontSize: '12px', color: '#cbd5e1', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{label}</p>
      <p style={{ margin: '0', fontSize: '28px', fontWeight: '700', color: '#e0e7ff' }}>{valor}</p>
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
    const blob = new Blob([csv], { type: 'text/csv' });
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
          <span style={{ marginLeft: 'auto', fontSize: '12px', color: '#94a3b8', background: 'rgba(16,185,129,0.1)', padding: '6px 12px', borderRadius: '6px' }}>v2.0 - Comissões</span>
        </div>

        <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '8px' }}>
          {[
            { id: 'dashboard', label: '📊 Dashboard' },
            { id: 'carteira', label: '👥 Carteira' },
            { id: 'comissoes', label: '💰 Comissões' },
            { id: 'pipeline', label: '📈 Pipeline' },
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
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px', marginBottom: '32px' }}>
            <KPICard label="Total de Clientes" valor={metrics.totalClientes} />
            <KPICard label="Total de Crédito" valor={`R$ ${(metrics.totalCredito / 1000000).toFixed(1)}M`} subtexto={metrics.totalClientes + ' clientes'} />
            <KPICard label="Total de Comissões" valor={`R$ ${(metrics.totalComissoes / 1000).toFixed(0)}k`} subtexto="13 parcelas cada" />
            <KPICard label="Já Recebido" valor={`R$ ${(metrics.comissoesPagas / 1000).toFixed(0)}k`} subtexto={`${metrics.percentualRecebido.toFixed(1)}% do total`} color="#10b981" />
            <KPICard label="Em Atraso" valor={`R$ ${(metrics.comissoesAtraso / 1000).toFixed(0)}k`} subtexto="Afeta comissão" color="#ef4444" />
            <KPICard label="Pendente" valor={`R$ ${(metrics.comissoesPendentes / 1000).toFixed(0)}k`} subtexto="Próximas parcelas" color="#fb923c" />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
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
                      <p style={{ margin: '0', color: '#f1f5f9' }}>R$ {(c.valor_credito / 1000).toFixed(1)}k</p>
                      <p style={{ margin: '0', color: '#cbd5e1', fontSize: '11px' }}>Comissão: R$ {(c.comissao_total / 1000).toFixed(1)}k</p>
                    </div>
                  </div>
                ))}
            </TableCard>

            <TableCard title="Clientes com Atraso">
              {clientes
                .filter(c => c.parcelas_atraso > 0)
                .map((c, i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0', borderBottom: '1px solid rgba(255,255,255,0.05)', fontSize: '13px' }}>
                    <div>
                      <p style={{ margin: '0', color: '#f1f5f9', fontWeight: '500' }}>{c.cliente}</p>
                      <p style={{ margin: '4px 0 0 0', color: '#ef4444', fontSize: '11px' }}>{c.parcelas_atraso} parcela(s) atrasada(s)</p>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <p style={{ margin: '0', color: '#ef4444', fontWeight: '600' }}>-R$ {(c.comissao_atraso / 1000).toFixed(1)}k</p>
                    </div>
                  </div>
                ))}
            </TableCard>
          </div>
        </div>
      )}

      {/* Carteira */}
      {activeModule === 'carteira' && (
        <TableCard title={`Carteira de Clientes (${clientesFiltrados.length})`}>
          <div style={{ display: 'flex', gap: '12px', marginBottom: '16px' }}>
            <input
              type="text"
              placeholder="Buscar cliente..."
              value={searchTerm}
              onChange={e => { setSearchTerm(e.target.value); setCurrentPage(1); }}
              style={{ flex: 1, padding: '10px 12px', background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '8px', color: '#fff', fontSize: '13px' }}
            />
            <button
              onClick={() => exportToCSV(clientesFiltrados, `carteira_${new Date().toISOString().split('T')[0]}.csv`)}
              style={{ padding: '10px 16px', background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '8px', color: '#cbd5e1', fontSize: '13px', cursor: 'pointer' }}
            >
              Exportar CSV
            </button>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', fontSize: '13px', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                  <th style={{ textAlign: 'left', padding: '12px 0', color: '#cbd5e1', fontWeight: '500' }}>Cliente</th>
                  <th style={{ textAlign: 'left', padding: '12px 0', color: '#cbd5e1', fontWeight: '500' }}>Tipo</th>
                  <th style={{ textAlign: 'left', padding: '12px 0', color: '#cbd5e1', fontWeight: '500' }}>Email</th>
                  <th style={{ textAlign: 'right', padding: '12px 0', color: '#cbd5e1', fontWeight: '500' }}>Crédito</th>
                  <th style={{ textAlign: 'right', padding: '12px 0', color: '#cbd5e1', fontWeight: '500' }}>Parcelas</th>
                </tr>
              </thead>
              <tbody>
                {paginados.map((c, i) => (
                  <tr key={i} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                    <td style={{ padding: '14px 0', color: '#f1f5f9', fontWeight: '500' }}>{c.cliente}</td>
                    <td style={{ padding: '14px 0', color: '#cbd5e1' }}>
                      <span style={{ background: c.tipo_produto === 'Imóvel' ? 'rgba(59,130,246,0.2)' : 'rgba(168,85,247,0.2)', color: c.tipo_produto === 'Imóvel' ? '#3b82f6' : '#a855f7', padding: '4px 8px', borderRadius: '4px', fontSize: '11px' }}>
                        {c.tipo_produto}
                      </span>
                    </td>
                    <td style={{ padding: '14px 0', color: '#60a5fa' }}>{c.email}</td>
                    <td style={{ padding: '14px 0', color: '#f1f5f9', textAlign: 'right', fontWeight: '500' }}>R$ {(c.valor_credito / 1000).toFixed(0)}k</td>
                    <td style={{ padding: '14px 0', textAlign: 'right' }}>
                      <span style={{ color: c.parcelas_atraso > 0 ? '#ef4444' : '#10b981', fontWeight: '500' }}>
                        {c.parcelas_pagas}/{c.parcelas_pagas + c.parcelas_atraso}
                      </span>
                    </td>
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
      )}

      {/* Comissões */}
      {activeModule === 'comissoes' && (
        <div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '16px', marginBottom: '32px' }}>
            <KPICard label="Comissão Total" valor={`R$ ${(metrics.totalComissoes / 1000).toFixed(0)}k`} subtexto="13 parcelas" />
            <KPICard label="Já Recebido" valor={`R$ ${(metrics.comissoesPagas / 1000).toFixed(0)}k`} subtexto={metrics.percentualRecebido.toFixed(1) + '% recebido'} color="#10b981" />
            <KPICard label="Em Atraso" valor={`R$ ${(metrics.comissoesAtraso / 1000).toFixed(0)}k`} subtexto="Reduz comissão" color="#ef4444" />
            <KPICard label="Pendente" valor={`R$ ${(metrics.comissoesPendentes / 1000).toFixed(0)}k`} subtexto="Próximos meses" color="#fb923c" />
            <KPICard label="Clientes" valor={clientes.filter(c => c.tipo_produto === 'Imóvel').length} subtexto="Imóvel (12,88%)" />
            <KPICard label="Clientes" valor={clientes.filter(c => c.tipo_produto === 'Veicular').length} subtexto="Veicular (15,38%)" />
          </div>

          <TableCard title={`Acompanhamento de Comissões (${clientesFiltrados.length})`}>
            <div style={{ display: 'flex', gap: '12px', marginBottom: '16px', flexWrap: 'wrap' }}>
              <select
                value={filterTipo}
                onChange={e => { setFilterTipo(e.target.value); setCurrentPage(1); }}
                style={{ padding: '10px 12px', background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '8px', color: '#fff', fontSize: '13px' }}
              >
                <option value="">Todos os tipos</option>
                <option value="Imóvel">Imóvel (12,88%)</option>
                <option value="Veicular">Veicular (15,38%)</option>
              </select>

              <select
                value={filterStatus}
                onChange={e => { setFilterStatus(e.target.value); setCurrentPage(1); }}
                style={{ padding: '10px 12px', background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '8px', color: '#fff', fontSize: '13px' }}
              >
                <option value="">Todos os status</option>
                <option value="com_atraso">Com atraso</option>
                <option value="sem_atraso">Sem atraso</option>
              </select>

              <button
                onClick={() => { setFilterTipo(''); setFilterStatus(''); setSearchTerm(''); setCurrentPage(1); }}
                style={{ padding: '10px 16px', background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '8px', color: '#cbd5e1', fontSize: '13px', cursor: 'pointer', marginLeft: 'auto' }}
              >
                Limpar Filtros
              </button>

              <button
                onClick={() => exportToCSV(clientesFiltrados, `comissoes_${new Date().toISOString().split('T')[0]}.csv`)}
                style={{ padding: '10px 16px', background: 'linear-gradient(135deg, #10b981 0%, #06b6d4 100%)', border: 'none', borderRadius: '8px', color: '#fff', fontSize: '13px', cursor: 'pointer', fontWeight: '500' }}
              >
                Exportar Relatório
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
                    <th style={{ textAlign: 'right', padding: '12px 0', color: '#cbd5e1', fontWeight: '500' }}>Parcelas</th>
                    <th style={{ textAlign: 'right', padding: '12px 0', color: '#cbd5e1', fontWeight: '500' }}>Recebido</th>
                    <th style={{ textAlign: 'right', padding: '12px 0', color: '#cbd5e1', fontWeight: '500' }}>Atraso</th>
                    <th style={{ textAlign: 'right', padding: '12px 0', color: '#cbd5e1', fontWeight: '500' }}>Pendente</th>
                  </tr>
                </thead>
                <tbody>
                  {paginados.map((c, i) => (
                    <tr key={i} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                      <td style={{ padding: '12px 0', color: '#f1f5f9', fontWeight: '500' }}>{c.cliente}</td>
                      <td style={{ padding: '12px 0' }}>
                        <span style={{ background: c.tipo_produto === 'Imóvel' ? 'rgba(59,130,246,0.2)' : 'rgba(168,85,247,0.2)', color: c.tipo_produto === 'Imóvel' ? '#3b82f6' : '#a855f7', padding: '4px 8px', borderRadius: '4px', fontSize: '11px' }}>
                          {c.tipo_produto}
                        </span>
                      </td>
                      <td style={{ padding: '12px 0', color: '#cbd5e1', textAlign: 'right' }}>R$ {c.comissao_mensal.toFixed(2)}</td>
                      <td style={{ padding: '12px 0', color: '#10b981', textAlign: 'right', fontWeight: '600' }}>R$ {(c.comissao_total / 1000).toFixed(1)}k</td>
                      <td style={{ padding: '12px 0', textAlign: 'right', color: c.parcelas_atraso > 0 ? '#ef4444' : '#10b981' }}>
                        {c.parcelas_pagas}/{c.parcelas_pagas + c.parcelas_atraso}
                        {c.parcelas_atraso > 0 && <span style={{ color: '#ef4444', fontWeight: '600' }}> (-{c.parcelas_atraso})</span>}
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

      {/* Pipeline e Oportunidades (placeholders) */}
      {(activeModule === 'pipeline' || activeModule === 'oportunidades' || activeModule === 'tarefas') && (
        <TableCard title="Em desenvolvimento...">
          <p style={{ color: '#94a3b8', textAlign: 'center', padding: '40px 0' }}>Este módulo será implementado em breve</p>
        </TableCard>
      )}
    </div>
  );
}

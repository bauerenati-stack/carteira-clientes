'use client';

import { useEffect, useState } from 'react';
import { supabase, CarteiraCliente } from '@/lib/supabase';

type Module = 'dashboard' | 'carteira' | 'pipeline' | 'oportunidades' | 'tarefas' | 'relatorios';

interface Oportunidade {
  id: string;
  cliente_id: string;
  cliente: string;
  descricao: string;
  valor: number;
  estagio: 'prospeccao' | 'qualificado' | 'negociacao' | 'fechado' | 'perdido';
  data_criacao: string;
  data_atualizacao: string;
}

interface Tarefa {
  id: string;
  cliente_id: string;
  cliente: string;
  titulo: string;
  descricao: string;
  status: 'pendente' | 'em_progresso' | 'concluida';
  prioridade: 'alta' | 'media' | 'baixa';
  data_vencimento: string;
  data_criacao: string;
}

export default function Home() {
  const [activeModule, setActiveModule] = useState<Module>('dashboard');
  const [clientes, setClientes] = useState<CarteiraCliente[]>([]);
  const [filteredClientes, setFilteredClientes] = useState<CarteiraCliente[]>([]);
  const [oportunidades, setOportunidades] = useState<Oportunidade[]>([]);
  const [tarefas, setTarefas] = useState<Tarefa[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterGrupo, setFilterGrupo] = useState('');
  const [filterValor, setFilterValor] = useState(100000);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    fetchAllData();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [clientes, search, filterGrupo, filterValor]);

  const fetchAllData = async () => {
    try {
      const { data: clientesData, error: clientesError } = await supabase
        .from('carteira_clientes')
        .select('*')
        .eq('situacao', 'Normal')
        .order('cliente', { ascending: true });

      if (clientesError) throw clientesError;
      setClientes(clientesData as CarteiraCliente[]);

      // Mock data para demonstração
      const mockOportunidades: Oportunidade[] = clientesData ? (clientesData as CarteiraCliente[]).slice(0, 8).map((c, idx) => ({
        id: `opp-${idx}`,
        cliente_id: c.id,
        cliente: c.cliente,
        descricao: `Oportunidade ${idx + 1}`,
        valor: 50000 + idx * 10000,
        estagio: ['prospeccao', 'qualificado', 'negociacao', 'fechado'][Math.floor(Math.random() * 4)] as any,
        data_criacao: new Date(Date.now() - Math.random() * 90 * 24 * 60 * 60 * 1000).toISOString(),
        data_atualizacao: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
      })) : [];

      const mockTarefas: Tarefa[] = clientesData ? (clientesData as CarteiraCliente[]).slice(0, 12).map((c, idx) => ({
        id: `task-${idx}`,
        cliente_id: c.id,
        cliente: c.cliente,
        titulo: `Follow-up com ${c.cliente}`,
        descricao: `Acompanhamento de oportunidade`,
        status: ['pendente', 'em_progresso', 'concluida'][Math.floor(Math.random() * 3)] as any,
        prioridade: ['alta', 'media', 'baixa'][Math.floor(Math.random() * 3)] as any,
        data_vencimento: new Date(Date.now() + Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
        data_criacao: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString(),
      })) : [];

      setOportunidades(mockOportunidades);
      setTarefas(mockTarefas);
    } catch (error) {
      console.error('Erro ao buscar dados:', error);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = clientes;
    if (search) {
      filtered = filtered.filter(c =>
        c.cliente.toLowerCase().includes(search.toLowerCase()) ||
        c.cpf_cnpj?.includes(search) ||
        c.email?.toLowerCase().includes(search.toLowerCase())
      );
    }
    if (filterGrupo) {
      filtered = filtered.filter(c => c.grupo === filterGrupo);
    }
    if (filterValor) {
      filtered = filtered.filter(c => (c.valor_credito || 0) <= filterValor);
    }
    setFilteredClientes(filtered);
    setCurrentPage(1);
  };

  const calculateMetrics = () => {
    const totalClientes = clientes.length;
    const totalValor = clientes.reduce((acc, c) => acc + (c.valor_credito || 0), 0);
    const mediaValor = totalClientes > 0 ? totalValor / totalClientes : 0;
    const oportunidadesAbertas = oportunidades.filter(o => o.estagio !== 'fechado' && o.estagio !== 'perdido').length;
    const oportunidadesValor = oportunidades.filter(o => o.estagio !== 'fechado' && o.estagio !== 'perdido').reduce((acc, o) => acc + o.valor, 0);
    const taxaConversao = oportunidades.length > 0 ? (oportunidades.filter(o => o.estagio === 'fechado').length / oportunidades.length * 100) : 0;
    const tarefasPendentes = tarefas.filter(t => t.status === 'pendente').length;
    return { totalClientes, totalValor, mediaValor, oportunidadesAbertas, oportunidadesValor, taxaConversao, tarefasPendentes };
  };

  const metrics = calculateMetrics();
  const grupos = Array.from(new Set(clientes.map(c => c.grupo))).sort();
  const paginatedClientes = filteredClientes.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
  const totalPages = Math.ceil(filteredClientes.length / itemsPerPage);

  const getEstagioColor = (estagio: string) => {
    const colors: any = {
      prospeccao: { bg: 'rgba(59, 130, 246, 0.2)', text: '#3b82f6' },
      qualificado: { bg: 'rgba(168, 85, 247, 0.2)', text: '#a855f7' },
      negociacao: { bg: 'rgba(251, 146, 60, 0.2)', text: '#fb923c' },
      fechado: { bg: 'rgba(16, 185, 129, 0.2)', text: '#10b981' },
      perdido: { bg: 'rgba(239, 68, 68, 0.2)', text: '#ef4444' },
    };
    return colors[estagio] || { bg: 'rgba(100,100,100,0.2)', text: '#9ca3af' };
  };

  const getStatusColor = (status: string) => {
    const colors: any = {
      pendente: { bg: 'rgba(239, 68, 68, 0.2)', text: '#ef4444' },
      em_progresso: { bg: 'rgba(251, 146, 60, 0.2)', text: '#fb923c' },
      concluida: { bg: 'rgba(16, 185, 129, 0.2)', text: '#10b981' },
    };
    return colors[status] || { bg: 'rgba(100,100,100,0.2)', text: '#9ca3af' };
  };

  const getPrioridadeColor = (prioridade: string) => {
    const colors: any = {
      alta: { bg: 'rgba(239, 68, 68, 0.2)', text: '#ef4444' },
      media: { bg: 'rgba(251, 146, 60, 0.2)', text: '#fb923c' },
      baixa: { bg: 'rgba(34, 197, 94, 0.2)', text: '#22c55e' },
    };
    return colors[prioridade] || { bg: 'rgba(100,100,100,0.2)', text: '#9ca3af' };
  };

  const KPICard = ({ label, valor, subtexto }: any) => (
    <div style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', padding: '20px', backdropFilter: 'blur(10px)' }}>
      <p style={{ margin: '0 0 12px 0', fontSize: '12px', color: '#cbd5e1', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{label}</p>
      <p style={{ margin: '0', fontSize: '32px', fontWeight: '700', color: '#e0e7ff' }}>{valor}</p>
      {subtexto && <p style={{ margin: '8px 0 0 0', fontSize: '11px', color: '#94a3b8' }}>{subtexto}</p>}
    </div>
  );

  const TableCard = ({ title, children }: any) => (
    <div style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', padding: '20px', backdropFilter: 'blur(10px)' }}>
      <h3 style={{ margin: '0 0 16px 0', fontSize: '14px', color: '#f1f5f9' }}>{title}</h3>
      {children}
    </div>
  );

  const exportToCSV = (data: any[], filename: string, headers: string[]) => {
    const rows = data.map(item => headers.map(h => item[h]));
    const csv = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
  };

  return (
    <div style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)', minHeight: '100vh', padding: '24px', color: '#fff' }}>
      {/* Nav Bar */}
      <div style={{ marginBottom: '32px', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
          <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: 'linear-gradient(135deg, #10b981 0%, #06b6d4 100%)' }}></div>
          <h1 style={{ margin: '0', fontSize: '28px', fontWeight: '600', letterSpacing: '-0.5px' }}>Ademicon CRM</h1>
          <span style={{ marginLeft: 'auto', fontSize: '12px', color: '#94a3b8', background: 'rgba(16,185,129,0.1)', padding: '6px 12px', borderRadius: '6px' }}>Premium v1.0</span>
        </div>

        <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '8px' }}>
          {[
            { id: 'dashboard', label: '📊 Dashboard' },
            { id: 'carteira', label: '👥 Carteira' },
            { id: 'pipeline', label: '📈 Pipeline' },
            { id: 'oportunidades', label: '🎯 Oportunidades' },
            { id: 'tarefas', label: '✓ Tarefas' },
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

      {loading ? (
        <p style={{ textAlign: 'center', color: '#cbd5e1', padding: '40px' }}>Carregando dados...</p>
      ) : (
        <>
          {/* Dashboard */}
          {activeModule === 'dashboard' && (
            <div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '16px', marginBottom: '32px' }}>
                <KPICard label="Total Clientes" valor={metrics.totalClientes} subtexto="Apenas Normal" />
                <KPICard label="Valor Total" valor={`R$ ${(metrics.totalValor / 1000000).toFixed(1)}M`} />
                <KPICard label="Oportunidades Abertas" valor={metrics.oportunidadesAbertas} subtexto={`R$ ${(metrics.oportunidadesValor / 1000).toFixed(0)}k`} />
                <KPICard label="Taxa de Conversão" valor={`${metrics.taxaConversao.toFixed(1)}%`} subtexto={oportunidades.filter(o => o.estagio === 'fechado').length} />
                <KPICard label="Tarefas Pendentes" valor={metrics.tarefasPendentes} subtexto={`de ${tarefas.length}`} />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                <TableCard title="Últimas Oportunidades">
                  <div style={{ fontSize: '13px' }}>
                    {oportunidades.slice(0, 5).map(opp => (
                      <div key={opp.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                        <div>
                          <p style={{ margin: '0', color: '#f1f5f9', fontWeight: '500' }}>{opp.cliente}</p>
                          <p style={{ margin: '4px 0 0 0', color: '#94a3b8', fontSize: '11px' }}>{opp.descricao}</p>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <p style={{ margin: '0', color: '#f1f5f9', fontWeight: '500' }}>R$ {(opp.valor / 1000).toFixed(0)}k</p>
                          <span style={{ background: getEstagioColor(opp.estagio).bg, color: getEstagioColor(opp.estagio).text, padding: '4px 8px', borderRadius: '4px', fontSize: '11px', marginTop: '4px', display: 'inline-block' }}>
                            {opp.estagio.charAt(0).toUpperCase() + opp.estagio.slice(1)}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </TableCard>

                <TableCard title="Tarefas Urgentes">
                  <div style={{ fontSize: '13px' }}>
                    {tarefas.filter(t => t.status !== 'concluida').slice(0, 5).map(task => (
                      <div key={task.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                        <div>
                          <p style={{ margin: '0', color: '#f1f5f9', fontWeight: '500' }}>{task.titulo}</p>
                          <p style={{ margin: '4px 0 0 0', color: '#94a3b8', fontSize: '11px' }}>{task.cliente}</p>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <span style={{ background: getPrioridadeColor(task.prioridade).bg, color: getPrioridadeColor(task.prioridade).text, padding: '4px 8px', borderRadius: '4px', fontSize: '11px', marginRight: '8px' }}>
                            {task.prioridade}
                          </span>
                          <span style={{ background: getStatusColor(task.status).bg, color: getStatusColor(task.status).text, padding: '4px 8px', borderRadius: '4px', fontSize: '11px' }}>
                            {task.status === 'em_progresso' ? 'Em Progresso' : task.status}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </TableCard>
              </div>
            </div>
          )}

          {/* Carteira de Clientes */}
          {activeModule === 'carteira' && (
            <div style={{ display: 'grid', gridTemplateColumns: '220px 1fr', gap: '20px' }}>
              <div style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', padding: '20px', height: 'fit-content', backdropFilter: 'blur(10px)' }}>
                <h3 style={{ margin: '0 0 16px 0', fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.5px', color: '#cbd5e1' }}>Filtros</h3>

                <div style={{ marginBottom: '20px' }}>
                  <label style={{ display: 'block', fontSize: '12px', color: '#cbd5e1', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Buscar</label>
                  <input
                    type="text"
                    placeholder="Nome, CPF ou email..."
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    style={{ width: '100%', padding: '10px 12px', background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '8px', color: '#fff', fontSize: '13px', boxSizing: 'border-box' }}
                  />
                </div>

                <div style={{ marginBottom: '20px' }}>
                  <label style={{ display: 'block', fontSize: '12px', color: '#cbd5e1', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Grupo</label>
                  <select
                    value={filterGrupo}
                    onChange={e => setFilterGrupo(e.target.value)}
                    style={{ width: '100%', padding: '10px 12px', background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '8px', color: '#fff', fontSize: '13px', boxSizing: 'border-box' }}
                  >
                    <option value="">Todos</option>
                    {grupos.map(g => <option key={g} value={g}>{g}</option>)}
                  </select>
                </div>

                <button
                  onClick={() => { setSearch(''); setFilterGrupo(''); setFilterValor(200000); }}
                  style={{ width: '100%', padding: '10px', background: 'transparent', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '8px', color: '#94a3b8', fontWeight: '500', fontSize: '13px', cursor: 'pointer' }}
                >
                  Limpar Filtros
                </button>
              </div>

              <TableCard title={`Clientes Ativos (${filteredClientes.length})`}>
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '16px' }}>
                  <button
                    onClick={() => exportToCSV(filteredClientes, `carteira_${new Date().toISOString().split('T')[0]}.csv`, ['cliente', 'cpf_cnpj', 'email', 'telefone', 'grupo', 'valor_credito'])}
                    style={{ padding: '8px 12px', background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '6px', color: '#cbd5e1', fontSize: '12px', cursor: 'pointer' }}
                  >
                    Exportar CSV
                  </button>
                </div>

                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', fontSize: '13px', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                        <th style={{ textAlign: 'left', padding: '12px 0', color: '#cbd5e1', fontWeight: '500' }}>Cliente</th>
                        <th style={{ textAlign: 'left', padding: '12px 0', color: '#cbd5e1', fontWeight: '500' }}>Email</th>
                        <th style={{ textAlign: 'left', padding: '12px 0', color: '#cbd5e1', fontWeight: '500' }}>Grupo</th>
                        <th style={{ textAlign: 'right', padding: '12px 0', color: '#cbd5e1', fontWeight: '500' }}>Valor</th>
                      </tr>
                    </thead>
                    <tbody>
                      {paginatedClientes.map(c => (
                        <tr key={c.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                          <td style={{ padding: '14px 0', color: '#f1f5f9' }}>{c.cliente}</td>
                          <td style={{ padding: '14px 0', color: '#60a5fa' }}>{c.email}</td>
                          <td style={{ padding: '14px 0' }}>
                            <span style={{ background: 'rgba(59,105,209,0.2)', color: '#3b69d1', padding: '4px 8px', borderRadius: '4px', fontSize: '12px' }}>{c.grupo}</span>
                          </td>
                          <td style={{ padding: '14px 0', color: '#f1f5f9', textAlign: 'right', fontWeight: '500' }}>R$ {c.valor_credito ? (c.valor_credito / 1000).toFixed(1) : '0'}k</td>
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

          {/* Pipeline de Vendas */}
          {activeModule === 'pipeline' && (
            <div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '16px', marginBottom: '32px' }}>
                {['prospeccao', 'qualificado', 'negociacao', 'fechado', 'perdido'].map(stage => {
                  const oppsInStage = oportunidades.filter(o => o.estagio === stage);
                  const totalInStage = oppsInStage.reduce((acc, o) => acc + o.valor, 0);
                  return (
                    <TableCard key={stage} title={`${stage.charAt(0).toUpperCase() + stage.slice(1)} (${oppsInStage.length})`}>
                      <p style={{ margin: '0 0 12px 0', fontSize: '14px', fontWeight: '600', color: getEstagioColor(stage).text }}>R$ {(totalInStage / 1000).toFixed(0)}k</p>
                      <div style={{ fontSize: '12px' }}>
                        {oppsInStage.map(opp => (
                          <div key={opp.id} style={{ background: 'rgba(255,255,255,0.03)', padding: '12px', borderRadius: '6px', marginBottom: '8px', borderLeft: `3px solid ${getEstagioColor(stage).text}` }}>
                            <p style={{ margin: '0 0 4px 0', color: '#f1f5f9', fontWeight: '500', fontSize: '12px' }}>{opp.cliente}</p>
                            <p style={{ margin: '0', color: '#94a3b8', fontSize: '11px' }}>R$ {(opp.valor / 1000).toFixed(0)}k</p>
                          </div>
                        ))}
                      </div>
                    </TableCard>
                  );
                })}
              </div>
            </div>
          )}

          {/* Oportunidades */}
          {activeModule === 'oportunidades' && (
            <TableCard title={`Todas as Oportunidades (${oportunidades.length})`}>
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '16px' }}>
                <button
                  onClick={() => exportToCSV(oportunidades, `oportunidades_${new Date().toISOString().split('T')[0]}.csv`, ['cliente', 'descricao', 'valor', 'estagio'])}
                  style={{ padding: '8px 12px', background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '6px', color: '#cbd5e1', fontSize: '12px', cursor: 'pointer' }}
                >
                  Exportar CSV
                </button>
              </div>

              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', fontSize: '13px', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                      <th style={{ textAlign: 'left', padding: '12px 0', color: '#cbd5e1', fontWeight: '500' }}>Cliente</th>
                      <th style={{ textAlign: 'left', padding: '12px 0', color: '#cbd5e1', fontWeight: '500' }}>Descrição</th>
                      <th style={{ textAlign: 'right', padding: '12px 0', color: '#cbd5e1', fontWeight: '500' }}>Valor</th>
                      <th style={{ textAlign: 'left', padding: '12px 0', color: '#cbd5e1', fontWeight: '500' }}>Estágio</th>
                      <th style={{ textAlign: 'left', padding: '12px 0', color: '#cbd5e1', fontWeight: '500' }}>Atualizado</th>
                    </tr>
                  </thead>
                  <tbody>
                    {oportunidades.map(opp => (
                      <tr key={opp.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                        <td style={{ padding: '14px 0', color: '#f1f5f9', fontWeight: '500' }}>{opp.cliente}</td>
                        <td style={{ padding: '14px 0', color: '#cbd5e1' }}>{opp.descricao}</td>
                        <td style={{ padding: '14px 0', color: '#f1f5f9', textAlign: 'right', fontWeight: '500' }}>R$ {(opp.valor / 1000).toFixed(0)}k</td>
                        <td style={{ padding: '14px 0' }}>
                          <span style={{ background: getEstagioColor(opp.estagio).bg, color: getEstagioColor(opp.estagio).text, padding: '6px 10px', borderRadius: '6px', fontSize: '12px' }}>
                            {opp.estagio.charAt(0).toUpperCase() + opp.estagio.slice(1)}
                          </span>
                        </td>
                        <td style={{ padding: '14px 0', color: '#94a3b8', fontSize: '12px' }}>{new Date(opp.data_atualizacao).toLocaleDateString('pt-BR')}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </TableCard>
          )}

          {/* Tarefas */}
          {activeModule === 'tarefas' && (
            <TableCard title={`Todas as Tarefas (${tarefas.length})`}>
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '16px' }}>
                <button
                  onClick={() => exportToCSV(tarefas, `tarefas_${new Date().toISOString().split('T')[0]}.csv`, ['cliente', 'titulo', 'status', 'prioridade', 'data_vencimento'])}
                  style={{ padding: '8px 12px', background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '6px', color: '#cbd5e1', fontSize: '12px', cursor: 'pointer' }}
                >
                  Exportar CSV
                </button>
              </div>

              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', fontSize: '13px', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                      <th style={{ textAlign: 'left', padding: '12px 0', color: '#cbd5e1', fontWeight: '500' }}>Cliente</th>
                      <th style={{ textAlign: 'left', padding: '12px 0', color: '#cbd5e1', fontWeight: '500' }}>Tarefa</th>
                      <th style={{ textAlign: 'left', padding: '12px 0', color: '#cbd5e1', fontWeight: '500' }}>Status</th>
                      <th style={{ textAlign: 'left', padding: '12px 0', color: '#cbd5e1', fontWeight: '500' }}>Prioridade</th>
                      <th style={{ textAlign: 'left', padding: '12px 0', color: '#cbd5e1', fontWeight: '500' }}>Vencimento</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tarefas.map(task => (
                      <tr key={task.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                        <td style={{ padding: '14px 0', color: '#f1f5f9', fontWeight: '500' }}>{task.cliente}</td>
                        <td style={{ padding: '14px 0', color: '#cbd5e1' }}>{task.titulo}</td>
                        <td style={{ padding: '14px 0' }}>
                          <span style={{ background: getStatusColor(task.status).bg, color: getStatusColor(task.status).text, padding: '6px 10px', borderRadius: '6px', fontSize: '12px' }}>
                            {task.status === 'em_progresso' ? 'Em Progresso' : task.status.charAt(0).toUpperCase() + task.status.slice(1)}
                          </span>
                        </td>
                        <td style={{ padding: '14px 0' }}>
                          <span style={{ background: getPrioridadeColor(task.prioridade).bg, color: getPrioridadeColor(task.prioridade).text, padding: '6px 10px', borderRadius: '6px', fontSize: '12px' }}>
                            {task.prioridade.charAt(0).toUpperCase() + task.prioridade.slice(1)}
                          </span>
                        </td>
                        <td style={{ padding: '14px 0', color: '#94a3b8', fontSize: '12px' }}>{new Date(task.data_vencimento).toLocaleDateString('pt-BR')}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </TableCard>
          )}
        </>
      )}
    </div>
  );
}

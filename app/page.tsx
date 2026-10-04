'use client';

import { useEffect, useState } from 'react';
import { supabase, CarteiraCliente } from '@/lib/supabase';

export default function Home() {
  const [clientes, setClientes] = useState<CarteiraCliente[]>([]);
  const [filteredClientes, setFilteredClientes] = useState<CarteiraCliente[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterGrupo, setFilterGrupo] = useState('');
  const [filterValor, setFilterValor] = useState(100000);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    fetchClientes();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [clientes, search, filterGrupo, filterValor]);

  const fetchClientes = async () => {
    try {
      const { data, error } = await supabase
        .from('carteira_clientes')
        .select('*')
        .eq('situacao', 'Normal')
        .order('cliente', { ascending: true });

      if (error) throw error;
      setClientes(data as CarteiraCliente[]);
    } catch (error) {
      console.error('Erro ao buscar clientes:', error);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = clientes;

    if (search) {
      filtered = filtered.filter(
        (c) =>
          c.cliente.toLowerCase().includes(search.toLowerCase()) ||
          c.cpf_cnpj?.includes(search) ||
          c.email?.toLowerCase().includes(search.toLowerCase())
      );
    }

    if (filterGrupo) {
      filtered = filtered.filter((c) => c.grupo === filterGrupo);
    }

    if (filterValor) {
      filtered = filtered.filter((c) => (c.valor_credito || 0) <= filterValor);
    }

    setFilteredClientes(filtered);
    setCurrentPage(1);
  };

  const grupos = Array.from(new Set(clientes.map((c) => c.grupo))).sort();
  const totalValor = clientes.reduce((acc, c) => acc + (c.valor_credito || 0), 0);
  const mediaValor = clientes.length > 0 ? totalValor / clientes.length : 0;

  const paginatedClientes = filteredClientes.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const totalPages = Math.ceil(filteredClientes.length / itemsPerPage);

  const exportToCSV = () => {
    const headers = ['Cliente', 'CPF/CNPJ', 'Email', 'Telefone', 'Grupo', 'Valor Crédito', 'Parcelas'];
    const rows = filteredClientes.map((c) => [
      c.cliente,
      c.cpf_cnpj,
      c.email,
      c.telefone,
      c.grupo,
      c.valor_credito,
      `${c.parcelas_pagas}/${c.parcelas_a_pagar}`,
    ]);

    const csv = [headers, ...rows].map((row) => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `carteira_clientes_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  return (
    <div style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)', minHeight: '100vh', padding: '24px', color: '#fff' }}>
      {/* Header */}
      <div style={{ marginBottom: '32px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
          <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: 'linear-gradient(135deg, #10b981 0%, #06b6d4 100%)' }}></div>
          <h1 style={{ margin: '0', fontSize: '28px', fontWeight: '600', letterSpacing: '-0.5px' }}>Carteira Clientes</h1>
        </div>
        <p style={{ margin: '0', fontSize: '14px', color: '#94a3b8' }}>Gestão integrada de sua base de clientes</p>
      </div>

      {/* KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '32px' }}>
        <div style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', padding: '20px', backdropFilter: 'blur(10px)' }}>
          <p style={{ margin: '0 0 12px 0', fontSize: '12px', color: '#cbd5e1', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Total Clientes</p>
          <p style={{ margin: '0', fontSize: '32px', fontWeight: '700', background: 'linear-gradient(135deg, #10b981 0%, #06b6d4 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>{clientes.length}</p>
        </div>

        <div style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', padding: '20px', backdropFilter: 'blur(10px)' }}>
          <p style={{ margin: '0 0 12px 0', fontSize: '12px', color: '#cbd5e1', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Valor Total</p>
          <p style={{ margin: '0', fontSize: '32px', fontWeight: '700', color: '#e0e7ff' }}>R$ {(totalValor / 1000000).toFixed(1)}M</p>
        </div>

        <div style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', padding: '20px', backdropFilter: 'blur(10px)' }}>
          <p style={{ margin: '0 0 12px 0', fontSize: '12px', color: '#cbd5e1', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Valor Médio</p>
          <p style={{ margin: '0', fontSize: '32px', fontWeight: '700', color: '#fca5a5' }}>R$ {(mediaValor / 1000).toFixed(1)}k</p>
        </div>

        <div style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', padding: '20px', backdropFilter: 'blur(10px)' }}>
          <p style={{ margin: '0 0 12px 0', fontSize: '12px', color: '#cbd5e1', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Taxa Ativa</p>
          <p style={{ margin: '0', fontSize: '32px', fontWeight: '700', color: '#a78bfa' }}>100%</p>
        </div>
      </div>

      {/* Main Content */}
      <div style={{ display: 'grid', gridTemplateColumns: '220px 1fr', gap: '20px' }}>
        {/* Filters */}
        <div style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', padding: '20px', height: 'fit-content', backdropFilter: 'blur(10px)' }}>
          <h3 style={{ margin: '0 0 16px 0', fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.5px', color: '#cbd5e1' }}>Filtros</h3>

          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', fontSize: '12px', color: '#cbd5e1', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Buscar</label>
            <input
              type="text"
              placeholder="Nome, CPF ou email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ width: '100%', padding: '10px 12px', background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '8px', color: '#fff', fontSize: '13px', boxSizing: 'border-box' }}
            />
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', fontSize: '12px', color: '#cbd5e1', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Grupo</label>
            <select
              value={filterGrupo}
              onChange={(e) => setFilterGrupo(e.target.value)}
              style={{ width: '100%', padding: '10px 12px', background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '8px', color: '#fff', fontSize: '13px', boxSizing: 'border-box' }}
            >
              <option value="">Todos</option>
              {grupos.map((g) => (
                <option key={g} value={g}>{g}</option>
              ))}
            </select>
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', fontSize: '12px', color: '#cbd5e1', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Valor (R$)</label>
            <input
              type="range"
              min="0"
              max="200000"
              step="10000"
              value={filterValor}
              onChange={(e) => setFilterValor(Number(e.target.value))}
              style={{ width: '100%', height: '4px' }}
            />
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '8px', fontSize: '11px', color: '#94a3b8' }}>
              <span>R$ 0</span>
              <span>R$ {(filterValor / 1000).toFixed(0)}k</span>
            </div>
          </div>

          <button
            onClick={() => { setSearch(''); setFilterGrupo(''); setFilterValor(200000); }}
            style={{ width: '100%', padding: '10px', background: 'transparent', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '8px', color: '#94a3b8', fontWeight: '500', fontSize: '13px', cursor: 'pointer', marginTop: '8px' }}
          >
            Limpar Tudo
          </button>
        </div>

        {/* Table */}
        <div style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', padding: '20px', backdropFilter: 'blur(10px)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h3 style={{ margin: '0', fontSize: '14px', color: '#f1f5f9' }}>Clientes Ativos</h3>
            <button
              onClick={exportToCSV}
              style={{ padding: '8px 12px', background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '6px', color: '#cbd5e1', fontSize: '12px', cursor: 'pointer' }}
            >
              Exportar
            </button>
          </div>

          {loading ? (
            <p style={{ color: '#cbd5e1', textAlign: 'center', padding: '40px 0' }}>Carregando...</p>
          ) : (
            <>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', fontSize: '13px', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                      <th style={{ textAlign: 'left', padding: '12px 0', color: '#cbd5e1', fontWeight: '500' }}>Cliente</th>
                      <th style={{ textAlign: 'left', padding: '12px 0', color: '#cbd5e1', fontWeight: '500' }}>CPF/CNPJ</th>
                      <th style={{ textAlign: 'left', padding: '12px 0', color: '#cbd5e1', fontWeight: '500' }}>Email</th>
                      <th style={{ textAlign: 'left', padding: '12px 0', color: '#cbd5e1', fontWeight: '500' }}>Grupo</th>
                      <th style={{ textAlign: 'right', padding: '12px 0', color: '#cbd5e1', fontWeight: '500' }}>Valor</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedClientes.map((c) => (
                      <tr key={c.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                        <td style={{ padding: '14px 0', color: '#f1f5f9' }}>{c.cliente}</td>
                        <td style={{ padding: '14px 0', color: '#cbd5e1' }}>{c.cpf_cnpj}</td>
                        <td style={{ padding: '14px 0', color: '#60a5fa', textDecoration: 'underline' }}>{c.email}</td>
                        <td style={{ padding: '14px 0' }}>
                          <span style={{ background: 'rgba(59,105,209,0.2)', color: '#3b69d1', padding: '4px 8px', borderRadius: '4px', fontSize: '12px' }}>{c.grupo}</span>
                        </td>
                        <td style={{ padding: '14px 0', color: '#f1f5f9', textAlign: 'right', fontWeight: '500' }}>
                          R$ {c.valor_credito ? (c.valor_credito / 1000).toFixed(1) : '0'}k
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '16px', paddingTop: '16px', borderTop: '1px solid rgba(255,255,255,0.1)', fontSize: '12px', color: '#94a3b8' }}>
                <span>Mostrando {paginatedClientes.length} de {filteredClientes.length} clientes</span>
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
            </>
          )}
        </div>
      </div>
    </div>
  );
}

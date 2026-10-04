'use client';

import { useEffect, useState } from 'react';
import { supabase, CarteiraCliente } from '@/lib/supabase';

export default function Home() {
  const [clientes, setClientes] = useState<CarteiraCliente[]>([]);
  const [filteredClientes, setFilteredClientes] = useState<CarteiraCliente[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterSituacao, setFilterSituacao] = useState('');
  const [filterGrupo, setFilterGrupo] = useState('');

  useEffect(() => {
    fetchClientes();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [clientes, search, filterSituacao, filterGrupo]);

  const fetchClientes = async () => {
    try {
      const { data, error } = await supabase
        .from('carteira_clientes')
        .select('*')
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

    if (filterSituacao) {
      filtered = filtered.filter((c) => c.situacao === filterSituacao);
    }

    if (filterGrupo) {
      filtered = filtered.filter((c) => c.grupo === filterGrupo);
    }

    setFilteredClientes(filtered);
  };

  const situacoes = Array.from(new Set(clientes.map((c) => c.situacao)));
  const grupos = Array.from(new Set(clientes.map((c) => c.grupo)));

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <h1 className="text-3xl font-bold text-gray-900">Acompanhamento de Carteira</h1>
          <p className="text-gray-600 mt-1">
            Total de clientes: <strong>{clientes.length}</strong> | Exibindo: <strong>{filteredClientes.length}</strong>
          </p>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6">
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <input
              type="text"
              placeholder="Buscar por nome, CPF ou email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <select
              value={filterSituacao}
              onChange={(e) => setFilterSituacao(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Todas as situações</option>
              {situacoes.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
            <select
              value={filterGrupo}
              onChange={(e) => setFilterGrupo(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Todos os grupos</option>
              {grupos.map((g) => (
                <option key={g} value={g}>
                  {g}
                </option>
              ))}
            </select>
            <button
              onClick={() => {
                setSearch('');
                setFilterSituacao('');
                setFilterGrupo('');
              }}
              className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400"
            >
              Limpar filtros
            </button>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-8">Carregando...</div>
        ) : (
          <div className="bg-white rounded-lg shadow overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-100 border-b">
                <tr>
                  <th className="px-6 py-3 text-left font-semibold">Cliente</th>
                  <th className="px-6 py-3 text-left font-semibold">CPF/CNPJ</th>
                  <th className="px-6 py-3 text-left font-semibold">Email</th>
                  <th className="px-6 py-3 text-left font-semibold">Telefone</th>
                  <th className="px-6 py-3 text-left font-semibold">Cota</th>
                  <th className="px-6 py-3 text-left font-semibold">Grupo</th>
                  <th className="px-6 py-3 text-left font-semibold">Situação</th>
                  <th className="px-6 py-3 text-left font-semibold">Contrato</th>
                  <th className="px-6 py-3 text-right font-semibold">Crédito</th>
                  <th className="px-6 py-3 text-right font-semibold">Parcelas</th>
                  <th className="px-6 py-3 text-left font-semibold">Data Venda</th>
                </tr>
              </thead>
              <tbody>
                {filteredClientes.map((cliente) => (
                  <tr key={cliente.id} className="border-b hover:bg-gray-50">
                    <td className="px-6 py-4">{cliente.cliente}</td>
                    <td className="px-6 py-4 text-gray-600">{cliente.cpf_cnpj}</td>
                    <td className="px-6 py-4 text-sm text-blue-600">{cliente.email}</td>
                    <td className="px-6 py-4 text-gray-600">{cliente.telefone}</td>
                    <td className="px-6 py-4 font-mono text-sm">{cliente.cota}</td>
                    <td className="px-6 py-4 text-gray-600">{cliente.grupo}</td>
                    <td className="px-6 py-4">
                      <span
                        className={`px-2 py-1 rounded text-xs font-semibold ${
                          cliente.situacao === 'Normal'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {cliente.situacao}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-mono">{cliente.num_contrato}</td>
                    <td className="px-6 py-4 text-right text-gray-900 font-semibold">
                      {cliente.valor_credito
                        ? `R$ ${cliente.valor_credito.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
                        : '—'}
                    </td>
                    <td className="px-6 py-4 text-right text-gray-700">
                      {cliente.parcelas_pagas}/{cliente.parcelas_a_pagar}
                    </td>
                    <td className="px-6 py-4 text-gray-600">
                      {cliente.data_venda
                        ? new Date(cliente.data_venda).toLocaleDateString('pt-BR')
                        : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </div>
  );
}

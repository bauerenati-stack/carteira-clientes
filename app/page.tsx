'use client';

import { useEffect, useState } from 'react';

type Module = 'dashboard' | 'carteira' | 'comissoes' | 'alertas' | 'calendario' | 'pipeline';
type TabComissoes = 'recebimentos' | 'projecao';
type TabCarteira = 'todos' | 'novos-clientes';

interface Cliente {
  id: string;
  nome: string;
  cpf_cnpj: string;
  email: string;
  telefone: string;
  grupo: string;
  cota: number;
  num_contrato: number;
  situacao: string;
  tipo_produto: string;
  credito: number;
  valor_parcela: number;
  parcelas_pagas: number;
  parcelas_atraso: number;
  data_venda: string;
  prazo_cota: number;
}

interface Alerta {
  cliente: string;
  cpf_cnpj: string;
  tipo_alerta: string;
}

interface Parcela {
  cliente: string;
  mes: number;
  ano: number;
  valor_comissao: number;
  status: string;
}

interface AnaliseProjecao {
  mes: number;
  ano: number;
  projecao: number;
  recebido: number;
  diferenca: number;
  clientes_elegibles: number;
}

export default function Home() {
  const [activeModule, setActiveModule] = useState<Module>('dashboard');
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [alertas, setAlertas] = useState<Alerta[]>([]);
  const [calendario, setCalendario] = useState<Parcela[]>([]);
  const [analise, setAnalise] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [tabComissoes, setTabComissoes] = useState<TabComissoes>('recebimentos');
  const [tabCarteira, setTabCarteira] = useState<TabCarteira>('todos');
  const [mesFiltro, setMesFiltro] = useState<number>(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [projecaoOutubro, setProjecaoOutubro] = useState<any>(null);

  useEffect(() => {
    fetchDados();
  }, []);

  const fetchDados = async () => {
    try {
      const [clientesRes, alertasRes, calendarioRes, analiseRes, outRes] = await Promise.all([
        fetch('/clientes_novos.json'),
        fetch('/alertas_clientes.json'),
        fetch('/calendario_comissoes.json'),
        fetch('/analise_corrigida.json'),
        fetch('/projecao_outubro.json'),
      ]);

      if (clientesRes.ok) {
        const clientesData = await clientesRes.json();
        setClientes(clientesData);
      }
      if (alertasRes.ok) {
        const alertasData = await alertasRes.json();
        setAlertas(alertasData);
      }
      if (calendarioRes.ok) {
        const calendarioData = await calendarioRes.json();
        setCalendario(calendarioData);
      }
      if (analiseRes.ok) {
        const analiseData = await analiseRes.json();
        setAnalise(analiseData);
      }
      if (outRes.ok) {
        const outData = await outRes.json();
        setProjecaoOutubro(outData);
      }
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    } finally {
      setLoading(false);
    }
  };

  // Filtro de clientes novos por mês
  const getMesInicio = (dataVenda: string): number => {
    const date = new Date(dataVenda);
    return date.getMonth() + 1;
  };

  const getAnoInicio = (dataVenda: string): number => {
    const date = new Date(dataVenda);
    return date.getFullYear();
  };

  const clientesFiltrados = tabCarteira === 'novos-clientes' && mesFiltro > 0
    ? clientes.filter(c => getMesInicio(c.data_venda) === mesFiltro)
    : clientes;

  const clientesExibicao = clientesFiltrados.filter(c =>
    c.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.cpf_cnpj.includes(searchTerm)
  );

  // Calcular comissões por cliente
  const calcularComissao = (cliente: Cliente): number => {
    const taxas: { [key: string]: number } = {
      'Imóvel': 0.001288,
      'Veicular': 0.001538,
    };
    const taxa = taxas[cliente.tipo_produto] || 0;
    return cliente.credito * taxa;
  };

  // Determinar status do cliente
  const getStatus = (cliente: Cliente): string => {
    if (cliente.parcelas_pagas >= 13) return 'FINALIZADO';
    if (cliente.parcelas_atraso > 3) return 'CANCELADO';
    return 'ATIVO';
  };

  const getStatusColor = (status: string): string => {
    if (status === 'FINALIZADO') return 'bg-green-100 text-green-800';
    if (status === 'CANCELADO') return 'bg-red-100 text-red-800';
    return 'bg-blue-100 text-blue-800';
  };

  // Dashboard KPIs
  const totalCredito = clientes.reduce((sum, c) => sum + c.credito, 0);
  const totalClientes = clientes.length;
  const totalEmAtraso = clientes.reduce((sum, c) => sum + c.parcelas_atraso, 0);
  const comissaoTotalMes = clientes.reduce((sum, c) => sum + calcularComissao(c), 0);

  return (
    <div className="min-h-screen bg-white">
      {/* Navbar */}
      <nav className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <h1 className="text-2xl font-semibold text-gray-900">Gerenciador de Comissões</h1>
            <div className="text-xs text-gray-500">v5.0</div>
          </div>
        </div>
      </nav>

      {/* Menu de Módulos */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex gap-0 overflow-x-auto">
            {(['dashboard', 'carteira', 'comissoes', 'alertas'] as const).map(module => (
              <button
                key={module}
                onClick={() => setActiveModule(module)}
                className={`px-4 py-3 text-sm font-medium whitespace-nowrap transition-all border-b-2 ${
                  activeModule === module
                    ? 'border-blue-600 text-gray-900'
                    : 'border-transparent text-gray-600 hover:text-gray-900'
                }`}
              >
                {module === 'dashboard' && 'Dashboard'}
                {module === 'carteira' && 'Carteira'}
                {module === 'comissoes' && 'Comissões'}
                {module === 'alertas' && 'Alertas'}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Conteúdo Principal */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {loading ? (
          <div className="text-center py-12">
            <p className="text-white text-lg">Carregando...</p>
          </div>
        ) : (
          <>
            {/* DASHBOARD */}
            {activeModule === 'dashboard' && (
              <div>
                <h2 className="text-lg font-semibold text-gray-900 mb-6">Resumo de Desempenho</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="bg-white rounded-lg p-5 border border-gray-200 hover:border-gray-300 transition-colors">
                    <p className="text-xs font-medium text-gray-600 uppercase tracking-wide">Total de Clientes</p>
                    <p className="text-3xl font-bold text-gray-900 mt-2">{totalClientes}</p>
                    <p className="text-xs text-gray-500 mt-2">Clientes ativos na carteira</p>
                  </div>
                  <div className="bg-white rounded-lg p-5 border border-gray-200 hover:border-gray-300 transition-colors">
                    <p className="text-xs font-medium text-gray-600 uppercase tracking-wide">Crédito Total</p>
                    <p className="text-3xl font-bold text-gray-900 mt-2">R$ {(totalCredito / 1000).toFixed(1)}k</p>
                    <p className="text-xs text-gray-500 mt-2">Valor total de crédito</p>
                  </div>
                  <div className="bg-white rounded-lg p-5 border border-red-200 hover:border-red-300 transition-colors">
                    <p className="text-xs font-medium text-red-700 uppercase tracking-wide">Parcelas em Atraso</p>
                    <p className="text-3xl font-bold text-red-700 mt-2">{totalEmAtraso}</p>
                    <p className="text-xs text-gray-500 mt-2">Parcelas não pagas</p>
                  </div>
                  <div className="bg-white rounded-lg p-5 border border-blue-200 hover:border-blue-300 transition-colors">
                    <p className="text-xs font-medium text-blue-700 uppercase tracking-wide">Comissão (Teórica)</p>
                    <p className="text-3xl font-bold text-blue-700 mt-2">R$ {comissaoTotalMes.toFixed(2)}</p>
                    <p className="text-xs text-gray-500 mt-2">Se todos pagassem</p>
                  </div>
                </div>
              </div>
            )}

            {/* CARTEIRA */}
            {activeModule === 'carteira' && (
              <div>
                <h2 className="text-lg font-semibold text-gray-900 mb-6">Carteira de Clientes</h2>

                {/* Abas */}
                <div className="flex gap-2 mb-6 border-b border-gray-200">
                  {(['todos', 'novos-clientes'] as const).map(tab => (
                    <button
                      key={tab}
                      onClick={() => {
                        setTabCarteira(tab);
                        setMesFiltro(0);
                      }}
                      className={`px-4 py-3 text-sm font-medium border-b-2 transition-all ${
                        tabCarteira === tab
                          ? 'border-blue-600 text-gray-900'
                          : 'border-transparent text-gray-600 hover:text-gray-900'
                      }`}
                    >
                      {tab === 'todos' && 'Todos os Clientes'}
                      {tab === 'novos-clientes' && 'Clientes Novos'}
                    </button>
                  ))}
                </div>

                {/* Filtro de Mês (Clientes Novos) */}
                {tabCarteira === 'novos-clientes' && (
                  <div className="mb-6">
                    <select
                      value={mesFiltro}
                      onChange={(e) => setMesFiltro(parseInt(e.target.value))}
                      className="px-4 py-2 rounded bg-slate-700 text-white border border-slate-600"
                    >
                      <option value={0}>Selecione um mês...</option>
                      {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(m => (
                        <option key={m} value={m}>
                          {new Date(2026, m - 1).toLocaleString('pt-BR', { month: 'long', year: 'numeric' })}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Busca */}
                <div className="mb-6">
                  <input
                    type="text"
                    placeholder="Buscar por nome ou CPF..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full px-4 py-2 rounded bg-white text-gray-900 border border-gray-300 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {/* Tabela */}
                <div className="overflow-x-auto bg-white rounded-lg border border-gray-200">
                  <table className="w-full text-sm text-left text-gray-700">
                    <thead className="bg-gray-50 border-b border-gray-200">
                      <tr>
                        <th className="px-6 py-3 font-semibold text-gray-900">Nome</th>
                        <th className="px-6 py-3 font-semibold text-gray-900">Status</th>
                        <th className="px-6 py-3 font-semibold text-gray-900">CPF/CNPJ</th>
                        <th className="px-6 py-3 font-semibold text-gray-900">Telefone</th>
                        <th className="px-6 py-3 font-semibold text-gray-900">Grupo</th>
                        <th className="px-6 py-3 font-semibold text-gray-900">Cota</th>
                        <th className="px-6 py-3 font-semibold text-gray-900">Crédito</th>
                        <th className="px-6 py-3 font-semibold text-gray-900">Tipo</th>
                        <th className="px-6 py-3 font-semibold text-gray-900">Data Venda</th>
                        <th className="px-6 py-3 font-semibold text-gray-900">Pagas</th>
                        <th className="px-6 py-3 font-semibold text-gray-900">Atraso</th>
                      </tr>
                    </thead>
                    <tbody>
                      {clientesExibicao.map((cliente) => {
                        const status = getStatus(cliente);
                        const statusColor = getStatusColor(status);
                        return (
                          <tr key={cliente.id} className="border-b border-gray-200 hover:bg-gray-50 transition-colors">
                            <td className="px-6 py-3 font-medium text-gray-900">{cliente.nome}</td>
                            <td className="px-6 py-3">
                              <span className={`px-2 py-1 rounded text-xs font-semibold ${statusColor}`}>
                                {status}
                              </span>
                            </td>
                            <td className="px-6 py-3 text-gray-700">{cliente.cpf_cnpj}</td>
                            <td className="px-6 py-3 text-gray-700">{cliente.telefone}</td>
                            <td className="px-6 py-3 text-gray-700">{cliente.grupo}</td>
                            <td className="px-6 py-3 text-gray-700">{cliente.cota}</td>
                            <td className="px-6 py-3 font-semibold text-gray-900">R$ {cliente.credito.toFixed(2)}</td>
                            <td className="px-6 py-3">
                              <span className={`px-2 py-1 rounded text-xs font-semibold ${
                                cliente.tipo_produto === 'Imóvel'
                                  ? 'bg-blue-100 text-blue-800'
                                  : 'bg-purple-100 text-purple-800'
                              }`}>
                                {cliente.tipo_produto}
                              </span>
                            </td>
                            <td className="px-6 py-3 text-gray-700">{new Date(cliente.data_venda).toLocaleDateString('pt-BR')}</td>
                            <td className="px-6 py-3 text-center font-semibold text-gray-900">{cliente.parcelas_pagas}/13</td>
                            <td className="px-6 py-3 text-center font-semibold text-red-600">{cliente.parcelas_atraso}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
                <p className="text-slate-400 text-sm mt-4">Total: {clientesExibicao.length} clientes</p>
              </div>
            )}

            {/* COMISSÕES */}
            {activeModule === 'comissoes' && (
              <div>
                <h2 className="text-lg font-semibold text-gray-900 mb-6">Comissões</h2>

                {/* Abas */}
                <div className="flex gap-0 mb-6 border-b border-gray-200">
                  {(['recebimentos', 'projecao'] as const).map(tab => (
                    <button
                      key={tab}
                      onClick={() => setTabComissoes(tab)}
                      className={`px-4 py-3 text-sm font-medium border-b-2 transition-all ${
                        tabComissoes === tab
                          ? 'border-blue-600 text-gray-900'
                          : 'border-transparent text-gray-600 hover:text-gray-900'
                      }`}
                    >
                      {tab === 'recebimentos' && 'Recebimentos do Mês'}
                      {tab === 'projecao' && 'Projeção do Mês'}
                    </button>
                  ))}
                </div>

                {/* Recebimentos */}
                {tabComissoes === 'recebimentos' && (
                  <div className="space-y-6">
                    <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                      <p className="text-blue-900 text-sm font-medium">
                        <strong>Como funciona:</strong> Você recebe em um mês o pagamento das parcelas do mês anterior.
                      </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      <div className="bg-white rounded-lg p-5 border border-gray-200 opacity-75">
                        <p className="text-gray-600 text-xs font-semibold uppercase tracking-wide">Julho 2026</p>
                        <p className="text-2xl font-bold text-gray-900 mt-2">R$ 4.537,75</p>
                        <p className="text-gray-500 text-xs mt-2">✓ Recebido</p>
                      </div>
                      <div className="bg-white rounded-lg p-5 border border-gray-200 opacity-75">
                        <p className="text-gray-600 text-xs font-semibold uppercase tracking-wide">Agosto 2026</p>
                        <p className="text-2xl font-bold text-gray-900 mt-2">R$ 5.374,08</p>
                        <p className="text-gray-500 text-xs mt-2">✓ Recebido</p>
                      </div>
                      <div className="bg-white rounded-lg p-5 border-2 border-green-300">
                        <p className="text-green-700 text-xs font-semibold uppercase tracking-wide">Setembro 2026</p>
                        <p className="text-2xl font-bold text-green-700 mt-2">R$ 7.374,40</p>
                        <p className="text-green-600 text-xs mt-2">✓ Recebido</p>
                      </div>
                      <div className="bg-white rounded-lg p-5 border-2 border-blue-300">
                        <p className="text-blue-700 text-xs font-semibold uppercase tracking-wide">Outubro 2026</p>
                        <p className="text-xs text-gray-600 mb-2">Projeção referente a setembro</p>
                        {projecaoOutubro && (
                          <>
                            <p className="text-2xl font-bold text-blue-700 mt-2">R$ {projecaoOutubro.projecao_total.toFixed(2)}</p>
                            <p className="text-gray-600 text-xs mt-2">Estimado</p>
                          </>
                        )}
                      </div>
                    </div>

                    <div className="bg-gradient-to-r from-yellow-600 to-yellow-700 rounded-lg p-6">
                      <p className="text-yellow-100 text-sm">TOTAL RECEBIDO (3 MESES)</p>
                      <p className="text-5xl font-bold text-white mt-2">R$ 17.286,23</p>
                      <p className="text-yellow-200 text-xs mt-3">Período: Julho → Setembro 2026</p>
                    </div>

                    <div className="bg-slate-800 rounded-lg p-4 border border-slate-700">
                      <p className="text-slate-400 text-sm">
                        ✅ Dados extraídos de seus relatórios de comissões da Ademicon.<br/>
                        Os valores acima são o que você <strong>recebeu efetivamente</strong> em cada mês.
                      </p>
                    </div>

                    <div className="bg-amber-900 rounded-lg p-4 border border-amber-700">
                      <p className="text-amber-200 text-sm mb-2">
                        <strong>📌 SITUAÇÃO ATUAL (06 de outubro):</strong>
                      </p>
                      <p className="text-amber-200 text-sm">
                        ✅ <strong>Setembro:</strong> Recebido R$ 7.374,40 (fechado)<br/>
                        🔮 <strong>Outubro:</strong> Projeção R$ 7.374,40 (aguardando confirmação de quem vai pagar até 15/10)<br/>
                        📅 <strong>Novembro:</strong> Vai depender dos pagamentos de outubro até 15/10<br/>
                      </p>
                    </div>

                    <div className="bg-yellow-900 rounded-lg p-4 border border-yellow-700">
                      <p className="text-yellow-200 text-sm">
                        <strong>➕ NOVO CLIENTE EM OUTUBRO?</strong><br/>
                        Se entrar venda novo cliente em outubro, você me avisa e eu atualizo a carteira. A projeção de novembro vai recalcular automaticamente!
                      </p>
                    </div>
                  </div>
                )}

                {/* Projeção */}
                {tabComissoes === 'projecao' && (
                  <div className="space-y-6">
                    <h3 className="text-xl font-bold text-white">Comparação: Projeção vs Recebido</h3>

                    <div className="bg-yellow-900 rounded-lg p-4 border border-yellow-700">
                      <p className="text-yellow-200 text-sm">
                        <strong>⚠️ IMPORTANTE:</strong> Julho, Agosto e Setembro são <strong>dados reais</strong> (recebidos).<br/>
                        <strong>Outubro</strong> é a projeção de recebimentos referentes aos pagamentos de <strong>setembro até 15/09</strong>.<br/>
                        <strong>Novembro</strong> será referente aos pagamentos de outubro (que vencem até 15/10 - ainda pode mudar!).
                      </p>
                    </div>

                    <div className="overflow-x-auto bg-slate-800 rounded-lg border border-slate-700">
                      <table className="w-full text-sm text-center text-white">
                        <thead className="bg-slate-900 border-b border-slate-700">
                          <tr>
                            <th className="px-4 py-3 text-left">Mês</th>
                            <th className="px-4 py-3">Projeção</th>
                            <th className="px-4 py-3">Recebido</th>
                            <th className="px-4 py-3">Diferença</th>
                            <th className="px-4 py-3">Clientes</th>
                          </tr>
                        </thead>
                        <tbody>
                          {analise && analise.meses && analise.meses.map((item: any) => (
                            <tr key={`${item.ano}-${item.mes}`} className="border-b border-slate-700 hover:bg-slate-700">
                              <td className="px-4 py-3 text-left font-semibold">
                                {new Date(item.ano, item.mes - 1).toLocaleString('pt-BR', { month: 'long', year: 'numeric' })}
                              </td>
                              <td className="px-4 py-3 font-semibold text-blue-400">
                                R$ {item.projecao.toFixed(2)}
                              </td>
                              <td className="px-4 py-3 font-semibold text-green-400">
                                {item.recebido ? `R$ ${item.recebido.toFixed(2)}` : '-'}
                              </td>
                              <td className={`px-4 py-3 font-bold ${
                                item.diferenca === null || item.diferenca === undefined ? 'text-slate-400' :
                                item.diferenca >= 0 ? 'text-green-400' : 'text-orange-400'
                              }`}>
                                {item.diferenca !== null && item.diferenca !== undefined ? (
                                  <>{item.diferenca >= 0 ? '+' : ''} R$ {item.diferenca.toFixed(2)}</>
                                ) : (
                                  '-'
                                )}
                              </td>
                              <td className="px-4 py-3">-</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {analise && analise.meses && (
                        <>
                          <div className="bg-blue-900 rounded-lg p-4 border border-blue-700">
                            <p className="text-blue-200 text-xs font-semibold">PROJEÇÃO (3 MESES)</p>
                            <p className="text-2xl font-bold text-blue-300 mt-2">
                              R$ {(analise.meses.slice(0, 3).reduce((sum: number, a: any) => sum + a.projecao, 0)).toFixed(2)}
                            </p>
                            <p className="text-blue-400 text-xs mt-1">Se todos pagassem no prazo</p>
                          </div>
                          <div className="bg-green-900 rounded-lg p-4 border border-green-700">
                            <p className="text-green-200 text-xs font-semibold">RECEBIDO (3 MESES)</p>
                            <p className="text-2xl font-bold text-green-300 mt-2">
                              R$ {(analise.meses.slice(0, 3).reduce((sum: number, a: any) => sum + (a.recebido || 0), 0)).toFixed(2)}
                            </p>
                            <p className="text-green-400 text-xs mt-1">Efetivamente recebido</p>
                          </div>
                          <div className={`rounded-lg p-4 border ${
                            (analise.meses.slice(0, 3).reduce((sum: number, a: any) => sum + (a.diferenca || 0), 0)) >= 0
                              ? 'bg-green-900 border-green-700'
                              : 'bg-orange-900 border-orange-700'
                          }`}>
                            <p className="text-xs font-semibold" style={{
                              color: (analise.meses.slice(0, 3).reduce((sum: number, a: any) => sum + (a.diferenca || 0), 0)) >= 0 ? '#bbf7d0' : '#fed7aa'
                            }}>
                              SALDO
                            </p>
                            <p className="text-2xl font-bold mt-2" style={{
                              color: (analise.meses.slice(0, 3).reduce((sum: number, a: any) => sum + (a.diferenca || 0), 0)) >= 0 ? '#86efac' : '#fdba74'
                            }}>
                              {(analise.meses.slice(0, 3).reduce((sum: number, a: any) => sum + (a.diferenca || 0), 0)) >= 0 ? '+' : ''} R$ {(analise.meses.slice(0, 3).reduce((sum: number, a: any) => sum + (a.diferenca || 0), 0)).toFixed(2)}
                            </p>
                            <p className="text-xs mt-1" style={{
                              color: (analise.meses.slice(0, 3).reduce((sum: number, a: any) => sum + (a.diferenca || 0), 0)) >= 0 ? '#86efac' : '#fdba74'
                            }}>
                              {(analise.meses.slice(0, 3).reduce((sum: number, a: any) => sum + (a.diferenca || 0), 0)) >= 0 ? 'Acima da projeção' : 'Abaixo da projeção'}
                            </p>
                          </div>
                        </>
                      )}
                    </div>

                    <div className="bg-slate-800 rounded-lg p-4 border border-slate-700">
                      <p className="text-slate-300 text-sm">
                        <strong>💡 Como funciona:</strong><br/>
                        A projeção mostra quanto você deveria receber se <strong>todos os clientes pagassem nas datas limite</strong> (dia 15 para imóvel, dia 7 para veicular). A diferença indica atrasos, recuperações de meses anteriores ou clientes que não pagaram no prazo.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ALERTAS */}
            {activeModule === 'alertas' && (
              <div>
                <h2 className="text-lg font-semibold text-slate-200 mb-4">Clientes com Atraso</h2>
                <div className="space-y-2">
                  {clientes.filter(c => c.parcelas_atraso > 0).length > 0 ? (
                    clientes.filter(c => c.parcelas_atraso > 0).map((cliente) => (
                      <div key={cliente.id} className="bg-slate-800 border border-orange-700 rounded p-3 flex justify-between items-center">
                        <div>
                          <p className="font-medium text-white text-sm">{cliente.nome}</p>
                          <p className="text-slate-400 text-xs">{cliente.parcelas_atraso} parcela(s) em atraso • {cliente.telefone}</p>
                        </div>
                        <a
                          href={`https://wa.me/55${cliente.telefone.replace(/\D/g, '')}?text=Olá%20${encodeURIComponent(cliente.nome)},%20venho%20lembrá-lo%20sobre%20sua(s)%20parcela(s)%20em%20atraso.%20Favor%20regularizar.`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="bg-green-700 hover:bg-green-600 text-white px-3 py-1 rounded text-xs font-medium transition-colors"
                        >
                          WhatsApp
                        </a>
                      </div>
                    ))
                  ) : (
                    <p className="text-slate-400 text-sm">Nenhum cliente com atraso</p>
                  )}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

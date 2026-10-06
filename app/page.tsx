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

  // Dashboard KPIs
  const totalCredito = clientes.reduce((sum, c) => sum + c.credito, 0);
  const totalClientes = clientes.length;
  const totalEmAtraso = clientes.reduce((sum, c) => sum + c.parcelas_atraso, 0);
  const comissaoTotalMes = clientes.reduce((sum, c) => sum + calcularComissao(c), 0);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800">
      {/* Navbar */}
      <nav className="bg-gradient-to-r from-blue-600 to-blue-700 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <h1 className="text-2xl font-bold text-white">💎 CARTEIRA NATI BAUER</h1>
            <div className="text-sm text-blue-100">v4.0 - Projeção Corrigida</div>
          </div>
        </div>
      </nav>

      {/* Menu de Módulos */}
      <div className="bg-slate-800 border-b border-slate-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex gap-2 overflow-x-auto py-2">
            {(['dashboard', 'carteira', 'comissoes', 'alertas'] as const).map(module => (
              <button
                key={module}
                onClick={() => setActiveModule(module)}
                className={`px-4 py-2 rounded font-semibold whitespace-nowrap transition-all ${
                  activeModule === module
                    ? 'bg-blue-600 text-white shadow-lg'
                    : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                }`}
              >
                {module === 'dashboard' && '📊 Dashboard'}
                {module === 'carteira' && '👥 Carteira'}
                {module === 'comissoes' && '💰 Comissões'}
                {module === 'alertas' && '⚠️ Alertas'}
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
                <h2 className="text-3xl font-bold text-white mb-6">Resumo Geral</h2>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                  <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-lg p-6 text-white">
                    <p className="text-sm opacity-90">Total de Clientes</p>
                    <p className="text-4xl font-bold">{totalClientes}</p>
                  </div>
                  <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg p-6 text-white">
                    <p className="text-sm opacity-90">Crédito Total</p>
                    <p className="text-2xl font-bold">R$ {(totalCredito / 1000).toFixed(0)}k</p>
                  </div>
                  <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg p-6 text-white">
                    <p className="text-sm opacity-90">Em Atraso</p>
                    <p className="text-4xl font-bold">{totalEmAtraso}</p>
                  </div>
                  <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg p-6 text-white">
                    <p className="text-sm opacity-90">Comissão (Mês)</p>
                    <p className="text-2xl font-bold">R$ {comissaoTotalMes.toFixed(2)}</p>
                  </div>
                </div>
              </div>
            )}

            {/* CARTEIRA */}
            {activeModule === 'carteira' && (
              <div>
                <h2 className="text-3xl font-bold text-white mb-6">Carteira de Clientes</h2>

                {/* Abas */}
                <div className="flex gap-2 mb-6">
                  {(['todos', 'novos-clientes'] as const).map(tab => (
                    <button
                      key={tab}
                      onClick={() => {
                        setTabCarteira(tab);
                        setMesFiltro(0);
                      }}
                      className={`px-4 py-2 rounded font-semibold transition-all ${
                        tabCarteira === tab
                          ? 'bg-blue-600 text-white'
                          : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
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
                    className="w-full px-4 py-2 rounded bg-slate-700 text-white border border-slate-600 placeholder-slate-400"
                  />
                </div>

                {/* Tabela */}
                <div className="overflow-x-auto bg-slate-800 rounded-lg border border-slate-700">
                  <table className="w-full text-sm text-left text-slate-300">
                    <thead className="bg-slate-900 border-b border-slate-700">
                      <tr>
                        <th className="px-6 py-3 font-semibold">Nome</th>
                        <th className="px-6 py-3 font-semibold">CPF/CNPJ</th>
                        <th className="px-6 py-3 font-semibold">Telefone</th>
                        <th className="px-6 py-3 font-semibold">Grupo</th>
                        <th className="px-6 py-3 font-semibold">Cota</th>
                        <th className="px-6 py-3 font-semibold">Crédito</th>
                        <th className="px-6 py-3 font-semibold">Tipo</th>
                        <th className="px-6 py-3 font-semibold">Data Venda</th>
                        <th className="px-6 py-3 font-semibold">Pagas</th>
                        <th className="px-6 py-3 font-semibold">Atraso</th>
                      </tr>
                    </thead>
                    <tbody>
                      {clientesExibicao.map((cliente) => (
                        <tr key={cliente.id} className="border-b border-slate-700 hover:bg-slate-700 transition-colors">
                          <td className="px-6 py-3 font-medium">{cliente.nome}</td>
                          <td className="px-6 py-3">{cliente.cpf_cnpj}</td>
                          <td className="px-6 py-3">{cliente.telefone}</td>
                          <td className="px-6 py-3">{cliente.grupo}</td>
                          <td className="px-6 py-3">{cliente.cota}</td>
                          <td className="px-6 py-3 font-semibold text-green-400">R$ {cliente.credito.toFixed(2)}</td>
                          <td className="px-6 py-3">
                            <span className={`px-2 py-1 rounded text-xs font-semibold ${
                              cliente.tipo_produto === 'Imóvel'
                                ? 'bg-blue-900 text-blue-200'
                                : 'bg-purple-900 text-purple-200'
                            }`}>
                              {cliente.tipo_produto}
                            </span>
                          </td>
                          <td className="px-6 py-3">{new Date(cliente.data_venda).toLocaleDateString('pt-BR')}</td>
                          <td className="px-6 py-3 text-center font-semibold text-green-400">{cliente.parcelas_pagas}</td>
                          <td className="px-6 py-3 text-center font-semibold text-orange-400">{cliente.parcelas_atraso}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <p className="text-slate-400 text-sm mt-4">Total: {clientesExibicao.length} clientes</p>
              </div>
            )}

            {/* COMISSÕES */}
            {activeModule === 'comissoes' && (
              <div>
                <h2 className="text-3xl font-bold text-white mb-6">Comissões</h2>

                {/* Abas */}
                <div className="flex gap-2 mb-6">
                  {(['recebimentos', 'projecao'] as const).map(tab => (
                    <button
                      key={tab}
                      onClick={() => setTabComissoes(tab)}
                      className={`px-4 py-2 rounded font-semibold transition-all ${
                        tabComissoes === tab
                          ? 'bg-blue-600 text-white'
                          : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                      }`}
                    >
                      {tab === 'recebimentos' && '📥 Recebimentos do Mês'}
                      {tab === 'projecao' && '📊 Projeção do Mês'}
                    </button>
                  ))}
                </div>

                {/* Recebimentos */}
                {tabComissoes === 'recebimentos' && (
                  <div className="space-y-6">
                    <div className="bg-blue-900 rounded-lg p-4 border border-blue-700">
                      <p className="text-blue-200 text-sm">
                        <strong>📅 Como funciona:</strong> Você recebe em um mês o pagamento das parcelas do mês anterior.<br/>
                        Ex: Clientes pagam parcela de <strong>setembro até 15/09</strong> → você recebe em <strong>outubro</strong>
                      </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      <div className="bg-slate-800 rounded-lg p-6 border border-slate-600 opacity-75">
                        <p className="text-slate-400 text-sm font-semibold">JULHO 2026</p>
                        <p className="text-2xl font-bold text-slate-400 mt-2">R$ 4.537,75</p>
                        <p className="text-slate-500 text-xs mt-2">✅ Recebido</p>
                      </div>
                      <div className="bg-slate-800 rounded-lg p-6 border border-slate-600 opacity-75">
                        <p className="text-slate-400 text-sm font-semibold">AGOSTO 2026</p>
                        <p className="text-2xl font-bold text-slate-400 mt-2">R$ 5.374,08</p>
                        <p className="text-slate-500 text-xs mt-2">✅ Recebido</p>
                      </div>
                      <div className="bg-slate-800 rounded-lg p-6 border-2 border-green-700">
                        <p className="text-green-300 text-sm font-semibold">SETEMBRO 2026</p>
                        <p className="text-3xl font-bold text-green-400 mt-2">R$ 7.374,40</p>
                        <p className="text-green-400 text-xs mt-2">✅ Recebido</p>
                      </div>
                      <div className="bg-slate-800 rounded-lg p-6 border-2 border-yellow-600">
                        <p className="text-yellow-300 text-sm font-semibold">🔮 OUTUBRO (PROJEÇÃO)</p>
                        <p className="text-slate-400 text-xs mb-2">Referente a setembro</p>
                        {projecaoOutubro && (
                          <>
                            <p className="text-3xl font-bold text-yellow-400 mt-2">R$ {projecaoOutubro.projecao_total.toFixed(2)}</p>
                            <p className="text-slate-400 text-xs mt-2">Se todos pagarem até 15/09</p>
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
                <h2 className="text-3xl font-bold text-white mb-6">Alertas de Atraso</h2>
                <div className="grid gap-4">
                  {alertas.length > 0 ? (
                    alertas.map((alerta, idx) => (
                      <div key={idx} className="bg-orange-900 border border-orange-700 rounded-lg p-4">
                        <p className="font-semibold text-white">{alerta.cliente}</p>
                        <p className="text-orange-200 text-sm">{alerta.cpf_cnpj}</p>
                      </div>
                    ))
                  ) : (
                    <p className="text-slate-400">Nenhum alerta ativo</p>
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

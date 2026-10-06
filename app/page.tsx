'use client';

import { useEffect, useState } from 'react';

// Módulos do CRM Ademicon
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
  // Módulo Recebimentos: Rastreamento de comissões mensais recebidas
  const [activeModule, setActiveModule] = useState<Module>('dashboard');
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [alertas, setAlertas] = useState<Alerta[]>([]);
  const [calendario, setCalendario] = useState<Parcela[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const [filterTipo, setFilterTipo] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterAtrasoMin, setFilterAtrasoMin] = useState(0);
  const [showWhatsAppModal, setShowWhatsAppModal] = useState(false);
  const [whatsappText, setWhatsappText] = useState('');
  const [whatsappFile, setWhatsappFile] = useState<string | null>(null);
  const [selectedAlerts, setSelectedAlerts] = useState<string[]>([]);
  const [mesSelecionado, setMesSelecionado] = useState(new Date().getMonth() + 1);
  const [anoSelecionado, setAnoSelecionado] = useState(new Date().getFullYear());
  const [abaComissoes, setAbaComissoes] = useState<'clientes' | 'recebimentos' | 'projecao' | 'novos-clientes'>('clientes');

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

  const filtrarAlertas = () => {
    let filtered = alertas;
    if (filterTipo) filtered = filtered.filter(a => a.tipo_produto === filterTipo);
    if (filterAtrasoMin > 0) filtered = filtered.filter(a => a.valor_atraso >= filterAtrasoMin);
    if (searchTerm) {
      filtered = filtered.filter(a =>
        a.cliente.toLowerCase().includes(searchTerm.toLowerCase()) ||
        a.cpf_cnpj.includes(searchTerm)
      );
    }
    return filtered;
  };

  const enviarWhatsApp = (cliente: Alerta) => {
    const mensagem = whatsappText || `Olá ${cliente.cliente},\n\nIdentificamos ${cliente.parcelas_atrasadas} parcela(s) atrasada(s) em sua conta, no valor de R$ ${cliente.valor_atraso.toFixed(2)}.\n\nPor favor, procure regularizar o pagamento para não prejudicar suas comissões.\n\nAtenciosamente,\nAdemicom`;

    const numeroWhatsApp = cliente.cpf_cnpj.replace(/\D/g, '').slice(-11);
    const textoEncodado = encodeURIComponent(mensagem);
    const linkWhatsApp = `https://wa.me/55${numeroWhatsApp}?text=${textoEncodado}`;

    window.open(linkWhatsApp, '_blank');
  };

  const enviarMultiposWhatsApp = () => {
    const alertasSelecionados = filtrarAlertas().filter(a => selectedAlerts.includes(a.cpf_cnpj));
    alertasSelecionados.forEach(alerta => enviarWhatsApp(alerta));
    setShowWhatsAppModal(false);
    setSelectedAlerts([]);
  };

  const calcularRecebimentosMes = () => {
    const parcelasDoMes = calendario.filter(p => p.mes === mesSelecionado && p.ano === anoSelecionado);
    const totalEsperado = parcelasDoMes.reduce((acc, p) => acc + p.valor_comissao, 0);
    const totalRecebido = parcelasDoMes.filter(p => p.status === 'recebida').reduce((acc, p) => acc + p.valor_comissao, 0);
    const parcelasRecebidas = parcelasDoMes.filter(p => p.status === 'recebida');
    const percentualRecebido = totalEsperado > 0 ? (totalRecebido / totalEsperado * 100) : 0;

    return {
      parcelasDoMes,
      totalEsperado,
      totalRecebido,
      diferenca: totalEsperado - totalRecebido,
      percentualRecebido,
      parcelasRecebidas,
      parcelasAtrasadas: parcelasDoMes.filter(p => p.status === 'atrasada'),
    };
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
          <span style={{ marginLeft: 'auto', fontSize: '12px', color: '#94a3b8', background: 'rgba(16,185,129,0.1)', padding: '6px 12px', borderRadius: '6px' }}>v3.1 - Com Recebimentos</span>
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
        <div>
          <TableCard title={`Clientes com Atraso - Filtros`}>
            <div style={{ display: 'flex', gap: '12px', marginBottom: '16px', flexWrap: 'wrap' }}>
              <select
                value={filterTipo}
                onChange={e => { setFilterTipo(e.target.value); setCurrentPage(1); }}
                style={{ padding: '10px 12px', background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '8px', color: '#fff', fontSize: '13px' }}
              >
                <option value="">Todos os tipos</option>
                <option value="Imóvel">Imóvel (vence 15º)</option>
                <option value="Veicular">Veicular (vence 7º)</option>
              </select>

              <select
                value={filterAtrasoMin}
                onChange={e => { setFilterAtrasoMin(Number(e.target.value)); setCurrentPage(1); }}
                style={{ padding: '10px 12px', background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '8px', color: '#fff', fontSize: '13px' }}
              >
                <option value="0">Todos os atrasos</option>
                <option value="1000">Atraso {`>`} R$ 1k</option>
                <option value="2000">Atraso {`>`} R$ 2k</option>
                <option value="5000">Atraso {`>`} R$ 5k</option>
              </select>

              <input
                type="text"
                placeholder="Buscar cliente..."
                value={searchTerm}
                onChange={e => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                style={{ flex: 1, padding: '10px 12px', background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '8px', color: '#fff', fontSize: '13px' }}
              />

              <button
                onClick={() => { setFilterTipo(''); setFilterAtrasoMin(0); setSearchTerm(''); setCurrentPage(1); }}
                style={{ padding: '10px 16px', background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '8px', color: '#cbd5e1', fontSize: '13px', cursor: 'pointer' }}
              >
                Limpar Filtros
              </button>

              {filtrarAlertas().length > 0 && (
                <button
                  onClick={() => setShowWhatsAppModal(true)}
                  style={{ padding: '10px 16px', background: 'linear-gradient(135deg, #25D366 0%, #20BA58 100%)', border: 'none', borderRadius: '8px', color: '#fff', fontSize: '13px', cursor: 'pointer', fontWeight: '600' }}
                >
                  💬 Enviar WhatsApp
                </button>
              )}
            </div>
          </TableCard>

          {/* Modal WhatsApp */}
          {showWhatsAppModal && (
            <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }}>
              <div style={{ background: '#1e293b', borderRadius: '12px', padding: '24px', maxWidth: '600px', width: '100%', border: '1px solid rgba(255,255,255,0.2)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                  <h2 style={{ margin: '0', color: '#f1f5f9', fontSize: '18px' }}>💬 Enviar Mensagem WhatsApp</h2>
                  <button
                    onClick={() => setShowWhatsAppModal(false)}
                    style={{ background: 'none', border: 'none', color: '#cbd5e1', fontSize: '24px', cursor: 'pointer' }}
                  >
                    ✕
                  </button>
                </div>

                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', fontSize: '12px', color: '#cbd5e1', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    Selecionar Clientes
                  </label>
                  <div style={{ maxHeight: '200px', overflowY: 'auto', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', padding: '12px' }}>
                    {filtrarAlertas().map((a) => (
                      <label key={a.cpf_cnpj} style={{ display: 'flex', alignItems: 'center', padding: '8px 0', color: '#f1f5f9', cursor: 'pointer' }}>
                        <input
                          type="checkbox"
                          checked={selectedAlerts.includes(a.cpf_cnpj)}
                          onChange={e => {
                            if (e.target.checked) {
                              setSelectedAlerts([...selectedAlerts, a.cpf_cnpj]);
                            } else {
                              setSelectedAlerts(selectedAlerts.filter(c => c !== a.cpf_cnpj));
                            }
                          }}
                          style={{ marginRight: '8px', cursor: 'pointer' }}
                        />
                        {a.cliente} • -R$ {(a.valor_atraso / 1000).toFixed(1)}k
                      </label>
                    ))}
                  </div>
                </div>

                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', fontSize: '12px', color: '#cbd5e1', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    Editar Mensagem
                  </label>
                  <textarea
                    value={whatsappText}
                    onChange={e => setWhatsappText(e.target.value)}
                    placeholder="Olá {cliente}...&#10;&#10;Deixe em branco para usar mensagem padrão"
                    style={{ width: '100%', height: '120px', padding: '12px', background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '8px', color: '#fff', fontSize: '13px', fontFamily: 'monospace', boxSizing: 'border-box', resize: 'vertical' }}
                  />
                  <p style={{ margin: '8px 0 0 0', fontSize: '11px', color: '#94a3b8' }}>
                    💡 Deixe em branco para usar mensagem padrão
                  </p>
                </div>

                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', fontSize: '12px', color: '#cbd5e1', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    Anexar Documento (URL)
                  </label>
                  <input
                    type="text"
                    placeholder="https://..."
                    value={whatsappFile || ''}
                    onChange={e => setWhatsappFile(e.target.value)}
                    style={{ width: '100%', padding: '10px 12px', background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '8px', color: '#fff', fontSize: '13px', boxSizing: 'border-box' }}
                  />
                  <p style={{ margin: '8px 0 0 0', fontSize: '11px', color: '#94a3b8' }}>
                    📎 Cole um link para anexar (Google Drive, Dropbox, etc)
                  </p>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <button
                    onClick={() => setShowWhatsAppModal(false)}
                    style={{ padding: '12px', background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '8px', color: '#cbd5e1', fontSize: '13px', cursor: 'pointer', fontWeight: '500' }}
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={enviarMultiposWhatsApp}
                    disabled={selectedAlerts.length === 0}
                    style={{ padding: '12px', background: selectedAlerts.length > 0 ? 'linear-gradient(135deg, #25D366 0%, #20BA58 100%)' : 'rgba(255,255,255,0.05)', border: 'none', borderRadius: '8px', color: '#fff', fontSize: '13px', cursor: selectedAlerts.length > 0 ? 'pointer' : 'not-allowed', fontWeight: '600', opacity: selectedAlerts.length > 0 ? 1 : 0.5 }}
                  >
                    💬 Enviar {selectedAlerts.length > 0 ? `(${selectedAlerts.length})` : ''}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Cards de Alertas */}
          {filtrarAlertas().length === 0 ? (
            <TableCard title="Alertas">
              <p style={{ color: '#10b981', textAlign: 'center', padding: '40px 0', fontSize: '16px', fontWeight: '600' }}>
                ✅ Nenhum cliente com atraso nestes filtros
              </p>
            </TableCard>
          ) : (
            <div style={{ display: 'grid', gap: '16px' }}>
              {filtrarAlertas().map((a, i) => (
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
                        {a.tipo_produto} • {a.cpf_cnpj}
                      </p>
                    </div>
                    <button
                      onClick={() => enviarWhatsApp(a)}
                      style={{ background: 'linear-gradient(135deg, #25D366 0%, #20BA58 100%)', border: 'none', padding: '8px 12px', borderRadius: '6px', color: '#fff', fontSize: '12px', cursor: 'pointer', fontWeight: '600' }}
                    >
                      💬 WhatsApp
                    </button>
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
        </div>
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
          {/* Abas */}
          <div style={{ display: 'flex', gap: '12px', marginBottom: '24px', borderBottom: '2px solid rgba(255,255,255,0.1)' }}>
            <button
              onClick={() => setAbaComissoes('clientes')}
              style={{
                padding: '12px 20px',
                background: abaComissoes === 'clientes' ? 'linear-gradient(135deg, #10b981 0%, #06b6d4 100%)' : 'transparent',
                border: 'none',
                borderBottom: abaComissoes === 'clientes' ? '3px solid #06b6d4' : 'none',
                color: abaComissoes === 'clientes' ? '#fff' : '#cbd5e1',
                fontSize: '14px',
                fontWeight: '600',
                cursor: 'pointer',
              }}
            >
              👥 Comissões por Cliente
            </button>
            <button
              onClick={() => setAbaComissoes('recebimentos')}
              style={{
                padding: '12px 20px',
                background: abaComissoes === 'recebimentos' ? 'linear-gradient(135deg, #10b981 0%, #06b6d4 100%)' : 'transparent',
                border: 'none',
                borderBottom: abaComissoes === 'recebimentos' ? '3px solid #06b6d4' : 'none',
                color: abaComissoes === 'recebimentos' ? '#fff' : '#cbd5e1',
                fontSize: '14px',
                fontWeight: '600',
                cursor: 'pointer',
              }}
            >
              ✅ Recebimentos do Mês
            </button>
            <button
              onClick={() => setAbaComissoes('projecao')}
              style={{
                padding: '12px 20px',
                background: abaComissoes === 'projecao' ? 'linear-gradient(135deg, #10b981 0%, #06b6d4 100%)' : 'transparent',
                border: 'none',
                borderBottom: abaComissoes === 'projecao' ? '3px solid #06b6d4' : 'none',
                color: abaComissoes === 'projecao' ? '#fff' : '#cbd5e1',
                fontSize: '14px',
                fontWeight: '600',
                cursor: 'pointer',
              }}
            >
              📈 Projeção do Mês
            </button>
            <button
              onClick={() => setAbaComissoes('novos-clientes')}
              style={{
                padding: '12px 20px',
                background: abaComissoes === 'novos-clientes' ? 'linear-gradient(135deg, #10b981 0%, #06b6d4 100%)' : 'transparent',
                border: 'none',
                borderBottom: abaComissoes === 'novos-clientes' ? '3px solid #06b6d4' : 'none',
                color: abaComissoes === 'novos-clientes' ? '#fff' : '#cbd5e1',
                fontSize: '14px',
                fontWeight: '600',
                cursor: 'pointer',
              }}
            >
              ⭐ Clientes Novos
            </button>
          </div>

          {abaComissoes === 'clientes' && (
            <>
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
            </>
          )}

          {abaComissoes === 'recebimentos' && (() => {
            const recebimentos = calcularRecebimentosMes();
            const estaPerfeito = recebimentos.totalRecebido === recebimentos.totalEsperado;

            return (
              <div>
                {/* Seletor Mês/Ano */}
                <div style={{ display: 'flex', gap: '12px', marginBottom: '20px', alignItems: 'center' }}>
                  <button onClick={() => { if (mesSelecionado === 1) { setMesSelecionado(12); setAnoSelecionado(anoSelecionado - 1); } else { setMesSelecionado(mesSelecionado - 1); } }} style={{ padding: '8px 12px', background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '6px', color: '#cbd5e1', cursor: 'pointer', fontSize: '12px' }}>← Mês Anterior</button>
                  <span style={{ flex: 1, textAlign: 'center', fontSize: '16px', fontWeight: '600', color: '#f1f5f9' }}>{new Date(anoSelecionado, mesSelecionado - 1).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}</span>
                  <button onClick={() => { if (mesSelecionado === 12) { setMesSelecionado(1); setAnoSelecionado(anoSelecionado + 1); } else { setMesSelecionado(mesSelecionado + 1); } }} style={{ padding: '8px 12px', background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '6px', color: '#cbd5e1', cursor: 'pointer', fontSize: '12px' }}>Próximo Mês →</button>
                  <button onClick={() => exportToCSV(recebimentos.parcelasRecebidas, `recebimentos_${anoSelecionado}-${String(mesSelecionado).padStart(2, '0')}.csv`)} style={{ padding: '8px 12px', background: 'linear-gradient(135deg, #10b981 0%, #06b6d4 100%)', border: 'none', borderRadius: '6px', color: '#fff', cursor: 'pointer', fontSize: '12px', fontWeight: '600' }}>📥 Exportar</button>
                </div>

                {/* Cartões de Resumo */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '20px' }}>
                  <KPICard label="Total Esperado" valor={`R$ ${recebimentos.totalEsperado.toFixed(2)}`} subtexto={`${recebimentos.parcelasDoMes.length} parcelas`} />
                  <KPICard label="Total Recebido" valor={`R$ ${recebimentos.totalRecebido.toFixed(2)}`} subtexto={`${recebimentos.parcelasRecebidas.length} parcelas`} />
                  <KPICard label={estaPerfeito ? '✅ Situação' : '⚠️ Diferença'} valor={estaPerfeito ? 'PERFEITO' : `R$ ${Math.abs(recebimentos.diferenca).toFixed(2)}`} subtexto={estaPerfeito ? 'Tudo conferido!' : 'Faltando receber'} isAlert={!estaPerfeito} />
                  <KPICard label="Taxa de Recebimento" valor={`${recebimentos.percentualRecebido.toFixed(1)}%`} subtexto={`de ${recebimentos.totalEsperado.toFixed(2)}`} />
                </div>

                {recebimentos.parcelasAtrasadas.length > 0 && (
                  <div style={{ background: 'rgba(239,68,68,0.15)', border: '2px solid rgba(239,68,68,0.3)', borderRadius: '12px', padding: '16px', marginBottom: '20px' }}>
                    <p style={{ margin: '0 0 8px 0', fontSize: '14px', fontWeight: '600', color: '#ef4444' }}>⚠️ {recebimentos.parcelasAtrasadas.length} Parcela(s) Atrasada(s)</p>
                    <p style={{ margin: '0', fontSize: '12px', color: '#fca5a5' }}>Parcelas vencidas mas ainda não recebidas</p>
                  </div>
                )}

                {/* Tabela */}
                <TableCard title={`Parcelas Recebidas - ${new Date(anoSelecionado, mesSelecionado - 1).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}`}>
                  {recebimentos.parcelasRecebidas.length === 0 ? (
                    <p style={{ color: '#94a3b8', textAlign: 'center', padding: '40px 0' }}>Nenhuma parcela recebida neste mês</p>
                  ) : (
                    <div style={{ overflowX: 'auto' }}>
                      <table style={{ width: '100%', fontSize: '12px', borderCollapse: 'collapse' }}>
                        <thead>
                          <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                            <th style={{ textAlign: 'left', padding: '12px 0', color: '#cbd5e1', fontWeight: '500' }}>Cliente</th>
                            <th style={{ textAlign: 'center', padding: '12px 0', color: '#cbd5e1', fontWeight: '500' }}>Parcela</th>
                            <th style={{ textAlign: 'right', padding: '12px 0', color: '#cbd5e1', fontWeight: '500' }}>Valor</th>
                            <th style={{ textAlign: 'left', padding: '12px 0', color: '#cbd5e1', fontWeight: '500' }}>Tipo</th>
                          </tr>
                        </thead>
                        <tbody>
                          {recebimentos.parcelasRecebidas.map((p, i) => (
                            <tr key={i} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                              <td style={{ padding: '12px 0', color: '#f1f5f9' }}>{p.cliente.substring(0, 30)}</td>
                              <td style={{ padding: '12px 0', textAlign: 'center', color: '#cbd5e1' }}>{p.parcela_numero}/13</td>
                              <td style={{ padding: '12px 0', textAlign: 'right', color: '#10b981', fontWeight: '600' }}>R$ {p.valor_comissao.toFixed(2)}</td>
                              <td style={{ padding: '12px 0', color: p.tipo_produto === 'Imóvel' ? '#3b82f6' : '#a855f7', fontSize: '11px' }}>{p.tipo_produto}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}

                  <div style={{ marginTop: '20px', paddingTop: '20px', borderTop: '1px solid rgba(255,255,255,0.1)', background: 'rgba(16,185,129,0.05)', padding: '16px', borderRadius: '8px' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                      <div>
                        <p style={{ margin: '0 0 4px 0', fontSize: '11px', color: '#cbd5e1', textTransform: 'uppercase' }}>Total Recebido Neste Mês</p>
                        <p style={{ margin: '0', fontSize: '20px', fontWeight: '700', color: '#10b981' }}>R$ {recebimentos.totalRecebido.toFixed(2)}</p>
                      </div>
                      <div>
                        <p style={{ margin: '0 0 4px 0', fontSize: '11px', color: '#cbd5e1', textTransform: 'uppercase' }}>Status da Auditoria</p>
                        <p style={{ margin: '0', fontSize: '16px', fontWeight: '700', color: estaPerfeito ? '#10b981' : '#fb923c' }}>{estaPerfeito ? '✅ Confirmado' : '⏳ Aguardando'}</p>
                      </div>
                    </div>
                    <p style={{ margin: '12px 0 0 0', fontSize: '12px', color: '#94a3b8', textAlign: 'center' }}>⬆️ Compare este valor com a nota mensal da Ademicon</p>
                  </div>
                </TableCard>
              </div>
            );
          })()}

          {abaComissoes === 'projecao' && (
            <div>
              <div style={{ background: 'rgba(59, 130, 246, 0.15)', border: '2px solid rgba(59, 130, 246, 0.3)', borderRadius: '12px', padding: '16px', marginBottom: '20px' }}>
                <p style={{ margin: '0 0 8px 0', fontSize: '14px', fontWeight: '600', color: '#3b82f6' }}>📊 Projeção do Mês</p>
                <p style={{ margin: '0', fontSize: '12px', color: '#93c5fd' }}>Parcelas que devem vencer neste mês, considerando o pagamento no prazo (dia 15 imóvel, dia 7 veicular)</p>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '20px' }}>
                <KPICard label="Total da Projeção" valor={`R$ ${calendario.filter(p => p.mes === mesSelecionado && p.ano === anoSelecionado).reduce((sum, p) => sum + p.valor_comissao, 0).toFixed(2)}`} subtexto={`${calendario.filter(p => p.mes === mesSelecionado && p.ano === anoSelecionado).length} parcelas`} />
              </div>

              <TableCard title={`Parcelas Esperadas - ${new Date(anoSelecionado, mesSelecionado - 1).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}`}>
                {calendario.filter(p => p.mes === mesSelecionado && p.ano === anoSelecionado).length === 0 ? (
                  <p style={{ color: '#94a3b8', textAlign: 'center', padding: '40px 0' }}>Nenhuma parcela esperada neste mês</p>
                ) : (
                  <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', fontSize: '12px', borderCollapse: 'collapse' }}>
                      <thead>
                        <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                          <th style={{ textAlign: 'left', padding: '12px 0', color: '#cbd5e1', fontWeight: '500' }}>Cliente</th>
                          <th style={{ textAlign: 'center', padding: '12px 0', color: '#cbd5e1', fontWeight: '500' }}>Parcela</th>
                          <th style={{ textAlign: 'center', padding: '12px 0', color: '#cbd5e1', fontWeight: '500' }}>Vencimento</th>
                          <th style={{ textAlign: 'left', padding: '12px 0', color: '#cbd5e1', fontWeight: '500' }}>Tipo</th>
                          <th style={{ textAlign: 'right', padding: '12px 0', color: '#cbd5e1', fontWeight: '500' }}>Valor</th>
                        </tr>
                      </thead>
                      <tbody>
                        {calendario
                          .filter(p => p.mes === mesSelecionado && p.ano === anoSelecionado)
                          .map((p, i) => (
                            <tr key={i} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                              <td style={{ padding: '12px 0', color: '#f1f5f9' }}>{p.cliente.substring(0, 30)}</td>
                              <td style={{ padding: '12px 0', textAlign: 'center', color: '#cbd5e1' }}>{p.parcela_numero}/13</td>
                              <td style={{ padding: '12px 0', textAlign: 'center', color: '#cbd5e1' }}>{new Date(p.data_prevista).toLocaleDateString('pt-BR')}</td>
                              <td style={{ padding: '12px 0', color: p.tipo_produto === 'Imóvel' ? '#3b82f6' : '#a855f7', fontSize: '11px' }}>{p.tipo_produto}</td>
                              <td style={{ padding: '12px 0', textAlign: 'right', color: '#60a5fa', fontWeight: '600' }}>R$ {p.valor_comissao.toFixed(2)}</td>
                            </tr>
                          ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </TableCard>
            </div>
          )}

          {abaComissoes === 'novos-clientes' && (
            <div>
              <div style={{ background: 'rgba(168, 85, 247, 0.15)', border: '2px solid rgba(168, 85, 247, 0.3)', borderRadius: '12px', padding: '16px', marginBottom: '20px' }}>
                <p style={{ margin: '0 0 8px 0', fontSize: '14px', fontWeight: '600', color: '#a855f7' }}>⭐ Clientes Novos</p>
                <p style={{ margin: '0', fontSize: '12px', color: '#d8b4fe' }}>Clientes que iniciaram contratos e começam a gerar comissões neste mês</p>
              </div>

              {(() => {
                const clientesNovos = clientes.filter(c => {
                  const dataParts = c.data_venda.split('-');
                  const mesVenda = parseInt(dataParts[1]);
                  const anoVenda = parseInt(dataParts[0]);
                  return mesVenda === mesSelecionado && anoVenda === anoSelecionado;
                });

                return (
                  <TableCard title={`Clientes Novos - ${new Date(anoSelecionado, mesSelecionado - 1).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })} (${clientesNovos.length})`}>
                    {clientesNovos.length === 0 ? (
                      <p style={{ color: '#94a3b8', textAlign: 'center', padding: '40px 0' }}>Nenhum cliente novo neste mês</p>
                    ) : (
                      <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', fontSize: '12px', borderCollapse: 'collapse' }}>
                          <thead>
                            <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                              <th style={{ textAlign: 'left', padding: '12px 0', color: '#cbd5e1', fontWeight: '500' }}>Cliente</th>
                              <th style={{ textAlign: 'left', padding: '12px 0', color: '#cbd5e1', fontWeight: '500' }}>CPF/CNPJ</th>
                              <th style={{ textAlign: 'left', padding: '12px 0', color: '#cbd5e1', fontWeight: '500' }}>Tipo</th>
                              <th style={{ textAlign: 'right', padding: '12px 0', color: '#cbd5e1', fontWeight: '500' }}>Crédito</th>
                              <th style={{ textAlign: 'center', padding: '12px 0', color: '#cbd5e1', fontWeight: '500' }}>Data Venda</th>
                            </tr>
                          </thead>
                          <tbody>
                            {clientesNovos.map((c, i) => (
                              <tr key={i} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                <td style={{ padding: '12px 0', color: '#f1f5f9' }}>{c.cliente.substring(0, 30)}</td>
                                <td style={{ padding: '12px 0', color: '#cbd5e1', fontFamily: 'monospace', fontSize: '11px' }}>{c.cpf_cnpj}</td>
                                <td style={{ padding: '12px 0', color: c.tipo_produto === 'Imóvel' ? '#3b82f6' : '#a855f7', fontSize: '11px' }}>{c.tipo_produto}</td>
                                <td style={{ padding: '12px 0', color: '#10b981', textAlign: 'right', fontWeight: '600' }}>R$ {(c.valor_credito / 1000).toFixed(0)}k</td>
                                <td style={{ padding: '12px 0', color: '#cbd5e1', textAlign: 'center', fontSize: '11px' }}>{new Date(c.data_venda).toLocaleDateString('pt-BR')}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}

                    {clientesNovos.length > 0 && (
                      <div style={{ marginTop: '20px', paddingTop: '20px', borderTop: '1px solid rgba(255,255,255,0.1)', background: 'rgba(168, 85, 247, 0.05)', padding: '16px', borderRadius: '8px' }}>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                          <div>
                            <p style={{ margin: '0 0 4px 0', fontSize: '11px', color: '#cbd5e1', textTransform: 'uppercase' }}>Quantidade de Novos</p>
                            <p style={{ margin: '0', fontSize: '20px', fontWeight: '700', color: '#a855f7' }}>{clientesNovos.length}</p>
                          </div>
                          <div>
                            <p style={{ margin: '0 0 4px 0', fontSize: '11px', color: '#cbd5e1', textTransform: 'uppercase' }}>Crédito Total Novo</p>
                            <p style={{ margin: '0', fontSize: '20px', fontWeight: '700', color: '#a855f7' }}>R$ {(clientesNovos.reduce((sum, c) => sum + c.valor_credito, 0) / 1000).toFixed(0)}k</p>
                          </div>
                        </div>
                      </div>
                    )}
                  </TableCard>
                );
              })()}
            </div>
          )}
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

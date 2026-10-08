"use client";

import { useEffect, useRef, useState } from "react";

type View = "dashboard" | "carteira" | "comissoes" | "alertas" | "agenda";
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
  ultimo_pagamento?: { competencia: string; vencimento: string; status: string; parcelas_atrasadas_diluidas: number; regra_comissao: string; comissao_recebimento_previsto: string; comissao_status: string };
}
interface Mes {
  mes: number;
  ano: number;
  projecao: number;
  recebido: number | null;
  diferenca: number | null;
}
interface Parcela {
  id: string;
  cliente: string;
  mes: number;
  ano: number;
  data_vencimento: string;
  valor_comissao: number;
  status: string;
  cota?: number;
  competencia_parcela?: string;
  observacao?: string;
}
interface Projecao {
  mes: number;
  ano: number;
  projecao_total: number;
  data_calculo: string;
  clientes_elegibles: number;
}
const money = (n: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(
    n || 0,
  );
const date = (s: string) =>
  s
    ? new Date(s.slice(0, 10) + "T12:00:00").toLocaleDateString("pt-BR")
    : "Não informado";
const month = (y: number, m: number) =>
  new Date(y, m - 1, 1).toLocaleDateString("pt-BR", {
    month: "long",
    year: "numeric",
  });
const initials = (name: string) =>
  name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((n) => n[0])
    .join("");
const normalize = (s: string) =>
  s
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
const phoneUrl = (c: Cliente) => {
  const n = c.telefone.replace(/\D/g, "");
  return n.length >= 10
    ? `https://wa.me/${n.length <= 11 ? "55" : ""}${n}`
    : null;
};
const nav: { id: View; name: string; icon: string }[] = [
  { id: "dashboard", name: "Visão geral", icon: "grid" },
  { id: "carteira", name: "Minha carteira", icon: "users" },
  { id: "comissoes", name: "Comissões", icon: "wallet" },
  { id: "alertas", name: "Pendências", icon: "bell" },
  { id: "agenda", name: "Agenda de comissões", icon: "calendar" },
];
function Icon({ name, size = 20 }: { name: string; size?: number }) {
  const paths: Record<string, string> = {
    grid: "M3 3h7v7H3z M14 3h7v7h-7z M3 14h7v7H3z M14 14h7v7h-7z",
    users:
      "M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2 M16 3a4 4 0 0 1 0 8 M22 21v-2a4 4 0 0 0-3-3.87 M13 7a4 4 0 1 1-8 0 4 4 0 0 1 8 0",
    wallet: "M3 6h17v15H3z M3 6V3h15v3 M15 11h6v5h-6z",
    bell: "M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9 M10 21h4",
    calendar: "M3 5h18v16H3z M3 10h18 M7 2v6 M17 2v6 M7 14h3 M14 14h3",
    search: "M21 21l-6-6 M17 10a7 7 0 1 1-14 0 7 7 0 0 1 14 0",
    arrow: "M5 12h14 M13 6l6 6-6 6",
    download: "M12 3v12 M7 10l5 5 5-5 M4 16v5h16v-5",
    close: "M6 6l12 12 M18 6L6 18",
    refresh: "M20 7v5h-5 M4 17v-5h5 M6 6a8 8 0 0 1 14 6 M18 18a8 8 0 0 1-14-6",
    home: "M3 10l9-7 9 7v11H3z M9 21v-8h6v8",
    check: "M5 12l4 4L19 6",
  };
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d={paths[name] || paths.grid} />
    </svg>
  );
}
function Contact({ cliente }: { cliente: Cliente }) {
  const url = phoneUrl(cliente);
  return url ? (
    <a className="button small" href={url} target="_blank" rel="noreferrer">
      WhatsApp <Icon name="arrow" size={14} />
    </a>
  ) : (
    <span className="muted">Sem telefone</span>
  );
}
function exportCsv(rows: Cliente[]) {
  const columns = [
    "Nome",
    "CPF/CNPJ",
    "Telefone",
    "Produto",
    "Grupo",
    "Cota",
    "Crédito",
    "Parcela",
    "Parcelas pagas",
    "Parcelas em atraso",
    "Data da venda",
    "Situação",
  ];
  const quote = (value: unknown) => {
    let s = String(value ?? "");
    if (/^[=+@\-\t\r]/.test(s)) s = "'" + s;
    return '"' + s.replaceAll('"', '""') + '"';
  };
  const data = rows.map((c) => [
    c.nome,
    c.cpf_cnpj,
    c.telefone,
    c.tipo_produto,
    c.grupo,
    c.cota,
    c.credito.toFixed(2).replace(".", ","),
    c.valor_parcela.toFixed(2).replace(".", ","),
    c.parcelas_pagas,
    c.parcelas_atraso,
    date(c.data_venda),
    c.situacao,
  ]);
  const url = URL.createObjectURL(
    new Blob(
      [
        "\uFEFF" +
          [columns, ...data].map((r) => r.map(quote).join(";")).join("\r\n"),
      ],
      { type: "text/csv;charset=utf-8;" },
    ),
  );
  const link = document.createElement("a");
  link.href = url;
  link.download = "carteira-clientes.csv";
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
export default function Home() {
  const [view, setView] = useState<View>("dashboard");
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [meses, setMeses] = useState<Mes[]>([]);
  const [agenda, setAgenda] = useState<Parcela[]>([]);
  const [projecao, setProjecao] = useState<Projecao | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [product, setProduct] = useState("");
  const [status, setStatus] = useState("");
  const [period, setPeriod] = useState("");
  const [sort, setSort] = useState("nome");
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<Cliente | null>(null);
  const [agendaPeriod, setAgendaPeriod] = useState("");
  const dialog = useRef<HTMLDialogElement>(null);
  async function load() {
    setLoading(true);
    setError("");
    try {
      const files = [
        "clientes_novos",
        "analise_corrigida",
        "calendario_comissoes",
        "projecao_outubro",
      ];
      const data = await Promise.all(
        files.map(async (f) => {
          const res = await fetch("/" + f + ".json?v=restaurado-20261008", { cache: "no-store" });
          if (!res.ok) throw Error();
          return res.json();
        }),
      );
      if (
        !Array.isArray(data[0]) ||
        !Array.isArray(data[1].meses) ||
        !Array.isArray(data[2])
      )
        throw Error();
      setClientes(data[0]);
      setMeses(data[1].meses);
      setAgenda(data[2]);
      setProjecao(data[3]);
    } catch {
      setError(
        "Não foi possível atualizar os relatórios. Confira sua conexão e tente novamente.",
      );
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => {
    void load();
  }, []);
  useEffect(() => {
    if (selected) dialog.current?.showModal();
    else dialog.current?.close();
  }, [selected]);
  function navigate(next: View) {
    setView(next);
    setPage(1);
  }
  const overdue = clientes
    .filter((c) => c.parcelas_atraso > 0)
    .sort((a, b) => b.parcelas_atraso - a.parcelas_atraso);
  const total = clientes.reduce((a, c) => a + c.credito, 0);
  const unique = new Set(clientes.map((c) => c.cpf_cnpj || c.nome)).size;
  const received = meses.reduce((a, m) => a + (m.recebido ?? 0), 0);
  const closed = meses.filter((m) => m.recebido !== null);
  const filtered = clientes
    .filter(
      (c) =>
        normalize(
          [
            c.nome,
            c.cpf_cnpj,
            c.telefone,
            c.grupo,
            c.cota,
            c.num_contrato,
          ].join(" "),
        ).includes(normalize(query)) &&
        (!product || c.tipo_produto === product) &&
        (!period || c.data_venda.startsWith(period)) &&
        (!status ||
          (status === "atraso"
            ? c.parcelas_atraso > 0
            : c.parcelas_atraso === 0)),
    )
    .sort((a, b) =>
      sort === "credito"
        ? b.credito - a.credito
        : sort === "atraso"
          ? b.parcelas_atraso - a.parcelas_atraso
          : sort === "recentes"
            ? b.data_venda.localeCompare(a.data_venda)
            : a.nome.localeCompare(b.nome, "pt-BR"),
    );
  const pages = Math.max(1, Math.ceil(filtered.length / 12));
  const currentPage = Math.min(page, pages);
  const visible = filtered.slice((currentPage - 1) * 12, currentPage * 12);
  const products = [...new Set(clientes.map((c) => c.tipo_produto))];
  const periods = [...new Set(clientes.map((c) => c.data_venda.slice(0, 7)))]
    .sort()
    .reverse();
  const agendaPeriods = [
    ...new Set(agenda.map((p) => `${p.ano}-${String(p.mes).padStart(2, "0")}`)),
  ]
    .sort()
    .reverse();
  const agendaRows = agenda.filter(
    (p) =>
      !agendaPeriod ||
      `${p.ano}-${String(p.mes).padStart(2, "0")}` === agendaPeriod,
  );
  const clear = () => {
    setQuery("");
    setProduct("");
    setStatus("");
    setPeriod("");
    setPage(1);
  };
  const openPending = () => {
    clear();
    setStatus("atraso");
    navigate("carteira");
  };
  function rows(list: Cliente[]) {
    return list.map((c) => (
      <tr key={c.id}>
        <td>
          <button className="client-name" onClick={() => setSelected(c)}>
            <span className="avatar">{initials(c.nome)}</span>
            <span>
              <strong>{c.nome}</strong>
              <small>
                Grupo {c.grupo} · Cota {c.cota}
              </small>
            </span>
          </button>
        </td>
        <td>
          <span className="tag">{c.tipo_produto}</span>
        </td>
        <td className="numeric">{money(c.credito)}</td>
        <td>
          <span
            className={"badge " + (c.parcelas_atraso ? "danger" : "neutral")}
          >
            {c.parcelas_atraso
              ? `${c.parcelas_atraso} em atraso`
              : "Sem atraso"}
          </span>
        </td>
        <td>{date(c.data_venda)}</td>
        <td>
          <button
            className="icon-button"
            aria-label={"Ver ficha de " + c.nome}
            onClick={() => setSelected(c)}
          >
            <Icon name="arrow" size={18} />
          </button>
        </td>
      </tr>
    ));
  }
  const table = (list: Cliente[]) => (
    <div className="table-scroll">
      <table>
        <thead>
          <tr>
            <th>Cliente / contrato</th>
            <th>Produto</th>
            <th>Crédito contratado</th>
            <th>Pagamento</th>
            <th>Data da venda</th>
            <th>
              <span className="sr-only">Detalhes</span>
            </th>
          </tr>
        </thead>
        <tbody>{rows(list)}</tbody>
      </table>
      {!list.length && (
        <div className="empty">
          <Icon name="search" size={30} />
          <h3>Nenhum cliente encontrado</h3>
          <p>Experimente outro nome ou ajuste os filtros.</p>
          <button className="button" onClick={clear}>
            Limpar filtros
          </button>
        </div>
      )}
    </div>
  );
  return (
    <div className="app-shell">
      <aside className="sidebar">
        <a className="brand" href="/" aria-label="Início">
          <span className="brand-mark">
            A<span>.</span>
          </span>
          <span>
            ADEMICON<small>GESTÃO DE CARTEIRA</small>
          </span>
        </a>
        <div className="workspace-label">ESPAÇO DO CONSULTOR</div>
        <nav aria-label="Navegação principal">
          {nav.map((n) => (
            <button
              key={n.id}
              onClick={() => navigate(n.id)}
              className={view === n.id ? "nav-item active" : "nav-item"}
              aria-current={view === n.id ? "page" : undefined}
            >
              <Icon name={n.icon} />
              <span>{n.name}</span>
              {n.id === "alertas" && overdue.length > 0 && (
                <b>{overdue.length}</b>
              )}
            </button>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <div className="gold-line" />
          <p>
            Relacionamentos que
            <br />
            <strong>constroem patrimônio.</strong>
          </p>
          <div className="profile">
            <span className="profile-avatar">B</span>
            <div>
              <strong>Equipe Bauer</strong>
              <small>Gestão comercial</small>
            </div>
          </div>
        </div>
      </aside>
      <div className="main-shell">
        <header className="topbar">
          <div className="breadcrumb">
            Meu espaço <span>/</span>{" "}
            <strong>{nav.find((n) => n.id === view)?.name}</strong>
          </div>
          <div className="top-actions">
            <span className="source-label">
              <i /> Relatórios importados
            </span>
            <button
              className="icon-button"
              onClick={() => void load()}
              disabled={loading}
              aria-label="Atualizar relatórios"
            >
              <Icon name="refresh" />
            </button>
            <span className="top-avatar">B</span>
          </div>
        </header>
        <main id="main">
          <div className="page-heading">
            <div>
              <div className="eyebrow">CARTEIRA DE CLIENTES</div>
              <h1>{nav.find((n) => n.id === view)?.name}</h1>
              <p>
                {view === "dashboard"
                  ? "Clareza nos números. Foco no próximo passo."
                  : view === "carteira"
                    ? "Cada relacionamento, cada contrato, em um só lugar."
                    : view === "comissoes"
                      ? "Acompanhe recebimentos e consulte suas estimativas."
                      : view === "alertas"
                        ? "Priorize os contatos que precisam da sua atenção."
                        : "Consulte as parcelas registradas nos seus relatórios."}
              </p>
            </div>
            <button
              className="button"
              disabled={loading || !clientes.length}
              onClick={() =>
                exportCsv(view === "carteira" ? filtered : clientes)
              }
            >
              <Icon name="download" size={17} /> Exportar carteira
            </button>
          </div>
          {error && (
            <div className="error" role="alert">
              {error}{" "}
              <button onClick={() => void load()}>Tentar novamente</button>
            </div>
          )}
          {loading ? (
            <div className="loading" role="status">
              <span className="spinner" /> Carregando sua carteira...
            </div>
          ) : !clientes.length && error ? null : (
            <>
              {view === "dashboard" && (
                <>
                  <section className="hero">
                    <div>
                      <span className="hero-kicker">
                        SEU PATRIMÔNIO EM RELACIONAMENTOS
                      </span>
                      <h2>
                        Uma visão completa.
                        <br />
                        <em>Mais espaço para crescer.</em>
                      </h2>
                      <p>
                        Acompanhe sua carteira e transforme informação em ação.
                      </p>
                      <button
                        className="button primary"
                        onClick={() => {
                          clear();
                          navigate("carteira");
                        }}
                      >
                        Explorar minha carteira <Icon name="arrow" size={17} />
                      </button>
                    </div>
                    <div className="hero-value">
                      <span>CRÉDITO TOTAL CONTRATADO</span>
                      <strong>{money(total)}</strong>
                      <small>
                        {clientes.length} contratos · {unique} clientes na base
                      </small>
                      <div className="hero-art" aria-hidden="true">
                        <i />
                        <i />
                        <i />
                        <i />
                        <i />
                        <i />
                        <i />
                      </div>
                    </div>
                  </section>
                  <section className="stats">
                    <div className="stat">
                      <div className="stat-label">
                        Clientes na carteira <Icon name="users" />
                      </div>
                      <strong>{unique}</strong>
                      <small>{clientes.length} contratos registrados</small>
                    </div>
                    <div className="stat">
                      <div className="stat-label">
                        Recebimentos confirmados <Icon name="wallet" />
                      </div>
                      <strong>{money(received)}</strong>
                      <small>
                        {closed.length} meses com valores informados
                      </small>
                    </div>
                    <button className="stat stat-button" onClick={openPending}>
                      <div className="stat-label">
                        Contratos com atraso <Icon name="bell" />
                      </div>
                      <strong className="red">
                        {overdue.length}
                        <span className="stat-unit"> / {clientes.length}</span>
                      </strong>
                      <small>Ver contratos que precisam de atenção →</small>
                    </button>
                    <div className="stat">
                      <div className="stat-label">
                        Estimativa importada <Icon name="calendar" />
                      </div>
                      <strong>
                        {projecao
                          ? money(projecao.projecao_total)
                          : "Não disponível"}
                      </strong>
                      <small>
                        {projecao
                          ? month(projecao.ano, projecao.mes)
                          : "Sem período informado"}{" "}
                        · não confirmada
                      </small>
                    </div>
                  </section>
                  <div className="dashboard-grid">
                    <section className="panel">
                      <div className="panel-heading">
                        <div>
                          <h2>Evolução dos recebimentos</h2>
                          <p>Valores confirmados por mês</p>
                        </div>
                        <span className="legend">
                          <i /> Recebido
                        </span>
                      </div>
                      <div className="bar-chart">
                        {closed.map((m) => (
                          <div className="bar-column" key={m.ano + "-" + m.mes}>
                            <strong>{money(m.recebido || 0)}</strong>
                            <div className="bar-space">
                              <div
                                style={{
                                  height: `${Math.max(3, ((m.recebido || 0) / Math.max(1, ...closed.map((m) => m.recebido || 0))) * 100)}%`,
                                }}
                              />
                            </div>
                            <span>{month(m.ano, m.mes)}</span>
                          </div>
                        ))}
                      </div>
                    </section>
                    <section className="panel priority">
                      <div className="panel-heading">
                        <div>
                          <span className="eyebrow">PRÓXIMA AÇÃO</span>
                          <h2>Atenção à carteira</h2>
                        </div>
                        <span className="round-icon">
                          <Icon name="bell" />
                        </span>
                      </div>
                      <strong className="priority-number">
                        {overdue.length.toString().padStart(2, "0")}
                      </strong>
                      <p>contratos com parcelas em atraso no relatório.</p>
                      <div className="priority-summary">
                        <span>Parcelas pendentes</span>
                        <strong>
                          {overdue.reduce((s, c) => s + c.parcelas_atraso, 0)}
                        </strong>
                      </div>
                      <button
                        className="button primary full"
                        onClick={() => navigate("alertas")}
                      >
                        Organizar meus contatos <Icon name="arrow" size={17} />
                      </button>
                    </section>
                  </div>
                  <div className="dashboard-grid lower">
                    <section className="panel">
                      <div className="panel-heading">
                        <div>
                          <h2>Últimas vendas</h2>
                          <p>Os contratos mais recentes da sua base</p>
                        </div>
                        <button
                          className="text-button"
                          onClick={() => {
                            clear();
                            setSort("recentes");
                            navigate("carteira");
                          }}
                        >
                          Ver todos <Icon name="arrow" size={15} />
                        </button>
                      </div>
                      {table(
                        [...clientes]
                          .sort((a, b) =>
                            b.data_venda.localeCompare(a.data_venda),
                          )
                          .slice(0, 5),
                      )}
                    </section>
                    <section className="panel">
                      <div className="panel-heading">
                        <div>
                          <h2>Perfil da carteira</h2>
                          <p>Distribuição do crédito por produto</p>
                        </div>
                      </div>
                      <div className="product-list">
                        {products.map((p) => {
                          const credit = clientes
                            .filter((c) => c.tipo_produto === p)
                            .reduce((s, c) => s + c.credito, 0);
                          const percent = total ? (credit / total) * 100 : 0;
                          return (
                            <div key={p}>
                              <div>
                                <span>
                                  <Icon name="home" size={17} />
                                  {p}
                                </span>
                                <strong>{percent.toFixed(1)}%</strong>
                              </div>
                              <div className="progress">
                                <i style={{ width: `${percent}%` }} />
                              </div>
                              <small>{money(credit)}</small>
                            </div>
                          );
                        })}
                      </div>
                    </section>
                  </div>
                </>
              )}
              {view === "carteira" && (
                <section className="panel">
                  <div className="filters">
                    <label className="search-box">
                      <Icon name="search" size={18} />
                      <input
                        aria-label="Buscar cliente"
                        placeholder="Nome, CPF, telefone, grupo ou contrato"
                        value={query}
                        onChange={(e) => {
                          setQuery(e.target.value);
                          setPage(1);
                        }}
                      />
                    </label>
                    <div className="filter-grid">
                      <label>
                        Produto
                        <select
                          value={product}
                          onChange={(e) => {
                            setProduct(e.target.value);
                            setPage(1);
                          }}
                        >
                          <option value="">Todos os produtos</option>
                          {products.map((p) => (
                            <option key={p}>{p}</option>
                          ))}
                        </select>
                      </label>
                      <label>
                        Pagamento
                        <select
                          value={status}
                          onChange={(e) => {
                            setStatus(e.target.value);
                            setPage(1);
                          }}
                        >
                          <option value="">Todos os pagamentos</option>
                          <option value="atraso">Com atraso</option>
                          <option value="em-dia">Sem atraso</option>
                        </select>
                      </label>
                      <label>
                        Mês da venda
                        <select
                          value={period}
                          onChange={(e) => {
                            setPeriod(e.target.value);
                            setPage(1);
                          }}
                        >
                          <option value="">Todos os períodos</option>
                          {periods.map((p) => (
                            <option key={p} value={p}>
                              {month(Number(p.slice(0, 4)), Number(p.slice(5)))}
                            </option>
                          ))}
                        </select>
                      </label>
                      <label>
                        Ordenar por
                        <select
                          value={sort}
                          onChange={(e) => {
                            setSort(e.target.value);
                            setPage(1);
                          }}
                        >
                          <option value="nome">Nome do cliente</option>
                          <option value="recentes">Vendas mais recentes</option>
                          <option value="credito">Maior crédito</option>
                          <option value="atraso">
                            Mais parcelas em atraso
                          </option>
                        </select>
                      </label>
                    </div>
                    <div className="filter-summary">
                      <span>
                        <strong>{filtered.length}</strong> contratos ·{" "}
                        {money(filtered.reduce((s, c) => s + c.credito, 0))} em
                        crédito
                      </span>
                      <button className="text-button" onClick={clear}>
                        Limpar filtros
                      </button>
                    </div>
                  </div>
                  {table(visible)}
                  <div className="pagination">
                    <span>
                      Página {currentPage} de {pages}
                    </span>
                    <div>
                      <button
                        className="button small"
                        disabled={currentPage === 1}
                        onClick={() => setPage(currentPage - 1)}
                      >
                        Anterior
                      </button>
                      <button
                        className="button small"
                        disabled={currentPage === pages}
                        onClick={() => setPage(currentPage + 1)}
                      >
                        Próxima
                      </button>
                    </div>
                  </div>
                </section>
              )}
              {view === "comissoes" && (
                <>
                  <div className="commission-summary">
                    <section className="panel financial">
                      <span className="eyebrow">
                        TOTAL CONFIRMADO NOS RELATÓRIOS
                      </span>
                      <strong>{money(received)}</strong>
                      <p>
                        {closed.map((m) => month(m.ano, m.mes)).join(" · ")}
                      </p>
                    </section>
                    <section className="panel financial gold">
                      <span className="eyebrow">
                        ESTIMATIVA IMPORTADA ·{" "}
                        {projecao && month(projecao.ano, projecao.mes)}
                      </span>
                      <strong>{money(projecao?.projecao_total || 0)}</strong>
                      <p>
                        Calculada em {projecao && date(projecao.data_calculo)}.
                        Sujeita à confirmação dos pagamentos.
                      </p>
                    </section>
                  </div>
                  <section className="panel">
                    <div className="panel-heading">
                      <div>
                        <h2>Histórico e projeções</h2>
                        <p>Valores preservados do relatório de análise</p>
                      </div>
                    </div>
                    <div className="table-scroll">
                      <table>
                        <thead>
                          <tr>
                            <th>Competência</th>
                            <th>Projeção do relatório</th>
                            <th>Recebido</th>
                            <th>Diferença</th>
                            <th>Situação</th>
                          </tr>
                        </thead>
                        <tbody>
                          {meses.map((m) => (
                            <tr key={m.ano + "-" + m.mes}>
                              <td className="capitalize">
                                {month(m.ano, m.mes)}
                              </td>
                              <td>{money(m.projecao)}</td>
                              <td className="numeric">
                                {m.recebido === null
                                  ? "Não confirmado"
                                  : money(m.recebido)}
                              </td>
                              <td
                                className={(m.diferenca || 0) < 0 ? "red" : ""}
                              >
                                {m.diferenca === null
                                  ? "Não disponível"
                                  : money(m.diferenca)}
                              </td>
                              <td>
                                <span
                                  className={
                                    "badge " +
                                    (m.recebido === null
                                      ? "gold-badge"
                                      : "neutral")
                                  }
                                >
                                  {m.recebido === null
                                    ? "Estimativa"
                                    : "Confirmado"}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </section>
                  <div className="info-note">
                    Os arquivos de projeção usam bases diferentes e podem
                    apresentar valores distintos para o mesmo mês. A estimativa
                    destacada vem do arquivo de outubro; a tabela preserva a
                    análise histórica. Nenhum valor estimado é tratado como
                    recebido.
                  </div>
                </>
              )}
              {view === "alertas" && (
                <>
                  <div className="info-note">
                    Prioridade por quantidade de parcelas em atraso. Confirme a
                    situação atual antes de entrar em contato com o cliente.
                  </div>
                  <section className="panel">
                    <div className="panel-heading">
                      <div>
                        <h2>Fila de acompanhamento</h2>
                        <p>{overdue.length} contratos para verificar</p>
                      </div>
                      <span className="badge danger">Atenção</span>
                    </div>
                    {overdue.length ? (
                      overdue.map((c) => (
                        <div className="pending-row" key={c.id}>
                          <span className="avatar">{initials(c.nome)}</span>
                          <div className="pending-info">
                            <button
                              className="text-button"
                              onClick={() => setSelected(c)}
                            >
                              {c.nome}
                            </button>
                            <small>
                              {c.tipo_produto} · Grupo {c.grupo} · Cota {c.cota}
                            </small>
                          </div>
                          <span className="badge danger">
                            {c.parcelas_atraso} parcela
                            {c.parcelas_atraso !== 1 ? "s" : ""} em atraso
                          </span>
                          <Contact cliente={c} />
                        </div>
                      ))
                    ) : (
                      <div className="empty">
                        <Icon name="check" />
                        <h3>Nenhuma pendência no relatório</h3>
                      </div>
                    )}
                  </section>
                </>
              )}
              {view === "agenda" && (
                <section className="panel">
                  <div className="panel-heading">
                    <div>
                      <h2>Parcelas de comissão</h2>
                      <p>
                        {agendaRows.length} registros ·{" "}
                        {money(
                          agendaRows.reduce((s, p) => s + p.valor_comissao, 0),
                        )}
                      </p>
                    </div>
                    <label className="agenda-filter">
                      Competência
                      <select
                        value={agendaPeriod}
                        onChange={(e) => setAgendaPeriod(e.target.value)}
                      >
                        <option value="">Todos os períodos</option>
                        {agendaPeriods.map((p) => (
                          <option key={p} value={p}>
                            {month(Number(p.slice(0, 4)), Number(p.slice(5)))}
                          </option>
                        ))}
                      </select>
                    </label>
                  </div>
                  <div className="table-scroll">
                    <table>
                      <thead>
                        <tr>
                          <th>Cliente</th>
                          <th>Parcela de origem</th>
                          <th>Data registrada</th>
                          <th>Competência</th>
                          <th>Comissão</th>
                          <th>Status do relatório</th>
                        </tr>
                      </thead>
                      <tbody>
                        {agendaRows.map((p, i) => (
                          <tr key={p.id || i}>
                            <td className="numeric">{p.cliente}{p.cota && <small style={{display: "block", fontWeight: 400}}>Cota {p.cota}</small>}</td>
                            <td>{p.competencia_parcela ? month(Number(p.competencia_parcela.slice(0,4)), Number(p.competencia_parcela.slice(5))) : "Relatório importado"}</td>
                            <td>{date(p.data_vencimento)}</td>
                            <td className="capitalize">
                              {month(p.ano, p.mes)}
                            </td>
                            <td>{money(p.valor_comissao)}</td>
                            <td>
                              <span className={"badge " + (p.status === "prevista" ? "gold-badge" : "neutral")} title={p.observacao}>{p.status}</span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {!agendaRows.length && (
                      <div className="empty">
                        Nenhuma parcela neste período.
                      </div>
                    )}
                  </div>
                </section>
              )}
              <footer className="footer">
                <span>
                  BAUER <span className="footer-dot">/</span> Gestão de carteira
                </span>
                <span>
                  Dados dos relatórios importados. Sem sincronização automática
                  com a Ademicon.
                </span>
              </footer>
            </>
          )}
        </main>
      </div>
      <dialog
        ref={dialog}
        aria-label="Ficha do cliente"
        onCancel={() => setSelected(null)}
        onClose={() => setSelected(null)}
        className="client-dialog"
      >
        {selected && (
          <>
            <div className="dialog-heading">
              <span className="eyebrow">FICHA DO CLIENTE</span>
              <button
                className="icon-button"
                aria-label="Fechar ficha"
                onClick={() => setSelected(null)}
              >
                <Icon name="close" />
              </button>
            </div>
            <div className="dialog-client">
              <span className="avatar large">{initials(selected.nome)}</span>
              <div>
                <h2>{selected.nome}</h2>
                <p>
                  {selected.tipo_produto} · Grupo {selected.grupo} · Cota{" "}
                  {selected.cota}
                </p>
              </div>
            </div>
            <div className="detail-credit">
              <small>Crédito contratado</small>
              <strong>{money(selected.credito)}</strong>
              <span>Parcela: {money(selected.valor_parcela)}</span>
            </div>
            {selected.ultimo_pagamento && <div className="info-note">
              <strong>Parcela de {month(Number(selected.ultimo_pagamento.competencia.slice(0,4)), Number(selected.ultimo_pagamento.competencia.slice(5)))} paga</strong>
              <p>Vencimento: {date(selected.ultimo_pagamento.vencimento)}. {selected.ultimo_pagamento.parcelas_atrasadas_diluidas} parcelas atrasadas diluídas.</p>
              <p>{selected.ultimo_pagamento.regra_comissao}</p>
              <p>Comissão prevista para {month(Number(selected.ultimo_pagamento.comissao_recebimento_previsto.slice(0,4)), Number(selected.ultimo_pagamento.comissao_recebimento_previsto.slice(5)))}; recebimento ainda não confirmado.</p>
            </div>}
            <dl className="details">
              {[
                ["CPF / CNPJ", selected.cpf_cnpj],
                ["Contrato", selected.num_contrato],
                ["Telefone", selected.telefone],
                ["E-mail", selected.email],
                ["Data da venda", date(selected.data_venda)],
                ["Situação informada", selected.situacao],
                ["Parcelas pagas", selected.parcelas_pagas],
                ["Parcelas em atraso", selected.parcelas_atraso],
              ].map(([k, v]) => (
                <div key={k}>
                  <dt>{k}</dt>
                  <dd>{v || v === 0 ? v : "Não informado"}</dd>
                </div>
              ))}
            </dl>
            <div className="dialog-actions">
              <Contact cliente={selected} />
              <button className="button" onClick={() => setSelected(null)}>
                Fechar
              </button>
            </div>
          </>
        )}
      </dialog>
    </div>
  );
}

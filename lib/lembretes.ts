export interface ClienteLembrete {
  id: string;
  nome: string;
  telefone: string;
  grupo: string;
  cota: number;
  tipo_produto: string;
}

export function whatsappUrl(telefone: string, mensagem = "") {
  const numero = telefone.replace(/\D/g, "");
  if (numero.length < 10 || numero.length > 15) return null;
  const internacional = numero.length <= 11 ? `55${numero}` : numero;
  return `https://wa.me/${internacional}${mensagem ? `?text=${encodeURIComponent(mensagem)}` : ""}`;
}

export function hojeBrasil(now = new Date()) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/Sao_Paulo", year: "numeric", month: "2-digit", day: "2-digit",
  }).formatToParts(now);
  const part = (type: string) => parts.find(p => p.type === type)?.value;
  return `${part("year")}-${part("month")}-${part("day")}`;
}

export function proximoVencimento(produto: string, hoje = hojeBrasil()) {
  const [ano, mes, dia] = hoje.split("-").map(Number);
  const vencimento = produto === "Veicular" ? 7 : 15;
  const data = new Date(Date.UTC(ano, mes - 1 + (dia > vencimento ? 1 : 0), vencimento));
  return data.toISOString().slice(0, 10);
}

export function mensagemLembrete(cliente: ClienteLembrete, vencimento: string, hoje = hojeBrasil()) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(vencimento)) return "";
  const dias = Math.round((Date.parse(vencimento) - Date.parse(hoje)) / 86400000);
  const data = `${vencimento.slice(8, 10)}/${vencimento.slice(5, 7)}`;
  const prazo = dias === 0 ? `vence hoje, ${data}` : dias > 0
    ? `vence daqui a ${dias} ${dias === 1 ? "dia" : "dias"}, em ${data}`
    : `venceu em ${data}`;
  const nome = cliente.nome.trim().split(/\s+/)[0].toLocaleLowerCase("pt-BR");
  const primeiroNome = nome.charAt(0).toLocaleUpperCase("pt-BR") + nome.slice(1);
  return `Olá, ${primeiroNome}! Tudo bem? 😊\n\nPassando para lembrar que sua parcela da Ademicon ${prazo}. 📅\nGrupo ${cliente.grupo} · Cota ${cliente.cota}\n\nMantenha o pagamento em dia para participar do sorteio deste mês! 🍀\n\nSe já pagou, pode desconsiderar este lembrete. Se precisar do boleto, me chama por aqui!`;
}

export const TIPOS_ANEXO = ["image/jpeg", "image/png", "image/webp", "application/pdf"];
export const MAX_ANEXO = 10 * 1024 * 1024;
export function validarAnexos(files: File[], atuais: File[] = []) {
  if (files.length + atuais.length > 5) return "Selecione no máximo 5 anexos.";
  if (files.some(f => !TIPOS_ANEXO.includes(f.type))) return "Use imagens JPG, PNG, WebP ou arquivos PDF.";
  if (files.some(f => f.size > MAX_ANEXO)) return "Cada anexo pode ter até 10 MB.";
  if ([...files, ...atuais].reduce((s, f) => s + f.size, 0) > 25 * 1024 * 1024) return "Os anexos juntos podem ter até 25 MB.";
  return "";
}

// Browser-local attachments: no public uploads or client data in shared storage.
function abrirBanco(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open("carteira-lembretes-v1", 1);
    request.onupgradeneeded = () => request.result.createObjectStore("config");
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}
export async function carregarAnexos(): Promise<File[] | null> {
  const db = await abrirBanco();
  try {
    return await new Promise((resolve, reject) => {
      const tx = db.transaction("config", "readonly");
      const request = tx.objectStore("config").get("anexos");
      tx.oncomplete = () => resolve(request.result === undefined ? null : request.result.map((item: { blob: Blob; nome: string }) => new File([item.blob], item.nome, { type: item.blob.type })));
      tx.onerror = () => reject(tx.error);
      tx.onabort = () => reject(tx.error);
    });
  } finally { db.close(); }
}
export async function salvarAnexos(files: File[]) {
  const db = await abrirBanco();
  try {
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction("config", "readwrite");
      tx.objectStore("config").put(files.map(f => ({ nome: f.name, blob: f })), "anexos");
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
      tx.onabort = () => reject(tx.error);
    });
  } finally { db.close(); }
}

"use client";

import { useEffect, useRef, useState } from "react";
import {
  carregarAnexos, salvarAnexos, validarAnexos, mensagemLembrete,
  proximoVencimento, whatsappUrl, type ClienteLembrete,
} from "@/lib/lembretes";

export function WhatsAppIcon() {
  return <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M20.5 3.5A11.8 11.8 0 0 0 12.1 0C5.6 0 .3 5.3.3 11.8c0 2.1.6 4.1 1.6 5.9L.2 24l6.4-1.7a11.8 11.8 0 0 0 5.6 1.4h.1c6.5 0 11.8-5.3 11.8-11.8 0-3.2-1.2-6.1-3.6-8.4ZM12.2 21.7a9.8 9.8 0 0 1-5-1.4l-.4-.2-3.8 1 1-3.7-.3-.4a9.8 9.8 0 0 1-1.5-5.2c0-5.4 4.4-9.8 9.8-9.8a9.8 9.8 0 0 1 9.8 9.8c0 5.4-4.4 9.9-9.8 9.9Zm5.4-7.4c-.3-.1-1.7-.9-2-.9-.3-.1-.5-.1-.7.2-.2.3-.8.9-1 1-.1.2-.3.2-.6.1-.3-.2-1.2-.4-2.3-1.5-.9-.7-1.5-1.7-1.7-2-.1-.3 0-.4.1-.6l.5-.5.3-.5c.1-.2 0-.4 0-.5l-.9-2.1c-.2-.6-.5-.5-.7-.5H8c-.2 0-.5.1-.7.3-.3.3-1 1-1 2.4s1 2.8 1.2 3c.2.2 2.1 3.2 5 4.5.7.3 1.2.5 1.7.6.7.2 1.4.2 1.9.1.6-.1 1.7-.7 2-1.4.2-.7.2-1.3.1-1.4 0-.1-.3-.2-.6-.3Z"/></svg>;
}

function Anexo({ file, remove }: { file: File; remove: () => void }) {
  const [url, setUrl] = useState("");
  useEffect(() => {
    const objectUrl = URL.createObjectURL(file);
    setUrl(objectUrl);
    return () => URL.revokeObjectURL(objectUrl);
  }, [file]);
  return <div className="reminder-file">
    {file.type.startsWith("image/") && url ? <img src={url} alt={file.name} /> : <span className="reminder-pdf">PDF</span>}
    <div><strong>{file.name}</strong><small>{(file.size / 1024 / 1024).toFixed(2)} MB</small>
      <a href={url} download={file.name}>Baixar anexo</a></div>
    <button className="icon-button" onClick={remove} aria-label={`Remover ${file.name}`}>×</button>
  </div>;
}

export function Lembretes({ cliente, onClose, visible }: {
  cliente: ClienteLembrete | null; onClose: () => void; visible: boolean;
}) {
  const [files, setFiles] = useState<File[]>([]);
  const [ready, setReady] = useState(false);
  const [notice, setNotice] = useState("");
  const [vencimento, setVencimento] = useState("");
  const [mensagem, setMensagem] = useState("");
  const [sharing, setSharing] = useState(false);
  const [shareFiles, setShareFiles] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<string[]>([]);
  const dialog = useRef<HTMLDialogElement>(null);
  const input = useRef<HTMLInputElement>(null);
  const dialogInput = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      let stored: File[] | null = null;
      try { stored = await carregarAnexos(); }
      catch { if (!cancelled) setNotice("Não foi possível ler os anexos salvos neste navegador."); }
      if (stored === null) {
        try {
          const res = await fetch("/lembrete-15-10.webp");
          if (!res.ok) throw Error();
          stored = [new File([await res.blob()], "lembrete-15-10.webp", { type: "image/webp" })];
        } catch { stored = []; }
      }
      if (!cancelled) { setFiles(stored); setReady(true); }
    }
    void load();
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    if (!cliente) { dialog.current?.close(); return; }
    const due = proximoVencimento(cliente.tipo_produto);
    setVencimento(due);
    setMensagem(mensagemLembrete(cliente, due));
    // Dated artwork is never automatically selected for another due date.
    setSelectedFiles([]);
    setNotice("");
    dialog.current?.showModal();
  }, [cliente]);

  const anexos = files.filter(f => selectedFiles.includes(f.name));
  useEffect(() => {
    const selecionados = files.filter(f => selectedFiles.includes(f.name));
    try { setShareFiles(selecionados.length > 0 && !!navigator.share && !!navigator.canShare?.({ files: selecionados })); }
    catch { setShareFiles(false); }
  }, [files, selectedFiles]);

  async function updateFiles(next: File[]) {
    setFiles(next);
    setSelectedFiles(current => current.filter(name => next.some(f => f.name === name)));
    try { await salvarAnexos(next); setNotice("Anexos salvos neste navegador."); }
    catch { setNotice("Anexos disponíveis nesta sessão. Não foi possível salvá-los; mantenha uma cópia no seu aparelho."); }
  }
  async function upload(incoming: File[]) {
    const error = validarAnexos(incoming, files);
    if (error) { setNotice(error); return; }
    const nomes = new Set(files.map(f => f.name));
    const unique = incoming.map(f => {
      let name = f.name;
      let suffix = 1;
      while (nomes.has(name)) name = `${suffix++}-${f.name}`;
      nomes.add(name);
      return new File([f], name, { type: f.type });
    });
    await updateFiles([...files, ...unique]);
  }
  async function copyMessage() {
    try { await navigator.clipboard.writeText(mensagem); setNotice("Mensagem copiada. Cole como legenda da imagem no WhatsApp."); }
    catch { setNotice("Selecione e copie o texto da mensagem abaixo."); }
  }
  async function share() {
    if (!shareFiles || sharing) return;
    setSharing(true);
    try {
      await navigator.share({ files: anexos, text: mensagem, title: "Lembrete Ademicon" });
      setNotice("Compartilhamento aberto. Confira o cliente no WhatsApp antes de enviar.");
    } catch (error) {
      if (!(error instanceof DOMException && error.name === "AbortError")) setNotice("Não foi possível compartilhar. Baixe os anexos e adicione na conversa do WhatsApp.");
    } finally { setSharing(false); }
  }

  const attachments = <>
    <div className="reminder-files">{files.map((f, i) => <Anexo key={`${f.name}-${i}`} file={f} remove={() => void updateFiles(files.filter((_, j) => i !== j))} />)}</div>
    {!files.length && <p className="muted">Nenhum anexo. Adicione a imagem do lembrete ou um PDF.</p>}
    <button className="button" disabled={!ready} onClick={() => input.current?.click()}>＋ Adicionar anexos</button>
    <p className="reminder-help">Até 5 imagens ou PDFs, 10 MB por arquivo. Os anexos adicionados ficam neste navegador; guarde uma cópia para usar em outro aparelho.</p>
  </>;
  const url = cliente ? whatsappUrl(cliente.telefone, mensagem) : null;
  return <>
    <input ref={input} hidden type="file" accept="image/jpeg,image/png,image/webp,application/pdf" multiple aria-label="Adicionar anexos do lembrete" disabled={!ready} onChange={e => { void upload(Array.from(e.target.files || [])); e.target.value = ""; }} />
    {visible && <section className="panel reminder-panel">
      <div className="panel-heading"><div><span className="eyebrow">RELACIONAMENTO</span><h2>Lembretes e anexos</h2><p>Adicione a imagem uma vez e use o ícone de WhatsApp ao lado do cliente para preparar o envio.</p></div><span className="reminder-symbol"><WhatsAppIcon /></span></div>
      {attachments}
      {!cliente && notice && <p role="status" className="reminder-notice">{notice}</p>}
    </section>}
    <dialog ref={dialog} className="client-dialog reminder-dialog" aria-labelledby="reminder-title" onCancel={onClose} onClose={onClose}>
      {cliente && <>
        <div className="dialog-heading"><span className="eyebrow">LEMBRETE PELO WHATSAPP</span><button className="icon-button" aria-label="Fechar lembrete" onClick={onClose}>×</button></div>
        <h2 id="reminder-title">{cliente.nome}</h2>
        <p className="reminder-help">{cliente.telefone || "Telefone não informado"} · Grupo {cliente.grupo} · Cota {cliente.cota}</p>
        <label className="reminder-label">Vencimento<input type="date" value={vencimento} onChange={e => { setVencimento(e.target.value); setMensagem(mensagemLembrete(cliente, e.target.value)); }} /></label>
        <label className="reminder-label">Mensagem para este cliente<textarea rows={9} value={mensagem} onChange={e => setMensagem(e.target.value)} /></label>
        <h3>Anexos para enviar</h3><p className="reminder-help">Marque os arquivos que deseja compartilhar. Confira se a data da imagem corresponde ao vencimento.</p>
        <div className="reminder-options">{files.map((f, i) => <label key={`${f.name}-${i}`}><input type="checkbox" checked={selectedFiles.includes(f.name)} onChange={e => setSelectedFiles(current => e.target.checked ? [...current, f.name] : current.filter(name => name !== f.name))} /><span>{f.name}</span><a href="#" onClick={e => { e.preventDefault(); const objectUrl = URL.createObjectURL(f); const link = document.createElement("a"); link.href = objectUrl; link.download = f.name; link.click(); setTimeout(() => URL.revokeObjectURL(objectUrl), 1000); }}>Baixar</a></label>)}</div>
        <input ref={dialogInput} hidden type="file" accept="image/jpeg,image/png,image/webp,application/pdf" multiple aria-label="Adicionar anexos para este lembrete" disabled={!ready} onChange={e => { void upload(Array.from(e.target.files || [])); e.target.value = ""; }} />
        <button className="button small" onClick={() => dialogInput.current?.click()} disabled={!ready}>Adicionar anexos</button>
        <div className="reminder-actions">
          {url ? <a className="button whatsapp-button" href={url} target="_blank" rel="noopener noreferrer"><WhatsAppIcon /> Abrir conversa com mensagem</a> : <p className="red">Cadastre um telefone válido para abrir a conversa.</p>}
          <button className="button" onClick={() => void copyMessage()} disabled={!mensagem.trim()}>Copiar mensagem</button>
          {shareFiles && <button className="button primary" onClick={() => void share()} disabled={sharing || !url || !mensagem.trim()}>{sharing ? "Compartilhando…" : "Compartilhar mensagem e anexos"}</button>}
        </div>
        <p className="reminder-help">{shareFiles ? "Ao compartilhar, escolha o WhatsApp e selecione este cliente. Se a legenda não aparecer, use Copiar mensagem." : "No computador, abra a conversa, baixe os anexos e adicione pelo clipe do WhatsApp. No celular compatível, selecione um anexo para compartilhar."}</p>
        {notice && <p role="status" className="reminder-notice">{notice}</p>}
      </>}
    </dialog>
  </>;
}

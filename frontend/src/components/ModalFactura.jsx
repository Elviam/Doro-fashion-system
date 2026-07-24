import { useEffect, useState } from "react";

function getDownloadUrl(url) {
  try {
    const parsedUrl = new URL(url);
    const segments = parsedUrl.pathname.split("/");
    const uploadIndex = segments.findIndex((segment) => segment === "upload");
    const isCloudinary = parsedUrl.hostname.endsWith("cloudinary.com");

    if (!isCloudinary || uploadIndex === -1 || segments[uploadIndex + 1]?.startsWith("fl_attachment")) {
      return url;
    }

    // `download` is ignored by browsers for cross-origin URLs. Cloudinary's
    // attachment flag sends Content-Disposition instead, which reliably starts
    // a download without navigating away from the application.
    segments.splice(uploadIndex + 1, 0, "fl_attachment");
    parsedUrl.pathname = segments.join("/");
    return parsedUrl.toString();
  } catch {
    return url;
  }
}

export default function ModalFactura({ url, onClose }) {
  const [paginaPdf, setPaginaPdf] = useState(1);

  useEffect(() => setPaginaPdf(1), [url]);
  if (!url) return null;

  const esPdf = /\.pdf(?:$|[?#])/i.test(url);
  const urlDescarga = getDownloadUrl(url);

  return (
    <div className="fixed inset-0 z-[130] flex items-center justify-center bg-[var(--noir)]/50 p-4 backdrop-blur-sm" onClick={onClose}>
      <section className="flex max-h-[92vh] w-full max-w-5xl flex-col overflow-hidden rounded-[2px] border border-[var(--border-gold-40)] bg-[var(--snow)] shadow-2xl dark:border-[var(--border-gold-20)] dark:bg-[var(--noir-soft)]" onClick={(event) => event.stopPropagation()}>
        <header className="flex items-center justify-between gap-3 border-b border-[var(--border-gold-25)] px-5 py-4 dark:border-[var(--border-gold-20)]">
          <h2 className="font-display text-lg font-bold uppercase tracking-widest text-[var(--noir)] dark:text-[var(--snow)]">Factura adjunta{esPdf ? ` · Página ${paginaPdf}` : ""}</h2>
          <div className="flex items-center gap-2">
            <a
              href={urlDescarga}
              target="_blank"
              rel="noreferrer"
              className="inline-flex h-9 items-center gap-2 rounded-[2px] border border-[var(--border-gold-40)] px-3 text-sm font-semibold text-[var(--gold-dark)] transition-colors hover:bg-[var(--gold-08)] dark:border-[var(--border-gold-20)] dark:text-[var(--gold-light)]"
            >
              <i className="bi bi-download" />
              <span className="hidden sm:inline">{esPdf ? "Descargar PDF" : "Descargar"}</span>
            </a>
            <a
              href={url}
              target="_blank"
              rel="noreferrer"
              className="inline-flex h-9 items-center gap-2 rounded-[2px] border border-[var(--border-gold-40)] px-3 text-sm font-semibold text-[var(--gold-dark)] transition-colors hover:bg-[var(--gold-08)] dark:border-[var(--border-gold-20)] dark:text-[var(--gold-light)]"
            >
              <i className="bi bi-box-arrow-up-right" />
              <span className="hidden sm:inline">Abrir</span>
            </a>
            <button type="button" onClick={onClose} aria-label="Cerrar visor de factura" className="flex h-9 w-9 items-center justify-center rounded-[2px] text-lg text-[var(--gold-dark)] hover:bg-[var(--gold-08)] dark:text-[var(--gold-light)]"><i className="bi bi-x-lg" /></button>
          </div>
        </header>
        <div className="min-h-0 flex-1 bg-[var(--ivory-deep)] p-3 dark:bg-[var(--noir)]">
          {esPdf ? (
            <iframe key={`${url}-${paginaPdf}`} src={`${url}#page=${paginaPdf}&view=FitH`} title={`Factura PDF, página ${paginaPdf}`} className="h-[68vh] w-full rounded-[2px] bg-white" />
          ) : (
            <img src={url} alt="Factura adjunta" className="mx-auto max-h-[68vh] max-w-full object-contain" />
          )}
        </div>
        {esPdf && (
          <footer className="flex items-center justify-center gap-4 border-t border-[var(--border-gold-25)] px-5 py-3 dark:border-[var(--border-gold-20)]">
            <button type="button" disabled={paginaPdf === 1} onClick={() => setPaginaPdf((pagina) => pagina - 1)} className="h-9 w-10 rounded-[2px] border border-[var(--border-gold-40)] text-[var(--gold-dark)] disabled:cursor-not-allowed disabled:opacity-40 dark:border-[var(--border-gold-20)] dark:text-[var(--gold-light)]" aria-label="Página anterior"><i className="bi bi-chevron-left" /></button>
            <span className="text-sm text-[var(--noir-soft)] dark:text-[var(--ash)]">Página {paginaPdf}</span>
            <button type="button" onClick={() => setPaginaPdf((pagina) => pagina + 1)} className="h-9 w-10 rounded-[2px] border border-[var(--border-gold-40)] text-[var(--gold-dark)] dark:border-[var(--border-gold-20)] dark:text-[var(--gold-light)]" aria-label="Página siguiente"><i className="bi bi-chevron-right" /></button>
          </footer>
        )}
      </section>
    </div>
  );
}

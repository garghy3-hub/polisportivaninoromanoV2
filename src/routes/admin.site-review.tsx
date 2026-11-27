import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { AdminNav } from "../components/AdminNav";
import {
  getSiteEditorialQueueFn,
  siteEditorialWorkflowFn,
  type SiteEditorialAction,
  type SiteEditorialResource,
} from "../lib/server/site-editorial-actions";

export const Route = createFileRoute("/admin/site-review")({
  headers: () => ({ "Cache-Control": "private, no-store" }),
  loader: () => getSiteEditorialQueueFn(),
  component: SiteReviewPage,
});

type ReviewItem = {
  resource: SiteEditorialResource;
  id: string;
  draft_content: unknown;
  content: unknown;
  updated_at: string;
  editorial_status: string;
  is_published: boolean;
  review_note: string | null;
  submitted_at: string | null;
  draft_created_by: string | null;
  reviewer_id: string | null;
};

function resourceLabel(resource: SiteEditorialResource) {
  return resource === "site-settings" ? "Homepage, pagine e impostazioni" : "Profilo societario";
}

function SiteReviewPage() {
  const queue = Route.useLoaderData();
  const router = useRouter();
  const command = useServerFn(siteEditorialWorkflowFn);
  const [busy, setBusy] = useState("");
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [message, setMessage] = useState("");

  const run = async (item: ReviewItem, action: SiteEditorialAction) => {
    const key = item.resource;
    if (busy) return;
    if (action === "reject" && !notes[key]?.trim()) {
      setMessage("Inserisci una motivazione per il rifiuto.");
      return;
    }
    setBusy(key);
    setMessage("");
    try {
      const result = await command({ data: {
        resource: item.resource,
        action,
        expectedUpdatedAt: item.updated_at,
        note: action === "reject" ? notes[key].trim() : "",
      } });
      if (!result.ok) {
        setMessage(result.code === "conflict"
          ? "Il contenuto è stato aggiornato da un altro utente. Ricarica la coda."
          : result.code === "separation_of_duties"
            ? "L'autore della bozza non può approvare o respingere la propria revisione."
            : result.code === "forbidden" ? "Permesso insufficiente."
              : "Operazione non riuscita. Verifica lo stato e riprova.");
        return;
      }
      setMessage(action === "approve" ? "Contenuto approvato."
        : action === "reject" ? "Contenuto respinto."
          : action === "publish" ? "Contenuto pubblicato."
            : "Pubblicazione ritirata.");
      await router.invalidate();
    } catch {
      setMessage("Servizio non disponibile.");
    } finally {
      setBusy("");
    }
  };

  const sections = [
    { status: "in-review", title: "Da revisionare" },
    { status: "approved", title: "Approvati · da pubblicare" },
    { status: "published", title: "Pubblicati · ritira pubblicazione" },
  ];

  return <main className="min-h-screen bg-[#090d18] px-5 py-12 text-white sm:px-8">
    <div className="mx-auto max-w-6xl">
      <a href="/admin" className="text-sm font-semibold text-red-300">← Area amministrativa</a>
      <AdminNav />
      <header className="mt-10">
        <p className="text-sm font-bold uppercase tracking-[0.2em] text-red-300">Contenuti istituzionali · flusso editoriale</p>
        <h1 className="mt-3 text-4xl font-black sm:text-5xl">Revisioni pagine e Società</h1>
        <p className="mt-4 max-w-3xl leading-7 text-slate-300">Coda riservata a publisher e amministratori. La pubblicazione sostituisce il contenuto pubblico soltanto dopo approvazione.</p>
      </header>
      {message && <p role="status" aria-live="polite" className="mt-6 rounded-xl border border-white/10 p-4 text-sm">{message}</p>}
      {!queue.ok ? <p className="mt-8 rounded-xl border border-amber-300/30 p-5 text-amber-100">
        {queue.code === "forbidden" ? "Accesso riservato ai publisher e agli amministratori." : "Coda non disponibile. Verifica autenticazione e connessione al database."}
      </p> : <div className="mt-8 space-y-10">
        {sections.map(section => {
          const items = (queue.items as ReviewItem[]).filter(item => item.editorial_status === section.status);
          return <section key={section.status}>
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-2xl font-bold">{section.title}</h2>
              <span className="rounded-full border border-white/10 px-3 py-1 text-xs text-slate-400">{items.length}</span>
            </div>
            <div className="mt-4 space-y-4">
              {items.map(item => <article key={item.resource} className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 sm:p-6">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-sm text-red-300">{resourceLabel(item.resource)}</p>
                    <h3 className="mt-2 text-xl font-black">{item.editorial_status}</h3>
                    <p className="mt-2 text-sm text-slate-400">Ultimo aggiornamento: {new Date(item.updated_at).toLocaleString("it-IT")}</p>
                    {item.submitted_at && <p className="mt-1 text-xs text-slate-500">Inviato: {new Date(item.submitted_at).toLocaleString("it-IT")}</p>}
                    <p className="mt-1 text-xs text-slate-500">Contenuto pubblico attivo: {item.is_published ? "sì" : "no"}</p>
                  </div>
                  <span className="rounded-full border border-white/10 px-3 py-1 text-xs text-slate-300">{item.resource}</span>
                </div>
                {item.review_note && <p className="mt-3 rounded-lg border border-rose-300/20 bg-rose-300/5 p-3 text-sm text-rose-100">Nota revisione: {item.review_note}</p>}
                <details className="mt-4 rounded-xl border border-white/10 p-4">
                  <summary className="cursor-pointer text-sm font-semibold">Anteprima dati della revisione</summary>
                  <pre className="mt-3 max-h-96 overflow-auto whitespace-pre-wrap break-words text-xs text-slate-300">{JSON.stringify(item.draft_content ?? item.content, null, 2)}</pre>
                </details>
                {section.status === "in-review" ? <>
                  <label htmlFor={"site-reject-" + item.resource} className="mt-5 block text-sm font-semibold">Motivazione del rifiuto</label>
                  <textarea id={"site-reject-" + item.resource} value={notes[item.resource] ?? ""} onChange={event => setNotes(current => ({ ...current, [item.resource]: event.target.value }))} maxLength={1000} rows={2} className="mt-2 w-full rounded-xl border border-white/15 bg-slate-950 p-3 text-sm" />
                  <div className="mt-4 flex flex-wrap gap-2">
                    <button type="button" disabled={!!busy} onClick={() => void run(item, "approve")} className="rounded-lg bg-emerald-700 px-4 py-2 text-sm font-bold disabled:opacity-40">Approva</button>
                    <button type="button" disabled={!!busy} onClick={() => void run(item, "reject")} className="rounded-lg border border-rose-300/30 px-4 py-2 text-sm font-bold text-rose-100 disabled:opacity-40">Rifiuta</button>
                  </div>
                </> : <button type="button" disabled={!!busy} onClick={() => void run(item, section.status === "approved" ? "publish" : "unpublish")} className="mt-5 rounded-lg bg-red-600 px-4 py-2 text-sm font-bold disabled:opacity-40">{section.status === "approved" ? "Pubblica" : "Ritira pubblicazione"}</button>}
              </article>)}
              {items.length === 0 && <p className="rounded-xl border border-white/10 p-5 text-sm text-slate-400">Nessun contenuto in questa sezione.</p>}
            </div>
          </section>;
        })}
      </div>}
    </div>
  </main>;
}

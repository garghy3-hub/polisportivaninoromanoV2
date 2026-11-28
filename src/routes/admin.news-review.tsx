import { useState } from "react";
import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { AdminNav } from "../components/AdminNav";
import { newsApproveFn, newsRejectFn, newsPublishFn } from "../lib/server/news-editorial-actions";
import { newsReviewQueueFn } from "../lib/server/news-review-queue";
import type { NewsRevisionRecord } from "../lib/server/news-editorial-service";

export const Route = createFileRoute("/admin/news-review")({
  headers: () => ({ "Cache-Control": "private, no-store" }),
  loader: () => newsReviewQueueFn(),
  component: NewsReviewQueuePage,
});

function NewsReviewQueuePage() {
  const queue = Route.useLoaderData();
  const router = useRouter();
  const approve = useServerFn(newsApproveFn);
  const reject = useServerFn(newsRejectFn);
  const publish = useServerFn(newsPublishFn);
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [busyId, setBusyId] = useState("");
  const [message, setMessage] = useState("");

  const handleAction = async (
    item: NewsRevisionRecord,
    action: "approve" | "reject" | "publish",
  ) => {
    if (busyId) return;
    const reviewNote = notes[item.revision.id]?.trim() ?? "";
    if (action === "reject" && !reviewNote) {
      setMessage("Inserisci una motivazione prima di rifiutare la revisione.");
      return;
    }
    setBusyId(item.revision.id);
    setMessage("");
    const data = {
      articleId: item.revision.entityId,
      revisionId: item.revision.id,
      expectedVersion: item.version,
      ...(action === "reject" ? { reviewNote } : {}),
    };
    try {
      const result = action === "approve"
        ? await approve({ data })
        : action === "reject"
          ? await reject({ data })
          : await publish({ data: {
              articleId: item.revision.entityId,
              revisionId: item.revision.id,
              expectedVersion: item.version,
            } });
      if (!result.ok) {
        const messages: Record<string, string> = {
          unauthenticated: "Sessione scaduta. Effettua nuovamente l'accesso.",
          forbidden: "Il tuo ruolo non è autorizzato a questa operazione.",
          conflict: "La revisione è stata aggiornata da un altro utente. Ricarica la coda.",
          "not-found": "La revisione non è più disponibile.",
          "invalid-transition": "La revisione non è nello stato previsto.",
          "slug-taken": "Lo slug è già utilizzato da un'altra notizia.",
          invalid: "I dati inviati non sono validi.",
          internal: "Operazione non riuscita. Riprova.",
        };
        setMessage(messages[result.code] ?? "Operazione non riuscita.");
        return;
      }
      setMessage(action === "approve" ? "Revisione approvata." : action === "reject" ? "Revisione rifiutata." : "Notizia pubblicata.");
      await router.invalidate();
    } catch {
      setMessage("Servizio editoriale non disponibile.");
    } finally {
      setBusyId("");
    }
  };

  return (
    <main id="main-content" tabIndex={-1} className="min-h-screen bg-[#090d18] px-5 py-12 text-white sm:px-8">
      <div className="mx-auto max-w-7xl">
        <Link to="/admin" className="text-sm font-semibold text-red-300 hover:text-white">← Area amministrativa</Link>
        <AdminNav />
        <header className="mt-10">
          <p className="text-sm font-bold uppercase tracking-[0.2em] text-red-300">Redazione · Publisher</p>
          <h1 className="mt-3 text-4xl font-black tracking-tight sm:text-5xl">Revisioni e pubblicazione</h1>
          <p className="mt-4 max-w-3xl leading-7 text-slate-300">Coda riservata a Publisher e Administrator. L'approvazione non pubblica automaticamente: la pubblicazione è un passaggio separato.</p>
        </header>

        {message && <p className="mt-6 rounded-xl border border-sky-300/20 bg-sky-300/5 p-4 text-sm text-sky-100" role="status" aria-live="polite">{message}</p>}

        {!queue.ok ? (
          <section className="mt-8 rounded-2xl border border-amber-300/30 bg-amber-300/10 p-6" role="status">
            <h2 className="font-bold text-amber-100">{queue.code === "forbidden" ? "Permesso insufficiente" : queue.code === "unauthenticated" ? "Sessione non valida" : "Coda non disponibile"}</h2>
            <p className="mt-2 text-sm leading-6 text-slate-300">{queue.code === "forbidden" ? "Questa sezione è riservata ai ruoli Publisher e Administrator." : queue.code === "unauthenticated" ? "Accedi nuovamente per consultare le revisioni." : "Non è stato possibile recuperare le revisioni. Riprova più tardi."}</p>
          </section>
        ) : (
          <>
            <section className="mt-8" aria-labelledby="review-pending-heading">
              <h2 id="review-pending-heading" className="text-2xl font-bold">In attesa di approvazione <span className="text-sm font-normal text-slate-400">({queue.items.filter(item => item.revision.status === "in-review").length})</span></h2>
              <div className="mt-4 grid gap-4">
                {queue.items.filter(item => item.revision.status === "in-review").map(item => (
                  <article key={item.revision.id} className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <p className="text-xs font-bold uppercase tracking-widest text-amber-200">Da approvare · v{item.version}</p>
                      <p className="text-xs text-slate-500">{new Date(item.revision.updatedAt).toLocaleString("it-IT")}</p>
                    </div>
                    <h3 className="mt-3 text-xl font-bold">{item.revision.content.title}</h3>
                    <p className="mt-2 text-sm text-slate-400">{item.revision.content.category} · {item.revision.content.slug}</p>
                    <p className="mt-4 leading-7 text-slate-300">{item.revision.content.excerpt}</p>
                    <details className="mt-4">
                      <summary className="cursor-pointer text-sm font-semibold text-red-200">Leggi il testo completo</summary>
                      <p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-slate-300">{item.revision.content.body}</p>
                    </details>
                    <label className="mt-5 block text-sm font-semibold" htmlFor={`review-note-${item.revision.id}`}>Motivazione in caso di rifiuto</label>
                    <textarea id={`review-note-${item.revision.id}`} maxLength={1000} rows={2} value={notes[item.revision.id] ?? ""} onChange={event => setNotes(current => ({ ...current, [item.revision.id]: event.target.value }))} className="mt-2 w-full rounded-xl border border-white/15 bg-[#090d18] p-3 text-sm text-white outline-none focus:border-red-300" placeholder="Indica cosa correggere…" />
                    <div className="mt-4 flex flex-wrap gap-2">
                      <button type="button" disabled={Boolean(busyId)} onClick={() => void handleAction(item, "approve")} className="rounded-lg bg-emerald-700 px-4 py-2 text-sm font-semibold hover:bg-emerald-600 disabled:opacity-50">{busyId === item.revision.id ? "Attendi…" : "Approva"}</button>
                      <button type="button" disabled={Boolean(busyId)} onClick={() => void handleAction(item, "reject")} className="rounded-lg border border-rose-300/30 px-4 py-2 text-sm font-semibold text-rose-100 hover:bg-rose-300/10 disabled:opacity-50">Rifiuta</button>
                    </div>
                  </article>
                ))}
                {queue.items.every(item => item.revision.status !== "in-review") && <p className="rounded-xl border border-white/10 p-5 text-sm text-slate-400">Nessuna revisione in attesa.</p>}
              </div>
            </section>

            <section className="mt-12" aria-labelledby="approved-heading">
              <h2 id="approved-heading" className="text-2xl font-bold">Approvate, da pubblicare <span className="text-sm font-normal text-slate-400">({queue.items.filter(item => item.revision.status === "approved").length})</span></h2>
              <div className="mt-4 grid gap-4">
                {queue.items.filter(item => item.revision.status === "approved").map(item => (
                  <article key={item.revision.id} className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-emerald-300/20 bg-emerald-300/5 p-5">
                    <div><p className="text-xs font-bold uppercase tracking-widest text-emerald-200">Approvata · v{item.version}</p><h3 className="mt-2 font-bold">{item.revision.content.title}</h3><p className="mt-1 text-sm text-slate-400">{item.revision.content.slug}</p></div>
                    <button type="button" disabled={Boolean(busyId)} onClick={() => void handleAction(item, "publish")} className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold hover:bg-red-500 disabled:opacity-50">{busyId === item.revision.id ? "Pubblicazione…" : "Pubblica notizia"}</button>
                  </article>
                ))}
                {queue.items.every(item => item.revision.status !== "approved") && <p className="rounded-xl border border-white/10 p-5 text-sm text-slate-400">Nessuna notizia in attesa di pubblicazione.</p>}
              </div>
            </section>
          </>
        )}
      </div>
    </main>
  );
}

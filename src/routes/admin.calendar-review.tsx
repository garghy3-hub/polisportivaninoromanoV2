import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { AdminNav } from "../components/AdminNav";
import { calendarReviewQueueFn } from "../lib/server/calendar-review-actions";
import { calendarWorkflowCommandFn } from "../lib/server/calendar-editorial-actions";

export const Route = createFileRoute("/admin/calendar-review")({
  headers: () => ({ "Cache-Control": "private, no-store" }),
  loader: () => calendarReviewQueueFn(),
  component: CalendarReviewPage,
});

type ReviewItem = {
  id: string;
  starts_at: string;
  home_team: string;
  away_team: string;
  event_type: string;
  round_label: string | null;
  season_id: string | null;
  competition: string | null;
  venue: string | null;
  status: string;
  home_score: number | null;
  away_score: number | null;
  editorial_status: string;
  review_note: string | null;
  submitted_at: string | null;
  updated_at: string;
  is_published: boolean;
};

function CalendarReviewPage() {
  const queue = Route.useLoaderData();
  const router = useRouter();
  const command = useServerFn(calendarWorkflowCommandFn);
  const [busy, setBusy] = useState("");
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [message, setMessage] = useState("");

  const run = async (item: ReviewItem, action: "approve" | "reject" | "publish" | "unpublish") => {
    if (busy) return;
    if (action === "reject" && !notes[item.id]?.trim()) {
      setMessage("Inserisci una motivazione per il rifiuto.");
      return;
    }
    setBusy(item.id);
    setMessage("");
    try {
      const result = await command({ data: {
        action, eventId: item.id, expectedUpdatedAt: item.updated_at,
        note: action === "reject" ? notes[item.id].trim() : "",
      } });
      if (!result.ok) {
        setMessage(result.code === "conflict"
          ? "L'appuntamento è stato aggiornato da un altro utente. Ricarica la coda."
          : result.code === "forbidden" ? "Permesso insufficiente."
          : "Operazione non riuscita. Verifica lo stato e riprova.");
        return;
      }
      setMessage(action === "approve" ? "Appuntamento approvato."
        : action === "reject" ? "Appuntamento respinto."
        : action === "publish" ? "Appuntamento pubblicato."
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
        <p className="text-sm font-bold uppercase tracking-[0.2em] text-red-300">Calendario · flusso editoriale</p>
        <h1 className="mt-3 text-4xl font-black sm:text-5xl">Revisioni calendario</h1>
        <p className="mt-4 max-w-3xl leading-7 text-slate-300">La revisione e la pubblicazione sono riservate a publisher e amministratori. Le bozze non compaiono in questa coda né nel calendario pubblico.</p>
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
              {items.map(item => <article key={item.id} className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 sm:p-6">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-sm text-red-300">{new Date(item.starts_at).toLocaleString("it-IT", { dateStyle: "full", timeStyle: "short" })}</p>
                    <h3 className="mt-2 text-xl font-black">{item.home_team} <span className="text-red-300">·</span> {item.away_team}</h3>
                    <p className="mt-2 text-sm text-slate-400">{item.event_type} · {item.status}{item.round_label ? " · " + item.round_label : ""}</p>
                  </div>
                  <span className="rounded-full border border-white/10 px-3 py-1 text-xs text-slate-300">{item.editorial_status}</span>
                </div>
                <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-sm text-slate-400">
                  {item.competition && <span>Competizione: {item.competition}</span>}
                  {item.venue && <span>Luogo: {item.venue}</span>}
                  {item.status === "completed" && item.home_score !== null && item.away_score !== null && <span>Risultato: {item.home_score}–{item.away_score}</span>}
                  {item.submitted_at && <span>Inviato: {new Date(item.submitted_at).toLocaleString("it-IT")}</span>}
                </div>
                {item.review_note && <p className="mt-3 rounded-lg border border-rose-300/20 bg-rose-300/5 p-3 text-sm text-rose-100">Nota: {item.review_note}</p>}
                {section.status === "in-review" ? <>
                  <label htmlFor={"calendar-reject-" + item.id} className="mt-5 block text-sm font-semibold">Motivazione del rifiuto</label>
                  <textarea id={"calendar-reject-" + item.id} value={notes[item.id] ?? ""} onChange={event => setNotes(current => ({ ...current, [item.id]: event.target.value }))} maxLength={1000} rows={2} className="mt-2 w-full rounded-xl border border-white/15 bg-slate-950 p-3 text-sm" />
                  <div className="mt-4 flex flex-wrap gap-2">
                    <button type="button" disabled={!!busy} onClick={() => void run(item, "approve")} className="rounded-lg bg-emerald-700 px-4 py-2 text-sm font-bold disabled:opacity-40">Approva</button>
                    <button type="button" disabled={!!busy} onClick={() => void run(item, "reject")} className="rounded-lg border border-rose-300/30 px-4 py-2 text-sm font-bold text-rose-100 disabled:opacity-40">Rifiuta</button>
                  </div>
                </> : <button type="button" disabled={!!busy} onClick={() => void run(item, section.status === "approved" ? "publish" : "unpublish")} className="mt-5 rounded-lg bg-red-600 px-4 py-2 text-sm font-bold disabled:opacity-40">{section.status === "approved" ? "Pubblica" : "Ritira pubblicazione"}</button>}
              </article>)}
              {items.length === 0 && <p className="rounded-xl border border-white/10 p-5 text-sm text-slate-400">Nessun appuntamento in questa sezione.</p>}
            </div>
          </section>;
        })}
      </div>}
    </div>
  </main>;
}

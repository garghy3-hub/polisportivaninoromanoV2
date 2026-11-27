import { useState, type FormEvent } from "react";
import { createFileRoute, redirect, useRouter } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { editorialLoginFn, getCurrentEditorialUserFn } from "../lib/server/editorial-auth";

export const Route = createFileRoute("/admin/login")({
  beforeLoad: async () => {
    const user = await getCurrentEditorialUserFn();
    if (user) throw redirect({ to: "/admin" });
  },
  component: EditorialLoginPage,
});

function EditorialLoginPage() {
  const router = useRouter();
  const login = useServerFn(editorialLoginFn);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (busy) return;
    setBusy(true);
    setMessage("");
    try {
      const result = await login({ data: { email, password } });
      if (result.ok) {
        await router.invalidate();
        await router.navigate({ to: "/admin" });
        return;
      }
      const messages: Record<string, string> = {
        "not-configured": "Accesso non ancora configurato. Contatta l'amministratore del sito.",
        "not-authorized": "Account non abilitato all'area editoriale.",
        "invalid-input": "Controlla l'indirizzo email e la password inseriti.",
        "invalid-credentials": "Credenziali non corrette.",
      };
      setMessage(messages[result.code] ?? "Accesso non riuscito. Riprova.");
    } catch {
      setMessage("Servizio temporaneamente non disponibile. Riprova più tardi.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <main id="main-content" className="flex min-h-screen items-center justify-center bg-[#090d18] px-5 py-12 text-white" tabIndex={-1}>
      <section className="w-full max-w-md rounded-3xl border border-white/10 bg-white/[0.03] p-7 shadow-2xl sm:p-9">
        <a href="/" className="text-sm font-semibold text-red-300 hover:text-white">← Torna al sito</a>
        <p className="mt-10 text-xs font-bold uppercase tracking-[0.2em] text-red-300">Polisportiva Nino Romano · V2</p>
        <h1 className="mt-3 text-3xl font-black">Accesso redazione</h1>
        <p className="mt-3 leading-7 text-slate-400">Area riservata agli utenti abilitati dalla società.</p>
        <form className="mt-8 space-y-5" onSubmit={(event) => void submit(event)}>
          <div>
            <label htmlFor="editorial-email" className="mb-2 block text-sm font-semibold">Email</label>
            <input id="editorial-email" type="email" autoComplete="username" required maxLength={254} value={email} onChange={(event) => setEmail(event.target.value)} className="w-full rounded-xl border border-white/15 bg-[#090d18] px-4 py-3 text-white outline-none focus:border-red-300" />
          </div>
          <div>
            <label htmlFor="editorial-password" className="mb-2 block text-sm font-semibold">Password</label>
            <input id="editorial-password" type="password" autoComplete="current-password" required maxLength={1024} value={password} onChange={(event) => setPassword(event.target.value)} className="w-full rounded-xl border border-white/15 bg-[#090d18] px-4 py-3 text-white outline-none focus:border-red-300" />
          </div>
          {message && <p role="alert" className="rounded-xl border border-rose-300/30 bg-rose-300/10 p-3 text-sm text-rose-100">{message}</p>}
          <button type="submit" disabled={busy} className="w-full rounded-xl bg-red-600 px-4 py-3 font-bold transition hover:bg-red-500 disabled:cursor-not-allowed disabled:opacity-60">
            {busy ? "Verifica in corso…" : "Accedi"}
          </button>
        </form>
        <p className="mt-6 text-xs leading-5 text-slate-500">Non è previsto l'accesso autonomo. Gli account e i ruoli vengono assegnati dalla gestione amministrativa.</p>
      </section>
    </main>
  );
}

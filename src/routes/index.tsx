export const Route = createFileRoute('/')({
  component: Home,
})

import { createFileRoute } from '@tanstack/react-router'

function Home() {
  return (
    <main className="min-h-screen bg-neutral-950 text-white">
      <section className="mx-auto flex min-h-screen max-w-6xl flex-col justify-center px-6 py-20">
        <p className="mb-4 text-sm font-semibold uppercase tracking-[0.3em] text-red-400">
          Milazzo · Pallavolo
        </p>
        <h1 className="max-w-4xl text-5xl font-bold tracking-tight sm:text-7xl">
          Polisportiva <span className="text-red-500">Nino Romano</span>
        </h1>
        <p className="mt-6 max-w-2xl text-lg text-neutral-300">
          Il nuovo spazio digitale della nostra società. Stiamo preparando il sito ufficiale.
        </p>
      </section>
    </main>
  )
}
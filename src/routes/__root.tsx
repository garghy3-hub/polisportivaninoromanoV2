import { useEffect, useState } from 'react'
import { createRootRoute, HeadContent, Link, Outlet, Scripts } from '@tanstack/react-router'
import '../styles.css'
import { localContentService } from '../lib/content-service'

export const Route = createRootRoute({
  head: () => {
    const site = localContentService.settings().site
    return { meta: [
      { title: site.title },
      { name: 'description', content: site.description },
      { property: 'og:title', content: site.ogTitle },
      { property: 'og:description', content: site.ogDescription },
      { property: 'og:type', content: 'website' },
      { property: 'og:locale', content: 'it_IT' },
      { name: 'twitter:card', content: 'summary' },
    ] }
  },
  component: RootComponent,
})

function RootComponent() {
  const [menuOpen, setMenuOpen] = useState(false)
  const navigation = localContentService.settings().navigation
    .filter((item) => item.visible)
    .slice()
    .sort((a, b) => a.order - b.order)

  useEffect(() => {
    if (!menuOpen) return
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setMenuOpen(false)
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [menuOpen])

  return (
    <html lang="it">
      <head><HeadContent /></head>
      <body className="bg-[#090d18] text-white">
        <a href="#main-content" className="sr-only z-50 rounded-lg bg-white px-4 py-3 font-semibold text-slate-950 focus:not-sr-only focus:fixed focus:left-4 focus:top-4">
          Salta al contenuto principale
        </a>
        <header className="border-b border-white/10 bg-[#090d18]/95">
          <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-5 py-5 sm:px-8">
            <Link to="/" className="flex items-center gap-3" aria-label={localContentService.settings().brand.ariaLabel} onClick={() => setMenuOpen(false)}>
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#d92738] font-black tracking-tight">{localContentService.settings().brand.monogram}</div>
              <div><p className="text-sm font-bold tracking-wide">{localContentService.settings().brand.name}</p><p className="text-xs text-slate-400">{localContentService.settings().brand.descriptor}</p></div>
            </Link>
            <button type="button" className="rounded-lg border border-white/15 px-3 py-2 text-sm font-semibold md:hidden" aria-expanded={menuOpen} aria-controls="primary-navigation" onClick={() => setMenuOpen((open) => !open)}>
              {menuOpen ? 'Chiudi ✕' : 'Menu ☰'}
            </button>
            <nav id="primary-navigation" aria-label="Navigazione principale" className={`${menuOpen ? 'flex' : 'hidden'} w-full flex-col gap-3 md:flex md:w-auto md:flex-row md:gap-x-5 md:gap-y-2`}>
              {navigation.map((item) => <a key={item.id} href={item.href} onClick={() => setMenuOpen(false)} className="text-sm text-slate-300 transition hover:text-white">{item.label}</a>)}
            </nav>
          </div>
        </header>
        <Outlet />
        <footer className="border-t border-white/10 px-5 py-8 text-sm text-slate-500 sm:px-8">
          <div className="mx-auto flex max-w-7xl flex-col gap-3 md:flex-row md:justify-between">
            <p>{localContentService.settings().footer.copyright}</p><p>{localContentService.settings().footer.projectLabel}</p>
          </div>
        </footer>
        <Scripts />
      </body>
    </html>
  )
}
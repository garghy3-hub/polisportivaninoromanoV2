import { useEffect, useState } from 'react'
import { createRootRoute, HeadContent, Link, Outlet, Scripts, redirect } from '@tanstack/react-router'
import '../styles.css'
import { localContentService } from '../lib/content-service'
import { getCurrentEditorialUserFn } from '../lib/server/editorial-auth'

export const Route = createRootRoute({
  beforeLoad: async ({ location }) => {
    // Protect every /admin route, including routes that are not rendered as
    // children of the dashboard file route. Keep the login page public.
    const pathname = location.pathname.replace(/\/+$/, '') || '/'
    const isAdminRoute = pathname === '/admin' || pathname.startsWith('/admin/')
    if (isAdminRoute && pathname !== '/admin/login') {
      const user = await getCurrentEditorialUserFn()
      if (!user) throw redirect({ to: '/admin/login' })
    }
  },
  head: () => {
    const site = localContentService.settings().site
    return { meta: [
      { title: site.title },
      { name: 'description', content: site.description },
      { property: 'og:title', content: site.ogTitle },
      { property: 'og:description', content: site.ogDescription },
      { property: 'og:type', content: 'website' },
      { property: 'og:locale', content: site.openGraphLocale },
      { name: 'twitter:card', content: site.ogImageUrl ? 'summary_large_image' : 'summary' },
      { name: 'twitter:title', content: site.twitterTitle || site.ogTitle },
      { name: 'twitter:description', content: site.twitterDescription || site.ogDescription },
      ...(site.ogImageUrl ? [{ property: 'og:image', content: site.ogImageUrl }] : []),
      ...(site.ogImageAlt ? [{ property: 'og:image:alt', content: site.ogImageAlt }] : []),
    ] }
  },
  component: RootComponent,
})

function RootComponent() {
  const [menuOpen, setMenuOpen] = useState(false)
  const site = localContentService.settings().site
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
    <html lang={site.language}>
      <head><HeadContent /></head>
      <body className="bg-[#090d18] text-white">
        <a href="#main-content" className="sr-only z-50 rounded-lg bg-white px-4 py-3 font-semibold text-slate-950 focus:not-sr-only focus:fixed focus:left-4 focus:top-4">
          {localContentService.settings().interface.skipToContent}
        </a>
        <header className="border-b border-white/10 bg-[#090d18]/95">
          <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-5 py-5 sm:px-8">
            <Link to="/" className="flex items-center gap-3" aria-label={localContentService.settings().brand.ariaLabel} onClick={() => setMenuOpen(false)}>
              {localContentService.settings().brand.logoUrl ? <img src={localContentService.settings().brand.logoUrl} alt={localContentService.settings().brand.logoAlt} className="h-11 w-11 rounded-xl object-contain" /> : <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#d92738] font-black tracking-tight">{localContentService.settings().brand.monogram}</div>}
              <div><p className="text-sm font-bold tracking-wide">{localContentService.settings().brand.name}</p><p className="text-xs text-slate-400">{localContentService.settings().brand.descriptor}</p></div>
            </Link>
            <button type="button" className="rounded-lg border border-white/15 px-3 py-2 text-sm font-semibold md:hidden" aria-expanded={menuOpen} aria-controls="primary-navigation" aria-label={menuOpen ? localContentService.settings().interface.closeMenu : localContentService.settings().interface.openMenu} onClick={() => setMenuOpen((open) => !open)}>
              {menuOpen ? `${localContentService.settings().interface.closeMenu} ✕` : `${localContentService.settings().interface.openMenu} ☰`}
            </button>
            <nav id="primary-navigation" aria-label={localContentService.settings().interface.navigationLabel} className={`${menuOpen ? 'flex' : 'hidden'} w-full flex-col gap-3 md:flex md:w-auto md:flex-row md:gap-x-5 md:gap-y-2`}>
              {navigation.map((item) => <a key={item.id} href={item.href} onClick={() => setMenuOpen(false)} className="text-sm text-slate-300 transition hover:text-white">{item.label}</a>)}
            </nav>
          </div>
        </header>
        <Outlet />
        <footer className="border-t border-white/10 px-5 py-8 text-sm text-slate-500 sm:px-8">
          <div className="mx-auto flex max-w-7xl flex-col gap-5 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-3">
              {localContentService.settings().brand.logoUrl ? (
                <img
                  src={localContentService.settings().brand.logoUrl}
                  alt={localContentService.settings().brand.logoAlt}
                  className="h-10 w-10 rounded-lg object-contain"
                />
              ) : (
                <span aria-hidden="true" className="flex h-10 w-10 items-center justify-center rounded-lg bg-red-500/10 font-black text-red-300">
                  {localContentService.settings().brand.monogram}
                </span>
              )}
              <div>
                <p className="font-bold text-slate-200">{localContentService.settings().brand.name}</p>
                <p className="text-xs text-slate-500">{localContentService.settings().brand.descriptor}</p>
              </div>
            </div>
            <div className="flex flex-col gap-1 md:items-end">
              <p>{localContentService.settings().footer.copyright}</p>
              <p>{localContentService.settings().footer.projectLabel}</p>
            </div>
          </div>
        </footer>
        <Scripts />
      </body>
    </html>
  )
}
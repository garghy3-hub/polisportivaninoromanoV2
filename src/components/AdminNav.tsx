import { Link, useRouter } from '@tanstack/react-router'
import { useServerFn } from '@tanstack/react-start'
import { editorialLogoutFn } from '../lib/server/editorial-auth'

const items = [
  { label: 'Dashboard', href: '/admin' },
  { label: 'News', href: '/admin/news' },
  { label: 'Bozze', href: '/admin/news-library' },
  { label: 'Squadre', href: '/admin/teams' },
  { label: 'Calendario', href: '/admin/calendar' },
  { label: 'Pagine', href: '/admin/pages' },
  { label: 'Media', href: '/admin/media' },
  { label: 'Brand', href: '/admin/brand' },
  { label: 'Società', href: '/admin/society' },
]

export function AdminNav() {
  const router = useRouter()
  const logout = useServerFn(editorialLogoutFn)

  const signOut = async () => {
    await logout()
    await router.invalidate()
    await router.navigate({ to: '/admin/login' })
  }

  return <nav aria-label="Navigazione amministrazione" className="mt-6 flex flex-wrap gap-2 rounded-2xl border border-white/10 bg-white/[0.03] p-3">
    {items.map(item => <Link key={item.href} to={item.href} className="rounded-lg border border-white/10 px-3 py-2 text-sm font-semibold text-slate-200 hover:border-red-300/40 hover:text-white">{item.label}</Link>)}
    <button type="button" onClick={() => void signOut()} className="rounded-lg border border-red-300/30 px-3 py-2 text-sm font-semibold text-red-200 hover:bg-red-400/10">Esci</button>
  </nav>
}

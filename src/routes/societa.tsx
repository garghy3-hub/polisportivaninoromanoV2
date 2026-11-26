import { createFileRoute, Link } from '@tanstack/react-router'
import { localContentService } from '../lib/content-service'

export const Route = createFileRoute('/societa')({
  head: () => {
    const seo = localContentService.settings().society
    return { meta: [{ title: seo.seoTitle }, { name: 'description', content: seo.seoDescription }] }
  },
  component: SocietyPage,
})

function SocietyPage() {
  const settings = localContentService.settings()
  const content = settings.society
  const profile = localContentService.profile()
  const pillars = content.pillars.filter((pillar) => pillar.visible).slice().sort((a, b) => a.order - b.order)
  const people = (profile.people ?? []).filter((person) => person.visible).slice().sort((a, b) => a.order - b.order)
  const partners = (profile.partners ?? []).filter((partner) => partner.visible).slice().sort((a, b) => a.order - b.order)
  const sponsors = partners.filter((partner) => partner.relationship === 'sponsor')
  const collaborators = partners.filter((partner) => partner.relationship === 'partner')
  const hasProfileDetails = Boolean(
    profile.description || profile.history || profile.mission || profile.address ||
    profile.contacts?.length || profile.socialLinks?.length || people.length || partners.length
  )

  return (
    <main id="main-content" tabIndex={-1} className="min-h-screen bg-[#090d18] px-5 py-12 text-white sm:px-8">
      <div className="mx-auto max-w-7xl">
        <Link to="/" className="text-sm font-semibold text-red-300 transition hover:text-white">{content.backLabel}</Link>
        <header className="mt-16 max-w-3xl">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-red-300">{content.eyebrow}</p>
          <h1 className="mt-4 text-5xl font-black tracking-tight sm:text-7xl">{content.title}<br /><span className="text-[#e53949]">{content.accent}</span></h1>
          <p className="mt-8 text-lg leading-8 text-slate-300">{content.description}</p>
        </header>

        {hasProfileDetails && (
          <section className="mt-12 space-y-8" aria-label={settings.interface.societyInformationLabel}>
            {profile.description && <p className="max-w-3xl text-lg leading-8 text-slate-300">{profile.description}</p>}

            {profile.history && (
              <article className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 sm:p-8">
                <h2 className="text-2xl font-bold">{content.historyTitle}</h2>
                <p className="mt-4 whitespace-pre-line leading-8 text-slate-300">{profile.history}</p>
              </article>
            )}

            {profile.mission && (
              <article className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 sm:p-8">
                <h2 className="text-2xl font-bold">{content.missionTitle}</h2>
                <p className="mt-4 whitespace-pre-line leading-8 text-slate-300">{profile.mission}</p>
              </article>
            )}

            {profile.address && (
              <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
                <h2 className="text-xl font-bold">{content.addressTitle}</h2>
                <p className="mt-3 whitespace-pre-line text-slate-300">{profile.address}</p>
              </section>
            )}

            {profile.contacts && profile.contacts.length > 0 && (
              <section>
                <h2 className="text-2xl font-bold">{content.contactsTitle}</h2>
                <ul className="mt-4 grid gap-3 sm:grid-cols-2">
                  {profile.contacts.map((contact, index) => (
                    <li key={`${contact.label}-${index}`} className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
                      <span className="block text-xs font-semibold uppercase tracking-wider text-red-300">{contact.label}</span>
                      {contact.href ? <a className="mt-2 inline-block text-slate-200 underline-offset-4 hover:underline" href={contact.href}>{contact.value}</a> : <span className="mt-2 block text-slate-200">{contact.value}</span>}
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {profile.socialLinks && profile.socialLinks.length > 0 && (
              <section>
                <h2 className="text-2xl font-bold">{content.socialLinksTitle}</h2>
                <ul className="mt-4 flex flex-wrap gap-3">
                  {profile.socialLinks.map((link, index) => (
                    <li key={`${link.label}-${index}`}>
                      {link.href ? <a className="inline-flex rounded-full border border-white/15 px-4 py-2 text-sm font-semibold text-slate-200 hover:bg-white/10" href={link.href} target={link.href.startsWith('https://') ? '_blank' : undefined} rel={link.href.startsWith('https://') ? 'noopener noreferrer' : undefined}>{link.label}</a> : <span className="inline-flex rounded-full border border-white/15 px-4 py-2 text-sm text-slate-300">{link.label}: {link.value}</span>}
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {people.length > 0 && (
              <section>
                <h2 className="text-2xl font-bold">{content.peopleTitle}</h2>
                <div className="mt-4 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                  {people.map((person) => (
                    <article key={person.id} className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03]">
                      {person.photoUrl && <img src={person.photoUrl} alt={person.photoAlt ?? ''} className="aspect-[4/3] w-full object-cover" loading="lazy" />}
                      <div className="p-5">
                        <h3 className="text-lg font-bold">{person.name}</h3>
                        <p className="mt-1 text-sm font-semibold text-red-300">{person.role}</p>
                        {person.biography && <p className="mt-3 whitespace-pre-line text-sm leading-7 text-slate-400">{person.biography}</p>}
                      </div>
                    </article>
                  ))}
                </div>
              </section>
            )}

            {sponsors.length > 0 && (
              <section>
                <h2 className="text-2xl font-bold">{content.sponsorsLabel}</h2>
                <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {sponsors.map((partner) => (
                    <article key={partner.id} className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
                      {partner.logoUrl && <img src={partner.logoUrl} alt={partner.logoAlt ?? ''} className="mb-4 max-h-16 max-w-full object-contain" loading="lazy" />}
                      <h3 className="font-bold">{partner.name}</h3>
                      {partner.description && <p className="mt-2 text-sm leading-6 text-slate-400">{partner.description}</p>}
                      {partner.websiteUrl && <a className="mt-3 inline-block text-sm font-semibold text-red-300 hover:text-white" href={partner.websiteUrl} target="_blank" rel="noopener noreferrer">{partner.websiteUrl}</a>}
                    </article>
                  ))}
                </div>
              </section>
            )}

            {collaborators.length > 0 && (
              <section>
                <h2 className="text-2xl font-bold">{content.partnersLabel}</h2>
                <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {collaborators.map((partner) => (
                    <article key={partner.id} className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
                      {partner.logoUrl && <img src={partner.logoUrl} alt={partner.logoAlt ?? ''} className="mb-4 max-h-16 max-w-full object-contain" loading="lazy" />}
                      <h3 className="font-bold">{partner.name}</h3>
                      {partner.description && <p className="mt-2 text-sm leading-6 text-slate-400">{partner.description}</p>}
                      {partner.websiteUrl && <a className="mt-3 inline-block text-sm font-semibold text-red-300 hover:text-white" href={partner.websiteUrl} target="_blank" rel="noopener noreferrer">{partner.websiteUrl}</a>}
                    </article>
                  ))}
                </div>
              </section>
            )}
          </section>
        )}

        {pillars.length > 0 && (
          <section className="mt-14 grid gap-5 sm:grid-cols-2" aria-label={settings.interface.societyInformationLabel}>
            {pillars.map((pillar, index) => (
              <article key={pillar.id} className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 sm:p-8">
                <span className="text-xs font-bold uppercase tracking-widest text-red-300">{String(index + 1).padStart(2, '0')}</span>
                <h2 className="mt-4 text-2xl font-bold">{pillar.title}</h2>
                <p className="mt-3 leading-7 text-slate-400">{pillar.description}</p>
              </article>
            ))}
          </section>
        )}

        {!hasProfileDetails && (
          <aside className="mt-12 rounded-2xl border border-white/10 bg-[#111827] p-6 sm:p-8">
            <h2 className="text-xl font-bold">{content.asideTitle}</h2>
            <p className="mt-3 leading-7 text-slate-400">{content.asideDescription}</p>
          </aside>
        )}
      </div>
    </main>
  )
}

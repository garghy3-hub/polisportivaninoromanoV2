import { createFileRoute } from '@tanstack/react-router'
import { localContentService } from '../lib/content-service'

export const Route = createFileRoute('/')({
  head: () => ({
    meta: [
      { title: localContentService.settings().site.title },
      { name: 'description', content: localContentService.settings().site.description },
    ],
  }),
  component: Home,
})

function Home() {
  const content = localContentService.settings().home
  const features = content.features.filter((feature) => feature.visible).slice().sort((a, b) => a.order - b.order)

  return (
    <main id="main-content" tabIndex={-1} className="min-h-screen overflow-hidden bg-[#080d1b] text-white">
      <section className="relative isolate">
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_78%_38%,rgba(28,75,139,0.28),transparent_42%),radial-gradient(ellipse_at_12%_82%,rgba(217,39,56,0.16),transparent_35%)]" />
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10 opacity-[0.12] [background-image:linear-gradient(rgba(255,255,255,.12)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.12)_1px,transparent_1px)] [background-size:56px_56px] [mask-image:linear-gradient(to_bottom,black,transparent_85%)]" />
        <div className="mx-auto grid max-w-7xl items-center gap-12 px-5 pb-24 pt-20 sm:px-8 sm:pt-28 lg:grid-cols-[1.05fr_.95fr] lg:gap-8 lg:pb-32 lg:pt-32">
          <div className="relative z-10">
            <p className="mb-7 inline-flex items-center gap-2 rounded-full border border-red-400/30 bg-red-500/10 px-4 py-2 text-[11px] font-bold uppercase tracking-[0.22em] text-red-200">
              <span className="h-2 w-2 rounded-full bg-[#ed4050] shadow-[0_0_14px_#ed4050]" /> {content.heroEyebrow}
            </p>
            <h1 className="max-w-3xl text-[clamp(3.4rem,8vw,6.8rem)] font-black leading-[.94] tracking-[-0.065em]">
              {content.heroTitle}<br /><span className="bg-gradient-to-r from-[#ff5968] to-[#d92738] bg-clip-text text-transparent">{content.heroAccent}</span>
            </h1>
            <p className="mt-8 max-w-xl text-base leading-8 text-slate-300 sm:text-lg">
              {content.heroDescription}
            </p>
            <div className="mt-10 flex flex-wrap gap-3">
              <a href={content.primaryActionHref} className="inline-flex items-center gap-3 rounded-full bg-[#d92738] px-6 py-3.5 text-sm font-bold shadow-lg shadow-red-950/40 transition hover:-translate-y-0.5 hover:bg-[#ef3d4d] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-red-300">
                {content.primaryActionLabel} <span aria-hidden="true">↗</span>
              </a>
              <a href={content.secondaryActionHref} className="inline-flex items-center gap-3 rounded-full border border-white/20 bg-white/[0.04] px-6 py-3.5 text-sm font-bold transition hover:border-white/40 hover:bg-white/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white">
                {content.secondaryActionLabel}
              </a>
            </div>
            <div className="mt-14 flex items-center gap-4 border-t border-white/10 pt-6">
              <div className="flex -space-x-2" aria-hidden="true">
                <span className="h-8 w-8 rounded-full border-2 border-[#080d1b] bg-[#d92738]" />
                <span className="h-8 w-8 rounded-full border-2 border-[#080d1b] bg-[#1d4e89]" />
                <span className="h-8 w-8 rounded-full border-2 border-[#080d1b] bg-slate-500" />
              </div>
              <p className="text-xs font-medium tracking-wide text-slate-400">{content.heroSocialProof}</p>
            </div>
          </div>

          <div className="relative mx-auto w-full max-w-[570px]">
            <div aria-hidden="true" className="absolute left-1/2 top-1/2 h-[78%] w-[78%] -translate-x-1/2 -translate-y-1/2 rounded-full bg-blue-500/20 blur-[85px]" />
            <div className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-gradient-to-br from-[#142541] via-[#101b30] to-[#111827] p-4 shadow-2xl shadow-black/50 sm:p-6">
              <div className="flex items-center justify-between px-2 pb-4">
                <span className="text-[10px] font-bold uppercase tracking-[0.28em] text-slate-400">{content.visualTopLabel}</span>
                <span className="rounded-full border border-red-300/25 bg-red-400/10 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-red-200">{content.visualTag}</span>
              </div>
              <div className="relative aspect-[1/1.03] overflow-hidden rounded-[1.4rem] border border-white/10 bg-[linear-gradient(145deg,#173b65,#102541_58%,#0d1a2e)]">
                <div aria-hidden="true" className="absolute inset-0 bg-[radial-gradient(circle_at_50%_30%,rgba(255,255,255,.12),transparent_48%)]" />
{content.visualImageUrl ? <img src={content.visualImageUrl} alt={content.visualImageAlt} className="absolute inset-0 h-full w-full object-cover" /> : (
                <svg viewBox="0 0 520 520" role="img" aria-labelledby="volley-art-title volley-art-desc" className="absolute inset-0 h-full w-full">
                  <title id="volley-art-title">{content.artworkTitle}</title>
                  <desc id="volley-art-desc">{content.artworkDescription}</desc>
                  <defs>
                    <linearGradient id="court" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#d92738"/><stop offset="1" stopColor="#8e1c35"/></linearGradient>
                    <radialGradient id="ball" cx="32%" cy="24%" r="80%"><stop offset="0" stopColor="#fff"/><stop offset=".7" stopColor="#dce7f3"/><stop offset="1" stopColor="#9eb4ca"/></radialGradient>
                    <clipPath id="ballClip"><circle cx="348" cy="205" r="91"/></clipPath>
                  </defs>
                  <g opacity=".18" stroke="#fff" strokeWidth="2" fill="none">
                    <path d="M25 350 L260 270 L495 350 L260 438 Z"/><path d="M25 350 L25 380 L260 468 L495 380 L495 350"/><path d="M260 270 V438"/><path d="M142 310 L142 399 M378 310 L378 399"/>
                  </g>
                  <path d="M45 326 L260 254 L475 326 L260 402 Z" fill="url(#court)" opacity=".9"/>
                  <path d="M45 326 L260 254 L475 326 L260 402 Z" fill="none" stroke="#fff" strokeWidth="3" opacity=".8"/>
                  <path d="M152 290 L367 362 M260 254 L260 402" stroke="#fff" strokeWidth="2" opacity=".75"/>
                  <g transform="translate(0 0)" opacity=".9">
                    <path d="M95 155 L425 155" stroke="#e9f1fb" strokeWidth="5"/>
                    {Array.from({ length: 17 }, (_, i) => <path key={i} d={`M${95 + i * 20.6} 155 V${245 + (i < 8 ? i * 1.1 : (16 - i) * 1.1)}`} stroke="#d7e3ef" strokeWidth="1.5" opacity=".65" />)}
                    <path d="M95 155 L95 253 M425 155 L425 253" stroke="#d7e3ef" strokeWidth="4"/>
                    {Array.from({ length: 6 }, (_, i) => <path key={i} d={`M95 ${171 + i * 14} H425`} stroke="#d7e3ef" strokeWidth="1.3" opacity=".55" />)}
                  </g>
                  <g clipPath="url(#ballClip)">
                    <circle cx="348" cy="205" r="91" fill="url(#ball)"/>
                    <path d="M265 137 C315 144 325 196 309 236 C298 264 280 278 261 286 L244 254 C272 222 273 179 245 158 Z" fill="#d92738"/>
                    <path d="M343 111 C376 151 400 177 437 180 L439 218 C392 225 354 192 329 133 Z" fill="#174c86"/>
                    <path d="M425 246 C382 245 360 272 349 302 L315 294 C322 246 361 211 422 210 Z" fill="#d92738"/>
                    <path d="M309 121 C326 157 318 194 286 218 M407 133 C381 168 383 205 411 237 M294 272 C335 250 376 259 397 293" fill="none" stroke="#7189a2" strokeWidth="5" opacity=".8"/>
                  </g>
                  <circle cx="348" cy="205" r="91" fill="none" stroke="#fff" strokeWidth="5"/>
                  <path d="M288 115 L408 295" stroke="#fff" strokeWidth="2" opacity=".16"/>
                </svg>
                )}
                <div className="absolute bottom-5 left-5 right-5 flex items-end justify-between">
                  <div><p className="text-[10px] font-bold uppercase tracking-[0.25em] text-red-200">{content.visualEyebrow}</p><p className="mt-1 text-2xl font-black tracking-tight sm:text-3xl">{content.visualTitle}</p></div>
                  <span className="text-5xl font-black tracking-tighter text-white/15">{content.visualMonogram}</span>
                </div>
              </div>
              <div className="flex items-center justify-between px-2 pt-4 text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-500">
                <span>{content.visualDescription}</span><span>{content.visualCounter}</span>
              </div>
            </div>
            <div className="absolute -bottom-5 -left-3 rounded-2xl border border-white/10 bg-[#111c30] px-5 py-4 shadow-xl sm:-left-7">
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">{content.brandColorsLabel}</p>
              <div className="mt-2 flex items-center gap-2"><span className="h-3 w-3 rounded-full bg-[#d92738]" /><span className="h-3 w-3 rounded-full bg-[#1d4e89]" /><span className="text-sm font-bold">{content.brandColorsDescriptor}</span></div>
            </div>
          </div>
        </div>
      </section>

      <section className="border-y border-white/10 bg-white/[0.025]">
        <div className="mx-auto grid max-w-7xl gap-8 px-5 py-14 sm:px-8 md:grid-cols-3 md:gap-10">
          {features.map((feature) => <article key={feature.id}><p className="text-xs font-bold uppercase tracking-[0.22em] text-red-300">{feature.eyebrow}</p><h2 className="mt-3 text-xl font-bold">{feature.title}</h2><p className="mt-3 text-sm leading-7 text-slate-400">{feature.description}</p></article>)}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-20 sm:px-8 lg:py-24">
        <div className="flex flex-col gap-8 md:flex-row md:items-end md:justify-between">
          <div className="max-w-2xl"><p className="text-xs font-bold uppercase tracking-[0.22em] text-red-300">{content.projectEyebrow}</p><h2 className="mt-4 text-4xl font-black tracking-tight sm:text-5xl">{content.projectTitle}</h2><p className="mt-6 text-base leading-8 text-slate-300">{content.projectDescription}</p></div>
          <a href={content.projectActionHref} className="inline-flex shrink-0 items-center gap-3 self-start rounded-full border border-white/20 px-5 py-3 text-sm font-bold transition hover:bg-white/10 md:self-auto">{content.projectActionLabel} <span aria-hidden="true">↗</span></a>
        </div>
      </section>

      <section className="relative overflow-hidden bg-gradient-to-r from-[#9f1d32] to-[#d92738]">
        <div aria-hidden="true" className="absolute -right-20 -top-32 h-80 w-80 rounded-full border-[48px] border-white/[0.07]" />
        <div className="relative mx-auto flex max-w-7xl flex-col gap-7 px-5 py-14 sm:px-8 md:flex-row md:items-center md:justify-between md:py-16">
          <div><p className="text-xs font-bold uppercase tracking-[0.22em] text-red-100">{content.closingEyebrow}</p><h2 className="mt-3 text-3xl font-black tracking-tight sm:text-4xl">{content.closingTitle}</h2><p className="mt-3 max-w-xl text-sm leading-7 text-red-100">{content.closingDescription}</p></div>
          <div className="flex flex-wrap gap-3"><a href={content.closingPrimaryHref} className="rounded-full bg-white px-5 py-3 text-sm font-bold text-[#9f1d32] transition hover:bg-red-50">{content.closingPrimaryLabel} ↗</a><a href={content.closingSecondaryHref} className="rounded-full border border-white/40 px-5 py-3 text-sm font-bold transition hover:bg-white/10">{content.closingSecondaryLabel}</a></div>
        </div>
      </section>
    </main>
  )
}

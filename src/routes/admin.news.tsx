import { createFileRoute, Link } from '@tanstack/react-router'
import { useState } from 'react'
import { slugifyEditorialTitle } from '../lib/editorial-slug'
import { isSafeEditorialImageUrl } from '../lib/editorial-media'
import { validateNewsDraft, type NewsDraftField } from '../lib/news-draft-validation'

export const Route = createFileRoute('/admin/news')({ component: NewsDraftWorkbench })

const fieldTargetIds: Record<NewsDraftField, string> = {
  title: 'news-title',
  slug: 'news-slug',
  category: 'news-category',
  excerpt: 'news-excerpt',
  body: 'news-body',
  seoTitle: 'seo-title',
  seoDescription: 'seo-description',
  imageUrl: 'news-image-url',
  imageAlt: 'news-image-alt',
}

const fieldLabels: Record<NewsDraftField, string> = {
  title: 'Titolo',
  slug: 'Slug',
  category: 'Categoria',
  excerpt: 'Sommario',
  body: 'Testo',
  seoTitle: 'Titolo SEO',
  seoDescription: 'Meta description',
  imageUrl: 'URL immagine',
  imageAlt: 'Testo alternativo',
}

function NewsDraftWorkbench() {
  const [title, setTitle] = useState('')
  const [slug, setSlug] = useState('')
  const [slugEdited, setSlugEdited] = useState(false)
  const [excerpt, setExcerpt] = useState('')
  const [body, setBody] = useState('')
  const [category, setCategory] = useState('')
  const [seoTitle, setSeoTitle] = useState('')
  const [seoDescription, setSeoDescription] = useState('')
  const [imageUrl, setImageUrl] = useState('')
  const [imageAlt, setImageAlt] = useState('')

  const draftIssues = validateNewsDraft({ title, slug, category, excerpt, body, seoTitle, seoDescription, imageUrl, imageAlt })
  const fieldMessage = (field: NewsDraftField) => draftIssues.find((issue) => issue.field === field)?.message
  const updateTitle = (value: string) => { setTitle(value); if (!slugEdited) setSlug(slugifyEditorialTitle(value)) }

  return (
    <main id="main-content" tabIndex={-1} className="min-h-screen bg-[#090d18] px-5 py-12 text-white sm:px-8">
      <div className="mx-auto max-w-7xl">
        <Link to="/admin" className="text-sm font-semibold text-red-300 hover:text-white">← Area amministrativa</Link>
        <header className="mt-10"><p className="text-sm font-bold uppercase tracking-[0.2em] text-red-300">News · workbench UI</p><h1 className="mt-3 text-4xl font-black tracking-tight sm:text-5xl">Editor articolo</h1><p className="mt-4 max-w-3xl leading-7 text-slate-300">Prototipo con anteprima in tempo reale. I dati sono temporanei: non vengono salvati, inviati o pubblicati.</p></header>
        <div className="mt-8 rounded-2xl border border-amber-300/30 bg-amber-300/10 p-5"><h2 className="font-bold text-amber-200">Modalità anteprima, nessun salvataggio</h2><p className="mt-2 text-sm leading-6 text-slate-300">Non inserire dati personali sensibili. Nessun backend o autenticazione è collegato.</p></div>
        <div className="mt-8 grid gap-8 lg:grid-cols-2">
          <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-6" aria-labelledby="fields-heading">
            <h2 id="fields-heading" className="text-xl font-bold">Contenuto</h2><div className="mt-6 grid gap-5">
              <div><label htmlFor="news-title" className="mb-2 block text-sm font-semibold">Titolo</label><input id="news-title" aria-invalid={Boolean(fieldMessage('title'))} aria-describedby={fieldMessage('title') ? 'news-title-error' : undefined} value={title} onChange={(e) => updateTitle(e.target.value)} maxLength={140} className="w-full rounded-xl border border-white/15 bg-slate-950 px-4 py-3 text-white outline-none focus:border-red-400" placeholder="Titolo dell'articolo" />{fieldMessage('title') && <p id="news-title-error" className="mt-1 text-sm text-rose-300">{fieldMessage('title')}</p>}<p className="mt-1 text-right text-xs text-slate-500">{title.length}/140</p></div>
              <div><label htmlFor="news-slug" className="mb-2 block text-sm font-semibold">Slug (URL)</label><input id="news-slug" aria-invalid={Boolean(fieldMessage('slug'))} aria-describedby={fieldMessage('slug') ? 'news-slug-error' : undefined} value={slug} onChange={(e) => { setSlug(slugifyEditorialTitle(e.target.value)); setSlugEdited(true) }} maxLength={160} className="w-full rounded-xl border border-white/15 bg-slate-950 px-4 py-3 text-white outline-none focus:border-red-400" placeholder="titolo-articolo" /><p className="mt-1 break-all text-xs text-slate-500">/news/{slug || 'slug-articolo'}</p><button type="button" className="mt-2 text-xs font-semibold text-red-300 underline" onClick={() => {setSlug(slugifyEditorialTitle(title));setSlugEdited(false)}}>Rigenera dallo titolo</button>{fieldMessage('slug') && <p id="news-slug-error" className="mt-1 text-sm text-rose-300">{fieldMessage('slug')}</p>}</div>
              <div><label htmlFor="news-category" className="mb-2 block text-sm font-semibold">Categoria</label><input id="news-category" aria-invalid={Boolean(fieldMessage('category'))} aria-describedby={fieldMessage('category') ? 'news-category-error' : undefined} value={category} onChange={(e) => setCategory(e.target.value)} maxLength={60} className="w-full rounded-xl border border-white/15 bg-slate-950 px-4 py-3 text-white outline-none focus:border-red-400" placeholder="Es. Prima squadra" />{fieldMessage('category') && <p id="news-category-error" className="mt-1 text-sm text-rose-300">{fieldMessage('category')}</p>}<p className="mt-1 text-right text-xs text-slate-500">{category.length}/60</p></div>
              <div><label htmlFor="news-excerpt" className="mb-2 block text-sm font-semibold">Sommario</label><textarea id="news-excerpt" aria-invalid={Boolean(fieldMessage('excerpt'))} aria-describedby={fieldMessage('excerpt') ? 'news-excerpt-error' : undefined} value={excerpt} onChange={(e) => setExcerpt(e.target.value)} maxLength={300} rows={3} className="w-full rounded-xl border border-white/15 bg-slate-950 px-4 py-3 text-white outline-none focus:border-red-400" placeholder="Breve introduzione" /><p className="mt-1 text-right text-xs text-slate-500">{excerpt.length}/300</p>{fieldMessage('excerpt') && <p id="news-excerpt-error" className="mt-1 text-sm text-rose-300">{fieldMessage('excerpt')}</p>}</div>
              <div className="rounded-xl border border-white/10 p-4"><h3 className="font-semibold">Immagine articolo (anteprima)</h3><div className="mt-4 grid gap-4"><div><label htmlFor="news-image-url" className="mb-2 block text-sm font-semibold">URL immagine</label><input id="news-image-url" aria-invalid={Boolean(fieldMessage('imageUrl'))} aria-describedby={fieldMessage('imageUrl') ? 'news-image-url-error' : undefined} value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} className="w-full rounded-xl border border-white/15 bg-slate-950 px-4 py-3 text-white outline-none focus:border-red-400" placeholder="https://..." />{fieldMessage('imageUrl') && <p id="news-image-url-error" className="mt-1 text-sm text-rose-300">{fieldMessage('imageUrl')}</p>}</div><div><label htmlFor="news-image-alt" className="mb-2 block text-sm font-semibold">Testo alternativo (alt)</label><input id="news-image-alt" aria-invalid={Boolean(fieldMessage('imageAlt'))} aria-describedby={fieldMessage('imageAlt') ? 'news-image-alt-error' : undefined} value={imageAlt} onChange={(e) => setImageAlt(e.target.value)} maxLength={200} className="w-full rounded-xl border border-white/15 bg-slate-950 px-4 py-3 text-white outline-none focus:border-red-400" placeholder="Descrizione dell'immagine" />{fieldMessage('imageAlt') && <p id="news-image-alt-error" className="mt-1 text-sm text-rose-300">{fieldMessage('imageAlt')}</p>}<p className="mt-1 text-right text-xs text-slate-500">{imageAlt.length}/200</p></div></div></div>
              <div><label htmlFor="news-body" className="mb-2 block text-sm font-semibold">Testo</label><textarea id="news-body" aria-invalid={Boolean(fieldMessage('body'))} aria-describedby={fieldMessage('body') ? 'news-body-error' : undefined} value={body} onChange={(e) => setBody(e.target.value)} maxLength={20000} rows={10} className="w-full rounded-xl border border-white/15 bg-slate-950 px-4 py-3 text-white outline-none focus:border-red-400" placeholder="Corpo dell'articolo..." />{fieldMessage('body') && <p id="news-body-error" className="mt-1 text-sm text-rose-300">{fieldMessage('body')}</p>}<p className="mt-1 text-right text-xs text-slate-500">{body.length}/20000</p></div>
            </div>
            <div className="mt-8 border-t border-white/10 pt-6"><h2 className="text-xl font-bold">SEO</h2><div className="mt-4 grid gap-5"><div><label htmlFor="seo-title" className="mb-2 block text-sm font-semibold">Titolo SEO</label><input id="seo-title" aria-invalid={Boolean(fieldMessage('seoTitle'))} aria-describedby={fieldMessage('seoTitle') ? 'seo-title-error' : undefined} value={seoTitle} onChange={(e) => setSeoTitle(e.target.value)} maxLength={70} className="w-full rounded-xl border border-white/15 bg-slate-950 px-4 py-3 text-white outline-none focus:border-red-400" placeholder="Titolo per i motori di ricerca" /><p className="mt-1 text-right text-xs text-slate-500">{seoTitle.length}/70</p>{fieldMessage('seoTitle') && <p id="seo-title-error" className="mt-1 text-sm text-rose-300">{fieldMessage('seoTitle')}</p>}</div><div><label htmlFor="seo-description" className="mb-2 block text-sm font-semibold">Meta description</label><textarea id="seo-description" aria-invalid={Boolean(fieldMessage('seoDescription'))} aria-describedby={fieldMessage('seoDescription') ? 'seo-description-error' : undefined} value={seoDescription} onChange={(e) => setSeoDescription(e.target.value)} maxLength={160} rows={3} className="w-full rounded-xl border border-white/15 bg-slate-950 px-4 py-3 text-white outline-none focus:border-red-400" placeholder="Descrizione per i motori di ricerca" /><p className="mt-1 text-right text-xs text-slate-500">{seoDescription.length}/160</p>{fieldMessage('seoDescription') && <p id="seo-description-error" className="mt-1 text-sm text-rose-300">{fieldMessage('seoDescription')}</p>}</div></div></div>
            <div className="mt-6 rounded-xl border border-white/10 p-4" aria-live="polite"><h3 className="font-semibold">Controllo campi richiesti</h3>{draftIssues.length ? <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-amber-200">{draftIssues.map((issue, index) => <li key={`${issue.field}-${index}`}><a href={`#${fieldTargetIds[issue.field]}`} className="underline decoration-amber-200/50 underline-offset-2 hover:text-white focus-visible:rounded focus-visible:outline focus-visible:outline-2 focus-visible:outline-amber-200">{fieldLabels[issue.field]}: {issue.message}</a></li>)}</ul> : <p className="mt-2 text-sm text-emerald-300">Controlli locali superati (non equivale a validazione server o salvataggio).</p>}</div>
          </section>
          <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-6" aria-labelledby="preview-heading"><h2 id="preview-heading" className="text-xl font-bold">Anteprima</h2><article className="mt-6 overflow-hidden rounded-2xl border border-white/10 bg-slate-950">{imageUrl.trim() && isSafeEditorialImageUrl(imageUrl) && <img src={imageUrl.trim()} alt={imageAlt} className="max-h-96 w-full object-cover" /> }<div className="border-b border-white/10 bg-gradient-to-br from-red-500/20 to-white/[0.02] p-8"><p className="text-xs font-bold uppercase tracking-widest text-red-300">{category || 'Categoria'}</p><h3 className="mt-4 break-words text-3xl font-black">{title || 'Titolo dell’articolo'}</h3><p className="mt-4 whitespace-pre-wrap break-words leading-7 text-slate-300">{excerpt || 'Il sommario apparirà qui.'}</p></div><div className="p-8"><p className="whitespace-pre-wrap break-words leading-8 text-slate-300">{body || 'Il testo completo dell’articolo apparirà qui.'}</p></div></article><div className="mt-6 rounded-xl border border-white/10 p-4"><h3 className="font-semibold">Snippet SEO simulato</h3><p className="mt-2 text-sm text-emerald-300">{seoTitle || title || 'Titolo articolo'}</p><p className="mt-1 break-all text-xs text-slate-400">/news/{slug || 'slug-articolo'}</p><p className="mt-2 text-sm text-slate-300">{seoDescription || excerpt || 'Descrizione articolo'}</p></div></section>
        </div>
      </div>
    </main>
  )
}

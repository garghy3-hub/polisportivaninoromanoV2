import { isSafeEditorialImageUrl } from './editorial-media'

export interface NewsDraftInput {
  title: string
  slug: string
  category: string
  excerpt: string
  body: string
  seoTitle: string
  seoDescription: string
  imageUrl: string
  imageAlt: string
}

export type NewsDraftField = keyof NewsDraftInput

export interface NewsDraftIssue {
  field: NewsDraftField
  message: string
}

/** Client-side convenience checks only; the future server must validate again. */
export function validateNewsDraft(input: NewsDraftInput): NewsDraftIssue[] {
  const issues: NewsDraftIssue[] = []
  const required: Array<[NewsDraftField, string, number]> = [
    ['title', 'Inserisci il titolo.', 140],
    ['slug', 'Inserisci lo slug.', 160],
    ['category', 'Seleziona o inserisci una categoria.', 60],
    ['excerpt', 'Inserisci il sommario.', 300],
    ['body', 'Inserisci il testo dell’articolo.', 20000],
  ]

  for (const [field, message, max] of required) {
    const value = input[field]
    if (!value.trim()) issues.push({ field, message })
    if (value.length > max) issues.push({ field, message: `Massimo ${max} caratteri.` })
  }

  if (input.slug && !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(input.slug)) {
    issues.push({ field: 'slug', message: 'Usa solo lettere minuscole, numeri e trattini.' })
  }
  if (input.seoTitle.length > 70) issues.push({ field: 'seoTitle', message: 'Massimo 70 caratteri.' })
  if (input.seoDescription.length > 160) issues.push({ field: 'seoDescription', message: 'Massimo 160 caratteri.' })
  if (input.imageAlt.length > 200) issues.push({ field: 'imageAlt', message: 'Massimo 200 caratteri.' })
  if (input.imageUrl.trim() && !isSafeEditorialImageUrl(input.imageUrl)) {
    issues.push({ field: 'imageUrl', message: 'Inserisci un URL HTTP o HTTPS valido.' })
  }
  if (input.imageUrl.trim() && !input.imageAlt.trim()) {
    issues.push({ field: 'imageAlt', message: 'Descrivi l’immagine con un testo alternativo.' })
  }
  return issues
}

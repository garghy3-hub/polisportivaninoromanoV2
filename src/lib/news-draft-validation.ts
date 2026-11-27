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
export function validateNewsDraft(input: NewsDraftInput, allowedCategories?: readonly string[]): NewsDraftIssue[] {
  const fields: NewsDraftField[] = [
    'title', 'slug', 'category', 'excerpt', 'body',
    'seoTitle', 'seoDescription', 'imageUrl', 'imageAlt',
  ]
  if (!input || typeof input !== 'object' || Array.isArray(input)) {
    return fields.map(field => ({ field, message: 'Valore non valido.' }))
  }

  const issues: NewsDraftIssue[] = []
  const values = input as unknown as Record<string, unknown>
  const strings = new Map<NewsDraftField, string>()

  for (const field of fields) {
    const value = values[field]
    if (typeof value !== 'string') {
      issues.push({ field, message: 'Inserisci un valore testuale valido.' })
    } else {
      strings.set(field, value)
    }
  }

  const required: Array<[NewsDraftField, string, number]> = [
    ['title', 'Inserisci il titolo.', 140],
    ['slug', 'Inserisci lo slug.', 160],
    ['category', 'Seleziona o inserisci una categoria.', 60],
    ['excerpt', 'Inserisci il sommario.', 300],
    ['body', 'Inserisci il testo dell’articolo.', 20000],
  ]

  for (const [field, message, max] of required) {
    const value = strings.get(field)
    if (value === undefined) continue
    if (!value.trim()) issues.push({ field, message })
    if (value.length > max) issues.push({ field, message: `Massimo ${max} caratteri.` })
  }

  const category = strings.get('category')
  if (allowedCategories && category?.trim() && !allowedCategories.includes(category)) {
    issues.push({ field: 'category', message: 'Seleziona una categoria tra quelle configurate.' })
  }

  const slug = strings.get('slug')
  if (slug && !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) {
    issues.push({ field: 'slug', message: 'Usa solo lettere minuscole, numeri e trattini.' })
  }

  const seoTitle = strings.get('seoTitle')
  if (seoTitle !== undefined && seoTitle.length > 70) issues.push({ field: 'seoTitle', message: 'Massimo 70 caratteri.' })
  const seoDescription = strings.get('seoDescription')
  if (seoDescription !== undefined && seoDescription.length > 160) issues.push({ field: 'seoDescription', message: 'Massimo 160 caratteri.' })

  const imageAlt = strings.get('imageAlt')
  if (imageAlt !== undefined && imageAlt.length > 200) issues.push({ field: 'imageAlt', message: 'Massimo 200 caratteri.' })
  const imageUrl = strings.get('imageUrl')
  if (imageUrl !== undefined && imageUrl.length > 2048) issues.push({ field: 'imageUrl', message: 'Massimo 2048 caratteri.' })
  if (imageUrl?.trim() && !isSafeEditorialImageUrl(imageUrl) && !/^indexeddb-media:[a-zA-Z0-9-]+$/.test(imageUrl.trim())) {
    issues.push({ field: 'imageUrl', message: 'Inserisci un URL HTTP o HTTPS valido.' })
  }
  if (imageUrl?.trim() && !imageAlt?.trim()) {
    issues.push({ field: 'imageAlt', message: 'Descrivi l’immagine con un testo alternativo.' })
  }

  return issues
}

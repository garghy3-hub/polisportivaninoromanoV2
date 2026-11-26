import { describe, expect, it } from 'vitest'
import { validateNewsDraft, type NewsDraftInput } from '../src/lib/news-draft-validation'

const validDraft: NewsDraftInput = {
  title: 'Una notizia',
  slug: 'una-notizia',
  category: 'official',
  excerpt: 'Un breve sommario.',
  body: 'Testo completo della notizia.',
  seoTitle: '',
  seoDescription: '',
  imageUrl: '',
  imageAlt: '',
}

describe('validateNewsDraft', () => {
  it('accepts a complete draft without optional metadata', () => {
    expect(validateNewsDraft(validDraft)).toEqual([])
  })

  it('reports all missing required fields', () => {
    const issues = validateNewsDraft({ ...validDraft, title: '', slug: '', category: '', excerpt: '', body: '' })
    expect(issues.map((issue) => issue.field)).toEqual(['title', 'slug', 'category', 'excerpt', 'body'])
  })

  it('rejects malformed slugs and overlong SEO fields', () => {
    const issues = validateNewsDraft({ ...validDraft, slug: 'Titolo non valido', seoTitle: 'x'.repeat(71), seoDescription: 'x'.repeat(161) })
    expect(issues.map((issue) => issue.field)).toEqual(['slug', 'seoTitle', 'seoDescription'])
  })

  it('requires alternative text when an image is supplied', () => {
    const issues = validateNewsDraft({ ...validDraft, imageUrl: 'https://example.com/cover.jpg' })
    expect(issues).toContainEqual({ field: 'imageAlt', message: 'Descrivi l’immagine con un testo alternativo.' })
  })

  it('rejects unsafe image URLs', () => {
    const issues = validateNewsDraft({ ...validDraft, imageUrl: 'javascript:alert(1)' })
    expect(issues.some((issue) => issue.field === 'imageUrl')).toBe(true)
  })
})

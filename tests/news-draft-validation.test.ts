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

  it('rejects categories that are not configured', () => {
    const issues = validateNewsDraft({ ...validDraft, category: 'not-configured' }, ['official', 'youth'])
    expect(issues).toContainEqual({ field: 'category', message: 'Seleziona una categoria tra quelle configurate.' })
  })

  it('accepts a category present in the configured list', () => {
    expect(validateNewsDraft({ ...validDraft, category: 'official' }, ['official', 'youth'])).toEqual([])
  })

  it('rejects malformed slugs and overlong SEO fields', () => {
    const issues = validateNewsDraft({ ...validDraft, slug: 'Titolo non valido', seoTitle: 'x'.repeat(71), seoDescription: 'x'.repeat(161) })
    expect(issues.map((issue) => issue.field)).toEqual(['slug', 'seoTitle', 'seoDescription'])
  })

  it('requires alternative text when an image is supplied', () => {
    const issues = validateNewsDraft({ ...validDraft, imageUrl: 'https://example.com/cover.jpg' })
    expect(issues).toContainEqual({ field: 'imageAlt', message: 'Descrivi l’immagine con un testo alternativo.' })
  })

  it('rejects image URLs longer than 2048 characters', () => {
    const issues = validateNewsDraft({ ...validDraft, imageUrl: 'https://example.com/' + 'x'.repeat(2048) })
    expect(issues).toContainEqual({ field: 'imageUrl', message: 'Massimo 2048 caratteri.' })
  })

  it('rejects unsafe image URLs', () => {
    const issues = validateNewsDraft({ ...validDraft, imageUrl: 'javascript:alert(1)' })
    expect(issues.some((issue) => issue.field === 'imageUrl')).toBe(true)
  })
  it('treats whitespace-only required fields as missing', () => {
    const issues = validateNewsDraft({ ...validDraft, title: '   ', category: '\n', excerpt: '  ', body: '\t' })
    expect(issues.map((issue) => issue.field)).toEqual(['title', 'category', 'excerpt', 'body'])
  })

  it('enforces maximum lengths on required content fields', () => {
    const issues = validateNewsDraft({
      ...validDraft,
      title: 't'.repeat(141),
      category: 'c'.repeat(61),
      excerpt: 'e'.repeat(301),
      body: 'b'.repeat(20001),
    })
    expect(issues.map((issue) => issue.field)).toEqual(['title', 'category', 'excerpt', 'body'])
  })

  it('accepts required fields exactly at their maximum lengths', () => {
    const issues = validateNewsDraft({
      ...validDraft,
      title: 't'.repeat(140),
      category: 'c'.repeat(60),
      excerpt: 'e'.repeat(300),
      body: 'b'.repeat(20000),
    })
    expect(issues).toEqual([])
  })

  it('rejects alternative text longer than 200 characters', () => {
    const issues = validateNewsDraft({ ...validDraft, imageUrl: 'https://example.com/cover.jpg', imageAlt: 'a'.repeat(201) })
    expect(issues).toContainEqual({ field: 'imageAlt', message: 'Massimo 200 caratteri.' })
  })

  it('requires non-whitespace alternative text for an image', () => {
    const issues = validateNewsDraft({
      ...validDraft,
      imageUrl: 'https://example.com/cover.jpg',
      imageAlt: '   ',
    })
    expect(issues.some((issue) => issue.field === 'imageAlt')).toBe(true)
  })

})

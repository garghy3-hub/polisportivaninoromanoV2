import { describe, expect, it } from 'vitest'
import { slugifyEditorialTitle } from '../src/lib/editorial-slug'

describe('slugifyEditorialTitle', () => {
  it('converts Italian accented text and punctuation', () => {
    expect(slugifyEditorialTitle('È una grande vittoria!')).toBe('e-una-grande-vittoria')
  })
  it('collapses whitespace and punctuation', () => {
    expect(slugifyEditorialTitle('  Volley   -  Milazzo / Sicilia  ')).toBe('volley-milazzo-sicilia')
  })
  it('returns an empty string for punctuation only', () => {
    expect(slugifyEditorialTitle('!!!')).toBe('')
  })
  it('preserves ordinary ascii letters and digits', () => {
    expect(slugifyEditorialTitle('Finale 3-0')).toBe('finale-3-0')
  })
})

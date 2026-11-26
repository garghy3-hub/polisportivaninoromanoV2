import { describe, expect, it } from 'vitest'
import { isSafeEditorialImageUrl } from '../src/lib/editorial-media'

describe('isSafeEditorialImageUrl', () => {
  it('accepts empty input and http(s) URLs', () => {
    expect(isSafeEditorialImageUrl('')).toBe(true)
    expect(isSafeEditorialImageUrl('https://example.com/image.jpg')).toBe(true)
    expect(isSafeEditorialImageUrl('http://example.com/image.jpg')).toBe(true)
  })
  it('rejects invalid URLs and non-http schemes', () => {
    expect(isSafeEditorialImageUrl('not a url')).toBe(false)
    expect(isSafeEditorialImageUrl('javascript:alert(1)')).toBe(false)
    expect(isSafeEditorialImageUrl('data:image/png;base64,abc')).toBe(false)
  })
})

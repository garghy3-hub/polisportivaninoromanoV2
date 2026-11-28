import type { StandardPageContent } from './content-types'

/** Build page-level SEO and social metadata from editable page settings. */
export function getPageHead(content: StandardPageContent) {
  const title = content.seoTitle
  const description = content.seoDescription
  const image = content.socialImageUrl

  return {
    meta: [
      { title },
      { name: 'description', content: description },
      { property: 'og:title', content: title },
      { property: 'og:description', content: description },
      { name: 'twitter:title', content: title },
      { name: 'twitter:description', content: description },
      { name: 'twitter:card', content: image ? 'summary_large_image' : 'summary' },
      ...(image ? [{ property: 'og:image', content: image }] : []),
      ...(content.socialImageAlt ? [{ property: 'og:image:alt', content: content.socialImageAlt }] : []),
    ],
    links: content.canonicalUrl ? [{ rel: 'canonical', href: content.canonicalUrl }] : [],
  }
}

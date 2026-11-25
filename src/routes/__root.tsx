import { createRootRoute, HeadContent, Outlet, Scripts } from '@tanstack/react-router'
import '../styles.css'

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { title: 'Polisportiva Nino Romano | Milazzo' },
      { name: 'description', content: 'Sito ufficiale della Polisportiva Nino Romano di Milazzo.' },
    ],
  }),
  component: RootComponent,
})

function RootComponent() {
  return (
    <html lang="it">
      <head><HeadContent /></head>
      <body>
        <Outlet />
        <Scripts />
      </body>
    </html>
  )
}
import { createRouter } from '@tanstack/react-router'
import { routeTree } from './routeTree.gen'

export const createRouter = () => createRouterWithTree({ routeTree })

import { createRouter as createRouterWithTree } from '@tanstack/react-router'

declare module '@tanstack/react-router' {
  interface Register {
    router: ReturnType<typeof createRouter>
  }
}
import type { RouteObject } from 'react-router'
import { DeposerPage } from '../features/annonces/DeposerPage'
import { HomePage } from '../pages/HomePage'
import { RootLayout } from '../shared/layout/RootLayout'

/** Shared by the browser router (app) and memory routers (tests). */
export const routes: RouteObject[] = [
  {
    path: '/',
    Component: RootLayout,
    children: [
      { index: true, Component: HomePage },
      { path: 'deposer', Component: DeposerPage },
    ],
  },
]

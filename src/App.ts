// src/App.ts
import { Lightning as L, Router } from '@lightningjs/sdk'
import { Theme } from './core/theme'
import Home from './pages/Home'
import Player from './pages/Player'
import New from './pages/New'

// 👇 clau: heretar del Router.App (usa (Router as any) per compat versions)
export default class App extends (Router as any).App {
  static _template(): L.Component.Template<any> {
    return {
      w: Theme.w,
      h: Theme.h,
      color: Theme.colors.bg,
      rect: true,
      Pages: {}, // requerit pel Router
      Widgets: {}, // requerit pel Router
    }
  }

  _setup() {
    ;(Router.startRouter as any)({
      appInstance: this, // ja és un Router.App
      root: 'home',
      routes: [
        { path: 'home', component: Home as any },
        { path: 'player', component: Player as any },
        { path: 'new', component: New as any },
        { path: '*', redirect: 'home' },
      ],
    })
  }
}

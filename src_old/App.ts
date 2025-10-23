import { Lightning, Utils } from '@lightningjs/sdk'
import { Button } from './Button'
import { HomePage } from './Pages/HomePage'
import { InstructionsPage } from './Pages/InstructionsPage'
import { PlayerPage } from './Pages/PlayerPage'

interface AppTemplateSpec extends Lightning.Component.TemplateSpec {
  Pages: {
    Home: typeof HomePage
    Player: typeof PlayerPage
    Instructions: typeof InstructionsPage
  }
  UI: {
    HomeButton: typeof Button
    PlayButton: typeof Button
    InstructionsButton: typeof Button
  }
}

type RouteName = 'Home' | 'Instructions' | 'Player'

export const ROUTES = {
  HOME: 'Home',
  PLAYER: 'Player',
  INSTRUCTIONS: 'Instructions',
} as const

export class App
  extends Lightning.Component<AppTemplateSpec>
  implements Lightning.Component.ImplementTemplateSpec<AppTemplateSpec>
{
  private _route: RouteName = 'Home'
  private _params: Record<string, any> | undefined

  get UI() {
    return this.tag('UI')
  }

  get Pages() {
    return this.tag('Pages')
  }

  private _buttons = ['HomeButton', 'PlayButton', 'InstructionsButton']
  private _index = 0

  static override _template(): Lightning.Component.Template<AppTemplateSpec> {
    return {
      w: 1920,
      h: 1080,
      Pages: {
        Home: { type: HomePage },
        Player: {
          type: PlayerPage,
          alpha: 0,
          visible: false,
          signals: { onBackFromPlayer: 'onBackFromPlayer' },
        },
        Instructions: { type: InstructionsPage, alpha: 0, visible: false },
      },
      // Ejemplo: dos botones para navegar (puedes usar tus propios Button)
      UI: {
        HomeButton: {
          type: Button,
          label: 'Home',
          x: 100,
          y: 500,
          mount: 0,
          signals: { pressed: 'onPlay' },
        },
        PlayButton: {
          type: Button,
          label: 'Play',
          x: 100,
          y: 650,
          mount: 0,
          signals: { pressed: 'onPlayButton' },
        },
        InstructionsButton: {
          type: Button,
          label: 'Instructions',
          x: 100,
          y: 800,
          mount: 0,
          signals: { pressed: 'onInstructions' },
        },
      },
    }
  }

  onBackFromPlayer() {
    this.navigate(ROUTES.HOME, { id: 0 })
    this['_index'] = 0
    this._refocus()
  }

  onButtonPressed(payload: { label?: string }, sender: Lightning.Component) {
    console.log('[App] pressed!', payload, sender)
  }

  static getFonts() {
    return [
      {
        family: 'Regular',
        url: Utils.asset('fonts/Roboto-Regular.ttf') as string,
      },
    ]
  }

  override _handleEnter() {
    console.log('[App] _handleEnter')
    return
  }

  override _init() {
    console.log('[App] _init')
    this.Pages?.tag('Home')?.onParams?.({ id: 0 })
  }

  override _handleUp() {
    if (this._index > 0) {
      this._index--
      return true
    }
    return false
  }

  override _handleDown() {
    if (this._index < 2) {
      this._index++
      return true
    }
    return false
  }

  override _getFocused() {
    if (this._route === 'Player') {
      return this.Pages?.tag('Player')
    }
    return this.UI?.tag(this._buttons[this._index] as any)
  }

  // 👉 petit helper per fer el canvi de pàgina
  navigate(to: RouteName, params?: any) {
    console.log(`[App] navigate ${this._route} -> ${to}`)
    const from = this._route
    if (from === to) return
    this._route = to

    const hide = this.Pages?.tag(from)
    hide?.setSmooth('alpha', 0, { duration: 0.2 })
    setTimeout(() => hide?.patch({ visible: false }), 200)

    const show = this.Pages?.tag(to)
    show?.patch({ visible: true })
    show?.setSmooth('alpha', 1, { duration: 0.2 })
    show?.onParams?.(params)

    if (to === 'Player') {
      this.tag('UI')?.patch({ visible: false, alpha: 0 })
    } else {
      this.tag('UI')?.patch({ visible: true, alpha: 1 })
    }

    this._refocus()
  }

  onPlay() {
    console.log('[App] onPlay')
    this.navigate(ROUTES.HOME, { id: 0 })
  }

  onPlayButton() {
    console.log('[App] onPlayButton')
    this.navigate(ROUTES.PLAYER, { id: 0 })
  }

  onInstructions() {
    console.log('[App] onInstructions')
    this.navigate(ROUTES.INSTRUCTIONS, { id: 1 })
  }
}

// src/pages/Player.ts
import { Lightning as L, VideoPlayer } from '@lightningjs/sdk'
import { Theme } from '../core/theme'
import { Button } from '../atoms/Button'

export default class Player extends L.Component {
  private _paused = true

  static override _template(): L.Component.Template<any> {
    return {
      rect: true,
      color: 0xff000000,
      w: Theme.w,
      h: Theme.h,
      Controls: {
        x: 32,
        y: Theme.h - 140,
        PlayPause: { type: Button, label: 'Play' },
        Back: { x: 280, type: Button, label: 'Back' },
      },
      Hint: {
        x: 32,
        y: 32,
        text: { text: 'Player · ←/→ seek · Enter play/pause · Back', fontSize: 22 },
      },
    }
  }

  override _setup() {
    VideoPlayer.consumer(this)
  }
  override _getFocused() {
    return this.tag('Controls.PlayPause')
  }

  override _handleEnter() {
    this._toggle()
  }
  override _handleBack() {
    ;(this as any).application?.$router?.back()
  }
  override _handleLeft() {
    VideoPlayer.seek(VideoPlayer.currentTime - 10)
  }
  override _handleRight() {
    VideoPlayer.seek(VideoPlayer.currentTime + 10)
  }

  private _toggle() {
    this._paused = !this._paused
    if (this._paused) VideoPlayer.pause()
    else
      VideoPlayer.play()(this.tag('Controls.PlayPause') as Button)?.patch({
        label: this._paused ? 'Play' : 'Pause',
      } as any)
  }
}

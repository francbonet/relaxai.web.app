import { Lightning, Settings, Utils, VideoPlayer } from '@lightningjs/sdk'

type Ms = number
type FocusKey = 'BackBtn' | 'PlayPause' | 'Progress'
const FOCUS_ORDER: FocusKey[] = ['BackBtn', 'PlayPause', 'Progress']

export class PlayerPage extends Lightning.Component {
  private _hideTimer?: number
  private _tickTimer?: number
  private _isTexture = false

  // focus intern
  private _controlsVisible = false
  private _focusIndex = 1 // Play/Pause per defecte

  // ★ estat de “scrub mode” per a la barra
  private _scrubbing = false
  private _scrubPct = 0 // 0..1
  private _wasPlayingBeforeScrub = false

  static override _template() {
    return {
      Poster: { w: 1920, h: 1080, src: Utils.asset('images/background.png'), visible: true },

      Controls: {
        alpha: 0,
        OverlayBg: { rect: true, w: 1920, h: 200, y: 880, x: 0, color: 0x88000000 },
        Title: { x: 60, y: 130, text: { text: 'Now Playing', fontSize: 48 } },
        BackBtn: {
          x: 60,
          y: 60,
          rect: true,
          w: 120,
          h: 50,
          color: 0xff1f1f1f,
          Label: { x: 16, y: 12, text: { text: 'Back', fontSize: 22 } },
        },

        PlayPause: {
          x: 60,
          y: 950,
          rect: true,
          w: 120,
          h: 60,
          color: 0xff1f1f1f,
          Label: { x: 16, y: 16, text: { text: 'Play', fontSize: 22 } },
        },

        Progress: {
          x: 200,
          y: 970,
          Track: { rect: true, w: 1920 - 380, h: 8, color: 0x44ffffff },
          Fill: { rect: true, w: 0, h: 8, color: 0xffffffff },
          Times: { x: 0, y: 14, text: { text: '00:00 / 00:00', fontSize: 18 } },
          Glow: {
            rect: true,
            x: -6,
            y: -6,
            w: (w: number) => w - 368 + 12,
            h: 20 + 12,
            alpha: 0,
            color: 0x22ffffff,
          },
          // ★ indicador de “thumb” de scrubbing
          Thumb: { rect: true, w: 6, h: 18, y: -5, x: 0, color: 0xffffffff, alpha: 0 },
        },
      },
    }
  }

  // getters
  get Poster() {
    return this.tag('Poster')
  }
  get Controls() {
    return this.tag('Controls')
  }
  get BackBtn() {
    return this.tag('Controls.BackBtn')
  }
  get PlayPause() {
    return this.tag('Controls.PlayPause')
  }
  get Progress() {
    return this.tag('Controls.Progress')
  }
  get ProgressTrack() {
    return this.tag('Controls.Progress.Track')
  }
  get ProgressFill() {
    return this.tag('Controls.Progress.Fill')
  }
  get ProgressTimes() {
    return this.tag('Controls.Progress.Times') as Lightning.Element
  }
  get ProgressGlow() {
    return this.tag('Controls.Progress.Glow')
  }
  get ProgressThumb() {
    return this.tag('Controls.Progress.Thumb')
  }

  override _init() {
    this._isTexture = !!Settings.get('platform', 'textureMode', false)
    VideoPlayer.consumer(this)
    if (!this._isTexture) {
      VideoPlayer.position(0, 0)
      VideoPlayer.size(1920, 1080)
      VideoPlayer.show()
    }
  }

  override _active() {
    this.tag('Controls.Title').text = { text: 'Now Playing' }
    this.play('https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4')
  }

  // focus de pàgina
  override _getFocused() {
    return this
  }
  override _focus() {
    this._applyPageFocus()
  }
  override _unfocus() {
    this._applyPageFocus()
  }

  private _applyPageFocus() {
    this._applyItemFocus()
  }

  // ── Reproductor ──────────────────────────────────────────────────────────
  play(url: string) {
    // VideoPlayer.mute(true)
    setTimeout(() => {
      VideoPlayer.open(url)
      VideoPlayer.play()
      setTimeout(() => {
        if (!(VideoPlayer as any).playing) VideoPlayer.play()
      }, 1000)
    }, 0)

    this._startTick()
    this._showControls(true)
  }
  pause() {
    VideoPlayer.pause()
  }

  // ★ sortida fiable (Back)
  private _exitPlayer() {
    this._clearTimers()
    try {
      ;(VideoPlayer as any).stop?.()
    } catch {
      /* empty */
    }
    try {
      VideoPlayer.close()
    } catch {
      /* empty */
    }
    this.signal('onBackFromPlayer')
  }

  stop() {
    this._exitPlayer()
  }

  override _disable() {
    this._clearTimers()
    try {
      ;(VideoPlayer as any).stop?.()
    } catch {
      /* empty */
    }
    try {
      VideoPlayer.close()
    } catch {
      /* empty */
    }
  }

  // ── Events player ────────────────────────────────────────────────────────
  $videoPlayerPlaying() {
    this.Poster.visible = false
    this._autoHideSoon()
  }
  $videoPlayerPause() {
    this._showControls()
  }
  $videoPlayerWaiting() {
    this._showControls()
  }
  $videoPlayerStop() {
    this.Poster.visible = true
    this._showControls()
  }
  $videoPlayerEnded() {
    this.Poster.visible = true
    this._showControls()
  }
  $videoPlayerError() {
    this.Poster.visible = true
    this._showControls()
  }

  // ── Tecles ───────────────────────────────────────────────────────────────
  private _ensureControlsShown(): boolean {
    if (!this._controlsVisible) {
      this._showControls()
      return true
    }
    return false
  }

  override _handleEnter() {
    // si està oculta, només mostrar
    if (this._ensureControlsShown()) return true

    const key = FOCUS_ORDER[this._focusIndex]

    if (key === 'BackBtn') {
      this._exitPlayer()
      return true
    }

    if (key === 'PlayPause') {
      const playing = !!(VideoPlayer as any).playing
      playing ? VideoPlayer.pause() : VideoPlayer.play()
      this._autoHideSoon()
      return true
    }

    if (key === 'Progress') {
      // ★ toggle scrubbing
      if (!this._scrubbing) this._enterScrubMode()
      else this._commitScrub()
      return true
    }

    return false
  }

  override _handleBack() {
    // ★ si estem scrubbing, cancel·lar primer
    if (this._scrubbing) {
      this._cancelScrub()
      return true
    }
    this._exitPlayer()
    return true
  }

  override _handleLeft() {
    if (this._ensureControlsShown()) return true

    if (this._scrubbing && FOCUS_ORDER[this._focusIndex] === 'Progress') {
      this._nudgeScrub(-1)
      return true
    }

    if (this._focusIndex > 0) {
      this._focusIndex--
      this._applyItemFocus()
    }
    this._autoHideSoon()
    return true
  }

  override _handleRight() {
    if (this._ensureControlsShown()) return true

    if (this._scrubbing && FOCUS_ORDER[this._focusIndex] === 'Progress') {
      this._nudgeScrub(+1)
      return true
    }

    if (this._focusIndex < FOCUS_ORDER.length - 1) {
      this._focusIndex++
      this._applyItemFocus()
    }
    this._autoHideSoon()
    return true
  }

  override _handleUp() {
    if (this._ensureControlsShown()) {
      this._focusIndex = 0 // Back
      this._applyItemFocus()
      return true
    }
    // si estem scrubbing, amunt no canvia element
    if (!this._scrubbing) {
      this._focusIndex = 0
      this._applyItemFocus()
      this._autoHideSoon()
    }
    return true
  }

  override _handleDown() {
    if (this._ensureControlsShown()) {
      this._focusIndex = 1 // Play/Pause
      this._applyItemFocus()
      return true
    }
    if (this._scrubbing) {
      this._cancelScrub()
      return true
    }
    if (this._focusIndex === 0) this._focusIndex = 1
    else if (this._focusIndex === 1) this._focusIndex = 2
    this._applyItemFocus()
    this._autoHideSoon()
    return true
  }

  // ── Focus visual per element ─────────────────────────────────────────────
  private _applyItemFocus() {
    // reset
    this._styleBtn(this.BackBtn, false, 0)
    this._styleBtn(this.PlayPause, false, 0)
    this._styleProgress(false)

    const key = FOCUS_ORDER[this._focusIndex]
    if (key === 'BackBtn') this._styleBtn(this.BackBtn, true, 0xff1565c0)
    if (key === 'PlayPause') this._styleBtn(this.PlayPause, true, 0xff2e7d32)
    if (key === 'Progress') this._styleProgress(true)
  }

  private _styleBtn(node: Lightning.Element, on: boolean, activeColor: number) {
    node.color = on ? activeColor : 0xff1f1f1f
    node.setSmooth('scale', on ? 1.05 : 1, { duration: 0.12 })
  }

  private _styleProgress(on: boolean) {
    this.ProgressTrack.setSmooth('h', on ? 10 : 8, { duration: 0.12 })
    this.ProgressFill.setSmooth('h', on ? 10 : 8, { duration: 0.12 })
    this.ProgressTrack.color = on ? 0x66ffffff : 0x44ffffff
    this.ProgressFill.color = on ? 0xffffffff : 0xccffffff
    this.ProgressTimes.patch({
      text: { ...(this.ProgressTimes.text || {}), textColor: on ? 0xffffffff : 0xffd0d0d0 },
    })
    this.ProgressTimes.setSmooth('alpha', on ? 1 : 0.85, { duration: 0.12 })
    this.ProgressGlow.setSmooth('alpha', on ? 0.2 : 0, { duration: 0.12 })
    // si no estem scrubbing, el Thumb queda amagat
    if (!this._scrubbing) this.ProgressThumb.setSmooth('alpha', 0, { duration: 0.12 })
  }

  // ── Scrub mode (Progress) ────────────────────────────────────────────────
  private _enterScrubMode() {
    // pausa visual (no cal pausar el vídeo si no vols)
    this._scrubbing = true
    this._wasPlayingBeforeScrub = !!(VideoPlayer as any).playing
    if (this._wasPlayingBeforeScrub) VideoPlayer.pause()

    // posiciona el thumb a l’estat actual
    const dur = Math.max(0, this._vpGet<number>('duration', 0))
    const cur = Math.max(0, this._vpGet<number>('currentTime', 0))
    this._scrubPct = dur > 0 ? cur / dur : 0
    this._updateThumbFromPct()
    this.ProgressThumb.setSmooth('alpha', 1, { duration: 0.12 })
    this._clearAutohide()
  }

  private _commitScrub() {
    const dur = Math.max(0, this._vpGet<number>('duration', 0))
    const target = Math.max(0, Math.min(dur, Math.round(dur * this._scrubPct)))
    VideoPlayer.seek(target)
    if (this._wasPlayingBeforeScrub) VideoPlayer.play()
    this._scrubbing = false
    this.ProgressThumb.setSmooth('alpha', 0, { duration: 0.12 })
    this._autoHideSoon()
  }

  private _cancelScrub() {
    this._scrubbing = false
    this.ProgressThumb.setSmooth('alpha', 0, { duration: 0.12 })
    if (this._wasPlayingBeforeScrub) VideoPlayer.play()
    this._autoHideSoon()
  }

  private _nudgeScrub(dir: -1 | 1) {
    const stepPct = 0.02 // 2% per pulsació (≈1.2s en vídeo de 60s; ajusta-ho al gust)
    this._scrubPct = Math.max(0, Math.min(1, this._scrubPct + dir * stepPct))
    this._updateThumbFromPct()

    // mostra el temps objectiu al costat del temps actual (preview)
    const dur = Math.max(0, this._vpGet<number>('duration', 0))
    const preview = Math.round(dur * this._scrubPct)
    const cur = Math.max(0, this._vpGet<number>('currentTime', 0))
    this.ProgressTimes.text = {
      text: `${this._fmt(cur)}  ⟶  ${this._fmt(preview)} / ${this._fmt(dur)}`,
    }
  }

  private _updateThumbFromPct() {
    const trackW = this.ProgressTrack.w as number
    const x = Math.round(trackW * this._scrubPct)
    this.ProgressThumb.x = x - Math.floor((this.ProgressThumb.w as number) / 2)
  }

  // ── Autohide / show ──────────────────────────────────────────────────────
  private _showControls(init = false) {
    this._controlsVisible = true
    this.Controls.setSmooth('alpha', 1, { duration: 0.2 })
    if (init) this._focusIndex = 1 // Play/Pause d'entrada
    this._applyItemFocus()
    this._autoHideSoon()
  }

  private _hideControls() {
    this._controlsVisible = false
    this.Controls.setSmooth('alpha', 0, { duration: 0.2 })
    this._clearAutohide()
  }

  private _autoHideSoon(delay: Ms = 3000) {
    this._clearAutohide()
    if (!this._scrubbing) {
      this._hideTimer = setTimeout(() => this._hideControls(), delay) as unknown as number
    }
  }

  private _clearAutohide() {
    if (this._hideTimer) {
      clearTimeout(this._hideTimer)
      this._hideTimer = undefined
    }
  }

  // ── Progress polling ─────────────────────────────────────────────────────
  private _startTick() {
    this._clearTick()
    this._tickTimer = setInterval(() => this._updateProgressUI(), 250) as unknown as number
  }
  private _clearTick() {
    if (this._tickTimer) {
      clearInterval(this._tickTimer)
      this._tickTimer = undefined
    }
  }
  private _clearTimers() {
    this._clearAutohide()
    this._clearTick()
  }

  private _updateProgressUI() {
    const dur = Math.max(0, this._vpGet<number>('duration', 0))
    const cur = Math.max(0, this._vpGet<number>('currentTime', 0))
    const pct = dur > 0 ? cur / dur : 0
    const trackW = this.ProgressTrack.w as number

    // si no estem scrubbing, la UI reflecteix el temps real
    if (!this._scrubbing) {
      this.ProgressFill.w = Math.max(0, Math.min(trackW, Math.round(trackW * pct)))
      this.ProgressTimes.text = { text: `${this._fmt(cur)} / ${this._fmt(dur)}` }
      // posiciona el Thumb a “cur” però amagat
      this.ProgressThumb.x =
        Math.round(trackW * pct) - Math.floor((this.ProgressThumb.w as number) / 2)
    } else {
      // en scrubbing, el Fill pot seguir el temps real o el scrub (tria el que prefereixis)
      this.ProgressFill.w = Math.round(trackW * this._scrubPct)
    }

    const playing = !!(VideoPlayer as any).playing
    this.PlayPause.tag('Label').text = { text: playing ? 'Pause' : 'Play' }
  }

  private _fmt(sec: number) {
    const m = Math.floor(sec / 60),
      s = Math.floor(sec % 60)
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
  }

  private _vpGet<T = any>(key: keyof any, fallback: T): T {
    const v: any = (VideoPlayer as any)[key]
    if (typeof v === 'function') return v.call(VideoPlayer) as T
    if (v === undefined || v === null) return fallback
    return v as T
  }

  onParams(params?: Record<string, any>) {
    const title = params?.title ?? 'Now Playing'
    this.tag('Controls.Title').text = { text: title }
  }
}

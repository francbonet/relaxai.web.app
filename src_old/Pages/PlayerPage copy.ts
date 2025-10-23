import { Lightning, Settings, VideoPlayer } from '@lightningjs/sdk'

export class PlayerPage extends Lightning.Component {
  private _player!: typeof VideoPlayer
  private _id: string | null = null
  static override _template() {
    return {
      Label: { x: 0, y: 100, text: { text: '', fontSize: 28 } },
      Sub: { x: 0, y: 0, text: { text: '' } },
    }
  }

  override _init() {
    // Et registres com a consumidor dels events de vídeo
    // true si el vídeo s’està renderitzant com a textura dins del canvas Lightning
    VideoPlayer.consumer(this)
    VideoPlayer.position(0, 0, 1920, 1080)
  }

  override _active() {
    console.log('[PlayerPage] _active')
    VideoPlayer.open(
      'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
    )
    VideoPlayer.play()
    VideoPlayer.show()
  }

  override _inactive() {
    VideoPlayer.close()
  }

  $videoEnded() {
    this.tag('Label').patch({ text: { text: 'Vídeo finalitzat' } })
  }

  $videoPlaying() {
    console.log('[Video] playing')
    this.tag('Label').patch({ text: { text: 'Vídeo playing...' } })
  }

  $videoError(e: any) {
    console.log('[Video] error', e)
    this.tag('Label')?.patch({ text: { text: 'Error de reproducció' } })
  }

  onParams(params?: Record<string, any>) {
    this._id = params?.id ?? null
    this.tag('Sub').patch({ text: { text: `id: ${this._id}` } })
  }

  onAppear() {
    this.patch({ alpha: 1 })
  }
  onDisappear() {
    this.patch({ alpha: 0.6 })
  }
}

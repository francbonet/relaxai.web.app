import { Lightning as L, Utils } from '@lightningjs/sdk'

export default class PosterBox extends L.Component {
  static override _template() {
    return {
      w: 600,
      h: 350,
      clipping: true,
      Bg: {
        rect: true,
        w: (w: number) => w,
        h: (h: number) => h,
        color: 0x222222ff,
      },
      Img: {
        mount: 0,
        x: 0,
        y: 0,
        texture: { type: L.textures.ImageTexture, src: Utils.asset('videos/posters/AB-007.jpg') },
      },
    }
  }

  /** Llama con 'contain' o 'cover' (o 'center') */
  setFit(mode: 'contain' | 'cover' | 'center' = 'contain') {
    const boxW = this.w as number
    const boxH = this.h as number
    const img = this.tag('Img') as L.Element
    const tx = img.texture as any

    // Asegura que la textura esté lista; si no, fuerza un frame
    this.stage.update()

    // Medidas naturales de la imagen
    const srcW = tx?.w || tx?.src?.naturalWidth || 1
    const srcH = tx?.h || tx?.src?.naturalHeight || 1

    if (mode === 'center') {
      // sin escalar, centrada
      img.patch({
        scaleX: 1,
        scaleY: 1,
        x: Math.round((boxW - srcW) / 2),
        y: Math.round((boxH - srcH) / 2),
      })
      return
    }

    const scale =
      mode === 'contain' ? Math.min(boxW / srcW, boxH / srcH) : Math.max(boxW / srcW, boxH / srcH) // cover

    const w = Math.round(srcW * scale)
    const h = Math.round(srcH * scale)

    img.patch({
      scaleX: scale,
      scaleY: scale,
      x: Math.round((boxW - w) / 2),
      y: Math.round((boxH - h) / 2),
    })
  }

  /** Opcional: cargar otra imagen y recalcular ajuste */
  setSrc(src: string, mode: 'contain' | 'cover' | 'center' = 'contain') {
    const img = this.tag('Img') as L.Element
    img.patch({ texture: { src } })
    setTimeout(() => this.setFit(mode), 0)
  }

  override _firstActive() {
    // elige el modo que quieras
    this.setFit('contain') // prueba también 'cover' y 'center'
  }
}

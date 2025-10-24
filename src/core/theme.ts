export const Theme = {
  w: 1920,
  h: 1080,
  colors: {
    bg: 0xff0b1220, // azul noche profundo
    text: 0xfff3f7fa, // blanco suave, sin deslumbrar
    textDim: 0xffb8c7d3, // gris azulado calmado
    accent: 0xff6bd3c3, // aqua/teal relajante
    tile: 0xff131b2a, // un paso sobre el fondo para tarjetas
    focus: 0xffe9f6ff, // halo claro suave (no blanco puro)
    tilefocus: 0x66a6e7de, // overlay translúcido aqua (≈40% alpha)
    tileunfocus: 0xff2a3647, // contorno/estado sin foco sutil
  },
  spacing: {
    xs: 8,
    sm: 16,
    md: 32,
    lg: 48,
    xl: 72,
  },
  typography: {
    h1: 64,
    h2: 42,
    h3: 32,
    body: 26,
    tiny: 20,
  },
}

export const Typography = {
  heading: { face: 'RelaxAI-SoraSemiBold', size: 48 },
  nav: { face: 'RelaxAI-SoraLight', size: 36 },
  title: { face: 'RelaxAI-SoraMedium', size: 60 },
  body: { face: 'RelaxAI-SoraLight', size: 36 },
  small: { face: 'RelaxAI-Manrope', size: 22 },
  button: { face: 'RelaxAI-SoraSemiBold', size: 36 },
} as const

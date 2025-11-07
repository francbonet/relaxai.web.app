export const Theme = {
  w: 1920,
  h: 1080,
  colors: {
    bg: 0xff101418,
    text: 0xffe3e5e8,
    textDim: 0xff8a8f97,
    accent: 0xff007ea7,
    tile: 0xff131b2a,
    focus: 0xffe9f6ff,
    tilefocus: 0x66a6e7de,
    tileunfocus: 0xff2a3647,
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
};

export const Typography = {
  heading: { face: "RelaxAI-SoraSemiBold", size: 48 },
  nav: { face: "RelaxAI-SoraLight", size: 36 },
  title: { face: "RelaxAI-SoraMedium", size: 60 },
  body: { face: "RelaxAI-SoraLight", size: 36 },
  small: { face: "RelaxAI-Manrope", size: 22 },
  button: { face: "RelaxAI-SoraMedium", size: 30 },
} as const;

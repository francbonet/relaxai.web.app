// src/utils/htmlTextRenderer.ts
import html2canvas from "html2canvas";

type RenderHtmlOpts = {
  text?: string;
  html?: string;
  width: number;
  fontFamily?: string;
  style?: Partial<CSSStyleDeclaration>;
  containerStyle?: Partial<CSSStyleDeclaration>;
};

/* -------------------------------------------------------------------------- */
/*  SAFE FONT STYLESHEET INJECTION                                            */
/* -------------------------------------------------------------------------- */

let fontsCssPromise: Promise<void> | null = null;

/**
 * Injecta fonts.css al <head> si no existeix.
 * Idempotent: només s'executa una vegada.
 */
function ensureFontsStylesheet(href = "./static/fonts.css"): Promise<void> {
  if (fontsCssPromise) return fontsCssPromise;

  // Si ja existeix in situ, no cal afegir-lo.
  const existing = document.querySelector<HTMLLinkElement>(
    'link[data-html-text-renderer-fonts="1"]',
  );
  if (existing) {
    fontsCssPromise = Promise.resolve();
    return fontsCssPromise;
  }

  fontsCssPromise = new Promise((resolve) => {
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = href;
    link.type = "text/css";
    link.setAttribute("data-html-text-renderer-fonts", "1");

    link.onload = () => resolve();
    link.onerror = (e) => {
      console.warn("[htmlTextRenderer] Could not load fonts.css", e);
      resolve(); // no fem reject → el renderer igualment pot funcionar
    };

    document.head.appendChild(link);
  });

  return fontsCssPromise;
}

/* -------------------------------------------------------------------------- */
/*  HELPERS                                                                    */
/* -------------------------------------------------------------------------- */

/** Crea un contenidor offscreen temporal */
function createContainer(): HTMLDivElement {
  const container = document.createElement("div");
  Object.assign(container.style, {
    position: "absolute",
    top: "-10000px",
    left: "-10000px",
    pointerEvents: "none",
    overflow: "hidden",
    width: "0",
    height: "0",
    zIndex: "-1",
  });
  document.body.appendChild(container);
  return container;
}

/** Espera un frame */
function nextFrame(): Promise<void> {
  return new Promise((resolve) => requestAnimationFrame(() => resolve()));
}

/**
 * Espera a que una font estigui carregada.
 * En navegadors antics (Android 6) es fa un fallback a un simple delay.
 */
async function waitForFontFamily(
  family: string,
  fontSize = "24px",
): Promise<void> {
  if (!("fonts" in document)) {
    // WebView antic: esperem una mica perquè la font carregui.
    await new Promise((r) => setTimeout(r, 150));
    return;
  }

  const fonts = (document as any).fonts;

  try {
    await fonts.load(`${fontSize} "${family}"`);
    await fonts.ready;
  } catch (err) {
    console.warn("[htmlTextRenderer] Font not ready:", family, err);
  }
}

/* -------------------------------------------------------------------------- */
/*  MAIN RENDERER                                                              */
/* -------------------------------------------------------------------------- */

/**
 * Renderitza text o HTML i retorna un dataURL PNG amb html2canvas.
 */
export async function renderParagraphToDataUrl(
  opts: RenderHtmlOpts,
): Promise<string> {
  const {
    text,
    html,
    width,
    fontFamily,
    style = {},
    containerStyle = {},
  } = opts;

  // 1) Assegurem fonts.css
  if (fontFamily) {
    await ensureFontsStylesheet("./static/fonts.css");
    await waitForFontFamily(fontFamily, style.fontSize ?? "24px");
  }

  // 2) Preparem contenidor offscreen
  const container = createContainer();
  Object.assign(container.style, containerStyle);

  // 3) Preparem el node on pintarem HTML o text
  const tagName = html != null ? "div" : "p";
  const el = document.createElement(tagName);

  if (html != null) el.innerHTML = html;
  else el.textContent = text ?? "";

  el.style.width = `${width}px`;
  el.style.margin = "0";
  el.style.padding = "0";
  el.style.display = "block";
  el.style.whiteSpace = "normal";

  if (fontFamily) el.style.fontFamily = fontFamily;

  Object.assign(el.style, style);

  container.appendChild(el);

  try {
    // Deixem que el navegador faci layout + fonts
    await nextFrame();

    const canvas = await html2canvas(el, {
      backgroundColor: "transparent",
      scale: 1,
      useCORS: true,
    });

    document.body.removeChild(container);

    return canvas.toDataURL("image/png");
  } catch (err) {
    document.body.removeChild(container);
    throw err;
  }
}

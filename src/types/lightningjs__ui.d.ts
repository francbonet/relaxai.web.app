// src/types/lightningjs__ui.d.ts
declare module "@lightningjs/ui" {
  import { Lightning as L } from "@lightningjs/sdk";

  /** Tipado mínimo para que TS no se queje y mantengas autocompletado básico */
  export interface CarouselSpec extends L.Component.TemplateSpec {}

  export class Carousel extends L.Component<CarouselSpec> {
    /** Índice del item enfocado */
    index: number;
    /** Separación entre items */
    spacing?: number;
    /** Dirección del carrusel */
    direction?: "row" | "column";
    /** Áncora de scroll (0 = izq/arriba, 0.5 = centro) */
    scroll?: number;
    /** Mantener tamaño constante (opcional) */
    autoResize?: boolean;

    /**
     * Sustituye todos los items del carrusel.
     * Usamos any[] porque el SDK no exporta tipos PatchTemplate/NewPatchTemplate.
     */
    reload(items: any[]): void;

    /** Acceso a los hijos (opcional, útil en tiempo de ejecución) */
    readonly items: L.Component[];
  }

  // Puedes añadir más componentes aquí si los usas (tipado mínimo)
  export class Grid extends L.Component<L.Component.TemplateSpec> {
    set items(v: any[]);
  }
  export class List extends L.Component<L.Component.TemplateSpec> {
    index: number;
    set items(v: any[]);
  }
  export class Marquee extends L.Component<L.Component.TemplateSpec> {}
  export class Button extends L.Component<L.Component.TemplateSpec> {
    label?: string;
  }
}

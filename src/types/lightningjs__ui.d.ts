// src/types/lightningjs__ui.d.ts
/* eslint-disable @typescript-eslint/no-explicit-any */
declare module "@lightningjs/ui" {
  import { Lightning as L } from "@lightningjs/sdk";

  // ====== Utilidades mínimas ======
  type Patch = any; // el SDK no expone Patch/NewPatch types

  // ====== InputField ======
  export interface InputFieldSpec extends L.Component.TemplateSpec {
    inputText?: {
      text?: string;
      fontSize?: number;
      [k: string]: any;
    };
    description?: string;
  }

  export class InputField<TSpec = InputFieldSpec> extends L.Component {
    /** Texto visible (opcional – depende de implementación) */
    inputText?: InputFieldSpec["inputText"];
    /** Placeholder */
    description?: string;

    /** Borra el contenido del input */
    clear(): void;

    /** Valor actual (no oficial, pero útil para tipado liviano) */
    input?: string;
  }

  // ====== Key (tecla base) ======
  export class Key extends L.Component {
    static width: number;
    static height: number;

    label?: any;
    labelColors?: { unfocused?: number; focused?: number };
    backgroundColors?: { unfocused?: number; focused?: number };

    // hooks internos que algunos extienden
    _firstActive(): void;
    _active(): void;
    _focus(): void;
  }

  // ====== Keyboard ======

  export interface KeyboardConfig {
    layout?: string;
    layouts?: Record<string, string[][]>;
    styling?: {
      align?: "left" | "center" | "right";
      horizontalSpacing?: number;
      verticalSpacing?: number;
    };
    [k: string]: any;
  }

  export class Keyboard {
    config?: KeyboardConfig;
  }

  // ====== Carousel ======
  export interface CarouselSpec extends L.Component.TemplateSpec {
    direction?: "row" | "column";
    spacing?: number;
    scroll?: number; // 0..1 (anchor)
    autoResize?: boolean;
    items?: Patch[];
  }

  export class Carousel<TSpec = CarouselSpec> extends L.Component {
    index: number;
    spacing?: number;
    direction?: "row" | "column";
    scroll?: number;
    autoResize?: boolean;

    reload(items: Patch[]): void;
    readonly items: L.Component[];
  }

  // ====== Otros componentes mínimos ======
  export class Grid extends L.Component {
    set items(v: Patch[]);
  }

  export class List extends L.Component {
    index: number;
    set items(v: Patch[]);
  }

  export class Marquee extends L.Component {}

  export class Button extends L.Component {
    label?: string;
  }
}

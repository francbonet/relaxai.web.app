import { Lightning } from '@lightningjs/sdk'

export type ARGB = number

export interface WithTitle extends Lightning.Component.TemplateSpec {
  title: string
}

export const enum Z {
  Header = 10,
  Overlay = 20,
}

export const enum Keys {
  Left = 'Left',
  Right = 'Right',
  Up = 'Up',
  Down = 'Down',
  Enter = 'Enter',
  Back = 'Back',
}

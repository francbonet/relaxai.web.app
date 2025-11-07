import { ActionKey } from "./Basekey/ActionKey";
import { Key } from "./Basekey/Key";

export const keyboardConfig = {
  layout: "grid-en",
  layouts: {
    abc: [
      ["q", "w", "e", "r", "t", "y", "u", "i"],
      ["o", "p", "a", "s", "d", "f", "g", "h"],
      ["j", "k", "l", "z", "x", "c", "v", "b"],
      ["n", "m", ",", ".", "'", "-", "/", "="],
      [
        "Layout:ABC",
        "Layout:@#&",
        "Space:space",
        "Backspace:←",
        "Clear:clear",
        "Submit:search",
      ],
    ],
    ABC: [
      ["Q", "W", "E", "R", "T", "Y", "U", "I"],
      ["O", "P", "A", "S", "D", "F", "G", "H"],
      ["J", "K", "L", "Z", "X", "C", "V", "B"],
      ["N", "M", "<", ">", '"', "_", "?", ":"],
      [
        "Layout:abc",
        "Layout:@#&",
        "Space:space",
        "Backspace:←",
        "Clear:clear",
        "Submit:search",
      ],
    ],
    "@#&": [
      ["1", "2", "3", "4", "5", "6", "7", "8"],
      ["9", "0", "!", "@", "#", "$", "%", "^"],
      ["&", "*", "(", ")", "-", "_", "+", "="],
      ["/", "\\", ":", ";", '"', "'", ".", "?"],
      [
        "Layout:abc",
        "Layout:ABC",
        "Space:space",
        "Backspace:←",
        "Clear:clear",
        "Submit:search",
      ],
    ],
  },
  styling: { align: "center", horizontalSpacing: 8, verticalSpacing: 24 },
  buttonTypes: {
    default: { type: Key, w: 120, h: 64 },
    Layout: { type: ActionKey, w: 120, h: 64 },
    Space: { type: ActionKey, w: 130, h: 64 },
    Backspace: { type: ActionKey, w: 100, h: 64 },
    Clear: { type: ActionKey, w: 120, h: 64 },
    Submit: { type: ActionKey, w: 150, h: 64 },
  },
};

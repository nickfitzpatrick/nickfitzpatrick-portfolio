// Shared capability checks, so every effect makes the same decision.
export const reducedMotion = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
export const finePointer = () => matchMedia('(hover: hover) and (pointer: fine)').matches;
export const smallScreen = () => matchMedia('(max-width: 45em)').matches;

// Single source of truth for the price filter range used across the store.
// Kept isolated from component files so Vite Fast Refresh works correctly
// (files that mix component exports with non-component exports break HMR).
export const RANGO_PRECIO = { min: 0, max: 3000, paso: 50 };

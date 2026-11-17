/**
 * Plug in your own 3D models here (GLB / glTF, NOT Draco-compressed).
 * Put files in /public/models/ and set the path, e.g. chicken: "/models/chicken-piece.glb".
 * The first mesh in the file is used, auto-centred and resized to the right piece size.
 * Leave a value empty ("") to use the built-in procedural model.
 */
export const MODEL_URLS = {
  chicken: "",
  mango: "",
  laddu: "",
} as const;

export type PieceKind = "chicken" | "mango" | "laddu" | "chilli" | "garlic";

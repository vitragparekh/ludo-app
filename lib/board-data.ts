// ============================================================
// Ludo Board Data — 15x15 grid coordinate system
// ============================================================

export type PlayerColor = 'red' | 'green' | 'yellow' | 'blue';

// ------------------------------------------------------------
// Player colours
// ------------------------------------------------------------

export const PLAYER_COLORS: Record<PlayerColor, string> = {
  red: '#E63946',
  green: '#2A9D8F',
  yellow: '#F4A261',
  blue: '#457B9D',
} as const;

// ------------------------------------------------------------
// Tile shape
// ------------------------------------------------------------

export interface Tile {
  id: number;
  row: number;
  col: number;
}

// ------------------------------------------------------------
// Main track — 52 tiles, numbered 0-51 clockwise.
// Tile 0  = Red entry (safe)
// Tile 13 = Green entry (safe)
// Tile 26 = Yellow entry (safe)
// Tile 39 = Blue entry (safe)
// ------------------------------------------------------------

export const TILE_MAP: Tile[] = [
  // ── Red section ─────────────────────────────────────────
  { id:  0, row: 6, col:  1 }, // Red entry / safe
  { id:  1, row: 6, col:  2 },
  { id:  2, row: 6, col:  3 },
  { id:  3, row: 6, col:  4 },
  { id:  4, row: 6, col:  5 },
  { id:  5, row: 5, col:  6 }, // corner
  { id:  6, row: 4, col:  6 },
  { id:  7, row: 3, col:  6 },
  { id:  8, row: 2, col:  6 },
  { id:  9, row: 1, col:  6 },
  { id: 10, row: 0, col:  6 },
  { id: 11, row: 0, col:  7 }, // corner
  { id: 12, row: 0, col:  8 },

  // ── Green section ────────────────────────────────────────
  { id: 13, row: 1, col:  8 }, // Green entry / safe
  { id: 14, row: 2, col:  8 },
  { id: 15, row: 3, col:  8 },
  { id: 16, row: 4, col:  8 },
  { id: 17, row: 5, col:  8 },
  { id: 18, row: 6, col:  9 }, // corner
  { id: 19, row: 6, col: 10 },
  { id: 20, row: 6, col: 11 },
  { id: 21, row: 6, col: 12 },
  { id: 22, row: 6, col: 13 },
  { id: 23, row: 6, col: 14 },
  { id: 24, row: 7, col: 14 }, // corner
  { id: 25, row: 8, col: 14 },

  // ── Yellow section ───────────────────────────────────────
  { id: 26, row: 8, col: 13 }, // Yellow entry / safe
  { id: 27, row: 8, col: 12 },
  { id: 28, row: 8, col: 11 },
  { id: 29, row: 8, col: 10 },
  { id: 30, row: 8, col:  9 },
  { id: 31, row: 9, col:  8 }, // corner
  { id: 32, row: 10, col: 8 },
  { id: 33, row: 11, col: 8 },
  { id: 34, row: 12, col: 8 },
  { id: 35, row: 13, col: 8 },
  { id: 36, row: 14, col: 8 },
  { id: 37, row: 14, col: 7 }, // corner
  { id: 38, row: 14, col: 6 },

  // ── Blue section ─────────────────────────────────────────
  { id: 39, row: 13, col: 6 }, // Blue entry / safe
  { id: 40, row: 12, col: 6 },
  { id: 41, row: 11, col: 6 },
  { id: 42, row: 10, col: 6 },
  { id: 43, row:  9, col: 6 },
  { id: 44, row:  8, col: 5 }, // corner
  { id: 45, row:  8, col: 4 },
  { id: 46, row:  8, col: 3 },
  { id: 47, row:  8, col: 2 }, // safe
  { id: 48, row:  8, col: 1 },
  { id: 49, row:  8, col: 0 },
  { id: 50, row:  7, col: 0 }, // corner
  { id: 51, row:  6, col: 0 },
];

// ------------------------------------------------------------
// Safe tiles (star positions)
// ------------------------------------------------------------

export const SAFE_TILES: number[] = [0, 8, 13, 21, 26, 34, 39, 47];

// ------------------------------------------------------------
// Entry tiles — tile ID where each player enters the main track
// ------------------------------------------------------------

export const ENTRY_TILES: Record<PlayerColor, number> = {
  red:    0,
  green: 13,
  yellow: 26,
  blue:  39,
} as const;

// ------------------------------------------------------------
// Home-entry tiles — the main-track tile AFTER which a piece
// turns into its home column.
// ------------------------------------------------------------

export const HOME_ENTRY_TILES: Record<PlayerColor, number> = {
  red:    51, // after tile 51 → enters red home column at (7,1)
  green:  12, // after tile 12 → enters green home column at (1,7)
  yellow: 25, // after tile 25 → enters yellow home column at (7,13)
  blue:   38, // after tile 38 → enters blue home column at (13,7)
} as const;

// ------------------------------------------------------------
// Home columns — 5 coloured tiles leading to the shared centre.
// Index 0 is the tile entered first; index 4 is last before centre.
// Index 5 is the centre / finishing tile (7,7).
// ------------------------------------------------------------

export interface HomeColumnTile {
  row: number;
  col: number;
}

export const HOME_COLUMNS: Record<PlayerColor, HomeColumnTile[]> = {
  // Red travels RIGHT along row 7
  red: [
    { row: 7, col: 1 },
    { row: 7, col: 2 },
    { row: 7, col: 3 },
    { row: 7, col: 4 },
    { row: 7, col: 5 },
    { row: 7, col: 7 }, // centre
  ],

  // Green travels DOWN along col 7
  green: [
    { row: 1, col: 7 },
    { row: 2, col: 7 },
    { row: 3, col: 7 },
    { row: 4, col: 7 },
    { row: 5, col: 7 },
    { row: 7, col: 7 }, // centre
  ],

  // Yellow travels LEFT along row 7
  yellow: [
    { row: 7, col: 13 },
    { row: 7, col: 12 },
    { row: 7, col: 11 },
    { row: 7, col: 10 },
    { row: 7, col:  9 },
    { row: 7, col:  7 }, // centre
  ],

  // Blue travels UP along col 7
  blue: [
    { row: 13, col: 7 },
    { row: 12, col: 7 },
    { row: 11, col: 7 },
    { row: 10, col: 7 },
    { row:  9, col: 7 },
    { row:  7, col: 7 }, // centre
  ],
} as const;

// ------------------------------------------------------------
// Home bases — the 4 starting positions for each player's pieces.
// These sit inside the corner quadrants (not on the main track).
// ------------------------------------------------------------

export interface HomeBaseTile {
  row: number;
  col: number;
}

export const HOME_BASES: Record<PlayerColor, HomeBaseTile[]> = {
  // Top-left quadrant (rows 0-5, cols 0-5)
  red: [
    { row: 1, col: 1 },
    { row: 1, col: 4 },
    { row: 4, col: 1 },
    { row: 4, col: 4 },
  ],

  // Top-right quadrant (rows 0-5, cols 9-14)
  green: [
    { row: 1, col: 10 },
    { row: 1, col: 13 },
    { row: 4, col: 10 },
    { row: 4, col: 13 },
  ],

  // Bottom-right quadrant (rows 9-14, cols 9-14)
  yellow: [
    { row: 10, col: 10 },
    { row: 10, col: 13 },
    { row: 13, col: 10 },
    { row: 13, col: 13 },
  ],

  // Bottom-left quadrant (rows 9-14, cols 0-5)
  blue: [
    { row: 10, col: 1 },
    { row: 10, col: 4 },
    { row: 13, col: 1 },
    { row: 13, col: 4 },
  ],
} as const;

// ------------------------------------------------------------
// Convenience helpers
// ------------------------------------------------------------

/** Look up a main-track tile by its id. */
export function getTileById(id: number): Tile | undefined {
  return TILE_MAP.find((t) => t.id === id);
}

/** Look up a main-track tile by its grid position. */
export function getTileByPosition(row: number, col: number): Tile | undefined {
  return TILE_MAP.find((t) => t.row === row && t.col === col);
}

/** Returns true when the given tile id is a safe (star) tile. */
export function isSafeTile(id: number): boolean {
  return SAFE_TILES.includes(id);
}

/** Returns the number of steps between two tile ids on the main track (wraps at 52). */
export function stepsApart(fromId: number, toId: number): number {
  return (toId - fromId + 52) % 52;
}

'use client';

import {
  TILE_MAP,
  HOME_COLUMNS,
  HOME_BASES,
  SAFE_TILES,
  PLAYER_COLORS,
  type PlayerColor,
} from '@/lib/board-data';

const GRID = 15;
const CELL = 100 / GRID; // percentage per cell

interface PiecePosition {
  color: PlayerColor;
  pieceIndex: number;
  // 'home' = in home base, 'track' = on main track, 'column' = in home column, 'finished' = at center
  location: 'home' | 'track' | 'column' | 'finished';
  trackPosition?: number; // tile id on main track
  columnPosition?: number; // index in home column (0-5)
}

interface LudoBoardProps {
  pieces: PiecePosition[];
  currentPlayer: PlayerColor | null;
  validMoves?: { pieceColor: PlayerColor; pieceIndex: number; toTileId?: number; toColumnIndex?: number }[];
  selectedPiece?: { color: PlayerColor; index: number } | null;
  onPieceClick?: (color: PlayerColor, pieceIndex: number) => void;
  isMyTurn?: boolean;
  myColor?: PlayerColor;
}

function getPiecePosition(piece: PiecePosition): { row: number; col: number } {
  if (piece.location === 'home') {
    const bases = HOME_BASES[piece.color];
    return bases[piece.pieceIndex];
  }
  if (piece.location === 'track' && piece.trackPosition !== undefined) {
    const tile = TILE_MAP[piece.trackPosition];
    return { row: tile.row, col: tile.col };
  }
  if (
    (piece.location === 'column' || piece.location === 'finished') &&
    piece.columnPosition !== undefined
  ) {
    const col = HOME_COLUMNS[piece.color][piece.columnPosition];
    return { row: col.row, col: col.col };
  }
  return { row: 7, col: 7 };
}

export function LudoBoard({
  pieces,
  validMoves = [],
  selectedPiece,
  onPieceClick,
  isMyTurn,
  myColor,
}: LudoBoardProps) {
  // Group pieces by position for stacking
  const piecesByPos = new Map<string, PiecePosition[]>();
  pieces.forEach((p) => {
    const pos = getPiecePosition(p);
    const key = `${pos.row}-${pos.col}`;
    if (!piecesByPos.has(key)) piecesByPos.set(key, []);
    piecesByPos.get(key)!.push(p);
  });

  const isSelected = (color: PlayerColor, idx: number) =>
    selectedPiece?.color === color && selectedPiece?.index === idx;

  const isValidTarget = (color: PlayerColor, idx: number) =>
    validMoves.some((m) => m.pieceColor === color && m.pieceIndex === idx);

  const canClick = (piece: PiecePosition) =>
    isMyTurn && piece.color === myColor && isValidTarget(piece.color, piece.pieceIndex);

  return (
    <div className="relative w-full max-w-[100vw] aspect-square">
      <svg viewBox="0 0 100 100" className="w-full h-full">
        {/* Board background */}
        <rect x="0" y="0" width="100" height="100" fill="#1e293b" rx="1" />

        {/* Home base areas */}
        {renderHomeBase('red', 0, 0)}
        {renderHomeBase('green', 9 * CELL, 0)}
        {renderHomeBase('yellow', 9 * CELL, 9 * CELL)}
        {renderHomeBase('blue', 0, 9 * CELL)}

        {/* Center triangle area */}
        {renderCenter()}

        {/* Main track tiles */}
        {TILE_MAP.map((tile) => {
          const isSafe = SAFE_TILES.includes(tile.id);
          return (
            <rect
              key={`track-${tile.id}`}
              x={tile.col * CELL + 0.15}
              y={tile.row * CELL + 0.15}
              width={CELL - 0.3}
              height={CELL - 0.3}
              fill={isSafe ? '#334155' : '#1e293b'}
              stroke="#475569"
              strokeWidth="0.15"
              rx="0.3"
            />
          );
        })}

        {/* Safe tile stars */}
        {SAFE_TILES.map((id) => {
          const tile = TILE_MAP[id];
          const cx = tile.col * CELL + CELL / 2;
          const cy = tile.row * CELL + CELL / 2;
          return (
            <text
              key={`star-${id}`}
              x={cx}
              y={cy + 0.8}
              textAnchor="middle"
              fontSize="3"
              fill="#94a3b8"
            >
              ★
            </text>
          );
        })}

        {/* Home column tiles */}
        {(Object.keys(HOME_COLUMNS) as PlayerColor[]).map((color) =>
          HOME_COLUMNS[color].map((pos, i) => (
            <rect
              key={`hcol-${color}-${i}`}
              x={pos.col * CELL + 0.15}
              y={pos.row * CELL + 0.15}
              width={CELL - 0.3}
              height={CELL - 0.3}
              fill={PLAYER_COLORS[color]}
              opacity={i === 5 ? 0.5 : 0.3}
              stroke={PLAYER_COLORS[color]}
              strokeWidth="0.2"
              rx="0.3"
            />
          ))
        )}

        {/* Home base piece slots */}
        {(Object.keys(HOME_BASES) as PlayerColor[]).map((color) =>
          HOME_BASES[color].map((pos, i) => (
            <circle
              key={`hbase-${color}-${i}`}
              cx={pos.col * CELL + CELL / 2}
              cy={pos.row * CELL + CELL / 2}
              r={CELL * 0.3}
              fill="none"
              stroke={PLAYER_COLORS[color]}
              strokeWidth="0.3"
              opacity={0.4}
            />
          ))
        )}

        {/* Pieces */}
        {pieces.map((piece) => {
          const pos = getPiecePosition(piece);
          const samePos = piecesByPos.get(`${pos.row}-${pos.col}`) || [];
          const stackIdx = samePos.indexOf(piece);
          const stackCount = samePos.length;

          // Offset for stacking
          const offsets = [
            [0, 0],
            [0.8, 0],
            [0, 0.8],
            [0.8, 0.8],
          ];
          const offset = stackCount > 1 ? offsets[stackIdx] || [0, 0] : [0, 0];
          const radius = stackCount > 1 ? CELL * 0.22 : CELL * 0.32;

          const cx = pos.col * CELL + CELL / 2 + offset[0];
          const cy = pos.row * CELL + CELL / 2 + offset[1];

          const selected = isSelected(piece.color, piece.pieceIndex);
          const clickable = canClick(piece);

          return (
            <g key={`piece-${piece.color}-${piece.pieceIndex}`}>
              {/* Selection ring */}
              {selected && (
                <circle
                  cx={cx}
                  cy={cy}
                  r={radius + 0.5}
                  fill="none"
                  stroke="white"
                  strokeWidth="0.4"
                >
                  <animate
                    attributeName="opacity"
                    values="1;0.4;1"
                    dur="1s"
                    repeatCount="indefinite"
                  />
                </circle>
              )}

              {/* Valid move glow */}
              {clickable && !selected && (
                <circle
                  cx={cx}
                  cy={cy}
                  r={radius + 0.6}
                  fill="none"
                  stroke="white"
                  strokeWidth="0.3"
                  opacity="0.6"
                >
                  <animate
                    attributeName="r"
                    values={`${radius + 0.3};${radius + 0.8};${radius + 0.3}`}
                    dur="1.2s"
                    repeatCount="indefinite"
                  />
                </circle>
              )}

              {/* Piece circle */}
              <circle
                cx={cx}
                cy={cy}
                r={radius}
                fill={PLAYER_COLORS[piece.color]}
                stroke={selected ? 'white' : '#0f172a'}
                strokeWidth={selected ? '0.4' : '0.25'}
                style={{ cursor: clickable ? 'pointer' : 'default' }}
                onClick={() => {
                  if (clickable && onPieceClick) {
                    onPieceClick(piece.color, piece.pieceIndex);
                  }
                }}
              />

              {/* Piece number */}
              <text
                x={cx}
                y={cy + 0.7}
                textAnchor="middle"
                fontSize="2"
                fill="white"
                fontWeight="bold"
                style={{ pointerEvents: 'none' }}
              >
                {piece.pieceIndex + 1}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

function renderHomeBase(color: PlayerColor, x: number, y: number) {
  const size = 6 * CELL;
  return (
    <rect
      x={x + 0.2}
      y={y + 0.2}
      width={size - 0.4}
      height={size - 0.4}
      fill={PLAYER_COLORS[color]}
      opacity={0.15}
      rx="1"
    />
  );
}

function renderCenter() {
  const cx = 7 * CELL + CELL / 2;
  const cy = 7 * CELL + CELL / 2;
  const size = CELL * 0.45;

  return (
    <g>
      {/* Red triangle */}
      <polygon
        points={`${cx},${cy - size} ${cx - size},${cy} ${cx},${cy}`}
        fill={PLAYER_COLORS.red}
        opacity={0.6}
      />
      {/* Green triangle */}
      <polygon
        points={`${cx},${cy - size} ${cx + size},${cy} ${cx},${cy}`}
        fill={PLAYER_COLORS.green}
        opacity={0.6}
      />
      {/* Yellow triangle */}
      <polygon
        points={`${cx + size},${cy} ${cx},${cy + size} ${cx},${cy}`}
        fill={PLAYER_COLORS.yellow}
        opacity={0.6}
      />
      {/* Blue triangle */}
      <polygon
        points={`${cx - size},${cy} ${cx},${cy + size} ${cx},${cy}`}
        fill={PLAYER_COLORS.blue}
        opacity={0.6}
      />
    </g>
  );
}

'use client';

import { useMemo, useState, useRef, useCallback } from 'react';
import type { CSSProperties } from 'react';

interface Atom {
  element: string;
  x: number;
  y: number;
  z: number;
}

interface MoleculeViewerProps {
  atoms: Atom[];
  width?: number;
  height?: number;
  className?: string;
}

const ELEMENT_COLORS: Record<string, string> = {
  H: '#ffffff',
  He: '#d9ffff',
  Li: '#cc80ff',
  Be: '#c2ff00',
  B: '#ffb5b5',
  C: '#909090',
  N: '#3050f8',
  O: '#ff0d0d',
  F: '#90e050',
  Ne: '#b3e3f5',
  Na: '#ab5cf2',
  Mg: '#8aff00',
  Al: '#bfa6a6',
  Si: '#f0c8a0',
  P: '#ff8000',
  S: '#ffff30',
  Cl: '#1ff01f',
  Ar: '#80d1e3',
  K: '#8f40d4',
  Ca: '#3dff00',
  Fe: '#e06633',
  Cu: '#c88033',
  Zn: '#7d80b0',
  Br: '#a62929',
  I: '#940094',
  Pt: '#d0d0e0',
  Au: '#ffd123',
};

const ELEMENT_RADII: Record<string, number> = {
  H: 0.31, He: 0.28, Li: 1.28, Be: 0.96, B: 0.84, C: 0.76,
  N: 0.71, O: 0.66, F: 0.57, Na: 1.66, Mg: 1.41, Al: 1.21,
  Si: 1.11, P: 1.07, S: 1.05, Cl: 1.02, K: 2.03, Ca: 1.76,
  Fe: 1.32, Cu: 1.32, Zn: 1.22, Br: 1.20, I: 1.39, Pt: 1.36, Au: 1.36,
};

const BOND_THRESHOLD = 1.8; // Angstrom multiplier for covalent radii sum

export function MoleculeViewer({
  atoms,
  width = 400,
  height = 400,
  className,
}: MoleculeViewerProps) {
  const [rotation, setRotation] = useState({ x: -20, y: 30 });
  const [dragging, setDragging] = useState(false);
  const lastMouse = useRef({ x: 0, y: 0 });
  const ariaLabel = `${atoms.length} átomos no visualizador molecular`;

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    setDragging(true);
    lastMouse.current = { x: e.clientX, y: e.clientY };
  }, []);

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (!dragging) return;
      const dx = e.clientX - lastMouse.current.x;
      const dy = e.clientY - lastMouse.current.y;
      setRotation((prev) => ({
        x: prev.x + dy * 0.5,
        y: prev.y + dx * 0.5,
      }));
      lastMouse.current = { x: e.clientX, y: e.clientY };
    },
    [dragging],
  );

  const handleMouseUp = useCallback(() => setDragging(false), []);
  const handleKeyDown = useCallback((e: React.KeyboardEvent<SVGSVGElement>) => {
    if (e.key === 'ArrowLeft') {
      setRotation((prev) => ({ ...prev, y: prev.y - 5 }));
    } else if (e.key === 'ArrowRight') {
      setRotation((prev) => ({ ...prev, y: prev.y + 5 }));
    } else if (e.key === 'ArrowUp') {
      setRotation((prev) => ({ ...prev, x: prev.x - 5 }));
    } else if (e.key === 'ArrowDown') {
      setRotation((prev) => ({ ...prev, x: prev.x + 5 }));
    } else {
      return;
    }
    e.preventDefault();
  }, []);

  const { projected, bonds } = useMemo(() => {
    if (atoms.length === 0) return { projected: [], bonds: [] };

    // Center coordinates
    const cx = atoms.reduce((s, a) => s + a.x, 0) / atoms.length;
    const cy = atoms.reduce((s, a) => s + a.y, 0) / atoms.length;
    const cz = atoms.reduce((s, a) => s + a.z, 0) / atoms.length;

    const centered = atoms.map((a) => ({
      ...a,
      x: a.x - cx,
      y: a.y - cy,
      z: a.z - cz,
    }));

    // Simple rotation
    const radX = (rotation.x * Math.PI) / 180;
    const radY = (rotation.y * Math.PI) / 180;
    const cosX = Math.cos(radX);
    const sinX = Math.sin(radX);
    const cosY = Math.cos(radY);
    const sinY = Math.sin(radY);

    const rotated = centered.map((a) => {
      const y1 = a.y * cosX - a.z * sinX;
      const z1 = a.y * sinX + a.z * cosX;
      const x2 = a.x * cosY + z1 * sinY;
      const z2 = -a.x * sinY + z1 * cosY;
      return { ...a, rx: x2, ry: y1, rz: z2 };
    });

    // Find scale
    const maxDist =
      Math.max(
        ...rotated.map((a) => Math.max(Math.abs(a.rx), Math.abs(a.ry))),
        1,
      ) * 1.3;
    const scale = Math.min(width, height) / 2 / maxDist;

    const proj = rotated.map((a, i) => ({
      index: i,
      element: a.element,
      sx: width / 2 + a.rx * scale,
      sy: height / 2 + a.ry * scale,
      sz: a.rz,
      radius: (ELEMENT_RADII[a.element] || 0.7) * scale * 0.3,
      color: ELEMENT_COLORS[a.element] || '#cccccc',
    }));

    // Find bonds
    const bondList: { i: number; j: number }[] = [];
    for (let i = 0; i < centered.length; i++) {
      for (let j = i + 1; j < centered.length; j++) {
        const dx = centered[i].x - centered[j].x;
        const dy = centered[i].y - centered[j].y;
        const dz = centered[i].z - centered[j].z;
        const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
        const r1 = ELEMENT_RADII[centered[i].element] || 0.7;
        const r2 = ELEMENT_RADII[centered[j].element] || 0.7;
        if (dist < (r1 + r2) * BOND_THRESHOLD) {
          bondList.push({ i, j });
        }
      }
    }

    return { projected: proj, bonds: bondList };
  }, [atoms, rotation, width, height]);

  // Sort by z for depth ordering
  const sortedAtoms = useMemo(
    () => [...projected].sort((a, b) => a.sz - b.sz),
    [projected],
  );

  if (atoms.length === 0) {
    return (
      <div
        className={`flex items-center justify-center rounded-md bg-muted/30 ${className}`}
        style={{ width, height }}
      >
        <p className="text-sm text-muted-foreground">Sem átomos para visualizar</p>
      </div>
    );
  }

  return (
    <svg
      width={width}
      height={height}
      className={`cursor-grab select-none rounded-md border bg-card active:cursor-grabbing ${className || ''}`}
      tabIndex={0}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onKeyDown={handleKeyDown}
      role="img"
      aria-label={ariaLabel}
      style={
        {
          '--chemistry-accent': '#1e3a5f',
          '--chemistry-bond': 'color-mix(in oklch, var(--chemistry-accent), white 40%)',
        } as CSSProperties
      }
    >
      {/* Bonds */}
      {bonds.map(({ i, j }, bi) => (
        <line
          key={`bond-${bi}`}
          x1={projected[i].sx}
          y1={projected[i].sy}
          x2={projected[j].sx}
          y2={projected[j].sy}
          stroke="var(--chemistry-bond)"
          strokeWidth="2"
          opacity="0.3"
        />
      ))}

      {/* Atoms (sorted by depth) */}
      {sortedAtoms.map((a) => (
        <g key={a.index}>
          <circle
            cx={a.sx}
            cy={a.sy}
            r={Math.max(a.radius, 4)}
            fill={a.color}
            stroke="currentColor"
            strokeWidth="0.5"
            opacity="0.9"
          />
          <text
            x={a.sx}
            y={a.sy + 1}
            textAnchor="middle"
            dominantBaseline="middle"
            className="text-[8px] font-medium fill-current pointer-events-none"
          >
            {a.element}
          </text>
        </g>
      ))}
    </svg>
  );
}

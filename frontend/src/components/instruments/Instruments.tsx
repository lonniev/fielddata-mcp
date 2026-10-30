/** The instruments: inline SVG, coloured only by the theme's tokens, at rest when `quantity` is null. */

import { compassPoint, instrumentFor, needleAngle, polar, scaleRatio } from "../../lib/instruments";
import { formatQuantity, formatTick, type UnitSystem } from "../../lib/units";

export interface GaugeProps {
  kind: string;
  /** Null draws the instrument at rest. */
  quantity: number | null;
  unit: string;
  units: UnitSystem;
  label: string;
}

const REST = "—";

const GLYPHS = import.meta.glob("../../assets/weather-icons/*.svg", { eager: true, query: "?url", import: "default" }) as Record<string, string>;

/** A Weather Icons glyph, painted in the text colour so it follows the theme. */
function Glyph({ kind }: { kind: string }) {
  const name = GLYPH_FOR[kind];
  const url = name && GLYPHS[`../../assets/weather-icons/wi-${name}.svg`];
  if (!url) return null;
  // The raindrops are drawn small inside their square.
  const size = name === "raindrops" ? "200%" : "contain";
  const mask = `url("${url}") center / ${size} no-repeat`;
  return <span aria-hidden="true" className="inline-block h-6 w-6 shrink-0 bg-current" style={{ mask, WebkitMask: mask }} />;
}

const GLYPH_FOR: Record<string, string> = {
  air_temperature: "thermometer-exterior",
  soil_temperature: "thermometer-exterior",
  wind_speed: "strong-wind",
  wind_direction: "wind-deg",
  pressure: "barometer",
  relative_humidity: "humidity",
  rain_total: "umbrella",
  rain_rate: "sprinkle",
  solar_radiation: "day-sunny",
  uv_index: "hot",
  soil_moisture: "raindrops",
  leaf_wetness: "raindrops",
};

function Bezel({ children, kind, label, figure }: { children: React.ReactNode; kind: string; label: string; figure: string }) {
  return (
    <figure>
      <svg viewBox="0 0 200 200" aria-hidden="true" className="block w-full">
        <defs>
          <linearGradient id="rim" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="var(--dial-rim)" />
            <stop offset="1" stopColor="var(--dial-rim-deep)" />
          </linearGradient>
        </defs>
        <circle cx="100" cy="100" r="96" fill="url(#rim)" />
        <circle cx="100" cy="100" r="88" fill="var(--dial-face)" />
        {children}
      </svg>
      <figcaption className="mt-1.5 text-center">
        <span className="block font-mono text-base">{figure}</span>
        <span className="flex items-center justify-center gap-1 font-display text-sm leading-tight text-[var(--tb-muted)]">
          <Glyph kind={kind} />
          {label}
        </span>
      </figcaption>
    </figure>
  );
}

export function Dial({ kind, quantity, unit, units, label }: GaugeProps) {
  const { min, max, divisions } = instrumentFor(kind);
  const majors = Array.from({ length: divisions + 1 }, (_, i) => i / divisions);
  const minors = Array.from({ length: divisions * 5 + 1 }, (_, i) => i / (divisions * 5));
  const ratio = quantity == null ? 0 : scaleRatio(quantity, min, max);
  const figure = quantity == null ? REST : formatQuantity(quantity, unit, units);
  return (
    <Bezel kind={kind} label={label} figure={figure}>
      {minors.map((r) => {
        const a = needleAngle(r);
        const [x1, y1] = polar(100, 100, 82, a);
        const [x2, y2] = polar(100, 100, 77, a);
        return <line key={r} x1={x1} y1={y1} x2={x2} y2={y2} stroke="var(--dial-mute)" strokeWidth="0.7" />;
      })}
      {majors.map((r) => {
        const a = needleAngle(r);
        const [x1, y1] = polar(100, 100, 82, a);
        const [x2, y2] = polar(100, 100, 72, a);
        const [tx, ty] = polar(100, 100, 60, a);
        return (
          <g key={r}>
            <line x1={x1} y1={y1} x2={x2} y2={y2} stroke="var(--dial-ink)" strokeWidth="1.6" />
            <text x={tx} y={ty + 3.5} textAnchor="middle" fontSize="10" fill="var(--dial-ink)" fontFamily="var(--font-mono)">
              {formatTick(min + r * (max - min), unit, units)}
            </text>
          </g>
        );
      })}
      <g className="needle" style={{ transform: `rotate(${needleAngle(ratio)}deg)`, transformOrigin: "100px 100px" }}>
        <path d="M100 26 L103 104 L97 104 Z" fill="var(--needle)" />
        <path d="M100 104 L102 120 L98 120 Z" fill="var(--dial-rim-deep)" />
      </g>
      <circle cx="100" cy="100" r="6" fill="url(#rim)" />
    </Bezel>
  );
}

export function Compass({ kind, quantity, unit, units, label }: GaugeProps) {
  const figure = quantity == null ? REST : `${compassPoint(quantity)} ${formatQuantity(quantity, unit, units)}`;
  const cardinals: [string, number][] = [["N", 0], ["E", 90], ["S", 180], ["W", 270]];
  return (
    <Bezel kind={kind} label={label} figure={figure}>
      {Array.from({ length: 72 }, (_, i) => i * 5).map((a) => {
        const [x1, y1] = polar(100, 100, 82, a);
        const [x2, y2] = polar(100, 100, a % 45 === 0 ? 72 : 78, a);
        return <line key={a} x1={x1} y1={y1} x2={x2} y2={y2} stroke={a % 45 === 0 ? "var(--dial-ink)" : "var(--dial-mute)"} strokeWidth={a % 45 === 0 ? 1.4 : 0.6} />;
      })}
      {cardinals.map(([name, a]) => {
        const [x, y] = polar(100, 100, 61, a);
        return (
          <text key={name} x={x} y={y + 5} textAnchor="middle" fontSize="14" fill="var(--dial-ink)" fontFamily="var(--font-display)">
            {name}
          </text>
        );
      })}
      <g className="needle" style={{ transform: `rotate(${quantity ?? 0}deg)`, transformOrigin: "100px 100px" }} opacity={quantity == null ? 0.35 : 1}>
        <path d="M100 42 L107 100 L93 100 Z" fill="var(--needle)" />
        <path d="M100 158 L107 100 L93 100 Z" fill="var(--dial-mute)" />
      </g>
      <circle cx="100" cy="100" r="5" fill="url(#rim)" />
    </Bezel>
  );
}

/** A glass tube on an engraved scale: mercury for temperature. */
export function Tube({ kind, quantity, unit, units, label }: GaugeProps) {
  const { min, max, divisions } = instrumentFor(kind);
  const top = 30;
  const bottom = 136;
  const ratio = quantity == null ? 0 : scaleRatio(quantity, min, max);
  const y = bottom - ratio * (bottom - top);
  const figure = quantity == null ? REST : formatQuantity(quantity, unit, units);
  return (
    <Bezel kind={kind} label={label} figure={figure}>
      <rect x="93" y={top - 6} width="14" height={bottom - top + 12} rx="7" fill="none" stroke="var(--dial-mute)" strokeWidth="1.2" />
      <rect className="fluid" x="96" y={y} width="8" height={bottom - y + 8} fill="var(--mercury)" />
      <circle cx="100" cy="146" r="10" fill="var(--mercury)" stroke="var(--dial-mute)" strokeWidth="1.2" />
      {Array.from({ length: divisions + 1 }, (_, i) => i / divisions).map((r) => {
        const ty = bottom - r * (bottom - top);
        return (
          <g key={r}>
            <line x1="109" y1={ty} x2="118" y2={ty} stroke="var(--dial-ink)" strokeWidth="1.2" />
            <text x="122" y={ty + 3.5} fontSize="10" fill="var(--dial-ink)" fontFamily="var(--font-mono)">
              {formatTick(min + r * (max - min), unit, units)}
            </text>
          </g>
        );
      })}
    </Bezel>
  );
}

/** A graduated measuring cylinder: water for rain. */
export function Cylinder({ kind, quantity, unit, units, label }: GaugeProps) {
  const { min, max, divisions } = instrumentFor(kind);
  const top = 34;
  const bottom = 142;
  const ratio = quantity == null ? 0 : scaleRatio(quantity, min, max);
  const y = bottom - ratio * (bottom - top);
  const figure = quantity == null ? REST : formatQuantity(quantity, unit, units);
  return (
    <Bezel kind={kind} label={label} figure={figure}>
      <path d={`M78 ${top - 8} L78 ${bottom} Q78 ${bottom + 6} 84 ${bottom + 6} L116 ${bottom + 6} Q122 ${bottom + 6} 122 ${bottom} L122 ${top - 8}`} fill="none" stroke="var(--dial-mute)" strokeWidth="1.4" />
      <rect className="fluid" x="80" y={y} width="40" height={bottom + 4 - y} fill="var(--water)" opacity="0.85" />
      {Array.from({ length: divisions + 1 }, (_, i) => i / divisions).map((r) => {
        const ty = bottom - r * (bottom - top);
        return (
          <g key={r}>
            <line x1="122" y1={ty} x2="130" y2={ty} stroke="var(--dial-ink)" strokeWidth="1.2" />
            <text x="133" y={ty + 3.5} fontSize="10" fill="var(--dial-ink)" fontFamily="var(--font-mono)">
              {formatTick(min + r * (max - min), unit, units)}
            </text>
          </g>
        );
      })}
    </Bezel>
  );
}

export function Readout({ kind, quantity, unit, units, label }: GaugeProps) {
  const figure = quantity == null ? REST : formatQuantity(quantity, unit, units);
  return (
    <Bezel kind={kind} label={label} figure={figure}>
      <text x="100" y="106" textAnchor="middle" fontSize="18" fill="var(--dial-ink)" fontFamily="var(--font-mono)">
        {figure}
      </text>
    </Bezel>
  );
}

const FORMS = { dial: Dial, compass: Compass, tube: Tube, cylinder: Cylinder, readout: Readout };

/** The right instrument for a kind of reading. */
export function Gauge(props: GaugeProps) {
  const Form = FORMS[instrumentFor(props.kind).form];
  return <Form {...props} />;
}

/** The brand mark: a sextant's frame, index arm and arc. */
export function Sextant({ size = 24 }: { size?: number }) {
  return (
    <svg viewBox="0 0 64 64" width={size} height={size} fill="none" stroke="var(--tb-accent)" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M32 8 12 50M32 8l20 42" />
      <path d="M9 50a30 30 0 0 0 46 0" />
      <path d="M32 8l9 40" />
      <circle cx="32" cy="8" r="3" fill="var(--tb-accent)" />
    </svg>
  );
}

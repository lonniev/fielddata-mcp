/**
 * The ground behind every page: a vineyard, a field and a kitchen garden, with
 * the robots and sensors that work them.
 *
 * Drawn, for the reasons Bee's Knees' meadow is: one request, sharp at any
 * density, and a fixed table of positions in place of randomness. It never takes
 * a tap and never sits behind text, because every page's words are on opaque
 * cards. The middle of the picture survives a phone's slice, so the station, the
 * rover and the drone stay in frame.
 */

function Vine({ x, y, s }: { x: number; y: number; s: number }) {
  const POSTS = [0, 90, 180, 270, 360];
  const LEAVES = [14, 40, 66, 104, 130, 156, 194, 220, 246, 284, 310, 336];
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      {POSTS.map((p) => <path key={p} d={`M${p} 0V-46`} stroke="var(--scene-post)" strokeWidth="3" />)}
      <path d="M0 -38H360M0 -22H360" stroke="var(--scene-post)" strokeWidth="1" opacity=".7" />
      {LEAVES.map((l, i) => (
        <g key={l}>
          <ellipse cx={l} cy={-32 + (i % 3) * 3} rx="17" ry="13" fill={i % 2 ? "var(--scene-leaf)" : "var(--scene-leaf-2)"} />
          {i % 2 === 0 && (
            <g fill="var(--scene-grape)">
              <circle cx={l - 3} cy={-20} r="2.6" /><circle cx={l + 3} cy={-20} r="2.6" /><circle cx={l} cy={-15} r="2.6" />
            </g>
          )}
        </g>
      ))}
    </g>
  );
}

function Bed({ x, y, plant }: { x: number; y: number; plant: "lettuce" | "tomato" | "kale" }) {
  const SPOTS = [18, 54, 90, 126, 162];
  return (
    <g transform={`translate(${x} ${y})`}>
      {SPOTS.map((p, i) => plant === "tomato" ? (
        <g key={p}>
          <path d={`M${p} 0V-48`} stroke="var(--scene-post)" strokeWidth="2.5" />
          <ellipse cx={p} cy="-26" rx="13" ry="20" fill="var(--scene-leaf)" />
          <circle cx={p - 5} cy="-22" r="3.6" fill="var(--scene-fruit)" />
          <circle cx={p + 6} cy="-32" r="3.2" fill="var(--scene-fruit)" />
        </g>
      ) : (
        <g key={p} fill={plant === "lettuce" ? "var(--scene-sprout)" : "var(--scene-leaf-2)"}>
          <ellipse cx={p} cy="-7" rx="14" ry={i % 2 ? 9 : 11} />
          <ellipse cx={p - 7} cy="-5" rx="7" ry="6" opacity=".8" />
          <ellipse cx={p + 7} cy="-5" rx="7" ry="6" opacity=".8" />
        </g>
      ))}
      <rect x="0" y="0" width="180" height="24" rx="2" fill="var(--scene-wood)" />
      <path d="M0 12H180M60 0V24M120 0V24" stroke="var(--scene-post)" strokeWidth="1" opacity=".6" />
    </g>
  );
}

/** A soil probe: a stake, its head and a lamp that says it is reporting. */
function Probe({ x, y, delay = 0 }: { x: number; y: number; delay?: number }) {
  return (
    <g transform={`translate(${x} ${y})`}>
      <path d="M0 0V-30" stroke="var(--scene-steel)" strokeWidth="3" />
      <rect x="-8" y="-44" width="16" height="16" rx="3" fill="var(--scene-steel)" />
      <circle cy="-36" r="3" fill="var(--scene-signal)" className="scene-pulse" style={{ animationDelay: `${delay}s` }} />
    </g>
  );
}

function Station({ x, y }: { x: number; y: number }) {
  return (
    <g transform={`translate(${x} ${y})`}>
      <path d="M0 0V-210M-22 0L0 -46M22 0L0 -46" stroke="var(--scene-steel)" strokeWidth="5" fill="none" />
      {/* The vane and the anemometer's cups. */}
      <path d="M-58 -210H58" stroke="var(--scene-steel)" strokeWidth="4" />
      <g transform="translate(-58 -210)">
        <path d="M0 0V-22" stroke="var(--scene-steel)" strokeWidth="3" />
        <path d="M-22 -22H22" stroke="var(--scene-steel)" strokeWidth="2.5" />
        <circle cx="-22" cy="-22" r="6" fill="var(--scene-accent)" /><circle cx="22" cy="-22" r="6" fill="var(--scene-accent)" />
      </g>
      <g transform="translate(58 -210)">
        <path d="M0 0V-20" stroke="var(--scene-steel)" strokeWidth="3" />
        <path d="M-26 -20H26M26 -20L12 -29V-11Z" stroke="var(--scene-steel)" strokeWidth="2.5" fill="var(--scene-accent)" />
      </g>
      {/* The sensor array, its rain funnel and the panel that feeds it. */}
      <path d="M-20 -150H20L14 -108H-14Z" fill="var(--scene-white)" stroke="var(--scene-steel)" strokeWidth="2" />
      <path d="M-14 -138H14M-14 -126H14M-14 -115H14" stroke="var(--scene-steel)" strokeWidth="1.5" opacity=".6" />
      <path d="M-13 -150L-20 -168H20L13 -150Z" fill="var(--scene-steel)" />
      <g transform="translate(10 -86) rotate(-22)">
        <rect x="0" y="-11" width="56" height="30" rx="2" fill="var(--scene-panel)" stroke="var(--scene-steel)" strokeWidth="2" />
        <path d="M18 -11V19M37 -11V19M0 4H56" stroke="var(--scene-steel)" strokeWidth="1" opacity=".7" />
      </g>
      {/* Its report, going up. */}
      <g fill="none" stroke="var(--scene-signal)" strokeWidth="3" strokeLinecap="round">
        <path className="scene-pulse" d="M-32 -252a30 30 0 0 1 64 0" />
        <path className="scene-pulse" style={{ animationDelay: ".5s" }} d="M-48 -262a50 50 0 0 1 96 0" />
      </g>
    </g>
  );
}

function Rover({ x, y }: { x: number; y: number }) {
  return (
    <g transform={`translate(${x} ${y})`}>
      <g className="scene-rover">
        <path d="M-26 -38L-74 22H36Z" fill="var(--scene-signal)" opacity=".16" />
        <rect x="-62" y="-14" width="124" height="26" rx="13" fill="var(--scene-tread)" />
        {[-44, -22, 0, 22, 44].map((w) => <circle key={w} cx={w} cy="-1" r="9" fill="var(--scene-steel)" />)}
        <rect x="-52" y="-52" width="104" height="38" rx="8" fill="var(--scene-accent)" />
        <rect x="-40" y="-44" width="44" height="18" rx="3" fill="var(--scene-panel)" />
        <circle cx="30" cy="-34" r="9" fill="var(--scene-white)" /><circle cx="33" cy="-34" r="4" fill="var(--scene-tread)" />
        <path d="M-26 -52V-86M-40 -86H-12" stroke="var(--scene-steel)" strokeWidth="4" />
        <circle cx="-26" cy="-92" r="6" fill="var(--scene-signal)" className="scene-pulse" />
      </g>
    </g>
  );
}

function Drone({ x, y }: { x: number; y: number }) {
  return (
    <g transform={`translate(${x} ${y})`}>
      <g className="scene-drone">
        <path d="M-40 -6H40" stroke="var(--scene-steel)" strokeWidth="4" />
        <path d="M-40 -8V-14M40 -8V-14" stroke="var(--scene-steel)" strokeWidth="3" />
        <ellipse cx="-40" cy="-16" rx="24" ry="3.5" fill="var(--scene-steel)" opacity=".55" />
        <ellipse cx="40" cy="-16" rx="24" ry="3.5" fill="var(--scene-steel)" opacity=".55" />
        <rect x="-18" y="-12" width="36" height="20" rx="8" fill="var(--scene-accent)" />
        <circle cy="11" r="6" fill="var(--scene-tread)" /><circle cy="11" r="2.4" fill="var(--scene-signal)" />
        <path d="M0 20V96" stroke="var(--scene-signal)" strokeWidth="2.5" strokeDasharray="2 9" strokeLinecap="round" />
      </g>
    </g>
  );
}

function GardenBot({ x, y }: { x: number; y: number }) {
  return (
    <g transform={`translate(${x} ${y})`}>
      <circle cx="-17" cy="-9" r="9" fill="var(--scene-tread)" /><circle cx="17" cy="-9" r="9" fill="var(--scene-tread)" />
      <rect x="-26" y="-48" width="52" height="36" rx="10" fill="var(--scene-white)" stroke="var(--scene-steel)" strokeWidth="2" />
      <rect x="-16" y="-78" width="32" height="24" rx="8" fill="var(--scene-accent)" />
      <circle cx="-6" cy="-66" r="3.5" fill="var(--scene-white)" /><circle cx="7" cy="-66" r="3.5" fill="var(--scene-white)" />
      <path d="M0 -78V-90" stroke="var(--scene-steel)" strokeWidth="2.5" /><circle cy="-93" r="3.5" fill="var(--scene-signal)" className="scene-pulse" />
      {/* An arm, a trowel-sized probe on its way into the bed. */}
      <path d="M24 -36L52 -48L70 -18" fill="none" stroke="var(--scene-steel)" strokeWidth="4.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M70 -18V-4" stroke="var(--scene-steel)" strokeWidth="2.5" />
    </g>
  );
}

export default function Fieldscape() {
  const FURROWS = [-470, -360, -255, -160, -70, 20, 110, 200, 295, 395, 500];
  const CROPS = [0.2, 0.42, 0.68];
  return (
    <div aria-hidden="true" className="scene pointer-events-none fixed inset-x-0 bottom-0 -z-10 overflow-hidden">
      <svg viewBox="0 0 1600 440" preserveAspectRatio="xMidYMax slice" className="scene-art block w-full">
        <circle cx="1190" cy="62" r="26" fill="var(--scene-orb)" />
        <path d="M0 196C190 150 340 200 520 176S880 124 1080 164 1420 150 1600 182V440H0Z" fill="var(--scene-hill-far)" />
        <path d="M0 248C200 206 420 262 620 232S1020 196 1240 230 1480 226 1600 240V440H0Z" fill="var(--scene-hill-mid)" />

        {/* The vineyard, on its slope. */}
        <Vine x={30} y={250} s={0.7} />
        <Vine x={230} y={240} s={0.72} />
        <Vine x={-30} y={292} s={0.92} />
        <Vine x={268} y={282} s={0.92} />
        <Vine x={-60} y={348} s={1.2} />
        <Vine x={330} y={342} s={1.2} />

        {/* The greenhouse behind the garden. */}
        <g transform="translate(1290 238)">
          <path d="M0 0V-46A70 42 0 0 1 200 -46V0Z" fill="var(--scene-glass)" stroke="var(--scene-steel)" strokeWidth="2.5" />
          <path d="M50 0V-84M100 0V-90M150 0V-84M0 -30H200" stroke="var(--scene-steel)" strokeWidth="1.5" opacity=".65" />
        </g>

        {/* The near ground, and the field's furrows running to the horizon. */}
        <path d="M0 330C260 296 500 306 800 298S1340 300 1600 322V440H0Z" fill="var(--scene-ground)" />
        <g stroke="var(--scene-furrow)" strokeWidth="5" strokeLinecap="round">
          {FURROWS.map((f) => <path key={f} d={`M${800 + f * 0.26} 302L${800 + f * 1.4} 440`} />)}
        </g>
        <g fill="var(--scene-sprout)">
          {FURROWS.slice(0, -1).flatMap((f, i) => CROPS.map((t) => {
            const px = 800 + ((f + FURROWS[i + 1]) / 2) * (0.26 + 1.14 * t);
            const py = 302 + 138 * t;
            const h = 6 + 18 * t;
            return <path key={`${f}${t}`} d={`M${px} ${py}c${-h * 0.7} ${-h * 0.3} ${-h * 0.7} ${-h} 0 ${-h * 1.1}c${h * 0.7} ${h * 0.1} ${h * 0.7} ${h * 0.8} 0 ${h * 1.1}`} />;
          }))}
        </g>

        <Station x={620} y={346} />
        <Rover x={830} y={384} />
        <Drone x={990} y={150} />

        {/* The kitchen garden. */}
        <Bed x={1160} y={300} plant="tomato" />
        <Bed x={1390} y={306} plant="lettuce" />
        <Bed x={1230} y={378} plant="kale" />
        <Bed x={1440} y={384} plant="lettuce" />
        <Probe x={1148} y={350} />
        <Probe x={1376} y={346} delay={0.7} />
        <Probe x={1424} y={420} delay={1.4} />
        <Probe x={520} y={416} delay={1} />
        <GardenBot x={1130} y={424} />
      </svg>
    </div>
  );
}

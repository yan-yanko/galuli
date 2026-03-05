/**
 * Galu — Galuli's mascot. A minimal geometric octopus with 6 arms,
 * one for each AI engine Galuli tracks: ChatGPT, Perplexity, Claude,
 * Gemini, Grok, Llama.
 *
 * Usage:
 *   <GaluMascot />                      — default 56px, accent purple
 *   <GaluMascot size={80} />            — bigger
 *   <GaluMascot mood="celebrate" />     — arms up 🎉
 *   <GaluMascot mood="scan" />          — arms fanned, scanning pose
 */
export function GaluMascot({ size = 56, color = 'var(--accent)', mood = 'default', style = {} }) {
  // Tentacle paths vary by mood
  const tentacles = {
    // Default: arms hang down and outward
    default: [
      'M26 45 Q10 58 10 72',
      'M31 48 Q20 62 22 76',
      'M37 50 Q32 65 34 78',
      'M43 50 Q48 65 46 78',
      'M49 48 Q60 62 58 76',
      'M54 45 Q70 58 70 72',
    ],
    // Celebrate: outer arms arc up, inner arms stay down
    celebrate: [
      'M26 45 Q4 30 8 14',
      'M31 48 Q22 38 28 22',
      'M37 50 Q32 65 34 78',
      'M43 50 Q48 65 46 78',
      'M49 48 Q58 38 52 22',
      'M54 45 Q76 30 72 14',
    ],
    // Scan: arms fanned out radially, alert/searching pose
    scan: [
      'M26 45 Q8 50 4 65',
      'M31 48 Q16 60 18 75',
      'M37 50 Q32 66 33 80',
      'M43 50 Q48 66 47 80',
      'M49 48 Q64 60 62 75',
      'M54 45 Q72 50 76 65',
    ],
  }

  const arms = tentacles[mood] || tentacles.default
  const strokeWidths = [5.5, 5, 4.5, 4.5, 5, 5.5]

  return (
    <div style={{ display: 'inline-block', lineHeight: 0, ...style }}>
    <svg
      width={size}
      height={size}
      viewBox="0 0 80 80"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* 6 tentacles drawn first so body overlaps them at the join */}
      {arms.map((d, i) => (
        <path
          key={i}
          d={d}
          stroke={color}
          strokeWidth={strokeWidths[i]}
          strokeLinecap="round"
        />
      ))}

      {/* Body */}
      <ellipse cx="40" cy="30" rx="22" ry="20" fill={color} />

      {/* Cheek blush — subtle warmth */}
      <ellipse cx="26" cy="35" rx="5" ry="3" fill="white" opacity="0.14" />
      <ellipse cx="54" cy="35" rx="5" ry="3" fill="white" opacity="0.14" />

      {/* Eyes — white sclera */}
      <circle cx="33" cy="25" r="5.5" fill="white" opacity="0.96" />
      <circle cx="47" cy="25" r="5.5" fill="white" opacity="0.96" />

      {/* Pupils — slightly off-center to look curious */}
      <circle cx="34.2" cy="26.5" r="3" fill="#0a0a12" />
      <circle cx="48.2" cy="26.5" r="3" fill="#0a0a12" />

      {/* Eye shine */}
      <circle cx="36" cy="24.5" r="1.3" fill="white" />
      <circle cx="50" cy="24.5" r="1.3" fill="white" />

      {/* Tiny smile */}
      <path d="M37 35 Q40 38 43 35" stroke="white" strokeWidth="1.4" strokeLinecap="round" opacity="0.6" />
    </svg>
    </div>
  )
}

export const prerender = true;

const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630" role="img" aria-labelledby="title desc">
  <title id="title">Nike Mind: neuroscience-based footwear with 22 moving foam nodes</title>
  <desc id="desc">A clean editorial thumbnail explaining Nike Mind footwear: 22 independently moving foam nodes beneath the foot, developed with EEG research to study calm and focus.</desc>
  <rect width="1200" height="630" fill="#f7f8fb"/>
  <rect x="48" y="48" width="1104" height="534" rx="18" fill="#ffffff" stroke="#d8dee9" stroke-width="2"/>
  <text x="86" y="122" font-family="Arial, Helvetica, sans-serif" font-size="44" font-weight="700" fill="#111827">Nike Mind</text>
  <text x="88" y="160" font-family="Arial, Helvetica, sans-serif" font-size="21" fill="#4b5563">Footwear design meets neuroscience</text>

  <g transform="translate(86 210)">
    <rect width="300" height="180" rx="14" fill="#eef2fb" stroke="#c7d3ea" stroke-width="1.5"/>
    <circle cx="150" cy="58" r="30" fill="#8bb7df"/>
    <text x="150" y="67" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-size="22" font-weight="700" fill="#ffffff">22</text>
    <text x="150" y="118" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-size="20" font-weight="700" fill="#111827">Foam Nodes</text>
    <text x="150" y="146" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-size="15" fill="#4b5563">Independently moving,</text>
    <text x="150" y="166" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-size="15" fill="#4b5563">beneath the foot</text>
  </g>

  <g transform="translate(410 210)">
    <rect width="300" height="180" rx="14" fill="#f6efe3" stroke="#e6d6b8" stroke-width="1.5"/>
    <circle cx="150" cy="58" r="30" fill="#caa13c"/>
    <text x="150" y="66" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-size="18" font-weight="700" fill="#ffffff">EEG</text>
    <text x="150" y="118" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-size="20" font-weight="700" fill="#111827">10+ Years</text>
    <text x="150" y="146" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-size="15" fill="#4b5563">of Nike Sport</text>
    <text x="150" y="166" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-size="15" fill="#4b5563">Research Lab study</text>
  </g>

  <g transform="translate(734 210)">
    <rect width="300" height="180" rx="14" fill="#e9f3ec" stroke="#c3ddc9" stroke-width="1.5"/>
    <circle cx="150" cy="58" r="30" fill="#5fa876"/>
    <text x="150" y="67" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-size="22" font-weight="700" fill="#ffffff">α</text>
    <text x="150" y="118" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-size="20" font-weight="700" fill="#111827">Calm Focus</text>
    <text x="150" y="146" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-size="15" fill="#4b5563">Not a speed or</text>
    <text x="150" y="166" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-size="15" fill="#4b5563">performance shoe</text>
  </g>

  <text x="88" y="450" font-family="Arial, Helvetica, sans-serif" font-size="18" fill="#4b5563">Mind 001 (slip-on mule) and Mind 002 (lace-up sneaker) are Nike's first</text>
  <text x="88" y="478" font-family="Arial, Helvetica, sans-serif" font-size="18" fill="#4b5563">neuroscience-based footwear, built by its Mind Science Department.</text>

  <text x="88" y="552" font-family="Arial, Helvetica, sans-serif" font-size="15" fill="#6b7280">Source: NIKE, Inc. newsroom and Nike Mind team materials, 2026</text>
</svg>`;

export function GET() {
  return new Response(svg, {
    headers: {
      "Content-Type": "image/svg+xml; charset=utf-8",
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
}

export const prerender = true;

const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630" role="img" aria-labelledby="title desc">
  <title id="title">Google's AI evolution across Maps, Photos, Chrome, and Project Genie</title>
  <desc id="desc">A clean editorial thumbnail showing four Google products becoming AI assistants: conversational Google Maps, generative Google Photos, Gemini in Chrome, and Project Genie.</desc>
  <rect width="1200" height="630" fill="#f7f8fb"/>
  <rect x="48" y="48" width="1104" height="534" rx="18" fill="#ffffff" stroke="#d8dee9" stroke-width="2"/>
  <text x="86" y="122" font-family="Arial, Helvetica, sans-serif" font-size="44" font-weight="700" fill="#111827">Google's AI Evolution</text>
  <text x="88" y="160" font-family="Arial, Helvetica, sans-serif" font-size="21" fill="#4b5563">From utilities to conversational, creative assistants</text>

  <g transform="translate(86 200)">
    <rect width="466" height="150" rx="14" fill="#eef2fb" stroke="#c7d3ea" stroke-width="1.5"/>
    <circle cx="46" cy="46" r="26" fill="#8bb7df"/>
    <text x="46" y="54" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-size="22" font-weight="700" fill="#ffffff">M</text>
    <text x="88" y="42" font-family="Arial, Helvetica, sans-serif" font-size="24" font-weight="700" fill="#111827">Maps</text>
    <text x="88" y="70" font-family="Arial, Helvetica, sans-serif" font-size="16" fill="#4b5563">Ask Maps: conversational search</text>
    <text x="88" y="94" font-family="Arial, Helvetica, sans-serif" font-size="16" fill="#4b5563">across 300M+ places</text>
  </g>

  <g transform="translate(576 200)">
    <rect width="466" height="150" rx="14" fill="#f6efe3" stroke="#e6d6b8" stroke-width="1.5"/>
    <circle cx="46" cy="46" r="26" fill="#caa13c"/>
    <text x="46" y="54" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-size="22" font-weight="700" fill="#ffffff">P</text>
    <text x="88" y="42" font-family="Arial, Helvetica, sans-serif" font-size="24" font-weight="700" fill="#111827">Photos</text>
    <text x="88" y="70" font-family="Arial, Helvetica, sans-serif" font-size="16" fill="#4b5563">Photo to video with Veo 3</text>
    <text x="88" y="94" font-family="Arial, Helvetica, sans-serif" font-size="16" fill="#4b5563">in the new Create tab</text>
  </g>

  <g transform="translate(86 366)">
    <rect width="466" height="150" rx="14" fill="#e9f3ec" stroke="#c3ddc9" stroke-width="1.5"/>
    <circle cx="46" cy="46" r="26" fill="#5fa876"/>
    <text x="46" y="54" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-size="22" font-weight="700" fill="#ffffff">C</text>
    <text x="88" y="42" font-family="Arial, Helvetica, sans-serif" font-size="24" font-weight="700" fill="#111827">Chrome</text>
    <text x="88" y="70" font-family="Arial, Helvetica, sans-serif" font-size="16" fill="#4b5563">Gemini side panel + agentic</text>
    <text x="88" y="94" font-family="Arial, Helvetica, sans-serif" font-size="16" fill="#4b5563">auto browse</text>
  </g>

  <g transform="translate(576 366)">
    <rect width="466" height="150" rx="14" fill="#f3e9ef" stroke="#ddc3d3" stroke-width="1.5"/>
    <circle cx="46" cy="46" r="26" fill="#b06a91"/>
    <text x="46" y="54" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-size="22" font-weight="700" fill="#ffffff">G</text>
    <text x="88" y="42" font-family="Arial, Helvetica, sans-serif" font-size="24" font-weight="700" fill="#111827">Project Genie</text>
    <text x="88" y="70" font-family="Arial, Helvetica, sans-serif" font-size="16" fill="#4b5563">Genie 3 world model,</text>
    <text x="88" y="94" font-family="Arial, Helvetica, sans-serif" font-size="16" fill="#4b5563">explorable in real time</text>
  </g>

  <text x="88" y="552" font-family="Arial, Helvetica, sans-serif" font-size="15" fill="#6b7280">Source: Google Blog and Google DeepMind product announcements, 2026</text>
</svg>`;

export function GET() {
  return new Response(svg, {
    headers: {
      "Content-Type": "image/svg+xml; charset=utf-8",
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
}

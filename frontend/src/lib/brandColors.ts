/**
 * Brand colors for places that cannot read CSS variables: Google Maps shapes and
 * pins, SVG strings injected as HTML, and the QR code. Keep in step with --primary,
 * --accent and --card in app/globals.css. Everywhere else use the Tailwind tokens.
 */
export const BRAND_COLORS = {
  primary: "#28363b",
  accent: "#c98260",
  card: "#ffffff",
} as const;

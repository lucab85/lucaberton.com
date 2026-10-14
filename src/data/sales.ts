/**
 * Paid offers. This file is the on/off switch.
 *
 * Empty URL = the offer is hidden everywhere (blog cards, product page,
 * sitemap). Paste the checkout or booking link and merge to start selling.
 *
 *   kit.checkoutUrl     Lemon Squeezy (or Gumroad) product checkout link
 *   expertCall.bookingUrl  Cal.com paid event link (Stripe connected)
 */
export const sales = {
  kit: {
    checkoutUrl: "",
    price: "€49",
    name: "Production AI Platform Kit",
    page: "/production-ai-kit/",
  },
  expertCall: {
    bookingUrl: "",
    price: "€250",
    minutes: 60,
  },
};

export const kitLive = sales.kit.checkoutUrl.startsWith("https://");
export const callLive = sales.expertCall.bookingUrl.startsWith("https://");

/** Posts whose readers are building AI or platform systems get the kit card. */
const KIT_TOPICS = /\b(ai|agent|agents|agentic|mcp|llm|gpu|guardrail|platform|kubernetes|openshift|mlops|rag|inference|api|nordic)/i;

export function kitRelevant(category: string, tags: string[]): boolean {
  return [category, ...tags].some((t) => KIT_TOPICS.test(t || ""));
}

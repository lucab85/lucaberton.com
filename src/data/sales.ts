/**
 * Paid offers. This file is the on/off switch.
 *
 * Empty URL = the offer is hidden everywhere (blog cards, product pages,
 * sitemap). Paste the checkout or booking link and merge to start selling.
 *
 *   kit.checkoutUrl          Gumroad/Lemon Squeezy link, Production AI Platform Kit
 *   claudePack.checkoutUrl   Gumroad/Lemon Squeezy link, Claude Code Guardrails Pack
 *   expertCall.bookingUrl    Cal.com paid event link (Stripe connected)
 */
import { topicCluster } from "../utils/topicCluster";

export const sales = {
  kit: {
    checkoutUrl: "",
    price: "€49",
    currency: "EUR",
    name: "Production AI Platform Kit",
    page: "/production-ai-kit/",
  },
  claudePack: {
    checkoutUrl: "https://lucaberton.gumroad.com/l/Claude-Code-Guardrails-Pack",
    price: "$19",
    currency: "USD", // Gumroad charges in USD
    name: "Claude Code Guardrails Pack",
    page: "/claude-code-guardrails-pack/",
  },
  expertCall: {
    bookingUrl: "",
    price: "€250",
    minutes: 60,
  },
};

const live = (url: string) => url.startsWith("https://");
export const kitLive = live(sales.kit.checkoutUrl);
export const claudePackLive = live(sales.claudePack.checkoutUrl);
export const callLive = live(sales.expertCall.bookingUrl);

/** Posts whose readers are building AI or platform systems get the kit card. */
const KIT_TOPICS = /\b(ai|agent|agents|agentic|mcp|llm|gpu|guardrail|platform|kubernetes|openshift|mlops|rag|inference|api|nordic)/i;

export function kitRelevant(category: string, tags: string[]): boolean {
  return [category, ...tags].some((t) => KIT_TOPICS.test(t || ""));
}

/** Which product card a post shows: Claude Code readers get the pack, AI/platform readers the kit. */
export function productFor(category: string, tags: string[]): "claudePack" | "kit" | null {
  if (topicCluster(category, tags) === "claude_code") return claudePackLive ? "claudePack" : null;
  return kitLive && kitRelevant(category, tags) ? "kit" : null;
}

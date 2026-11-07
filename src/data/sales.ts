/**
 * Paid offers. This file is the on/off switch.
 *
 * Empty URL = the offer is hidden everywhere (blog cards, product pages,
 * sitemap). Paste the checkout or booking link and merge to start selling.
 *
 *   kit.checkoutUrl          Gumroad/Lemon Squeezy link, Production AI Platform Kit
 *   claudePack.checkoutUrl   Gumroad/Lemon Squeezy link, Claude Code Guardrails Pack
 *   expertCall.bookingUrl    Cal.com paid event link (Stripe connected)
 *   hosting.url              Hostinger referral link, Hermes Agent and OpenClaw posts
 */
import { topicCluster } from "../utils/topicCluster";

export const sales = {
  kit: {
    checkoutUrl: "https://lucaberton.gumroad.com/l/Production-AI-Platform-Kit",
    price: "$49",
    currency: "USD", // Gumroad charges in USD
    name: "Production AI Platform Kit",
    page: "/production-ai-kit/",
  },
  claudePack: {
    checkoutUrl: "https://lucaberton.gumroad.com/l/Claude-Code-Guardrails-Pack",
    price: "$19",
    currency: "USD", // Gumroad charges in USD
    // Team licence (up to 20 developers), sold as a version of the same Gumroad
    // product. Leave empty until that version exists on Gumroad.
    teamPrice: "",
    name: "Claude Code Guardrails Pack",
    page: "/claude-code-guardrails-pack/",
  },
  // Hostinger referral: the landing page applies the visitor's discount.
  // Shown on Hermes Agent and OpenClaw posts (HostingStrip.astro), since
  // Hostinger has a one-click template for both.
  hosting: {
    url: "https://www.hostinger.com?REFERRALCODE=Q65DLUCANCD1",
    company: "hostinger",
    offerId: "hostinger_vps_referral",
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
export const hostingLive = live(sales.hosting.url);

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

/**
 * Which self-hosted agent a post is about, for the Hostinger strip; null when
 * neither. Matched on the slug only: tags also catch event recaps that merely
 * mention OpenClaw, where a hosting offer doesn't fit.
 */
export function hostingAgentFor(slug: string): string | null {
  if (!hostingLive) return null;
  const text = slug.toLowerCase();
  const hermes = text.includes("hermes");
  const openclaw = text.includes("openclaw");
  if (hermes && openclaw) return "Hermes Agent or OpenClaw";
  if (hermes) return "Hermes Agent";
  if (openclaw) return "OpenClaw";
  return null;
}

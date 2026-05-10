// Initial seed list parsed from the user's tier list. OpenAI and Anthropic
// promoted to SSS per request.
export const SEED_COMPANIES: { name: string; tier: "SSS" | "SS" | "SS-" | "S" | "A+" | "A" | "B+" }[] = [
  // SSS
  { name: "Anthropic",          tier: "SSS" },
  { name: "OpenAI",             tier: "SSS" },
  { name: "Citadel Securities", tier: "SSS" },
  { name: "Point72",            tier: "SSS" },
  { name: "Jane Street",        tier: "SSS" },
  { name: "Hudson River Trading", tier: "SSS" },
  { name: "Jump Trading",       tier: "SSS" },
  { name: "Bridgewater",        tier: "SSS" },
  { name: "Quadrature Capital", tier: "SSS" },
  // SS
  { name: "Optiver",            tier: "SS" },
  { name: "Two Sigma",          tier: "SS" },
  { name: "D.E. Shaw",          tier: "SS" },
  { name: "Five Rings",         tier: "SS" },
  { name: "Voleon",             tier: "SS" },
  { name: "XTX Markets",        tier: "SS" },
  { name: "Susquehanna",        tier: "SS" },
  // SS-
  { name: "IMC",                tier: "SS-" },
  { name: "SIG",                tier: "SS-" },
  { name: "DRW",                tier: "SS-" },
  { name: "Virtu Financial",    tier: "SS-" },
  { name: "Belvedere Trading",  tier: "SS-" },
  { name: "Millennium",         tier: "SS-" },
  { name: "Tower Research Capital", tier: "SS-" },
  { name: "AQR",                tier: "SS-" },
  // S
  { name: "WorldQuant",         tier: "S" },
  { name: "SquarePoint",        tier: "S" },
  { name: "Akuna Capital",      tier: "S" },
  { name: "Vivcourt",           tier: "S" },
  { name: "NVIDIA",             tier: "S" },
  { name: "Netflix",            tier: "S" },
  { name: "Roblox",             tier: "S" },
  // A+
  { name: "Microsoft",          tier: "A+" },
  { name: "Meta",               tier: "A+" },
  { name: "Apple",              tier: "A+" },
  { name: "Google",             tier: "A+" },
  { name: "Snowflake",          tier: "A+" },
  { name: "Airbnb",             tier: "A+" },
  { name: "Block",              tier: "A+" },
  { name: "Databricks",         tier: "A+" },
  { name: "Tesla",              tier: "A+" },
  { name: "Uber",               tier: "A+" },
  { name: "DoorDash",           tier: "A+" },
  { name: "Stripe",             tier: "A+" },
  { name: "PayPal",             tier: "A+" },
  { name: "Coinbase",           tier: "A+" },
  { name: "Bloomberg",          tier: "A+" },
  // A
  { name: "Notion",             tier: "A" },
  { name: "Asana",              tier: "A" },
  { name: "Coupang",            tier: "A" },
  { name: "Datadog",            tier: "A" },
  { name: "Snap",               tier: "A" },
  { name: "LinkedIn",           tier: "A" },
  { name: "Spotify",            tier: "A" },
  { name: "Dropbox",            tier: "A" },
  { name: "Pinterest",          tier: "A" },
  { name: "Plaid",              tier: "A" },
  { name: "Figma",              tier: "A" },
  { name: "Discord",            tier: "A" },
  { name: "Robinhood",          tier: "A" },
  // B+
  { name: "Amazon",             tier: "B+" },
  { name: "Adobe",              tier: "B+" },
  { name: "Blackstone",         tier: "B+" },
  { name: "Cloudflare",         tier: "B+" },
  { name: "eBay",               tier: "B+" },
  { name: "X",                  tier: "B+" },
  { name: "GitHub",             tier: "B+" },
  { name: "HashiCorp",          tier: "B+" },
  { name: "Oracle",             tier: "B+" },
  { name: "Lyft",               tier: "B+" },
  { name: "Twitch",             tier: "B+" },
  { name: "Atlassian",          tier: "B+" },
  { name: "Salesforce",         tier: "B+" },
];

export const TIERS = ["SSS", "SS", "SS-", "S", "A+", "A", "B+", "Custom"] as const;
export type Tier = (typeof TIERS)[number];

export const TIER_COLORS: Record<Tier, { text: string; bg: string; border: string }> = {
  "SSS":    { text: "text-orange-300",  bg: "bg-orange-950/30",  border: "border-orange-900/40" },
  "SS":     { text: "text-amber-300",   bg: "bg-amber-950/30",   border: "border-amber-900/40" },
  "SS-":    { text: "text-yellow-300",  bg: "bg-yellow-950/30",  border: "border-yellow-900/40" },
  "S":      { text: "text-lime-300",    bg: "bg-lime-950/30",    border: "border-lime-900/40" },
  "A+":     { text: "text-emerald-300", bg: "bg-emerald-950/30", border: "border-emerald-900/40" },
  "A":      { text: "text-cyan-300",    bg: "bg-cyan-950/30",    border: "border-cyan-900/40" },
  "B+":     { text: "text-sky-300",     bg: "bg-sky-950/30",     border: "border-sky-900/40" },
  "Custom": { text: "text-zinc-300",    bg: "bg-zinc-900/40",    border: "border-zinc-800" },
};

export const STATUSES = ["not_applied", "applied", "oa", "interview", "offer", "accepted", "rejected"] as const;
export type Status = (typeof STATUSES)[number];

// Click-cycle order: not_applied → applied → oa → interview → offer → accepted
export const NEXT_STATUS: Record<Status, Status> = {
  not_applied: "applied",
  applied: "oa",
  oa: "interview",
  interview: "offer",
  offer: "accepted",
  accepted: "accepted",
  rejected: "rejected",
};

export const STATUS_LABEL: Record<Status, string> = {
  not_applied: "Not applied",
  applied:     "Applied",
  oa:          "OA",
  interview:   "Interview",
  offer:       "Offer",
  accepted:    "Accepted",
  rejected:    "Rejected",
};

export const PIPELINE_STATUSES: Status[] = ["applied", "oa", "interview", "offer"];

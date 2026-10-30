/** The station accounts a patron can connect, and how each stands from what they have delivered. */

export interface VendorAccount {
  id: string;
  label: string;
  keysAt: string;
  fields: [string, string];
}

export const VENDORS: VendorAccount[] = [
  { id: "ecowitt", label: "Ecowitt", keysAt: "https://www.ecowitt.net/user/index", fields: ["ecowitt_application_key", "ecowitt_api_key"] },
  { id: "ambient", label: "Ambient Weather", keysAt: "https://ambientweather.net/account", fields: ["ambient_application_key", "ambient_api_key"] },
];

export type Standing = { state: "connected" | "partial" | "none"; deliveredAt: string };

export function standing(vendor: VendorAccount, configured: readonly { field: string; delivered_at?: string }[]): Standing {
  const held = configured.filter((c) => vendor.fields.includes(c.field));
  const deliveredAt = held.map((c) => c.delivered_at ?? "").sort().at(-1) ?? "";
  if (held.length === vendor.fields.length) return { state: "connected", deliveredAt };
  return { state: held.length ? "partial" : "none", deliveredAt };
}

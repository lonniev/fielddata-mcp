/** Terms of use. A draft for the owner's review: nothing here has had legal review. */

const SECTIONS: { title: string; says: string[] }[] = [
  { title: "The service", says: [
    "FieldData returns readings from weather stations and soil probes on your own vendor account.",
    "It is provided as is, and readings may be late, missing or wrong: check them before you rely on them for a decision about your crop, your property or your safety.",
  ] },
  { title: "Your keys", says: [
    "You deliver your vendor keys by Nostr message, and the operator stores them encrypted under your npub.",
    "You may delete them at any time, and you remain responsible for your vendor account and its terms.",
  ] },
  { title: "Your data", says: [
    "FieldData passes readings through to you and holds them in a one-minute cache.",
    "Tool calls and balances are recorded so your account can be kept and audited.",
  ] },
  { title: "Fees", says: [
    "Tool fees are set by the operator's live pricing model and shown on the Prices page.",
    "You pay them from a balance funded in Bitcoin Lightning, and a tool call that fails at the vendor is refunded.",
    "Lightning payments are final, and credit may expire as the pricing model states.",
  ] },
  { title: "Your key to the account", says: [
    "Your Nostr key is your identity here, and nobody can recover it for you.",
  ] },
  { title: "Marks", says: [
    "DPYC™, Tollbooth DPYC™ and Don't Pester Your Customer™ are marks of Lonnie VanZandt.",
    "Ecowitt is a trademark of its owner, and no affiliation or endorsement is implied.",
  ] },
];

export default function Terms() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <h1 className="text-3xl">Terms of use</h1>
      {SECTIONS.map((s) => (
        <section key={s.title} className="mt-6">
          <h2 className="text-lg">{s.title}</h2>
          {s.says.map((line) => (
            <p key={line} className="prose-line mt-1 text-sm">{line}</p>
          ))}
        </section>
      ))}
    </div>
  );
}

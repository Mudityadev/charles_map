import Link from "next/link";

const plans = [
  {
    name: "Basic",
    price: "$19",
    description: "Core editing tools for individuals",
    cta: "Start building",
    href: "/signup?plan=basic",
    features: [
      "Draw & edit geometries",
      "Layer toggles & styling",
      "GeoJSON/KML import",
      "PNG/JPEG exports"
    ]
  },
  {
    name: "Standard",
    price: "$79",
    description: "Collaboration & advanced import/export",
    cta: "Upgrade to Standard",
    href: "/signup?plan=standard",
    features: [
      "Real-time collaboration",
      "CSV/Excel import",
      "Layer history & comments",
      "SVG/PDF exports"
    ]
  },
  {
    name: "Premium",
    price: "$199",
    description: "Spatial analytics & 3D visualization",
    cta: "Unlock Premium",
    href: "/signup?plan=premium",
    features: [
      "AI-assisted styling",
      "Advanced analytics & routing",
      "3D terrain & temporal layers",
      "Shapefile/GeoTIFF support"
    ]
  },
  {
    name: "Enterprise",
    price: "Talk to us",
    description: "Security, compliance, & extensibility",
    cta: "Contact sales",
    href: "/contact-sales",
    features: [
      "SSO/SAML & SCIM",
      "IoT ingestion & automations",
      "Audit trails & legal hold",
      "Public API & SDK"
    ]
  }
];

export default function PricingPage() {
  return (
    <main className="mx-auto max-w-6xl px-6 py-24">
      <header className="mb-16 text-center">
        <h1 className="text-4xl font-semibold">Plans for every map team</h1>
        <p className="mt-4 text-lg text-neutral-600">
          Scale from personal cartography to enterprise-grade map production with feature-gated tiers.
        </p>
      </header>
      <section className="grid gap-8 md:grid-cols-2 xl:grid-cols-4">
        {plans.map((plan) => (
          <article key={plan.name} className="flex h-full flex-col rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
            <div className="flex-1">
              <h2 className="text-2xl font-semibold">{plan.name}</h2>
              <p className="mt-2 text-3xl font-bold">{plan.price}</p>
              <p className="mt-4 text-neutral-600">{plan.description}</p>
              <ul className="mt-6 space-y-3 text-sm text-neutral-800">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-center gap-2">
                    <span aria-hidden>•</span>
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
            </div>
            <Link
              href={plan.href}
              className="mt-8 inline-flex items-center justify-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
            >
              {plan.cta}
            </Link>
          </article>
        ))}
      </section>
      <footer className="mt-20 text-center text-sm text-neutral-600">
        Compare plan feature gates in the admin console or contact sales for custom requirements.
      </footer>
    </main>
  );
}

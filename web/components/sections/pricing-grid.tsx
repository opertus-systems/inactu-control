import { PricingTier } from "../../lib/site-content";

type PricingGridProps = {
  tiers: PricingTier[];
};

export function PricingGrid({ tiers }: PricingGridProps) {
  return (
    <section className="grid three-up">
      {tiers.map((tier) => (
        <article className="card" key={tier.name}>
          <h2>{tier.name}</h2>
          <p className="price">{tier.price}</p>
          <p>{tier.note}</p>
          <ul className="mono-list">
            {tier.features.map((feature) => (
              <li key={feature}>{feature}</li>
            ))}
          </ul>
        </article>
      ))}
    </section>
  );
}

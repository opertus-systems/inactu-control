import { MarketingIcon } from "../icons/marketing-icons";
import { FeatureItem } from "../../lib/site-content";

type FeatureGridProps = {
  items: FeatureItem[];
  columns?: "two" | "three";
};

export function FeatureGrid({ items, columns = "three" }: FeatureGridProps) {
  const gridClass = columns === "two" ? "grid two-up" : "grid three-up";

  return (
    <section className={gridClass}>
      {items.map((item) => (
        <article className="card" key={item.title}>
          <span className="icon-wrap" aria-hidden="true">
            <MarketingIcon className="icon" name={item.icon} />
          </span>
          <h2>{item.title}</h2>
          <p>{item.body}</p>
        </article>
      ))}
    </section>
  );
}

import { HeroSection } from "../../components/sections/hero-section";
import { featureBlocks } from "../../lib/site-content";

export default function FeaturesPage() {
  return (
    <main className="page shell-stack">
      <HeroSection
        content={{
          chip: "Features",
          title: "Technical feature surface mapped to verifier and control-plane contracts.",
          description:
            "Each capability below corresponds to explicit API operations, schema constraints, and deterministic runtime behavior."
        }}
      />

      <section className="grid three-up">
        {featureBlocks.map((block) => (
          <article key={block.title} className="card">
            <h2>{block.title}</h2>
            <ul className="mono-list">
              {block.bullets.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </article>
        ))}
      </section>
    </main>
  );
}

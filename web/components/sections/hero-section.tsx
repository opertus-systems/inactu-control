import { HeroContent } from "../../lib/site-content";
import type { ReactNode } from "react";

type HeroSectionProps = {
  content: HeroContent;
  children?: ReactNode;
};

export function HeroSection({ content, children }: HeroSectionProps) {
  return (
    <section className="hero">
      <p className="chip">{content.chip}</p>
      <h1>{content.title}</h1>
      <p className="lede">{content.description}</p>
      {children}
    </section>
  );
}

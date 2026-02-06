import { ContactForm } from "../../components/contact-form";
import { HeroSection } from "../../components/sections/hero-section";
import { company } from "../../lib/site-content";

export default function ContactPage() {
  return (
    <main className="page shell-stack">
      <HeroSection
        content={{
          chip: "Contact",
          title: "Project contact and security review channels.",
          description: "Use this form for implementation questions, security review coordination, or contribution discussions."
        }}
      />

      <section className="grid two-up">
        <article className="card">
          <h2>Maintainer Contact</h2>
          <p>Email: {company.salesEmail}</p>
          <p>Support: {company.supportEmail}</p>
          <p>For critical security disclosures, include impact, reproduction steps, and affected versions.</p>
        </article>

        <article className="card">
          <h2>Send us a message</h2>
          <ContactForm />
        </article>
      </section>
    </main>
  );
}

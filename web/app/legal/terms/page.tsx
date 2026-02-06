import { HeroSection } from "../../../components/sections/hero-section";

export default function TermsPage() {
  return (
    <main className="page shell-stack">
      <HeroSection
        content={{
          chip: "Terms",
          title: "Terms of Service",
          description:
            "Effective date: February 6, 2026. Baseline terms for repository use; replace with legal-approved service terms before commercial production use."
        }}
      />

      <section className="grid two-up">
        <article className="card">
          <h2>Service Usage</h2>
          <p>
            You may use this software in compliance with the project license and applicable law. You are responsible
            for deployment configuration, access control, and integration security in your environment.
          </p>
        </article>

        <article className="card">
          <h2>Security Responsibilities</h2>
          <p>
            Operators are responsible for workload policy settings, credential management, incident response, and
            safeguarding secrets used by automations.
          </p>
        </article>
      </section>

      <section className="card">
        <h2>Availability and Support</h2>
          <p>
            Uptime commitments, support channels, and remedies are not implied by this repository and must be defined
            by your organization or separate agreement.
          </p>
      </section>
    </main>
  );
}

import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "../../../lib/auth";
import { controlApiFetch } from "../../../lib/control-api";
import { PackagesManager } from "../../../components/packages-manager";

type PackageSummary = {
  id: string;
  name: string;
  visibility: "private" | "public";
  description: string | null;
};

export default async function PackagesPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    redirect("/login?callbackUrl=/app/packages");
  }

  const response = await controlApiFetch("/v1/packages", session.user.id, { method: "GET" });
  const payload = (await response.json().catch(() => ({ packages: [] }))) as {
    packages?: PackageSummary[];
    error?: string;
  };
  const packages = payload.packages ?? [];

  return (
    <main className="page shell-stack">
      <section className="card">
        <p className="chip">Packages</p>
        <h1>Package management</h1>
        <p>Create packages, then publish manifest versions directly from this page.</p>
      </section>

      {response.ok ? <PackagesManager initialPackages={packages} /> : <p>Unable to load packages: {payload.error ?? "Unknown error"}.</p>}
    </main>
  );
}

import Link from "next/link";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "../../lib/auth";

export default async function AppHomePage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    redirect("/login?callbackUrl=/app");
  }

  return (
    <main className="page shell-stack">
      <section className="card">
        <p className="chip">Authenticated</p>
        <h1>Control Dashboard</h1>
        <p>Signed in as {session.user.email}.</p>
        <div className="cta-row">
          <Link href="/app/packages" className="btn btn-secondary">
            Packages
          </Link>
          <Link href="/app/contexts" className="btn btn-secondary">
            Contexts
          </Link>
        </div>
      </section>
    </main>
  );
}

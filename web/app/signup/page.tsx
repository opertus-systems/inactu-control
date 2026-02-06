"use client";

import { signIn } from "next-auth/react";
import Link from "next/link";
import { useState } from "react";

export default function SignupPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  return (
    <main className="page shell-stack">
      <section className="card">
        <p className="chip">Account Setup</p>
        <h1>Create account</h1>
        <form
          className="shell-stack"
          onSubmit={async (event) => {
            event.preventDefault();
            setBusy(true);
            setMessage(null);
            const response = await fetch("/api/auth/register", {
              method: "POST",
              headers: { "content-type": "application/json" },
              body: JSON.stringify({ email, password })
            });
            const payload = (await response.json().catch(() => null)) as { error?: string } | null;

            if (!response.ok) {
              setBusy(false);
              setMessage(payload?.error ?? "Unable to create account.");
              return;
            }

            const result = await signIn("credentials", {
              email,
              password,
              callbackUrl: "/app",
              redirect: false
            });
            setBusy(false);
            if (!result || result.error) {
              setMessage("Account created. Please log in.");
              return;
            }
            window.location.href = result.url ?? "/app";
          }}
        >
          <label>
            Email
            <input
              type="email"
              autoComplete="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
            />
          </label>
          <label>
            Password (min 10 chars)
            <input
              type="password"
              autoComplete="new-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
            />
          </label>
          {message ? <p>{message}</p> : null}
          <button className="btn btn-primary" type="submit" disabled={busy}>
            {busy ? "Creating..." : "Create account"}
          </button>
        </form>
        <p>
          Have an account? <Link href="/login">Log in</Link>
        </p>
      </section>
    </main>
  );
}

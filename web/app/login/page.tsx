"use client";

import { signIn } from "next-auth/react";
import Link from "next/link";
import { useState } from "react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  return (
    <main className="page shell-stack">
      <section className="card">
        <p className="chip">Account Access</p>
        <h1>Log in</h1>
        <form
          className="shell-stack"
          onSubmit={async (event) => {
            event.preventDefault();
            setBusy(true);
            setError(null);
            const callbackUrl =
              typeof window !== "undefined"
                ? new URLSearchParams(window.location.search).get("callbackUrl") ?? "/app"
                : "/app";
            const result = await signIn("credentials", {
              email,
              password,
              callbackUrl,
              redirect: false
            });

            setBusy(false);
            if (!result || result.error) {
              setError("Invalid email or password.");
              return;
            }
            window.location.href = result.url ?? callbackUrl;
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
            Password
            <input
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
            />
          </label>
          {error ? <p>{error}</p> : null}
          <button className="btn btn-primary" type="submit" disabled={busy}>
            {busy ? "Logging in..." : "Log in"}
          </button>
        </form>
        <p>
          Need an account? <Link href="/signup">Create one</Link>
        </p>
      </section>
    </main>
  );
}

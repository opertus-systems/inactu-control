import { getServerSession } from "next-auth";
import Link from "next/link";
import { redirect } from "next/navigation";
import { authOptions } from "../../../lib/auth";
import { controlApiFetch } from "../../../lib/control-api";
import { PendingSubmitButton } from "../../../components/pending-submit-button";

type ContextSummary = {
  id: string;
  status: "starting" | "running" | "stopped" | "failed";
  region: string;
  started_at: string;
  ended_at: string | null;
  package: string | null;
  version: string | null;
  last_activity: string;
};

type ContextLogEntry = {
  id: number;
  ts: string;
  severity: string;
  message: string;
  metadata_json: Record<string, unknown> | null;
};

type SearchParams = Record<string, string | string[] | undefined>;

type StatusChangeAuditMetadata = {
  from: string;
  to: string;
};

function firstParam(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

function withParams(current: SearchParams, updates: Record<string, string | undefined>): string {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(current)) {
    const normalized = firstParam(value);
    if (normalized) {
      params.set(key, normalized);
    }
  }

  for (const [key, value] of Object.entries(updates)) {
    if (!value) {
      params.delete(key);
    } else {
      params.set(key, value);
    }
  }

  const query = params.toString();
  return query ? `/app/contexts?${query}` : "/app/contexts";
}

function toIso(value: Date): string {
  return value.toISOString().replace(/\.\d{3}Z$/, "Z");
}

function appendStatusParams(params: URLSearchParams, values: Record<string, string | undefined>): void {
  for (const [key, value] of Object.entries(values)) {
    if (value) {
      params.set(key, value);
    }
  }
}

function parseStatusChangeAuditMetadata(log: ContextLogEntry): StatusChangeAuditMetadata | null {
  const metadata = log.metadata_json;
  if (!metadata) {
    return null;
  }

  const event = metadata.event;
  const from = metadata.from;
  const to = metadata.to;
  if (event !== "context.status_changed" || typeof from !== "string" || typeof to !== "string") {
    return null;
  }

  return { from, to };
}

export default async function ContextsPage({
  searchParams
}: {
  searchParams: SearchParams;
}) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    redirect("/login?callbackUrl=/app/contexts");
  }

  const status = firstParam(searchParams.status);
  const selectedContextId = firstParam(searchParams.contextId);
  const severity = firstParam(searchParams.severity);
  const q = firstParam(searchParams.q);
  const from = firstParam(searchParams.from);
  const to = firstParam(searchParams.to);
  const beforeId = firstParam(searchParams.beforeId);
  const notice = firstParam(searchParams.notice);
  const error = firstParam(searchParams.error);
  const now = new Date();
  const nowIso = toIso(now);
  const last15mIso = toIso(new Date(now.getTime() - 15 * 60 * 1000));
  const last1hIso = toIso(new Date(now.getTime() - 60 * 60 * 1000));
  const todayUtcStartIso = toIso(
    new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 0, 0, 0))
  );

  async function createContextAction(formData: FormData) {
    "use server";

    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      redirect("/login?callbackUrl=/app/contexts");
    }

    const statusValue = String(formData.get("create_status") ?? "").trim();
    const regionValue = String(formData.get("create_region") ?? "").trim();
    const packageValue = String(formData.get("create_package") ?? "").trim();
    const versionValue = String(formData.get("create_version") ?? "").trim();
    const returnStatus = String(formData.get("return_status") ?? "").trim() || undefined;
    const returnSeverity = String(formData.get("return_severity") ?? "").trim() || undefined;
    const returnQ = String(formData.get("return_q") ?? "").trim() || undefined;
    const returnFrom = String(formData.get("return_from") ?? "").trim() || undefined;
    const returnTo = String(formData.get("return_to") ?? "").trim() || undefined;

    const payload: {
      status: string;
      region: string;
      package?: string;
      version?: string;
    } = {
      status: statusValue,
      region: regionValue
    };

    if (packageValue && versionValue) {
      payload.package = packageValue;
      payload.version = versionValue;
    }

    const response = await controlApiFetch("/v1/contexts", session.user.id, {
      method: "POST",
      body: JSON.stringify(payload)
    });
    const body = (await response.json().catch(() => null)) as
      | { context?: { id?: string }; error?: string }
      | null;

    const nextParams = new URLSearchParams();
    appendStatusParams(nextParams, {
      status: returnStatus,
      severity: returnSeverity,
      q: returnQ,
      from: returnFrom,
      to: returnTo
    });

    if (response.ok && body?.context?.id) {
      nextParams.set("contextId", body.context.id);
      nextParams.set("notice", "Context created.");
    } else {
      nextParams.set("error", body?.error ?? "Failed to create context.");
    }

    redirect(`/app/contexts?${nextParams.toString()}`);
  }

  async function appendLogAction(formData: FormData) {
    "use server";

    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      redirect("/login?callbackUrl=/app/contexts");
    }

    const contextId = String(formData.get("context_id") ?? "").trim();
    const severityValue = String(formData.get("log_severity") ?? "").trim();
    const messageValue = String(formData.get("log_message") ?? "").trim();
    const metadataValue = String(formData.get("log_metadata_json") ?? "").trim();
    const returnStatus = String(formData.get("return_status") ?? "").trim() || undefined;
    const returnSeverity = String(formData.get("return_severity") ?? "").trim() || undefined;
    const returnQ = String(formData.get("return_q") ?? "").trim() || undefined;
    const returnFrom = String(formData.get("return_from") ?? "").trim() || undefined;
    const returnTo = String(formData.get("return_to") ?? "").trim() || undefined;

    const nextParams = new URLSearchParams();
    appendStatusParams(nextParams, {
      contextId: contextId || undefined,
      status: returnStatus,
      severity: returnSeverity,
      q: returnQ,
      from: returnFrom,
      to: returnTo
    });

    if (!contextId) {
      nextParams.set("error", "Context id is required.");
      redirect(`/app/contexts?${nextParams.toString()}`);
    }

    let metadataJson: Record<string, unknown> | null | undefined = undefined;
    if (metadataValue) {
      let parsed: unknown;
      try {
        parsed = JSON.parse(metadataValue) as unknown;
      } catch {
        nextParams.set("error", "Metadata JSON is invalid.");
        redirect(`/app/contexts?${nextParams.toString()}`);
      }
      if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
        nextParams.set("error", "Metadata JSON must be an object.");
        redirect(`/app/contexts?${nextParams.toString()}`);
      }
      metadataJson = parsed as Record<string, unknown>;
    }

    const response = await controlApiFetch(`/v1/contexts/${encodeURIComponent(contextId)}/logs`, session.user.id, {
      method: "POST",
      body: JSON.stringify({
        severity: severityValue,
        message: messageValue,
        metadata_json: metadataJson
      })
    });
    const body = (await response.json().catch(() => null)) as { error?: string } | null;

    if (response.ok) {
      nextParams.set("notice", "Log appended.");
    } else {
      nextParams.set("error", body?.error ?? "Failed to append log.");
    }

    redirect(`/app/contexts?${nextParams.toString()}`);
  }

  async function updateContextStatusAction(formData: FormData) {
    "use server";

    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      redirect("/login?callbackUrl=/app/contexts");
    }

    const contextId = String(formData.get("context_id") ?? "").trim();
    const statusValue = String(formData.get("context_status") ?? "").trim();
    const returnStatus = String(formData.get("return_status") ?? "").trim() || undefined;
    const returnSeverity = String(formData.get("return_severity") ?? "").trim() || undefined;
    const returnQ = String(formData.get("return_q") ?? "").trim() || undefined;
    const returnFrom = String(formData.get("return_from") ?? "").trim() || undefined;
    const returnTo = String(formData.get("return_to") ?? "").trim() || undefined;

    const nextParams = new URLSearchParams();
    appendStatusParams(nextParams, {
      contextId: contextId || undefined,
      status: returnStatus,
      severity: returnSeverity,
      q: returnQ,
      from: returnFrom,
      to: returnTo
    });

    if (!contextId) {
      nextParams.set("error", "Context id is required.");
      redirect(`/app/contexts?${nextParams.toString()}`);
    }

    const response = await controlApiFetch(`/v1/contexts/${encodeURIComponent(contextId)}`, session.user.id, {
      method: "PATCH",
      body: JSON.stringify({ status: statusValue })
    });
    const body = (await response.json().catch(() => null)) as { error?: string } | null;

    if (response.ok) {
      nextParams.set("notice", `Context set to ${statusValue}.`);
    } else {
      nextParams.set("error", body?.error ?? "Failed to update context status.");
    }

    redirect(`/app/contexts?${nextParams.toString()}`);
  }

  const listParams = new URLSearchParams();
  if (status) {
    listParams.set("status", status);
  }
  listParams.set("limit", "100");
  const contextsPath = `/v1/contexts?${listParams.toString()}`;
  const contextsResponse = await controlApiFetch(contextsPath, session.user.id, { method: "GET" });
  const contextsPayload = (await contextsResponse.json().catch(() => ({ contexts: [] }))) as {
    contexts?: ContextSummary[];
    error?: string;
  };
  const contexts = contextsPayload.contexts ?? [];

  const activeContextId = selectedContextId ?? contexts[0]?.id;
  let activeContext: ContextSummary | null = null;
  let logs: ContextLogEntry[] = [];
  let logsError: string | null = null;
  let nextBeforeId: number | null = null;

  if (activeContextId) {
    const detailResponse = await controlApiFetch(`/v1/contexts/${encodeURIComponent(activeContextId)}`, session.user.id, {
      method: "GET"
    });
    const detailPayload = (await detailResponse.json().catch(() => null)) as
      | { context?: ContextSummary; error?: string }
      | null;
    if (detailResponse.ok && detailPayload?.context) {
      activeContext = detailPayload.context;
    } else {
      logsError = detailPayload?.error ?? "Failed to load context details.";
    }

    const logsParams = new URLSearchParams();
    logsParams.set("limit", "50");
    if (severity) {
      logsParams.set("severity", severity);
    }
    if (q) {
      logsParams.set("q", q);
    }
    if (from) {
      logsParams.set("from", from);
    }
    if (to) {
      logsParams.set("to", to);
    }
    if (beforeId) {
      logsParams.set("before_id", beforeId);
    }
    const logsResponse = await controlApiFetch(
      `/v1/contexts/${encodeURIComponent(activeContextId)}/logs?${logsParams.toString()}`,
      session.user.id,
      { method: "GET" }
    );
    const logsPayload = (await logsResponse.json().catch(() => null)) as
      | { logs?: ContextLogEntry[]; next_before_id?: number; error?: string }
      | null;
    if (logsResponse.ok) {
      logs = logsPayload?.logs ?? [];
      nextBeforeId = logsPayload?.next_before_id ?? null;
    } else {
      logsError = logsPayload?.error ?? "Failed to load logs.";
    }
  }

  return (
    <main className="page shell-stack">
      <section className="card">
        <p className="chip">Contexts</p>
        <h1>Cloud contexts and logs</h1>
        <p>Inspect runtime status and recent logs for your active contexts.</p>
        {notice ? <p>{notice}</p> : null}
        {error ? <p>{error}</p> : null}
      </section>

      <section className="card shell-stack">
        <h2>Context list</h2>
        <form action={createContextAction} className="shell-stack">
          <h3>Create context</h3>
          {status ? <input type="hidden" name="return_status" value={status} /> : null}
          {severity ? <input type="hidden" name="return_severity" value={severity} /> : null}
          {q ? <input type="hidden" name="return_q" value={q} /> : null}
          {from ? <input type="hidden" name="return_from" value={from} /> : null}
          {to ? <input type="hidden" name="return_to" value={to} /> : null}
          <label>
            Status
            <select name="create_status" defaultValue="running" required>
              <option value="starting">starting</option>
              <option value="running">running</option>
              <option value="stopped">stopped</option>
              <option value="failed">failed</option>
            </select>
          </label>
          <label>
            Region
            <input name="create_region" type="text" defaultValue="local-dev" required />
          </label>
          <label>
            Package (optional)
            <input name="create_package" type="text" placeholder="example-package" />
          </label>
          <label>
            Version (optional)
            <input name="create_version" type="text" placeholder="0.1.0" />
          </label>
          <PendingSubmitButton
            className="btn btn-primary"
            idleText="Create context"
            pendingText="Creating..."
          />
        </form>

        <form method="GET" action="/app/contexts" className="cta-row">
          <label>
            Status
            <select name="status" defaultValue={status ?? ""}>
              <option value="">all</option>
              <option value="starting">starting</option>
              <option value="running">running</option>
              <option value="stopped">stopped</option>
              <option value="failed">failed</option>
            </select>
          </label>
          {activeContextId ? <input type="hidden" name="contextId" value={activeContextId} /> : null}
          <button className="btn btn-secondary" type="submit">
            Apply
          </button>
        </form>

        {!contextsResponse.ok ? <p>Unable to load contexts: {contextsPayload.error ?? "Unknown error"}.</p> : null}
        {contextsResponse.ok && contexts.length === 0 ? <p>No contexts found for this account.</p> : null}
        {contexts.length > 0 ? (
          <ul className="signal-list">
            {contexts.map((context) => (
              <li key={context.id}>
                <strong>{context.id}</strong> ({context.status}) {context.region}
                <br />
                package: {context.package ?? "none"}{context.version ? `@${context.version}` : ""}
                <br />
                last activity: {new Date(context.last_activity).toLocaleString()}
                <br />
                <Link
                  className="btn btn-secondary"
                  href={withParams(searchParams, { contextId: context.id, beforeId: undefined })}
                >
                  Open context
                </Link>
              </li>
            ))}
          </ul>
        ) : null}
      </section>

      <section className="card shell-stack">
        <h2>Context detail</h2>
        {!activeContextId ? <p>Select a context to view details and logs.</p> : null}
        {activeContext ? (
          <div>
            <p>
              <strong>ID:</strong> {activeContext.id}
            </p>
            <p>
              <strong>Status:</strong> {activeContext.status}
            </p>
            <p>
              <strong>Region:</strong> {activeContext.region}
            </p>
            <p>
              <strong>Started:</strong> {new Date(activeContext.started_at).toLocaleString()}
            </p>
            <p>
              <strong>Ended:</strong>{" "}
              {activeContext.ended_at ? new Date(activeContext.ended_at).toLocaleString() : "active"}
            </p>
            <p>
              <strong>Package:</strong> {activeContext.package ?? "none"}
              {activeContext.version ? `@${activeContext.version}` : ""}
            </p>
          </div>
        ) : null}
        {activeContextId ? (
          <form action={updateContextStatusAction} className="cta-row">
            <input type="hidden" name="context_id" value={activeContextId} />
            {status ? <input type="hidden" name="return_status" value={status} /> : null}
            {severity ? <input type="hidden" name="return_severity" value={severity} /> : null}
            {q ? <input type="hidden" name="return_q" value={q} /> : null}
            {from ? <input type="hidden" name="return_from" value={from} /> : null}
            {to ? <input type="hidden" name="return_to" value={to} /> : null}
            <label>
              Set status
              <select name="context_status" defaultValue={activeContext?.status ?? "running"}>
                <option value="starting">starting</option>
                <option value="running">running</option>
                <option value="stopped">stopped</option>
                <option value="failed">failed</option>
              </select>
            </label>
            <PendingSubmitButton
              className="btn btn-primary"
              idleText="Update status"
              pendingText="Updating..."
            />
          </form>
        ) : null}
        {activeContextId ? (
          <form method="GET" action="/app/contexts" className="cta-row">
            <input type="hidden" name="contextId" value={activeContextId} />
            {status ? <input type="hidden" name="status" value={status} /> : null}
            <label>
              Severity
              <select name="severity" defaultValue={severity ?? ""}>
                <option value="">all</option>
                <option value="debug">debug</option>
                <option value="info">info</option>
                <option value="warn">warn</option>
                <option value="error">error</option>
              </select>
            </label>
            <label>
              Search
              <input name="q" type="text" defaultValue={q ?? ""} placeholder="message contains..." />
            </label>
            <label>
              From (RFC3339)
              <input name="from" type="text" defaultValue={from ?? ""} placeholder="2026-02-06T00:00:00Z" />
            </label>
            <label>
              To (RFC3339)
              <input name="to" type="text" defaultValue={to ?? ""} placeholder="2026-02-06T23:59:59Z" />
            </label>
            <button className="btn btn-secondary" type="submit">
              Filter logs
            </button>
          </form>
        ) : null}
        {activeContextId ? (
          <div className="cta-row">
            <Link
              className="btn btn-secondary"
              href={withParams(searchParams, {
                contextId: activeContextId,
                from: last15mIso,
                to: nowIso,
                beforeId: undefined
              })}
            >
              Last 15m
            </Link>
            <Link
              className="btn btn-secondary"
              href={withParams(searchParams, {
                contextId: activeContextId,
                from: last1hIso,
                to: nowIso,
                beforeId: undefined
              })}
            >
              Last 1h
            </Link>
            <Link
              className="btn btn-secondary"
              href={withParams(searchParams, {
                contextId: activeContextId,
                from: todayUtcStartIso,
                to: nowIso,
                beforeId: undefined
              })}
            >
              Today UTC
            </Link>
          </div>
        ) : null}
        {activeContextId ? (
          <form action={appendLogAction} className="shell-stack">
            <h3>Append test log</h3>
            <input type="hidden" name="context_id" value={activeContextId} />
            {status ? <input type="hidden" name="return_status" value={status} /> : null}
            {severity ? <input type="hidden" name="return_severity" value={severity} /> : null}
            {q ? <input type="hidden" name="return_q" value={q} /> : null}
            {from ? <input type="hidden" name="return_from" value={from} /> : null}
            {to ? <input type="hidden" name="return_to" value={to} /> : null}
            <label>
              Severity
              <select name="log_severity" defaultValue="info" required>
                <option value="debug">debug</option>
                <option value="info">info</option>
                <option value="warn">warn</option>
                <option value="error">error</option>
              </select>
            </label>
            <label>
              Message
              <input name="log_message" type="text" placeholder="Context heartbeat" required />
            </label>
            <label>
              Metadata JSON (optional)
              <textarea
                name="log_metadata_json"
                rows={4}
                placeholder='{"source":"dashboard"}'
                style={{ width: "100%", fontFamily: "var(--font-mono)" }}
              />
            </label>
            <PendingSubmitButton
              className="btn btn-primary"
              idleText="Append log"
              pendingText="Appending..."
            />
          </form>
        ) : null}
        {logsError ? <p>{logsError}</p> : null}
        {activeContextId && !logsError && logs.length === 0 ? <p>No matching logs.</p> : null}
        {logs.length > 0 ? (
          <>
            <ul className="signal-list context-log-list">
              {logs.map((log) => {
                const statusChange = parseStatusChangeAuditMetadata(log);
                return (
                  <li key={log.id} className={statusChange ? "context-log-entry context-log-entry-audit" : "context-log-entry"}>
                    <strong>{log.severity}</strong> [{new Date(log.ts).toLocaleString()}]
                    {statusChange ? <span className="chip context-log-audit-chip">status change</span> : null}
                    <br />
                    {log.message}
                    {statusChange ? (
                      <>
                        <br />
                        <span className="context-log-transition">
                          {statusChange.from} {"->"} {statusChange.to}
                        </span>
                      </>
                    ) : null}
                  </li>
                );
              })}
            </ul>
            {nextBeforeId ? (
              <Link
                className="btn btn-secondary"
                href={withParams(searchParams, { contextId: activeContextId, beforeId: String(nextBeforeId) })}
              >
                Load older logs
              </Link>
            ) : null}
          </>
        ) : null}
      </section>
    </main>
  );
}

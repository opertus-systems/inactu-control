"use client";

import { useEffect, useMemo, useState } from "react";

type PackageSummary = {
  id: string;
  name: string;
  visibility: "private" | "public";
  description: string | null;
};

type Props = {
  initialPackages: PackageSummary[];
};

type PackageVersionSummary = {
  version: string;
  artifact_digest: string;
  published_at: string;
  deprecated_at: string | null;
};

const DEFAULT_MANIFEST = `{
  "name": "",
  "version": "0.1.0",
  "artifact": "sha256:replace-me",
  "capabilities": []
}`;

export function PackagesManager({ initialPackages }: Props) {
  const [packages, setPackages] = useState<PackageSummary[]>(initialPackages);
  const [createName, setCreateName] = useState("");
  const [createVisibility, setCreateVisibility] = useState<"private" | "public">("private");
  const [createDescription, setCreateDescription] = useState("");
  const [createBusy, setCreateBusy] = useState(false);
  const [createMessage, setCreateMessage] = useState<string | null>(null);

  const [selectedPackage, setSelectedPackage] = useState(initialPackages[0]?.name ?? "");
  const [manifestJson, setManifestJson] = useState(DEFAULT_MANIFEST);
  const [publishBusy, setPublishBusy] = useState(false);
  const [publishMessage, setPublishMessage] = useState<string | null>(null);
  const [versions, setVersions] = useState<PackageVersionSummary[]>([]);
  const [versionsBusy, setVersionsBusy] = useState(false);
  const [versionsMessage, setVersionsMessage] = useState<string | null>(null);
  const [deprecatingVersion, setDeprecatingVersion] = useState<string | null>(null);

  const sortedPackages = useMemo(
    () => [...packages].sort((a, b) => a.name.localeCompare(b.name)),
    [packages]
  );

  async function loadVersions(packageName: string) {
    if (!packageName) {
      setVersions([]);
      setVersionsMessage(null);
      return;
    }

    setVersionsBusy(true);
    setVersionsMessage(null);
    const response = await fetch(`/api/packages/${encodeURIComponent(packageName)}/versions`);
    const payload = (await response.json().catch(() => null)) as
      | { versions?: PackageVersionSummary[]; error?: string }
      | null;
    setVersionsBusy(false);

    if (!response.ok) {
      setVersions([]);
      setVersionsMessage(payload?.error ?? "Failed to load versions.");
      return;
    }

    setVersions(payload?.versions ?? []);
  }

  useEffect(() => {
    // This effect intentionally refreshes local UI state when the selected package changes.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadVersions(selectedPackage);
  }, [selectedPackage]);

  return (
    <section className="shell-stack">
      <article className="card">
        <p className="chip">Create Package</p>
        <h2>New package</h2>
        <form
          className="shell-stack"
          onSubmit={async (event) => {
            event.preventDefault();
            setCreateBusy(true);
            setCreateMessage(null);
            const response = await fetch("/api/packages", {
              method: "POST",
              headers: { "content-type": "application/json" },
              body: JSON.stringify({
                name: createName.trim(),
                visibility: createVisibility,
                description: createDescription.trim() || null
              })
            });
            const payload = (await response.json().catch(() => null)) as
              | { package?: PackageSummary; error?: string }
              | null;
            setCreateBusy(false);

            if (!response.ok || !payload?.package) {
              setCreateMessage(payload?.error ?? "Failed to create package.");
              return;
            }

            setPackages((current) => [...current, payload.package!]);
            if (!selectedPackage) {
              setSelectedPackage(payload.package.name);
            }
            setCreateName("");
            setCreateDescription("");
            setCreateVisibility("private");
            setCreateMessage(`Created package ${payload.package.name}.`);
          }}
        >
          <label>
            Name
            <input
              type="text"
              value={createName}
              onChange={(event) => setCreateName(event.target.value)}
              placeholder="example-package"
              required
            />
          </label>
          <label>
            Visibility
            <select
              value={createVisibility}
              onChange={(event) => setCreateVisibility(event.target.value as "private" | "public")}
            >
              <option value="private">private</option>
              <option value="public">public</option>
            </select>
          </label>
          <label>
            Description
            <input
              type="text"
              value={createDescription}
              onChange={(event) => setCreateDescription(event.target.value)}
              placeholder="Optional package description"
            />
          </label>
          {createMessage ? <p>{createMessage}</p> : null}
          <button className="btn btn-primary" type="submit" disabled={createBusy}>
            {createBusy ? "Creating..." : "Create package"}
          </button>
        </form>
      </article>

      <article className="card">
        <p className="chip">Publish Version</p>
        <h2>Publish package version</h2>
        <form
          className="shell-stack"
          onSubmit={async (event) => {
            event.preventDefault();
            if (!selectedPackage) {
              setPublishMessage("Create or select a package first.");
              return;
            }

            setPublishBusy(true);
            setPublishMessage(null);

            let parsedManifest: unknown;
            try {
              parsedManifest = JSON.parse(manifestJson);
            } catch {
              setPublishBusy(false);
              setPublishMessage("Manifest must be valid JSON.");
              return;
            }

            const response = await fetch(`/api/packages/${encodeURIComponent(selectedPackage)}/versions`, {
              method: "POST",
              headers: { "content-type": "application/json" },
              body: JSON.stringify({ manifest: parsedManifest })
            });
            const payload = (await response.json().catch(() => null)) as
              | { package?: string; version?: string; error?: string }
              | null;
            setPublishBusy(false);

            if (!response.ok) {
              setPublishMessage(payload?.error ?? "Failed to publish version.");
              return;
            }

            setPublishMessage(`Published ${payload?.package}@${payload?.version}.`);
            await loadVersions(selectedPackage);
          }}
        >
          <label>
            Package
            <select value={selectedPackage} onChange={(event) => setSelectedPackage(event.target.value)} required>
              <option value="" disabled>
                Select package
              </option>
              {sortedPackages.map((item) => (
                <option key={item.id} value={item.name}>
                  {item.name}
                </option>
              ))}
            </select>
          </label>
          <label>
            Manifest JSON
            <textarea
              value={manifestJson}
              onChange={(event) => setManifestJson(event.target.value)}
              rows={12}
              spellCheck={false}
              style={{ width: "100%", fontFamily: "var(--font-mono)" }}
            />
          </label>
          {publishMessage ? <p>{publishMessage}</p> : null}
          <button className="btn btn-primary" type="submit" disabled={publishBusy}>
            {publishBusy ? "Publishing..." : "Publish version"}
          </button>
        </form>
      </article>

      <article className="card">
        <p className="chip">Version History</p>
        <h2>Versions</h2>
        {!selectedPackage ? (
          <p>Select a package to view versions.</p>
        ) : versionsBusy ? (
          <p>Loading versions...</p>
        ) : versionsMessage ? (
          <p>{versionsMessage}</p>
        ) : versions.length === 0 ? (
          <p>No versions published for {selectedPackage}.</p>
        ) : (
          <ul className="signal-list">
            {versions.map((item) => (
              <li key={item.version}>
                <strong>{item.version}</strong> {item.deprecated_at ? "(deprecated)" : ""}
                <br />
                <code>{item.artifact_digest}</code>
                <br />
                published: {new Date(item.published_at).toLocaleString()}
                {item.deprecated_at ? `, deprecated: ${new Date(item.deprecated_at).toLocaleString()}` : ""}
                {!item.deprecated_at ? (
                  <>
                    <br />
                    <button
                      className="btn btn-secondary"
                      type="button"
                      disabled={deprecatingVersion === item.version}
                      onClick={async () => {
                        if (!selectedPackage) {
                          return;
                        }
                        setDeprecatingVersion(item.version);
                        setVersionsMessage(null);
                        const response = await fetch(
                          `/api/packages/${encodeURIComponent(selectedPackage)}/versions/${encodeURIComponent(item.version)}/deprecate`,
                          { method: "POST" }
                        );
                        const payload = (await response.json().catch(() => null)) as { error?: string } | null;
                        setDeprecatingVersion(null);

                        if (!response.ok) {
                          setVersionsMessage(payload?.error ?? "Failed to deprecate version.");
                          return;
                        }
                        await loadVersions(selectedPackage);
                      }}
                    >
                      {deprecatingVersion === item.version ? "Deprecating..." : "Deprecate"}
                    </button>
                  </>
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </article>

      <article className="card">
        <p className="chip">Package List</p>
        <h2>Your packages</h2>
        {sortedPackages.length > 0 ? (
          <ul className="signal-list">
            {sortedPackages.map((item) => (
              <li key={item.id}>
                <strong>{item.name}</strong> ({item.visibility})
                {item.description ? ` - ${item.description}` : ""}
              </li>
            ))}
          </ul>
        ) : (
          <p>No packages yet.</p>
        )}
      </article>
    </section>
  );
}

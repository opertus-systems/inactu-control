import { SVGProps } from "react";

export type MarketingIconName =
  | "shield"
  | "fingerprint"
  | "users"
  | "workflow"
  | "rocket";

type IconProps = SVGProps<SVGSVGElement>;

function ShieldIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}>
      <path d="M12 3l7 3v6c0 5-3.2 7.8-7 9-3.8-1.2-7-4-7-9V6l7-3z" />
      <path d="M9.5 12.5l1.8 1.8 3.4-3.6" />
    </svg>
  );
}

function FingerprintIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}>
      <path d="M7 10.5a5 5 0 0 1 10 0" />
      <path d="M5 12.5a7 7 0 0 1 14 0" />
      <path d="M9 14v1.3a3 3 0 0 0 6 0V14" />
      <path d="M12 7.5a3 3 0 0 1 3 3v1.5" />
      <path d="M12 17.5v2" />
    </svg>
  );
}

function UsersIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}>
      <path d="M16 20v-1.4a4 4 0 0 0-8 0V20" />
      <circle cx="12" cy="10" r="3" />
      <path d="M20 20v-1a3 3 0 0 0-2.4-2.9" />
      <path d="M4 20v-1A3 3 0 0 1 6.4 16" />
    </svg>
  );
}

function WorkflowIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}>
      <rect x="3" y="4" width="6" height="4" rx="1" />
      <rect x="15" y="4" width="6" height="4" rx="1" />
      <rect x="9" y="16" width="6" height="4" rx="1" />
      <path d="M6 8v4h12V8" />
      <path d="M12 12v4" />
    </svg>
  );
}

function RocketIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}>
      <path d="M13.5 4.5c3.8-.5 6 1.7 5.5 5.5l-2.8 2.8-2.7-2.7-2.7-2.7 2.7-2.9z" />
      <path d="M10.8 7.3l5.9 5.9" />
      <path d="M8.2 9.8 6 12l1.7 4.3L12 18l2.2-2.2" />
      <path d="M5 19c1.2-.2 2.2-1.2 2.4-2.4" />
    </svg>
  );
}

export function MarketingIcon({ name, ...props }: { name: MarketingIconName } & IconProps) {
  if (name === "shield") return <ShieldIcon {...props} />;
  if (name === "fingerprint") return <FingerprintIcon {...props} />;
  if (name === "users") return <UsersIcon {...props} />;
  if (name === "workflow") return <WorkflowIcon {...props} />;
  return <RocketIcon {...props} />;
}

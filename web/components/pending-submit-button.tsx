"use client";

import { useFormStatus } from "react-dom";

type Props = {
  idleText: string;
  pendingText: string;
  className?: string;
};

export function PendingSubmitButton({ idleText, pendingText, className }: Props) {
  const { pending } = useFormStatus();

  return (
    <button className={className} type="submit" disabled={pending}>
      {pending ? pendingText : idleText}
    </button>
  );
}

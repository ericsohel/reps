"use client";

import { useFormStatus } from "react-dom";

export function SubmitButton({ children, className }: { children: React.ReactNode; className?: string }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className={`btn-primary ${className ?? "w-full py-3"}`}
    >
      {pending ? "Saving…" : children}
    </button>
  );
}

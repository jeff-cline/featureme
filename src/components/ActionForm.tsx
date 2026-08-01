"use client";
import { useActionState } from "react";

type Result = { error?: string; ok?: boolean; message?: string } | null;
type Action = (prev: Result, formData: FormData) => Promise<Result>;

// Generic client wrapper for server actions that return {error|ok|message}.
export default function ActionForm({
  action,
  children,
  submitLabel = "Save",
  className = "",
}: {
  action: Action;
  children: React.ReactNode;
  submitLabel?: string;
  className?: string;
}) {
  const [state, formAction, pending] = useActionState<Result, FormData>(action, null);
  return (
    <form action={formAction} className={className}>
      {state?.error && (
        <p className="mb-3 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{state.error}</p>
      )}
      {state?.ok && state.message && (
        <p className="mb-3 rounded-md bg-green-50 px-3 py-2 text-sm text-green-700">{state.message}</p>
      )}
      {children}
      <button
        type="submit"
        disabled={pending}
        className="mt-4 inline-flex items-center rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-800 disabled:opacity-60"
      >
        {pending ? "Working…" : submitLabel}
      </button>
    </form>
  );
}

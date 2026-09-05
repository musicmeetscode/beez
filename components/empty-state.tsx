import { Inbox } from "lucide-react";
export function EmptyState({
  title,
  detail,
  action,
}: {
  title: string;
  detail: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="grid min-h-56 place-items-center rounded-2xl border border-dashed border-[var(--border)] bg-white p-8 text-center">
      <div>
        <span className="mx-auto grid size-11 place-items-center rounded-2xl bg-[var(--surface-2)] text-[var(--muted)]">
          <Inbox size={20} />
        </span>
        <h3 className="mt-4 font-semibold">{title}</h3>
        <p className="mx-auto mt-1 max-w-sm text-sm leading-6 text-[var(--muted)]">
          {detail}
        </p>
        {action && <div className="mt-5">{action}</div>}
      </div>
    </div>
  );
}

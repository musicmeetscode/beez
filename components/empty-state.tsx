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
    <div className="grid min-h-[22rem] place-items-center rounded-2xl border border-dashed border-[var(--border)] bg-white p-8 text-center">
      <div>
        {/* Generated specifically for Ledgerly's empty data states. */}
        <img
          src="/empty-ledger-line-art.png"
          alt=""
          width={180}
          height={180}
          className="mx-auto h-40 w-40 object-contain"
        />
        <h3 className="mt-3 font-semibold">{title}</h3>
        <p className="mx-auto mt-1 max-w-sm text-sm leading-6 text-[var(--muted)]">
          {detail}
        </p>
        {action && <div className="mt-5">{action}</div>}
      </div>
    </div>
  );
}

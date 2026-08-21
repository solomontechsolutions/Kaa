/**
 * "6h ago".
 *
 * Reading the clock during render makes this component impure, which is
 * normally a bug: it would defeat caching and could disagree between a server
 * render and a client hydration. Neither applies here. Every page that uses it
 * is dynamic already — they all read the FieldOps session cookie — and the
 * output is rendered once on the server and never re-rendered on the client,
 * so there is no second reading to disagree with.
 *
 * The absolute timestamp goes in `dateTime`, so the exact moment survives for
 * anyone who needs it — which, on an audit trail, someone eventually will.
 */
export function RelativeTime({ iso }: { iso: string }) {
  // eslint-disable-next-line react-hooks/purity
  const minutes = Math.round((Date.now() - new Date(iso).getTime()) / 60_000);

  const text =
    minutes < 1
      ? "just now"
      : minutes < 60
        ? `${minutes}m ago`
        : minutes < 60 * 24
          ? `${Math.round(minutes / 60)}h ago`
          : `${Math.round(minutes / (60 * 24))}d ago`;

  return <time dateTime={iso}>{text}</time>;
}

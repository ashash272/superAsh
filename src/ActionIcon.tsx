/** Consistent outlined action symbols, independent of device emoji fonts. */
export function ActionIcon({ action }: { action: string }) {
  return <svg className="action-icon" data-action={action} viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    {action === 'Tennis' || action === 'Padel' ? <>
      <ellipse cx="19" cy="11" rx="7" ry="9" transform="rotate(35 19 11)" />
      <path d="m14 18-8 11m7-8-3-2" />
      {action === 'Tennis' ? <path d="m15 5 9 9M12 9l10 9m-4-15-6 10m11-8-8 13" /> : <path d="M17 8h.1M22 10h.1M16 13h.1M20 15h.1" />}
    </> : action === 'Yoga' ? <><path d="M7 8h19l-4 18H5a3 3 0 0 1 0-6h18M7 8 2 22" /><ellipse cx="25" cy="8" rx="3" ry="4" /><path d="M8 23h12" /></>
      : action === 'Archery' ? <><path d="M9 3q22 13 0 26L16 16Z" /><path d="M3 16h26m-5-4 5 4-5 4M3 12l4 4-4 4" /></>
      : action === 'Portal' ? <><ellipse cx="16" cy="16" rx="9" ry="13" /><ellipse cx="16" cy="16" rx="5" ry="9" /><path d="M2 8h4m-2-2v4m22 14h4m-2-2v4" /></>
      : <path d="m16 3 4 9 10 1-8 7 2 10-8-5-8 5 2-10-8-7 10-1Z" />}
  </svg>;
}

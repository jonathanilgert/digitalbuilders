type IconProps = { className?: string };

const wrap = (children: React.ReactNode) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.6"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    {children}
  </svg>
);

export const icons: Record<string, (p: IconProps) => React.ReactElement> = {
  layout: ({ className }) => (
    <span className={className}>
      {wrap(
        <>
          <rect x="3" y="3" width="18" height="18" rx="2" />
          <path d="M3 9h18M9 21V9" />
        </>,
      )}
    </span>
  ),
  code: ({ className }) => (
    <span className={className}>
      {wrap(<path d="m8 6-6 6 6 6M16 6l6 6-6 6" />)}
    </span>
  ),
  spark: ({ className }) => (
    <span className={className}>
      {wrap(
        <path d="M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.5 2.5M15.5 15.5 18 18M18 6l-2.5 2.5M8.5 15.5 6 18" />,
      )}
    </span>
  ),
  grid: ({ className }) => (
    <span className={className}>
      {wrap(
        <>
          <rect x="3" y="3" width="7" height="7" rx="1.5" />
          <rect x="14" y="3" width="7" height="7" rx="1.5" />
          <rect x="3" y="14" width="7" height="7" rx="1.5" />
          <rect x="14" y="14" width="7" height="7" rx="1.5" />
        </>,
      )}
    </span>
  ),
  cart: ({ className }) => (
    <span className={className}>
      {wrap(
        <>
          <circle cx="9" cy="20" r="1.4" />
          <circle cx="18" cy="20" r="1.4" />
          <path d="M2 3h3l2.4 12.3a1.5 1.5 0 0 0 1.5 1.2h8.1a1.5 1.5 0 0 0 1.5-1.2L21 7H6" />
        </>,
      )}
    </span>
  ),
  phone: ({ className }) => (
    <span className={className}>
      {wrap(
        <>
          <rect x="6" y="2" width="12" height="20" rx="2.5" />
          <path d="M11 18h2" />
        </>,
      )}
    </span>
  ),
  check: ({ className }) => (
    <span className={className}>{wrap(<path d="m4 12 5 5L20 6" />)}</span>
  ),
  phoneCall: ({ className }) => (
    <span className={className}>
      {wrap(
        <path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .4 1.9.7 2.8a2 2 0 0 1-.5 2.1L8.1 9.9a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.5c.9.3 1.8.6 2.8.7a2 2 0 0 1 1.7 2Z" />,
      )}
    </span>
  ),
  chat: ({ className }) => (
    <span className={className}>
      {wrap(<path d="M21 12a8 8 0 0 1-11.5 7.2L3 21l1.8-6.5A8 8 0 1 1 21 12Z" />)}
    </span>
  ),
};

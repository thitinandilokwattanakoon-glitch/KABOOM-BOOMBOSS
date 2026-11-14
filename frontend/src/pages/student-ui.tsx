import { useMemo, useState, type ReactNode } from 'react';
import { useOutfit } from '../api/outfits';
import { avatarImage, HEAD_VIEW } from '../game/avatar';

/**
 * Small shared pieces of the student pages (home, dashboard, profile): line icons and pictures.
 * Icons are drawn with `currentColor`, so their colour always comes from a CSS token.
 */

function Icon({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <svg
      className={className ? `sh-icon ${className}` : 'sh-icon'}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {children}
    </svg>
  );
}

export const ChartIcon = () => (
  <Icon>
    <path d="M5 20v-8M12 20V5M19 20v-5" />
    <path d="M3 20h18" />
  </Icon>
);

export const PersonIcon = () => (
  <Icon>
    <circle cx="12" cy="8.5" r="4" />
    <path d="M4.5 20c.8-4 3.8-6 7.5-6s6.7 2 7.5 6" />
  </Icon>
);

export const KeyIcon = () => (
  <Icon>
    <circle cx="8" cy="15.5" r="4.2" />
    <path d="M11 12.5 20 3.5M16.5 7l3 3M13.5 10l2 2" />
  </Icon>
);

export const ChevronsIcon = () => (
  <Icon>
    <path d="m6 6 6 6-6 6M13 6l6 6-6 6" />
  </Icon>
);

export const BackIcon = () => (
  <Icon>
    <path d="m14.5 6-6 6 6 6" />
  </Icon>
);

export const LockIcon = () => (
  <Icon>
    <rect x="5" y="11" width="14" height="9.5" rx="2.2" />
    <path d="M8.2 11V8.2a3.8 3.8 0 0 1 7.6 0V11" />
  </Icon>
);

export const MailIcon = () => (
  <Icon>
    <rect x="3" y="5" width="18" height="14" rx="2.4" />
    <path d="m4.5 7.5 7.5 5.6 7.5-5.6" />
  </Icon>
);

export const NameTagIcon = () => (
  <Icon>
    <rect x="3" y="5" width="18" height="14" rx="2.4" />
    <circle cx="9" cy="10.8" r="1.9" />
    <path d="M5.9 16c.5-1.5 1.6-2.3 3.1-2.3s2.6.8 3.1 2.3M15 10h3M15 13.6h3" />
  </Icon>
);

export const LogoutIcon = () => (
  <Icon>
    <path d="M10 4H6.5A2.5 2.5 0 0 0 4 6.5v11A2.5 2.5 0 0 0 6.5 20H10" />
    <path d="m15 8 4 4-4 4M19 12H9.5" />
  </Icon>
);

export const CapIcon = () => (
  <Icon>
    <path d="m2.5 9 9.5-4.5L21.5 9 12 13.5 2.5 9Z" />
    <path d="M6.5 11.2v4.3c1.5 1.5 3.3 2.2 5.5 2.2s4-.7 5.5-2.2v-4.3M21.5 9v5" />
  </Icon>
);

export const HangerIcon = () => (
  <Icon>
    <path d="M12 8.5V7.6c1.3-.4 2.2-1.4 2.2-2.6a2.2 2.2 0 0 0-4.4 0" />
    <path d="M12 8.5 3.6 15c-.9.7-.4 2 .7 2h15.4c1.1 0 1.6-1.3.7-2L12 8.5Z" />
  </Icon>
);

export const TrophyIcon = () => (
  <Icon>
    <path d="M8 4h8v5.5a4 4 0 0 1-8 0V4Z" />
    <path d="M8 6H5.2c0 2.2 1.1 3.6 3 4M16 6h2.8c0 2.2-1.1 3.6-3 4M12 13.5V17M8.5 20h7M9.8 17h4.4" />
  </Icon>
);

export const AlertIcon = () => (
  <Icon>
    <circle cx="12" cy="12" r="9" />
    <path d="M12 7.6v5.2M12 16.3v.1" />
  </Icon>
);

export const CheckIcon = () => (
  <Icon>
    <circle cx="12" cy="12" r="9" />
    <path d="m8 12.4 2.7 2.7L16 9.6" />
  </Icon>
);

export function EyeIcon({ open }: { open: boolean }) {
  return open ? (
    <Icon>
      <path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12Z" />
      <circle cx="12" cy="12" r="2.8" />
    </Icon>
  ) : (
    <Icon>
      <path d="M4 4l16 16" />
      <path d="M9.9 6.1A9 9 0 0 1 12 5.5c6 0 9.5 6.5 9.5 6.5a15 15 0 0 1-2.6 3.4M6.3 7.7A14.5 14.5 0 0 0 2.5 12S6 18.5 12 18.5c1.2 0 2.3-.2 3.3-.6" />
      <path d="M10 10.1a2.8 2.8 0 0 0 3.9 3.9" />
    </Icon>
  );
}

/** A picture from /public/brand with a text stand-in, so the page still works if the file is missing. */
export function BrandImage({ src, alt, className, width, height, fallback }: {
  src: string;
  alt: string;
  className: string;
  width: number;
  height: number;
  fallback: JSX.Element;
}) {
  const [failed, setFailed] = useState(false);
  if (failed) return fallback;
  return <img className={className} src={src} alt={alt} width={width} height={height} onError={() => setFailed(true)} />;
}

/** The head of the dress-up character of a student, in a circle. */
export function Face({ studentId }: { studentId: string }) {
  const { outfit } = useOutfit(studentId);
  const picture = useMemo(() => avatarImage(outfit, { view: HEAD_VIEW }), [outfit]);
  return (
    <span className="sh-face">
      <img src={picture} alt="" />
    </span>
  );
}

import type { SVGProps } from "react";

type IconProps = SVGProps<SVGSVGElement>;

const base = {
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.6,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  viewBox: "0 0 24 24",
  "aria-hidden": true,
};

export function SearchIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-3.5-3.5" />
    </svg>
  );
}

export function PinIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M12 21s7-6.2 7-11a7 7 0 1 0-14 0c0 4.8 7 11 7 11Z" />
      <circle cx="12" cy="10" r="2.4" />
    </svg>
  );
}

export function LocateIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <circle cx="12" cy="12" r="7.5" />
      <circle cx="12" cy="12" r="2" />
      <path d="M12 2v2.5M12 19.5V22M2 12h2.5M19.5 12H22" />
    </svg>
  );
}

export function ArrowRightIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M4 12h15" />
      <path d="m13 6 6 6-6 6" />
    </svg>
  );
}

export function ArrowLeftIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M20 12H5" />
      <path d="m11 18-6-6 6-6" />
    </svg>
  );
}

export function UsersIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M15.5 20v-1.6a3.9 3.9 0 0 0-3.9-3.9H6.4A3.9 3.9 0 0 0 2.5 18.4V20" />
      <circle cx="9" cy="7.5" r="3.4" />
      <path d="M21.5 20v-1.6a3.9 3.9 0 0 0-2.9-3.8" />
      <path d="M16.2 4.2a3.4 3.4 0 0 1 0 6.6" />
    </svg>
  );
}

export function CapIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M2.5 8.6 12 4.4l9.5 4.2-9.5 4.3z" />
      <path d="M6.5 10.6v4.6c0 1.6 2.5 2.9 5.5 2.9s5.5-1.3 5.5-2.9v-4.6" />
      <path d="M21.5 8.6v5.2" />
    </svg>
  );
}

export function BookIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M4 4.8A2.3 2.3 0 0 1 6.3 2.5H19v17.2H6.3A2.3 2.3 0 0 0 4 22" />
      <path d="M4 4.8v17.2" />
      <path d="M7.6 7h7.6" />
    </svg>
  );
}

export function PlayIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M3 20h18" />
      <path d="M6 20V9.5M10.5 20V6M15 20v-8.5M19.5 20v-6" />
    </svg>
  );
}

export function RampIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <circle cx="12" cy="4.6" r="1.9" />
      <path d="M12 8v5h4.4" />
      <path d="M16.4 13a5.4 5.4 0 1 1-5.6 6.6" />
      <path d="M2.5 22h7" />
    </svg>
  );
}

export function BoltIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M13.2 2.5 5.4 13.4h5.1L9.9 21.5l8-11.1h-5.2z" />
    </svg>
  );
}

export function DropIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M12 2.8s6.2 6.1 6.2 10.6a6.2 6.2 0 1 1-12.4 0C5.8 8.9 12 2.8 12 2.8Z" />
    </svg>
  );
}

export function PhoneIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M6.2 3.5h3l1.5 4-2.1 1.4a11.6 11.6 0 0 0 5.6 5.6l1.4-2.1 4 1.5v3a2 2 0 0 1-2.2 2A16.4 16.4 0 0 1 4.2 5.7a2 2 0 0 1 2-2.2Z" />
    </svg>
  );
}

export function MailIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <rect x="2.8" y="5" width="18.4" height="14" rx="2.2" />
      <path d="m3.6 6.4 8.4 6 8.4-6" />
    </svg>
  );
}

export function GlobeIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <circle cx="12" cy="12" r="9" />
      <path d="M3.4 9.4h17.2M3.4 14.6h17.2" />
      <path d="M12 3a15 15 0 0 1 0 18a15 15 0 0 1 0-18Z" />
    </svg>
  );
}

export function CheckIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="m4.5 12.5 5 5 10-11" />
    </svg>
  );
}

export function MinusIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M6 12h12" />
    </svg>
  );
}

export function PlusIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M12 6v12M6 12h12" />
    </svg>
  );
}

export function CloseIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="m6 6 12 12M18 6 6 18" />
    </svg>
  );
}

export function ChevronDownIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="m6 9.5 6 6 6-6" />
    </svg>
  );
}

export function ChevronRightIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="m9.5 6 6 6-6 6" />
    </svg>
  );
}

export function LayersIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="m12 3 9 4.8-9 4.8-9-4.8z" />
      <path d="m3 12.4 9 4.8 9-4.8" />
      <path d="m3 16.9 9 4.8 9-4.8" />
    </svg>
  );
}

export function BuildingIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M4 21V6.2a1.6 1.6 0 0 1 1.6-1.6h6.8A1.6 1.6 0 0 1 14 6.2V21" />
      <path d="M14 10.6h4.4A1.6 1.6 0 0 1 20 12.2V21" />
      <path d="M2.5 21h19" />
      <path d="M7 8.6h3.6M7 12.2h3.6M7 15.8h3.6" />
    </svg>
  );
}

export function SparkIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M12 3.2 13.8 9l5.8 1.8-5.8 1.8L12 18.4 10.2 12.6 4.4 10.8 10.2 9z" />
      <path d="M18.6 16.4l.7 2.1 2.1.7-2.1.7-.7 2.1-.7-2.1-2.1-.7 2.1-.7z" />
    </svg>
  );
}

export function GridIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <rect x="3.2" y="3.2" width="7.2" height="7.2" rx="1.6" />
      <rect x="13.6" y="3.2" width="7.2" height="7.2" rx="1.6" />
      <rect x="3.2" y="13.6" width="7.2" height="7.2" rx="1.6" />
      <rect x="13.6" y="13.6" width="7.2" height="7.2" rx="1.6" />
    </svg>
  );
}

export function ChartIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M3.5 20.5h17" />
      <rect x="5" y="12" width="3.4" height="6" rx="1" />
      <rect x="10.4" y="7.5" width="3.4" height="10.5" rx="1" />
      <rect x="15.8" y="3.5" width="3.4" height="14.5" rx="1" />
    </svg>
  );
}

export function ScaleIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M12 3.5v17" />
      <path d="M6.5 6.5h11" />
      <path d="M6.5 6.5 3.2 14h6.6z" />
      <path d="M17.5 6.5 14.2 14h6.6z" />
      <path d="M8.5 20.5h7" />
    </svg>
  );
}

export function ToiletIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <circle cx="7.5" cy="4.4" r="1.7" />
      <path d="M7.5 7.2V13M5.2 10.4h4.6M7.5 13v7.4M5 20.4h5" />
      <circle cx="16.6" cy="4.4" r="1.7" />
      <path d="M14.3 8.2h4.6l-.9 5.6h-2.8z" />
      <path d="M16.6 13.8v6.6" />
    </svg>
  );
}

export function ShieldIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M12 2.8 4.8 5.6v6c0 4.4 3 8 7.2 9.6 4.2-1.6 7.2-5.2 7.2-9.6v-6z" />
      <path d="m9 12 2.2 2.2L15.4 10" />
    </svg>
  );
}

export function MoonIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M20.5 14.2A8.6 8.6 0 0 1 9.8 3.5a8.7 8.7 0 1 0 10.7 10.7Z" />
    </svg>
  );
}

export function SunIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <circle cx="12" cy="12" r="4.2" />
      <path d="M12 2.4v2.2M12 19.4v2.2M4.6 4.6l1.6 1.6M17.8 17.8l1.6 1.6M2.4 12h2.2M19.4 12h2.2M4.6 19.4l1.6-1.6M17.8 6.2l1.6-1.6" />
    </svg>
  );
}

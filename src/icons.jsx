export function BellIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
      <path
        d="M18 8a6 6 0 1 0-12 0c0 7-3 9-3 9h18s-3-2-3-9Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M13.7 21a2 2 0 0 1-3.4 0"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function MenuIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
      <path
        d="M4 7h16M4 12h16M4 17h16"
        stroke="currentColor"
        strokeWidth="1.9"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function ChevronDown({ className = "" }) {
  return (
    <svg
      className={className}
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
    >
      <path
        d="M6 9l6 6 6-6"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function ChevronRight() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
      <path
        d="M9 6l6 6-6 6"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function ClockIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.8" />
      <path
        d="M12 7v5l3 2"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function ListIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
      <path
        d="M8 6h12M8 12h12M8 18h12M4 6h.01M4 12h.01M4 18h.01"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function SunIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="4" stroke="currentColor" strokeWidth="1.7" />
      <path
        d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function MoonIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
      <path
        d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8Z"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinejoin="round"
      />
    </svg>
  );
}

// 원본: 18×18 아이콘 박스 안에 10×10 플러스(coral #E64956, currentColor 상속)
export function PlusIcon() {
  return (
    <svg
      className="plus-ic"
      width="18"
      height="18"
      viewBox="0 0 18 18"
      fill="none"
    >
      <path
        d="M9 4V14M4 9H14"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function LockIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
      <rect
        x="4.5"
        y="10.5"
        width="15"
        height="10"
        rx="3"
        fill="currentColor"
      />
      <path
        d="M7.5 10.5V8a4.5 4.5 0 0 1 9 0v2.5"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function ScanIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
      <path
        d="M4 8V6a2 2 0 0 1 2-2h2M16 4h2a2 2 0 0 1 2 2v2M20 16v2a2 2 0 0 1-2 2h-2M8 20H6a2 2 0 0 1-2-2v-2"
        stroke="currentColor"
        strokeWidth="1.9"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <rect x="8" y="9" width="8" height="6" rx="1.5" fill="currentColor" />
    </svg>
  );
}

export function BottleIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
      <path
        d="M9 2h6v2H9zM10 4h4v3l1.5 2.2c.3.5.5 1 .5 1.6V20a2 2 0 0 1-2 2h-4a2 2 0 0 1-2-2V10.8c0-.6.2-1.1.5-1.6L10 7V4Z"
        fill="currentColor"
      />
    </svg>
  );
}

export function ScheduleIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 16 16" fill="none">
      <path
        d="M8.8 7.68V4.8C8.8 4.57333 8.72333 4.38333 8.57 4.23C8.41667 4.07667 8.22667 4 8 4C7.77333 4 7.58333 4.07667 7.43 4.23C7.27667 4.38333 7.2 4.57333 7.2 4.8V7.98C7.2 8.08667 7.22 8.19 7.26 8.29C7.3 8.39 7.36 8.48 7.44 8.56L10.08 11.2C10.2267 11.3467 10.4133 11.42 10.64 11.42C10.8667 11.42 11.0533 11.3467 11.2 11.2C11.3467 11.0533 11.42 10.8667 11.42 10.64C11.42 10.4133 11.3467 10.2267 11.2 10.08L8.8 7.68ZM8 16C6.89333 16 5.85333 15.79 4.88 15.37C3.90667 14.95 3.06 14.38 2.34 13.66C1.62 12.94 1.05 12.0933 0.63 11.12C0.21 10.1467 0 9.10667 0 8C0 6.89333 0.21 5.85333 0.63 4.88C1.05 3.90667 1.62 3.06 2.34 2.34C3.06 1.62 3.90667 1.05 4.88 0.63C5.85333 0.21 6.89333 0 8 0C9.10667 0 10.1467 0.21 11.12 0.63C12.0933 1.05 12.94 1.62 13.66 2.34C14.38 3.06 14.95 3.90667 15.37 4.88C15.79 5.85333 16 6.89333 16 8C16 9.10667 15.79 10.1467 15.37 11.12C14.95 12.0933 14.38 12.94 13.66 13.66C12.94 14.38 12.0933 14.95 11.12 15.37C10.1467 15.79 9.10667 16 8 16ZM8 14.4C9.77333 14.4 11.2833 13.7767 12.53 12.53C13.7767 11.2833 14.4 9.77333 14.4 8C14.4 6.22667 13.7767 4.71667 12.53 3.47C11.2833 2.22333 9.77333 1.6 8 1.6C6.22667 1.6 4.71667 2.22333 3.47 3.47C2.22333 4.71667 1.6 6.22667 1.6 8C1.6 9.77333 2.22333 11.2833 3.47 12.53C4.71667 13.7767 6.22667 14.4 8 14.4Z"
        fill="currentColor"
      />
    </svg>
  );
}

export function ViewAgendaIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 14 14" fill="none">
      <path
        d="M1.55556 6.22222C1.12778 6.22222 0.761574 6.06991 0.456944 5.76528C0.152315 5.46065 0 5.09444 0 4.66667V1.55556C0 1.12778 0.152315 0.761574 0.456944 0.456944C0.761574 0.152315 1.12778 0 1.55556 0H12.4444C12.8722 0 13.2384 0.152315 13.5431 0.456944C13.8477 0.761574 14 1.12778 14 1.55556V4.66667C14 5.09444 13.8477 5.46065 13.5431 5.76528C13.2384 6.06991 12.8722 6.22222 12.4444 6.22222H1.55556ZM1.55556 4.66667H12.4444V1.55556H1.55556V4.66667ZM1.55556 14C1.12778 14 0.761574 13.8477 0.456944 13.5431C0.152315 13.2384 0 12.8722 0 12.4444V9.33333C0 8.90556 0.152315 8.53935 0.456944 8.23472C0.761574 7.93009 1.12778 7.77778 1.55556 7.77778H12.4444C12.8722 7.77778 13.2384 7.93009 13.5431 8.23472C13.8477 8.53935 14 8.90556 14 9.33333V12.4444C14 12.8722 13.8477 13.2384 13.5431 13.5431C13.2384 13.8477 12.8722 14 12.4444 14H1.55556ZM1.55556 12.4444H12.4444V9.33333H1.55556V12.4444Z"
        fill="currentColor"
      />
    </svg>
  );
}

export function CalendarDotIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
      <path
        d="M5 22q-.825 0-1.412-.587Q3 20.825 3 20V6q0-.825.588-1.412Q4.175 4 5 4h1V3q0-.425.288-.712Q6.575 2 7 2t.713.288Q8 2.575 8 3v1h8V3q0-.425.288-.712Q16.575 2 17 2t.712.288Q18 2.575 18 3v1h1q.825 0 1.413.588Q21 5.175 21 6v5h-2V10H5v10h7v2Z"
        fill="#000000"
      />
      <circle cx="18" cy="18" r="4" fill="#FF5160" />
    </svg>
  );
}

export function ChevronRightSmall() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
      <path
        d="M9 6l6 6-6 6"
        stroke="#C2C5CB"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function SprayBottle() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
      <rect x="7.5" y="10" width="7.5" height="11" rx="3" fill="#FF5160" />
      <rect x="9" y="6" width="4.5" height="4.5" rx="1.6" fill="#FF5160" />
      <rect x="10" y="3.6" width="6.5" height="2.6" rx="1.3" fill="#FF5160" />
      <circle cx="18.2" cy="6.6" r="1" fill="#FF5160" />
      <circle cx="19.6" cy="9.4" r="0.75" fill="#FF5160" />
      <circle cx="17.4" cy="4.2" r="0.6" fill="#FF5160" />
    </svg>
  );
}

export function WeatherSun() {
  return (
    <svg width="40" height="40" viewBox="0 0 48 48" fill="none">
      <circle cx="24" cy="24" r="9" fill="#FFD54A" />
      <g stroke="#FFD54A" strokeWidth="3" strokeLinecap="round">
        <path d="M24 5v5M24 38v5M5 24h5M38 24h5M10.5 10.5l3.5 3.5M34 34l3.5 3.5M37.5 10.5 34 14M14 34l-3.5 3.5" />
      </g>
    </svg>
  );
}

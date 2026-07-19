interface SurgiFindLogoProps {
  className?: string;
}

export default function SurgiFindLogo({ className }: SurgiFindLogoProps) {
  return (
    <svg
      viewBox="0 0 32 32"
      aria-hidden="true"
      className={className}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M16 3.5C10.201 3.5 5.5 8.201 5.5 14C5.5 20.772 13.019 27.249 15.186 28.955C15.668 29.334 16.332 29.334 16.814 28.955C18.981 27.249 26.5 20.772 26.5 14C26.5 8.201 21.799 3.5 16 3.5Z"
        stroke="#05aba5"
        strokeWidth="2"
      />
      <path d="M16 9V19" stroke="#05aba5" strokeWidth="2.4" strokeLinecap="round" />
      <path d="M11 14H21" stroke="#05aba5" strokeWidth="2.4" strokeLinecap="round" />
      <circle cx="16" cy="14" r="6.6" fill="#05aba5" fillOpacity="0.08" />
    </svg>
  );
}
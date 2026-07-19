function LinkedinIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
      aria-hidden="true"
    >
      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
    </svg>
  );
}

interface TeamCardProps {
  name: string;
  role: string;
  imageUrl?: string;
  imageClassName?: string;
  linkedinUrl?: string;
}

function getInitials(name: string): string {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

export function TeamCard({ name, role, imageUrl, imageClassName, linkedinUrl }: TeamCardProps) {
  const initials = getInitials(name);

  return (
    <div className="flex flex-col items-center gap-4 text-center">
      {/* Circle photo */}
      <div className="h-44 w-44 overflow-hidden rounded-full bg-slate-200 sm:h-48 sm:w-48">
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={name}
            className={`h-full w-full object-cover object-top transition-transform ${imageClassName ?? ""}`}
            loading="lazy"
            decoding="async"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <span className="text-4xl font-semibold text-slate-700">{initials}</span>
          </div>
        )}
      </div>

      {/* Name + role */}
      <div className="flex flex-col items-center gap-2">
        <div className="space-y-1.5 text-center">
          <p className="text-xl font-semibold text-slate-900">{name}</p>
          <p className="text-base text-slate-500">{role}</p>
        </div>
        {linkedinUrl ? (
          <a
            href={linkedinUrl}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`${name} on LinkedIn`}
            className="mt-0.5 inline-flex items-center gap-1.5 rounded-full border border-teal-200 bg-teal-50 px-3 py-1 text-xs font-medium text-teal-700 transition hover:border-teal-400 hover:bg-teal-100 hover:text-teal-800"
          >
            <LinkedinIcon className="h-3.5 w-3.5" />
            LinkedIn
          </a>
        ) : null}
      </div>
    </div>
  );
}

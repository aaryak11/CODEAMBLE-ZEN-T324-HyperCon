export default function HyperConLogo({ className = "w-8 h-8", showText = true, textClassName = "text-xl", showSubtext = true }) {
  return (
    <div className="flex items-center gap-2.5">
      <img
        src="/logo.png"
        alt="HyperCon Logo"
        className={`${className} object-contain shrink-0`}
      />

      {showText && (
        <div className="flex flex-col leading-none">
          <span className={`font-extrabold font-display text-ink tracking-tight ${textClassName}`}>
            HyperCon
          </span>
          {showSubtext && (
            <span className="text-[10px] font-bold font-display uppercase tracking-widest text-ink/80 mt-0.5">
              Live Shelf Verification
            </span>
          )}
        </div>
      )}
    </div>
  );
}

export function HyperConSpinner({ className = "w-8 h-8" }) {
  return (
    <div className="relative inline-flex items-center justify-center">
      <div className="absolute inset-0 rounded-full border-3 border-ink/20 animate-spin border-t-accent"></div>
      <img src="/logo.png" alt="Loading..." className={`${className} object-contain p-1`} />
    </div>
  );
}

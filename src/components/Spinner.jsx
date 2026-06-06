// Small reusable loading spinner used across the app.
export default function Spinner({ size = 20, className = "", label }) {
  return (
    <div className={`flex items-center gap-3 text-gray-400 ${className}`} role="status" aria-live="polite">
      <span
        className="border-2 border-gray-200 border-t-indigo-500 rounded-full animate-spin shrink-0"
        style={{ width: size, height: size }}
      />
      {label && <span className="text-sm">{label}</span>}
      {!label && <span className="sr-only">Loading</span>}
    </div>
  );
}

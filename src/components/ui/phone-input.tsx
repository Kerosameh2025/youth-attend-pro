import * as React from "react";
import { Check, AlertCircle, Copy, Loader2, Phone } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Egyptian Phone Input — premium, accessible, mobile-first.
 *
 * Storage format (value/onChange): E.164 — "+201012345678"
 * Display format: "+20 101 234 5678"
 * Input accepts: local digits only (e.g. 1012345678)
 * Valid prefixes: 010, 011, 012, 015 — total 10 local digits.
 */

const EG_PREFIXES = ["010", "011", "012", "015"] as const;
const LOCAL_LENGTH = 10;

export function formatLocal(local: string): string {
  // groups: 3 3 4 → "101 234 5678"
  const d = local.replace(/\D/g, "").slice(0, LOCAL_LENGTH);
  const a = d.slice(0, 3);
  const b = d.slice(3, 6);
  const c = d.slice(6, 10);
  return [a, b, c].filter(Boolean).join(" ");
}

export function formatE164ForDisplay(e164: string): string {
  const local = e164.replace(/^\+20/, "").replace(/\D/g, "");
  return `+20 ${formatLocal(local)}`.trim();
}

export function isValidEgyptianLocal(local: string): boolean {
  const d = local.replace(/\D/g, "");
  if (d.length !== LOCAL_LENGTH) return false;
  return EG_PREFIXES.some((p) => d.startsWith(p));
}

export function localToE164(local: string): string {
  const d = local.replace(/\D/g, "").slice(0, LOCAL_LENGTH);
  return `+20${d}`;
}

export function e164ToLocal(e164: string | null | undefined): string {
  if (!e164) return "";
  return e164.replace(/^\+20/, "").replace(/\D/g, "").slice(0, LOCAL_LENGTH);
}

// --- Egypt flag (inline SVG, no network) ----------------------------------
function EgyptFlag({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 6 4"
      className={cn("h-4 w-6 rounded-[2px] shadow-sm ring-1 ring-black/10", className)}
      aria-hidden="true"
    >
      <rect width="6" height="4" fill="#fff" />
      <rect width="6" height="4" y="0" fill="#CE1126" />
      <rect width="6" height="1.333" y="1.333" fill="#fff" />
      <rect width="6" height="1.333" y="2.667" fill="#000" />
      <circle cx="3" cy="2" r="0.42" fill="#C09300" />
    </svg>
  );
}

// --- Component ------------------------------------------------------------
export interface PhoneInputProps {
  value?: string; // E.164
  onChange?: (e164: string, meta: { valid: boolean; local: string }) => void;
  disabled?: boolean;
  loading?: boolean;
  required?: boolean;
  id?: string;
  name?: string;
  label?: string;
  hint?: string;
  autoFocus?: boolean;
  className?: string;
  dir?: "ltr" | "rtl";
}

export const PhoneInput = React.forwardRef<HTMLInputElement, PhoneInputProps>(
  function PhoneInput(
    {
      value,
      onChange,
      disabled,
      loading,
      required,
      id,
      name,
      label = "Phone number",
      hint,
      autoFocus,
      className,
      dir = "ltr",
    },
    ref
  ) {
    const reactId = React.useId();
    const inputId = id ?? `phone-${reactId}`;
    const helpId = `${inputId}-help`;

    const [local, setLocal] = React.useState<string>(() => e164ToLocal(value));
    const [touched, setTouched] = React.useState(false);
    const [focused, setFocused] = React.useState(false);

    // Sync controlled value from parent
    React.useEffect(() => {
      const next = e164ToLocal(value);
      setLocal((prev) => (prev === next ? prev : next));
    }, [value]);

    const valid = isValidEgyptianLocal(local);
    const empty = local.length === 0;
    const showError = touched && !empty && !valid;
    const showSuccess = touched && valid;

    const handleChange = (raw: string) => {
      let digits = raw.replace(/\D/g, "");
      // Smart strip: if user types 11 digits starting with 0, drop the leading 0
      if (digits.startsWith("0")) digits = digits.slice(1);
      digits = digits.slice(0, LOCAL_LENGTH);
      setLocal(digits);
      onChange?.(localToE164(digits), {
        valid: isValidEgyptianLocal(digits),
        local: digits,
      });
      if (!touched && digits.length > 0) setTouched(true);
    };

    return (
      <div className={cn("w-full", className)} dir={dir}>
        {label && (
          <label
            htmlFor={inputId}
            className="mb-2 block text-sm font-medium text-foreground"
          >
            {label}
            {required && <span className="ms-1 text-destructive">*</span>}
          </label>
        )}

        <div
          className={cn(
            "group relative flex items-stretch overflow-hidden rounded-2xl border bg-background transition-all duration-200",
            "shadow-[0_1px_2px_rgba(16,24,40,0.04)]",
            focused && "ring-4 ring-primary/15 border-primary",
            showError && "border-destructive ring-destructive/15",
            showSuccess && "border-emerald-500/70",
            disabled && "opacity-60 cursor-not-allowed bg-muted/40"
          )}
        >
          {/* Country prefix */}
          <div
            className={cn(
              "flex items-center gap-2 ps-4 pe-3 border-e bg-muted/30 select-none",
              "text-sm font-medium text-foreground"
            )}
            aria-hidden="true"
          >
            <EgyptFlag />
            <span className="tabular-nums tracking-tight">+20</span>
          </div>

          {/* Input */}
          <div className="relative flex-1">
            <input
              ref={ref}
              id={inputId}
              name={name}
              type="tel"
              inputMode="numeric"
              autoComplete="tel-national"
              dir="ltr"
              disabled={disabled || loading}
              required={required}
              autoFocus={autoFocus}
              placeholder="101 234 5678"
              aria-invalid={showError || undefined}
              aria-describedby={helpId}
              value={formatLocal(local)}
              onFocus={() => setFocused(true)}
              onBlur={() => {
                setFocused(false);
                setTouched(true);
              }}
              onChange={(e) => handleChange(e.target.value)}
              className={cn(
                "peer h-12 w-full bg-transparent px-4 text-base tabular-nums tracking-wide outline-none",
                "placeholder:text-muted-foreground/60",
                "disabled:cursor-not-allowed"
              )}
            />

            {/* Status icon */}
            <div className="pointer-events-none absolute inset-y-0 end-3 flex items-center">
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
              ) : showSuccess ? (
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-600 animate-in zoom-in-50 duration-200">
                  <Check className="h-3.5 w-3.5" strokeWidth={3} />
                </span>
              ) : showError ? (
                <AlertCircle className="h-4 w-4 text-destructive animate-in fade-in-50" />
              ) : (
                <Phone className="h-4 w-4 text-muted-foreground/50" />
              )}
            </div>
          </div>
        </div>

        {/* Helper text */}
        <div id={helpId} className="mt-2 min-h-[1.25rem] text-xs">
          {showError ? (
            <span className="text-destructive" dir="rtl">
              رقم غير صحيح، يجب أن يبدأ بـ 010، 011، 012، أو 015
            </span>
          ) : showSuccess ? (
            <span className="text-emerald-600">Looks good.</span>
          ) : (
            <span className="text-muted-foreground">
              {hint ?? "We'll only use this to contact you about your account."}
            </span>
          )}
        </div>
      </div>
    );
  }
);

// --- Display + copy -------------------------------------------------------
export interface PhoneDisplayProps {
  value: string; // E.164
  className?: string;
  label?: string;
}

export function PhoneDisplay({ value, className, label }: PhoneDisplayProps) {
  const [copied, setCopied] = React.useState(false);
  const display = formatE164ForDisplay(value);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      /* noop */
    }
  };

  return (
    <div
      className={cn(
        "inline-flex items-center gap-3 rounded-2xl border bg-background px-4 py-2.5",
        "shadow-[0_1px_2px_rgba(16,24,40,0.04)]",
        className
      )}
    >
      <EgyptFlag />
      <div className="flex flex-col leading-tight">
        {label && (
          <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
            {label}
          </span>
        )}
        <span
          className="text-sm font-medium tabular-nums tracking-wide text-foreground"
          dir="ltr"
        >
          {display}
        </span>
      </div>
      <button
        type="button"
        onClick={handleCopy}
        aria-label={copied ? "Copied" : "Copy phone number"}
        className={cn(
          "ms-1 inline-flex h-9 w-9 items-center justify-center rounded-xl border text-muted-foreground",
          "transition-all hover:text-foreground hover:bg-muted/50 active:scale-95",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
        )}
      >
        {copied ? (
          <Check className="h-4 w-4 text-emerald-600 animate-in zoom-in-50" />
        ) : (
          <Copy className="h-4 w-4" />
        )}
      </button>
      {value && (
        <a
          href={`https://wa.me/${value}`}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Open in WhatsApp"
          className={cn(
            "ms-1 inline-flex h-9 w-9 items-center justify-center rounded-xl border transition-all active:scale-95",
            "hover:bg-[#25D366]/10 hover:border-[#25D366]/30 hover:shadow-sm",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#25D366]/40"
          )}
        >
          <svg viewBox="0 0 24 24" className="h-4 w-4" fill="#25D366" aria-hidden="true">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.521.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.521-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.008-.57-.008-.198 0-.521.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
          </svg>
        </a>
      )}
    </div>
  );
}

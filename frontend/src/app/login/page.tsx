"use client";

import { useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Loader2, Sprout } from "lucide-react";
import { Button } from "@/components/ui/button";
import { mockSignIn } from "@/lib/mock-auth";
import { store } from "@/lib/store";

/** Inline SVG farmland illustration for the auth panel. */
function FarmlandArt() {
  return (
    <svg
      viewBox="0 0 400 300"
      role="img"
      aria-label="Illustration of green farmland at sunset"
      className="h-auto w-full"
    >
      <defs>
        <linearGradient id="login-sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#123D2A" />
          <stop offset="100%" stopColor="#1E5A3C" />
        </linearGradient>
        <linearGradient id="login-hill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#69A66B" />
          <stop offset="100%" stopColor="#3E7A4E" />
        </linearGradient>
        <linearGradient id="login-field" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#2E6B40" />
          <stop offset="100%" stopColor="#09271D" />
        </linearGradient>
      </defs>

      <rect width="400" height="300" fill="url(#login-sky)" />

      {/* sun */}
      <circle cx="310" cy="70" r="34" fill="#D5A75B" opacity="0.9" />
      <circle cx="310" cy="70" r="48" fill="#D5A75B" opacity="0.18" />

      {/* birds */}
      <g stroke="#F7F6EF" strokeWidth="2.5" fill="none" strokeLinecap="round" opacity="0.7">
        <path d="M70 60 q8 -8 16 0 q8 -8 16 0" />
        <path d="M110 45 q6 -6 12 0 q6 -6 12 0" />
      </g>

      {/* back hill */}
      <path d="M0 170 Q120 100 220 150 T400 140 V300 H0 Z" fill="url(#login-hill)" opacity="0.85" />

      {/* tree */}
      <g>
        <rect x="66" y="150" width="10" height="42" rx="4" fill="#5B3A21" />
        <circle cx="71" cy="132" r="30" fill="#1E5A3C" />
        <circle cx="52" cy="144" r="20" fill="#2E6B40" />
        <circle cx="90" cy="144" r="20" fill="#2E6B40" />
      </g>

      {/* front field */}
      <path d="M0 200 Q200 170 400 205 V300 H0 Z" fill="url(#login-field)" />

      {/* crop rows */}
      <g stroke="#69A66B" strokeWidth="2" opacity="0.55">
        <path d="M-10 230 Q200 205 410 235" fill="none" />
        <path d="M-10 248 Q200 224 410 252" fill="none" />
        <path d="M-10 268 Q200 245 410 272" fill="none" />
        <path d="M-10 288 Q200 266 410 292" fill="none" />
      </g>

      {/* crop sprouts */}
      <g fill="#DDE8D7" opacity="0.9">
        <ellipse cx="60" cy="246" rx="3" ry="7" />
        <ellipse cx="120" cy="242" rx="3" ry="7" />
        <ellipse cx="180" cy="240" rx="3" ry="7" />
        <ellipse cx="240" cy="241" rx="3" ry="7" />
        <ellipse cx="300" cy="244" rx="3" ry="7" />
        <ellipse cx="90" cy="266" rx="3" ry="8" />
        <ellipse cx="150" cy="262" rx="3" ry="8" />
        <ellipse cx="210" cy="260" rx="3" ry="8" />
        <ellipse cx="270" cy="262" rx="3" ry="8" />
        <ellipse cx="330" cy="266" rx="3" ry="8" />
      </g>
    </svg>
  );
}

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resetNotice, setResetNotice] = useState(false);

  // Client-component pages can't export static metadata; set the tab title directly.
  useEffect(() => {
    document.title = "Sign in · SasyaSakhi";
  }, []);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const result = await mockSignIn(email.trim(), password);
      if (!result.ok || !result.user) {
        setError(result.error ?? "Sign in failed. Please try again.");
        return;
      }
      store.setUser(result.user);
      router.push("/dashboard");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-ivory">
      {/* Left art panel */}
      <div className="relative hidden w-1/2 flex-col justify-between overflow-hidden bg-pine p-10 lg:flex">
        <div
          className="pointer-events-none absolute inset-0 opacity-30"
          style={{
            background:
              "radial-gradient(ellipse 80% 60% at 20% 20%, rgba(105,166,107,0.35), transparent 70%)",
          }}
          aria-hidden
        />
        <Link href="/" className="relative flex items-center gap-2.5" aria-label="SasyaSakhi home">
          <span className="flex size-10 items-center justify-center rounded-xl bg-leaf/20 ring-1 ring-leaf/40">
            <Sprout className="size-5 text-leaf" aria-hidden />
          </span>
          <span className="font-display text-xl font-semibold tracking-tight text-ivory">
            SasyaSakhi
          </span>
        </Link>

        <div className="relative">
          <FarmlandArt />
        </div>

        <blockquote className="relative">
          <p className="font-display text-2xl font-medium leading-snug text-ivory">
            “Know your soil, and it will tell you what to grow.”
          </p>
          <footer className="mt-3 text-sm text-ivory/60">
            Soil health guidance for Indian farmers — in English and Telugu.
          </footer>
        </blockquote>
      </div>

      {/* Right form panel */}
      <div className="flex w-full flex-col items-center justify-center px-4 py-10 sm:px-8 lg:w-1/2">
        <div className="w-full max-w-md">
          <Link
            href="/"
            className="mb-8 flex items-center gap-2.5 lg:hidden"
            aria-label="SasyaSakhi home"
          >
            <span className="flex size-10 items-center justify-center rounded-xl bg-forest">
              <Sprout className="size-5 text-ivory" aria-hidden />
            </span>
            <span className="font-display text-xl font-semibold tracking-tight text-charcoal">
              SasyaSakhi
            </span>
          </Link>

          <div className="rounded-3xl border border-sage bg-white p-6 shadow-xl shadow-forest/5 sm:p-8">
            <h1 className="font-display text-3xl font-semibold tracking-tight text-charcoal">
              Welcome back
            </h1>
            <p className="mt-2 text-sm text-charcoal/60">
              Sign in to continue to your farm dashboard.
            </p>

            <form onSubmit={handleSubmit} noValidate className="mt-6 space-y-4">
              <div>
                <label
                  htmlFor="login-email"
                  className="mb-1.5 block text-sm font-medium text-charcoal"
                >
                  Email
                </label>
                <input
                  id="login-email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  aria-invalid={error ? true : undefined}
                  aria-describedby={error ? "login-error" : undefined}
                  placeholder="you@example.com"
                  className="w-full rounded-xl border border-sage bg-ivory/50 px-3.5 py-2.5 text-sm text-charcoal placeholder:text-charcoal/40 focus:border-leaf focus:outline-none focus:ring-2 focus:ring-leaf/40"
                />
              </div>

              <div>
                <label
                  htmlFor="login-password"
                  className="mb-1.5 block text-sm font-medium text-charcoal"
                >
                  Password
                </label>
                <div className="relative">
                  <input
                    id="login-password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="current-password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    aria-invalid={error ? true : undefined}
                    aria-describedby={error ? "login-error" : undefined}
                    placeholder="••••••••"
                    className="w-full rounded-xl border border-sage bg-ivory/50 px-3.5 py-2.5 pr-11 text-sm text-charcoal placeholder:text-charcoal/40 focus:border-leaf focus:outline-none focus:ring-2 focus:ring-leaf/40"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    aria-pressed={showPassword}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-md p-1 text-charcoal/50 hover:text-charcoal"
                  >
                    {showPassword ? (
                      <EyeOff className="size-4.5" aria-hidden />
                    ) : (
                      <Eye className="size-4.5" aria-hidden />
                    )}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between text-sm">
                <label htmlFor="login-remember" className="flex cursor-pointer items-center gap-2 text-charcoal/70">
                  <input
                    id="login-remember"
                    type="checkbox"
                    checked={remember}
                    onChange={(e) => setRemember(e.target.checked)}
                    className="size-4 rounded border-sage accent-[#123D2A]"
                  />
                  Remember me
                </label>
                <button
                  type="button"
                  onClick={() => setResetNotice(true)}
                  className="font-medium text-forest hover:underline"
                >
                  Forgot password?
                </button>
              </div>

              {resetNotice && (
                <p role="status" className="rounded-xl bg-sage/60 px-3.5 py-2.5 text-sm text-charcoal">
                  Demo: password reset is not wired in the prototype.
                </p>
              )}

              {error && (
                <p id="login-error" role="alert" className="rounded-xl bg-red-50 px-3.5 py-2.5 text-sm font-medium text-red-700">
                  {error}
                </p>
              )}

              <Button
                type="submit"
                size="lg"
                disabled={loading}
                className="w-full bg-forest text-ivory hover:bg-pine"
              >
                {loading ? (
                  <>
                    <Loader2 className="animate-spin" aria-hidden />
                    Signing in…
                  </>
                ) : (
                  "Sign in"
                )}
              </Button>
            </form>

            <div className="my-5 flex items-center gap-3" aria-hidden>
              <span className="h-px flex-1 bg-sage" />
              <span className="text-xs uppercase tracking-wider text-charcoal/40">or</span>
              <span className="h-px flex-1 bg-sage" />
            </div>

            <Button
              type="button"
              variant="outline"
              size="lg"
              disabled
              title="Google sign-in is not connected in this demo"
              className="w-full cursor-not-allowed opacity-70"
            >
              <span
                className="flex size-4 items-center justify-center rounded-full bg-white text-[11px] font-bold text-[#4285F4] ring-1 ring-sage"
                aria-hidden
              >
                G
              </span>
              Google sign-in (demo — not connected)
            </Button>

            <p className="mt-6 text-center text-sm text-charcoal/60">
              New to SasyaSakhi?{" "}
              <Link href="/signup" className="font-semibold text-forest hover:underline">
                Create account
              </Link>
            </p>
          </div>

          <p className="mt-4 text-center text-xs text-charcoal/50">
            Demo prototype — no real credentials are stored or verified.
          </p>
        </div>
      </div>
    </div>
  );
}

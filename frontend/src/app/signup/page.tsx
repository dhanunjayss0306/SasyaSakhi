"use client";

import { useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CheckCircle2, Eye, EyeOff, Loader2, Sprout } from "lucide-react";
import { Button } from "@/components/ui/button";
import { mockSignUp } from "@/lib/mock-auth";
import { store, type Lang } from "@/lib/store";

export default function SignUpPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [farmName, setFarmName] = useState("");
  const [district, setDistrict] = useState("");
  const [lang, setLang] = useState<Lang>("en");
  const [terms, setTerms] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Client-component pages can't export static metadata; set the tab title directly.
  useEffect(() => {
    document.title = "Create account · SasyaSakhi";
  }, []);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);

    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }
    if (!terms) {
      setError("Please accept the terms to create your demo account.");
      return;
    }

    setLoading(true);
    try {
      const result = await mockSignUp(name.trim(), email.trim(), password);
      if (!result.ok || !result.user) {
        setError(result.error ?? "Sign up failed. Please try again.");
        return;
      }
      store.setUser(result.user);
      store.setLang(lang);
      setSuccess(true);
      // Brief success state before entering the dashboard.
      setTimeout(() => router.push("/dashboard"), 900);
    } finally {
      setLoading(false);
    }
  };

  const inputClass =
    "w-full rounded-xl border border-sage bg-ivory/50 px-3.5 py-2.5 text-sm text-charcoal placeholder:text-charcoal/40 focus:border-leaf focus:outline-none focus:ring-2 focus:ring-leaf/40";

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-ivory px-4 py-10 sm:px-8">
      <div className="w-full max-w-lg">
        <Link href="/" className="mb-6 flex items-center justify-center gap-2.5" aria-label="SasyaSakhi home">
          <span className="flex size-10 items-center justify-center rounded-xl bg-forest">
            <Sprout className="size-5 text-ivory" aria-hidden />
          </span>
          <span className="font-display text-xl font-semibold tracking-tight text-charcoal">
            SasyaSakhi
          </span>
        </Link>

        <div className="rounded-3xl border border-sage bg-white p-6 shadow-xl shadow-forest/5 sm:p-8">
          <h1 className="font-display text-3xl font-semibold tracking-tight text-charcoal">
            Create your account
          </h1>
          <p className="mt-2 text-sm text-charcoal/60">
            Prototype — no real account is created. Demo data only.
          </p>

          {success ? (
            <div role="status" className="mt-6 flex flex-col items-center gap-3 py-8 text-center">
              <CheckCircle2 className="size-12 text-leaf" aria-hidden />
              <p className="font-display text-xl font-semibold text-charcoal">
                Account created, {name.trim() || "farmer"}!
              </p>
              <p className="text-sm text-charcoal/60">Taking you to your dashboard…</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} noValidate className="mt-6 space-y-4">
              <div>
                <label htmlFor="signup-name" className="mb-1.5 block text-sm font-medium text-charcoal">
                  Full name
                </label>
                <input
                  id="signup-name"
                  type="text"
                  autoComplete="name"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  aria-invalid={error ? true : undefined}
                  aria-describedby={error ? "signup-error" : undefined}
                  placeholder="e.g. Ramesh Kumar"
                  className={inputClass}
                />
              </div>

              <div>
                <label htmlFor="signup-email" className="mb-1.5 block text-sm font-medium text-charcoal">
                  Email
                </label>
                <input
                  id="signup-email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  aria-invalid={error ? true : undefined}
                  aria-describedby={error ? "signup-error" : undefined}
                  placeholder="you@example.com"
                  className={inputClass}
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label htmlFor="signup-password" className="mb-1.5 block text-sm font-medium text-charcoal">
                    Password
                  </label>
                  <div className="relative">
                    <input
                      id="signup-password"
                      type={showPassword ? "text" : "password"}
                      autoComplete="new-password"
                      required
                      minLength={6}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      aria-invalid={error ? true : undefined}
                      aria-describedby={error ? "signup-error" : undefined}
                      placeholder="Min. 6 characters"
                      className={`${inputClass} pr-11`}
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
                <div>
                  <label htmlFor="signup-confirm" className="mb-1.5 block text-sm font-medium text-charcoal">
                    Confirm password
                  </label>
                  <input
                    id="signup-confirm"
                    type={showPassword ? "text" : "password"}
                    autoComplete="new-password"
                    required
                    value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
                    aria-invalid={error ? true : undefined}
                    aria-describedby={error ? "signup-error" : undefined}
                    placeholder="Repeat password"
                    className={inputClass}
                  />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label htmlFor="signup-farm" className="mb-1.5 block text-sm font-medium text-charcoal">
                    Farm name <span className="font-normal text-charcoal/50">(optional)</span>
                  </label>
                  <input
                    id="signup-farm"
                    type="text"
                    autoComplete="off"
                    value={farmName}
                    onChange={(e) => setFarmName(e.target.value)}
                    placeholder="e.g. Green Acres"
                    className={inputClass}
                  />
                </div>
                <div>
                  <label htmlFor="signup-district" className="mb-1.5 block text-sm font-medium text-charcoal">
                    District <span className="font-normal text-charcoal/50">(optional)</span>
                  </label>
                  <input
                    id="signup-district"
                    type="text"
                    autoComplete="address-level2"
                    value={district}
                    onChange={(e) => setDistrict(e.target.value)}
                    placeholder="e.g. Visakhapatnam"
                    className={inputClass}
                  />
                </div>
              </div>

              <fieldset>
                <legend className="mb-1.5 text-sm font-medium text-charcoal">
                  Preferred language
                </legend>
                <div className="flex gap-3">
                  {(
                    [
                      { code: "en", label: "English" },
                      { code: "te", label: "తెలుగు" },
                    ] as const
                  ).map((opt) => (
                    <label
                      key={opt.code}
                      className={`flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-medium transition-colors ${
                        lang === opt.code
                          ? "border-forest bg-forest text-ivory"
                          : "border-sage bg-ivory/50 text-charcoal hover:border-leaf"
                      }`}
                    >
                      <input
                        type="radio"
                        name="language"
                        value={opt.code}
                        checked={lang === opt.code}
                        onChange={() => setLang(opt.code)}
                        className="sr-only"
                      />
                      {opt.label}
                    </label>
                  ))}
                </div>
              </fieldset>

              <label htmlFor="signup-terms" className="flex cursor-pointer items-start gap-2.5 text-sm text-charcoal/70">
                <input
                  id="signup-terms"
                  type="checkbox"
                  required
                  checked={terms}
                  onChange={(e) => setTerms(e.target.checked)}
                  aria-invalid={error ? true : undefined}
                  aria-describedby={error ? "signup-error" : undefined}
                  className="mt-0.5 size-4 rounded border-sage accent-[#123D2A]"
                />
                <span>
                  I agree to the demo terms. I understand this is a prototype and no real
                  account or data is stored.
                </span>
              </label>

              {error && (
                <p id="signup-error" role="alert" className="rounded-xl bg-red-50 px-3.5 py-2.5 text-sm font-medium text-red-700">
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
                    Creating account…
                  </>
                ) : (
                  "Create account"
                )}
              </Button>
            </form>
          )}

          <p className="mt-6 text-center text-sm text-charcoal/60">
            Already have an account?{" "}
            <Link href="/login" className="font-semibold text-forest hover:underline">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

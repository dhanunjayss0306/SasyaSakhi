"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { store, useStoredLang, useStoredUser, type Lang } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Bell, Globe, LogOut, UserRound } from "lucide-react";

function Switch({
  checked,
  onChange,
  label,
  hint,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
  hint: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className="flex w-full items-center justify-between gap-4 rounded-xl border border-sage bg-white p-4 text-left"
    >
      <span>
        <span className="block font-medium text-charcoal">{label}</span>
        <span className="block text-sm text-charcoal/60">{hint}</span>
      </span>
      <span
        aria-hidden
        className={cn(
          "relative h-7 w-12 shrink-0 rounded-full transition-colors",
          checked ? "bg-forest" : "bg-charcoal/20"
        )}
      >
        <span
          className={cn(
            "absolute top-1 h-5 w-5 rounded-full bg-white shadow transition-all",
            checked ? "left-6" : "left-1"
          )}
        />
      </span>
    </button>
  );
}

export default function SettingsPage() {
  const router = useRouter();
  const storedUser = useStoredUser();
  const lang = useStoredLang();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [saved, setSaved] = useState(false);
  const [weatherAlerts, setWeatherAlerts] = useState(true);
  const [taskReminders, setTaskReminders] = useState(true);
  const [priceUpdates, setPriceUpdates] = useState(false);

  // Fill the form from the stored profile after hydration. Reading it in
  // the useState initializers rendered the stored values on the client
  // while the server rendered empty fields.
  useEffect(() => {
    (async () => {
      setName(storedUser?.name ?? "");
      setEmail(storedUser?.email ?? "");
    })();
  }, [storedUser]);

  const pickLang = (l: Lang) => {
    store.setLang(l);
  };

  const saveProfile = () => {
    // Prototype-only: keep the edited profile on this device.
    store.setUser({ name: name.trim() || "Farmer", email: email.trim() });
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const signOut = () => {
    store.clear();
    router.push("/");
  };

  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-8 sm:px-6">
      <h1 className="font-display text-3xl font-semibold text-charcoal">Settings</h1>
      <p className="mt-1 text-sm text-charcoal/65">
        Prototype — settings save on this device only.
      </p>

      {/* Language */}
      <section aria-labelledby="lang-heading" className="mt-8 rounded-2xl border border-sage bg-white p-5">
        <h2 id="lang-heading" className="flex items-center gap-2 font-display text-lg font-semibold text-charcoal">
          <Globe className="h-5 w-5 text-forest" aria-hidden />
          Language / భాష
        </h2>
        <div role="group" aria-label="App language" className="mt-4 grid grid-cols-2 gap-2 rounded-xl bg-ivory p-1.5">
          {(
            [
              { code: "en", label: "English" },
              { code: "te", label: "తెలుగు" },
            ] as { code: Lang; label: string }[]
          ).map((opt) => (
            <button
              key={opt.code}
              type="button"
              onClick={() => pickLang(opt.code)}
              aria-pressed={lang === opt.code}
              className={cn(
                "rounded-lg px-4 py-2.5 text-sm font-semibold transition-colors",
                lang === opt.code ? "bg-forest text-ivory shadow" : "text-forest hover:bg-sage"
              )}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </section>

      {/* Profile */}
      <section aria-labelledby="profile-heading" className="mt-6 rounded-2xl border border-sage bg-white p-5">
        <h2 id="profile-heading" className="flex items-center gap-2 font-display text-lg font-semibold text-charcoal">
          <UserRound className="h-5 w-5 text-forest" aria-hidden />
          Profile
        </h2>
        <div className="mt-4 space-y-4">
          <div>
            <label htmlFor="profile-name" className="mb-1 block text-sm font-medium text-charcoal">
              Name
            </label>
            <input
              id="profile-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your name"
              autoComplete="name"
              className="h-10 w-full rounded-xl border border-sage bg-ivory px-4 text-sm text-charcoal placeholder:text-charcoal/40 focus:border-forest focus:outline-none"
            />
          </div>
          <div>
            <label htmlFor="profile-email" className="mb-1 block text-sm font-medium text-charcoal">
              Email
            </label>
            <input
              id="profile-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              autoComplete="email"
              className="h-10 w-full rounded-xl border border-sage bg-ivory px-4 text-sm text-charcoal placeholder:text-charcoal/40 focus:border-forest focus:outline-none"
            />
          </div>
          <div className="flex items-center gap-3">
            <Button onClick={saveProfile}>Save profile</Button>
            {saved && (
              <p role="status" className="text-sm font-medium text-forest">
                Saved on this device.
              </p>
            )}
          </div>
        </div>
      </section>

      {/* Notifications */}
      <section aria-labelledby="notif-heading" className="mt-6">
        <h2 id="notif-heading" className="flex items-center gap-2 font-display text-lg font-semibold text-charcoal">
          <Bell className="h-5 w-5 text-forest" aria-hidden />
          Notifications
        </h2>
        <div className="mt-4 space-y-3">
          <Switch
            checked={weatherAlerts}
            onChange={setWeatherAlerts}
            label="Weather alerts"
            hint="Warn me before heavy rain or heat waves."
          />
          <Switch
            checked={taskReminders}
            onChange={setTaskReminders}
            label="Task reminders"
            hint="Remind me about upcoming calendar tasks."
          />
          <Switch
            checked={priceUpdates}
            onChange={setPriceUpdates}
            label="Price updates"
            hint="Notify me about fertilizer price changes."
          />
        </div>
        <p className="mt-3 text-xs text-charcoal/55">
          Demo toggles — notifications are not actually sent in this prototype.
        </p>
      </section>

      {/* Sign out */}
      <div className="mt-8 border-t border-sage pt-6">
        <Button variant="destructive" onClick={signOut}>
          <LogOut className="h-4 w-4" aria-hidden />
          Sign out
        </Button>
      </div>
    </div>
  );
}

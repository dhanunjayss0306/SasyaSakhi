const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

export interface MockUser {
  name: string;
  email: string;
}

/** Frontend-only mock auth. Replace with the real backend later. */
export async function mockSignIn(email: string, password: string): Promise<{ ok: boolean; error?: string; user?: MockUser }> {
  await delay(900);
  if (!/^\S+@\S+\.\S+$/.test(email)) return { ok: false, error: "Enter a valid email address." };
  if (password.length < 6) return { ok: false, error: "Password must be at least 6 characters." };
  return { ok: true, user: { name: email.split("@")[0], email } };
}

export async function mockSignUp(
  name: string,
  email: string,
  password: string
): Promise<{ ok: boolean; error?: string; user?: MockUser }> {
  await delay(1100);
  if (name.trim().length < 2) return { ok: false, error: "Please enter your name." };
  if (!/^\S+@\S+\.\S+$/.test(email)) return { ok: false, error: "Enter a valid email address." };
  if (password.length < 6) return { ok: false, error: "Password must be at least 6 characters." };
  return { ok: true, user: { name: name.trim(), email } };
}

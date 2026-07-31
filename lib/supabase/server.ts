import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

function credentials() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  return url && key ? { url, key } : null;
}

export function isSupabaseConfigured() {
  return credentials() !== null;
}

export async function createClient() {
  const configured = credentials();
  if (!configured) throw new Error("Supabase環境変数が設定されていません");
  const cookieStore = await cookies();

  return createServerClient(configured.url, configured.key, {
    cookies: {
      getAll: () => cookieStore.getAll(),
      setAll: (items) => {
        try {
          items.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options),
          );
        } catch {
          // Server Components cannot write cookies. proxy.ts refreshes sessions.
        }
      },
    },
  });
}

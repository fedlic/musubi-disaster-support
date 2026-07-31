"use client";

import { useState } from "react";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";

export default function GoogleLoginButton({ nextPath }: { nextPath: string }) {
  const [message, setMessage] = useState("");
  const configured = isSupabaseConfigured();

  async function login() {
    setMessage("");
    const supabase = createClient();
    const callback = new URL("/auth/callback", window.location.origin);
    callback.searchParams.set("next", nextPath);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: callback.toString() },
    });
    if (error) setMessage("ログインを開始できませんでした。");
  }

  return (
    <>
      <button className="google-button" onClick={login} disabled={!configured}>
        <span aria-hidden="true">G</span>
        Googleでログイン
      </button>
      {!configured && (
        <p className="auth-message">現在、認証基盤の接続設定中です。</p>
      )}
      {message && <p className="auth-error" role="alert">{message}</p>}
    </>
  );
}

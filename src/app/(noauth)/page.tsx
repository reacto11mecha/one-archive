"use client";

import { useState } from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { authClient } from "~/server/better-auth/client";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  // Fungsi Login dengan Email/Password
  const handleLogin = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      const { error: authError } = await authClient.signIn.email({
        email,
        password,
      });

      if (authError) {
        setError(authError.message || "Email atau kata sandi salah.");
      } else {
        toast.success("Berhasil login!");
        router.push("/app/dashboard");
        router.refresh();
      }
    } catch (err) {
      setError("Terjadi kesalahan pada server.");
    } finally {
      setIsLoading(false);
    }
  };

  // Fungsi Login dengan Google
  const handleGoogleLogin = async () => {
    setIsGoogleLoading(true);
    setError("");
    try {
      await authClient.signIn.social({
        provider: "google",
        callbackURL: "/app",
      });
    } catch (err) {
      setError("Gagal masuk dengan Google.");
      setIsGoogleLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-[var(--color-navy)] to-[var(--color-navy3)] font-sans">
      <div className="w-[380px] rounded-[16px] bg-white px-[36px] py-[40px] text-center shadow-[0_8px_40px_rgba(0,0,0,0.3)]">
        {/* Logo Berhasil Diperbarui */}
        <div className="mx-auto mb-[12px] flex items-center justify-center overflow-hidden bg-white">
          <img
            src="/icon.png"
            alt="Logo One Archive"
            className="h-[84px] object-contain"
          />
        </div>

        <h1 className="mb-[2px] text-[20px] font-bold text-[var(--color-navy)]">
          One Archive
        </h1>
        <p className="mb-[24px] text-[11px] text-[var(--color-muted)]">
          Sistem Arsip Digital &middot; SMA Negeri 1 Jakarta
        </p>

        {/* Tombol Login Google */}
        <button
          type="button"
          onClick={handleGoogleLogin}
          disabled={isGoogleLoading || isLoading}
          className="mb-[16px] flex w-full items-center justify-center gap-2 rounded-[8px] border-[1.5px] border-[var(--color-border-main)] bg-white p-[11px] text-[13px] font-bold text-[var(--color-text-main)] transition-colors hover:bg-gray-50 disabled:opacity-70"
        >
          <svg className="h-[18px] w-[18px]" viewBox="0 0 24 24">
            <path
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              fill="#4285F4"
            />
            <path
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              fill="#34A853"
            />
            <path
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              fill="#FBBC05"
            />
            <path
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              fill="#EA4335"
            />
          </svg>
          {isGoogleLoading ? "Memproses..." : "Masuk dengan Google"}
        </button>

        {/* Divider "Atau" */}
        <div className="mb-[16px] flex items-center gap-[10px]">
          <div className="h-[1px] flex-1 bg-[var(--color-border-main)]"></div>
          <span className="text-[11px] font-semibold text-[var(--color-muted)]">
            ATAU
          </span>
          <div className="h-[1px] flex-1 bg-[var(--color-border-main)]"></div>
        </div>

        {/* Form Login Biasa */}
        <form onSubmit={handleLogin} className="text-left">
          <div className="mb-[14px]">
            <label className="mb-[4px] block text-[11px] font-semibold text-[var(--color-navy)]">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Masukkan email..."
              required
              className="w-full rounded-[8px] border-[1.5px] border-[var(--color-border-main)] p-[10px_12px] text-[12px] transition-colors outline-none focus:border-[var(--color-accent)]"
            />
          </div>

          <div className="mb-[14px]">
            <label className="mb-[4px] block text-[11px] font-semibold text-[var(--color-navy)]">
              Kata Sandi
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Masukkan kata sandi..."
              required
              className="w-full rounded-[8px] border-[1.5px] border-[var(--color-border-main)] p-[10px_12px] text-[12px] transition-colors outline-none focus:border-[var(--color-accent)]"
            />
          </div>

          {error && (
            <div className="mt-[8px] text-[11px] text-[var(--color-danger)]">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading || isGoogleLoading}
            className="mt-[8px] w-full cursor-pointer rounded-[8px] bg-[var(--color-navy)] p-[11px] text-[13px] font-bold text-white transition-colors hover:bg-[var(--color-navy3)] disabled:opacity-70"
          >
            {isLoading ? "Memproses..." : "Masuk"}
          </button>
        </form>
      </div>
    </div>
  );
}

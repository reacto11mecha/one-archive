import Image from "next/image";
import { redirect } from "next/navigation";
import { getSession } from "~/server/better-auth/server";
import Link from "next/link";
import { db } from "~/server/db";
import * as schema from "~/server/db/schema";
import { eq } from "drizzle-orm";
import { Topbar } from "~/app/_components/Topbar";

export default async function AuthenticatedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();

  if (!session) {
    redirect("/");
  }

  const currentUserData = await db.query.user.findFirst({
    where: eq(schema.user.id, session.user.id),
    with: {
      role: true,
    },
  });

  if (!currentUserData?.roleId) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-[var(--color-navy)] to-[var(--color-navy3)] p-4 font-sans">
        <div className="w-[420px] rounded-[16px] bg-white px-[36px] py-[40px] text-center shadow-[0_8px_40px_rgba(0,0,0,0.3)]">
          <div className="mx-auto mb-[16px] flex h-[72px] w-[72px] items-center justify-center rounded-full border-2 border-amber-400 bg-amber-50 text-3xl text-amber-500">
            ⚠️
          </div>
          <h1 className="mb-[8px] text-[18px] font-bold text-[var(--color-navy)]">
            Anda Belum Terverifikasi
          </h1>
          <p className="mb-[24px] text-[12px] leading-relaxed text-[var(--color-muted)]">
            Akun Anda (
            <span className="font-semibold text-[var(--color-text-main)]">
              {session.user.email}
            </span>
            ) berhasil didaftarkan, namun memerlukan verifikasi dari pihak
            Administrator sebelum dapat mengakses berkas arsip sekolah.
          </p>

          <form
            action={async () => {
              "use server";
              const { auth } = await import("~/server/better-auth");
              const { headers } = await import("next/headers");
              await auth.api.signOut({ headers: await headers() });
              redirect("/");
            }}
          >
            <button
              type="submit"
              className="w-full cursor-pointer rounded-[8px] bg-gray-100 p-[10px] text-[12px] font-bold text-[var(--color-text-main)] transition-colors hover:bg-gray-200"
            >
              Kembali ke Halaman Login
            </button>
          </form>
        </div>
      </div>
    );
  }

  const isAdmin = currentUserData?.role?.isAdmin ?? false;
  const roleName = currentUserData?.role?.name ?? "Staf / Guru";

  return (
    <div className="flex min-h-screen bg-[var(--color-off)] font-sans text-[var(--color-text-main)]">
      <input type="checkbox" id="mobile-sidebar" className="peer hidden" />

      <label
        htmlFor="mobile-sidebar"
        className="fixed inset-0 z-[998] hidden cursor-pointer bg-black/50 backdrop-blur-sm peer-checked:block md:hidden"
      ></label>

      <script
        dangerouslySetInnerHTML={{
          __html: `
            document.addEventListener('click', function(e) {
              if (window.innerWidth < 768) {
                if (e.target.closest('aside a') || e.target.closest('aside button')) {
                  var checkbox = document.getElementById('mobile-sidebar');
                  if (checkbox) checkbox.checked = false;
                }
              }
            });
          `,
        }}
      />

      <aside className="fixed top-0 left-0 z-[999] flex h-screen w-[220px] min-w-[220px] -translate-x-full flex-col bg-[var(--color-navy)] transition-transform duration-300 ease-in-out peer-checked:translate-x-0 md:translate-x-0">
        <div className="flex items-center justify-between border-b border-white/10 p-[18px_16px_14px] md:block">
          <div className="flex items-center gap-[10px]">
            <Image
              src="/icon.png"
              alt="Logo"
              width={38}
              height={38}
              className="h-[38px] w-[38px] object-contain"
            />
            <div>
              <h2 className="text-[13px] leading-tight font-bold text-white">
                One Archive
              </h2>
              <span className="text-[10px] text-white/55">
                SMA Negeri 1 Jakarta
              </span>
            </div>
          </div>
          {/* Tombol Tutup Silang Khusus Mobile */}
          <label
            htmlFor="mobile-sidebar"
            className="cursor-pointer p-1 text-white/50 hover:text-white md:hidden"
          >
            <svg
              className="h-6 w-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </label>
        </div>

        <nav className="flex-1 space-y-[2px] overflow-y-auto py-[12px]">
          <div className="px-[12px]">
            <Link
              href="/app/dashboard"
              className="flex items-center gap-[10px] rounded-[8px] p-[9px_14px] text-[12px] font-medium text-white/70 hover:bg-white/8 hover:text-white"
            >
              <span>📊 Dashboard</span>
            </Link>
          </div>

          <div className="px-[12px]">
            <Link
              href="/app/archive"
              className="flex items-center gap-[10px] rounded-[8px] p-[9px_14px] text-[12px] font-medium text-white/70 hover:bg-white/8 hover:text-white"
            >
              <span>📁 Arsip</span>
            </Link>
          </div>

          {isAdmin && (
            <>
              <div className="px-[12px]">
                <Link
                  href="/app/retention"
                  className="flex items-center gap-[10px] rounded-[8px] p-[9px_14px] text-[12px] font-medium text-white/70 hover:bg-white/8 hover:text-white"
                >
                  <span>🔥 Retensi & JRA</span>
                </Link>
              </div>

              <div className="px-[12px]">
                <Link
                  href="/app/system"
                  className="flex items-center gap-[10px] rounded-[8px] p-[9px_14px] text-[12px] font-medium text-white/70 hover:bg-white/8 hover:text-white"
                >
                  <span>⚙️ Pengaturan Sistem</span>
                </Link>
              </div>

              <div className="px-[12px]">
                <Link
                  href="/app/backup"
                  className="flex items-center gap-[10px] rounded-[8px] p-[9px_14px] text-[12px] font-medium text-white/70 hover:bg-white/8 hover:text-white"
                >
                  <span>💾 Backup Data</span>
                </Link>
              </div>
            </>
          )}
        </nav>

        <div className="border-t border-white/10 bg-[var(--color-navy3)] p-[12px_16px]">
          <div className="flex items-center gap-[10px]">
            {session.user.image ? (
              <Image
                width={34}
                height={34}
                src={session.user.image}
                alt={session.user.name}
                className="h-[34px] w-[34px] shrink-0 rounded-full border border-white/20 object-cover"
              />
            ) : (
              <div className="flex h-[34px] w-[34px] shrink-0 items-center justify-center rounded-full bg-[var(--color-accent)] text-[13px] font-bold text-white">
                {session.user.name?.[0]?.toUpperCase() || "U"}
              </div>
            )}

            <div className="overflow-hidden">
              <span className="block truncate text-[11px] font-semibold text-white">
                {session.user.name}
              </span>
              <small className="block truncate text-[10px] text-white/45">
                {roleName}
              </small>
            </div>
          </div>

          <form
            action={async () => {
              "use server";
              const { auth } = await import("~/server/better-auth");
              const { headers } = await import("next/headers");
              await auth.api.signOut({ headers: await headers() });
              redirect("/");
            }}
          >
            <button
              type="submit"
              className="mt-[8px] w-full cursor-pointer rounded-[6px] bg-white/8 p-[7px] text-[11px] font-semibold text-white/70 transition-colors hover:bg-white/15"
            >
              📴 Keluar
            </button>
          </form>
        </div>
      </aside>

      <div className="flex min-h-screen w-full flex-1 flex-col md:ml-[220px] md:w-auto">
        {/* 👇 Header Hamburger Khusus Mobile (Tidak mengganggu struktur Topbar Asli) */}
        <div className="flex items-center justify-between border-b-[1.5px] border-gray-200 bg-white px-[16px] py-[14px] md:hidden">
          <div className="flex items-center gap-[12px]">
            <label
              htmlFor="mobile-sidebar"
              className="cursor-pointer rounded-[6px] border border-gray-200 bg-gray-50 p-[6px] text-gray-600 shadow-sm hover:bg-gray-100"
            >
              <svg
                className="h-5 w-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              </svg>
            </label>
            <span className="text-[14px] font-bold text-[var(--color-navy)]">
              Menu Navigasi
            </span>
          </div>
        </div>

        {/* Topbar Asli 100% Tidak Disentuh */}
        <Topbar />

        <main className="flex-1 p-[16px] md:p-[24px]">{children}</main>
      </div>
    </div>
  );
}

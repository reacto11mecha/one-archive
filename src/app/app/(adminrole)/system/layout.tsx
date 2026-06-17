"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function SystemSubLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  // Konfigurasi daftar sub-path master data
  const subMenus = [
    { href: "/app/system/users", label: "👥 Manajemen Pengguna" },
    { href: "/app/system/roles", label: "🔑 Peran & Hak Akses" },
    { href: "/app/system/categories", label: "📁 Klasifikasi Arsip" },
  ];

  return (
    <div className="space-y-[20px]">
      {/* Baris Tab Navigasi Sesuai Estetika Asli */}
      <div className="flex gap-[4px] border-b border-[var(--color-border-main)]">
        {subMenus.map((menu) => {
          const isActive = pathname === menu.href;
          return (
            <Link
              key={menu.href}
              href={menu.href}
              className={`-mb-[1.5px] cursor-pointer border-b-2 p-[10px_16px] text-[12px] font-semibold transition-all duration-150 ${
                isActive
                  ? "rounded-t-[8px] border-[var(--color-accent)] bg-blue-50/60 text-[var(--color-accent)]"
                  : "border-transparent text-[var(--color-muted)] hover:text-[var(--color-text-main)]"
              }`}
            >
              {menu.label}
            </Link>
          );
        })}
      </div>

      {/* Area Konten Anak Halaman Aktif */}
      <div className="animate-fadeIn bg-transparent">{children}</div>
    </div>
  );
}

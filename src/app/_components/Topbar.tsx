"use client";

import { usePathname } from "next/navigation";

export function Topbar() {
  const pathname = usePathname();

  // Pemetaan Judul Topbar berdasarkan sub-path aktif
  const getTopbarTitle = () => {
    if (pathname.startsWith("/app/dashboard")) return "Dashboard Statistik";
    if (pathname.startsWith("/app/archive")) return "Manajemen Arsip Dokumen";
    if (pathname.startsWith("/app/system"))
      return "Pengaturan Sistem & Master Data";
    if (pathname.startsWith("/app/backup")) return "Backup & Ekspor Data";
    return "Panel Sistem";
  };

  return (
    <header className="sticky top-0 z-50 flex h-[52px] items-center justify-between border-b border-[var(--color-border-main)] bg-white px-[24px]">
      <span className="text-[14px] font-bold text-[var(--color-navy)] transition-all">
        {getTopbarTitle()}
      </span>
    </header>
  );
}

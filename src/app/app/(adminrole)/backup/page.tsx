"use client";

import { toast } from "sonner";
import { useState } from "react";

export default function BackupPage() {
  const [isExporting, setIsExporting] = useState(false);

  const handleExportJSON = async () => {
    setIsExporting(true);
    const toastId = toast.loading("Menyiapkan paket backup data...");

    try {
      // Nanti kita akan arahkan ke Route Handler API untuk mengunduh JSON
      const response = await fetch("/api/backup/export");
      if (!response.ok) throw new Error("Gagal mengunduh data");

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute(
        "download",
        `one_archive_backup_${new Date().toISOString().split("T")[0]}.json`,
      );
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast.success("Backup metadata berhasil diunduh!", { id: toastId });
    } catch (error) {
      toast.error("Terjadi kesalahan saat memproses backup.", { id: toastId });
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="max-w-4xl space-y-[24px]">
      <div>
        <h2 className="text-[18px] font-bold text-[var(--color-navy)]">
          Pusat Pemulihan & Backup Data
        </h2>
        <p className="text-[12px] text-[var(--color-muted)]">
          Kelola salinan cadangan metadata arsip dan status penyimpanan berkas
          fisik Anda.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-[20px] md:grid-cols-2">
        {/* Modul Backup Database Metadata */}
        <div className="flex flex-col justify-between rounded-[12px] border-[1.5px] border-[var(--color-border-main)] bg-white p-[24px] shadow-sm">
          <div>
            <div className="mb-[12px] flex items-center gap-[12px]">
              <div className="flex h-[40px] w-[40px] items-center justify-center rounded-full bg-blue-50 text-[18px] text-blue-600">
                🗄️
              </div>
              <div>
                <h3 className="text-[14px] font-bold text-[var(--color-navy)]">
                  Backup Metadata (JSON)
                </h3>
                <p className="text-[11px] text-[var(--color-muted)]">
                  Unduh seluruh data tabel, pengguna, dan log arsip.
                </p>
              </div>
            </div>
            <p className="mb-[20px] text-[11px] leading-relaxed text-[var(--color-text-main)]">
              Tindakan ini akan mengekspor seluruh entri data dari database
              relasional ke dalam format JSON yang aman dan portabel. Proses ini
              tidak mencakup berkas fisik (.pdf, .docx).
            </p>
          </div>
          <button
            onClick={handleExportJSON}
            disabled={isExporting}
            className="w-full rounded-[8px] bg-[var(--color-accent)] py-[10px] text-[12px] font-bold text-white transition-colors hover:bg-[var(--color-accent2)] disabled:opacity-70"
          >
            {isExporting ? "Memproses Unduhan..." : "Unduh Backup Database"}
          </button>
        </div>

        {/* Modul Informasi Backup Berkas Fisik (S3) */}
        <div className="flex flex-col justify-between rounded-[12px] border-[1.5px] border-[var(--color-border-main)] bg-white p-[24px] opacity-90 shadow-sm">
          <div>
            <div className="mb-[12px] flex items-center gap-[12px]">
              <div className="flex h-[40px] w-[40px] items-center justify-center rounded-full bg-amber-50 text-[18px] text-amber-600">
                ☁️
              </div>
              <div>
                <h3 className="text-[14px] font-bold text-[var(--color-navy)]">
                  Sinkronisasi Storage S3
                </h3>
                <p className="text-[11px] text-[var(--color-muted)]">
                  Pencadangan berkas fisik terenkripsi.
                </p>
              </div>
            </div>
            <p className="mb-[20px] text-[11px] leading-relaxed text-[var(--color-text-main)]">
              Berkas fisik diarsipkan secara terdistribusi di dalam{" "}
              <strong>Cloud Object Storage (SeaweedFS)</strong>. Pencadangan
              (*backup*) dan pemulihan (*restore*) berkas fisik ini dikelola
              secara otomatis di tingkat server oleh Administrator Sistem
              menggunakan <code>aws s3 sync</code>.
            </p>
          </div>
          <div className="w-full cursor-not-allowed rounded-[8px] border border-gray-200 bg-gray-50 py-[10px] text-center text-[12px] font-bold text-gray-500">
            Dikelola oleh Sistem Otomatis (Cron Job)
          </div>
        </div>
      </div>
    </div>
  );
}

"use client";

import { useState } from "react";
import { api } from "~/trpc/react";
import { toast } from "sonner";

export default function RetentionManagementPage() {
  const { data: archivesList, isLoading } = api.archive.getArchives.useQuery();
  const ctx = api.useUtils();
  const [activeTab, setActiveTab] = useState<"pending" | "destroyed">(
    "pending",
  );

  const destroyMutation = api.archive.destroyArchive.useMutation({
    onSuccess: () => {
      toast.success("Arsip berhasil dimusnahkan. File fisik telah dihapus.");
      void ctx.archive.getArchives.invalidate();
    },
    onError: (err) => toast.error(err.message),
  });

  if (isLoading) {
    return (
      <div className="text-[12px] text-[var(--color-muted)]">
        Memuat data retensi...
      </div>
    );
  }

  // Engine Filter JRA
  const today = new Date();

  // 1. Arsip yang sudah lewat batas retensi TAPI belum dimusnahkan
  const pendingDestruction =
    archivesList?.filter((arc) => {
      if (arc.retentionStatus === "Dimusnahkan" || !arc.retentionDate)
        return false;
      return new Date(arc.retentionDate) < today;
    }) || [];

  // 2. Arsip yang sudah resmi dimusnahkan
  const destroyedHistory =
    archivesList?.filter((arc) => arc.retentionStatus === "Dimusnahkan") || [];

  const handleDestroy = (id: string, title: string) => {
    if (
      confirm(
        `PERINGATAN: Anda yakin ingin memusnahkan file fisik dari arsip "${title}"? Metadata akan tetap disimpan sebagai bukti sejarah.`,
      )
    ) {
      destroyMutation.mutate({ archiveId: id });
    }
  };

  return (
    <div className="space-y-[24px]">
      <div>
        <h2 className="text-[18px] font-bold text-[var(--color-navy)]">
          Penyusutan & Pemusnahan Arsip
        </h2>
        <p className="text-[12px] text-[var(--color-muted)]">
          Kelola arsip yang telah melewati Jadwal Retensi Arsip (JRA) untuk
          menghemat ruang penyimpanan server.
        </p>
      </div>

      {/* Navigasi Tab */}
      <div className="flex gap-[12px] border-b-[1.5px] border-[var(--color-border-main)] pb-[12px]">
        <button
          onClick={() => setActiveTab("pending")}
          className={`rounded-[8px] px-[16px] py-[8px] text-[12px] font-bold transition-colors ${activeTab === "pending" ? "border-[1.5px] border-red-200 bg-red-50 text-red-700" : "bg-transparent text-[var(--color-muted)] hover:bg-gray-100"}`}
        >
          🔴 Menunggu Pemusnahan ({pendingDestruction.length})
        </button>
        <button
          onClick={() => setActiveTab("destroyed")}
          className={`rounded-[8px] px-[16px] py-[8px] text-[12px] font-bold transition-colors ${activeTab === "destroyed" ? "bg-gray-800 text-white" : "bg-transparent text-[var(--color-muted)] hover:bg-gray-100"}`}
        >
          🗄️ Riwayat Pemusnahan ({destroyedHistory.length})
        </button>
      </div>

      {/* Tabel Data */}
      <div className="overflow-hidden rounded-[12px] border-[1.5px] border-[var(--color-border-main)] bg-white shadow-sm">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-[var(--color-border-main)] bg-[var(--color-off)] text-[11px] font-bold tracking-wider text-[var(--color-navy)] uppercase">
              <th className="p-[14px_16px]">Informasi Dokumen</th>
              <th className="p-[14px_16px]">Tgl Retensi Terlewati</th>
              <th className="p-[14px_16px]">Status</th>
              <th className="p-[14px_16px]">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {(activeTab === "pending" ? pendingDestruction : destroyedHistory)
              .length === 0 ? (
              <tr>
                <td
                  colSpan={4}
                  className="p-[40px] text-center text-[12px] text-gray-400 italic"
                >
                  Tidak ada data arsip di kategori ini.
                </td>
              </tr>
            ) : (
              (activeTab === "pending"
                ? pendingDestruction
                : destroyedHistory
              ).map((arc) => (
                <tr
                  key={arc.id}
                  className="border-b-[1.5px] border-[var(--color-border-main)] transition-colors last:border-0 hover:bg-gray-50"
                >
                  <td className="p-[14px_16px] align-top">
                    <span
                      className={`block text-[13px] font-bold ${activeTab === "destroyed" ? "text-gray-400 line-through" : "text-[var(--color-text-main)]"}`}
                    >
                      {arc.title}
                    </span>
                    <span className="mt-1 block text-[11px] text-[var(--color-muted)]">
                      No: {arc.nomorSurat || "-"} | Kategori: {arc.categoryId}
                    </span>
                  </td>
                  <td className="p-[14px_16px] align-top text-[12px] font-semibold text-red-600">
                    {arc.retentionDate
                      ? new Date(arc.retentionDate).toLocaleDateString(
                          "id-ID",
                          { day: "numeric", month: "long", year: "numeric" },
                        )
                      : "-"}
                  </td>
                  <td className="p-[14px_16px] align-top">
                    {activeTab === "pending" ? (
                      <span className="inline-block rounded-[6px] bg-red-100 px-[8px] py-[4px] text-[10px] font-bold text-red-700 uppercase">
                        Siap Dimusnahkan
                      </span>
                    ) : (
                      <span className="inline-block rounded-[6px] border border-gray-300 bg-gray-200 px-[8px] py-[4px] text-[10px] font-bold text-gray-600 uppercase">
                        Telah Dimusnahkan
                      </span>
                    )}
                  </td>
                  <td className="p-[14px_16px] align-top">
                    {activeTab === "pending" ? (
                      <button
                        onClick={() => handleDestroy(arc.id, arc.title)}
                        disabled={destroyMutation.isPending}
                        className="rounded-[6px] bg-red-600 px-[12px] py-[6px] text-[11px] font-bold text-white shadow-sm transition-colors hover:bg-red-700 disabled:opacity-50"
                      >
                        {destroyMutation.isPending
                          ? "Memproses..."
                          : "🔥 Musnahkan Fisik"}
                      </button>
                    ) : (
                      <span className="text-[11px] text-gray-400 italic">
                        Berkas Fisik Hilang
                      </span>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

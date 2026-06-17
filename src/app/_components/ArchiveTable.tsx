"use client";

import { api } from "~/trpc/react";
import type { RouterOutputs } from "~/trpc/react";
import { toast } from "sonner";

type Archive = RouterOutputs["archive"]["getArchives"][number];
type Classification = RouterOutputs["archive"]["getAllowedClassifications"];

interface ArchiveTableProps {
  archivesList?: Archive[];
  classification?: Classification;
  onEdit: (arc: Archive) => void;
  onShare: (arc: Archive) => void;
}

export function ArchiveTable({
  archivesList,
  classification,
  onEdit,
  onShare,
}: ArchiveTableProps) {
  const ctx = api.useUtils();
  const getFileAccessUrlMutation = api.archive.getFileAccessUrl.useMutation();
  const deleteArchiveMutation = api.archive.deleteArchive.useMutation({
    onSuccess: () => {
      toast.success("Arsip berhasil dihapus secara permanen.");
      void ctx.archive.getArchives.invalidate();
    },
  });

  const handleAccessFile = async (
    fileKey: string,
    originalName: string,
    action: "view" | "download",
  ) => {
    try {
      const toastId = toast.loading(
        action === "view" ? "Membuka..." : "Menyiapkan unduhan...",
      );
      const url = await getFileAccessUrlMutation.mutateAsync({
        fileKey,
        originalName,
        action,
      });
      toast.dismiss(toastId);
      if (action === "view") {
        window.open(url, "_blank");
      } else {
        const link = document.createElement("a");
        link.href = url;
        link.setAttribute("download", originalName);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
    } catch {
      toast.error("Akses ditolak atau file tidak ditemukan.");
    }
  };

  return (
    <div className="overflow-hidden rounded-[12px] border-[1.5px] border-[var(--color-border-main)] bg-white shadow-[0_2px_12px_rgba(13,27,62,0.12)]">
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-left">
          <thead>
            <tr className="border-b border-[var(--color-border-main)] bg-[var(--color-off)] text-[11px] font-bold tracking-wider text-[var(--color-navy)] uppercase">
              <th className="p-[14px_16px]">Informasi Dokumen</th>
              <th className="p-[14px_16px]">Klasifikasi & Retensi</th>
              <th className="p-[14px_16px]">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {archivesList?.length === 0 ? (
              <tr>
                <td
                  colSpan={3}
                  className="p-[40px] text-center text-[12px] text-[var(--color-muted)] italic"
                >
                  Tidak ada dokumen arsip yang cocok dengan kriteria pencarian.
                </td>
              </tr>
            ) : (
              archivesList?.map((arc) => {
                const actualExt = arc.fileKey.split(".").pop() || "pdf";
                const cleanFileName = `${arc.title}.${actualExt}`;
                const isExpired =
                  arc.retentionDate && new Date(arc.retentionDate) < new Date();

                const categoryObj = classification?.categories.find(
                  (c) => c.id === arc.categoryId,
                );
                const subcategoryObj = classification?.subcategories.find(
                  (s) => s.id === arc.subcategoryId,
                );

                return (
                  <tr
                    key={arc.id}
                    className="border-b border-[var(--color-border-main)] transition-colors last:border-0 hover:bg-blue-50/30"
                  >
                    <td className="p-[14px_16px] align-top">
                      <div className="flex gap-3">
                        <span className="mt-1 h-fit rounded-[6px] bg-blue-100 px-[8px] py-[4px] text-[10px] font-bold text-blue-700 uppercase">
                          {actualExt}
                        </span>
                        <div>
                          <div className="mb-1 flex items-center gap-2">
                            {/* 👇 Indikator Arsip Masuk / Keluar */}
                            <span
                              className={`inline-flex items-center rounded-sm px-[6px] py-[2px] text-[9px] font-bold tracking-wider uppercase ${arc.archiveType === "Masuk" ? "bg-blue-100 text-blue-700" : "bg-green-100 text-green-700"}`}
                            >
                              {arc.archiveType === "Masuk"
                                ? "📥 MASUK"
                                : "📤 KELUAR"}
                            </span>
                            <span className="block text-[13px] font-bold text-[var(--color-text-main)]">
                              {arc.title}
                            </span>
                          </div>

                          <span className="block text-[11px] text-[var(--color-muted)]">
                            Tgl:{" "}
                            {new Date(arc.createdAt).toLocaleDateString(
                              "id-ID",
                            )}{" "}
                            | No: {arc.nomorSurat || "-"}
                          </span>
                          {arc.description && (
                            <span className="mt-1 block text-[11px] text-[var(--color-muted)] italic">
                              "{arc.description}"
                            </span>
                          )}
                          <div className="mt-2 flex flex-wrap gap-2">
                            <span className="inline-block rounded-full border border-gray-200 bg-gray-50 px-[8px] py-[2px] text-[10px] font-semibold text-gray-600">
                              👤 {arc.uploaderName}
                            </span>
                            {arc.isShared && arc.shareConfig && (
                              <span
                                className="inline-block rounded-full border border-purple-200 bg-purple-50 px-[8px] py-[2px] text-[10px] font-semibold text-purple-700"
                                title="Arsip dapat diakses publik"
                              >
                                🔗 Passkey:{" "}
                                <span className="rounded border border-purple-100 bg-white px-1 font-mono">
                                  {arc.shareConfig.plainKey}
                                </span>
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="p-[14px_16px] align-top">
                      <span className="block text-[12px] font-bold text-[var(--color-navy)]">
                        {categoryObj?.icon || "📁"}{" "}
                        {categoryObj?.name || arc.categoryId}
                      </span>
                      <span className="mt-0.5 block pl-[14px] text-[11px] font-medium text-[var(--color-text-main)]">
                        └─ {subcategoryObj?.name || arc.subcategoryId}
                      </span>

                      <div className="mt-3 pl-[14px]">
                        {arc.retentionDate ? (
                          <span
                            className={`inline-block rounded-[6px] px-[8px] py-[3px] text-[9px] font-bold tracking-wider uppercase ${isExpired ? "bg-red-100 text-red-700" : "bg-green-100 text-green-700"}`}
                          >
                            {isExpired
                              ? "🔴 Retensi Kedaluwarsa"
                              : "🟢 Retensi Aktif"}
                          </span>
                        ) : (
                          <span className="inline-block rounded-[6px] bg-gray-100 px-[8px] py-[3px] text-[9px] font-bold tracking-wider text-gray-600 uppercase">
                            ⚪ Permanen
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="p-[14px_16px] align-top">
                      <div className="flex gap-2">
                        <button
                          onClick={() =>
                            handleAccessFile(arc.fileKey, cleanFileName, "view")
                          }
                          className="rounded-[6px] bg-blue-50 p-[6px] text-blue-600 transition-colors hover:bg-blue-100 hover:text-blue-700"
                          title="Lihat"
                        >
                          👁️
                        </button>
                        <button
                          onClick={() =>
                            handleAccessFile(
                              arc.fileKey,
                              cleanFileName,
                              "download",
                            )
                          }
                          className="rounded-[6px] bg-green-50 p-[6px] text-green-600 transition-colors hover:bg-green-100 hover:text-green-700"
                          title="Unduh"
                        >
                          ⬇️
                        </button>
                        <button
                          onClick={() => onShare(arc)}
                          className={`rounded-[6px] p-[6px] transition-colors ${arc.isShared ? "bg-purple-100 text-purple-700 hover:bg-purple-200" : "bg-purple-50 text-purple-600 hover:bg-purple-100"}`}
                          title={
                            arc.isShared
                              ? "Kelola Tautan Publik"
                              : "Bagikan ke Publik"
                          }
                        >
                          🔗
                        </button>
                        <button
                          onClick={() => onEdit(arc)}
                          className="rounded-[6px] bg-amber-50 p-[6px] text-amber-600 transition-colors hover:bg-amber-100 hover:text-amber-700"
                          title="Edit"
                        >
                          ✏️
                        </button>
                        <button
                          onClick={() => {
                            if (
                              confirm("Hapus permanen arsip dan file fisiknya?")
                            )
                              deleteArchiveMutation.mutate({
                                id: arc.id,
                                fileKey: arc.fileKey,
                              });
                          }}
                          className="rounded-[6px] bg-red-50 p-[6px] text-red-600 transition-colors hover:bg-red-100 hover:text-red-700"
                          title="Hapus"
                        >
                          🗑️
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

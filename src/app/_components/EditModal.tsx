"use client";

import { api } from "~/trpc/react";
import type { RouterOutputs } from "~/trpc/react";
import { toast } from "sonner";

type Archive = RouterOutputs["archive"]["getArchives"][number];

interface EditModalProps {
  editData: Archive;
  setEditData: (data: Archive) => void;
  onClose: () => void;
}

// 👇 Fungsi pembantu untuk memformat objek Date menjadi string YYYY-MM-DD lokal secara presisi
function getLocalYYYYMMDD(d: Date) {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

export function EditModal({ editData, setEditData, onClose }: EditModalProps) {
  const ctx = api.useUtils();
  const updateArchiveMutation = api.archive.updateArchive.useMutation({
    onSuccess: () => {
      toast.success("Data arsip berhasil diperbarui.");
      void ctx.archive.getArchives.invalidate();
      onClose();
    },
  });

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateArchiveMutation.mutate({
      id: editData.id,
      title: editData.title,
      archiveType: editData.archiveType,
      description: editData.description || undefined,
      nomorSurat: editData.nomorSurat || undefined,
      createdAt: editData.createdAt ? new Date(editData.createdAt) : undefined,
      retentionDate: editData.retentionDate
        ? new Date(editData.retentionDate)
        : null,
    });
  };

  // Handler fungsi tombol preset cepat JRA
  const handleApplyPresetInEdit = (years: number | "permanent") => {
    const baseDate = editData.createdAt
      ? new Date(editData.createdAt)
      : new Date();
    if (years === "permanent") {
      setEditData({ ...editData, retentionDate: null });
    } else {
      const newDate = new Date(baseDate);
      newDate.setFullYear(newDate.getFullYear() + years);
      setEditData({ ...editData, retentionDate: newDate });
    }
  };

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/45 backdrop-blur-sm">
      <div className="animate-in fade-in zoom-in w-[420px] rounded-[14px] bg-white p-[24px] shadow-[0_20px_60px_rgba(0,0,0,0.3)] duration-200">
        <h2 className="mb-[16px] text-[16px] font-bold text-[var(--color-navy)]">
          ✏️ Edit Metadata Arsip
        </h2>
        <form onSubmit={handleEditSubmit}>
          <div className="mb-[12px]">
            <label className="mb-[4px] block text-[11px] font-semibold text-[var(--color-navy)]">
              Nama Dokumen
            </label>
            <input
              type="text"
              required
              value={editData.title}
              onChange={(e) =>
                setEditData({ ...editData, title: e.target.value })
              }
              className="w-full rounded-[7px] border-[1.5px] border-[var(--color-border-main)] p-[9px_12px] text-[12px] transition-colors outline-none focus:border-[var(--color-accent)]"
            />
          </div>

          <div className="mb-[12px]">
            <label className="mb-[4px] block text-[11px] font-semibold text-[var(--color-navy)]">
              Alur Dokumen
            </label>
            <div className="flex gap-[10px]">
              <button
                type="button"
                onClick={() =>
                  setEditData({ ...editData, archiveType: "Masuk" })
                }
                className={`flex-1 rounded-[7px] border py-[6px] text-[11px] font-bold transition-colors ${editData.archiveType === "Masuk" ? "border-blue-300 bg-blue-50 text-blue-700" : "border-gray-200 bg-white text-gray-500 hover:bg-gray-50"}`}
              >
                📥 Arsip Masuk
              </button>
              <button
                type="button"
                onClick={() =>
                  setEditData({ ...editData, archiveType: "Keluar" })
                }
                className={`flex-1 rounded-[7px] border py-[6px] text-[11px] font-bold transition-colors ${editData.archiveType === "Keluar" ? "border-green-300 bg-green-50 text-green-700" : "border-gray-200 bg-white text-gray-500 hover:bg-gray-50"}`}
              >
                📤 Arsip Keluar
              </button>
            </div>
          </div>

          <div className="mb-[12px]">
            <label className="mb-[4px] block text-[11px] font-semibold text-[var(--color-navy)]">
              Nomor Surat
            </label>
            <input
              type="text"
              value={editData.nomorSurat || ""}
              onChange={(e) =>
                setEditData({ ...editData, nomorSurat: e.target.value })
              }
              className="w-full rounded-[7px] border-[1.5px] border-[var(--color-border-main)] p-[9px_12px] text-[12px] transition-colors outline-none focus:border-[var(--color-accent)]"
            />
          </div>
          <div className="mb-[12px]">
            <label className="mb-[4px] block text-[11px] font-semibold text-[var(--color-navy)]">
              Deskripsi
            </label>
            <textarea
              value={editData.description || ""}
              onChange={(e) =>
                setEditData({ ...editData, description: e.target.value })
              }
              rows={2}
              className="w-full resize-none rounded-[7px] border-[1.5px] border-[var(--color-border-main)] p-[9px_12px] text-[12px] transition-colors outline-none focus:border-[var(--color-accent)]"
            />
          </div>
          <div className="mb-[12px]">
            <label className="mb-[4px] block text-[11px] font-semibold text-[var(--color-navy)]">
              Tanggal Dibuat
            </label>
            <input
              type="date"
              value={
                editData.createdAt
                  ? getLocalYYYYMMDD(new Date(editData.createdAt))
                  : ""
              }
              onChange={(e) => {
                const newCreatedDate = new Date(e.target.value);
                // 👇 OTOMATIS: JRA langsung disesuaikan maju +5 tahun mengikuti perubahan Tanggal Dibuat
                const newRetention = new Date(newCreatedDate);
                newRetention.setFullYear(newRetention.getFullYear() + 5);
                setEditData({
                  ...editData,
                  createdAt: newCreatedDate,
                  retentionDate: newRetention,
                });
              }}
              className="w-full rounded-[7px] border-[1.5px] border-[var(--color-border-main)] p-[9px_12px] text-[12px] transition-colors outline-none focus:border-[var(--color-accent)]"
            />
          </div>
          <div className="mb-[12px]">
            <label className="mb-[4px] block text-[11px] font-semibold text-[var(--color-navy)]">
              Tanggal Retensi (JRA)
            </label>
            <input
              type="date"
              value={
                editData.retentionDate
                  ? getLocalYYYYMMDD(new Date(editData.retentionDate))
                  : ""
              }
              onChange={(e) =>
                setEditData({
                  ...editData,
                  retentionDate: e.target.value
                    ? new Date(e.target.value)
                    : null,
                })
              }
              className="w-full rounded-[7px] border-[1.5px] border-[var(--color-border-main)] p-[9px_12px] text-[12px] transition-colors outline-none focus:border-[var(--color-accent)]"
            />

            {/* Tombol Preset Modifikasi Cepat */}
            <div className="mt-2 flex gap-1.5">
              <button
                type="button"
                onClick={() => handleApplyPresetInEdit(5)}
                className="rounded-[4px] border border-blue-100 bg-blue-50 px-2 py-1 text-[10px] font-bold text-blue-700 transition-colors hover:bg-blue-100"
              >
                ⏱️ 5 Tahun
              </button>
              <button
                type="button"
                onClick={() => handleApplyPresetInEdit(10)}
                className="rounded-[4px] border border-amber-100 bg-amber-50 px-2 py-1 text-[10px] font-bold text-amber-700 transition-colors hover:bg-amber-100"
              >
                ⏱️ 10 Tahun
              </button>
              <button
                type="button"
                onClick={() => handleApplyPresetInEdit("permanent")}
                className="rounded-[4px] border border-purple-100 bg-purple-50 px-2 py-1 text-[10px] font-bold text-purple-700 transition-colors hover:bg-purple-100"
              >
                ♾️ Permanen
              </button>
            </div>
          </div>
          <div className="mt-[24px] flex justify-end gap-[10px] border-t border-[var(--color-border-main)] pt-[16px]">
            <button
              type="button"
              onClick={onClose}
              className="rounded-[7px] border-[1.5px] border-[var(--color-border-main)] bg-[var(--color-off)] px-[14px] py-[7px] text-[12px] font-semibold text-[var(--color-text-main)] transition-colors hover:bg-gray-100"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={updateArchiveMutation.isPending}
              className="rounded-[7px] bg-[var(--color-accent)] px-[14px] py-[7px] text-[12px] font-semibold text-white transition-colors hover:bg-[var(--color-accent2)] disabled:opacity-70"
            >
              {updateArchiveMutation.isPending
                ? "Menyimpan..."
                : "Simpan Perubahan"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

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
      description: editData.description || undefined,
      nomorSurat: editData.nomorSurat || undefined, // 👈 Diperbaiki
      createdAt: editData.createdAt ? new Date(editData.createdAt) : undefined,
      retentionDate: editData.retentionDate
        ? new Date(editData.retentionDate)
        : undefined,
    });
  };

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/45">
      <div className="animate-in fade-in zoom-in w-[420px] rounded-[14px] bg-white p-[28px] shadow-[0_20px_60px_rgba(0,0,0,0.3)] duration-200">
        <h3 className="mb-[20px] text-[16px] font-bold text-[var(--color-navy)]">
          Edit Metadata Arsip
        </h3>
        <form onSubmit={handleEditSubmit}>
          <div className="mb-[14px]">
            <label className="mb-[4px] block text-[11px] font-semibold text-[var(--color-navy)]">
              Judul Arsip
            </label>
            <input
              type="text"
              value={editData.title}
              onChange={(e) =>
                setEditData({ ...editData, title: e.target.value })
              }
              required
              className="w-full rounded-[7px] border-[1.5px] border-[var(--color-border-main)] p-[9px_12px] text-[12px] transition-colors outline-none focus:border-[var(--color-accent)]"
            />
          </div>
          <div className="mb-[14px]">
            <label className="mb-[4px] block text-[11px] font-semibold text-[var(--color-navy)]">
              Nomor Surat
            </label>
            {/* 👇 Diperbaiki menggunakan nomorSurat */}
            <input
              type="text"
              value={editData.nomorSurat || ""}
              onChange={(e) =>
                setEditData({ ...editData, nomorSurat: e.target.value })
              }
              className="w-full rounded-[7px] border-[1.5px] border-[var(--color-border-main)] p-[9px_12px] text-[12px] transition-colors outline-none focus:border-[var(--color-accent)]"
            />
          </div>
          <div className="mb-[14px]">
            <label className="mb-[4px] block text-[11px] font-semibold text-[var(--color-navy)]">
              Tgl Retensi
            </label>
            <input
              type="date"
              value={
                editData.retentionDate
                  ? new Date(editData.retentionDate).toISOString().split("T")[0]
                  : ""
              }
              onChange={(e) =>
                setEditData({
                  ...editData,
                  retentionDate: new Date(e.target.value),
                })
              }
              className="w-full rounded-[7px] border-[1.5px] border-[var(--color-border-main)] p-[9px_12px] text-[12px] transition-colors outline-none focus:border-[var(--color-accent)]"
            />
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

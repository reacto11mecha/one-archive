"use client";

import { useState, useRef } from "react";
import { api } from "~/trpc/react";
import type { RouterOutputs } from "~/trpc/react";
import { toast } from "sonner";

type Classification = RouterOutputs["archive"]["getAllowedClassifications"];

interface UploadFormProps {
  classification?: Classification;
  onSuccess: () => void;
  onCancel: () => void;
}

export function UploadForm({
  classification,
  onSuccess,
  onCancel,
}: UploadFormProps) {
  const ctx = api.useUtils();
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedSubcategory, setSelectedSubcategory] = useState("");
  const [selectedDocType, setSelectedDocType] = useState("");

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [nomorSurat, setNomorSurat] = useState("");
  const [documentDate, setDocumentDate] = useState("");
  const [retentionDate, setRetentionDate] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const getUploadUrlMutation = api.archive.getUploadUrl.useMutation();
  const createArchiveMutation = api.archive.createArchive.useMutation({
    onSuccess: () => {
      toast.success("Berkas berhasil diarsipkan!");
      void ctx.archive.getArchives.invalidate();
      onSuccess();
    },
    onError: (err) =>
      toast.error(err.message || "Gagal menyimpan metadata arsip."),
  });

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (selected) {
      if (selected.size > 10 * 1024 * 1024)
        return toast.warning("Maksimal 10MB!");
      setFile(selected);
      if (!title) setTitle(selected.name.replace(/\.[^/.]+$/, ""));
    }
  };

  const handleUploadSubmit = async () => {
    if (!selectedDocType) return toast.warning("Pilih jenis dokumen.");
    if (!title || !file) return toast.warning("Judul dan berkas wajib diisi.");

    setIsUploading(true);
    const loadingToast = toast.loading("Mengunggah berkas...");

    try {
      const { uploadUrl, fileKey } = await getUploadUrlMutation.mutateAsync({
        fileName: file.name,
        fileType: file.type,
      });
      const uploadResponse = await fetch(uploadUrl, {
        method: "PUT",
        body: file,
        headers: { "Content-Type": file.type },
      });
      if (!uploadResponse.ok) throw new Error("Gagal mengunggah berkas.");

      toast.loading("Menyimpan ke database...", { id: loadingToast });
      await createArchiveMutation.mutateAsync({
        title,
        categoryId: selectedCategory,
        subcategoryId: selectedSubcategory,
        documentTypeId: selectedDocType,
        fileKey,
        originalName: file.name,
        mimeType: file.type,
        description: description || undefined,
        nomorSurat: nomorSurat || undefined, // 👈 Disesuaikan
        createdAt: documentDate ? new Date(documentDate) : undefined,
        retentionDate: retentionDate ? new Date(retentionDate) : undefined,
      });
      toast.dismiss(loadingToast);
    } catch (error) {
      toast.dismiss(loadingToast);
      toast.error(
        error instanceof Error ? error.message : "Terjadi kesalahan.",
      );
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="rounded-[12px] border-[1.5px] border-[var(--color-border-main)] bg-white p-[24px] shadow-[0_2px_12px_rgba(13,27,62,0.12)]">
      <div className="mb-[24px] grid grid-cols-1 gap-[16px] md:grid-cols-3">
        <div>
          <label className="mb-[6px] block text-[11px] font-semibold text-[var(--color-navy)]">
            Kategori Utama
          </label>
          <select
            value={selectedCategory}
            onChange={(e) => {
              setSelectedCategory(e.target.value);
              setSelectedSubcategory("");
              setSelectedDocType("");
            }}
            className="w-full rounded-[7px] border-[1.5px] border-[var(--color-border-main)] p-[9px_12px] text-[12px] transition-colors outline-none focus:border-[var(--color-accent)]"
          >
            <option value="">-- Pilih --</option>
            {classification?.categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.icon} {cat.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-[6px] block text-[11px] font-semibold text-[var(--color-navy)]">
            Sub-Kategori
          </label>
          <select
            value={selectedSubcategory}
            onChange={(e) => {
              setSelectedSubcategory(e.target.value);
              setSelectedDocType("");
            }}
            disabled={!selectedCategory}
            className="w-full rounded-[7px] border-[1.5px] border-[var(--color-border-main)] p-[9px_12px] text-[12px] transition-colors outline-none focus:border-[var(--color-accent)] disabled:bg-gray-50"
          >
            <option value="">-- Pilih --</option>
            {classification?.subcategories
              .filter((s) => s.categoryId === selectedCategory)
              .map((sub) => (
                <option key={sub.id} value={sub.id}>
                  🔹 {sub.name}
                </option>
              ))}
          </select>
        </div>
        <div>
          <label className="mb-[6px] block text-[11px] font-semibold text-[var(--color-navy)]">
            Jenis Surat
          </label>
          <select
            value={selectedDocType}
            onChange={(e) => setSelectedDocType(e.target.value)}
            disabled={!selectedSubcategory}
            className="w-full rounded-[7px] border-[1.5px] border-[var(--color-border-main)] p-[9px_12px] text-[12px] transition-colors outline-none focus:border-[var(--color-accent)] disabled:bg-gray-50"
          >
            <option value="">-- Pilih --</option>
            {classification?.documentTypes
              .filter((d) => d.subcategoryId === selectedSubcategory)
              .map((doc) => (
                <option key={doc.id} value={doc.id}>
                  📄 {doc.name}
                </option>
              ))}
          </select>
        </div>
      </div>

      {selectedDocType && (
        <div className="animate-in fade-in border-t border-dashed border-[var(--color-border-main)] pt-[20px]">
          <div className="mb-[16px] grid grid-cols-1 gap-[16px] md:grid-cols-2">
            <div>
              <label className="mb-[6px] block text-[11px] font-semibold text-[var(--color-navy)]">
                Judul Arsip (Wajib)
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full rounded-[7px] border-[1.5px] border-[var(--color-border-main)] p-[9px_12px] text-[12px] outline-none focus:border-[var(--color-accent)]"
              />
            </div>
            <div>
              <label className="mb-[6px] block text-[11px] font-semibold text-[var(--color-navy)]">
                Nomor Surat (Opsional)
              </label>
              <input
                type="text"
                value={nomorSurat}
                onChange={(e) => setNomorSurat(e.target.value)}
                className="w-full rounded-[7px] border-[1.5px] border-[var(--color-border-main)] p-[9px_12px] text-[12px] outline-none focus:border-[var(--color-accent)]"
              />
            </div>
          </div>
          <div className="mb-[16px] grid grid-cols-1 gap-[16px] md:grid-cols-3">
            <div>
              <label className="mb-[6px] block text-[11px] font-semibold text-[var(--color-navy)]">
                Tgl Surat (Opsional)
              </label>
              <input
                type="date"
                value={documentDate}
                onChange={(e) => setDocumentDate(e.target.value)}
                className="w-full rounded-[7px] border-[1.5px] border-[var(--color-border-main)] p-[9px_12px] text-[12px] outline-none focus:border-[var(--color-accent)]"
              />
            </div>
            <div>
              <label className="mb-[6px] block text-[11px] font-semibold text-[var(--color-navy)]">
                Tgl Retensi / Kedaluwarsa
              </label>
              <input
                type="date"
                value={retentionDate}
                onChange={(e) => setRetentionDate(e.target.value)}
                className="w-full rounded-[7px] border-[1.5px] border-amber-300 bg-amber-50/50 p-[9px_12px] text-[12px] outline-none focus:border-amber-500"
              />
            </div>
            <div>
              <label className="mb-[6px] block text-[11px] font-semibold text-[var(--color-navy)]">
                Catatan Singkat
              </label>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full rounded-[7px] border-[1.5px] border-[var(--color-border-main)] p-[9px_12px] text-[12px] outline-none focus:border-[var(--color-accent)]"
              />
            </div>
          </div>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileSelect}
            className="hidden"
          />
          {!file ? (
            <div
              onClick={() => fileInputRef.current?.click()}
              className="cursor-pointer rounded-[10px] border-2 border-dashed border-[var(--color-border-main)] bg-[var(--color-off)] p-[24px] text-center transition-colors hover:border-[var(--color-accent)] hover:bg-blue-50/50"
            >
              <span className="text-[13px] font-semibold text-[var(--color-muted)]">
                📄 Klik atau seret berkas ke sini
              </span>
            </div>
          ) : (
            <div className="flex items-center justify-between rounded-[10px] border-[1.5px] border-blue-200 bg-blue-50/50 p-4">
              <span className="text-[12px] font-bold text-[var(--color-navy)]">
                {file.name}
              </span>
              <button
                onClick={handleUploadSubmit}
                disabled={isUploading}
                className="rounded-[8px] bg-[var(--color-accent)] px-[16px] py-[8px] text-[12px] font-bold text-white transition-colors hover:bg-[var(--color-accent2)] disabled:opacity-70"
              >
                {isUploading ? "Mengunggah..." : "Mulai Unggah"}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

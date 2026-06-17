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

// 👇 Fungsi pembantu untuk mencegah bug pergeseran tanggal akibat zona waktu UTC
function getLocalYYYYMMDD(d: Date) {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

export function UploadForm({
  classification,
  onSuccess,
  onCancel,
}: UploadFormProps) {
  const ctx = api.useUtils();

  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedSubcategory, setSelectedSubcategory] = useState("");
  const [archiveType, setArchiveType] = useState<"Masuk" | "Keluar">("Masuk");

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [nomorSurat, setNomorSurat] = useState("");

  // 👇 INISIALISASI LANGSUNG: Tanggal Dibuat = Hari Ini, JRA = Hari Ini + 5 Tahun
  const [documentDate, setDocumentDate] = useState(() =>
    getLocalYYYYMMDD(new Date()),
  );
  const [retentionDate, setRetentionDate] = useState(() => {
    const d = new Date();
    d.setFullYear(d.getFullYear() + 5);
    return getLocalYYYYMMDD(d);
  });

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
    onError: (err) => toast.error(err.message || "Gagal menyimpan arsip."),
  });

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      setFile(selectedFile);

      // Otomatis isi judul dari nama file jika masih kosong
      if (!title) {
        const fileNameWithoutExt = selectedFile.name.replace(/\.[^/.]+$/, "");
        setTitle(fileNameWithoutExt);
      }
    }
  };

  // Tetap pertahankan auto-sync jika pengguna mengubah tanggal dibuat secara manual
  const handleDocumentDateChange = (dateVal: string) => {
    setDocumentDate(dateVal);
    if (dateVal) {
      const baseDate = new Date(dateVal);
      baseDate.setFullYear(baseDate.getFullYear() + 5);
      setRetentionDate(getLocalYYYYMMDD(baseDate));
    }
  };

  const applyRetentionPreset = (years: number | "permanent") => {
    const baseDate = documentDate ? new Date(documentDate) : new Date();
    if (years === "permanent") {
      setRetentionDate("");
    } else {
      baseDate.setFullYear(baseDate.getFullYear() + years);
      setRetentionDate(getLocalYYYYMMDD(baseDate));
    }
  };

  const handleUploadSubmit = async () => {
    if (!file || !title || !selectedCategory || !selectedSubcategory) {
      toast.warning("Mohon lengkapi formulir dan pilih file.");
      return;
    }

    setIsUploading(true);
    const toastId = toast.loading("Mengunggah berkas fisik...");

    try {
      const { uploadUrl, fileKey } = await getUploadUrlMutation.mutateAsync({
        fileName: file.name,
        fileType: file.type,
      });

      const uploadRes = await fetch(uploadUrl, {
        method: "PUT",
        body: file,
        headers: { "Content-Type": file.type },
      });

      if (!uploadRes.ok) throw new Error("Gagal mengunggah ke S3");
      toast.loading("Menyimpan metadata arsip...", { id: toastId });

      await createArchiveMutation.mutateAsync({
        title,
        categoryId: selectedCategory,
        subcategoryId: selectedSubcategory,
        archiveType,
        fileKey,
        originalName: file.name,
        mimeType: file.type,
        description: description || undefined,
        nomorSurat: nomorSurat || undefined,
        createdAt: documentDate ? new Date(documentDate) : undefined,
        retentionDate: retentionDate ? new Date(retentionDate) : undefined,
      });

      toast.dismiss(toastId);
    } catch (error) {
      toast.error("Terjadi kesalahan sistem saat mengunggah", { id: toastId });
    } finally {
      setIsUploading(false);
    }
  };

  const filteredSubcategories =
    classification?.subcategories.filter(
      (sub) => sub.categoryId === selectedCategory,
    ) || [];

  return (
    <div className="flex flex-col gap-[20px]">
      <div className="grid grid-cols-1 gap-[20px] md:grid-cols-2">
        <div className="space-y-[16px]">
          <div>
            <label className="mb-[6px] block text-[11px] font-semibold text-[var(--color-navy)]">
              Nama / Judul Dokumen <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Contoh: Rencana Anggaran 2026"
              className="w-full rounded-[7px] border-[1.5px] border-[var(--color-border-main)] p-[9px_12px] text-[12px] transition-colors outline-none focus:border-[var(--color-accent)]"
            />
          </div>
          <div>
            <label className="mb-[6px] block text-[11px] font-semibold text-[var(--color-navy)]">
              Nomor Surat{" "}
              <span className="font-normal text-gray-400">(Opsional)</span>
            </label>
            <input
              type="text"
              value={nomorSurat}
              onChange={(e) => setNomorSurat(e.target.value)}
              placeholder="Contoh: 123/TU/SMA/2026"
              className="w-full rounded-[7px] border-[1.5px] border-[var(--color-border-main)] p-[9px_12px] text-[12px] transition-colors outline-none focus:border-[var(--color-accent)]"
            />
          </div>
          <div>
            <label className="mb-[6px] block text-[11px] font-semibold text-[var(--color-navy)]">
              Deskripsi Singkat
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              placeholder="Tambahkan catatan khusus terkait dokumen ini..."
              className="w-full resize-none rounded-[7px] border-[1.5px] border-[var(--color-border-main)] p-[9px_12px] text-[12px] transition-colors outline-none focus:border-[var(--color-accent)]"
            />
          </div>
        </div>

        <div className="space-y-[16px]">
          <div>
            <label className="mb-[6px] block text-[11px] font-semibold text-[var(--color-navy)]">
              Kategori Utama <span className="text-red-500">*</span>
            </label>
            <select
              value={selectedCategory}
              onChange={(e) => {
                setSelectedCategory(e.target.value);
                setSelectedSubcategory("");
              }}
              className="w-full rounded-[7px] border-[1.5px] border-[var(--color-border-main)] p-[9px_12px] text-[12px] transition-colors outline-none focus:border-[var(--color-accent)]"
            >
              <option value="" disabled>
                -- Pilih Kategori Utama --
              </option>
              {classification?.categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.icon} {cat.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-[6px] block text-[11px] font-semibold text-[var(--color-navy)]">
              Sub-Kategori <span className="text-red-500">*</span>
            </label>
            <select
              value={selectedSubcategory}
              onChange={(e) => setSelectedSubcategory(e.target.value)}
              disabled={!selectedCategory}
              className="w-full rounded-[7px] border-[1.5px] border-[var(--color-border-main)] p-[9px_12px] text-[12px] transition-colors outline-none focus:border-[var(--color-accent)] disabled:cursor-not-allowed disabled:bg-gray-100"
            >
              <option value="" disabled>
                -- Pilih Sub-Kategori --
              </option>
              {filteredSubcategories.map((sub) => (
                <option key={sub.id} value={sub.id}>
                  {sub.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-[6px] block text-[11px] font-semibold text-[var(--color-navy)]">
              Alur Dokumen <span className="text-red-500">*</span>
            </label>
            <div className="flex gap-[10px]">
              <button
                type="button"
                onClick={() => setArchiveType("Masuk")}
                className={`flex-1 rounded-[7px] border py-[8px] text-[12px] font-bold transition-colors ${archiveType === "Masuk" ? "border-blue-300 bg-blue-50 text-blue-700" : "border-gray-200 bg-white text-gray-500 hover:bg-gray-50"}`}
              >
                📥 Arsip Masuk
              </button>
              <button
                type="button"
                onClick={() => setArchiveType("Keluar")}
                className={`flex-1 rounded-[7px] border py-[8px] text-[12px] font-bold transition-colors ${archiveType === "Keluar" ? "border-green-300 bg-green-50 text-green-700" : "border-gray-200 bg-white text-gray-500 hover:bg-gray-50"}`}
              >
                📤 Arsip Keluar
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-[10px]">
            <div>
              <label className="mb-[6px] block text-[11px] font-semibold text-[var(--color-navy)]">
                Tgl Dibuat
              </label>
              <input
                type="date"
                value={documentDate}
                onChange={(e) => handleDocumentDateChange(e.target.value)}
                className="w-full rounded-[7px] border-[1.5px] border-[var(--color-border-main)] p-[9px_12px] text-[12px] outline-none focus:border-[var(--color-accent)]"
              />
            </div>
            <div>
              <label className="mb-[6px] block text-[11px] font-semibold text-[var(--color-navy)]">
                Tgl Kedaluwarsa (JRA)
              </label>
              <input
                type="date"
                value={retentionDate}
                onChange={(e) => setRetentionDate(e.target.value)}
                placeholder="Permanen"
                className="w-full rounded-[7px] border-[1.5px] border-[var(--color-border-main)] p-[9px_12px] text-[12px] outline-none focus:border-[var(--color-accent)] disabled:bg-gray-50"
              />

              <div className="mt-2 flex flex-wrap gap-1">
                <button
                  type="button"
                  onClick={() => applyRetentionPreset(5)}
                  className="rounded-[4px] border border-blue-100 bg-blue-50 p-[3px_6px] text-[9px] font-bold text-blue-700 transition-colors hover:bg-blue-100"
                >
                  ⏱️ 5 Thn (Def)
                </button>
                <button
                  type="button"
                  onClick={() => applyRetentionPreset(10)}
                  className="rounded-[4px] border border-amber-100 bg-amber-50 p-[3px_6px] text-[9px] font-bold text-amber-700 transition-colors hover:bg-amber-100"
                >
                  ⏱️ 10 Thn
                </button>
                <button
                  type="button"
                  onClick={() => applyRetentionPreset("permanent")}
                  className="rounded-[4px] border border-purple-100 bg-purple-50 p-[3px_6px] text-[9px] font-bold text-purple-700 transition-colors hover:bg-purple-100"
                >
                  ♾️ Permanen
                </button>
              </div>
            </div>
          </div>
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
            📁 Klik atau seret berkas ke sini
          </span>
        </div>
      ) : (
        <div className="flex items-center justify-between rounded-[10px] border-[1.5px] border-blue-200 bg-blue-50/50 p-4">
          <span className="max-w-[240px] truncate text-[12px] font-bold text-[var(--color-navy)]">
            {file.name}
          </span>
          <div className="flex gap-[10px]">
            <button
              type="button"
              onClick={() => setFile(null)}
              className="rounded-[8px] border border-gray-300 bg-white px-[16px] py-[8px] text-[12px] font-bold text-gray-600 hover:bg-gray-50"
            >
              Batal
            </button>
            <button
              type="button"
              onClick={handleUploadSubmit}
              disabled={isUploading}
              className="rounded-[8px] bg-[var(--color-accent)] px-[16px] py-[8px] text-[12px] font-bold text-white transition-colors hover:bg-[var(--color-accent2)] disabled:opacity-70"
            >
              {isUploading ? "Mengunggah..." : "Mulai Unggah"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

"use client";

import { useState } from "react";
import { api } from "~/trpc/react";
import { toast } from "sonner";

type ModalType = "NONE" | "CATEGORY" | "SUBCATEGORY" | "DOCTYPE";

export default function ClassificationManagementPage() {
  const ctx = api.useUtils();
  const { data, isLoading } = api.system.getClassificationData.useQuery();

  // State Kontrol Modal & Form
  const [modalType, setModalType] = useState<ModalType>("NONE");
  const [selectedParentId, setSelectedParentId] = useState("");
  const [inputName, setInputName] = useState("");
  const [inputIcon, setInputIcon] = useState("📁");

  // Mutasi dengan Notifikasi Sonner
  const createCategoryMutation = api.system.createCategory.useMutation({
    onSuccess: () => handleSuccess("Kategori utama berhasil ditambahkan!"),
    onError: (err) => toast.error(err.message),
  });

  const createSubcategoryMutation = api.system.createSubcategory.useMutation({
    onSuccess: () => handleSuccess("Sub-kategori berhasil disisipkan!"),
    onError: (err) => toast.error(err.message),
  });

  const createDocTypeMutation = api.system.createDocumentType.useMutation({
    onSuccess: () => handleSuccess("Jenis dokumen baru berhasil didaftarkan!"),
    onError: (err) => toast.error(err.message),
  });

  const deleteMutation = api.system.deleteClassificationItem.useMutation({
    onSuccess: () => {
      toast.success("Komponen berhasil dihapus!");
      void ctx.system.getClassificationData.invalidate();
    },
    onError: (err) =>
      toast.error("Gagal menghapus. Pastikan tidak ada data turunan terikat."),
  });

  const handleSuccess = (message: string) => {
    toast.success(message);
    setModalType("NONE");
    setInputName("");
    setInputIcon("📁");
    setSelectedParentId("");
    void ctx.system.getClassificationData.invalidate();
  };

  const generateSlug = (text: string, prefix: string) => {
    const slug = text
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "_")
      .replace(/(^_|_$)/g, "");
    return `${prefix}_${slug}`;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputName.trim())
      return toast.warning("Nama input tidak boleh kosong.");

    if (modalType === "CATEGORY") {
      createCategoryMutation.mutate({
        id: generateSlug(inputName, "cat"),
        name: inputName,
        icon: inputIcon,
      });
    } else if (modalType === "SUBCATEGORY") {
      createSubcategoryMutation.mutate({
        id: generateSlug(inputName, "sub"),
        categoryId: selectedParentId,
        name: inputName,
      });
    } else if (modalType === "DOCTYPE") {
      createDocTypeMutation.mutate({
        id: generateSlug(inputName, "doc"),
        subcategoryId: selectedParentId,
        name: inputName,
      });
    }
  };

  if (isLoading) {
    return (
      <div className="text-[12px] text-[var(--color-muted)]">
        Memuat struktur klasifikasi...
      </div>
    );
  }

  return (
    <div className="relative space-y-4">
      <div className="mb-[16px] flex items-center justify-between">
        <h3 className="text-[14px] font-bold text-[var(--color-navy)]">
          Struktur Klasifikasi Dokumen
        </h3>
        <button
          onClick={() => setModalType("CATEGORY")}
          className="inline-flex cursor-pointer items-center gap-[5px] rounded-[7px] bg-[var(--color-accent)] px-[14px] py-[7px] text-[12px] font-semibold text-white transition-colors hover:bg-[var(--color-accent2)]"
        >
          + Kategori Utama
        </button>
      </div>

      {/* Arsitektur Komponen Tingkat 1: Kategori Utama */}
      <div className="space-y-[16px]">
        {data?.categories.map((cat) => {
          const matchedSubs = data.subcategories.filter(
            (s) => s.categoryId === cat.id,
          );

          return (
            <div
              key={cat.id}
              className="rounded-[10px] border-[1.5px] border-[var(--color-border-main)] bg-white p-[18px] shadow-[0_2px_12px_rgba(13,27,62,0.12)]"
            >
              <div className="mb-[12px] flex items-center justify-between border-b border-gray-100 pb-[10px]">
                <div className="flex items-center gap-2">
                  <span className="text-lg">{cat.icon}</span>
                  <h4 className="text-[14px] font-bold text-[var(--color-navy)]">
                    {cat.name}
                  </h4>
                  <span className="font-mono text-[10px] text-[var(--color-muted)]">
                    ({cat.id})
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      setSelectedParentId(cat.id);
                      setModalType("SUBCATEGORY");
                    }}
                    className="cursor-pointer rounded-[6px] border border-[var(--color-border-main)] bg-gray-50 p-[4px_10px] text-[11px] font-semibold text-[var(--color-accent)] transition-colors hover:bg-blue-50"
                  >
                    + Sub-Kategori
                  </button>
                  <button
                    onClick={() => {
                      if (confirm(`Hapus kategori ${cat.name}?`))
                        deleteMutation.mutate({ type: "category", id: cat.id });
                    }}
                    className="cursor-pointer p-1 text-[13px] text-gray-400 hover:text-[var(--color-danger)]"
                  >
                    🗑️
                  </button>
                </div>
              </div>

              {/* Arsitektur Komponen Tingkat 2: Sub-Kategori */}
              <div className="ml-[10px] space-y-[10px] border-l-2 border-gray-100 pl-[20px]">
                {matchedSubs.length > 0 ? (
                  matchedSubs.map((sub) => {
                    const matchedDocs = data.documentTypes.filter(
                      (d) => d.subcategoryId === sub.id,
                    );

                    return (
                      <div
                        key={sub.id}
                        className="rounded-[8px] border border-gray-200/70 bg-[var(--color-off)] p-[12px]"
                      >
                        <div className="mb-[8px] flex items-center justify-between">
                          <span className="text-[12px] font-bold text-[var(--color-text-main)]">
                            🔹 {sub.name}{" "}
                            <span className="font-mono text-[10px] font-normal text-[var(--color-muted)]">
                              ({sub.id})
                            </span>
                          </span>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => {
                                setSelectedParentId(sub.id);
                                setModalType("DOCTYPE");
                              }}
                              className="cursor-pointer text-[11px] font-semibold text-[var(--color-muted)] hover:text-[var(--color-text-main)]"
                            >
                              + Jenis Surat
                            </button>
                            <button
                              onClick={() => {
                                if (confirm(`Hapus sub-kategori ${sub.name}?`))
                                  deleteMutation.mutate({
                                    type: "subcategory",
                                    id: sub.id,
                                  });
                              }}
                              className="cursor-pointer text-[12px] text-gray-400 hover:text-[var(--color-danger)]"
                            >
                              🗑️
                            </button>
                          </div>
                        </div>

                        {/* Arsitektur Komponen Tingkat 3: Jenis Surat */}
                        <div className="flex flex-wrap gap-[6px] pl-[14px]">
                          {matchedDocs.length > 0 ? (
                            matchedDocs.map((doc) => (
                              <span
                                key={doc.id}
                                className="inline-flex items-center gap-2 rounded-[6px] border border-[var(--color-border-main)] bg-white p-[4px_10px] text-[11px] font-medium text-[var(--color-text-main)] shadow-sm"
                              >
                                📄 {doc.name}
                                <button
                                  onClick={() => {
                                    if (
                                      confirm(`Hapus jenis surat ${doc.name}?`)
                                    )
                                      deleteMutation.mutate({
                                        type: "documentType",
                                        id: doc.id,
                                      });
                                  }}
                                  className="ml-1 cursor-pointer text-[10px] text-gray-400 hover:text-[var(--color-danger)]"
                                >
                                  ×
                                </button>
                              </span>
                            ))
                          ) : (
                            <span className="text-[10px] text-[var(--color-muted)] italic">
                              Belum ada jenis surat terdaftar.
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <span className="block p-1 text-[11px] text-[var(--color-muted)] italic">
                    Belum ada sub-kategori.
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal Dialog Tunggal Bersama (Dynamic Modal) */}
      {modalType !== "NONE" && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/45">
          <div className="animate-in fade-in zoom-in w-[460px] rounded-[14px] bg-white p-[28px] shadow-[0_20px_60px_rgba(0,0,0,0.3)] duration-150">
            <h2 className="mb-[16px] text-[15px] font-bold text-[var(--color-navy)]">
              {modalType === "CATEGORY" && "Tambah Kategori Utama"}
              {modalType === "SUBCATEGORY" && "Tambah Sub-Kategori"}
              {modalType === "DOCTYPE" && "Tambah Jenis Surat Baru"}
            </h2>

            <form onSubmit={handleSubmit}>
              {modalType === "CATEGORY" && (
                <div className="mb-[14px]">
                  <label className="mb-[4px] block text-[11px] font-semibold text-[var(--color-navy)]">
                    Simbol Emoji / Icon
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={2}
                    value={inputIcon}
                    onChange={(e) => setInputIcon(e.target.value)}
                    className="w-[60px] rounded-[7px] border-[1.5px] border-[var(--color-border-main)] p-[8px] text-center text-[14px] outline-none focus:border-[var(--color-accent)]"
                  />
                </div>
              )}

              <div className="mb-[20px]">
                <label className="mb-[4px] block text-[11px] font-semibold text-[var(--color-navy)]">
                  Nama Komponen Klasifikasi
                </label>
                <input
                  type="text"
                  required
                  placeholder="cth: Kalender Akademik, Surat Tugas, BOS..."
                  value={inputName}
                  onChange={(e) => setInputName(e.target.value)}
                  className="w-full rounded-[7px] border-[1.5px] border-[var(--color-border-main)] p-[9px_12px] text-[12px] transition-colors outline-none focus:border-[var(--color-accent)]"
                />
              </div>

              <div className="flex justify-end gap-[10px] border-t border-[var(--color-border-main)] pt-[16px]">
                <button
                  type="button"
                  onClick={() => setModalType("NONE")}
                  className="cursor-pointer rounded-[7px] border-[1.5px] border-[var(--color-border-main)] bg-[var(--color-off)] px-[14px] py-[7px] text-[12px] font-semibold text-[var(--color-text-main)] hover:bg-[var(--color-border-main)]"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="cursor-pointer rounded-[7px] bg-[var(--color-accent)] px-[14px] py-[7px] text-[12px] font-semibold text-white hover:bg-[var(--color-accent2)]"
                >
                  Simpan Komponen
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

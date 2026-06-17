"use client";

import { useState } from "react";
import { api } from "~/trpc/react";
import { ArchiveTable } from "~/app/_components/ArchiveTable";
import { EditModal } from "~/app/_components/EditModal";
import { ShareModal } from "~/app/_components/ShareModal";
import { UploadForm } from "~/app/_components/UploadForm";

export default function ArchivePage() {
  const { data: archivesList, isLoading: isArchivesLoading } =
    api.archive.getArchives.useQuery();
  const { data: classification, isLoading: isClassificationLoading } =
    api.archive.getAllowedClassifications.useQuery();

  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editData, setEditData] = useState<any>(null);

  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [shareData, setShareData] = useState<any>(null);

  const [searchQuery, setSearchQuery] = useState("");
  const [filterCategory, setFilterCategory] = useState("");
  const [filterArchiveType, setFilterArchiveType] = useState("");

  const [filterStartDate, setFilterStartDate] = useState("");
  const [filterEndDate, setFilterEndDate] = useState("");

  if (isArchivesLoading || isClassificationLoading) {
    return (
      <div className="text-[12px] text-[var(--color-muted)]">
        Memuat pusat arsip...
      </div>
    );
  }

  // 👇 Filter Engine Logic Diperbarui
  const processedArchives = archivesList?.filter((arc) => {
    const matchSearch =
      arc.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (arc.nomorSurat &&
        arc.nomorSurat.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchCategory = filterCategory
      ? arc.categoryId === filterCategory
      : true;
    const matchType = filterArchiveType
      ? arc.archiveType === filterArchiveType
      : true;

    // Filter Berdasarkan Rentang Tanggal Arsip Dibuat
    let matchDate = true;
    const arcDate = new Date(arc.createdAt);

    if (filterStartDate) {
      const start = new Date(filterStartDate);
      start.setHours(0, 0, 0, 0); // Set ke awal hari
      matchDate = matchDate && arcDate >= start;
    }

    if (filterEndDate) {
      const end = new Date(filterEndDate);
      end.setHours(23, 59, 59, 999); // Set ke penghujung hari
      matchDate = matchDate && arcDate <= end;
    }

    return matchSearch && matchCategory && matchType && matchDate;
  });

  return (
    <div className="space-y-[24px]">
      <div className="flex flex-col gap-[16px] md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-[18px] font-bold text-[var(--color-navy)]">
            Pusat Arsip Dokumen
          </h2>
          <p className="text-[12px] text-[var(--color-muted)]">
            Kelola, cari, dan unggah dokumen arsip digital Anda di sini.
          </p>
        </div>
        {!isUploadOpen && (
          <button
            onClick={() => setIsUploadOpen(true)}
            className="rounded-[8px] bg-[var(--color-accent)] px-[16px] py-[8px] text-[12px] font-bold text-white shadow-sm transition-colors hover:bg-[var(--color-accent2)]"
          >
            + Unggah Arsip Baru
          </button>
        )}
      </div>

      {isUploadOpen ? (
        <div className="animate-in fade-in rounded-[12px] border-[1.5px] border-[var(--color-border-main)] bg-white p-[24px] shadow-sm duration-300">
          <div className="mb-[16px] flex items-center justify-between border-b-[1.5px] border-[var(--color-border-main)] pb-[16px]">
            <h3 className="text-[14px] font-bold text-[var(--color-navy)]">
              Formulir Unggah Dokumen
            </h3>
            <button
              onClick={() => setIsUploadOpen(false)}
              className="text-[12px] font-bold text-red-500 transition-colors hover:text-red-700"
            >
              Batalkan
            </button>
          </div>
          <UploadForm
            classification={classification}
            onSuccess={() => setIsUploadOpen(false)}
            onCancel={() => setIsUploadOpen(false)}
          />
        </div>
      ) : (
        <>
          {/* Kotak Filter Pencarian & Kategori */}
          <div className="flex flex-col gap-[16px] rounded-[12px] border-[1.5px] border-[var(--color-border-main)] bg-white p-[16px] shadow-sm">
            {/* Baris 1: Filter Teks (Pencarian Full Width) */}
            <div className="w-full">
              <input
                type="text"
                placeholder="Cari nama dokumen atau nomor surat secara cepat..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-[7px] border-[1.5px] border-[var(--color-border-main)] p-[10px_14px] text-[13px] transition-colors outline-none focus:border-[var(--color-accent)]"
              />
            </div>

            {/* Baris 2: Dropdown di Kiri, Tanggal di Kanan (Layar Lebar) */}
            <div className="flex flex-col gap-[16px] border-t-[1.5px] border-[var(--color-border-main)] pt-[16px] xl:flex-row xl:items-center xl:justify-between">
              {/* KELOMPOK KIRI: Dropdown Kategori & Alur Arsip */}
              <div className="flex w-full flex-col gap-[12px] sm:flex-row xl:w-auto">
                <select
                  value={filterCategory}
                  onChange={(e) => setFilterCategory(e.target.value)}
                  className="w-full min-w-[160px] rounded-[7px] border-[1.5px] border-[var(--color-border-main)] p-[6px_10px] text-[12px] transition-colors outline-none focus:border-[var(--color-accent)] sm:w-auto"
                >
                  <option value="">Semua Kategori</option>
                  {classification?.categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.icon} {c.name}
                    </option>
                  ))}
                </select>

                <select
                  value={filterArchiveType}
                  onChange={(e) => setFilterArchiveType(e.target.value)}
                  className="w-full min-w-[140px] rounded-[7px] border-[1.5px] border-[var(--color-border-main)] p-[6px_10px] text-[12px] font-medium transition-colors outline-none focus:border-[var(--color-accent)] sm:w-auto"
                >
                  <option value="">Semua Alur Arsip</option>
                  <option value="Masuk">📥 Arsip Masuk</option>
                  <option value="Keluar">📤 Arsip Keluar</option>
                </select>
              </div>

              {/* KELOMPOK KANAN: Rentang Tanggal & Tombol Hapus */}
              <div className="flex w-full flex-col gap-[12px] sm:flex-row sm:items-center xl:w-auto">
                <span className="text-[12px] font-semibold whitespace-nowrap text-[var(--color-navy)]">
                  📅 Tanggal Dibuat:
                </span>
                <div className="flex w-full items-center gap-[8px] sm:w-auto">
                  <input
                    type="date"
                    value={filterStartDate}
                    onChange={(e) => setFilterStartDate(e.target.value)}
                    className="flex-1 rounded-[7px] border-[1.5px] border-[var(--color-border-main)] p-[6px_10px] text-[12px] text-gray-600 transition-colors outline-none focus:border-[var(--color-accent)] sm:flex-none"
                  />
                  <span className="text-[12px] font-medium text-gray-400">
                    s/d
                  </span>
                  <input
                    type="date"
                    value={filterEndDate}
                    onChange={(e) => setFilterEndDate(e.target.value)}
                    className="flex-1 rounded-[7px] border-[1.5px] border-[var(--color-border-main)] p-[6px_10px] text-[12px] text-gray-600 transition-colors outline-none focus:border-[var(--color-accent)] sm:flex-none"
                  />
                </div>

                {/* Tombol Hapus Rentang */}
                {(filterStartDate || filterEndDate) && (
                  <button
                    onClick={() => {
                      setFilterStartDate("");
                      setFilterEndDate("");
                    }}
                    className="w-full rounded-[6px] bg-red-50 px-3 py-1.5 text-[11px] font-bold whitespace-nowrap text-red-500 transition-colors hover:bg-red-100 hover:text-red-700 sm:w-auto"
                  >
                    × Hapus Rentang
                  </button>
                )}
              </div>
            </div>
          </div>

          <ArchiveTable
            archivesList={processedArchives}
            classification={classification}
            onEdit={(arc: any) => {
              setEditData(arc);
              setEditModalOpen(true);
            }}
            onShare={(arc: any) => {
              setShareData(arc);
              setShareModalOpen(true);
            }}
          />
        </>
      )}

      {editModalOpen && editData && (
        <EditModal
          editData={editData}
          setEditData={setEditData}
          onClose={() => {
            setEditModalOpen(false);
            setEditData(null);
          }}
        />
      )}

      {shareModalOpen && shareData && (
        <ShareModal
          shareData={shareData}
          onClose={() => {
            setShareModalOpen(false);
            setShareData(null);
          }}
        />
      )}
    </div>
  );
}

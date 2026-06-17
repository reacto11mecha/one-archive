"use client";

import { useState } from "react";
import { api } from "~/trpc/react";
import { UploadForm } from "~/app/_components/UploadForm";
import { ArchiveTable } from "~/app/_components/ArchiveTable";
import { EditModal } from "~/app/_components/EditModal";
import { ShareModal } from "~/app/_components/ShareModal";

export default function ArchiveManagementPage() {
  const { data: classification, isLoading: isClassLoading } =
    api.archive.getAllowedClassifications.useQuery();
  const { data: archivesList, isLoading: isArchivesLoading } =
    api.archive.getArchives.useQuery();

  const [showUploadForm, setShowUploadForm] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editData, setEditData] = useState<any>(null);

  // State Fitur Pencarian & Filter
  const [searchQuery, setSearchQuery] = useState("");
  const [filterCategory, setFilterCategory] = useState("");
  const [sortBy, setSortBy] = useState("newest");

  // State Rentang Tanggal
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  // State Modal Share Arsip
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [shareData, setShareData] = useState<any>(null);

  if (isClassLoading || isArchivesLoading) {
    return (
      <div className="text-[12px] text-[var(--color-muted)]">
        Memuat data arsip...
      </div>
    );
  }

  // --- ENGINE FILTRASI & PENCARIAN (CLIENT SIDE) ---
  const processedArchives = (() => {
    if (!archivesList) return [];

    let list = [...archivesList];

    // 1. Filter Kata Kunci (Nama Dokumen / Nomor Arsip / Deskripsi)
    if (searchQuery.trim() !== "") {
      const query = searchQuery.toLowerCase();
      list = list.filter(
        (arc) =>
          arc.title.toLowerCase().includes(query) ||
          (arc.documentNumber &&
            arc.documentNumber.toLowerCase().includes(query)) ||
          (arc.nomorSurat && arc.nomorSurat.toLowerCase().includes(query)) ||
          (arc.description && arc.description.toLowerCase().includes(query)),
      );
    }

    // 2. Filter Berdasarkan Kategori Utama
    if (filterCategory !== "") {
      list = list.filter((arc) => arc.categoryId === filterCategory);
    }

    // 3. Filter Rentang Tanggal (Date Range)
    if (startDate) {
      const start = new Date(startDate);
      start.setHours(0, 0, 0, 0);
      list = list.filter((arc) => new Date(arc.createdAt) >= start);
    }

    if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999); // Mencakup hingga detik terakhir di hari tersebut
      list = list.filter((arc) => new Date(arc.createdAt) <= end);
    }

    // 4. Logika Pengurutan (Sorting)
    list.sort((a, b) => {
      if (sortBy === "newest")
        return (
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
      if (sortBy === "oldest")
        return (
          new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        );
      if (sortBy === "alpha-asc") return a.title.localeCompare(b.title);
      if (sortBy === "alpha-desc") return b.title.localeCompare(a.title);
      return 0;
    });

    return list;
  })();

  return (
    <div className="relative space-y-[20px]">
      {/* Header Utama */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-[16px] font-bold text-[var(--color-navy)]">
            Pusat Arsip Dokumen
          </h2>
        </div>
        <button
          onClick={() => setShowUploadForm(!showUploadForm)}
          className={`cursor-pointer rounded-[7px] border-[1.5px] px-[14px] py-[8px] text-[12px] font-bold transition-all ${
            showUploadForm
              ? "border-[var(--color-border-main)] bg-[var(--color-off)] text-gray-600 hover:bg-gray-200"
              : "border-[var(--color-accent)] bg-[var(--color-accent)] text-white hover:bg-[var(--color-accent2)]"
          }`}
        >
          {showUploadForm ? "✕ Batal Unggah" : "+ Unggah Arsip Baru"}
        </button>
      </div>

      {/* Form Upload */}
      {showUploadForm && (
        <UploadForm
          classification={classification}
          onSuccess={() => setShowUploadForm(false)}
          onCancel={() => setShowUploadForm(false)}
        />
      )}

      {/* --- BARIS UTENSIL PENCARIAN & FILTER --- */}
      <div className="flex flex-col gap-[12px] rounded-[10px] border-[1.5px] border-[var(--color-border-main)] bg-white p-[14px] shadow-sm md:flex-row md:items-center md:justify-between">
        {/* Kolom Pencarian */}
        <div className="flex min-w-[260px] flex-1 items-center gap-[8px]">
          <input
            type="text"
            placeholder="Cari nama dokumen, nomor arsip..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-[7px] border-[1.5px] border-[var(--color-border-main)] p-[8px_12px] text-[12px] transition-colors outline-none focus:border-[var(--color-accent)]"
          />
        </div>

        {/* Kolom Filter & Sorting */}
        <div className="flex flex-wrap items-center gap-[10px]">
          {/* Filter Rentang Tanggal */}
          <div className="flex items-center gap-[6px] rounded-[7px] border-[1.5px] border-[var(--color-border-main)] bg-white px-[8px] py-[6px] transition-colors focus-within:border-[var(--color-accent)]">
            <span className="text-[11px] font-medium text-[var(--color-muted)]">
              📅 Periode:
            </span>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="bg-transparent text-[11px] text-[var(--color-navy)] outline-none"
            />
            <span className="text-[11px] text-[var(--color-muted)]">-</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="bg-transparent text-[11px] text-[var(--color-navy)] outline-none"
            />
            {(startDate || endDate) && (
              <button
                onClick={() => {
                  setStartDate("");
                  setEndDate("");
                }}
                className="ml-1 rounded-full bg-gray-200 px-1.5 text-[9px] text-gray-500 hover:bg-gray-300"
                title="Hapus Filter Tanggal"
              >
                ✕
              </button>
            )}
          </div>

          {/* Dropdown Filter Kategori */}
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="cursor-pointer rounded-[7px] border-[1.5px] border-[var(--color-border-main)] bg-white p-[8px_12px] text-[12px] transition-colors outline-none focus:border-[var(--color-accent)]"
          >
            <option value="">-- Semua Kategori --</option>
            {classification?.categories.map((cat: any) => (
              <option key={cat.id} value={cat.id}>
                {cat.icon} {cat.name}
              </option>
            ))}
          </select>

          {/* Dropdown Pengurutan Data */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="cursor-pointer rounded-[7px] border-[1.5px] border-[var(--color-border-main)] bg-white p-[8px_12px] text-[12px] transition-colors outline-none focus:border-[var(--color-accent)]"
          >
            <option value="newest">📉 Urutan: Terbaru</option>
            <option value="oldest">📈 Urutan: Terlama</option>
            <option value="alpha-asc">🔤 Nama: A - Z</option>
            <option value="alpha-desc">🔤 Nama: Z - A</option>
          </select>
        </div>
      </div>

      {/* Komponen Tabel Utama */}
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

      {/* Modal Share Arsip */}
      {shareModalOpen && shareData && (
        <ShareModal
          shareData={shareData}
          onClose={() => setShareModalOpen(false)}
        />
      )}

      {/* Modal Pengeditan */}
      {editModalOpen && editData && (
        <EditModal
          editData={editData}
          setEditData={setEditData}
          onClose={() => setEditModalOpen(false)}
        />
      )}
    </div>
  );
}

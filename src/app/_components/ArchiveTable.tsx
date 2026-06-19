"use client";

import { useMemo, useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { api } from "~/trpc/react";
import type { RouterOutputs } from "~/trpc/react";
import { toast } from "sonner";
import {
  useReactTable,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  flexRender,
  createColumnHelper,
  type SortingState,
} from "@tanstack/react-table";

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
  const pathname = usePathname();

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

  const [isInitialized, setIsInitialized] = useState(false);

  const [searchQuery, setSearchQuery] = useState("");
  const [filterCategory, setFilterCategory] = useState("");
  const [filterType, setFilterType] = useState("");
  const [filterStart, setFilterStart] = useState("");
  const [filterEnd, setFilterEnd] = useState("");

  const [sorting, setSorting] = useState<SortingState>([]);
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 10 });

  const updateFilter = (setter: (val: string) => void, value: string) => {
    setter(value);
    setPagination((prev) => ({ ...prev, pageIndex: 0 }));
  };

  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      setSearchQuery(params.get("q") || "");
      setFilterCategory(params.get("category") || "");
      setFilterType(params.get("type") || "");
      setFilterStart(params.get("start") || "");
      setFilterEnd(params.get("end") || "");

      const p = Number(params.get("page") || 1);
      const s = Number(params.get("size") || 10);
      setPagination({
        pageIndex: Math.max(0, p - 1),
        pageSize: s,
      });
      setIsInitialized(true);
    }
  }, []);

  useEffect(() => {
    if (!isInitialized) return;

    if (typeof window !== "undefined") {
      const params = new URLSearchParams();
      if (searchQuery) params.set("q", searchQuery);
      if (filterCategory) params.set("category", filterCategory);
      if (filterType) params.set("type", filterType);
      if (filterStart) params.set("start", filterStart);
      if (filterEnd) params.set("end", filterEnd);
      params.set("page", String(pagination.pageIndex + 1));
      params.set("size", String(pagination.pageSize));

      const newUrl = `${pathname}?${params.toString()}`;
      window.history.replaceState(null, "", newUrl);
    }
  }, [
    searchQuery,
    filterCategory,
    filterType,
    filterStart,
    filterEnd,
    pagination,
    pathname,
    isInitialized,
  ]);

  const processedData = useMemo(() => {
    if (!archivesList) return [];
    return archivesList.filter((arc) => {
      const matchSearch =
        arc.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (arc.nomorSurat &&
          arc.nomorSurat.toLowerCase().includes(searchQuery.toLowerCase()));
      const matchCat = filterCategory
        ? arc.categoryId === filterCategory
        : true;
      const matchType = filterType ? arc.archiveType === filterType : true;

      let matchDate = true;
      const arcDate = new Date(arc.createdAt);
      if (filterStart) {
        const start = new Date(filterStart);
        start.setHours(0, 0, 0, 0);
        matchDate = matchDate && arcDate >= start;
      }
      if (filterEnd) {
        const end = new Date(filterEnd);
        end.setHours(23, 59, 59, 999);
        matchDate = matchDate && arcDate <= end;
      }

      return matchSearch && matchCat && matchType && matchDate;
    });
  }, [
    archivesList,
    searchQuery,
    filterCategory,
    filterType,
    filterStart,
    filterEnd,
  ]);

  useEffect(() => {
    if (!isInitialized) return;
    const maxPage = Math.ceil(processedData.length / pagination.pageSize);
    if (maxPage > 0 && pagination.pageIndex >= maxPage) {
      setPagination((prev) => ({ ...prev, pageIndex: maxPage - 1 }));
    }
  }, [
    processedData.length,
    pagination.pageSize,
    pagination.pageIndex,
    isInitialized,
  ]);

  const columnHelper = createColumnHelper<Archive>();
  const columns = useMemo(
    () => [
      columnHelper.accessor("title", {
        header: "Informasi Dokumen",
        cell: (info) => {
          const arc = info.row.original;
          const actualExt = arc.fileKey.split(".").pop() || "pdf";
          return (
            <div className="flex gap-3">
              <span className="mt-1 h-fit rounded-[6px] bg-blue-100 px-[8px] py-[4px] text-[10px] font-bold text-blue-700 uppercase">
                {actualExt}
              </span>
              <div>
                <div className="mb-1 flex items-center gap-2">
                  <span
                    className={`inline-flex items-center rounded-sm px-[6px] py-[2px] text-[9px] font-bold tracking-wider uppercase ${arc.archiveType === "Masuk" ? "bg-blue-100 text-blue-700" : "bg-green-100 text-green-700"}`}
                  >
                    {arc.archiveType === "Masuk" ? "📥 MASUK" : "📤 KELUAR"}
                  </span>
                  <span className="block text-[13px] font-bold text-[var(--color-text-main)]">
                    {arc.title}
                  </span>
                </div>
                <span className="block text-[11px] text-[var(--color-muted)]">
                  Tgl: {new Date(arc.createdAt).toLocaleDateString("id-ID")} |
                  No: {arc.nomorSurat || "-"}
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
                    <span className="inline-block rounded-full border border-purple-200 bg-purple-50 px-[8px] py-[2px] text-[10px] font-semibold text-purple-700">
                      🔗 Passkey:{" "}
                      <span className="rounded border border-purple-100 bg-white px-1 font-mono">
                        {arc.shareConfig.plainKey}
                      </span>
                    </span>
                  )}
                </div>
              </div>
            </div>
          );
        },
      }),

      columnHelper.accessor("categoryId", {
        header: "Klasifikasi & Retensi",
        cell: (info) => {
          const arc = info.row.original;
          const isExpired =
            arc.retentionDate && new Date(arc.retentionDate) < new Date();
          const categoryObj = classification?.categories.find(
            (c) => c.id === arc.categoryId,
          );
          const subcategoryObj = classification?.subcategories.find(
            (s) => s.id === arc.subcategoryId,
          );

          return (
            <div>
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
                    {isExpired ? "🔴 Retensi Inaktif" : "🟢 Retensi Aktif"}
                  </span>
                ) : (
                  <span className="inline-block rounded-[6px] bg-gray-100 px-[8px] py-[3px] text-[9px] font-bold tracking-wider text-gray-600 uppercase">
                    ⚪ Permanen
                  </span>
                )}
              </div>
            </div>
          );
        },
      }),

      columnHelper.display({
        id: "actions",
        header: "Aksi",
        cell: (info) => {
          const arc = info.row.original;
          const actualExt = arc.fileKey.split(".").pop() || "pdf";
          const cleanFileName = `${arc.title}.${actualExt}`;

          return (
            <div className="flex gap-2">
              <button
                onClick={() =>
                  handleAccessFile(arc.fileKey, cleanFileName, "view")
                }
                className="rounded-[6px] bg-blue-50 p-[6px] text-blue-600 hover:bg-blue-100"
                title="Lihat"
              >
                👁️
              </button>
              <button
                onClick={() =>
                  handleAccessFile(arc.fileKey, cleanFileName, "download")
                }
                className="rounded-[6px] bg-green-50 p-[6px] text-green-600 hover:bg-green-100"
                title="Unduh"
              >
                ⬇️
              </button>
              <button
                onClick={() => onShare(arc)}
                className={`rounded-[6px] p-[6px] transition-colors ${arc.isShared ? "bg-purple-100 text-purple-700" : "bg-purple-50 text-purple-600"}`}
                title="Share"
              >
                🔗
              </button>
              <button
                onClick={() => onEdit(arc)}
                className="rounded-[6px] bg-amber-50 p-[6px] text-amber-600 hover:bg-amber-100"
                title="Edit"
              >
                ✏️
              </button>
              <button
                onClick={() => {
                  if (confirm("Hapus permanen arsip?"))
                    deleteArchiveMutation.mutate({
                      id: arc.id,
                      fileKey: arc.fileKey,
                    });
                }}
                className="rounded-[6px] bg-red-50 p-[6px] text-red-600 hover:bg-red-100"
                title="Hapus"
              >
                🗑️
              </button>
            </div>
          );
        },
      }),
    ],
    [classification, handleAccessFile, deleteArchiveMutation, onEdit, onShare],
  );

  const table = useReactTable({
    data: processedData,
    columns,
    state: { sorting, pagination },
    onSortingChange: setSorting,
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  return (
    <div className="space-y-[16px]">
      <div className="flex flex-col gap-[16px] rounded-[12px] border-[1.5px] border-[var(--color-border-main)] bg-white p-[16px] shadow-sm">
        <div className="w-full">
          <input
            type="text"
            placeholder="Cari nama dokumen atau nomor surat secara cepat..."
            value={searchQuery}
            onChange={(e) => updateFilter(setSearchQuery, e.target.value)}
            className="w-full rounded-[7px] border-[1.5px] border-[var(--color-border-main)] p-[10px_14px] text-[13px] transition-colors outline-none focus:border-[var(--color-accent)]"
          />
        </div>
        <div className="flex flex-col gap-[16px] border-t-[1.5px] border-[var(--color-border-main)] pt-[16px] xl:flex-row xl:items-center xl:justify-between">
          <div className="flex w-full flex-col gap-[12px] sm:flex-row xl:w-auto">
            <select
              value={filterCategory}
              onChange={(e) => updateFilter(setFilterCategory, e.target.value)}
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
              value={filterType}
              onChange={(e) => updateFilter(setFilterType, e.target.value)}
              className="w-full min-w-[140px] rounded-[7px] border-[1.5px] border-[var(--color-border-main)] p-[6px_10px] text-[12px] font-medium transition-colors outline-none focus:border-[var(--color-accent)] sm:w-auto"
            >
              <option value="">Semua Alur Arsip</option>
              <option value="Masuk">📥 Arsip Masuk</option>
              <option value="Keluar">📤 Arsip Keluar</option>
            </select>
          </div>
          <div className="flex w-full flex-col gap-[12px] sm:flex-row sm:items-center xl:w-auto">
            <span className="text-[12px] font-semibold whitespace-nowrap text-[var(--color-navy)]">
              📅 Tanggal Dibuat:
            </span>
            <div className="flex w-full items-center gap-[8px] sm:w-auto">
              <input
                type="date"
                value={filterStart}
                onChange={(e) => updateFilter(setFilterStart, e.target.value)}
                className="flex-1 rounded-[7px] border-[1.5px] border-[var(--color-border-main)] p-[6px_10px] text-[12px] text-gray-600 outline-none focus:border-[var(--color-accent)] sm:flex-none"
              />
              <span className="text-[12px] font-medium text-gray-400">s/d</span>
              <input
                type="date"
                value={filterEnd}
                onChange={(e) => updateFilter(setFilterEnd, e.target.value)}
                className="flex-1 rounded-[7px] border-[1.5px] border-[var(--color-border-main)] p-[6px_10px] text-[12px] text-gray-600 outline-none focus:border-[var(--color-accent)] sm:flex-none"
              />
            </div>
            {(filterStart || filterEnd) && (
              <button
                onClick={() => {
                  updateFilter(setFilterStart, "");
                  updateFilter(setFilterEnd, "");
                }}
                className="w-full rounded-[6px] bg-red-50 px-3 py-1.5 text-[11px] font-bold whitespace-nowrap text-red-500 hover:bg-red-100 sm:w-auto"
              >
                × Hapus Rentang
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="overflow-hidden rounded-[12px] border-[1.5px] border-[var(--color-border-main)] bg-white shadow-[0_2px_12px_rgba(13,27,62,0.12)]">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left">
            <thead>
              {table.getHeaderGroups().map((headerGroup) => (
                <tr
                  key={headerGroup.id}
                  className="border-b border-[var(--color-border-main)] bg-[var(--color-off)] text-[11px] font-bold tracking-wider text-[var(--color-navy)] uppercase"
                >
                  {headerGroup.headers.map((header) => (
                    <th
                      key={header.id}
                      className={`p-[14px_16px] ${header.column.getCanSort() ? "cursor-pointer select-none hover:bg-gray-100" : ""}`}
                      onClick={header.column.getToggleSortingHandler()}
                    >
                      <div className="flex items-center gap-2">
                        {flexRender(
                          header.column.columnDef.header,
                          header.getContext(),
                        )}
                        {{ asc: " 🔼", desc: " 🔽" }[
                          header.column.getIsSorted() as string
                        ] ?? null}
                      </div>
                    </th>
                  ))}
                </tr>
              ))}
            </thead>
            <tbody>
              {table.getRowModel().rows.length === 0 ? (
                <tr>
                  <td
                    colSpan={columns.length}
                    className="p-[40px] text-center text-[12px] text-[var(--color-muted)] italic"
                  >
                    Tidak ada dokumen arsip yang cocok dengan kriteria
                    pencarian.
                  </td>
                </tr>
              ) : (
                table.getRowModel().rows.map((row) => (
                  <tr
                    key={row.id}
                    className="border-b border-[var(--color-border-main)] transition-colors last:border-0 hover:bg-blue-50/30"
                  >
                    {row.getVisibleCells().map((cell) => (
                      <td key={cell.id} className="p-[14px_16px] align-top">
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext(),
                        )}
                      </td>
                    ))}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {processedData.length > 0 && (
        <div className="flex flex-col items-center justify-between gap-4 rounded-[12px] border-[1.5px] border-[var(--color-border-main)] bg-white p-[12px_16px] shadow-sm sm:flex-row">
          <div className="flex flex-wrap items-center gap-[16px]">
            <span className="text-[12px] font-semibold text-[var(--color-muted)]">
              Halaman{" "}
              <strong className="text-[var(--color-navy)]">
                {table.getState().pagination.pageIndex + 1}
              </strong>{" "}
              dari{" "}
              <strong className="text-[var(--color-navy)]">
                {table.getPageCount() || 1}
              </strong>
            </span>
            <div className="flex items-center gap-2 border-l border-gray-200 pl-[16px]">
              <span className="text-[12px] font-medium text-[var(--color-muted)]">
                Tampilkan:
              </span>
              <select
                value={table.getState().pagination.pageSize}
                onChange={(e) => {
                  setPagination({
                    pageIndex: 0,
                    pageSize: Number(e.target.value),
                  });
                }}
                className="rounded-[6px] border border-gray-200 bg-gray-50 p-[4px_8px] text-[12px] font-bold text-[var(--color-text-main)] outline-none focus:border-[var(--color-accent)]"
              >
                {[5, 10, 20, 50].map((size) => (
                  <option key={size} value={size}>
                    {size} Baris
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="flex w-full items-center justify-end gap-2 sm:w-auto">
            <button
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
              className="rounded-[6px] border border-gray-200 bg-gray-50 px-3 py-1.5 text-[12px] font-bold text-[var(--color-text-main)] hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50"
            >
              ← Sebelumnya
            </button>
            <button
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
              className="rounded-[6px] border border-gray-200 bg-gray-50 px-3 py-1.5 text-[12px] font-bold text-[var(--color-text-main)] hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Selanjutnya →
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

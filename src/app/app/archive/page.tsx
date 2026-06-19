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

  if (isArchivesLoading || isClassificationLoading) {
    return (
      <div className="text-[12px] text-[var(--color-muted)]">
        Memuat pusat arsip...
      </div>
    );
  }

  return (
    <div className="space-y-[24px]">
      {/* Header Halaman */}
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
        <div className="animate-in fade-in zoom-in rounded-[12px] border-[1.5px] border-[var(--color-border-main)] bg-white p-[24px] shadow-sm duration-300">
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
        <ArchiveTable
          archivesList={archivesList}
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
      )}

      {/* Modal Edit Arsip */}
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

      {/* Modal Share Publik */}
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

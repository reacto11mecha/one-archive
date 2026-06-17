"use client";

import { useState } from "react";
import { api, type RouterOutputs } from "~/trpc/react";
import { toast } from "sonner";
import { QRCodeSVG } from "qrcode.react";

type Archive = RouterOutputs["archive"]["getArchives"][number];

interface ShareModalProps {
  shareData: Archive;
  onClose: () => void;
}

export function ShareModal({ shareData, onClose }: ShareModalProps) {
  const ctx = api.useUtils();
  // Set default state passkey jika sudah pernah dibagikan sebelumnya
  const [passkey, setPasskey] = useState(shareData.shareConfig?.plainKey || "");

  // Membangun URL tautan dinamis yang mengarah ke halaman publik /share/[id]
  const shareUrl = `${typeof window !== "undefined" ? window.location.origin : ""}/share/${shareData.id}`;

  const shareMutation = api.archive.shareArchive.useMutation({
    onSuccess: () => {
      toast.success(
        shareData.isShared
          ? "Passkey berhasil diperbarui!"
          : "Arsip berhasil dibagikan publik!",
      );
      void ctx.archive.getArchives.invalidate();
    },
    onError: (err) => toast.error(err.message),
  });

  const unshareMutation = api.archive.unshareArchive.useMutation({
    onSuccess: () => {
      toast.success("Akses tautan publik berhasil dicabut.");
      void ctx.archive.getArchives.invalidate();
      onClose();
    },
  });

  const handleShareSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (passkey.length < 4) {
      return toast.warning("Passkey minimal harus 4 karakter.");
    }
    shareMutation.mutate({ archiveId: shareData.id, passkey });
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(shareUrl);
    toast.success("Tautan disalin ke clipboard!");
  };

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/45 backdrop-blur-sm">
      <div className="animate-in fade-in zoom-in w-[440px] overflow-hidden rounded-[16px] bg-white shadow-[0_20px_60px_rgba(0,0,0,0.3)] duration-200">
        {/* Header Modal */}
        <div className="bg-purple-600 px-[24px] py-[20px] text-white">
          <h3 className="flex items-center gap-2 text-[16px] font-bold">
            🔗 Kelola Akses Publik
          </h3>
          <p className="mt-1 line-clamp-1 text-[11px] text-purple-200">
            {shareData.title}
          </p>
        </div>

        <div className="p-[24px]">
          {/* Kondisi Jika Arsip Sudah Aktif Dibagikan */}
          {shareData.isShared || shareMutation.isSuccess ? (
            <div className="animate-in fade-in flex flex-col items-center">
              <div className="mb-4 rounded-[12px] border-[1.5px] border-gray-100 bg-white p-3 shadow-sm">
                <QRCodeSVG value={shareUrl} size={140} level="M" />
              </div>

              <div className="mb-4 w-full">
                <label className="mb-1 block text-[10px] font-bold tracking-wider text-[var(--color-muted)] uppercase">
                  Tautan Publik
                </label>
                <div className="flex">
                  <input
                    type="text"
                    readOnly
                    value={shareUrl}
                    className="w-full rounded-l-[7px] border-[1.5px] border-r-0 border-gray-200 bg-gray-50 p-[8px_10px] font-mono text-[11px] text-[var(--color-navy)] outline-none"
                  />
                  <button
                    onClick={handleCopyLink}
                    className="rounded-r-[7px] border-[1.5px] border-l-0 border-gray-200 bg-[var(--color-off)] px-3 text-[11px] font-bold transition-colors hover:bg-gray-200"
                  >
                    Salin
                  </button>
                </div>
              </div>

              <form onSubmit={handleShareSubmit} className="w-full">
                <label className="mb-1 block text-[10px] font-bold tracking-wider text-[var(--color-muted)] uppercase">
                  Ubah Passkey
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={passkey}
                    onChange={(e) => setPasskey(e.target.value)}
                    placeholder="Ketik sandi baru..."
                    className="w-full rounded-[7px] border-[1.5px] border-[var(--color-border-main)] p-[8px_10px] text-[12px] transition-colors outline-none focus:border-purple-500"
                  />
                  <button
                    type="submit"
                    disabled={shareMutation.isPending}
                    className="rounded-[7px] bg-purple-100 px-3 text-[11px] font-bold text-purple-700 transition-colors hover:bg-purple-200"
                  >
                    {shareMutation.isPending ? "..." : "Update"}
                  </button>
                </div>
              </form>
            </div>
          ) : (
            /* Kondisi Jika Arsip Belum Dibagikan */
            <form onSubmit={handleShareSubmit} className="animate-in fade-in">
              <div className="mb-[20px] text-center">
                <div className="mb-3 inline-flex h-[50px] w-[50px] items-center justify-center rounded-full bg-purple-50 text-[24px] text-purple-600">
                  🔒
                </div>
                <p className="text-[12px] leading-relaxed text-[var(--color-text-main)]">
                  Aktifkan tautan publik untuk membagikan arsip ini kepada pihak
                  eksternal. Mereka akan diminta memasukkan{" "}
                  <strong>Passkey</strong> keamanan untuk membukanya.
                </p>
              </div>

              <div className="mb-[20px]">
                <label className="mb-[6px] block text-[11px] font-semibold text-[var(--color-navy)]">
                  Buat Passkey (Min 4 Karakter)
                </label>
                <input
                  type="text"
                  value={passkey}
                  onChange={(e) => setPasskey(e.target.value)}
                  placeholder="Contoh: RAHASIA123"
                  required
                  className="w-full rounded-[7px] border-[1.5px] border-[var(--color-border-main)] p-[10px_12px] font-mono text-[13px] transition-colors outline-none focus:border-purple-500"
                />
              </div>

              <button
                type="submit"
                disabled={shareMutation.isPending}
                className="w-full rounded-[8px] bg-purple-600 px-[16px] py-[10px] text-[12px] font-bold text-white transition-colors hover:bg-purple-700 disabled:opacity-70"
              >
                {shareMutation.isPending
                  ? "Memproses..."
                  : "Buat Tautan Publik Sekarang"}
              </button>
            </form>
          )}
        </div>

        {/* Footer Aksi */}
        <div className="flex items-center justify-between border-t border-[var(--color-border-main)] bg-gray-50 px-[24px] py-[16px]">
          {shareData.isShared || shareMutation.isSuccess ? (
            <button
              onClick={() => {
                if (
                  confirm(
                    "Yakin ingin mencabut tautan? Publik tidak akan bisa mengakses arsip ini lagi.",
                  )
                )
                  unshareMutation.mutate({ archiveId: shareData.id });
              }}
              disabled={unshareMutation.isPending}
              className="text-[11px] font-bold text-red-600 hover:underline"
            >
              Tutup Akses Publik
            </button>
          ) : (
            <div></div>
          )}

          <button
            type="button"
            onClick={onClose}
            className="rounded-[7px] border-[1.5px] border-[var(--color-border-main)] bg-white px-[16px] py-[6px] text-[11px] font-semibold text-[var(--color-text-main)] transition-colors hover:bg-gray-100"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
}

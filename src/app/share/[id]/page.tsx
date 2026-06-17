"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { api } from "~/trpc/react";
import { toast } from "sonner";
import { QRCodeSVG } from "qrcode.react";

export default function PublicSharePage() {
  const params = useParams();
  const archiveId = params.id as string;

  const [passkey, setPasskey] = useState("");
  const [archiveData, setArchiveData] = useState<any>(null);

  const { data: shareStatus, isLoading: isChecking } =
    api.archive.checkShareStatus.useQuery(
      { archiveId },
      {
        retry: false, // Jangan coba ulang jika memang tidak ada
        refetchOnWindowFocus: false,
      },
    );

  const verifyMutation = api.archive.verifySharePasskey.useMutation({
    onSuccess: (data) => {
      toast.success("Akses berhasil dibuka!");
      setArchiveData(data);
    },
    onError: (err) => {
      toast.error(err.message || "Passkey salah.");
      setPasskey("");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!passkey) return toast.warning("Masukkan passkey terlebih dahulu.");
    verifyMutation.mutate({ archiveId, passkey });
  };

  if (isChecking) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-[var(--color-navy)] to-[var(--color-navy3)] p-4">
        <div className="animate-pulse text-[12px] text-white">
          Memeriksa tautan...
        </div>
      </div>
    );
  }

  if (!shareStatus?.isValid) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 p-4">
        <div className="animate-in fade-in zoom-in w-full max-w-sm rounded-[16px] border-[1.5px] border-gray-200 bg-white p-8 text-center shadow-sm duration-300">
          <div className="mb-4 inline-flex h-16 w-16 items-center justify-center rounded-full bg-red-50 text-3xl text-red-500">
            📭
          </div>
          <h1 className="text-[16px] font-extrabold text-[var(--color-navy)]">
            Tautan Tidak Valid
          </h1>
          <p className="mt-2 text-[12px] leading-relaxed text-[var(--color-muted)]">
            Dokumen arsip yang Anda cari tidak ditemukan, ID salah, atau
            Administrator telah mencabut akses publik untuk dokumen ini.
          </p>
        </div>
      </div>
    );
  }

  if (archiveData) {
    const currentUrl =
      typeof window !== "undefined" ? window.location.href : "";

    return (
      <div className="flex min-h-screen items-center justify-center bg-[var(--color-off)] p-4">
        <div className="animate-in fade-in zoom-in w-full max-w-md overflow-hidden rounded-[16px] bg-white shadow-[0_20px_60px_rgba(13,27,62,0.08)] duration-300">
          <div className="bg-[var(--color-navy)] px-6 py-4 text-center">
            <h1 className="text-[16px] font-bold text-white">
              One Archive Secure Portal
            </h1>
            <p className="mt-1 text-[11px] text-[var(--color-muted)]">
              Dokumen Terverifikasi
            </p>
          </div>

          <div className="flex flex-col items-center p-8">
            <div className="mb-6 rounded-[16px] border-[1.5px] border-gray-100 bg-white p-4 shadow-sm">
              <QRCodeSVG value={currentUrl} size={160} level="M" />
            </div>

            <div className="mb-8 w-full space-y-4">
              <div className="text-center">
                <span className="mb-3 inline-block rounded-full bg-blue-50 px-3 py-1 text-[10px] font-bold text-blue-700 uppercase">
                  {archiveData.fileType}
                </span>
                <h2 className="mb-2 text-[18px] leading-tight font-extrabold text-[var(--color-navy)]">
                  {archiveData.title}
                </h2>
                <p className="text-[12px] text-[var(--color-muted)] italic">
                  {archiveData.description || "Tidak ada deskripsi."}
                </p>
              </div>

              <div className="space-y-3 rounded-[10px] border border-gray-100 bg-gray-50 p-4">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="font-semibold text-[var(--color-muted)]">
                    Nomor Surat:
                  </span>
                  <span className="font-bold text-[var(--color-text-main)]">
                    {archiveData.nomorSurat || "-"}
                  </span>
                </div>
                <div className="flex items-center justify-between text-[11px]">
                  <span className="font-semibold text-[var(--color-muted)]">
                    Tanggal Arsip:
                  </span>
                  <span className="font-bold text-[var(--color-text-main)]">
                    {new Date(archiveData.createdAt).toLocaleDateString(
                      "id-ID",
                      { day: "numeric", month: "long", year: "numeric" },
                    )}
                  </span>
                </div>
                <div className="flex items-center justify-between text-[11px]">
                  <span className="font-semibold text-[var(--color-muted)]">
                    Klasifikasi:
                  </span>
                  <span className="text-right font-bold text-[var(--color-text-main)]">
                    {archiveData.categoryName} <br />{" "}
                    <span className="text-[10px] font-medium text-gray-400">
                      └ {archiveData.subcategoryName}
                    </span>
                  </span>
                </div>
              </div>
            </div>

            <div className="grid w-full grid-cols-2 gap-3">
              <button
                onClick={() => window.open(archiveData.viewUrl, "_blank")}
                className="w-full rounded-[8px] border border-blue-100 bg-blue-50 py-[12px] text-[12px] font-bold text-blue-700 transition-colors hover:bg-blue-100"
              >
                👁️ Lihat Arsip
              </button>
              <button
                onClick={() => (window.location.href = archiveData.downloadUrl)}
                className="w-full rounded-[8px] bg-[var(--color-accent)] py-[12px] text-[12px] font-bold text-white transition-colors hover:bg-[var(--color-accent2)]"
              >
                ⬇️ Unduh Berkas
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-[var(--color-navy)] to-[var(--color-navy3)] p-4">
      <div className="animate-in fade-in w-full max-w-sm rounded-[16px] bg-white p-8 shadow-2xl duration-300">
        <div className="mb-8 text-center">
          <div className="mb-4 inline-flex h-16 w-16 items-center justify-center rounded-full bg-purple-50 text-3xl text-purple-600">
            🔒
          </div>
          <h1 className="text-[18px] font-extrabold text-[var(--color-navy)]">
            Akses Terlindungi
          </h1>
          <p className="mt-2 text-[12px] leading-relaxed text-[var(--color-muted)]">
            Dokumen ini bersifat rahasia. Masukkan{" "}
            <strong className="text-[var(--color-text-main)]">Passkey</strong>{" "}
            yang diberikan oleh instansi untuk membukanya.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <input
              type="password"
              value={passkey}
              onChange={(e) => setPasskey(e.target.value)}
              placeholder="Masukkan Passkey..."
              autoFocus
              required
              className="w-full rounded-[10px] border-[2px] border-gray-200 p-[12px] text-center font-mono text-[16px] tracking-[0.2em] transition-colors outline-none focus:border-purple-500"
            />
          </div>
          <button
            type="submit"
            disabled={verifyMutation.isPending}
            className="w-full rounded-[10px] bg-purple-600 py-[14px] text-[13px] font-bold text-white shadow-lg shadow-purple-600/30 transition-colors hover:bg-purple-700 disabled:opacity-70"
          >
            {verifyMutation.isPending ? "Memverifikasi..." : "Buka Dokumen"}
          </button>
        </form>

        <div className="mt-8 border-t border-gray-100 pt-6 text-center">
          <p className="text-[10px] font-semibold tracking-wider text-gray-400 uppercase">
            Powered by One Archive
          </p>
        </div>
      </div>
    </div>
  );
}

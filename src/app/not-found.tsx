import Link from "next/link";

export default function GlobalNotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-[var(--color-navy)] to-[var(--color-navy3)] p-4 font-sans">
      <div className="animate-in fade-in zoom-in w-[420px] w-full max-w-md rounded-[16px] bg-white px-[36px] py-[48px] text-center shadow-[0_20px_60px_rgba(0,0,0,0.3)] duration-300">
        <div className="mx-auto mb-[20px] flex h-[80px] w-[80px] items-center justify-center rounded-full border-[3px] border-blue-100 bg-blue-50 text-[40px] shadow-inner">
          🧭
        </div>

        <h1 className="mb-[4px] text-[48px] leading-none font-black tracking-tight text-[var(--color-navy)]">
          404
        </h1>
        <h2 className="mb-[12px] text-[16px] font-extrabold text-[var(--color-navy)]">
          Halaman Tidak Ditemukan
        </h2>
        <p className="mb-[32px] text-[12px] leading-relaxed text-[var(--color-muted)]">
          Maaf, rute atau dokumen yang Anda cari tidak tersedia, mungkin telah
          dipindahkan, atau Anda salah memasukkan alamat URL.
        </p>

        <Link
          href="/"
          className="inline-block w-full rounded-[8px] bg-[var(--color-accent)] py-[12px] text-[13px] font-bold text-white shadow-md transition-all hover:-translate-y-0.5 hover:bg-[var(--color-accent2)] hover:shadow-lg active:translate-y-0"
        >
          Kembali ke Beranda
        </Link>

        <div className="mt-[24px] border-t border-gray-100 pt-[16px]">
          <p className="text-[10px] font-semibold tracking-wider text-gray-400 uppercase">
            One Archive System
          </p>
        </div>
      </div>
    </div>
  );
}

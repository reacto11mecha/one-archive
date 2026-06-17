"use client";

import { useState, useEffect } from "react";
import { api, type RouterOutputs } from "~/trpc/react";
import { authClient } from "~/server/better-auth/client";
import Link from "next/link";
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Sector,
  Tooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";

type Archive = RouterOutputs["archive"]["getArchives"][number];

export default function DashboardPage() {
  const { data: session } = authClient.useSession();
  const { data: archivesList, isLoading: isArchivesLoading } =
    api.archive.getArchives.useQuery();
  const { data: classification } =
    api.archive.getAllowedClassifications.useQuery();

  const [isMounted, setIsMounted] = useState(false);
  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (isArchivesLoading) {
    return (
      <div className="text-[12px] text-[var(--color-muted)]">
        Memuat metrik dashboard...
      </div>
    );
  }

  // ==========================================
  // ENGINE KALKULASI STATISTIK (TYPESAFE)
  // ==========================================
  const totalArchives = archivesList?.length || 0;
  const today = new Date();

  // 1. Kalkulasi Jadwal Retensi Arsip (JRA)
  const expiredArchives =
    archivesList?.filter(
      (arc) => arc.retentionDate && new Date(arc.retentionDate) < today,
    ) || [];
  const totalExpired = expiredArchives.length;
  const totalActive = totalArchives - totalExpired;

  // 2. Kalkulasi Volume Arsip Bulan Ini
  const currentMonth = today.getMonth();
  const currentYear = today.getFullYear();
  const newThisMonth =
    archivesList?.filter((arc) => {
      const arcDate = new Date(arc.createdAt);
      return (
        arcDate.getMonth() === currentMonth &&
        arcDate.getFullYear() === currentYear
      );
    }).length || 0;

  // 3. Generate Data Bar Chart (Tren 6 Bulan Terakhir)
  const barChartData = [];
  for (let i = 5; i >= 0; i--) {
    const targetDate = new Date();
    targetDate.setMonth(targetDate.getMonth() - i);

    const monthName = targetDate.toLocaleDateString("id-ID", {
      month: "short",
    });
    const yearNum = targetDate.getFullYear();
    const monthNum = targetDate.getMonth();

    const matchCount =
      archivesList?.filter((arc) => {
        const arcDate = new Date(arc.createdAt);
        return (
          arcDate.getMonth() === monthNum && arcDate.getFullYear() === yearNum
        );
      }).length || 0;

    barChartData.push({
      name: `${monthName} ${yearNum}`,
      "Jumlah Arsip": matchCount,
    });
  }

  // 4. Generate Data Donut Chart Kategori
  const categoryCounts =
    archivesList?.reduce((acc: Record<string, number>, arc) => {
      acc[arc.categoryId] = (acc[arc.categoryId] || 0) + 1;
      return acc;
    }, {}) || {};

  const COLORS = [
    "#2563eb",
    "#10b981",
    "#f59e0b",
    "#ef4444",
    "#8b5cf6",
    "#64748b",
  ];

  const donutChartData =
    classification?.categories
      .map((cat, idx) => {
        const count = categoryCounts[cat.id] || 0;
        return {
          name: `${cat.icon} ${cat.name}`,
          value: count,
          color: COLORS[idx % COLORS.length],
        };
      })
      .filter((data) => data.value > 0) || [];

  const activePercentage =
    totalArchives === 0 ? 0 : Math.round((totalActive / totalArchives) * 100);
  const expiredPercentage =
    totalArchives === 0 ? 0 : Math.round((totalExpired / totalArchives) * 100);

  const recentArchives = [...(archivesList || [])]
    .sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    )
    .slice(0, 5);

  return (
    <div className="space-y-[24px]">
      {/* --- HEADER --- */}
      <div>
        <h2 className="text-[18px] font-bold text-[var(--color-navy)]">
          Selamat datang, {session?.user?.name || "Pengguna"}! 👋
        </h2>
        <p className="text-[12px] text-[var(--color-muted)]">
          Berikut adalah ringkasan statistik arsip digital Anda saat ini.
        </p>
      </div>

      {/* --- BARIS 1: KARTU METRIK UTAMA --- */}
      <div className="grid grid-cols-1 gap-[16px] sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-[12px] border-[1.5px] border-l-[4px] border-[var(--color-border-main)] border-l-blue-500 bg-white p-[18px] shadow-sm">
          <div className="text-[28px] leading-none font-extrabold text-[var(--color-navy)]">
            {totalArchives}
          </div>
          <div className="mt-[6px] text-[11px] font-semibold tracking-wider text-[var(--color-muted)] uppercase">
            Total Dokumen
          </div>
        </div>
        <div className="rounded-[12px] border-[1.5px] border-l-[4px] border-[var(--color-border-main)] border-l-green-500 bg-white p-[18px] shadow-sm">
          <div className="text-[28px] leading-none font-extrabold text-[var(--color-navy)]">
            {totalActive}
          </div>
          <div className="mt-[6px] text-[11px] font-semibold tracking-wider text-[var(--color-muted)] uppercase">
            Arsip Aktif
          </div>
        </div>
        <div className="rounded-[12px] border-[1.5px] border-l-[4px] border-[var(--color-border-main)] border-l-red-500 bg-white p-[18px] shadow-sm">
          <div className="text-[28px] leading-none font-extrabold text-[var(--color-navy)]">
            {totalExpired}
          </div>
          <div className="mt-[6px] text-[11px] font-semibold tracking-wider text-[var(--color-muted)] uppercase">
            Siap Dimusnahkan
          </div>
        </div>
        <div className="rounded-[12px] border-[1.5px] border-l-[4px] border-[var(--color-border-main)] border-l-amber-500 bg-white p-[18px] shadow-sm">
          <div className="text-[28px] leading-none font-extrabold text-[var(--color-navy)]">
            {newThisMonth}
          </div>
          <div className="mt-[6px] text-[11px] font-semibold tracking-wider text-[var(--color-muted)] uppercase">
            Arsip Bulan Ini
          </div>
        </div>
      </div>

      {/* --- BARIS 2: TATA LETAK ASIMETRIS (GRAFIK & RETENSI) --- */}
      <div className="grid grid-cols-1 gap-[20px] lg:grid-cols-3">
        {/* Kolom Kiri: Bar Chart Tren Bulanan (Porsi 2/3) */}
        <div className="flex min-h-[380px] flex-col rounded-[12px] border-[1.5px] border-[var(--color-border-main)] bg-white p-[20px] shadow-sm lg:col-span-2">
          <h3 className="mb-[20px] text-[14px] font-bold text-[var(--color-navy)]">
            Tren Pembuatan Arsip (6 Bulan Terakhir)
          </h3>
          <div className="h-full w-full flex-1">
            {isMounted && (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={barChartData}
                  margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="var(--color-border-main)"
                    opacity={0.3}
                  />
                  <XAxis
                    dataKey="name"
                    tick={{ fontSize: 10 }}
                    stroke="var(--color-muted)"
                  />
                  <YAxis
                    tick={{ fontSize: 10 }}
                    stroke="var(--color-muted)"
                    allowDecimals={false}
                  />
                  <Tooltip
                    formatter={(value) => [`${value} Berkas`, "Volume Masuk"]}
                    cursor={{ fill: "var(--color-off)" }}
                  />
                  <Bar
                    dataKey="Jumlah Arsip"
                    fill="var(--color-accent)"
                    radius={[6, 6, 0, 0]}
                    maxBarSize={50}
                  />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Kolom Kanan: Ditumpuk Donut Chart & Status Retensi (Porsi 1/3) */}
        <div className="flex flex-col gap-[20px] lg:col-span-1">
          {/* Donut Chart: Distribusi Kategori */}
          <div className="flex flex-1 flex-col rounded-[12px] border-[1.5px] border-[var(--color-border-main)] bg-white p-[20px] shadow-sm">
            <h3 className="mb-[16px] text-[14px] font-bold text-[var(--color-navy)]">
              Distribusi Kategori
            </h3>

            {totalArchives === 0 ? (
              <div className="flex flex-1 items-center justify-center text-[12px] text-gray-400 italic">
                Belum ada klasifikasi
              </div>
            ) : (
              <div className="flex flex-1 flex-col items-center justify-center gap-[16px]">
                <div className="relative h-[120px] w-[120px] flex-shrink-0">
                  {isMounted && (
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={donutChartData}
                          cx="50%"
                          cy="50%"
                          innerRadius={42}
                          outerRadius={58}
                          paddingAngle={3}
                          dataKey="value"
                          shape={(props: any) => (
                            <Sector {...props} fill={props.payload.color} />
                          )}
                        />
                        <Tooltip
                          formatter={(value) => [`${value} Dokumen`, "Volume"]}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  )}
                  <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-[20px] leading-none font-black text-[var(--color-navy)]">
                      {totalArchives}
                    </span>
                    <span className="mt-1 text-[9px] font-bold text-[var(--color-muted)] uppercase">
                      Berkas
                    </span>
                  </div>
                </div>

                <div className="max-h-[100px] w-full space-y-[6px] overflow-y-auto pr-1">
                  {donutChartData.map((item, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between text-[11px]"
                    >
                      <div className="mr-2 flex items-center gap-[6px] truncate">
                        <div
                          className="h-[8px] w-[8px] flex-shrink-0 rounded-full"
                          style={{ backgroundColor: item.color }}
                        ></div>
                        <span
                          className="truncate font-semibold text-[var(--color-text-main)]"
                          title={item.name}
                        >
                          {item.name}
                        </span>
                      </div>
                      <span className="flex-shrink-0 font-bold text-[var(--color-muted)]">
                        {Math.round((item.value / totalArchives) * 100)}%
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Indikator Status JRA */}
          <div className="flex flex-col justify-center rounded-[12px] border-[1.5px] border-[var(--color-border-main)] bg-white p-[20px] shadow-sm">
            <h3 className="mb-[14px] text-[14px] font-bold text-[var(--color-navy)]">
              Status Retensi
            </h3>
            <div className="mb-[16px] flex h-[20px] w-full overflow-hidden rounded-[6px] bg-gray-100">
              <div
                className="h-full bg-green-500 transition-all duration-1000"
                style={{ width: `${activePercentage}%` }}
              ></div>
              <div
                className="h-full bg-red-500 transition-all duration-1000"
                style={{ width: `${expiredPercentage}%` }}
              ></div>
            </div>
            <div className="grid grid-cols-2 gap-[12px]">
              <div className="rounded-[8px] border-[1.5px] border-green-100 bg-green-50 p-[10px]">
                <div className="text-[16px] leading-none font-bold text-green-700">
                  {activePercentage}%
                </div>
                <div className="mt-[4px] text-[10px] font-bold text-green-600 uppercase">
                  Arsip Sehat
                </div>
              </div>
              <div className="rounded-[8px] border-[1.5px] border-red-100 bg-red-50 p-[10px]">
                <div className="text-[16px] leading-none font-bold text-red-700">
                  {expiredPercentage}%
                </div>
                <div className="mt-[4px] text-[10px] font-bold text-red-600 uppercase">
                  Kedaluwarsa
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* --- BARIS 3: TABEL AKTIVITAS TERBARU DENGAN LENCANA MASUK/KELUAR --- */}
      <div className="w-full overflow-hidden rounded-[12px] border-[1.5px] border-[var(--color-border-main)] bg-white shadow-sm">
        <div className="flex items-center justify-between border-b-[1.5px] border-[var(--color-border-main)] bg-[var(--color-off)]/50 p-[16px]">
          <div>
            <h3 className="text-[14px] font-bold text-[var(--color-navy)]">
              5 Unggahan Arsip Terakhir
            </h3>
            <p className="mt-1 text-[11px] text-[var(--color-muted)]">
              Daftar dokumen yang baru saja ditambahkan ke dalam sistem.
            </p>
          </div>
          <Link
            href="/app/archive"
            className="rounded-[6px] bg-[var(--color-accent)] px-[12px] py-[6px] text-[11px] font-bold text-white transition-colors hover:bg-[var(--color-accent2)]"
          >
            Lihat Semua Arsip &rarr;
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-[var(--color-border-main)] text-[11px] font-bold tracking-wider text-[var(--color-muted)] uppercase">
                <th className="p-[14px_16px]">Informasi Dokumen</th>
                <th className="p-[14px_16px]">Tanggal Upload</th>
                <th className="p-[14px_16px]">Nama Pengunggah</th>
              </tr>
            </thead>
            <tbody>
              {recentArchives.length === 0 ? (
                <tr>
                  <td
                    colSpan={3}
                    className="p-[30px] text-center text-[12px] text-gray-400 italic"
                  >
                    Belum ada riwayat unggahan arsip.
                  </td>
                </tr>
              ) : (
                recentArchives.map((arc) => (
                  <tr
                    key={arc.id}
                    className="border-b-[1.5px] border-[var(--color-border-main)] transition-colors last:border-0 hover:bg-blue-50/20"
                  >
                    <td className="p-[14px_16px]">
                      {/* 👇 PENAMBAHAN LENCANA MASUK / KELUAR DI TABEL DASHBOARD */}
                      <div className="mb-1 flex items-center gap-2">
                        <span
                          className={`inline-flex items-center rounded-sm px-[6px] py-[2px] text-[9px] font-bold tracking-wider uppercase ${arc.archiveType === "Masuk" ? "bg-blue-100 text-blue-700" : "bg-green-100 text-green-700"}`}
                        >
                          {arc.archiveType === "Masuk"
                            ? "📥 MASUK"
                            : "📤 KELUAR"}
                        </span>
                        <span className="block max-w-[200px] truncate text-[13px] font-bold text-[var(--color-text-main)] sm:max-w-none">
                          {arc.title}
                        </span>
                      </div>
                      <span className="mt-0.5 block text-[11px] text-[var(--color-muted)]">
                        Nomor: {arc.nomorSurat || "-"}
                      </span>
                    </td>
                    <td className="p-[14px_16px]">
                      <span className="inline-block rounded-md bg-gray-100 px-2 py-1 text-[11px] font-semibold text-gray-600">
                        📅{" "}
                        {new Date(arc.createdAt).toLocaleDateString("id-ID", {
                          day: "numeric",
                          month: "long",
                          year: "numeric",
                        })}
                      </span>
                    </td>
                    <td className="p-[14px_16px] text-[12px] font-medium text-[var(--color-navy)]">
                      👤 {arc.uploaderName}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

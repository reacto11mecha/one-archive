import { eq } from "drizzle-orm";
import { db } from "./index";
import * as schema from "./schema";
import { auth } from "../better-auth/config";

async function main() {
  console.log("⏳ Memulai pembersihan database (Resetting)...");

  // Hapus data lama dengan urutan cascade yang aman
  await db.delete(schema.archiveShares);
  await db.delete(schema.archives);
  await db.delete(schema.subcategories);
  await db.delete(schema.roleCategoryAccess);
  await db.delete(schema.account);
  await db.delete(schema.user);
  await db.delete(schema.categories);
  await db.delete(schema.roles);

  console.log("✅ Database bersih. Mulai menyuntikkan data seed baru...");

  // 1. SEED ROLES
  const rolesData = [
    { id: "role_admin", name: "Administrator Utama", isAdmin: true },
    {
      id: "role_kurikulum",
      name: "Bidang Kurikulum & Kesiswaan",
      isAdmin: false,
    },
    { id: "role_admin_umum", name: "Bidang Administrasi Umum", isAdmin: false },
    { id: "role_keuangan", name: "Bidang Keuangan", isAdmin: false },
    { id: "role_sarpras", name: "Bidang Sarana & Prasarana", isAdmin: false },
  ];
  await db.insert(schema.roles).values(rolesData);
  console.log("🌱 Roles fungsional berhasil ditambahkan.");

  // 2. SEED CATEGORIES
  const categoriesData = [
    {
      id: "cat_akademik",
      name: "Arsip Academic",
      icon: "📖",
      colorBadge: "blue",
    },
    {
      id: "cat_kesiswaan",
      name: "Arsip Kesiswaan",
      icon: "👨‍🎓",
      colorBadge: "indigo",
    },
    {
      id: "cat_kepegawaian",
      name: "Arsip Kepegawaian",
      icon: "👥",
      colorBadge: "green",
    },
    {
      id: "cat_keuangan",
      name: "Arsip Keuangan",
      icon: "💰",
      colorBadge: "amber",
    },
    {
      id: "cat_sarpras",
      name: "Arsip Sarana dan Prasarana",
      icon: "🏢",
      colorBadge: "orange",
    },
    {
      id: "cat_surat",
      name: "Arsip Surat Menyurat",
      icon: "✉️",
      colorBadge: "purple",
    },
  ];
  await db.insert(schema.categories).values(categoriesData);
  console.log("🌱 Kategori Utama berhasil ditambahkan.");

  // 3. SEED ROLE CATEGORY ACCESS
  const accessData = [
    { roleId: "role_kurikulum", categoryId: "cat_akademik" },
    { roleId: "role_kurikulum", categoryId: "cat_kesiswaan" },
    { roleId: "role_admin_umum", categoryId: "cat_kepegawaian" },
    { roleId: "role_admin_umum", categoryId: "cat_surat" },
    { roleId: "role_keuangan", categoryId: "cat_keuangan" },
    { roleId: "role_sarpras", categoryId: "cat_sarpras" },
  ];
  await db.insert(schema.roleCategoryAccess).values(accessData);

  // 4. SEED SUBCATEGORIES (Sudah Diperbaiki Huruf Kapitalnya)
  const subcategoriesData = [
    // A. Arsip Akademik
    {
      id: "sub_akademik_rapor",
      categoryId: "cat_akademik",
      name: "Rapor Siswa",
    },
    {
      id: "sub_akademik_nilai",
      categoryId: "cat_akademik",
      name: "Daftar Nilai",
    },
    {
      id: "sub_akademik_jadwal",
      categoryId: "cat_akademik",
      name: "Jadwal Pelajaran",
    },
    {
      id: "sub_akademik_kalender",
      categoryId: "cat_akademik",
      name: "Kalender Akademik",
    },
    {
      id: "sub_akademik_lulus",
      categoryId: "cat_akademik",
      name: "Data Kelulusan",
    },

    // B. Arsip Kesiswaan
    {
      id: "sub_kesiswaan_data",
      categoryId: "cat_kesiswaan",
      name: "Data Siswa",
    },
    {
      id: "sub_kesiswaan_pelanggar",
      categoryId: "cat_kesiswaan",
      name: "Data Pelanggaran Siswa",
    },
    {
      id: "sub_kesiswaan_ekskul",
      categoryId: "cat_kesiswaan",
      name: "Data Ekstrakurikuler",
    },

    // C. Arsip Kepegawaian
    {
      id: "sub_pegawai_guru",
      categoryId: "cat_kepegawaian",
      name: "Data Guru",
    },
    {
      id: "sub_pegawai_staff",
      categoryId: "cat_kepegawaian",
      name: "Data Pegawai",
    },

    // D. Arsip Keuangan
    { id: "sub_keu_bos", categoryId: "cat_keuangan", name: "BOS" },
    {
      id: "sub_keu_bukti",
      categoryId: "cat_keuangan",
      name: "Bukti Pembayaran",
    },
    {
      id: "sub_keu_laporan",
      categoryId: "cat_keuangan",
      name: "Laporan Keuangan Sekolah",
    },

    // E. Arsip Sarana dan Prasarana
    {
      id: "sub_sarpras_inventaris",
      categoryId: "cat_sarpras",
      name: "Inventaris Barang",
    },
    {
      id: "sub_sarpras_ruang",
      categoryId: "cat_sarpras",
      name: "Data Ruang Kelas",
    },

    // F. Arsip Surat Menyurat
    {
      id: "sub_surat_undangan",
      categoryId: "cat_surat",
      name: "Surat Undangan",
    },
    {
      id: "sub_surat_pemberitahuan",
      categoryId: "cat_surat",
      name: "Surat Pemberitahuan",
    },
    { id: "sub_surat_edaran", categoryId: "cat_surat", name: "Surat Edaran" },
    {
      id: "sub_surat_permohonan",
      categoryId: "cat_surat",
      name: "Surat Permohonan",
    },
    {
      id: "sub_surat_kerjasama",
      categoryId: "cat_surat",
      name: "Surat Kerja Sama",
    },
    {
      id: "sub_surat_keterangan",
      categoryId: "cat_surat",
      name: "Surat Keterangan",
    },
    { id: "sub_surat_tugas", categoryId: "cat_surat", name: "Surat Tugas" },
    {
      id: "sub_surat_rekomendasi",
      categoryId: "cat_surat",
      name: "Surat Rekomendasi",
    },
  ];
  await db.insert(schema.subcategories).values(subcategoriesData);
  console.log("🌱 Sub-Kategori (Tingkat 2) berhasil diperbarui.");

  // 5. SEED AKUN DUMMY (Domain Email Berakhir mail.id)
  console.log("Memasukkan data Akun Dummy...");
  const dummyUsers = [
    {
      email: "admin@mail.id",
      name: "rmecha (Admin)",
      roleId: "role_admin",
    },
    {
      email: "kurikulum@mail.id",
      name: "Staff Kurikulum",
      roleId: "role_kurikulum",
    },
    {
      email: "adminumum@mail.id",
      name: "Staff Admin Umum",
      roleId: "role_admin_umum",
    },
    {
      email: "keuangan@mail.id",
      name: "Staff Keuangan",
      roleId: "role_keuangan",
    },
    { email: "sarpras@mail.id", name: "Staff Sarpras", roleId: "role_sarpras" },
  ];

  for (const u of dummyUsers) {
    try {
      const res = await auth.api.signUpEmail({
        body: {
          email: u.email,
          password: "smasatuberjaya",
          name: u.name,
        },
      });

      if (res?.user) {
        await db
          .update(schema.user)
          .set({ roleId: u.roleId, emailVerified: true })
          .where(eq(schema.user.id, res.user.id));

        console.log(`✅ User ${u.email} berhasil dibuat.`);
      }
    } catch (err) {
      console.error(
        `❌ Gagal membuat user ${u.email}:`,
        err instanceof Error ? err.message : err,
      );
    }
  }

  console.log("🎉 Proses Seeding Selesai Sempurna!");
  process.exit(0);
}

main().catch((err) => {
  console.error("❌ Terjadi kesalahan saat seeding:", err);
  process.exit(1);
});

import { eq } from "drizzle-orm";
import { db } from "./index";
import * as schema from "./schema";

// 👇 Sesuaikan path ini dengan lokasi file konfigurasi Better-Auth Anda
import { auth } from "../better-auth/config";

async function main() {
  console.log("🌱 Mulai melakukan seeding database...");

  // 1. SEED ROLES
  console.log("Memasukkan data Role (Unit Pengolah)...");
  const rolesData = [
    { id: "role_admin", name: "Administrator", isAdmin: true },
    { id: "role_kurikulum", name: "Kurikulum", isAdmin: false },
    {
      id: "role_kepegawaian",
      name: "Administrasi Umum / Kepegawaian",
      isAdmin: false,
    },
    { id: "role_keuangan", name: "Keuangan", isAdmin: false },
    { id: "role_sarpras", name: "Sarana dan Prasarana", isAdmin: false },
  ];
  await db
    .insert(schema.roles)
    .values(rolesData)
    .onConflictDoNothing({ target: schema.roles.id });

  // 2. SEED KATEGORI UTAMA
  console.log("Memasukkan data Kategori Utama...");
  const categoriesData = [
    {
      id: "akademik",
      name: "Arsip Akademik",
      icon: "📚",
      colorBadge: "badge-blue",
    },
    {
      id: "kesiswaan",
      name: "Arsip Kesiswaan",
      icon: "🎓",
      colorBadge: "badge-green",
    },
    {
      id: "kepegawaian",
      name: "Arsip Kepegawaian",
      icon: "👥",
      colorBadge: "badge-gold",
    },
    {
      id: "keuangan",
      name: "Arsip Keuangan",
      icon: "💰",
      colorBadge: "badge-red",
    },
    {
      id: "sarpras",
      name: "Arsip Sarana & Prasarana",
      icon: "🏫",
      colorBadge: "badge-purple",
    },
    {
      id: "surat",
      name: "Arsip Surat Menyurat",
      icon: "✉️",
      colorBadge: "badge-gray",
    },
  ];
  await db
    .insert(schema.categories)
    .values(categoriesData)
    .onConflictDoNothing({ target: schema.categories.id });

  // 3. SEED AKSES KATEGORI PER ROLE
  console.log("Memasukkan data Hak Akses Role -> Kategori...");
  const accessData = [
    { roleId: "role_kurikulum", categoryId: "akademik" },
    { roleId: "role_kurikulum", categoryId: "kesiswaan" },
    { roleId: "role_kepegawaian", categoryId: "kepegawaian" },
    { roleId: "role_kepegawaian", categoryId: "surat" },
    { roleId: "role_keuangan", categoryId: "keuangan" },
    { roleId: "role_sarpras", categoryId: "sarpras" },
  ];
  await db
    .insert(schema.roleCategoryAccess)
    .values(accessData)
    .onConflictDoNothing({
      target: [
        schema.roleCategoryAccess.roleId,
        schema.roleCategoryAccess.categoryId,
      ],
    });

  // 4. SEED SUB-KATEGORI
  console.log("Memasukkan data Sub-Kategori...");
  const subcategoriesData = [
    { id: "sub_akd_1", categoryId: "akademik", name: "Rapor Siswa" },
    { id: "sub_akd_2", categoryId: "akademik", name: "Daftar Nilai" },
    { id: "sub_akd_3", categoryId: "akademik", name: "Jadwal Pelajaran" },
    { id: "sub_akd_4", categoryId: "akademik", name: "Kalender Akademik" },
    { id: "sub_akd_5", categoryId: "akademik", name: "Data Kelulusan" },
    { id: "sub_ksw_1", categoryId: "kesiswaan", name: "Data Siswa" },
    {
      id: "sub_ksw_2",
      categoryId: "kesiswaan",
      name: "Data Pelanggaran Siswa",
    },
    { id: "sub_ksw_3", categoryId: "kesiswaan", name: "Data Ekstrakurikuler" },
    { id: "sub_kpg_1", categoryId: "kepegawaian", name: "Data Guru" },
    { id: "sub_kpg_2", categoryId: "kepegawaian", name: "Data Pegawai" },
    { id: "sub_keu_1", categoryId: "keuangan", name: "BOS" },
    { id: "sub_keu_2", categoryId: "keuangan", name: "Bukti Pembayaran" },
    {
      id: "sub_keu_3",
      categoryId: "keuangan",
      name: "Laporan Keuangan Sekolah",
    },
    { id: "sub_srp_1", categoryId: "sarpras", name: "Inventaris Barang" },
    { id: "sub_srp_2", categoryId: "sarpras", name: "Data Ruang Kelas" },
    { id: "sub_srt_1", categoryId: "surat", name: "Surat Masuk" },
    { id: "sub_srt_2", categoryId: "surat", name: "Surat Keluar" },
  ];
  await db
    .insert(schema.subcategories)
    .values(subcategoriesData)
    .onConflictDoNothing({ target: schema.subcategories.id });

  // 5. SEED JENIS SURAT
  console.log("Memasukkan data Jenis Surat...");
  const docTypesData = [
    { id: "doc_sm_1", subcategoryId: "sub_srt_1", name: "Surat Undangan" },
    { id: "doc_sm_2", subcategoryId: "sub_srt_1", name: "Surat Pemberitahuan" },
    { id: "doc_sm_3", subcategoryId: "sub_srt_1", name: "Surat Edaran" },
    { id: "doc_sm_4", subcategoryId: "sub_srt_1", name: "Surat Permohonan" },
    { id: "doc_sm_5", subcategoryId: "sub_srt_1", name: "Surat Kerja Sama" },
    { id: "doc_sk_1", subcategoryId: "sub_srt_2", name: "Surat Undangan" },
    { id: "doc_sk_2", subcategoryId: "sub_srt_2", name: "Surat Keterangan" },
    { id: "doc_sk_3", subcategoryId: "sub_srt_2", name: "Surat Tugas" },
    { id: "doc_sk_4", subcategoryId: "sub_srt_2", name: "Surat Rekomendasi" },
    { id: "doc_sk_5", subcategoryId: "sub_srt_2", name: "Surat Pemberitahuan" },
  ];
  await db
    .insert(schema.documentTypes)
    .values(docTypesData)
    .onConflictDoNothing({ target: schema.documentTypes.id });

  // 6. SEED AKUN DUMMY (Menggunakan Better Auth)
  console.log("Memasukkan data Akun Dummy...");
  const dummyUsers = [
    {
      email: "admin.sma01@mail.com",
      password: "smasatuberjaya",
      name: "Kepala TU",
      roleId: "role_admin",
    },
    {
      email: "user1.kurikulum@mail.com",
      password: "smasatuberjaya",
      name: "User Kurikulum",
      roleId: "role_kurikulum",
    },
  ];

  for (const u of dummyUsers) {
    try {
      // Periksa apakah email sudah terdaftar di database
      const existingUser = await db.query.user.findFirst({
        where: eq(schema.user.email, u.email),
      });

      if (!existingUser) {
        // Buat user melalui Better Auth API agar password di-hash secara otomatis
        const res = await auth.api.signUpEmail({
          body: {
            email: u.email,
            password: u.password,
            name: u.name,
          },
        });

        if (res?.user) {
          // Suntikkan roleId secara manual menggunakan Drizzle ORM
          await db
            .update(schema.user)
            .set({ roleId: u.roleId })
            .where(eq(schema.user.id, res.user.id));

          console.log(`✅ User ${u.email} berhasil dibuat.`);
        }
      } else {
        console.log(`⚠️ User ${u.email} sudah ada, dilewati.`);
      }
    } catch (err) {
      console.error(
        `❌ Gagal membuat user ${u.email}:`,
        err instanceof Error ? err.message : err,
      );
    }
  }

  console.log("✅ Seeding database berhasil diselesaikan!");
  process.exit(0);
}

main().catch((err) => {
  console.error("❌ Terjadi kesalahan saat seeding:", err);
  process.exit(1);
});

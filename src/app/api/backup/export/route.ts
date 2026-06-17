import { NextResponse } from "next/server";
import { db } from "~/server/db";
import * as schema from "~/server/db/schema";
import { eq } from "drizzle-orm";
import { getSession } from "~/server/better-auth/server";

export async function GET() {
  try {
    // ==========================================
    // 1. LAPISAN KEAMANAN: AUTENTIKASI & OTORISASI
    // ==========================================

    // Cek apakah pengguna sudah login
    const session = await getSession();
    if (!session || !session.user) {
      return NextResponse.json(
        {
          success: false,
          message: "Unauthorized: Harap login terlebih dahulu.",
        },
        { status: 401 },
      );
    }

    // Cek apakah pengguna memiliki akses Admin
    const currentUser = await db.query.user.findFirst({
      where: eq(schema.user.id, session.user.id),
      with: { role: true }, // Menarik relasi role untuk mengecek isAdmin
    });

    const isAdmin = currentUser?.role?.isAdmin ?? false;

    if (!isAdmin) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Forbidden: Tindakan ilegal. Hanya Administrator yang dapat mengekspor database.",
        },
        { status: 403 },
      );
    }

    // ==========================================
    // 2. PROSES PENGUMPULAN DATA (Jika Lolos Cek)
    // ==========================================

    const archives = await db.query.archives.findMany();
    const categories = await db.query.categories.findMany();
    const subcategories = await db.query.subcategories.findMany();
    const documentTypes = await db.query.documentTypes.findMany();
    const roles = await db.query.roles.findMany();
    const roleCategoryAccess = await db.query.roleCategoryAccess.findMany();

    const users = await db.query.user.findMany({
      columns: {
        id: true,
        name: true,
        email: true,
        roleId: true,
        emailVerified: true,
        image: true,
      },
    });

    // ==========================================
    // 3. PENGEMASAN DAN PENGIRIMAN JSON
    // ==========================================

    const backupPackage = {
      app: "One Archive",
      version: "1.0.0",
      exportedAt: new Date().toISOString(),
      exportedBy: session.user.email, // Mencatat siapa admin yang mengunduh
      institution: "Unit Instansi SMA",
      data: {
        roles,
        users,
        categories,
        subcategories,
        documentTypes,
        archives,
        roleCategoryAccess,
      },
    };

    const jsonString = JSON.stringify(backupPackage, null, 2);
    const formattedDate = new Date().toISOString().split("T")[0];

    return new NextResponse(jsonString, {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Content-Disposition": `attachment; filename="one_archive_backup_${formattedDate}.json"`,
        Pragma: "no-cache",
        "Cache-Control": "no-store, no-cache, must-revalidate",
      },
    });
  } catch (error) {
    console.error("Gagal mengeksekusi ekspor backup data:", error);
    return NextResponse.json(
      {
        success: false,
        message:
          "Terjadi kesalahan internal server saat mengemas data cadangan.",
      },
      { status: 500 },
    );
  }
}

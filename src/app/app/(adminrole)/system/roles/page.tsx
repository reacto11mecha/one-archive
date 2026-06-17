"use client";

import { useState } from "react";
import type { RouterOutputs } from "~/trpc/react";
import { api } from "~/trpc/react";
import { toast } from "sonner"; // 👈 Import toast dari sonner

type RoleWithAccess = RouterOutputs["system"]["getRolesWithAccess"][number];

export default function RolesManagementPage() {
  const ctx = api.useUtils();
  const { data: roles, isLoading: rolesLoading } =
    api.system.getRolesWithAccess.useQuery();
  const { data: categories, isLoading: categoriesLoading } =
    api.system.getCategories.useQuery();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState<{
    id: string;
    name: string;
    isAdmin: boolean;
    categoryIds: string[];
  }>({
    id: "",
    name: "",
    isAdmin: false,
    categoryIds: [],
  });
  const [isEditMode, setIsEditMode] = useState(false);

  // Mutasi dengan Sonner Toasts
  const upsertRoleMutation = api.system.upsertRole.useMutation({
    onSuccess: () => {
      toast.success(
        isEditMode
          ? "Jabatan berhasil diperbarui!"
          : "Jabatan baru berhasil ditambahkan!",
      );
      setIsModalOpen(false);
      resetForm();
      void ctx.system.getRolesWithAccess.invalidate();
    },
    onError: (err) => {
      toast.error(err.message || "Gagal menyimpan jabatan.");
    },
  });

  const deleteRoleMutation = api.system.deleteRole.useMutation({
    onSuccess: () => {
      toast.success("Jabatan berhasil dihapus dari sistem!");
      void ctx.system.getRolesWithAccess.invalidate();
    },
    onError: (err) => {
      toast.error(err.message || "Gagal menghapus jabatan.");
    },
  });

  const resetForm = () => {
    setFormData({ id: "", name: "", isAdmin: false, categoryIds: [] });
    setIsEditMode(false);
  };

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    if (!isEditMode) {
      const generatedId =
        "role_" +
        val
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "_")
          .replace(/(^_|_$)/g, "");
      setFormData({ ...formData, name: val, id: generatedId });
    } else {
      setFormData({ ...formData, name: val });
    }
  };

  const toggleCategory = (categoryId: string) => {
    setFormData((prev) => ({
      ...prev,
      categoryIds: prev.categoryIds.includes(categoryId)
        ? prev.categoryIds.filter((id) => id !== categoryId)
        : [...prev.categoryIds, categoryId],
    }));
  };

  const handleOpenEdit = (role: RoleWithAccess) => {
    setFormData({
      id: role.id,
      name: role.name,
      isAdmin: role.isAdmin ?? false,
      categoryIds: role.categoryIds,
    });
    setIsEditMode(true);
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.id || !formData.name) {
      toast.warning("ID dan Nama Jabatan wajib diisi.");
      return;
    }
    upsertRoleMutation.mutate(formData);
  };

  if (rolesLoading || categoriesLoading) {
    return (
      <div className="text-[12px] text-[var(--color-muted)]">
        Memuat pengaturan hak akses...
      </div>
    );
  }

  return (
    <div className="relative space-y-4">
      <div className="mb-[16px] flex items-center justify-between">
        <h3 className="text-[14px] font-bold text-[var(--color-navy)]">
          Matriks Peran & Hak Akses
        </h3>
        <button
          onClick={() => {
            resetForm();
            setIsModalOpen(true);
          }}
          className="inline-flex cursor-pointer items-center gap-[5px] rounded-[7px] bg-[var(--color-accent)] px-[14px] py-[7px] text-[12px] font-semibold text-white transition-colors hover:bg-[var(--color-accent2)]"
        >
          + Tambah Jabatan Baru
        </button>
      </div>

      <div className="grid grid-cols-1 gap-[14px] lg:grid-cols-2">
        {roles?.map((role) => (
          <div
            key={role.id}
            className="relative rounded-[10px] border-[1.5px] border-[var(--color-border-main)] bg-white p-[20px] shadow-[0_2px_12px_rgba(13,27,62,0.12)]"
          >
            <div className="mb-[12px] flex items-start justify-between">
              <div>
                <h4 className="flex items-center gap-2 text-[14px] font-bold text-[var(--color-text-main)]">
                  {role.name}
                  {role.isAdmin && (
                    <span className="rounded bg-blue-100 px-[6px] py-[2px] text-[9px] font-bold tracking-wider text-blue-700 uppercase">
                      Administrator
                    </span>
                  )}
                </h4>
                <span className="mt-1 block font-mono text-[11px] text-[var(--color-muted)]">
                  ID: {role.id}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleOpenEdit(role)}
                  className="cursor-pointer rounded p-1.5 text-[var(--color-muted)] transition-colors hover:bg-blue-50 hover:text-[var(--color-accent)]"
                  title="Edit"
                >
                  ✏️
                </button>
                {role.id !== "role_admin" && (
                  <button
                    onClick={() => {
                      if (confirm(`Hapus jabatan ${role.name}?`)) {
                        deleteRoleMutation.mutate({ id: role.id });
                      }
                    }}
                    className="cursor-pointer rounded p-1.5 text-[var(--color-muted)] transition-colors hover:bg-red-50 hover:text-[var(--color-danger)]"
                    title="Hapus"
                  >
                    🗑️
                  </button>
                )}
              </div>
            </div>

            <div className="mt-[16px]">
              <span className="mb-[8px] block text-[11px] font-semibold tracking-wide text-[var(--color-muted)] uppercase">
                Akses Kategori Dokumen:
              </span>
              <div className="flex flex-wrap gap-[6px]">
                {role.categoryIds.length > 0 ? (
                  role.categoryIds.map((catId) => {
                    const cat = categories?.find((c) => c.id === catId);
                    return cat ? (
                      <span
                        key={cat.id}
                        className="inline-flex items-center gap-1 rounded-[6px] border border-gray-200 bg-gray-100 px-[8px] py-[4px] text-[11px] font-medium text-[var(--color-text-main)]"
                      >
                        {cat.icon} {cat.name}
                      </span>
                    ) : null;
                  })
                ) : (
                  <span className="text-[11px] text-[var(--color-muted)] italic">
                    Tidak ada akses kategori spesifik.
                  </span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/45">
          <div className="animate-in fade-in zoom-in max-h-[90vh] w-[560px] overflow-y-auto rounded-[14px] bg-white p-[28px] shadow-[0_20px_60px_rgba(0,0,0,0.3)] duration-200">
            <h2 className="mb-[20px] text-[16px] font-bold text-[var(--color-navy)]">
              {isEditMode ? "Edit Jabatan" : "Tambah Jabatan Baru"}
            </h2>

            <form onSubmit={handleSubmit}>
              <div className="mb-[16px] flex gap-[14px]">
                <div className="flex-1">
                  <label className="mb-[4px] block text-[11px] font-semibold text-[var(--color-navy)]">
                    Nama Jabatan
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={handleNameChange}
                    className="w-full rounded-[7px] border-[1.5px] border-[var(--color-border-main)] p-[9px_12px] text-[12px] transition-colors outline-none focus:border-[var(--color-accent)]"
                  />
                </div>
                <div className="flex-1">
                  <label className="mb-[4px] block text-[11px] font-semibold text-[var(--color-navy)]">
                    ID Sistem (Slug)
                  </label>
                  <input
                    type="text"
                    required
                    readOnly={isEditMode}
                    value={formData.id}
                    onChange={(e) =>
                      setFormData({ ...formData, id: e.target.value })
                    }
                    className={`w-full rounded-[7px] border-[1.5px] border-[var(--color-border-main)] p-[9px_12px] font-mono text-[12px] transition-colors outline-none ${isEditMode ? "cursor-not-allowed bg-gray-100 text-gray-500" : "focus:border-[var(--color-accent)]"}`}
                  />
                </div>
              </div>

              <label className="mb-[20px] flex cursor-pointer items-center gap-[8px] rounded-[8px] border border-blue-100 bg-blue-50/50 p-[10px_14px] transition-colors hover:bg-blue-50">
                <input
                  type="checkbox"
                  checked={formData.isAdmin}
                  onChange={(e) =>
                    setFormData({ ...formData, isAdmin: e.target.checked })
                  }
                  className="h-4 w-4 cursor-pointer rounded border-gray-300 text-[var(--color-accent)] focus:ring-[var(--color-accent)]"
                />
                <div>
                  <span className="block text-[12px] font-bold text-[var(--color-navy)]">
                    Berikan Hak Administrator Utama
                  </span>
                  <span className="block text-[10px] text-[var(--color-muted)]">
                    Pengguna dengan peran ini dapat mengakses menu Sistem dan
                    Backup.
                  </span>
                </div>
              </label>

              <div className="mb-[20px] border-t border-[var(--color-border-main)] pt-[16px]">
                <label className="mb-[10px] block text-[12px] font-bold text-[var(--color-navy)]">
                  Izin Akses Modul Arsip
                </label>
                <div className="grid grid-cols-2 gap-[10px]">
                  {categories?.map((cat) => (
                    <label
                      key={cat.id}
                      className="flex cursor-pointer items-center gap-[8px] rounded-[8px] border-[1.5px] border-[var(--color-border-main)] p-[8px_12px] transition-colors hover:bg-gray-50"
                    >
                      <input
                        type="checkbox"
                        checked={formData.categoryIds.includes(cat.id)}
                        onChange={() => toggleCategory(cat.id)}
                        className="h-[14px] w-[14px] cursor-pointer rounded border-gray-300 text-[var(--color-accent)]"
                      />
                      <span className="text-[12px] font-medium text-[var(--color-text-main)]">
                        {cat.icon} {cat.name}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-[10px] border-t border-[var(--color-border-main)] pt-[16px]">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="inline-flex cursor-pointer items-center gap-[5px] rounded-[7px] border-[1.5px] border-[var(--color-border-main)] bg-[var(--color-off)] px-[14px] py-[7px] text-[12px] font-semibold text-[var(--color-text-main)] transition-colors hover:bg-[var(--color-border-main)]"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={upsertRoleMutation.isPending}
                  className="inline-flex cursor-pointer items-center gap-[5px] rounded-[7px] bg-[var(--color-accent)] px-[14px] py-[7px] text-[12px] font-semibold text-white transition-colors hover:bg-[var(--color-accent2)] disabled:opacity-70"
                >
                  {upsertRoleMutation.isPending
                    ? "Menyimpan..."
                    : "Simpan Hak Akses"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

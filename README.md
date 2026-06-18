# One Archive

Aplikasi ini dibuat untuk memenuhi syarat penugasan Ujian Akhir Semester (UAS) pada Mata Kuliah Manajemen Arsip Digital dengan dosen pengampu Muhammad Ikhwan, S.Pd., M.Pd. pada Program Studi D4 Administrasi Perkantoran Digital Kelas B. Dibuat oleh kelompok 7.

Anggota Kelompok.
1. Alya Nasha Fazila (1712424035)
2. Ezra Khairan Permana (1712424015)
3. Hilyah Sulamayati (1712424098)
4. Mohammad Arief Muharram (1712424063)
5. Rosalina Anggraini (1712424053)

## Arsitektur Aplikasi

```mermaid
flowchart TD
    %% Client Tier
    subgraph Client_Tier ["🖥️ Client Tier (Pengguna)"]
        Browser["Web Browser\n(Admin / Staff TU)"]
    end

    %% Application Tier
    subgraph App_Tier ["⚙️ Application Tier (Server Utama)"]
        UI["Frontend\n(Next.js 15, React 19)"]
        tRPC["API Layer\n(tRPC)"]
        Auth["Modul Autentikasi\n(Better-Auth)"]
        ORM["Drizzle ORM"]
    end

    %% Data & Storage Tier
    subgraph Data_Tier ["💾 Data & Storage Tier"]
        DB[("Basis Data\n(PostgreSQL)")]
        Storage{{"Cloud Storage\n(SeaweedFS - S3 Protocol)"}}
    end

    %% External Services
    subgraph External ["🌐 Layanan Eksternal"]
        Google["Google SSO\n(OAuth Provider)"]
    end

    %% Relasi dan Alur Data
    Browser <-->|"Akses Antarmuka (HTTP/HTTPS)"| UI
    UI <-->|"Type-Safe API Call"| tRPC
    UI <-->|"Manajemen Sesi"| Auth
    
    Auth <-->|"Validasi SSO"| Google
    
    tRPC <-->|"Query Data"| ORM
    ORM <-->|"Baca/Tulis Metadata"| DB
    
    tRPC <-->|"Upload/Hapus Dokumen"| Storage
    Browser -.->|"Unduh via Passkey (Secure Share)"| Storage
```

## Development

Konfigurasi pertama kali

1. Clone repositori ini
2. Jalankan Database PostgreSQL dan SeaweedFS (Contoh pada file [docker-compose.development.yml](docker-compose.development.yml))
3. Copy file [.env.example](.env.example) menjadi [.env](.env). Isi sesuai konfigurasi yang anda miliki.
4. Jalankan `pnpm install` untuk menginstall semua dependency.
5. Jalankan development server dengan perintah `pnpm dev`

Jika sudah selesai, jalankan `pnpm format:write` untuk merapihkan kode yang sudah ditulis sebelum di push ke github.

## Production

Gunakan docker compose berikut ini untuk menjalankan app secara production.

```yaml
services:
  one-archive-web:
    image: rmecha/one-archive:main
    container_name: one-archive-web
    restart: unless-stopped
    ports:
      - "3000:3000"
    depends_on:
      - postgres
      - s3
    environment:
      - BASE_URL=https://one.rmecha.my.id

      - BETTER_AUTH_GOOGLE_CLIENT_ID=GANTI_DENGAN_GOOGLE_CLIENT_ID_ANDA
      - BETTER_AUTH_GOOGLE_CLIENT_SECRET=GANTI_DENGAN_GOOGLE_CLIENT_SECRET_ANDA

      - DATABASE_URL=postgres://root:GANTI_DENGAN_PASSWORD_DB_ANDA@postgres:5432/one-archive

      - BETTER_AUTH_URL=https://one.rmecha.my.id
      - BETTER_AUTH_SECRET=GANTI_DENGAN_SECRET_AUTH_ANDA_YANG_AMAN

      - STORAGE_ENDPOINT=https://s3.rmecha.my.id
      - STORAGE_ACCESS_KEY=GANTI_DENGAN_STORAGE_ACCESS_KEY_ANDA
      - STORAGE_SECRET_KEY=GANTI_DENGAN_STORAGE_SECRET_KEY_ANDA
      - STORAGE_BUCKET_NAME=onearchive
      - STORAGE_REGION=us-east-1

  # Database Utama
  postgres:
    image: postgres:16-alpine
    container_name: one-archive-db
    restart: unless-stopped
    ports:
      - "5431:5432"
    environment:
      POSTGRES_USER: root
      POSTGRES_PASSWORD: GANTI_DENGAN_PASSWORD_DB_ANDA
      POSTGRES_DB: one-archive
    volumes:
      - postgres_data:/var/lib/postgresql/data

  # SeaweedFS Master
  master:
    image: chrislusf/seaweedfs
    container_name: one-archive-sw-master
    restart: unless-stopped
    ports:
      - "9333:9333"
      - "19333:19333"
    command: 'master -ip=master -ip.bind=0.0.0.0'
    volumes:
      - sw_master_data:/data

  # SeaweedFS Volume
  volume:
    image: chrislusf/seaweedfs
    container_name: one-archive-sw-volume
    restart: unless-stopped
    ports:
      - "8081:8080"
      - "18080:18080"
    command: 'volume -ip=volume -master="master:9333" -ip.bind=0.0.0.0 -port=8081'
    depends_on:
      - master
    volumes:
      - sw_volume_data:/data

  # SeaweedFS Filer
  filer:
    image: chrislusf/seaweedfs
    container_name: one-archive-sw-filer
    restart: unless-stopped
    ports:
      - "8888:8888"
      - "18888:18888"
    command: 'filer -ip=filer -master="master:9333" -ip.bind=0.0.0.0'
    tty: true
    stdin_open: true
    depends_on:
      - master
      - volume
    volumes:
      - sw_filer_data:/data

  # SeaweedFS S3 Proxy
  s3:
    image: chrislusf/seaweedfs
    container_name: one-archive-sw-s3
    restart: unless-stopped
    ports:
      - "8333:8333"
    command: 's3 -filer="filer:8888" -ip.bind=0.0.0.0'
    environment:
      - AWS_ACCESS_KEY_ID=GANTI_DENGAN_STORAGE_ACCESS_KEY_ANDA
      - AWS_SECRET_ACCESS_KEY=GANTI_DENGAN_STORAGE_SECRET_KEY_ANDA
    depends_on:
      - master
      - volume
      - filer

volumes:
  postgres_data:
  sw_master_data:
  sw_volume_data:
  sw_filer_data:
```

Paste ke dalam file `docker-compose.yml`, sesuaikan environment variable yang ada, lalu jalankan `docker compose up -d`.

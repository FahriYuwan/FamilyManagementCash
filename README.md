# FamilyManagementCash

Aplikasi PWA (Progressive Web App) untuk pencatatan keuangan keluarga yang memisahkan keuangan rumah tangga dan usaha konveksi. Aplikasi ini dapat di-install di smartphone dan tersinkronisasi secara online.

## 🎯 Tujuan Produk

- Memisahkan keuangan rumah tangga dan usaha konveksi
- Menyediakan catatan per order dengan breakdown biaya detail
- Memberikan laporan keuangan bulanan yang mudah dipahami
- Membantu keluarga melacak utang/piutang
- Menyediakan laporan visual (grafik, pie chart) dan ekspor PDF/Excel
- Memungkinkan custom kategori pengeluaran rumah tangga

## 👥 Target Pengguna

### Ibu Rumah Tangga
- Mencatat pengeluaran rumah tangga (kategori standar & custom)
- Melihat laporan sederhana berupa tabel & grafik

### Ayah Pengusaha Konveksi
- Mencatat pemasukan per order
- Mencatat biaya produksi dengan breakdown detail
- Mengelola catatan utang/piutang pelanggan
- Melihat laba rugi per order & bulanan

## ✨ Fitur Utama

### 🏠 Manajemen Keuangan Rumah Tangga
- Input pemasukan & pengeluaran
- Kategori default (makan, transport, listrik, sekolah, kesehatan)
- Custom kategori (ibu bisa menambah kategori sendiri)
- Laporan pie chart per kategori

### 👔 Manajemen Usaha Konveksi
- Input order baru (nama pelanggan, tanggal, total pemasukan)
- Breakdown biaya per order:
  - Bahan baku
  - Produksi (jahit, sablon, finishing)
  - Tenaga kerja
  - Operasional
- Catatan utang/piutang pelanggan dengan status lunas/belum lunas
- Laporan laba rugi per order & per bulan

### 📊 Ringkasan & Laporan
- Ringkasan harian, mingguan, bulanan
- Grafik pemasukan vs pengeluaran
- Pie chart kategori pengeluaran rumah tangga
- Saldo akhir/tabungan otomatis
- Ekspor laporan ke PDF & Excel

### 👤 Multi-User Internal
- Login via Supabase Auth
- Data tersinkronisasi otomatis
- Role simple: Ayah (akses usaha & rumah tangga), Ibu (akses rumah tangga)

## 🛠️ Tech Stack

- **Frontend**: Next.js + Tailwind CSS
- **Backend & Database**: Supabase (PostgreSQL, Auth, Realtime)
- **Deployment**: Vercel
- **Charts**: Recharts
- **Export**: jsPDF (PDF), SheetJS (Excel)
- **Platform**: PWA (installable di Android/iOS/desktop)

## 📱 User Flow

1. **Ibu** → login → catat pengeluaran rumah tangga (pakai kategori default/custom)
2. **Ayah** → login → tambah order → masukkan pemasukan & breakdown biaya
3. Jika ada pelanggan belum bayar → catat piutang → update status saat lunas
4. Aplikasi otomatis menghitung saldo & laba rugi
5. Akhir bulan → ekspor laporan → pilih PDF/Excel

## 🗄️ Database Structure

### Users
- id (uuid, pk)
- name (text)
- email (text, unique)
- role (enum: 'ayah' | 'ibu')
- created_at (timestamp)

### HouseholdTransactions (Keuangan Rumah Tangga)
- id (uuid, pk)
- user_id (uuid, fk)
- type (enum: 'income' | 'expense')
- amount (numeric)
- category (text)
- note (text)
- date (timestamp)
- created_at (timestamp)

### Orders (Usaha Konveksi)
- id (uuid, pk)
- customer_name (text)
- order_date (timestamp)
- income (numeric)
- status (enum: 'paid' | 'unpaid')
- created_at (timestamp)

### OrderExpenses (Breakdown Biaya per Order)
- id (uuid, pk)
- order_id (uuid, fk)
- category (enum: 'bahan' | 'produksi' | 'tenaga_kerja' | 'operasional' | 'lainnya')
- amount (numeric)
- note (text)
- created_at (timestamp)

### Debts (Utang/Piutang)
- id (uuid, pk)
- order_id (uuid, fk, nullable)
- debtor_name (text)
- amount (numeric)
- status (enum: 'lunas' | 'belum')
- due_date (date)
- created_at (timestamp)

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- npm atau yarn
- Akun Supabase

### Installation

```bash
# Clone repository
git clone <repository-url>
cd FamilyManagementCash

# Install dependencies
npm install

# Setup environment variables
cp .env.example .env.local
# Edit .env.local dengan Supabase credentials

# Run development server
npm run dev
```

### Environment Variables

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## 📖 Skenario Penggunaan

1. **Ibu ingin tahu pengeluaran minggu ini** → lihat pie chart berdasarkan kategori
2. **Ayah ingin tahu keuntungan order seragam sekolah** → buka detail order → lihat breakdown biaya vs pemasukan → laba rugi otomatis muncul
3. **Ada pelanggan belum bayar** → ayah catat piutang → aplikasi tandai status
4. **Keluarga ingin diskusi bulanan** → ekspor laporan ke PDF/Excel

## 🤝 Contributing

This is a personal/academic project for PKL (Praktik Kerja Lapangan).

## 📄 License

Private project for educational purposes.
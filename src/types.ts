/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface AjkRouteStop {
  stopName: string;
  time: string;               // Jam keberangkatan/kedatangan di titik ini (e.g. "06:15")
}

export type TabType = 'order' | 'ajk' | 'status' | 'armada' | 'driver' | 'perbaikan' | 'laporan';

export interface AjkSchedule {
  id: string;
  routeName: string;          // Nama Rute (e.g. Jemputan Karyawan Mandiri Sudirman)
  driverId: string;
  driverName: string;
  armadaId: string;
  plateNumber: string;
  carType: string;
  days: string[];             // Hari Operasional (e.g. ['Senin', 'Selasa', 'Rabu', ...])
  pickupPoint: string;        // Titik Kumpul/Penjemputan Pertama
  officeDestination: string;  // Kantor Tujuan Akhir
  routes: string[];           // [Deprecated] List of routes
  routeStops: AjkRouteStop[]; // Daftar rute & titik pemberhentian yang fleksibel dengan jadwal jam masing-masing
  passengerCount: number;     // Jumlah Penumpang (Karyawan)
  status: 'Aktif' | 'Nonaktif';
}

export interface Armada {
  id: string;
  plateNumber: string;
  carType: string;
  status: 'Ready' | 'Di Perbaiki' | 'Dalam Perjalanan';
  capacity?: number;         // Kapasitas kursi/penumpang
  hasWifi?: boolean;          // Fasilitas WiFi
  hasAc?: boolean;            // Fasilitas AC
  hasUsb?: boolean;           // Fasilitas USB Charger
  hasEntertainment?: boolean; // Fasilitas TV/Audio/Entertainment
  facilityNotes?: string;     // Catatan tambahan fasilitas
}

export interface Driver {
  id: string;
  name: string;
  phoneNumber: string;
  status: 'Ready' | 'Dalam Perjalanan';
}

export interface Order {
  id: string;
  driverId: string;
  driverName: string;
  armadaId: string;
  plateNumber: string;
  carType: string;
  departureDate: string;
  departureTime: string;
  returnDate: string;        // Tanggal selesai / kembali
  returnTime: string;        // Jam selesai / kembali
  origin: string;
  destination: string;
  routes: string[];          // Rute fleksibel (multi-stop)
  status: 'Dalam Perjalanan' | 'Selesai' | 'Dibatalkan';
  revenue: number;           // Pendapatan trip
  operationalCost: number;   // Biaya operasional bensin, tol, dll
}

export interface TripHistory {
  id: string;
  driverName: string;
  plateNumber: string;
  carType: string;
  departureDate: string;
  departureTime: string;
  returnDate?: string;       // Tanggal selesai / kembali (opsional untuk kompatibilitas)
  returnTime?: string;       // Jam selesai / kembali (opsional untuk kompatibilitas)
  origin: string;
  destination: string;
  routes: string[];          // Rute fleksibel (multi-stop)
  status: 'Selesai' | 'Dibatalkan';
  completedAt?: string;
  revenue: number;
  operationalCost: number;
}

export interface DamageItem {
  id: string;
  description: string;
  status: 'Menunggu' | 'Selesai';
  cost: number;
}

export interface MaintenanceRecord {
  id: string;
  armadaId: string;
  plateNumber: string;
  carType: string;
  damages: DamageItem[];     // Fitur multi input kerusakan mobil
  totalCost: number;         // Total biaya perbaikan
  date: string;              // Tanggal mulai perbaikan
  status: 'Dalam Perbaikan' | 'Selesai';
  completedAt?: string;
  description?: string;      // Backwards compatibility
  cost?: number;             // Backwards compatibility
}

export interface AjkInvoice {
  id: string;
  companyName: string;       // Nama perusahaan klien kerja sama
  invoiceNumber: string;     // Nomor invoice tagihan bulanan
  billingMonth: string;      // Periode bulan tagihan (e.g., "Juni 2026")
  amount: number;            // Total nominal tagihan (IDR)
  status: 'Lunas' | 'Belum Bayar' | 'Menunggak'; // Status pembayaran
  dueDate: string;           // Tanggal jatuh tempo
  paymentDate?: string;      // Tanggal lunas dibayarkan
  delinquentMonths: number;  // Jumlah bulan tunggakan (misal: 0, 1, 2, 3+)
  notes?: string;            // Catatan penagihan (e.g., "Menunggu konfirmasi HRD")
}


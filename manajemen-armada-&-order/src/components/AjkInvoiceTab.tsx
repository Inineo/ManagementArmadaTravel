/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { AjkInvoice, AjkSchedule } from '../types';
import {
  Building,
  Plus,
  Trash2,
  Search,
  Check,
  DollarSign,
  FileText,
  AlertCircle,
  CheckCircle,
  Info,
  Printer,
  Download,
  FileSpreadsheet,
  Eye,
  Calendar
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface AjkInvoiceTabProps {
  ajkList: AjkSchedule[];
  ajkInvoiceList: AjkInvoice[];
  onAddAjkInvoice: (invoice: Omit<AjkInvoice, 'id'>) => void;
  onUpdateAjkInvoice: (id: string, updated: Partial<AjkInvoice>) => void;
  onDeleteAjkInvoice: (id: string) => void;
}

// Helper to determine Corporate Client Company Name from AJK Route name
const getCompanyFromRouteName = (routeName: string): string => {
  const lower = routeName.toLowerCase();
  if (lower.includes('bca')) return 'PT Bank BCA Tbk';
  if (lower.includes('mandiri')) return 'PT Bank Mandiri Tbk';
  if (lower.includes('astra')) return 'PT Astra International Tbk';
  if (lower.includes('shopee')) return 'PT Shopee Internasional Indonesia';
  return routeName.replace(/antar jemput|jemputan/gi, '').trim();
};

export default function AjkInvoiceTab({
  ajkList,
  ajkInvoiceList = [],
  onAddAjkInvoice,
  onUpdateAjkInvoice,
  onDeleteAjkInvoice,
}: AjkInvoiceTabProps) {
  const [invoiceSearch, setInvoiceSearch] = useState('');
  const [invoiceStatusFilter, setInvoiceStatusFilter] = useState<'Semua' | 'Lunas' | 'Belum Bayar' | 'Menunggak' | 'Kritis'>('Semua');

  const [showAddInvoiceForm, setShowAddInvoiceForm] = useState(false);
  const [invCompany, setInvCompany] = useState('');
  const [invNumber, setInvNumber] = useState('');
  const [invMonth, setInvMonth] = useState('Juni 2026');
  const [invAmount, setInvAmount] = useState('');
  const [invStatus, setInvStatus] = useState<'Belum Bayar' | 'Menunggak' | 'Lunas'>('Belum Bayar');
  const [invDelinquentMonths, setInvDelinquentMonths] = useState(0);
  const [invNotes, setInvNotes] = useState('');
  const [selectedInvoice, setSelectedInvoice] = useState<AjkInvoice | null>(null);
  const [invDueDate, setInvDueDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 30);
    return d.toISOString().split('T')[0];
  });
  const [invoiceError, setInvoiceError] = useState('');

  // Handle Ctrl+P keyboard shortcut when an invoice is previewed to trigger print instantly
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (selectedInvoice && (e.ctrlKey || e.metaKey) && e.key === 'p') {
        e.preventDefault();
        window.print();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedInvoice]);

  // Months dropdown generator
  const availableMonths = [
    'Maret 2026', 'April 2026', 'Mei 2026', 'Juni 2026', 'Juli 2026', 'Agustus 2026'
  ];

  // Auto pre-filled invoice format generator
  const generateInvoiceNumber = (company: string, monthStr: string) => {
    if (!company) return '';
    const cleanCompany = company
      .replace(/PT|Tbk|Bank|Persero/g, '')
      .trim()
      .substring(0, 4)
      .toUpperCase();
    const monthsMap: Record<string, string> = {
      'Januari': '01', 'Februari': '02', 'Maret': '03', 'April': '04',
      'Mei': '05', 'Juni': '06', 'Juli': '07', 'Agustus': '08',
      'September': '09', 'Oktober': '10', 'November': '11', 'Desember': '12'
    };
    const parts = monthStr.split(' ');
    const monthNum = monthsMap[parts[0]] || '06';
    const yearNum = parts[1] || '2026';
    const randNum = Math.floor(Math.random() * 900) + 100;
    return `INV/AJK/${yearNum}/${monthNum}-${cleanCompany}-${randNum}`;
  };

  const handleCompanySelect = (co: string) => {
    setInvCompany(co);
    if (co) {
      setInvNumber(generateInvoiceNumber(co, invMonth));
    } else {
      setInvNumber('');
    }
  };

  const handleMonthSelect = (mo: string) => {
    setInvMonth(mo);
    if (invCompany) {
      setInvNumber(generateInvoiceNumber(invCompany, mo));
    }
  };

  const handleSubmitInvoice = (e: React.FormEvent) => {
    e.preventDefault();
    setInvoiceError('');

    if (!invCompany.trim()) {
      setInvoiceError('Nama perusahaan klien harus diisi.');
      return;
    }
    if (!invNumber.trim()) {
      setInvoiceError('Nomor invoice wajib diisi.');
      return;
    }
    const amt = parseFloat(invAmount);
    if (isNaN(amt) || amt <= 0) {
      setInvoiceError('Masukkan jumlah tagihan bulanan yang valid (> Rp. 0).');
      return;
    }

    onAddAjkInvoice({
      companyName: invCompany.trim(),
      invoiceNumber: invNumber.trim(),
      billingMonth: invMonth,
      amount: amt,
      status: invStatus,
      dueDate: invDueDate,
      delinquentMonths: invStatus === 'Menunggak' ? (invDelinquentMonths || 1) : 0,
      notes: invNotes.trim() || undefined,
      paymentDate: invStatus === 'Lunas' ? new Date().toISOString().split('T')[0] : undefined
    });

    // Reset
    setInvCompany('');
    setInvNumber('');
    setInvAmount('');
    setInvStatus('Belum Bayar');
    setInvDelinquentMonths(0);
    setInvNotes('');
    setShowAddInvoiceForm(false);
  };

  // Get unique list of company names from existing active AJK schedules for dropdown convenience
  const existingAjkCompanies = Array.from(
    new Set(
      ajkList.map((a) => {
        if (a.routeName.includes('BCA')) return 'PT Bank BCA Tbk';
        if (a.routeName.includes('Mandiri')) return 'PT Bank Mandiri Tbk';
        return a.routeName.replace('Antar Jemput', '').replace('Jemputan', '').trim();
      })
    )
  );

  // --- INVOICE CALCULATIONS ---
  const invoiceStats = ajkInvoiceList.reduce(
    (acc, curr) => {
      acc.total += curr.amount;
      if (curr.status === 'Lunas') {
        acc.paid += curr.amount;
      } else {
        acc.unpaid += curr.amount;
        if (curr.status === 'Menunggak' && curr.delinquentMonths >= 3) {
          acc.critical += curr.amount;
          acc.criticalCount += 1;
        }
      }
      return acc;
    },
    { total: 0, paid: 0, unpaid: 0, critical: 0, criticalCount: 0 }
  );

  // Filter invoices
  const filteredInvoices = ajkInvoiceList.filter((item) => {
    const matchesSearch =
      item.companyName.toLowerCase().includes(invoiceSearch.toLowerCase()) ||
      item.invoiceNumber.toLowerCase().includes(invoiceSearch.toLowerCase()) ||
      item.billingMonth.toLowerCase().includes(invoiceSearch.toLowerCase());

    const matchesFilter =
      invoiceStatusFilter === 'Semua' ||
      (invoiceStatusFilter === 'Lunas' && item.status === 'Lunas') ||
      (invoiceStatusFilter === 'Belum Bayar' && item.status === 'Belum Bayar') ||
      (invoiceStatusFilter === 'Menunggak' && item.status === 'Menunggak') ||
      (invoiceStatusFilter === 'Kritis' && item.status === 'Menunggak' && item.delinquentMonths >= 3);

    return matchesSearch && matchesFilter;
  });

  // Rupiah Formatter Helper
  const formatRp = (val: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(val);
  };

  const formatDateReadable = (dateStr: string) => {
    if (!dateStr) return '';
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      const months = [
        'Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun',
        'Jul', 'Agt', 'Sep', 'Okt', 'Nov', 'Des'
      ];
      return `${parseInt(parts[2], 10)} ${months[parseInt(parts[1], 10) - 1]} ${parts[0]}`;
    }
    return dateStr;
  };

  const handleExportCSV = () => {
    if (filteredInvoices.length === 0) {
      alert('Tidak ada data invoice untuk diexport.');
      return;
    }
    const headers = ['Nomor Invoice', 'Nama Perusahaan Klien', 'Bulan Tagihan', 'Nominal Tagihan (Rp)', 'Tanggal Jatuh Tempo', 'Status Pembayaran', 'Tunggakan (Bulan)', 'Tanggal Pembayaran', 'Catatan'];
    const csvRows = [
      headers.join(','),
      ...filteredInvoices.map(inv => [
        inv.invoiceNumber,
        inv.companyName,
        inv.billingMonth,
        inv.amount.toString(),
        inv.dueDate,
        inv.status,
        inv.delinquentMonths.toString(),
        inv.paymentDate || '-',
        inv.notes || '-'
      ].map(field => `"${field.replace(/"/g, '""')}"`).join(','))
    ];
    
    const csvContent = '\uFEFF' + csvRows.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `Daftar_Tagihan_AJK_${invoiceStatusFilter}_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* QUICK SUMMARY CARDS FOR FINANCES */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 shrink-0">
        {/* Total Invoiced */}
        <div className="bg-white border border-gray-200 rounded-2xl p-5 flex flex-col justify-between shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-extrabold text-gray-400 uppercase tracking-wider">Total Invoice Terbit</span>
            <span className="p-2 bg-indigo-50 text-indigo-500 rounded-lg">
              <FileText size={18} />
            </span>
          </div>
          <div className="mt-4">
            <div className="text-xl lg:text-2xl font-black text-gray-800">
              {formatRp(invoiceStats.total)}
            </div>
            <p className="text-[10px] text-gray-400 font-bold mt-1">
              Akumulasi piutang bulanan terekam ({ajkInvoiceList.length} tagihan)
            </p>
          </div>
        </div>

        {/* Total Paid (Lunas) */}
        <div className="bg-white border border-gray-200 rounded-2xl p-5 flex flex-col justify-between shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-extrabold text-gray-400 uppercase tracking-wider">Pencairan (Lunas)</span>
            <span className="p-2 bg-green-50 text-[#38C172] rounded-lg">
              <CheckCircle size={18} />
            </span>
          </div>
          <div className="mt-4">
            <div className="text-xl lg:text-2xl font-black text-[#38C172]">
              {formatRp(invoiceStats.paid)}
            </div>
            <p className="text-[10px] text-[#38C172] font-black mt-1">
              {(invoiceStats.total > 0 ? (invoiceStats.paid / invoiceStats.total) * 100 : 0).toFixed(0)}% Cashflow Masuk
            </p>
          </div>
        </div>

        {/* Total Outstanding (Belum Lunas) */}
        <div className="bg-white border border-gray-200 rounded-2xl p-5 flex flex-col justify-between shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-extrabold text-gray-400 uppercase tracking-wider">Total Belum Bayar</span>
            <span className="p-2 bg-amber-50 text-amber-500 rounded-lg">
              <DollarSign size={18} />
            </span>
          </div>
          <div className="mt-4">
            <div className="text-xl lg:text-2xl font-black text-amber-500">
              {formatRp(invoiceStats.unpaid)}
            </div>
            <p className="text-[10px] text-amber-500 font-bold mt-1">
              Piutang berjalan &amp; menunggak wajib ditagih
            </p>
          </div>
        </div>

        {/* Critical Overdue Over 3 Months */}
        <div className={`rounded-2xl p-5 flex flex-col justify-between shadow-sm relative overflow-hidden transition-all duration-300 ${
          invoiceStats.criticalCount > 0 
            ? 'bg-red-50 border border-red-200 text-red-900 animate-pulse' 
            : 'bg-white border border-gray-200'
        }`}>
          <div className="flex items-center justify-between">
            <span className={`text-xs font-extrabold uppercase tracking-wider ${invoiceStats.criticalCount > 0 ? 'text-red-700' : 'text-gray-400'}`}>
              Tunggakan Kritis &ge;3 Bln
            </span>
            <span className={`p-2 rounded-lg ${invoiceStats.criticalCount > 0 ? 'bg-red-100 text-red-600' : 'bg-gray-50 text-gray-400'}`}>
              <AlertCircle size={18} />
            </span>
          </div>
          <div className="mt-4">
            <div className={`text-xl lg:text-2xl font-black ${invoiceStats.criticalCount > 0 ? 'text-red-600' : 'text-gray-500'}`}>
              {formatRp(invoiceStats.critical)}
            </div>
            <p className={`text-[10px] font-bold mt-1 ${invoiceStats.criticalCount > 0 ? 'text-red-600' : 'text-gray-400'}`}>
              {invoiceStats.criticalCount} Klien Menunggak &ge; 90 Hari (Segera SP-1!)
            </p>
          </div>
        </div>
      </div>

      {/* CASE STUDY & BRAINSTORMING INFO SECTION */}
      <div className="bg-indigo-50 border border-indigo-150 rounded-2xl p-5 shadow-xs shrink-0 flex gap-4">
        <div className="bg-indigo-100 text-[#2F2FE4] p-3 rounded-xl self-start">
          <AlertCircle size={22} />
        </div>
        <div className="space-y-1.5 flex-1 text-xs">
          <h4 className="font-extrabold text-indigo-950 text-sm">💡 Analisis Solusi: Mengatasi Klien Menunggak Pembayaran &ge;3 Bulan</h4>
          <p className="text-indigo-900 font-semibold leading-relaxed">
            Di lapangan, seringkali perusahaan besar yang kita ajak kerja sama (seperti pabrik/perbankan) memiliki birokrasi keuangan yang lambat, sehingga pembayaran AJK karyawan tertunggak lebih dari 3 bulan.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2 font-bold text-indigo-950">
            <div className="bg-white/80 p-2.5 rounded-lg border border-indigo-100">
              <span className="text-red-600 text-[10px] font-black uppercase block mb-1">Rekomendasi Tindakan 1</span>
              Kirim <strong className="text-indigo-600">Surat Peringatan 1 (SP-1)</strong> secara formal ke Finance &amp; Procurement klien, lengkap dengan lampiran rekap absensi penjemputan.
            </div>
            <div className="bg-white/80 p-2.5 rounded-lg border border-indigo-100">
              <span className="text-red-600 text-[10px] font-black uppercase block mb-1">Rekomendasi Tindakan 2</span>
              Lakukan simulasi penuaan tagihan menggunakan tombol <span className="bg-amber-100 border border-amber-300 px-1 py-0.5 rounded text-[10px]">+1 Bln</span> di bawah untuk melihat peningkatan resiko cashflow.
            </div>
            <div className="bg-white/80 p-2.5 rounded-lg border border-indigo-100">
              <span className="text-red-600 text-[10px] font-black uppercase block mb-1">Rekomendasi Tindakan 3 (Kritis)</span>
              Apabila menginjak bulan ke-4, lakukan <strong className="text-red-600 uppercase">Suspensi Penjemputan Sementara</strong> untuk memaksa HRD klien mengurus pencairan dana operasional kita.
            </div>
          </div>
        </div>
      </div>

      {/* SEARCH AND ACTION BAR FOR INVOICES */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-gray-200 shadow-sm shrink-0">
        
        {/* Left side: Search & Filter selection */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 w-full sm:w-auto flex-1">
          {/* Search box */}
          <div className="relative flex-1 max-w-xs">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">
              <Search size={14} />
            </span>
            <input
              type="text"
              placeholder="Cari klien atau no invoice..."
              value={invoiceSearch}
              onChange={(e) => setInvoiceSearch(e.target.value)}
              className="w-full text-xs font-semibold text-gray-700 bg-gray-50 border border-gray-250 rounded-xl py-2 pl-9 pr-3 focus:outline-none focus:ring-2 focus:ring-[#2F2FE4]/20"
            />
          </div>

          {/* Status Filters buttons */}
          <div className="flex flex-wrap gap-1 bg-gray-100 p-1 rounded-xl border border-gray-200">
            {(['Semua', 'Lunas', 'Belum Bayar', 'Menunggak', 'Kritis'] as const).map((filter) => {
              const isActive = invoiceStatusFilter === filter;
              return (
                <button
                  key={filter}
                  type="button"
                  onClick={() => setInvoiceStatusFilter(filter)}
                  className={`px-3 py-1.5 rounded-lg text-[10px] font-black transition-all cursor-pointer ${
                    isActive 
                      ? 'bg-white text-[#2F2FE4] shadow-xs border border-gray-150' 
                      : 'text-gray-500 hover:text-gray-800'
                  }`}
                >
                  {filter === 'Kritis' ? '⚠️ Kritis (≥3 Bln)' : filter}
                </button>
              );
            })}
          </div>
        </div>

        {/* Actions Container */}
        <div className="flex items-center gap-2 w-full sm:w-auto shrink-0">
          <button
            type="button"
            onClick={handleExportCSV}
            className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 bg-green-600 hover:bg-green-700 text-white text-xs font-extrabold px-4.5 py-2 rounded-xl shadow-xs cursor-pointer transition-all active:scale-95 shrink-0"
            title="Download list tagihan ter-filter dalam format Excel (CSV)"
          >
            <FileSpreadsheet size={16} />
            <span>Export Excel (CSV)</span>
          </button>
          
          <button
            type="button"
            onClick={() => setShowAddInvoiceForm(!showAddInvoiceForm)}
            className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 bg-[#2F2FE4] hover:bg-[#2020D0] text-white text-xs font-extrabold px-4.5 py-2 rounded-xl shadow-xs cursor-pointer transition-all active:scale-95 shrink-0"
          >
            <Plus size={16} />
            <span>Buat Invoice Baru</span>
          </button>
        </div>
      </div>

      {/* CREATE INVOICE FORM PANEL */}
      <AnimatePresence>
        {showAddInvoiceForm && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm"
          >
            <div className="flex items-center justify-between border-b border-gray-100 pb-2 mb-4">
              <h3 className="text-xs font-black text-gray-800 flex items-center gap-1.5">
                <FileText className="text-[#2F2FE4]" size={16} />
                <span>Buat Tagihan Invoice Bulanan Baru</span>
              </h3>
              <button
                onClick={() => setShowAddInvoiceForm(false)}
                className="text-xs text-gray-400 hover:text-gray-650 font-black cursor-pointer"
              >
                Tutup [X]
              </button>
            </div>

            {invoiceError && (
              <div className="text-xs font-semibold text-red-600 bg-red-50 border border-red-200 rounded-lg p-2.5 mb-4 text-center">
                {invoiceError}
              </div>
            )}

            <form onSubmit={handleSubmitInvoice} className="space-y-4">
              {/* Auto-fill from Active Schedules Dropdown */}
              <div className="bg-indigo-50/70 p-4 rounded-xl border border-indigo-150 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
                <div>
                  <span className="text-[10px] font-black text-indigo-700 uppercase flex items-center gap-1">
                    <Building size={12} />
                    <span>🚀 Smart Auto-Billing (Sesuai Jadwal Operasional Aktif)</span>
                  </span>
                  <p className="text-[11px] text-indigo-950 font-bold mt-0.5">
                    Buat tagihan langsung berdasarkan rute layanan AJK harian yang sedang aktif:
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <select
                    onChange={(e) => {
                      const schedId = e.target.value;
                      if (!schedId) return;
                      const sched = ajkList.find(s => s.id === schedId);
                      if (sched) {
                        const comp = getCompanyFromRouteName(sched.routeName);
                        setInvCompany(comp);
                        // Calculate standard billing rate based on capacity and daily trips
                        const calcAmt = Math.max(10000000, (sched.passengerCount || 0) * 850000);
                        setInvAmount(calcAmt.toString());
                        setInvNumber(generateInvoiceNumber(comp, invMonth));
                        setInvNotes(`Tagihan otomatis sesuai jadwal operasional AJK Rute: ${sched.routeName} (Kapasitas: ${sched.passengerCount} Karyawan, Unit: ${sched.carType} [${sched.plateNumber}], Driver: ${sched.driverName}).`);
                      }
                    }}
                    className="border border-indigo-200 rounded-lg p-2 bg-white text-xs font-bold text-indigo-900 focus:ring-2 focus:ring-[#2F2FE4]/10 focus:border-[#2F2FE4]"
                  >
                    <option value="">-- Pilih Jadwal Rute Aktif --</option>
                    {ajkList.filter(s => s.status === 'Aktif').map((sched) => (
                      <option key={sched.id} value={sched.id}>
                        {sched.routeName} ({sched.passengerCount} Pax - {sched.plateNumber})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-xs font-semibold">
                
                {/* Select Company Client */}
                <div>
                  <label className="block text-gray-500 uppercase tracking-wide mb-1">
                    Pilih / Input Perusahaan Klien
                  </label>
                  <select
                    value={invCompany}
                    onChange={(e) => handleCompanySelect(e.target.value)}
                    className="w-full border border-gray-200 rounded-lg p-2.5 bg-gray-50 text-xs font-bold text-gray-700 focus:ring-2 focus:ring-[#2F2FE4]/10 focus:border-[#2F2FE4]"
                  >
                    <option value="">-- Pilih Perusahaan --</option>
                    {existingAjkCompanies.map((co) => (
                      <option key={co} value={co}>
                        {co}
                      </option>
                    ))}
                    <option value="PT Astra International Tbk">PT Astra International Tbk</option>
                    <option value="PT Bank Mandiri Tbk">PT Bank Mandiri Tbk</option>
                    <option value="PT Bank BCA Tbk">PT Bank BCA Tbk</option>
                    <option value="PT Shopee Internasional Indonesia">PT Shopee Internasional Indonesia</option>
                  </select>
                  {/* Free text fallback */}
                  <input
                    type="text"
                    placeholder="Atau ketik kustom nama instansi..."
                    value={invCompany}
                    onChange={(e) => handleCompanySelect(e.target.value)}
                    className="w-full mt-2 border border-gray-200 rounded-lg p-2 bg-gray-50 text-xs text-gray-700 font-semibold"
                  />

                  {invCompany && (() => {
                    const companySchedules = ajkList.filter(s => 
                      s.status === 'Aktif' && 
                      getCompanyFromRouteName(s.routeName).toLowerCase() === invCompany.toLowerCase()
                    );
                    if (companySchedules.length > 0) {
                      const totalPax = companySchedules.reduce((sum, s) => sum + s.passengerCount, 0);
                      const estimatedAmt = Math.max(10000000 * companySchedules.length, totalPax * 850000);
                      return (
                        <div className="mt-2 p-2.5 bg-green-50 rounded-lg border border-green-200 text-[10px] text-green-800 font-bold space-y-1">
                          <div>✨ Terdeteksi {companySchedules.length} Rute Aktif Klien Ini:</div>
                          <ul className="list-disc list-inside font-semibold space-y-0.5 text-green-700">
                            {companySchedules.map(s => (
                              <li key={s.id}>{s.routeName} ({s.passengerCount} Karyawan)</li>
                            ))}
                          </ul>
                          <button
                            type="button"
                            onClick={() => {
                              setInvAmount(estimatedAmt.toString());
                              setInvNotes(`Tagihan Gabungan Bulanan AJK untuk ${companySchedules.length} rute operasional aktif (${totalPax} total karyawan). Rute tercakup: ${companySchedules.map(s => s.routeName).join(', ')}.`);
                            }}
                            className="w-full mt-1.5 text-center bg-green-100 hover:bg-green-200 border border-green-300 text-green-800 text-[10px] font-extrabold py-1 rounded cursor-pointer transition-colors"
                          >
                            Isi Otomatis Nilai Rp {new Intl.NumberFormat('id-ID').format(estimatedAmt)} &amp; Deskripsi
                          </button>
                        </div>
                      );
                    }
                    return null;
                  })()}
                </div>

                {/* Billing Period (Month) */}
                <div>
                  <label className="block text-gray-500 uppercase tracking-wide mb-1">
                    Periode Bulan Tagihan
                  </label>
                  <select
                    value={invMonth}
                    onChange={(e) => handleMonthSelect(e.target.value)}
                    className="w-full border border-gray-200 rounded-lg p-2.5 bg-gray-50 text-xs font-bold text-gray-700 focus:ring-2 focus:ring-[#2F2FE4]/10 focus:border-[#2F2FE4]"
                  >
                    {availableMonths.map((m) => (
                      <option key={m} value={m}>
                        {m}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Auto Generated Invoice Number */}
                <div>
                  <label className="block text-gray-500 uppercase tracking-wide mb-1">
                    Nomor Invoice (Otomatis)
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: INV/AJK/2026/06-BCA-112"
                    value={invNumber}
                    onChange={(e) => setInvNumber(e.target.value)}
                    className="w-full border border-gray-200 rounded-lg p-2.5 bg-gray-50 text-xs font-mono text-gray-800 font-bold"
                  />
                </div>

                {/* Invoice Amount (Rupiah) */}
                <div>
                  <label className="block text-gray-500 uppercase tracking-wide mb-1">
                    Nominal Tagihan Bulanan (Rp)
                  </label>
                  <input
                    type="number"
                    required
                    placeholder="Contoh: 15000000"
                    value={invAmount}
                    onChange={(e) => setInvAmount(e.target.value)}
                    className="w-full border border-gray-200 rounded-lg p-2.5 bg-gray-50 text-xs font-bold"
                  />
                </div>

                {/* Due Date */}
                <div>
                  <label className="block text-gray-500 uppercase tracking-wide mb-1">
                    Tanggal Jatuh Tempo
                  </label>
                  <input
                    type="date"
                    required
                    value={invDueDate}
                    onChange={(e) => setInvDueDate(e.target.value)}
                    className="w-full border border-gray-200 rounded-lg p-2.5 bg-gray-50 text-xs font-bold cursor-pointer"
                  />
                </div>

                {/* Initial Status */}
                <div>
                  <label className="block text-gray-500 uppercase tracking-wide mb-1">
                    Status Awal &amp; Keterlambatan
                  </label>
                  <div className="flex gap-2">
                    <select
                      value={invStatus}
                      onChange={(e) => {
                        const stat = e.target.value as any;
                        setInvStatus(stat);
                        if (stat !== 'Menunggak') setInvDelinquentMonths(0);
                        else if (invDelinquentMonths === 0) setInvDelinquentMonths(1);
                      }}
                      className="flex-1 border border-gray-200 rounded-lg p-2 bg-gray-50 text-xs font-bold text-gray-700"
                    >
                      <option value="Belum Bayar">Belum Bayar</option>
                      <option value="Menunggak">Menunggak (Tunggakan)</option>
                      <option value="Lunas">Lunas</option>
                    </select>

                    {invStatus === 'Menunggak' && (
                      <select
                        value={invDelinquentMonths}
                        onChange={(e) => setInvDelinquentMonths(parseInt(e.target.value, 10))}
                        className="w-24 border border-gray-200 rounded-lg p-2 bg-gray-50 text-xs font-bold text-red-600"
                      >
                        <option value={1}>1 Bulan</option>
                        <option value={2}>2 Bulan</option>
                        <option value={3}>3 Bulan</option>
                        <option value={4}>4 Bulan+</option>
                      </select>
                    )}
                  </div>
                </div>

                {/* Billing notes */}
                <div className="col-span-full">
                  <label className="block text-gray-500 uppercase tracking-wide mb-1">
                    Catatan Internal Penagihan
                  </label>
                  <textarea
                    rows={2}
                    placeholder="Contoh: SLA pembayaran 30 hari. Berkas invoice fisik telah diserahkan kepada Bu Shinta GA klien."
                    value={invNotes}
                    onChange={(e) => setInvNotes(e.target.value)}
                    className="w-full border border-gray-200 rounded-lg p-2 bg-gray-50 text-xs text-gray-700 font-semibold"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2.5 border-t border-gray-100 pt-3">
                <button
                  type="button"
                  onClick={() => setShowAddInvoiceForm(false)}
                  className="bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold px-4 py-2 rounded-xl cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="bg-[#2F2FE4] hover:bg-[#2020D0] text-white font-extrabold px-4.5 py-2 rounded-xl shadow-xs cursor-pointer"
                >
                  Simpan Invoice
                </button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* INVOICES TABLE LIST */}
      <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden flex-1 min-h-0 flex flex-col">
        <div className="p-4 border-b border-gray-100">
          <h3 className="text-xs font-black text-gray-800">Daftar Tagihan Invoice Klien Bulanan</h3>
          <p className="text-[10px] font-semibold text-gray-400 mt-0.5">
            Pantau proses administrasi keuangan, waktu jatuh tempo, dan mitigasi penagihan piutang dari instansi.
          </p>
        </div>

        <div className="overflow-x-auto flex-1">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50/70 border-b border-gray-200 text-xs font-extrabold text-gray-500 uppercase tracking-wider">
                <th className="py-3 px-4">Invoice &amp; Instansi Klien</th>
                <th className="py-3 px-4">Nominal</th>
                <th className="py-3 px-4">Jatuh Tempo</th>
                <th className="py-3 px-4">Tunggakan (Umur Piutang)</th>
                <th className="py-3 px-4">Status &amp; Keterangan</th>
                <th className="py-3 px-4 text-center">Interaktif Simulasi / Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-xs text-gray-750 font-semibold">
              {filteredInvoices.map((inv) => {
                const isCritical = inv.status === 'Menunggak' && inv.delinquentMonths >= 3;
                return (
                  <tr key={inv.id} className={`hover:bg-gray-50/35 transition-colors ${
                    isCritical ? 'bg-red-50/20 hover:bg-red-50/35' : ''
                  }`}>
                    
                    {/* Company & Invoice number */}
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-gray-800 flex items-center gap-1.5">
                        <Building size={14} className="text-gray-450 shrink-0" />
                        <span>{inv.companyName}</span>
                      </div>
                      <div className="text-[10px] text-gray-400 font-mono mt-0.5 font-bold">
                        {inv.invoiceNumber}
                      </div>
                    </td>

                    {/* Amount */}
                    <td className="py-3.5 px-4">
                      <div className="font-black text-gray-800 font-mono">
                        {formatRp(inv.amount)}
                      </div>
                      <span className="text-[9px] text-indigo-600 bg-indigo-50 font-bold px-1.5 py-0.5 rounded border border-indigo-100">
                        {inv.billingMonth}
                      </span>
                    </td>

                    {/* Due Date */}
                    <td className="py-3.5 px-4">
                      <span className="text-gray-500 font-semibold">
                        {formatDateReadable(inv.dueDate)}
                      </span>
                      {inv.status !== 'Lunas' && (
                        <span className="text-[9px] font-bold text-gray-400 block mt-0.5">
                          {(() => {
                            const daysDiff = Math.ceil((new Date(inv.dueDate).getTime() - new Date().getTime()) / (1000 * 3600 * 24));
                            if (daysDiff < 0) {
                              return <span className="text-red-500 font-black">Lewat Jatuh Tempo {Math.abs(daysDiff)} Hari</span>;
                            }
                            return <span>Sisa {daysDiff} Hari</span>;
                          })()}
                        </span>
                      )}
                    </td>

                    {/* Delinquency aging */}
                    <td className="py-3.5 px-4">
                      {inv.status === 'Lunas' ? (
                        <span className="text-green-600 font-extrabold flex items-center gap-1">
                          <CheckCircle size={12} className="text-[#38C172]" />
                          <span>Lunas Dibayar</span>
                        </span>
                      ) : inv.status === 'Belum Bayar' ? (
                        <span className="text-gray-400 font-bold">
                          Belum Jatuh Tempo (0 bln)
                        </span>
                      ) : (
                        <div className="space-y-1">
                          <span className={`text-[10px] font-black px-2 py-0.5 rounded-full inline-block ${
                            inv.delinquentMonths >= 3 
                              ? 'bg-red-100 text-red-600 border border-red-200' 
                              : 'bg-amber-50 text-amber-600 border border-amber-200'
                          }`}>
                            {inv.delinquentMonths} Bulan Menunggak
                          </span>
                          {inv.delinquentMonths >= 3 && (
                            <div className="text-[9px] font-extrabold text-red-600 animate-pulse flex items-center gap-1">
                              <span>⚠️</span>
                              <span>KRITIS: Surat Peringatan (SP) Wajib Dikirim!</span>
                            </div>
                          )}
                        </div>
                      )}
                    </td>

                    {/* Notes and status badge */}
                    <td className="py-3.5 px-4 max-w-xs">
                      <div className="flex items-center gap-1.5 mb-1">
                        <span className={`text-[9px] font-extrabold px-2 py-0.5 rounded-full uppercase ${
                          inv.status === 'Lunas' 
                            ? 'bg-green-100 text-green-600 border border-green-200' 
                            : inv.status === 'Menunggak'
                              ? 'bg-red-50 text-red-600 border border-red-200'
                              : 'bg-amber-50 text-amber-600 border border-amber-200'
                        }`}>
                          {inv.status}
                        </span>
                        {inv.paymentDate && (
                          <span className="text-[9px] text-gray-400 font-semibold font-mono">
                            Lunas: {formatDateReadable(inv.paymentDate)}
                          </span>
                        )}
                      </div>
                      <p className="text-[10px] text-gray-500 font-medium italic line-clamp-2">
                        {inv.notes || '— Tidak ada catatan penagihan —'}
                      </p>
                    </td>

                    {/* Interactive aging and payment actions */}
                    <td className="py-3.5 px-4 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        
                        {/* MARK AS PAID BUTTON */}
                        {inv.status !== 'Lunas' && (
                          <button
                            onClick={() => {
                              onUpdateAjkInvoice(inv.id, {
                                status: 'Lunas',
                                delinquentMonths: 0,
                                paymentDate: new Date().toISOString().split('T')[0],
                                notes: (inv.notes ? `${inv.notes}. ` : '') + 'Pembayaran dilunasi via transfer bank.'
                              });
                            }}
                            className="px-2.5 py-1 bg-green-500 hover:bg-green-600 text-white font-extrabold text-[9px] rounded-md shadow-xs cursor-pointer transition-all active:scale-95 flex items-center gap-0.5"
                            title="Selesaikan Pembayaran (Lunas)"
                          >
                            <Check size={11} />
                            <span>Lunas</span>
                          </button>
                        )}

                        {/* AGING +1 MONTH BUTTON */}
                        {inv.status !== 'Lunas' && (
                          <button
                            onClick={() => {
                              const nextMonths = inv.delinquentMonths + 1;
                              onUpdateAjkInvoice(inv.id, {
                                status: 'Menunggak',
                                delinquentMonths: nextMonths,
                                notes: (inv.notes ? `${inv.notes}. ` : '') + `Umur piutang bertambah otomatis ke bulan ${nextMonths} penunggakan.`
                              });
                            }}
                            className="px-2 py-1 bg-amber-50 hover:bg-amber-100 text-amber-600 border border-amber-300 font-extrabold text-[9px] rounded-md transition-all cursor-pointer"
                            title="Tambah Tunggakan Klien 1 Bulan"
                          >
                            +1 Bln
                          </button>
                        )}

                        {/* AGING -1 MONTH BUTTON */}
                        {inv.status === 'Menunggak' && (
                          <button
                            onClick={() => {
                              const nextMonths = Math.max(0, inv.delinquentMonths - 1);
                              onUpdateAjkInvoice(inv.id, {
                                delinquentMonths: nextMonths,
                                status: nextMonths === 0 ? 'Belum Bayar' : 'Menunggak'
                              });
                            }}
                            className="px-1.5 py-1 bg-gray-50 hover:bg-gray-100 text-gray-500 border border-gray-300 font-extrabold text-[9px] rounded-md transition-all cursor-pointer"
                            title="Kurangi Tunggakan Klien 1 Bulan"
                          >
                            -1 Bln
                          </button>
                        )}

                        {/* VIEW & PRINT BUTTON */}
                        <button
                          onClick={() => {
                            setSelectedInvoice(inv);
                          }}
                          className="px-2 py-1 bg-indigo-50 hover:bg-indigo-100 text-[#2F2FE4] border border-indigo-200 font-extrabold text-[9px] rounded-md transition-all cursor-pointer flex items-center gap-1 shrink-0 animate-fade-in"
                          title="Lihat & Cetak Tagihan Bulanan (PDF)"
                        >
                          <Printer size={11} />
                          <span>Cetak</span>
                        </button>

                        {/* DELETE BUTTON */}
                        <button
                          onClick={() => {
                            if (confirm(`Apakah Anda yakin ingin menghapus invoice ${inv.invoiceNumber}?`)) {
                              onDeleteAjkInvoice(inv.id);
                            }
                          }}
                          className="p-1 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded border border-transparent hover:border-red-200 cursor-pointer transition-colors shrink-0"
                          title="Hapus Invoice"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}

              {filteredInvoices.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-gray-400 font-bold text-xs">
                    <Info size={18} className="inline mr-2 -mt-0.5 text-gray-300" />
                    Tidak ada tagihan invoice yang terdaftar atau cocok.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* PRINT PREVIEW MODAL */}
      <AnimatePresence>
        {selectedInvoice && (
          <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4 bg-gray-950/60 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl border border-gray-200 shadow-2xl w-full max-w-3xl overflow-hidden"
            >
              {/* Modal Top Actions Toolbar */}
              <div className="bg-gray-50 border-b border-gray-150 p-4 flex items-center justify-between no-print-element">
                <span className="text-xs font-black text-gray-800 flex items-center gap-1.5">
                  <FileText className="text-indigo-600" size={16} />
                  <span>Preview Tagihan Bulanan AJK</span>
                </span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      window.print();
                    }}
                    className="bg-[#2F2FE4] hover:bg-[#2020D0] text-white text-xs font-extrabold px-3 py-1.5 rounded-lg shadow-xs flex items-center gap-1 cursor-pointer transition-all active:scale-95"
                  >
                    <Printer size={13} />
                    <span>Cetak / Unduh PDF</span>
                  </button>
                  <button
                    onClick={() => setSelectedInvoice(null)}
                    className="bg-gray-200 hover:bg-gray-300 text-gray-700 text-xs font-bold px-3 py-1.5 rounded-lg cursor-pointer"
                  >
                    Tutup
                  </button>
                </div>
              </div>

              {/* Printable Area Card */}
              <div className="p-6 md:p-8 max-h-[70vh] overflow-y-auto" id="printable-invoice-area">
                
                {/* Print layout styles specifically to isolate printable-invoice-area when window.print() is called */}
                <style dangerouslySetInnerHTML={{__html: `
                  @media print {
                    body * {
                      visibility: hidden !important;
                    }
                    #printable-invoice-area, #printable-invoice-area * {
                      visibility: visible !important;
                    }
                    #printable-invoice-area {
                      position: absolute !important;
                      left: 0 !important;
                      top: 0 !important;
                      width: 100% !important;
                      max-height: none !important;
                      overflow: visible !important;
                      padding: 0 !important;
                      margin: 0 !important;
                      background: white !important;
                    }
                    .no-print-element {
                      display: none !important;
                    }
                  }
                `}} />

                {/* Invoice Sheet */}
                <div className="border border-gray-200 rounded-2xl p-6 md:p-8 bg-white shadow-xs space-y-6">
                  
                  {/* Letterhead */}
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b-2 border-gray-100 pb-5">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <div className="bg-[#2F2FE4] p-1.5 rounded-lg text-white">
                          <Building size={18} />
                        </div>
                        <span className="text-sm font-black tracking-tight text-gray-900 uppercase">PT Armada Trans Logistik</span>
                      </div>
                      <p className="text-[10px] text-gray-400 font-semibold max-w-xs leading-relaxed">
                        Penyedia Layanan Bus Antar Jemput Karyawan (AJK) &amp; Solusi Logistik Korporat Terpercaya.<br />
                        Jl. Boulevard Barat No. 88, Kelapa Gading, Jakarta Utara.<br />
                        Telp: (021) 4588-9000 | Email: billing@armadatrans.com
                      </p>
                    </div>
                    <div className="text-right md:self-start">
                      <h2 className="text-lg font-black text-[#2F2FE4] tracking-tight uppercase">INVOICE</h2>
                      <div className="text-[10px] font-mono text-gray-400 mt-1 font-bold">
                        No: {selectedInvoice.invoiceNumber}
                      </div>
                      <div className="mt-2.5">
                        {selectedInvoice.status === 'Lunas' ? (
                          <span className="px-3 py-1 bg-green-100 border border-green-200 text-green-700 text-[10px] font-black rounded-full uppercase tracking-wider">
                            ✓ PAID / LUNAS
                          </span>
                        ) : (
                          <span className="px-3 py-1 bg-amber-100 border border-amber-200 text-amber-700 text-[10px] font-black rounded-full uppercase tracking-wider">
                            ⌛ UNPAID / BELUM LUNAS
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Billing Details Metadata */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                    <div className="space-y-1 bg-gray-50 p-3 rounded-xl border border-gray-150">
                      <span className="text-[9px] font-extrabold text-gray-400 uppercase tracking-wider block">Ditagihkan Kepada (Klien):</span>
                      <strong className="text-gray-800 text-xs block">{selectedInvoice.companyName}</strong>
                      <p className="text-[10px] text-gray-500 font-semibold leading-relaxed">
                        Divisi Keuangan / GA / HRD Procurement<br />
                        Kemitraan Kontrak Layanan AJK Armada Trans
                      </p>
                    </div>

                    <div className="space-y-1 font-semibold text-[10px] text-gray-500 pl-2">
                      <div className="flex justify-between border-b border-gray-100 py-1">
                        <span>Periode Tagihan:</span>
                        <strong className="text-gray-800 font-bold">{selectedInvoice.billingMonth}</strong>
                      </div>
                      <div className="flex justify-between border-b border-gray-100 py-1">
                        <span>Tanggal Terbit:</span>
                        <strong className="text-gray-800 font-bold">01 {selectedInvoice.billingMonth}</strong>
                      </div>
                      <div className="flex justify-between border-b border-gray-100 py-1">
                        <span>Jatuh Tempo:</span>
                        <strong className="text-red-600 font-black">{formatDateReadable(selectedInvoice.dueDate)}</strong>
                      </div>
                      {selectedInvoice.paymentDate && (
                        <div className="flex justify-between border-b border-gray-100 py-1 text-green-600">
                          <span>Tanggal Pembayaran:</span>
                          <strong className="font-black">{formatDateReadable(selectedInvoice.paymentDate)}</strong>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Invoice Line Items */}
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="bg-gray-100/70 border-b border-gray-200 text-[10px] font-black text-gray-500 uppercase tracking-wider">
                          <th className="py-2.5 px-3">Deskripsi Layanan Kontrak</th>
                          <th className="py-2.5 px-3 text-center">Durasi</th>
                          <th className="py-2.5 px-3 text-right">Harga Satuan</th>
                          <th className="py-2.5 px-3 text-right">Total Tagihan</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100 font-semibold text-gray-750">
                        <tr>
                          <td className="py-3 px-3">
                            <div className="font-bold text-gray-800">Layanan Antar Jemput Karyawan (AJK) Bulanan</div>
                            <div className="text-[10px] text-gray-500 mt-1 leading-relaxed max-w-md font-medium italic">
                              {selectedInvoice.notes || `Kontrak layanan angkutan harian terjadwal untuk periode ${selectedInvoice.billingMonth}.`}
                            </div>
                            
                            {/* Dynamically display active operational routes of this client in the print sheet */}
                            {(() => {
                              const relatedRoutes = ajkList.filter(s => 
                                getCompanyFromRouteName(s.routeName).toLowerCase() === selectedInvoice.companyName.toLowerCase()
                              );
                              if (relatedRoutes.length > 0) {
                                return (
                                  <div className="mt-2.5 p-2 bg-indigo-50/50 rounded-lg border border-indigo-100 space-y-1 no-print-element">
                                    <span className="text-[9px] font-black text-indigo-800 uppercase block">Rincian Rute Operasional Aktif:</span>
                                    <ul className="text-[9px] text-gray-600 list-disc list-inside space-y-0.5">
                                      {relatedRoutes.map(r => (
                                        <li key={r.id}>
                                          <strong>{r.routeName}</strong> ({r.passengerCount} Pax) - Unit {r.carType} ({r.plateNumber}) - Driver: {r.driverName}
                                        </li>
                                      ))}
                                    </ul>
                                  </div>
                                );
                              }
                              return null;
                            })()}
                          </td>
                          <td className="py-3 px-3 text-center">1 Bulan</td>
                          <td className="py-3 px-3 text-right font-mono">{formatRp(selectedInvoice.amount)}</td>
                          <td className="py-3 px-3 text-right font-mono font-black text-gray-800">{formatRp(selectedInvoice.amount)}</td>
                        </tr>

                        <tr className="bg-gray-50 font-black">
                          <td colSpan={3} className="py-3 px-3 text-right text-[10px] uppercase tracking-wider text-gray-400">Total Pembayaran (IDR)</td>
                          <td className="py-3 px-3 text-right font-mono text-sm text-[#2F2FE4] font-black">{formatRp(selectedInvoice.amount)}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  {/* Payment Instructions & Sign-off */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 text-xs border-t border-gray-100">
                    <div className="space-y-1 bg-indigo-50/40 p-3.5 rounded-xl border border-indigo-100">
                      <span className="text-[9px] font-extrabold text-indigo-800 uppercase tracking-wider block">⚠️ Instruksi Pembayaran (Bank Transfer):</span>
                      <p className="text-[10px] text-indigo-950 font-semibold leading-relaxed">
                        Pembayaran mohon ditransfer penuh ke rekening resmi korporat berikut:<br />
                        Bank Penerima: <strong className="text-indigo-700">Bank Mandiri</strong><br />
                        No. Rekening: <strong className="text-indigo-700 font-mono">124-000-9988-771</strong><br />
                        Atas Nama: <strong>PT Armada Trans Logistik</strong><br />
                        <span className="text-gray-400 italic block mt-1">Harap kirim bukti transfer ke billing@armadatrans.com untuk verifikasi cepat.</span>
                      </p>
                    </div>

                    <div className="text-center md:text-right flex flex-col justify-between items-center md:items-end h-32">
                      <div className="text-[10px] text-gray-400 font-bold">
                        Jakarta, {new Date().toLocaleDateString('id-ID', {day: 'numeric', month: 'long', year: 'numeric'})}
                      </div>
                      
                      <div className="relative flex flex-col items-center">
                        {/* Stempel / Stamp decoration block */}
                        <div className="absolute -top-6 border-2 border-indigo-500/30 rounded-full px-4 py-1 text-indigo-500/30 font-black text-[9px] uppercase tracking-widest rotate-12 select-none">
                          PT ARMADA TRANS LOGISTIK
                        </div>
                        <div className="text-xs font-black text-gray-800 underline">
                          Santi Rahayu, M.Ak
                        </div>
                        <div className="text-[9px] text-gray-400 font-bold mt-0.5">
                          Finance &amp; Billing Department Head
                        </div>
                      </div>
                    </div>
                  </div>

                </div>
              </div>

              {/* Modal footer */}
              <div className="bg-gray-50 border-t border-gray-150 p-4 flex justify-end gap-2.5 no-print-element">
                <button
                  onClick={() => setSelectedInvoice(null)}
                  className="bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-xs px-4 py-2 rounded-xl cursor-pointer"
                >
                  Tutup
                </button>
                <button
                  onClick={() => window.print()}
                  className="bg-[#2F2FE4] hover:bg-[#2020D0] text-white font-extrabold text-xs px-4.5 py-2 rounded-xl shadow-xs flex items-center gap-1.5 cursor-pointer"
                >
                  <Printer size={14} />
                  <span>Cetak Tagihan</span>
                </button>
              </div>

            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

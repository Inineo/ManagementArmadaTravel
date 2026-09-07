/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Order, TripHistory, MaintenanceRecord, AjkInvoice } from '../types';
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  FileSpreadsheet,
  AlertTriangle,
  CheckCircle2,
  PieChart,
  Activity,
  ShieldCheck,
  Building2,
  Truck,
  Wrench,
  Info,
  Calendar,
  Filter
} from 'lucide-react';

interface LaporanKeuanganProps {
  ordersList: Order[];
  historyList: TripHistory[];
  maintenanceList: MaintenanceRecord[];
  ajkInvoiceList: AjkInvoice[];
}

type PeriodFilterType = 'semua' | 'bulan_ini' | 'tahun_2026' | 'custom';

export default function LaporanKeuangan({
  ordersList = [],
  historyList = [],
  maintenanceList = [],
  ajkInvoiceList = [],
}: LaporanKeuanganProps) {
  const [periodFilter, setPeriodFilter] = useState<PeriodFilterType>('semua');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');

  // Helper to filter dates
  const isDateInFilter = (dateStr: string | undefined): boolean => {
    if (!dateStr) return true;
    if (periodFilter === 'semua') return true;

    // Standardize date comparison
    // Handles formats like "2026-06-15" or "Juni 2026"
    if (periodFilter === 'bulan_ini') {
      const isJune2026 =
        dateStr.includes('2026-06') ||
        dateStr.toLowerCase().includes('juni 2026') ||
        dateStr.includes('06-2026') ||
        dateStr.includes('2026/06');
      return isJune2026;
    }

    if (periodFilter === 'tahun_2026') {
      return dateStr.includes('2026');
    }

    if (periodFilter === 'custom') {
      if (!customStartDate && !customEndDate) return true;
      // Try parsing date string
      const targetDate = new Date(dateStr);
      if (isNaN(targetDate.getTime())) return true; // fallback if month name format

      if (customStartDate) {
        const start = new Date(customStartDate);
        if (targetDate < start) return false;
      }
      if (customEndDate) {
        const end = new Date(customEndDate);
        end.setHours(23, 59, 59, 999);
        if (targetDate > end) return false;
      }
      return true;
    }

    return true;
  };

  // 1. Calculate Filtered Data
  const filteredHistory = historyList.filter(
    (h) => isDateInFilter(h.departureDate) || isDateInFilter(h.completedAt)
  );
  const filteredOrders = ordersList.filter((o) => isDateInFilter(o.departureDate));
  const filteredMaintenance = maintenanceList.filter((m) => isDateInFilter(m.date));
  const filteredAjkInvoices = ajkInvoiceList.filter(
    (inv) => isDateInFilter(inv.billingMonth) || isDateInFilter(inv.dueDate) || isDateInFilter(inv.paymentDate)
  );

  // 2. Revenue Calculations
  const completedTrips = filteredHistory.filter((h) => h.status === 'Selesai');
  const revenueTripOrder = completedTrips.reduce((sum, h) => sum + (h.revenue || 0), 0);
  const activeTripEstimatedRevenue = filteredOrders
    .filter((o) => o.status === 'Dalam Perjalanan')
    .reduce((sum, o) => sum + (o.revenue || 0), 0);

  const ajkPaidInvoices = filteredAjkInvoices.filter((inv) => inv.status === 'Lunas');
  const revenueAjkPaid = ajkPaidInvoices.reduce((sum, inv) => sum + inv.amount, 0);

  const totalGrossIncome = revenueTripOrder + revenueAjkPaid;

  // 3. Expense Calculations
  const opsCostTrips = completedTrips.reduce((sum, h) => sum + (h.operationalCost || 0), 0);
  const maintenanceCostTotal = filteredMaintenance.reduce((sum, m) => sum + (m.totalCost || 0), 0);
  const totalExpenses = opsCostTrips + maintenanceCostTotal;

  // 4. Net Profit & Margins
  const netProfit = totalGrossIncome - totalExpenses;
  const profitMarginPercent = totalGrossIncome > 0 ? ((netProfit / totalGrossIncome) * 100).toFixed(1) : '0';

  // 5. AJK Arrears Calculations
  const ajkUnpaidInvoices = filteredAjkInvoices.filter((inv) => inv.status === 'Belum Bayar');
  const ajkDelinquentInvoices = filteredAjkInvoices.filter((inv) => inv.status === 'Menunggak');
  const ajkCriticalInvoices = filteredAjkInvoices.filter(
    (inv) => inv.status === 'Menunggak' && inv.delinquentMonths >= 3
  );

  const totalAjkUnpaidAmount = ajkUnpaidInvoices.reduce((sum, inv) => sum + inv.amount, 0);
  const totalAjkDelinquentAmount = ajkDelinquentInvoices.reduce((sum, inv) => sum + inv.amount, 0);
  const totalAjkCriticalAmount = ajkCriticalInvoices.reduce((sum, inv) => sum + inv.amount, 0);
  const totalOutstandingAjk = totalAjkUnpaidAmount + totalAjkDelinquentAmount;

  // 6. Evaluate Financial Health Status
  let healthStatus: 'Sangat Sehat' | 'Perlu Perhatian' | 'Risiko Tinggi' = 'Sangat Sehat';
  let healthColor = 'text-emerald-600 bg-emerald-50 border-emerald-200';
  let healthBadgeColor = 'bg-emerald-500';

  if (netProfit < 0 || totalAjkCriticalAmount > 20000000) {
    healthStatus = 'Risiko Tinggi';
    healthColor = 'text-red-600 bg-red-50 border-red-200';
    healthBadgeColor = 'bg-red-500';
  } else if (totalAjkDelinquentAmount > 15000000 || (totalGrossIncome > 0 && Number(profitMarginPercent) < 20)) {
    healthStatus = 'Perlu Perhatian';
    healthColor = 'text-amber-600 bg-amber-50 border-amber-200';
    healthBadgeColor = 'bg-amber-500';
  }

  // Rupiah Formatter
  const formatRp = (val: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(val);
  };

  // Export to Excel Functionality (Formatted HTML Spreadsheet)
  const handleExportExcel = () => {
    const todayStr = new Date().toISOString().split('T')[0];
    const periodLabel =
      periodFilter === 'semua'
        ? 'Semua Periode'
        : periodFilter === 'bulan_ini'
        ? 'Bulan Juni 2026'
        : periodFilter === 'tahun_2026'
        ? 'Tahun 2026'
        : `Custom (${customStartDate || 'Awal'} s/d ${customEndDate || 'Sekarang'})`;

    const printDate = new Date().toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });

    const htmlContent = `
      <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
      <head>
        <meta charset="utf-8">
        <!--[if gte mso 9]>
        <xml>
         <x:ExcelWorkbook>
          <x:ExcelWorksheets>
           <x:ExcelWorksheet>
            <x:Name>Laporan Keuangan</x:Name>
            <x:WorksheetOptions>
             <x:DisplayGridlines/>
            </x:WorksheetOptions>
           </x:ExcelWorksheet>
          </x:ExcelWorksheets>
         </x:ExcelWorkbook>
        </xml>
        <![endif]-->
        <style>
          body { font-family: Calibri, Arial, sans-serif; font-size: 11pt; }
          table { border-collapse: collapse; width: 100%; margin-bottom: 20px; }
          th, td { border: 1px solid #CBD5E1; padding: 8px 12px; text-align: left; vertical-align: middle; }
          .header-title { background-color: #1E293B; color: #FFFFFF; font-size: 14pt; font-weight: bold; text-align: center; padding: 12px; }
          .sub-header { background-color: #F8FAFC; color: #475569; font-size: 10pt; font-weight: bold; text-align: center; padding: 6px; }
          .section-banner { background-color: #2F2FE4; color: #FFFFFF; font-size: 11pt; font-weight: bold; padding: 8px 12px; }
          .th-bg { background-color: #E2E8F0; color: #0F172A; font-weight: bold; text-align: center; }
          .text-right { text-align: right; }
          .text-center { text-align: center; }
          .text-bold { font-weight: bold; }
          .total-row { background-color: #F1F5F9; font-weight: bold; border-top: 2px solid #1E293B; border-bottom: 2px solid #1E293B; }
          .status-sehat { color: #166534; font-weight: bold; }
          .status-perhatian { color: #9A3412; font-weight: bold; }
          .status-bahaya { color: #991B1B; font-weight: bold; }
        </style>
      </head>
      <body>

        <!-- TITLE BANNER -->
        <table>
          <tr>
            <td colspan="7" class="header-title">LAPORAN EVALUASI KEUANGAN & PEMASUKAN ARMADA TRANSPORTASI</td>
          </tr>
          <tr>
            <td colspan="7" class="sub-header">Periode Laporan: ${periodLabel} &nbsp;|&nbsp; Tanggal Cetak: ${printDate}</td>
          </tr>
        </table>

        <!-- SPACER 1 CELL -->
        <table><tr><td colspan="7" style="border:none; height: 16px;"></td></tr></table>

        <!-- EXECUTIVE SUMMARY -->
        <table>
          <tr>
            <td colspan="3" class="section-banner">1. RINGKASAN KINERJA KEUANGAN (EXECUTIVE SUMMARY)</td>
          </tr>
          <tr>
            <td width="40%" class="text-bold">Status Kesehatan Keuangan</td>
            <td colspan="2" class="${healthStatus === 'Sangat Sehat' ? 'status-sehat' : healthStatus === 'Perlu Perhatian' ? 'status-perhatian' : 'status-bahaya'}">
              ${healthStatus}
            </td>
          </tr>
          <tr>
            <td class="text-bold">Total Pemasukan Kotor (Gross Revenue)</td>
            <td colspan="2" class="text-right text-bold" style="color: #166534;">${formatRp(totalGrossIncome)}</td>
          </tr>
          <tr>
            <td class="text-bold">Total Pengeluaran Operasional & Maintenance</td>
            <td colspan="2" class="text-right text-bold" style="color: #991B1B;">${formatRp(totalExpenses)}</td>
          </tr>
          <tr class="total-row">
            <td class="text-bold">Laba Bersih Operasional (Net Profit)</td>
            <td colspan="2" class="text-right text-bold" style="color: #2F2FE4;">${formatRp(netProfit)} (Margin: ${profitMarginPercent}%)</td>
          </tr>
          <tr>
            <td class="text-bold">Total Piutang / Tunggakan AJK Korporat</td>
            <td colspan="2" class="text-right text-bold" style="color: #D97706;">${formatRp(totalOutstandingAjk)}</td>
          </tr>
        </table>

        <!-- SPACER 1 CELL -->
        <table><tr><td colspan="7" style="border:none; height: 16px;"></td></tr></table>

        <!-- REVENUE BREAKDOWN -->
        <table>
          <tr>
            <td colspan="3" class="section-banner">2. RINCIAN PEMASUKAN (REVENUE BREAKDOWN)</td>
          </tr>
          <tr class="th-bg">
            <td width="50%">Kategori Pemasukan</td>
            <td width="20%">Jumlah Transaksi</td>
            <td width="30%">Total Nominal (Rp)</td>
          </tr>
          <tr>
            <td>Hasil Order Trip Reguler (Selesai)</td>
            <td class="text-center">${completedTrips.length} Trip</td>
            <td class="text-right text-bold">${formatRp(revenueTripOrder)}</td>
          </tr>
          <tr>
            <td>Pencairan Invoice AJK (Lunas)</td>
            <td class="text-center">${ajkPaidInvoices.length} Invoice</td>
            <td class="text-right text-bold">${formatRp(revenueAjkPaid)}</td>
          </tr>
          <tr>
            <td>Estimasi Order Berjalan (Dalam Perjalanan)</td>
            <td class="text-center">${filteredOrders.filter((o) => o.status === 'Dalam Perjalanan').length} Trip</td>
            <td class="text-right">${formatRp(activeTripEstimatedRevenue)}</td>
          </tr>
          <tr class="total-row">
            <td class="text-bold">TOTAL PEMASUKAN REALISASI</td>
            <td class="text-center text-bold">${completedTrips.length + ajkPaidInvoices.length} Transaksi</td>
            <td class="text-right text-bold" style="color: #166534;">${formatRp(totalGrossIncome)}</td>
          </tr>
        </table>

        <!-- SPACER 1 CELL -->
        <table><tr><td colspan="7" style="border:none; height: 16px;"></td></tr></table>

        <!-- EXPENSE BREAKDOWN -->
        <table>
          <tr>
            <td colspan="3" class="section-banner">3. RINCIAN PENGELUARAN (EXPENSE BREAKDOWN)</td>
          </tr>
          <tr class="th-bg">
            <td width="40%">Jenis Pengeluaran</td>
            <td width="30%">Keterangan Deskripsi</td>
            <td width="30%">Total Nominal (Rp)</td>
          </tr>
          <tr>
            <td>Biaya Operasional Trip</td>
            <td>Bensin, Tol, Uang Makan Driver</td>
            <td class="text-right text-bold">${formatRp(opsCostTrips)}</td>
          </tr>
          <tr>
            <td>Biaya Perbaikan & Maintenance Armada</td>
            <td>Perawatan & Sparepart Bengkel (${filteredMaintenance.length} Record)</td>
            <td class="text-right text-bold">${formatRp(maintenanceCostTotal)}</td>
          </tr>
          <tr class="total-row">
            <td colspan="2" class="text-bold">TOTAL PENGELUARAN OPERASIONAL</td>
            <td class="text-right text-bold" style="color: #991B1B;">${formatRp(totalExpenses)}</td>
          </tr>
        </table>

        <!-- SPACER 1 CELL -->
        <table><tr><td colspan="7" style="border:none; height: 16px;"></td></tr></table>

        <!-- AJK INVOICE ARREARS TABLE -->
        <table>
          <tr>
            <td colspan="7" class="section-banner">4. ANALISIS PIUTANG & TUNGGAKAN AJK (CORPORATE ARREARS)</td>
          </tr>
          <tr class="th-bg">
            <td width="15%">No. Invoice</td>
            <td width="25%">Perusahaan Klien</td>
            <td width="15%">Bulan Tagihan</td>
            <td width="15%">Nominal (Rp)</td>
            <td width="10%">Status</td>
            <td width="10%">Tunggakan</td>
            <td width="10%">Jatuh Tempo</td>
          </tr>
          ${
            filteredAjkInvoices.length === 0
              ? '<tr><td colspan="7" class="text-center">Tidak ada data invoice.</td></tr>'
              : filteredAjkInvoices
                  .map(
                    (inv) => `
            <tr>
              <td class="text-bold">${inv.invoiceNumber}</td>
              <td>${inv.companyName}</td>
              <td class="text-center">${inv.billingMonth}</td>
              <td class="text-right text-bold">${formatRp(inv.amount)}</td>
              <td class="text-center ${inv.status === 'Lunas' ? 'status-sehat' : 'status-bahaya'}">${inv.status}</td>
              <td class="text-center">${inv.delinquentMonths} Bulan</td>
              <td class="text-center">${inv.dueDate}</td>
            </tr>`
                  )
                  .join('')
          }
          <tr class="total-row">
            <td colspan="3" class="text-bold">TOTAL OUTSTANDING TUNGGAKAN AJK</td>
            <td class="text-right text-bold" style="color: #D97706;">${formatRp(totalOutstandingAjk)}</td>
            <td colspan="3"></td>
          </tr>
        </table>

        <!-- SPACER 1 CELL -->
        <table><tr><td colspan="7" style="border:none; height: 16px;"></td></tr></table>

        <!-- MANAGEMENT EVALUATION -->
        <table>
          <tr>
            <td colspan="2" class="section-banner">5. EVALUASI & REKOMENDASI MANAJEMEN</td>
          </tr>
          <tr>
            <td width="30%" class="text-bold">Penagihan Piutang AJK</td>
            <td>${
              totalAjkCriticalAmount > 0
                ? `PERINGATAN: Terdapat ${ajkCriticalInvoices.length} invoice AJK kritis menunggak >= 3 bulan (${formatRp(
                    totalAjkCriticalAmount
                  )}). Terbitkan Surat Peringatan (SP) Penagihan.`
                : 'Penagihan AJK lancar dan berada dalam batas toleransi aman.'
            }</td>
          </tr>
          <tr>
            <td class="text-bold">Efisiensi Biaya Operasional</td>
            <td>Biaya operasional trip menyerap ${
              totalGrossIncome > 0 ? ((opsCostTrips / totalGrossIncome) * 100).toFixed(1) : '0'
            }% dari pemasukan. ${
              opsCostTrips > totalGrossIncome * 0.4
                ? 'SARAN: Biaya operasional melebihi 40%. Tingkatkan audit bensin dan rute tol.'
                : 'Pengeluaran operasional terkendali.'
            }</td>
          </tr>
        </table>

      </body>
      </html>
    `;

    const blob = new Blob([htmlContent], { type: 'application/vnd.ms-excel;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `Laporan_Evaluasi_Keuangan_Armada_${periodFilter}_${todayStr}.xls`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="flex flex-col h-full gap-6 overflow-y-auto pr-1 pb-8 scrollbar-thin">
      {/* Header Banner */}
      <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-black text-gray-900 tracking-tight">Laporan Keuangan & Evaluasi Total</h2>
            <span className={`px-3 py-1 rounded-full text-xs font-extrabold border ${healthColor} flex items-center gap-1.5`}>
              <span className={`w-2 h-2 rounded-full ${healthBadgeColor} animate-pulse`} />
              Kesehatan: {healthStatus}
            </span>
          </div>
          <p className="text-xs text-gray-500 font-medium mt-1">
            Analisis perbandingan pemasukan kotor, biaya operasional, perawatan armada, dan tunggakan tagihan AJK Korporat.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={handleExportExcel}
            className="flex items-center gap-2 bg-[#2F2FE4] hover:bg-[#2020D0] text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow-sm transition-all focus:ring-2 focus:ring-[#5B5BFF]/30 active:scale-95"
          >
            <FileSpreadsheet size={16} />
            <span>Export ke Excel (.csv)</span>
          </button>
        </div>
      </div>

      {/* Time Filter Control Bar */}
      <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-2 text-xs font-bold text-gray-700">
          <Filter size={16} className="text-[#2F2FE4]" />
          <span>Filter Periode Waktu:</span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {(
            [
              { id: 'semua', label: 'Semua Periode' },
              { id: 'bulan_ini', label: 'Bulan Ini (Juni 2026)' },
              { id: 'tahun_2026', label: 'Tahun 2026' },
              { id: 'custom', label: 'Rentang Tanggal' },
            ] as const
          ).map((item) => (
            <button
              key={item.id}
              onClick={() => setPeriodFilter(item.id)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                periodFilter === item.id
                  ? 'bg-[#2F2FE4] text-white shadow-sm'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>

        {/* Custom Date Range Inputs */}
        {periodFilter === 'custom' && (
          <div className="flex items-center gap-2 text-xs font-semibold bg-gray-50 p-2 rounded-xl border border-gray-200">
            <Calendar size={14} className="text-gray-400" />
            <input
              type="date"
              value={customStartDate}
              onChange={(e) => setCustomStartDate(e.target.value)}
              className="bg-white border border-gray-200 rounded-lg px-2 py-1 text-xs text-gray-700 focus:outline-none focus:ring-1 focus:ring-[#2F2FE4]"
            />
            <span className="text-gray-400">s/d</span>
            <input
              type="date"
              value={customEndDate}
              onChange={(e) => setCustomEndDate(e.target.value)}
              className="bg-white border border-gray-200 rounded-lg px-2 py-1 text-xs text-gray-700 focus:outline-none focus:ring-1 focus:ring-[#2F2FE4]"
            />
          </div>
        )}
      </div>

      {/* 4 Key Summary Financial Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Income */}
        <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm relative overflow-hidden flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-extrabold text-gray-400 uppercase tracking-wider">Total Pemasukan</span>
            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
              <TrendingUp size={20} />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-2xl font-black text-emerald-600 tracking-tight">
              {formatRp(totalGrossIncome)}
            </div>
            <p className="text-[11px] text-gray-500 font-semibold mt-1 flex items-center justify-between">
              <span>Order + AJK Lunas</span>
              <span className="text-emerald-600 font-extrabold">100%</span>
            </p>
          </div>
        </div>

        {/* Total Expenses */}
        <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm relative overflow-hidden flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-extrabold text-gray-400 uppercase tracking-wider">Total Pengeluaran</span>
            <div className="p-2 bg-rose-50 text-rose-600 rounded-xl">
              <TrendingDown size={20} />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-2xl font-black text-rose-600 tracking-tight">
              {formatRp(totalExpenses)}
            </div>
            <p className="text-[11px] text-gray-500 font-semibold mt-1 flex items-center justify-between">
              <span>Operasional + Bengkel</span>
              <span className="text-rose-600 font-extrabold">
                {totalGrossIncome > 0 ? `${((totalExpenses / totalGrossIncome) * 100).toFixed(0)}%` : '0%'}
              </span>
            </p>
          </div>
        </div>

        {/* Net Profit */}
        <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm relative overflow-hidden flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-extrabold text-gray-400 uppercase tracking-wider">Laba Bersih</span>
            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
              <DollarSign size={20} />
            </div>
          </div>
          <div className="mt-4">
            <div className={`text-2xl font-black tracking-tight ${netProfit >= 0 ? 'text-indigo-600' : 'text-red-600'}`}>
              {formatRp(netProfit)}
            </div>
            <p className="text-[11px] text-gray-500 font-semibold mt-1 flex items-center justify-between">
              <span>Margin Net Profit</span>
              <span className="text-indigo-600 font-extrabold">{profitMarginPercent}%</span>
            </p>
          </div>
        </div>

        {/* Total AJK Arrears */}
        <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm relative overflow-hidden flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-extrabold text-gray-400 uppercase tracking-wider">Tunggakan AJK</span>
            <div className="p-2 bg-amber-50 text-amber-600 rounded-xl">
              <AlertTriangle size={20} />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-2xl font-black text-amber-600 tracking-tight">
              {formatRp(totalOutstandingAjk)}
            </div>
            <p className="text-[11px] text-gray-500 font-semibold mt-1 flex items-center justify-between">
              <span>{ajkDelinquentInvoices.length + ajkUnpaidInvoices.length} Tagihan Belum Lunas</span>
              <span className="text-amber-600 font-extrabold">
                {ajkCriticalInvoices.length > 0 ? `${ajkCriticalInvoices.length} Kritis` : 'Aman'}
              </span>
            </p>
          </div>
        </div>
      </div>

      {/* Comparison Sections: Pemasukan vs Pengeluaran & Tunggakan AJK */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Detailed Income vs Expense Comparison */}
        <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-black text-gray-900 flex items-center gap-2">
                <PieChart size={18} className="text-[#2F2FE4]" />
                <span>Perbandingan Pemasukan vs Pengeluaran</span>
              </h3>
              <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Komposisi Realisasi</span>
            </div>

            <div className="space-y-4">
              {/* Income Item 1: Trip Order */}
              <div className="p-3.5 bg-gray-50 rounded-xl border border-gray-100">
                <div className="flex items-center justify-between text-xs font-bold mb-1.5">
                  <span className="text-gray-700 flex items-center gap-1.5">
                    <Truck size={14} className="text-emerald-600" />
                    Trip Order Reguler ({completedTrips.length} Trip)
                  </span>
                  <span className="text-emerald-600 font-black">{formatRp(revenueTripOrder)}</span>
                </div>
                <div className="w-full bg-gray-200 h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-emerald-500 h-full rounded-full transition-all duration-500"
                    style={{ width: `${totalGrossIncome > 0 ? (revenueTripOrder / totalGrossIncome) * 100 : 0}%` }}
                  />
                </div>
              </div>

              {/* Income Item 2: AJK Paid Invoices */}
              <div className="p-3.5 bg-gray-50 rounded-xl border border-gray-100">
                <div className="flex items-center justify-between text-xs font-bold mb-1.5">
                  <span className="text-gray-700 flex items-center gap-1.5">
                    <Building2 size={14} className="text-blue-600" />
                    Pencairan Tagihan AJK Korporat ({ajkPaidInvoices.length} Invoice)
                  </span>
                  <span className="text-blue-600 font-black">{formatRp(revenueAjkPaid)}</span>
                </div>
                <div className="w-full bg-gray-200 h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-blue-500 h-full rounded-full transition-all duration-500"
                    style={{ width: `${totalGrossIncome > 0 ? (revenueAjkPaid / totalGrossIncome) * 100 : 0}%` }}
                  />
                </div>
              </div>

              <div className="my-2 border-t border-dashed border-gray-200" />

              {/* Expense Item 1: Ops Cost */}
              <div className="p-3.5 bg-gray-50 rounded-xl border border-gray-100">
                <div className="flex items-center justify-between text-xs font-bold mb-1.5">
                  <span className="text-gray-700 flex items-center gap-1.5">
                    <TrendingDown size={14} className="text-rose-500" />
                    Biaya Operasional (BBM, Tol, Tips)
                  </span>
                  <span className="text-rose-600 font-black">{formatRp(opsCostTrips)}</span>
                </div>
                <div className="w-full bg-gray-200 h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-rose-500 h-full rounded-full transition-all duration-500"
                    style={{ width: `${totalExpenses > 0 ? (opsCostTrips / totalExpenses) * 100 : 0}%` }}
                  />
                </div>
              </div>

              {/* Expense Item 2: Maintenance Cost */}
              <div className="p-3.5 bg-gray-50 rounded-xl border border-gray-100">
                <div className="flex items-center justify-between text-xs font-bold mb-1.5">
                  <span className="text-gray-700 flex items-center gap-1.5">
                    <Wrench size={14} className="text-amber-500" />
                    Biaya Perbaikan & Maintenance Bengkel ({filteredMaintenance.length} Record)
                  </span>
                  <span className="text-amber-600 font-black">{formatRp(maintenanceCostTotal)}</span>
                </div>
                <div className="w-full bg-gray-200 h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-amber-500 h-full rounded-full transition-all duration-500"
                    style={{ width: `${totalExpenses > 0 ? (maintenanceCostTotal / totalExpenses) * 100 : 0}%` }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Detailed AJK Corporate Arrears Breakdown */}
        <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-black text-gray-900 flex items-center gap-2">
                <Building2 size={18} className="text-[#2F2FE4]" />
                <span>Evaluasi Tunggakan AJK Korporat</span>
              </h3>
              <span className="px-2.5 py-0.5 bg-amber-100 text-amber-800 text-[10px] font-black rounded-full">
                {filteredAjkInvoices.filter((i) => i.status !== 'Lunas').length} Pending
              </span>
            </div>

            <div className="space-y-3">
              {filteredAjkInvoices.filter((i) => i.status !== 'Lunas').length === 0 ? (
                <div className="py-12 text-center text-gray-400">
                  <CheckCircle2 size={36} className="mx-auto mb-2 text-emerald-500" />
                  <p className="text-xs font-bold text-gray-600">Semua tagihan AJK korporat telah lunas!</p>
                  <p className="text-[11px] text-gray-400 mt-0.5">Tidak ada tunggakan pembayaran yang menggantung pada periode ini.</p>
                </div>
              ) : (
                filteredAjkInvoices
                  .filter((i) => i.status !== 'Lunas')
                  .map((inv) => {
                    const isCritical = inv.delinquentMonths >= 3;
                    return (
                      <div
                        key={inv.id}
                        className={`p-3.5 rounded-xl border flex items-center justify-between gap-3 ${
                          isCritical
                            ? 'bg-red-50/60 border-red-200'
                            : inv.status === 'Menunggak'
                            ? 'bg-amber-50/60 border-amber-200'
                            : 'bg-gray-50 border-gray-200'
                        }`}
                      >
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-black text-gray-800 truncate">{inv.companyName}</span>
                            <span
                              className={`px-2 py-0.5 rounded text-[9px] font-black uppercase ${
                                isCritical
                                  ? 'bg-red-600 text-white animate-pulse'
                                  : inv.status === 'Menunggak'
                                  ? 'bg-amber-500 text-white'
                                  : 'bg-gray-200 text-gray-700'
                              }`}
                            >
                              {isCritical ? 'SP-3 Kritis' : inv.status}
                            </span>
                          </div>
                          <p className="text-[11px] text-gray-500 font-semibold mt-0.5">
                            {inv.invoiceNumber} • {inv.billingMonth} ({inv.delinquentMonths} Bulan Tunggakan)
                          </p>
                        </div>
                        <div className="text-right shrink-0">
                          <div className="text-xs font-black text-gray-900">{formatRp(inv.amount)}</div>
                          <div className="text-[10px] text-gray-400 font-semibold">Jatuh Tempo: {inv.dueDate}</div>
                        </div>
                      </div>
                    );
                  })
              )}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between text-xs font-bold text-gray-500">
            <span>Total Outstanding AJK:</span>
            <span className="text-amber-600 font-black">{formatRp(totalOutstandingAjk)}</span>
          </div>
        </div>
      </div>

      {/* Overall Financial Evaluation & Strategic Recommendations */}
      <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm space-y-4">
        <h3 className="text-base font-black text-gray-900 flex items-center gap-2">
          <ShieldCheck size={20} className="text-[#2F2FE4]" />
          <span>Evaluasi & Rekomendasi Manajemen Keuangan</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Recommendation 1: AJK Arrears Collection */}
          <div className="p-4 rounded-xl bg-blue-50/50 border border-blue-100 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 text-xs font-bold text-blue-900 mb-1">
                <Info size={16} className="text-blue-600 shrink-0" />
                <span>Penagihan Piutang AJK</span>
              </div>
              <p className="text-[11px] text-blue-800 leading-relaxed font-medium">
                {totalAjkCriticalAmount > 0
                  ? `Terdapat ${ajkCriticalInvoices.length} invoice AJK menunggak di atas 3 bulan (${formatRp(totalAjkCriticalAmount)}). Segera layangkan Surat Peringatan (SP-1) ke HRD/Finance Klien.`
                  : 'Proses penagihan tagihan AJK berjalan dengan baik. Tetap monitoring tanggal jatuh tempo pembayaran.'}
              </p>
            </div>
            <div className="mt-3 text-[10px] font-black text-blue-600 uppercase tracking-wider">
              {totalAjkCriticalAmount > 0 ? 'Tindakan: Prioritas Tinggi' : 'Status: Optimal'}
            </div>
          </div>

          {/* Recommendation 2: Operational Efficiency */}
          <div className="p-4 rounded-xl bg-purple-50/50 border border-purple-100 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 text-xs font-bold text-purple-900 mb-1">
                <Activity size={16} className="text-purple-600 shrink-0" />
                <span>Efisiensi Biaya Operasional</span>
              </div>
              <p className="text-[11px] text-purple-800 leading-relaxed font-medium">
                Biaya operasional trip saat ini menyerap{' '}
                <span className="font-extrabold">
                  {totalGrossIncome > 0 ? `${((opsCostTrips / totalGrossIncome) * 100).toFixed(1)}%` : '0%'}
                </span>{' '}
                dari total pendapatan. Pastikan struk bensin dan tol divalidasi dengan rute trip.
              </p>
            </div>
            <div className="mt-3 text-[10px] font-black text-purple-600 uppercase tracking-wider">
              Status: Terkendali
            </div>
          </div>

          {/* Recommendation 3: Fleet Maintenance Budget */}
          <div className="p-4 rounded-xl bg-amber-50/50 border border-amber-100 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 text-xs font-bold text-amber-900 mb-1">
                <Wrench size={16} className="text-amber-600 shrink-0" />
                <span>Anggaran Perawatan Bengkel</span>
              </div>
              <p className="text-[11px] text-amber-800 leading-relaxed font-medium">
                Total perbaikan armada sebesar <span className="font-extrabold">{formatRp(maintenanceCostTotal)}</span>.
                Lakukan perawatan berkala (tune-up/oli) tepat waktu untuk mencegah kerusakan besar.
              </p>
            </div>
            <div className="mt-3 text-[10px] font-black text-amber-600 uppercase tracking-wider">
              Status: Terjadwal
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

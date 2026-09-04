/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Order, Driver, Armada, TripHistory, MaintenanceRecord, AjkInvoice } from '../types';
import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  Legend,
  AreaChart,
  Area
} from 'recharts';
import {
  TrendingUp,
  Truck,
  Wrench,
  Trash2,
  ArrowDownRight,
  ArrowUpRight,
  Calculator,
  FileSpreadsheet,
  Building,
  AlertCircle,
  CheckCircle,
  FileText,
  Users,
  Calendar,
  Printer
} from 'lucide-react';

interface LaporanTabProps {
  ordersList: Order[];
  driversList: Driver[];
  armadaList: Armada[];
  historyList: TripHistory[];
  maintenanceList: MaintenanceRecord[];
  onClearHistory: () => void;
  ajkInvoiceList?: AjkInvoice[];
}

export default function LaporanTab({
  ordersList,
  driversList,
  armadaList,
  historyList,
  maintenanceList,
  onClearHistory,
  ajkInvoiceList = [],
}: LaporanTabProps) {
  const [filterStatus, setFilterStatus] = useState<'Semua' | 'Selesai' | 'Dibatalkan'>('Semua');
  const [showPrintKeuangan, setShowPrintKeuangan] = useState(false);
  const [showPrintInvoice, setShowPrintInvoice] = useState(false);

  // --- DYNAMIC DATE FILTER STATES ---
  const [datePreset, setDatePreset] = useState<string>('30_days');
  const [startDate, setStartDate] = useState<string>('2026-06-07'); // Default start date for 30_days preset relative to system date 2026-07-06
  const [endDate, setEndDate] = useState<string>('2026-07-06');     // Default end date

  // Ctrl+P shortcut untuk print modal yang aktif
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((showPrintKeuangan || showPrintInvoice) && (e.ctrlKey || e.metaKey) && e.key === 'p') {
        e.preventDefault();
        window.print();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showPrintKeuangan, showPrintInvoice]);

  // Synchronize preset and custom dates
  useEffect(() => {
    if (datePreset !== 'custom') {
      const ref = new Date('2026-07-06T00:00:00');
      let start = '';
      let end = '';
      
      const formatDate = (d: Date) => {
        const yyyy = d.getFullYear();
        const mm = String(d.getMonth() + 1).padStart(2, '0');
        const dd = String(d.getDate()).padStart(2, '0');
        return `${yyyy}-${mm}-${dd}`;
      };

      end = formatDate(ref);

      if (datePreset === 'today') {
        start = formatDate(ref);
      } else if (datePreset === '7_days') {
        const d = new Date(ref);
        d.setDate(ref.getDate() - 6);
        start = formatDate(d);
      } else if (datePreset === '30_days') {
        const d = new Date(ref);
        d.setDate(ref.getDate() - 29);
        start = formatDate(d);
      } else if (datePreset === 'this_month') {
        const d = new Date(ref.getFullYear(), ref.getMonth(), 1);
        start = formatDate(d);
      } else if (datePreset === 'this_year') {
        const d = new Date(ref.getFullYear(), 0, 1);
        start = formatDate(d);
      } else if (datePreset === 'all') {
        start = '2026-01-01';
        end = '2026-12-31';
      }

      if (start && end) {
        setStartDate(start);
        setEndDate(end);
      }
    }
  }, [datePreset]);

  // Filter completed trips
  const completedTrips = historyList.filter((h) => h.status === 'Selesai');

  // Helper to extract date string harian from trip history
  const getTripDateOnly = (trip: TripHistory) => {
    if (trip.completedAt) {
      return trip.completedAt.split('T')[0];
    }
    return trip.departureDate;
  };

  // --- FILTERED DATASETS BASED ON DATE RANGE ---
  const filteredCompletedTrips = completedTrips.filter((t) => {
    const d = getTripDateOnly(t);
    return d >= startDate && d <= endDate;
  });

  const filteredMaintenanceList = maintenanceList.filter((m) => {
    return m.date >= startDate && m.date <= endDate;
  });

  const filteredAjkInvoiceList = ajkInvoiceList.filter((inv) => {
    return inv.dueDate >= startDate && inv.dueDate <= endDate;
  });

  // --- FINANCIAL CALCULATIONS (FILTERED) ---
  const totalRevenue = filteredCompletedTrips.reduce((acc, curr) => acc + (curr.revenue || 0), 0);
  const totalOperationalCost = filteredCompletedTrips.reduce((acc, curr) => acc + (curr.operationalCost || 0), 0);
  const totalMaintenanceCost = filteredMaintenanceList.reduce((acc, curr) => acc + (curr.totalCost || curr.cost || 0), 0);
  const netProfit = totalRevenue - (totalOperationalCost + totalMaintenanceCost);

  // Profit Margin %
  const profitMarginPercent = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0;

  // --- AJK INVOICES CALCULATIONS (FILTERED) ---
  const ajkStats = filteredAjkInvoiceList.reduce(
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

  // Formatting utility
  const formatRupiah = (value: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  // --- ADAPTIVE TREND GENERATION FOR CHARTS ---
  const getDatesInRange = (startStr: string, endStr: string) => {
    const dates: string[] = [];
    if (!startStr || !endStr) return dates;
    const start = new Date(startStr + 'T00:00:00');
    const end = new Date(endStr + 'T00:00:00');
    
    if (isNaN(start.getTime()) || isNaN(end.getTime()) || start > end) {
      return dates;
    }
    
    const current = new Date(start);
    let count = 0;
    while (current <= end && count < 366) {
      const yyyy = current.getFullYear();
      const mm = String(current.getMonth() + 1).padStart(2, '0');
      const dd = String(current.getDate()).padStart(2, '0');
      dates.push(`${yyyy}-${mm}-${dd}`);
      current.setDate(current.getDate() + 1);
      count++;
    }
    return dates;
  };

  const getFinancialTrends = () => {
    if (!startDate || !endDate) return [];
    
    const start = new Date(startDate + 'T00:00:00');
    const end = new Date(endDate + 'T00:00:00');
    if (isNaN(start.getTime()) || isNaN(end.getTime()) || start > end) return [];

    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;

    const monthsAbbr = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];

    if (diffDays <= 45) {
      // Daily points
      const dates = getDatesInRange(startDate, endDate);
      return dates.map((dateStr) => {
        const tripsOnDate = completedTrips.filter((t) => getTripDateOnly(t) === dateStr);
        const rev = tripsOnDate.reduce((acc, curr) => acc + (curr.revenue || 0), 0);
        const ops = tripsOnDate.reduce((acc, curr) => acc + (curr.operationalCost || 0), 0);
        const maintOnDate = maintenanceList.filter((m) => m.date === dateStr);
        const maint = maintOnDate.reduce((acc, curr) => acc + (curr.totalCost || curr.cost || 0), 0);
        const net = rev - (ops + maint);

        const parts = dateStr.split('-');
        const day = parseInt(parts[2], 10);
        const monthIdx = parseInt(parts[1], 10) - 1;
        const label = `${day} ${monthsAbbr[monthIdx]}`;

        return {
          date: dateStr,
          label,
          'Pendapatan': rev,
          'Biaya Operasional': ops,
          'Biaya Perbaikan': maint,
          'Pendapatan Bersih': net,
        };
      });
    } else if (diffDays <= 180) {
      // Weekly grouping
      const weeklyData: any[] = [];
      const current = new Date(start);
      let weekIndex = 1;
      
      while (current <= end) {
        const weekStart = new Date(current);
        const weekEnd = new Date(current);
        weekEnd.setDate(weekEnd.getDate() + 6);
        if (weekEnd > end) {
          weekEnd.setTime(end.getTime());
        }

        const weekStartStr = weekStart.toISOString().split('T')[0];
        const weekEndStr = weekEnd.toISOString().split('T')[0];

        const tripsInWeek = completedTrips.filter((t) => {
          const d = getTripDateOnly(t);
          return d >= weekStartStr && d <= weekEndStr;
        });
        const maintInWeek = maintenanceList.filter((m) => m.date >= weekStartStr && m.date <= weekEndStr);

        const rev = tripsInWeek.reduce((acc, curr) => acc + (curr.revenue || 0), 0);
        const ops = tripsInWeek.reduce((acc, curr) => acc + (curr.operationalCost || 0), 0);
        const maint = maintInWeek.reduce((acc, curr) => acc + (curr.totalCost || curr.cost || 0), 0);
        const net = rev - (ops + maint);

        const label = `W${weekIndex} (${weekStart.getDate()} ${monthsAbbr[weekStart.getMonth()]})`;

        weeklyData.push({
          date: weekStartStr,
          label,
          'Pendapatan': rev,
          'Biaya Operasional': ops,
          'Biaya Perbaikan': maint,
          'Pendapatan Bersih': net,
        });

        current.setDate(current.getDate() + 7);
        weekIndex++;
      }
      return weeklyData;
    } else {
      // Monthly grouping
      const monthlyData: any[] = [];
      const current = new Date(start.getFullYear(), start.getMonth(), 1);
      
      while (current <= end) {
        const monthStart = new Date(current);
        const monthEnd = new Date(current.getFullYear(), current.getMonth() + 1, 0);
        
        const monthStartStr = monthStart.toISOString().split('T')[0];
        const monthEndStr = monthEnd.toISOString().split('T')[0];

        const actualStartStr = monthStartStr < startDate ? startDate : monthStartStr;
        const actualEndStr = monthEndStr > endDate ? endDate : monthEndStr;

        const tripsInMonth = completedTrips.filter((t) => {
          const d = getTripDateOnly(t);
          return d >= actualStartStr && d <= actualEndStr;
        });
        const maintInMonth = maintenanceList.filter((m) => {
          return m.date >= actualStartStr && m.date <= actualEndStr;
        });

        const rev = tripsInMonth.reduce((acc, curr) => acc + (curr.revenue || 0), 0);
        const ops = tripsInMonth.reduce((acc, curr) => acc + (curr.operationalCost || 0), 0);
        const maint = maintInMonth.reduce((acc, curr) => acc + (curr.totalCost || curr.cost || 0), 0);
        const net = rev - (ops + maint);

        const label = `${monthsAbbr[monthStart.getMonth()]} ${monthStart.getFullYear()}`;

        monthlyData.push({
          date: monthStartStr,
          label,
          'Pendapatan': rev,
          'Biaya Operasional': ops,
          'Biaya Perbaikan': maint,
          'Pendapatan Bersih': net,
        });

        current.setMonth(current.getMonth() + 1);
      }
      return monthlyData;
    }
  };

  const trendData = getFinancialTrends();

  // --- ARMADA FINANCIAL SUMMARY (FILTERED) ---
  const armadaSummary = armadaList.map((car) => {
    const carCompletedTrips = filteredCompletedTrips.filter((t) => t.plateNumber === car.plateNumber);
    const carRevenue = carCompletedTrips.reduce((acc, curr) => acc + (curr.revenue || 0), 0);
    const carOpsCost = carCompletedTrips.reduce((acc, curr) => acc + (curr.operationalCost || 0), 0);

    const carMaintenance = filteredMaintenanceList
      .filter((m) => m.plateNumber === car.plateNumber)
      .reduce((acc, curr) => acc + (curr.totalCost || curr.cost || 0), 0);

    const carNetProfit = carRevenue - (carOpsCost + carMaintenance);

    return {
      plateNumber: car.plateNumber,
      carType: car.carType,
      status: car.status,
      tripsCount: carCompletedTrips.length,
      revenue: carRevenue,
      opsCost: carOpsCost,
      maintenance: carMaintenance,
      netProfit: carNetProfit,
    };
  });

  // --- DRIVER PERFORMANCE SUMMARY (FILTERED) ---
  const driverSummary = driversList.map((driver) => {
    const driverCompletedTrips = filteredCompletedTrips.filter((t) => t.driverName === driver.name);
    const driverCancelledTrips = historyList.filter((t) => {
      const d = getTripDateOnly(t);
      return t.driverName === driver.name && t.status === 'Dibatalkan' && d >= startDate && d <= endDate;
    });
    const driverRevenue = driverCompletedTrips.reduce((acc, curr) => acc + (curr.revenue || 0), 0);
    const driverOpsCost = driverCompletedTrips.reduce((acc, curr) => acc + (curr.operationalCost || 0), 0);
    const driverNetProfit = driverRevenue - driverOpsCost;

    return {
      name: driver.name,
      status: driver.status,
      completedCount: driverCompletedTrips.length,
      cancelledCount: driverCancelledTrips.length,
      revenue: driverRevenue,
      opsCost: driverOpsCost,
      netProfit: driverNetProfit,
    };
  });

  const filteredHistory = historyList.filter((item) => {
    const d = getTripDateOnly(item);
    const dateMatch = d >= startDate && d <= endDate;
    if (!dateMatch) return false;
    if (filterStatus === 'Semua') return true;
    return item.status === filterStatus;
  });

  // --- EXPORT TO EXCEL COMPLIANT WITH MICROSOFT EXCEL XML & HTML SPREADSHEETS ---
  const handleExportExcel = () => {
    const todayStr = new Date().toISOString().split('T')[0];
    
    let html = `
      <html xmlns:o="urn:schemas-microsoft-com:office:office" 
            xmlns:x="urn:schemas-microsoft-com:office:excel" 
            xmlns="http://www.w3.org/TR/REC-html40">
      <head>
        <meta charset="utf-8" />
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
          body { font-family: 'Segoe UI', Arial, sans-serif; }
          table { border-collapse: collapse; margin-bottom: 25px; width: 100%; }
          th { background-color: #2F2FE4; color: white; font-weight: bold; border: 1px solid #CBD5E1; padding: 10px; text-align: left; }
          td { border: 1px solid #E2E8F0; padding: 8px; text-align: left; color: #334155; }
          .title { font-size: 18pt; font-weight: bold; color: #1E293B; margin-bottom: 5px; }
          .subtitle { font-size: 11pt; color: #64748B; margin-bottom: 20px; }
          .section-title { font-size: 14pt; font-weight: bold; color: #0F172A; margin-top: 25px; margin-bottom: 10px; border-bottom: 2px solid #2F2FE4; padding-bottom: 5px; }
          .money { text-align: right; mso-number-format:"\\Rp\\ *\\ #\\,\\#\\#0"; }
          .number { text-align: center; mso-number-format:"0"; }
          .total-row { font-weight: bold; background-color: #F1F5F9; }
          .badge-selesai { background-color: #DEF7EC; color: #03543F; font-weight: bold; text-align: center; }
          .badge-batal { background-color: #FDE8E8; color: #9B1C1C; font-weight: bold; text-align: center; }
        </style>
      </head>
      <body>
        <div class="title" style="margin-left: 40px; margin-top: 20px;">LAPORAN OPERASIONAL &amp; KEUANGAN ARMADA</div>
        <div class="subtitle" style="margin-left: 40px; margin-bottom: 25px;">Periode Laporan: <b>${startDate}</b> s/d <b>${endDate}</b> | Unduh Tanggal: ${todayStr} | GPS &amp; Finance System</div>

        <!-- Spacer 1 baris kosong -->
        <table style="border: none; border-collapse: collapse; margin: 0; padding: 0;">
          <tr style="border: none; height: 18px;">
            <td style="border: none; width: 40px;"></td>
            <td colspan="15" style="border: none; height: 18px; background: none;"></td>
          </tr>
        </table>

        <!-- 1. RINGKASAN KEUANGAN GLOBAL -->
        <div class="section-title" style="margin-left: 40px;">1. Ringkasan Keuangan Global</div>
        <table>
          <thead>
            <tr>
              <th style="border: none; background: none; width: 40px;"></th>
              <th>Metrik Keuangan</th>
              <th style="text-align: right;">Jumlah Nilai (Rupiah)</th>
              <th>Keterangan</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style="border: none; width: 40px;"></td>
              <td><b>Total Pendapatan</b></td>
              <td class="money">${totalRevenue}</td>
              <td>Total dari seluruh perjalanan armada dengan status "Selesai" dalam periode terpilih</td>
            </tr>
            <tr>
              <td style="border: none; width: 40px;"></td>
              <td><b>Total Biaya Operasional</b></td>
              <td class="money">${totalOperationalCost}</td>
              <td>Pengeluaran bahan bakar solar, tarif tol, makan sopir, dll dalam periode terpilih</td>
            </tr>
            <tr>
              <td style="border: none; width: 40px;"></td>
              <td><b>Total Biaya Perbaikan (Maintenance)</b></td>
              <td class="money">${totalMaintenanceCost}</td>
              <td>Total biaya servis berkala, perbaikan kerusakan, dan suku cadang dalam periode terpilih</td>
            </tr>
            <tr class="total-row">
              <td style="border: none; width: 40px;"></td>
              <td><b>Pendapatan Bersih (Net Income)</b></td>
              <td class="money">${netProfit}</td>
              <td>Hasil akhir: Pendapatan - (Biaya Operasional + Biaya Perbaikan)</td>
            </tr>
            <tr>
              <td style="border: none; width: 40px;"></td>
              <td><b>Margin Keuntungan Bersih</b></td>
              <td class="number">${profitMarginPercent.toFixed(2)}%</td>
              <td>Efisiensi perolehan laba bersih dibandingkan total pendapatan kotor</td>
            </tr>
          </tbody>
        </table>

        <!-- Spacer 1 baris kosong -->
        <table style="border: none; border-collapse: collapse; margin: 0; padding: 0;">
          <tr style="border: none; height: 24px;">
            <td style="border: none; width: 40px;"></td>
            <td colspan="15" style="border: none; height: 24px; background: none;"></td>
          </tr>
        </table>

        <!-- 2. PROFITABILITAS PER KENDARAAN -->
        <div class="section-title" style="margin-left: 40px;">2. Laporan Profitabilitas per Unit Armada</div>
        <table>
          <thead>
            <tr>
              <th style="border: none; background: none; width: 40px;"></th>
              <th>Nomor Plat</th>
              <th>Tipe Kendaraan</th>
              <th class="number">Jumlah Trip Selesai</th>
              <th style="text-align: right;">Pendapatan</th>
              <th style="text-align: right;">Biaya Ops</th>
              <th style="text-align: right;">Biaya Perbaikan</th>
              <th style="text-align: right;">Net Profit</th>
            </tr>
          </thead>
          <tbody>
            ${armadaSummary.map(item => `
              <tr>
                <td style="border: none; width: 40px;"></td>
                <td><b>${item.plateNumber}</b></td>
                <td>${item.carType}</td>
                <td class="number">${item.tripsCount}</td>
                <td class="money">${item.revenue}</td>
                <td class="money">${item.opsCost}</td>
                <td class="money">${item.maintenance}</td>
                <td class="money" style="font-weight: bold; color: ${item.netProfit >= 0 ? '#16A34A' : '#DC2626'}">${item.netProfit}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>

        <!-- Spacer 1 baris kosong -->
        <table style="border: none; border-collapse: collapse; margin: 0; padding: 0;">
          <tr style="border: none; height: 24px;">
            <td style="border: none; width: 40px;"></td>
            <td colspan="15" style="border: none; height: 24px; background: none;"></td>
          </tr>
        </table>

        <!-- 3. LAPORAN KINERJA SUPIR -->
        <div class="section-title" style="margin-left: 40px;">3. Laporan Kinerja &amp; Profitabilitas Supir (Driver)</div>
        <table>
          <thead>
            <tr>
              <th style="border: none; background: none; width: 40px;"></th>
              <th>Nama Supir</th>
              <th>Status Saat Ini</th>
              <th class="number">Jumlah Trip Selesai</th>
              <th class="number">Jumlah Trip Batal</th>
              <th style="text-align: right;">Total Pendapatan Tergenerate</th>
              <th style="text-align: right;">Total Biaya Ops</th>
              <th style="text-align: right;">Kontribusi Net Profit</th>
            </tr>
          </thead>
          <tbody>
            ${driverSummary.map(item => `
              <tr>
                <td style="border: none; width: 40px;"></td>
                <td><b>${item.name}</b></td>
                <td>${item.status === 'Ready' ? 'Tersedia (Ready)' : 'Sedang Jalan'}</td>
                <td class="number">${item.completedCount}</td>
                <td class="number">${item.cancelledCount}</td>
                <td class="money">${item.revenue}</td>
                <td class="money">${item.opsCost}</td>
                <td class="money" style="font-weight: bold; color: ${item.netProfit >= 0 ? '#16A34A' : '#DC2626'}">${item.netProfit}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>

        <!-- Spacer 1 baris kosong -->
        <table style="border: none; border-collapse: collapse; margin: 0; padding: 0;">
          <tr style="border: none; height: 24px;">
            <td style="border: none; width: 40px;"></td>
            <td colspan="15" style="border: none; height: 24px; background: none;"></td>
          </tr>
        </table>

        <!-- 4. LOG RIWAYAT PERJALANAN -->
        <div class="section-title" style="margin-left: 40px;">4. Log Riwayat Perjalanan Armada</div>
        <table>
          <thead>
            <tr>
              <th style="border: none; background: none; width: 40px;"></th>
              <th>Driver</th>
              <th>No. Plat</th>
              <th>Tipe Mobil</th>
              <th>Rute Asal &amp; Tujuan</th>
              <th>Tanggal Berangkat</th>
              <th>Waktu Berangkat</th>
              <th style="text-align: right;">Pendapatan</th>
              <th style="text-align: right;">Biaya Ops</th>
              <th style="text-align: center;">Status</th>
            </tr>
          </thead>
          <tbody>
            ${filteredHistory.map(item => `
              <tr>
                <td style="border: none; width: 40px;"></td>
                <td>${item.driverName}</td>
                <td>${item.plateNumber}</td>
                <td>${item.carType}</td>
                <td>${item.origin} - ${item.destination}</td>
                <td>${item.departureDate}</td>
                <td class="number">${item.departureTime}</td>
                <td class="money">${item.revenue || 0}</td>
                <td class="money">${item.operationalCost || 0}</td>
                <td class="${item.status === 'Selesai' ? 'badge-selesai' : 'badge-batal'}">${item.status}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>

        <!-- Spacer 1 baris kosong -->
        <table style="border: none; border-collapse: collapse; margin: 0; padding: 0;">
          <tr style="border: none; height: 24px;">
            <td style="border: none; width: 40px;"></td>
            <td colspan="15" style="border: none; height: 24px; background: none;"></td>
          </tr>
        </table>

        <!-- 5. LOG RIWAYAT PERBAIKAN -->
        <div class="section-title" style="margin-left: 40px;">5. Log Riwayat Perbaikan &amp; Pemeliharaan</div>
        <table>
          <thead>
            <tr>
              <th style="border: none; background: none; width: 40px;"></th>
              <th>Tanggal Servis</th>
              <th>No. Plat</th>
              <th>Tipe Mobil</th>
              <th>Rincian Kerusakan &amp; Tindakan Perbaikan</th>
              <th style="text-align: right;">Biaya Perbaikan</th>
            </tr>
          </thead>
          <tbody>
            ${filteredMaintenanceList.length === 0 ? `
              <tr>
                <td style="border: none; width: 40px;"></td>
                <td colspan="5" style="text-align: center; color: #94A3B8;">Belum ada riwayat perbaikan yang terdaftar</td>
              </tr>
            ` : filteredMaintenanceList.map(item => `
              <tr>
                <td style="border: none; width: 40px;"></td>
                <td>${item.date}</td>
                <td><b>${item.plateNumber}</b></td>
                <td>${item.carType}</td>
                <td>${item.description || item.damages.map(d => d.description).join(', ')}</td>
                <td class="money">${item.totalCost || item.cost || 0}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </body>
      </html>
    `;

    const blob = new Blob([html], { type: 'application/vnd.ms-excel' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Laporan_Operasional_Dan_Keuangan_Armada_${todayStr}.xls`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div id="laporan-tab-container" className="flex flex-col h-full space-y-6 overflow-y-auto pb-8 pr-1">
      
      {/* HEADER CONTROLS AND EXPORT BUTTONS */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-gray-200 shadow-sm">
        <div>
          <h2 className="text-lg font-black text-gray-800">Laporan Operasional &amp; Keuangan</h2>
          <p className="text-xs text-gray-500 font-semibold mt-0.5">Analisis perbandingan biaya harian, pendapatan kotor, biaya servis, dan profit bersih armada.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <button
            onClick={() => setShowPrintKeuangan(true)}
            className="flex items-center gap-2 bg-[#2F2FE4] hover:bg-[#2020D0] text-white font-extrabold text-sm px-4 py-2.5 rounded-xl shadow-md border border-transparent transition-all hover:scale-[1.02] transform active:scale-95"
            title="Cetak / Export PDF Laporan Keuangan Trip"
          >
            <Printer size={16} />
            <span>Cetak Lap. Keuangan</span>
          </button>
          <button
            onClick={() => setShowPrintInvoice(true)}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-sm px-4 py-2.5 rounded-xl shadow-md border border-transparent transition-all hover:scale-[1.02] transform active:scale-95"
            title="Cetak / Export PDF Laporan Tagihan Invoice AJK"
          >
            <Printer size={16} />
            <span>Cetak Lap. Invoice AJK</span>
          </button>
          <button
            onClick={handleExportExcel}
            className="flex items-center gap-2 bg-[#1D6F42] hover:bg-[#155231] text-white font-extrabold text-sm px-4 py-2.5 rounded-xl shadow-md border border-transparent transition-all hover:scale-[1.02] transform active:scale-95"
          >
            <FileSpreadsheet size={16} />
            <span>Export Excel</span>
          </button>
        </div>
      </div>


      {/* DYNAMIC DATE FILTER BAR */}
      <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="p-3 bg-indigo-50 text-indigo-600 rounded-xl">
              <Calendar size={20} />
            </span>
            <div>
              <h3 className="text-sm font-black text-gray-800">Filter Periode Laporan &amp; Grafik</h3>
              <p className="text-[11px] text-gray-500 font-semibold mt-0.5">
                Pilih preset rentang tanggal atau tentukan rentang sendiri untuk menyaring seluruh grafik, tabel kinerja supir, dan ringkasan keuangan.
              </p>
            </div>
          </div>
          
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex flex-col space-y-1">
              <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider pl-1">Preset Rentang</span>
              <select
                value={datePreset}
                onChange={(e) => setDatePreset(e.target.value)}
                className="px-3.5 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 cursor-pointer"
              >
                <option value="7_days">7 Hari Terakhir</option>
                <option value="30_days">30 Hari Terakhir</option>
                <option value="this_month">Bulan Ini</option>
                <option value="this_year">Tahun Ini</option>
                <option value="all">Semua Waktu</option>
                <option value="custom">Kustom Tanggal</option>
              </select>
            </div>

            <div className="flex flex-col space-y-1">
              <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider pl-1">Tanggal Mulai</span>
              <input
                type="date"
                value={startDate}
                onChange={(e) => {
                  setDatePreset('custom');
                  setStartDate(e.target.value);
                }}
                className="px-3.5 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-[#2F2FE4] focus:outline-none focus:ring-2 focus:ring-indigo-500/20 font-mono"
              />
            </div>

            <div className="flex flex-col space-y-1">
              <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider pl-1">Tanggal Selesai</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => {
                  setDatePreset('custom');
                  setEndDate(e.target.value);
                }}
                className="px-3.5 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-[#2F2FE4] focus:outline-none focus:ring-2 focus:ring-indigo-500/20 font-mono"
              />
            </div>
          </div>
        </div>

        {startDate && endDate && (
          <div className="mt-3.5 pt-3 border-t border-gray-100 flex items-center justify-between text-xs font-semibold text-gray-500">
            <span className="flex items-center gap-1.5">
              <span className="inline-block w-2 h-2 rounded-full bg-green-500"></span>
              <span>
                Aktif: <strong className="text-gray-700">{startDate}</strong> s/d <strong className="text-gray-700">{endDate}</strong>
              </span>
            </span>
            <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">
              {trendData.length > 0 ? `${trendData.length} Titik Data Terpilih` : 'Tidak Ada Data'}
            </span>
          </div>
        )}
      </div>

      {/* FINANCIAL STATS GRID (REALIZED FINANCIALS) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Revenue Card */}
        <div className="bg-white border border-gray-200 rounded-2xl p-5 flex flex-col justify-between shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Total Pendapatan</span>
            <span className="p-2 bg-green-50 text-green-500 rounded-lg">
              <TrendingUp size={18} />
            </span>
          </div>
          <div className="mt-4">
            <div className="text-xl lg:text-2xl font-black text-gray-800">{formatRupiah(totalRevenue)}</div>
            <p className="text-xs text-gray-400 font-bold mt-1">Dari {completedTrips.length} trip selesai</p>
          </div>
          <div className="absolute right-[-10px] bottom-[-15px] text-gray-100/30 font-black text-6xl pointer-events-none select-none">
            Rp
          </div>
        </div>

        {/* Total Operational Cost Card */}
        <div className="bg-white border border-gray-200 rounded-2xl p-5 flex flex-col justify-between shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Biaya Operasional</span>
            <span className="p-2 bg-blue-50 text-blue-500 rounded-lg">
              <Truck size={18} />
            </span>
          </div>
          <div className="mt-4">
            <div className="text-xl lg:text-2xl font-black text-gray-800">{formatRupiah(totalOperationalCost)}</div>
            <p className="text-xs text-gray-400 font-bold mt-1">Bahan bakar solar, tol, makan sopir, dll</p>
          </div>
          <div className="absolute right-[-10px] bottom-[-15px] text-gray-100/30 font-black text-6xl pointer-events-none select-none">
            Op
          </div>
        </div>

        {/* Total Maintenance Cost Card */}
        <div className="bg-white border border-gray-200 rounded-2xl p-5 flex flex-col justify-between shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Biaya Perbaikan</span>
            <span className="p-2 bg-red-50 text-red-500 rounded-lg">
              <Wrench size={18} />
            </span>
          </div>
          <div className="mt-4">
            <div className="text-xl lg:text-2xl font-black text-gray-800">{formatRupiah(totalMaintenanceCost)}</div>
            <p className="text-xs text-gray-400 font-bold mt-1">{maintenanceList.length} rekam pemeliharaan armada</p>
          </div>
          <div className="absolute right-[-10px] bottom-[-15px] text-gray-100/30 font-black text-6xl pointer-events-none select-none">
            Mt
          </div>
        </div>

        {/* Net Income (Pendapatan Bersih) */}
        <div className={`border rounded-2xl p-5 flex flex-col justify-between shadow-sm relative overflow-hidden transition-all duration-300 ${
          netProfit >= 0 ? 'bg-green-50/60 border-green-200 text-green-900' : 'bg-red-50/60 border-red-200 text-red-900'
        }`}>
          <div className="flex items-center justify-between">
            <span className="text-xs font-extrabold uppercase tracking-wider opacity-70">Pendapatan Bersih</span>
            <span className={`p-2 rounded-lg ${netProfit >= 0 ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
              <Calculator size={18} />
            </span>
          </div>
          <div className="mt-4">
            <div className="text-xl lg:text-2xl font-black">{formatRupiah(netProfit)}</div>
            <div className="flex items-center gap-1 mt-1 text-xs font-bold">
              {netProfit >= 0 ? (
                <>
                  <ArrowUpRight size={14} className="text-green-600 shrink-0" />
                  <span className="text-green-700">Margin: {profitMarginPercent.toFixed(1)}% untung</span>
                </>
              ) : (
                <>
                  <ArrowDownRight size={14} className="text-red-600 shrink-0" />
                  <span className="text-red-700">Defisit keuangan (Rugi)</span>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* AJK MONTHLY CONTRACTS & BILLING REPORT OVERVIEW */}
      {ajkInvoiceList.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between border-b border-gray-150 pb-3 mb-4">
            <div className="flex items-center gap-2">
              <Building className="text-[#2F2FE4]" size={20} />
              <div>
                <h3 className="text-sm font-black text-gray-800">Ikhtisar Laporan Penagihan Kontrak AJK</h3>
                <p className="text-[10px] text-gray-400 font-bold mt-0.5">Analisis tagihan invoice bulanan, sirkulasi piutang, dan status tunggakan dari instansi kerja sama.</p>
              </div>
            </div>
            <span className="text-[10px] font-black bg-indigo-50 text-indigo-600 border border-indigo-150 px-2.5 py-1 rounded-full uppercase tracking-wider">
              {ajkInvoiceList.length} Total Invoice
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-3.5 bg-gray-50 rounded-xl border border-gray-150">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wide block">Akumulasi Kontrak Terbit</span>
              <strong className="text-base font-black text-gray-800 block mt-1">{formatRupiah(ajkStats.total)}</strong>
              <span className="text-[9px] text-gray-400 font-semibold block mt-0.5">Nilai kontrak kotor terbit</span>
            </div>

            <div className="p-3.5 bg-green-50/50 rounded-xl border border-green-150">
              <span className="text-[10px] font-bold text-green-700 uppercase tracking-wide block">Dana Cair (Lunas)</span>
              <strong className="text-base font-black text-green-600 block mt-1">{formatRupiah(ajkStats.paid)}</strong>
              <span className="text-[9px] text-green-600 font-semibold block mt-0.5">
                {(ajkStats.total > 0 ? (ajkStats.paid / ajkStats.total) * 100 : 0).toFixed(0)}% Efektivitas Penagihan
              </span>
            </div>

            <div className="p-3.5 bg-amber-50/50 rounded-xl border border-amber-150">
              <span className="text-[10px] font-bold text-amber-700 uppercase tracking-wide block">Piutang Berjalan</span>
              <strong className="text-base font-black text-amber-600 block mt-1">{formatRupiah(ajkStats.unpaid)}</strong>
              <span className="text-[9px] text-amber-600 font-semibold block mt-0.5">Belum dibayarkan / tertunda</span>
            </div>

            <div className={`p-3.5 rounded-xl border transition-all ${
              ajkStats.criticalCount > 0 
                ? 'bg-red-50/70 border-red-200 text-red-900 animate-pulse' 
                : 'bg-gray-50 border-gray-150'
            }`}>
              <span className={`text-[10px] font-bold uppercase tracking-wide block ${ajkStats.criticalCount > 0 ? 'text-red-700' : 'text-gray-400'}`}>
                Tunggakan Kritis (&ge;3 Bln)
              </span>
              <strong className={`text-base font-black block mt-1 ${ajkStats.criticalCount > 0 ? 'text-red-600' : 'text-gray-800'}`}>
                {formatRupiah(ajkStats.critical)}
              </strong>
              <span className={`text-[9px] font-semibold block mt-0.5 ${ajkStats.criticalCount > 0 ? 'text-red-600' : 'text-gray-400'}`}>
                {ajkStats.criticalCount} Mitra menunggak kritis &ge;90 hari
              </span>
            </div>
          </div>
        </div>
      )}

      {/* CORE FINANCIAL LINE CHARTS ROW */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* CHART 1: LINE CHART - PERBANDINGAN BIAYA & PENDAPATAN HARIAN */}
        <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm flex flex-col">
          <div className="mb-4">
            <h3 className="text-base font-black text-gray-800">Grafik Garis Perbandingan Keuangan</h3>
            <p className="text-xs text-gray-500 font-semibold mt-0.5">Analisis tren Pendapatan kotor vs Biaya Operasional vs Biaya Perbaikan sesuai periode terpilih</p>
          </div>
          <div className="h-72 w-full flex-1">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trendData} margin={{ top: 10, right: 20, left: 10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                <XAxis dataKey="label" stroke="#64748B" fontSize={10} tickLine={false} />
                <YAxis
                  stroke="#64748B"
                  fontSize={10}
                  tickLine={false}
                  tickFormatter={(val) => `Rp ${(val / 1000000).toFixed(1)}jt`}
                />
                <Tooltip
                  formatter={(value: any) => [formatRupiah(Number(value))]}
                  contentStyle={{ backgroundColor: '#1E293B', borderRadius: '12px', color: '#FFF', fontSize: '11px', fontWeight: 'bold' }}
                />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '11px', fontWeight: 'bold', paddingTop: '10px' }} />
                <Line
                  type="monotone"
                  dataKey="Pendapatan"
                  stroke="#38C172"
                  strokeWidth={3}
                  dot={{ r: 3 }}
                  activeDot={{ r: 5 }}
                />
                <Line
                  type="monotone"
                  dataKey="Biaya Operasional"
                  stroke="#3490DC"
                  strokeWidth={2.5}
                  dot={{ r: 2 }}
                />
                <Line
                  type="monotone"
                  dataKey="Biaya Perbaikan"
                  stroke="#E3342F"
                  strokeWidth={2.5}
                  dot={{ r: 2 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* CHART 2: LINE & AREA CHART - NAIK TURUN PENDAPATAN BERSIH SEBULAN PER TANGGAL */}
        <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm flex flex-col">
          <div className="mb-4">
            <h3 className="text-base font-black text-gray-800">Grafik Garis Naik Turun Pendapatan Bersih</h3>
            <p className="text-xs text-gray-500 font-semibold mt-0.5">Pendapatan Bersih: Pendapatan - (Biaya Operasional + Biaya Perbaikan) sesuai periode terpilih</p>
          </div>
          <div className="h-72 w-full flex-1">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trendData} margin={{ top: 10, right: 20, left: 10, bottom: 5 }}>
                <defs>
                  <linearGradient id="colorNetProfit" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#38C172" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#38C172" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                <XAxis dataKey="label" stroke="#64748B" fontSize={10} tickLine={false} />
                <YAxis
                  stroke="#64748B"
                  fontSize={10}
                  tickLine={false}
                  tickFormatter={(val) => `Rp ${(val / 1000000).toFixed(1)}jt`}
                />
                <Tooltip
                  formatter={(value: any) => [formatRupiah(Number(value)), 'Laba/Rugi Bersih']}
                  contentStyle={{ backgroundColor: '#1E293B', borderRadius: '12px', color: '#FFF', fontSize: '11px', fontWeight: 'bold' }}
                />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '11px', fontWeight: 'bold', paddingTop: '10px' }} />
                <Area
                  type="monotone"
                  dataKey="Pendapatan Bersih"
                  stroke="#38C172"
                  strokeWidth={3.5}
                  fillOpacity={1}
                  fill="url(#colorNetProfit)"
                  name="Laba Bersih"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* ARMADA PROFITABILITY LIST (CEK JADI SATU DATA) */}
      <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
        <div className="mb-4">
          <h3 className="text-base font-black text-gray-800">Cek Laporan Profitabilitas Armada (Satu Data Terintegrasi)</h3>
          <p className="text-xs text-gray-500 font-semibold mt-0.5">Gabungan data armada berisi jumlah trip selesai, pendapatan kotor, operasional, biaya perbaikan, serta total keuntungan bersih per unit mobil.</p>
        </div>

        <div className="overflow-x-auto rounded-xl border border-gray-200">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50/70 border-b border-gray-200 text-xs font-bold text-gray-500 uppercase tracking-wider">
                <th className="py-3.5 px-4 font-semibold">Mobil / Plat</th>
                <th className="py-3.5 px-4 font-semibold text-center">Jumlah Trip</th>
                <th className="py-3.5 px-4 font-semibold text-right">Pendapatan</th>
                <th className="py-3.5 px-4 font-semibold text-right">Biaya Ops</th>
                <th className="py-3.5 px-4 font-semibold text-right">Biaya Perbaikan</th>
                <th className="py-3.5 px-4 font-semibold text-right">Net Profit</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-sm font-semibold text-gray-700">
              {armadaSummary.map((item) => (
                <tr key={item.plateNumber} className="hover:bg-gray-50/40 transition-colors">
                  <td className="py-3.5 px-4">
                    <div className="font-bold text-gray-800">{item.plateNumber}</div>
                    <div className="text-xs text-gray-400 font-medium">{item.carType}</div>
                  </td>
                  <td className="py-3.5 px-4 text-center text-gray-500 font-bold">
                    {item.tripsCount}
                  </td>
                  <td className="py-3.5 px-4 text-right text-green-600 font-bold">
                    {formatRupiah(item.revenue)}
                  </td>
                  <td className="py-3.5 px-4 text-right text-gray-500">
                    {formatRupiah(item.opsCost)}
                  </td>
                  <td className="py-3.5 px-4 text-right text-red-500">
                    {formatRupiah(item.maintenance)}
                  </td>
                  <td className={`py-3.5 px-4 text-right font-black ${
                    item.netProfit >= 0 ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {formatRupiah(item.netProfit)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* LAPORAN KINERJA SUPIR (DRIVER PERFORMANCE) */}
      <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
        <div className="mb-4">
          <h3 className="text-base font-black text-gray-800 flex items-center gap-2">
            <Users size={20} className="text-[#2F2FE4]" />
            <span>Laporan Kinerja &amp; Produktivitas Supir</span>
          </h3>
          <p className="text-xs text-gray-500 font-semibold mt-0.5">Analisis kontribusi finansial dan produktivitas supir berdasarkan jumlah trip diselesaikan, trip dibatalkan, total pendapatan kotor yang diperoleh, biaya operasional, dan profit bersih.</p>
        </div>

        <div className="overflow-x-auto rounded-xl border border-gray-200">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50/70 border-b border-gray-200 text-xs font-bold text-gray-500 uppercase tracking-wider">
                <th className="py-3.5 px-4 font-semibold">Nama Supir</th>
                <th className="py-3.5 px-4 font-semibold text-center">Status</th>
                <th className="py-3.5 px-4 font-semibold text-center">Trip Selesai</th>
                <th className="py-3.5 px-4 font-semibold text-center">Trip Batal</th>
                <th className="py-3.5 px-4 font-semibold text-right">Pendapatan</th>
                <th className="py-3.5 px-4 font-semibold text-right">Biaya Ops</th>
                <th className="py-3.5 px-4 font-semibold text-right">Kontribusi Profit</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-sm font-semibold text-gray-700">
              {driverSummary.map((item) => (
                <tr key={item.name} className="hover:bg-gray-50/40 transition-colors">
                  <td className="py-3.5 px-4">
                    <div className="font-bold text-gray-800">{item.name}</div>
                  </td>
                  <td className="py-3.5 px-4 text-center">
                    <span className={`text-[10px] px-2.5 py-1 rounded-full font-bold inline-block ${
                      item.status === 'Ready'
                        ? 'bg-green-100 text-green-700'
                        : 'bg-indigo-100 text-indigo-700'
                    }`}>
                      {item.status}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-center text-gray-600 font-bold">
                    {item.completedCount}
                  </td>
                  <td className="py-3.5 px-4 text-center text-red-500 font-bold">
                    {item.cancelledCount}
                  </td>
                  <td className="py-3.5 px-4 text-right text-green-600 font-bold">
                    {formatRupiah(item.revenue)}
                  </td>
                  <td className="py-3.5 px-4 text-right text-gray-500">
                    {formatRupiah(item.opsCost)}
                  </td>
                  <td className={`py-3.5 px-4 text-right font-black ${
                    item.netProfit >= 0 ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {formatRupiah(item.netProfit)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* History Log Section */}
      <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-5">
          <div>
            <h3 className="text-base font-extrabold text-gray-800">Riwayat Perjalanan (Log)</h3>
            <p className="text-xs text-gray-500 font-medium">Catatan lengkap seluruh perjalanan armada beserta rincian keuangannya</p>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <div className="flex bg-[#EAECEF] p-1 rounded-lg text-xs font-bold text-gray-600">
              {(['Semua', 'Selesai', 'Dibatalkan'] as const).map((status) => (
                <button
                  key={status}
                  onClick={() => setFilterStatus(status)}
                  className={`px-3 py-1.5 rounded-md transition-all ${
                    filterStatus === status ? 'bg-white text-gray-800 shadow-sm' : 'hover:text-gray-900'
                  }`}
                >
                  {status}
                </button>
              ))}
            </div>

            {historyList.length > 0 && (
              <button
                onClick={onClearHistory}
                className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors border border-transparent hover:border-red-200"
                title="Hapus Semua Riwayat"
              >
                <Trash2 size={16} />
              </button>
            )}
          </div>
        </div>

        <div className="overflow-x-auto rounded-lg border border-gray-200">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50/70 border-b border-gray-200 text-xs font-bold text-gray-500 uppercase tracking-wider">
                <th className="py-3.5 px-4 font-semibold">Driver</th>
                <th className="py-3.5 px-4 font-semibold">Armada</th>
                <th className="py-3.5 px-4 font-semibold">Rute</th>
                <th className="py-3.5 px-4 font-semibold text-right">Pendapatan</th>
                <th className="py-3.5 px-4 font-semibold text-right">Biaya Ops</th>
                <th className="py-3.5 px-4 font-semibold text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-sm text-gray-700 font-medium">
              {filteredHistory.map((item) => (
                <tr key={item.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="py-3 px-4 font-bold text-gray-800">{item.driverName}</td>
                  <td className="py-3 px-4 text-xs text-gray-500">
                    <div>{item.carType}</div>
                    <div className="font-semibold text-gray-700 tracking-wide">{item.plateNumber}</div>
                  </td>
                  <td className="py-3 px-4 text-xs">
                    <div className="font-bold text-gray-700">{item.origin} &rarr; {item.destination}</div>
                    <div className="text-gray-400 mt-0.5">{item.departureDate} — {item.departureTime}</div>
                  </td>
                  <td className="py-3 px-4 text-right font-bold text-green-600">
                    {formatRupiah(item.revenue || 0)}
                  </td>
                  <td className="py-3 px-4 text-right font-medium text-gray-500">
                    {formatRupiah(item.operationalCost || 0)}
                  </td>
                  <td className="py-3 px-4 text-center">
                    <span
                      className={`px-3 py-1 rounded-full text-[10px] font-bold text-white inline-block text-center ${
                        item.status === 'Selesai' ? 'bg-[#38C172]' : 'bg-[#E3342F]'
                      }`}
                    >
                      {item.status}
                    </span>
                  </td>
                </tr>
              ))}

              {filteredHistory.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-10 text-center text-gray-400 font-medium">
                    Tidak ada riwayat perjalanan yang terdaftar.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ===== MODAL PRINT PREVIEW: LAPORAN KEUANGAN TRIP ===== */}
      {showPrintKeuangan && (
        <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4 bg-gray-950/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl border border-gray-200 shadow-2xl w-full max-w-4xl overflow-hidden">

            {/* Toolbar */}
            <div className="bg-gray-50 border-b border-gray-150 p-4 flex items-center justify-between no-print-element">
              <span className="text-xs font-black text-gray-800 flex items-center gap-1.5">
                <Printer className="text-[#2F2FE4]" size={16} />
                <span>Preview Laporan Keuangan Trip</span>
                <span className="ml-2 text-[10px] font-bold text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
                  Periode: {startDate} s/d {endDate}
                </span>
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="bg-[#2F2FE4] hover:bg-[#2020D0] text-white text-xs font-extrabold px-3 py-1.5 rounded-lg shadow-xs flex items-center gap-1 cursor-pointer transition-all active:scale-95"
                >
                  <Printer size={13} />
                  <span>Cetak / Unduh PDF</span>
                </button>
                <button
                  onClick={() => setShowPrintKeuangan(false)}
                  className="bg-gray-200 hover:bg-gray-300 text-gray-700 text-xs font-bold px-3 py-1.5 rounded-lg cursor-pointer"
                >
                  Tutup
                </button>
              </div>
            </div>

            {/* Printable Area */}
            <div className="p-6 md:p-8 max-h-[75vh] overflow-y-auto" id="printable-keuangan-area">
              <style dangerouslySetInnerHTML={{__html: `
                @media print {
                  body * { visibility: hidden !important; }
                  #printable-keuangan-area, #printable-keuangan-area * { visibility: visible !important; }
                  #printable-keuangan-area {
                    position: absolute !important;
                    left: 0 !important; top: 0 !important;
                    width: 100% !important;
                    max-height: none !important;
                    overflow: visible !important;
                    padding: 24px !important;
                    background: white !important;
                  }
                  .no-print-element { display: none !important; }
                }
              `}} />

              <div className="space-y-6">
                {/* Letterhead */}
                <div className="flex items-start justify-between border-b-2 border-gray-100 pb-5">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <div className="bg-[#2F2FE4] p-1.5 rounded-lg text-white"><Building size={18} /></div>
                      <span className="text-sm font-black tracking-tight text-gray-900 uppercase">PT Armada Trans Logistik</span>
                    </div>
                    <p className="text-[10px] text-gray-400 font-semibold leading-relaxed">
                      Jl. Boulevard Barat No. 88, Kelapa Gading, Jakarta Utara<br />
                      Telp: (021) 4588-9000 | operasional@armadatrans.com
                    </p>
                  </div>
                  <div className="text-right">
                    <h2 className="text-lg font-black text-[#2F2FE4] uppercase tracking-tight">Laporan Keuangan Trip</h2>
                    <p className="text-[10px] text-gray-400 font-bold mt-1">Periode: {startDate} s/d {endDate}</p>
                    <p className="text-[10px] text-gray-400 font-bold">Dicetak: {new Date().toLocaleDateString('id-ID', {day:'numeric', month:'long', year:'numeric'})}</p>
                  </div>
                </div>

                {/* Summary Cards */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {[
                    { label: 'Total Pendapatan', value: formatRupiah(totalRevenue), color: 'text-green-600', bg: 'bg-green-50' },
                    { label: 'Biaya Operasional', value: formatRupiah(totalOperationalCost), color: 'text-amber-600', bg: 'bg-amber-50' },
                    { label: 'Biaya Perbaikan', value: formatRupiah(totalMaintenanceCost), color: 'text-red-600', bg: 'bg-red-50' },
                    { label: 'Pendapatan Bersih', value: formatRupiah(netProfit), color: netProfit >= 0 ? 'text-[#2F2FE4]' : 'text-red-600', bg: 'bg-indigo-50' },
                  ].map((card) => (
                    <div key={card.label} className={`${card.bg} rounded-xl p-3 border border-gray-100`}>
                      <p className="text-[9px] font-black text-gray-500 uppercase tracking-wider">{card.label}</p>
                      <p className={`text-sm font-black mt-1 ${card.color}`}>{card.value}</p>
                    </div>
                  ))}
                </div>
                <div className="bg-gray-50 rounded-xl p-3 border border-gray-200 text-xs font-bold text-gray-600 flex items-center justify-between">
                  <span>Margin Keuntungan Bersih</span>
                  <span className={`text-sm font-black ${profitMarginPercent >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {profitMarginPercent.toFixed(1)}%
                  </span>
                </div>

                {/* Tabel Trip */}
                <div>
                  <h3 className="text-xs font-black text-gray-700 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <span>Detail Riwayat Perjalanan</span>
                    <span className="bg-gray-200 text-gray-600 px-2 py-0.5 rounded-full text-[9px]">{filteredCompletedTrips.length} Trip Selesai</span>
                  </h3>
                  <table className="w-full text-left text-[10px] border-collapse">
                    <thead>
                      <tr className="bg-[#2F2FE4] text-white">
                        <th className="py-2 px-3 font-black rounded-tl-lg">Driver</th>
                        <th className="py-2 px-3 font-black">No. Plat</th>
                        <th className="py-2 px-3 font-black">Rute</th>
                        <th className="py-2 px-3 font-black">Tanggal</th>
                        <th className="py-2 px-3 font-black text-right">Pendapatan</th>
                        <th className="py-2 px-3 font-black text-right">Biaya Ops</th>
                        <th className="py-2 px-3 font-black text-right rounded-tr-lg">Profit</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {filteredCompletedTrips.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="py-6 text-center text-gray-400 font-bold">Tidak ada data trip dalam periode ini</td>
                        </tr>
                      ) : filteredCompletedTrips.map((trip) => {
                        const profit = (trip.revenue || 0) - (trip.operationalCost || 0);
                        return (
                          <tr key={trip.id} className="hover:bg-gray-50/50">
                            <td className="py-2 px-3 font-bold text-gray-800">{trip.driverName}</td>
                            <td className="py-2 px-3 text-gray-600 font-mono">{trip.plateNumber}</td>
                            <td className="py-2 px-3 text-gray-600">{trip.origin} → {trip.destination}</td>
                            <td className="py-2 px-3 text-gray-500">{trip.departureDate}</td>
                            <td className="py-2 px-3 text-right font-bold text-green-700">{formatRupiah(trip.revenue || 0)}</td>
                            <td className="py-2 px-3 text-right text-gray-500">{formatRupiah(trip.operationalCost || 0)}</td>
                            <td className={`py-2 px-3 text-right font-black ${profit >= 0 ? 'text-[#2F2FE4]' : 'text-red-600'}`}>{formatRupiah(profit)}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                    {filteredCompletedTrips.length > 0 && (
                      <tfoot>
                        <tr className="bg-gray-100 font-black text-xs border-t-2 border-gray-300">
                          <td colSpan={4} className="py-2 px-3 text-gray-700 rounded-bl-lg">TOTAL ({filteredCompletedTrips.length} Trip)</td>
                          <td className="py-2 px-3 text-right text-green-700">{formatRupiah(totalRevenue)}</td>
                          <td className="py-2 px-3 text-right text-gray-600">{formatRupiah(totalOperationalCost)}</td>
                          <td className={`py-2 px-3 text-right rounded-br-lg ${netProfit >= 0 ? 'text-[#2F2FE4]' : 'text-red-600'}`}>{formatRupiah(netProfit)}</td>
                        </tr>
                      </tfoot>
                    )}
                  </table>
                </div>

                {/* Sign-off */}
                <div className="flex justify-end pt-4 border-t border-gray-100">
                  <div className="text-center text-xs text-gray-500 font-bold space-y-1">
                    <p>Jakarta, {new Date().toLocaleDateString('id-ID', {day:'numeric', month:'long', year:'numeric'})}</p>
                    <div className="h-12"></div>
                    <p className="font-black text-gray-800 underline">Santi Rahayu, M.Ak</p>
                    <p className="text-[10px] text-gray-400">Finance &amp; Operations Manager</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="bg-gray-50 border-t border-gray-150 p-4 flex justify-end gap-2.5 no-print-element">
              <button onClick={() => setShowPrintKeuangan(false)} className="bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-xs px-4 py-2 rounded-xl cursor-pointer">Tutup</button>
              <button onClick={() => window.print()} className="bg-[#2F2FE4] hover:bg-[#2020D0] text-white font-extrabold text-xs px-4 py-2 rounded-xl shadow-xs flex items-center gap-1.5 cursor-pointer">
                <Printer size={14} /><span>Cetak / Unduh PDF</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===== MODAL PRINT PREVIEW: LAPORAN TAGIHAN INVOICE AJK ===== */}
      {showPrintInvoice && (
        <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4 bg-gray-950/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl border border-gray-200 shadow-2xl w-full max-w-4xl overflow-hidden">

            {/* Toolbar */}
            <div className="bg-gray-50 border-b border-gray-150 p-4 flex items-center justify-between no-print-element">
              <span className="text-xs font-black text-gray-800 flex items-center gap-1.5">
                <Printer className="text-indigo-600" size={16} />
                <span>Preview Laporan Tagihan Invoice AJK</span>
                <span className="ml-2 text-[10px] font-bold text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
                  Periode: {startDate} s/d {endDate}
                </span>
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-extrabold px-3 py-1.5 rounded-lg shadow-xs flex items-center gap-1 cursor-pointer transition-all active:scale-95"
                >
                  <Printer size={13} />
                  <span>Cetak / Unduh PDF</span>
                </button>
                <button
                  onClick={() => setShowPrintInvoice(false)}
                  className="bg-gray-200 hover:bg-gray-300 text-gray-700 text-xs font-bold px-3 py-1.5 rounded-lg cursor-pointer"
                >
                  Tutup
                </button>
              </div>
            </div>

            {/* Printable Area */}
            <div className="p-6 md:p-8 max-h-[75vh] overflow-y-auto" id="printable-invoice-laporan-area">
              <style dangerouslySetInnerHTML={{__html: `
                @media print {
                  body * { visibility: hidden !important; }
                  #printable-invoice-laporan-area, #printable-invoice-laporan-area * { visibility: visible !important; }
                  #printable-invoice-laporan-area {
                    position: absolute !important;
                    left: 0 !important; top: 0 !important;
                    width: 100% !important;
                    max-height: none !important;
                    overflow: visible !important;
                    padding: 24px !important;
                    background: white !important;
                  }
                  .no-print-element { display: none !important; }
                }
              `}} />

              <div className="space-y-6">
                {/* Letterhead */}
                <div className="flex items-start justify-between border-b-2 border-gray-100 pb-5">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <div className="bg-indigo-600 p-1.5 rounded-lg text-white"><Building size={18} /></div>
                      <span className="text-sm font-black tracking-tight text-gray-900 uppercase">PT Armada Trans Logistik</span>
                    </div>
                    <p className="text-[10px] text-gray-400 font-semibold leading-relaxed">
                      Jl. Boulevard Barat No. 88, Kelapa Gading, Jakarta Utara<br />
                      Telp: (021) 4588-9000 | billing@armadatrans.com
                    </p>
                  </div>
                  <div className="text-right">
                    <h2 className="text-lg font-black text-indigo-600 uppercase tracking-tight">Rekap Tagihan Invoice AJK</h2>
                    <p className="text-[10px] text-gray-400 font-bold mt-1">Periode Jatuh Tempo: {startDate} s/d {endDate}</p>
                    <p className="text-[10px] text-gray-400 font-bold">Dicetak: {new Date().toLocaleDateString('id-ID', {day:'numeric', month:'long', year:'numeric'})}</p>
                  </div>
                </div>

                {/* AJK Summary Cards */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {[
                    { label: 'Total Invoice', value: formatRupiah(ajkStats.total), color: 'text-gray-800', bg: 'bg-gray-50' },
                    { label: 'Sudah Lunas', value: formatRupiah(ajkStats.paid), color: 'text-green-600', bg: 'bg-green-50' },
                    { label: 'Belum Lunas', value: formatRupiah(ajkStats.unpaid), color: 'text-amber-600', bg: 'bg-amber-50' },
                    { label: 'Tunggakan Kritis', value: formatRupiah(ajkStats.critical), color: 'text-red-600', bg: 'bg-red-50' },
                  ].map((card) => (
                    <div key={card.label} className={`${card.bg} rounded-xl p-3 border border-gray-100`}>
                      <p className="text-[9px] font-black text-gray-500 uppercase tracking-wider">{card.label}</p>
                      <p className={`text-sm font-black mt-1 ${card.color}`}>{card.value}</p>
                    </div>
                  ))}
                </div>
                <div className="bg-indigo-50 rounded-xl p-3 border border-indigo-100 text-xs font-bold text-indigo-800 flex items-center justify-between">
                  <span>Tingkat Kolektibilitas (% Lunas)</span>
                  <span className="text-sm font-black text-indigo-700">
                    {ajkStats.total > 0 ? ((ajkStats.paid / ajkStats.total) * 100).toFixed(1) : '0.0'}%
                  </span>
                </div>

                {/* Tabel Invoice */}
                <div>
                  <h3 className="text-xs font-black text-gray-700 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <span>Daftar Invoice</span>
                    <span className="bg-gray-200 text-gray-600 px-2 py-0.5 rounded-full text-[9px]">{filteredAjkInvoiceList.length} Invoice</span>
                  </h3>
                  <table className="w-full text-left text-[10px] border-collapse">
                    <thead>
                      <tr className="bg-indigo-600 text-white">
                        <th className="py-2 px-3 font-black rounded-tl-lg">No. Invoice</th>
                        <th className="py-2 px-3 font-black">Klien</th>
                        <th className="py-2 px-3 font-black">Bulan</th>
                        <th className="py-2 px-3 font-black text-right">Nominal</th>
                        <th className="py-2 px-3 font-black">Jatuh Tempo</th>
                        <th className="py-2 px-3 font-black">Tunggakan</th>
                        <th className="py-2 px-3 font-black text-center rounded-tr-lg">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {filteredAjkInvoiceList.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="py-6 text-center text-gray-400 font-bold">Tidak ada invoice dalam periode ini</td>
                        </tr>
                      ) : filteredAjkInvoiceList.map((inv) => (
                        <tr key={inv.id} className={`hover:bg-gray-50/50 ${inv.status === 'Menunggak' && inv.delinquentMonths >= 3 ? 'bg-red-50/30' : ''}`}>
                          <td className="py-2 px-3 font-mono text-[9px] text-gray-600">{inv.invoiceNumber}</td>
                          <td className="py-2 px-3 font-bold text-gray-800">{inv.companyName}</td>
                          <td className="py-2 px-3 text-gray-600">{inv.billingMonth}</td>
                          <td className="py-2 px-3 text-right font-bold text-gray-800">{formatRupiah(inv.amount)}</td>
                          <td className="py-2 px-3 text-gray-500">{inv.dueDate}</td>
                          <td className="py-2 px-3 text-center">
                            {inv.delinquentMonths > 0 ? (
                              <span className={`font-black px-1.5 py-0.5 rounded-full text-[9px] ${inv.delinquentMonths >= 3 ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'}`}>
                                {inv.delinquentMonths} Bln
                              </span>
                            ) : <span className="text-gray-300">—</span>}
                          </td>
                          <td className="py-2 px-3 text-center">
                            <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase ${
                              inv.status === 'Lunas' ? 'bg-green-100 text-green-700' :
                              inv.status === 'Menunggak' ? 'bg-red-100 text-red-700' :
                              'bg-amber-100 text-amber-700'
                            }`}>
                              {inv.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    {filteredAjkInvoiceList.length > 0 && (
                      <tfoot>
                        <tr className="bg-gray-100 font-black text-xs border-t-2 border-gray-300">
                          <td colSpan={3} className="py-2 px-3 text-gray-700 rounded-bl-lg">TOTAL ({filteredAjkInvoiceList.length} Invoice)</td>
                          <td className="py-2 px-3 text-right text-gray-800">{formatRupiah(ajkStats.total)}</td>
                          <td colSpan={3} className="py-2 px-3 text-right rounded-br-lg">
                            <span className="text-green-700">Lunas: {formatRupiah(ajkStats.paid)}</span>
                            <span className="mx-2 text-gray-400">|</span>
                            <span className="text-amber-700">Belum: {formatRupiah(ajkStats.unpaid)}</span>
                          </td>
                        </tr>
                      </tfoot>
                    )}
                  </table>
                </div>

                {/* Sign-off */}
                <div className="flex justify-end pt-4 border-t border-gray-100">
                  <div className="text-center text-xs text-gray-500 font-bold space-y-1">
                    <p>Jakarta, {new Date().toLocaleDateString('id-ID', {day:'numeric', month:'long', year:'numeric'})}</p>
                    <div className="h-12"></div>
                    <p className="font-black text-gray-800 underline">Santi Rahayu, M.Ak</p>
                    <p className="text-[10px] text-gray-400">Finance &amp; Billing Department Head</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="bg-gray-50 border-t border-gray-150 p-4 flex justify-end gap-2.5 no-print-element">
              <button onClick={() => setShowPrintInvoice(false)} className="bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-xs px-4 py-2 rounded-xl cursor-pointer">Tutup</button>
              <button onClick={() => window.print()} className="bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs px-4 py-2 rounded-xl shadow-xs flex items-center gap-1.5 cursor-pointer">
                <Printer size={14} /><span>Cetak / Unduh PDF</span>
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { AjkInvoice, AjkSchedule } from '../types';
import { Building, DollarSign, AlertCircle, CheckCircle, FileText, ChevronDown, ChevronUp, CalendarDays, PieChart } from 'lucide-react';
import StatusBadge from './StatusBadge';
import AjkInvoiceTab from './AjkInvoiceTab';

interface LaporanAJKProps {
  ajkList?: AjkSchedule[];
  ajkInvoiceList: AjkInvoice[];
  onAddAjkInvoice?: (invoice: Omit<AjkInvoice, 'id'>) => void;
  onUpdateAjkInvoice?: (id: string, updated: Partial<AjkInvoice>) => void;
  onDeleteAjkInvoice?: (id: string) => void;
}

export default function LaporanAJK({
  ajkList = [],
  ajkInvoiceList = [],
  onAddAjkInvoice = () => {},
  onUpdateAjkInvoice = () => {},
  onDeleteAjkInvoice = () => {},
}: LaporanAJKProps) {
  const [activeSubTab, setActiveSubTab] = useState<'ringkasan' | 'invoice_mgmt'>('ringkasan');
  const [filterStatus, setFilterStatus] = useState<'Semua' | 'Lunas' | 'Menunggak'>('Semua');
  const [expandedInvoiceIds, setExpandedInvoiceIds] = useState<Record<string, boolean>>({});

  const toggleInvoiceExpand = (id: string) => {
    setExpandedInvoiceIds((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const toggleAll = (expand: boolean) => {
    const newState: Record<string, boolean> = {};
    ajkInvoiceList.forEach((inv) => {
      newState[inv.id] = expand;
    });
    setExpandedInvoiceIds(newState);
  };

  // Count critical overdue invoices (>=3 months)
  const criticalInvoicesCount = ajkInvoiceList.filter(
    (item) => item.status === 'Menunggak' && item.delinquentMonths >= 3
  ).length;

  // Filter invoices for ringkasan tab
  const filteredInvoices = ajkInvoiceList.filter((inv) => {
    if (filterStatus === 'Semua') return true;
    return inv.status === filterStatus;
  });

  // Calculate totals
  const totalPendapatan = ajkInvoiceList.reduce((sum, inv) => sum + inv.amount, 0);
  const totalLunas = ajkInvoiceList
    .filter((inv) => inv.status === 'Lunas')
    .reduce((sum, inv) => sum + inv.amount, 0);
  const totalMenunggak = ajkInvoiceList
    .filter((inv) => inv.status === 'Menunggak')
    .reduce((sum, inv) => sum + inv.amount, 0);
  const countMenunggak = ajkInvoiceList.filter((inv) => inv.status === 'Menunggak').length;

  return (
    <div className="flex flex-col h-full gap-6 overflow-y-auto pb-8 pr-1 scrollbar-thin">
      {/* HEADER SECTION WITH TITLE & SUB-TAB SWITCHER */}
      <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-gray-800 flex items-center gap-2">
            <Building className="text-[#2F2FE4]" size={22} />
            <span>Laporan AJK & Invoice Tagihan Bulanan</span>
          </h2>
          <p className="text-xs text-gray-500 font-semibold mt-1">
            Pusat manajemen invoice tagihan bulanan AJK Korporat, pencetakan kwitansi, serta laporan piutang.
          </p>
        </div>

        {/* Sub-Tab Switcher */}
        <div className="flex bg-[#E4E6EB] p-1 rounded-xl border border-gray-300 self-start md:self-center shrink-0 shadow-inner">
          <button
            type="button"
            onClick={() => setActiveSubTab('ringkasan')}
            className={`px-4 py-2 text-xs font-extrabold rounded-lg transition-all flex items-center gap-2 cursor-pointer ${
              activeSubTab === 'ringkasan'
                ? 'bg-white text-[#2F2FE4] shadow-sm'
                : 'text-gray-500 hover:text-gray-800'
            }`}
          >
            <PieChart size={14} />
            <span>Ringkasan & Filter Tagihan</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveSubTab('invoice_mgmt')}
            className={`px-4 py-2 text-xs font-extrabold rounded-lg transition-all flex items-center gap-2 cursor-pointer relative ${
              activeSubTab === 'invoice_mgmt'
                ? 'bg-white text-[#2F2FE4] shadow-sm'
                : 'text-gray-500 hover:text-gray-800'
            }`}
          >
            <FileText size={14} />
            <span>Kelola Invoice & Tagihan</span>
            {criticalInvoicesCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 bg-red-600 text-white text-[9px] font-black w-4 h-4 rounded-full flex items-center justify-center animate-pulse border-2 border-white">
                {criticalInvoicesCount}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* RENDER ACTIVE SUB-TAB */}
      {activeSubTab === 'ringkasan' ? (
        <div className="space-y-6">
          {/* Controls Bar for Accordion */}
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-500 font-semibold">Tampilan Ringkas List Invoice Accordion</span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => toggleAll(true)}
                className="text-[11px] font-bold text-[#2F2FE4] hover:bg-blue-50 px-3 py-1.5 rounded-lg transition-all"
              >
                Buka Semua
              </button>
              <button
                onClick={() => toggleAll(false)}
                className="text-[11px] font-bold text-gray-500 hover:bg-gray-100 px-3 py-1.5 rounded-lg transition-all"
              >
                Tutup Semua
              </button>
            </div>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="card">
              <div className="flex items-center justify-between mb-2">
                <span className="text-label">Total Pendapatan</span>
                <DollarSign size={18} className="text-blue-600" />
              </div>
              <div className="text-heading text-xl md:text-2xl font-bold">
                Rp {totalPendapatan.toLocaleString('id-ID')}
              </div>
            </div>

            <div className="card">
              <div className="flex items-center justify-between mb-2">
                <span className="text-label">Sudah Lunas</span>
                <CheckCircle size={18} className="text-green-600" />
              </div>
              <div className="text-heading text-xl md:text-2xl font-bold text-green-600">
                Rp {totalLunas.toLocaleString('id-ID')}
              </div>
            </div>

            <div className="card">
              <div className="flex items-center justify-between mb-2">
                <span className="text-label">Menunggak</span>
                <AlertCircle size={18} className="text-red-600" />
              </div>
              <div className="text-heading text-xl md:text-2xl font-bold text-red-600">
                Rp {totalMenunggak.toLocaleString('id-ID')}
              </div>
            </div>

            <div className="card">
              <div className="flex items-center justify-between mb-2">
                <span className="text-label">Invoice Menunggak</span>
                <FileText size={18} className="text-amber-600" />
              </div>
              <div className="text-heading text-xl md:text-2xl font-bold text-amber-600">
                {countMenunggak}
              </div>
            </div>
          </div>

          {/* Filter Status */}
          <div className="card">
            <div className="flex items-center gap-2">
              <span className="text-label">Filter Status:</span>
              {['Semua', 'Lunas', 'Menunggak'].map((status) => (
                <button
                  key={status}
                  onClick={() => setFilterStatus(status as any)}
                  className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-colors ${
                    filterStatus === status
                      ? 'bg-[#2F2FE4] text-white shadow-sm'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {status}
                </button>
              ))}
            </div>
          </div>

          {/* Invoice List (Collapsible Accordion Dropdown) */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-gray-800">Daftar Invoice ({filteredInvoices.length})</h3>
              <span className="text-xs text-gray-400 font-semibold">Klik baris invoice untuk melihat detail</span>
            </div>

            {filteredInvoices.length === 0 ? (
              <div className="card text-center py-8">
                <p className="text-body text-gray-400">Tidak ada invoice</p>
              </div>
            ) : (
              filteredInvoices.map((invoice) => {
                const isExpanded = !!expandedInvoiceIds[invoice.id];
                return (
                  <div
                    key={invoice.id}
                    className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden transition-all duration-200 hover:border-blue-300"
                  >
                    {/* Dropdown Summary Row Header */}
                    <button
                      onClick={() => toggleInvoiceExpand(invoice.id)}
                      className="w-full text-left p-4 flex items-center justify-between gap-3 bg-white hover:bg-gray-50/80 transition-colors focus:outline-none"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="p-2 bg-blue-50 text-[#2F2FE4] rounded-xl shrink-0">
                          <Building size={18} />
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-sm text-gray-900 truncate">{invoice.companyName}</span>
                            <StatusBadge status={invoice.status} size="sm" />
                          </div>
                          <p className="text-xs text-gray-500 font-semibold mt-0.5">
                            {invoice.invoiceNumber} • Periode: {invoice.billingMonth}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-4 shrink-0">
                        <div className="text-right">
                          <div className="font-black text-sm text-blue-600">
                            Rp {invoice.amount.toLocaleString('id-ID')}
                          </div>
                          <div className="text-[10px] text-gray-400 font-medium">
                            Jatuh Tempo: {invoice.dueDate}
                          </div>
                        </div>
                        <div className="p-1 rounded-lg text-gray-400 hover:bg-gray-200 transition-colors">
                          {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                        </div>
                      </div>
                    </button>

                    {/* Dropdown Collapsible Detail Panel */}
                    {isExpanded && (
                      <div className="px-4 pb-4 pt-2 border-t border-gray-100 bg-gray-50/50 space-y-3">
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                          <div className="bg-white p-2.5 rounded-xl border border-gray-100 shadow-2xs">
                            <span className="text-[10px] text-gray-400 font-extrabold uppercase">No. Invoice</span>
                            <p className="font-bold text-gray-800 mt-0.5">{invoice.invoiceNumber}</p>
                          </div>
                          <div className="bg-white p-2.5 rounded-xl border border-gray-100 shadow-2xs">
                            <span className="text-[10px] text-gray-400 font-extrabold uppercase">Periode Tagihan</span>
                            <p className="font-bold text-gray-800 mt-0.5">{invoice.billingMonth}</p>
                          </div>
                          <div className="bg-white p-2.5 rounded-xl border border-gray-100 shadow-2xs">
                            <span className="text-[10px] text-gray-400 font-extrabold uppercase">Status & Tunggakan</span>
                            <p className={`font-bold mt-0.5 ${invoice.delinquentMonths > 0 ? 'text-red-600' : 'text-emerald-600'}`}>
                              {invoice.status} {invoice.delinquentMonths > 0 ? `(${invoice.delinquentMonths} Bln)` : ''}
                            </p>
                          </div>
                          <div className="bg-white p-2.5 rounded-xl border border-gray-100 shadow-2xs">
                            <span className="text-[10px] text-gray-400 font-extrabold uppercase">Tanggal Pembayaran</span>
                            <p className="font-bold text-gray-800 mt-0.5">{invoice.paymentDate || '-'}</p>
                          </div>
                        </div>

                        {invoice.notes && (
                          <div className="p-3 bg-white rounded-xl border border-gray-100 text-xs">
                            <span className="text-[10px] text-gray-400 font-extrabold uppercase">Catatan Penagihan</span>
                            <p className="text-gray-700 font-medium mt-1">{invoice.notes}</p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      ) : (
        <AjkInvoiceTab
          ajkList={ajkList}
          ajkInvoiceList={ajkInvoiceList}
          onAddAjkInvoice={onAddAjkInvoice}
          onUpdateAjkInvoice={onUpdateAjkInvoice}
          onDeleteAjkInvoice={onDeleteAjkInvoice}
        />
      )}
    </div>
  );
}

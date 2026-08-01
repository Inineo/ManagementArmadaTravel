/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { AjkSchedule, Driver, Armada, AjkInvoice } from '../types';
import {
  CalendarDays,
  Building,
  FileText
} from 'lucide-react';
import AjkScheduleTab from './AjkScheduleTab';
import AjkInvoiceTab from './AjkInvoiceTab';

interface AjkTabProps {
  ajkList: AjkSchedule[];
  driversList: Driver[];
  armadaList: Armada[];
  onAddAjk: (schedule: Omit<AjkSchedule, 'id'>) => void;
  onUpdateAjk: (id: string, updated: Partial<AjkSchedule>) => void;
  onDeleteAjk: (id: string) => void;
  ajkInvoiceList: AjkInvoice[];
  onAddAjkInvoice: (invoice: Omit<AjkInvoice, 'id'>) => void;
  onUpdateAjkInvoice: (id: string, updated: Partial<AjkInvoice>) => void;
  onDeleteAjkInvoice: (id: string) => void;
}

export default function AjkTab({
  ajkList,
  driversList,
  armadaList,
  onAddAjk,
  onUpdateAjk,
  onDeleteAjk,
  ajkInvoiceList = [],
  onAddAjkInvoice,
  onUpdateAjkInvoice,
  onDeleteAjkInvoice,
}: AjkTabProps) {
  const [activeSubTab, setActiveSubTab] = useState<'jadwal' | 'invoice'>('jadwal');

  // Count critical overdue invoices (&ge;3 months)
  const criticalInvoicesCount = ajkInvoiceList.filter(
    (item) => item.status === 'Menunggak' && item.delinquentMonths >= 3
  ).length;

  return (
    <div id="ajk-tab-container" className="flex flex-col h-full space-y-6 overflow-y-auto pb-8 pr-1">
      
      {/* HEADER SECTION WITH TITLE & SUB-TAB TOGGLES */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-200 pb-4 shrink-0">
        <div>
          <h1 className="text-xl font-black text-gray-800 flex items-center gap-2">
            <Building className="text-[#2F2FE4]" size={24} />
            <span>Sistem Layanan AJK (Antar Jemput Karyawan)</span>
          </h1>
          <p className="text-xs text-gray-500 font-bold mt-1">
            Manajemen rute jemputan terjadwal, pelaporan invoice tagihan bulanan, serta mitigasi risiko piutang tertunggak klien perusahaan.
          </p>
        </div>

        {/* Sub-tab Switcher Buttons */}
        <div className="flex bg-[#E4E6EB] p-1.5 rounded-xl border border-gray-300 self-start md:self-center shrink-0 shadow-inner">
          <button
            type="button"
            onClick={() => setActiveSubTab('jadwal')}
            className={`px-4 py-2.5 text-xs font-extrabold rounded-lg transition-all flex items-center gap-2 cursor-pointer ${
              activeSubTab === 'jadwal'
                ? 'bg-white text-[#2F2FE4] shadow-sm'
                : 'text-gray-500 hover:text-gray-800'
            }`}
          >
            <CalendarDays size={14} />
            <span>Jadwal Harian AJK</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveSubTab('invoice')}
            className={`px-4 py-2.5 text-xs font-extrabold rounded-lg transition-all flex items-center gap-2 cursor-pointer relative ${
              activeSubTab === 'invoice'
                ? 'bg-white text-[#2F2FE4] shadow-sm'
                : 'text-gray-500 hover:text-gray-800'
            }`}
          >
            <FileText size={14} />
            <span>Invoice &amp; Tagihan Bulanan</span>
            {criticalInvoicesCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 bg-red-600 text-white text-[9px] font-black w-5 h-5 rounded-full flex items-center justify-center animate-pulse border-2 border-white">
                {criticalInvoicesCount}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* RENDER ACTIVE SUB-TAB COMPONENT */}
      {activeSubTab === 'jadwal' ? (
        <AjkScheduleTab
          ajkList={ajkList}
          driversList={driversList}
          armadaList={armadaList}
          onAddAjk={onAddAjk}
          onUpdateAjk={onUpdateAjk}
          onDeleteAjk={onDeleteAjk}
        />
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

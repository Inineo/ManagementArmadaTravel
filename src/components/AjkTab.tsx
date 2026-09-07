/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { AjkSchedule, Driver, Armada } from '../types';
import { Building, CalendarDays } from 'lucide-react';
import AjkScheduleTab from './AjkScheduleTab';

interface AjkTabProps {
  ajkList: AjkSchedule[];
  driversList: Driver[];
  armadaList: Armada[];
  onAddAjk: (schedule: Omit<AjkSchedule, 'id'>) => void;
  onUpdateAjk: (id: string, updated: Partial<AjkSchedule>) => void;
  onDeleteAjk: (id: string) => void;
}

export default function AjkTab({
  ajkList,
  driversList,
  armadaList,
  onAddAjk,
  onUpdateAjk,
  onDeleteAjk,
}: AjkTabProps) {
  return (
    <div id="ajk-tab-container" className="flex flex-col h-full space-y-6 overflow-y-auto pb-8 pr-1 scrollbar-thin">
      {/* HEADER SECTION */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-200 pb-4 shrink-0">
        <div>
          <h1 className="text-xl font-black text-gray-800 flex items-center gap-2">
            <Building className="text-[#2F2FE4]" size={24} />
            <span>Jadwal Operasional AJK (Antar Jemput Karyawan)</span>
          </h1>
          <p className="text-xs text-gray-500 font-bold mt-1">
            Manajemen rute jemputan karyawan harian, titik kumpul, jadwal armada, dan penugasan driver.
          </p>
        </div>
      </div>

      {/* RENDER JADWAL AJK COMPONENT */}
      <AjkScheduleTab
        ajkList={ajkList}
        driversList={driversList}
        armadaList={armadaList}
        onAddAjk={onAddAjk}
        onUpdateAjk={onUpdateAjk}
        onDeleteAjk={onDeleteAjk}
      />
    </div>
  );
}

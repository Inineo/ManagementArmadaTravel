/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { AjkSchedule, Driver, Armada } from '../types';
import {
  CalendarDays,
  Clock,
  MapPin,
  Users,
  Plus,
  Trash2,
  ToggleLeft,
  ToggleRight,
  CheckCircle2,
  Building,
  Info,
  Briefcase,
  Search,
  Check,
  AlertTriangle
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface AjkScheduleTabProps {
  ajkList: AjkSchedule[];
  driversList: Driver[];
  armadaList: Armada[];
  onAddAjk: (schedule: Omit<AjkSchedule, 'id'>) => void;
  onUpdateAjk: (id: string, updated: Partial<AjkSchedule>) => void;
  onDeleteAjk: (id: string) => void;
}

export default function AjkScheduleTab({
  ajkList,
  driversList,
  armadaList,
  onAddAjk,
  onUpdateAjk,
  onDeleteAjk,
}: AjkScheduleTabProps) {
  const [showAddForm, setShowAddForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // Form states
  const [routeName, setRouteName] = useState('');
  const [driverId, setDriverId] = useState('');
  const [armadaId, setArmadaId] = useState('');
  const [selectedDays, setSelectedDays] = useState<string[]>(['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat']);
  const [routeStops, setRouteStops] = useState<{ stopName: string; time: string }[]>([
    { stopName: '', time: '06:00' },
    { stopName: '', time: '07:30' }
  ]);
  const [passengerCount, setPassengerCount] = useState<number>(10);
  const [formError, setFormError] = useState('');

  const daysOfWeek = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu'];

  // Toggle operational days checkbox
  const handleDayToggle = (day: string) => {
    if (selectedDays.includes(day)) {
      setSelectedDays(selectedDays.filter((d) => d !== day));
    } else {
      setSelectedDays([...selectedDays, day]);
    }
  };

  // Submit new schedule
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!routeName.trim()) {
      setFormError('Nama rute AJK harus diisi.');
      return;
    }
    if (!driverId) {
      setFormError('Silakan pilih driver untuk penjemputan ini.');
      return;
    }
    if (!armadaId) {
      setFormError('Silakan pilih armada mobil.');
      return;
    }

    const filteredRouteStops = routeStops.map((rs) => ({
      stopName: rs.stopName.trim(),
      time: rs.time.trim()
    })).filter((rs) => rs.stopName !== '');

    if (filteredRouteStops.length < 2) {
      setFormError('Rute AJK harus memiliki minimal lokasi penjemputan awal dan lokasi kantor tujuan.');
      return;
    }
    if (routeStops.some((rs) => !rs.stopName.trim() || !rs.time.trim())) {
      setFormError('Semua kolom nama titik lokasi dan jam jadwal wajib diisi.');
      return;
    }

    const pickupPoint = filteredRouteStops[0].stopName;
    const officeDestination = filteredRouteStops[filteredRouteStops.length - 1].stopName;

    if (selectedDays.length === 0) {
      setFormError('Pilih minimal 1 hari operasional.');
      return;
    }
    if (passengerCount <= 0) {
      setFormError('Jumlah penumpang minimal adalah 1 orang.');
      return;
    }

    // Get selected driver & vehicle details
    const selectedDriver = driversList.find((d) => d.id === driverId);
    const selectedArmada = armadaList.find((a) => a.id === armadaId);

    if (!selectedDriver || !selectedArmada) {
      setFormError('Driver atau Armada tidak valid.');
      return;
    }

    onAddAjk({
      routeName: routeName.trim(),
      driverId: selectedDriver.id,
      driverName: selectedDriver.name,
      armadaId: selectedArmada.id,
      plateNumber: selectedArmada.plateNumber,
      carType: selectedArmada.carType,
      days: selectedDays,
      pickupPoint,
      officeDestination,
      routes: filteredRouteStops.map(rs => rs.stopName),
      routeStops: filteredRouteStops,
      passengerCount,
      status: 'Aktif',
    });

    // Reset Form
    setRouteName('');
    setDriverId('');
    setArmadaId('');
    setSelectedDays(['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat']);
    setRouteStops([
      { stopName: '', time: '06:00' },
      { stopName: '', time: '07:30' }
    ]);
    setPassengerCount(10);
    setShowAddForm(false);
  };

  // Toggle status schedule Aktif / Nonaktif
  const handleToggleStatus = (id: string, currentStatus: 'Aktif' | 'Nonaktif') => {
    onUpdateAjk(id, {
      status: currentStatus === 'Aktif' ? 'Nonaktif' : 'Aktif',
    });
  };

  // Filters
  const filteredAjk = ajkList.filter((item) => {
    const searchLower = searchTerm.toLowerCase();
    return (
      item.routeName.toLowerCase().includes(searchLower) ||
      item.driverName.toLowerCase().includes(searchLower) ||
      item.plateNumber.toLowerCase().includes(searchLower) ||
      item.pickupPoint.toLowerCase().includes(searchLower) ||
      item.officeDestination.toLowerCase().includes(searchLower)
    );
  });

  const activeSchedulesCount = ajkList.filter((a) => a.status === 'Aktif').length;
  const totalPassengersCount = ajkList
    .filter((a) => a.status === 'Aktif')
    .reduce((acc, curr) => acc + curr.passengerCount, 0);

  return (
    <div className="space-y-6">
      {/* SUMMARY DASHBOARD CARDS FOR AJK */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 shrink-0">
        {/* Active Schedules Card */}
        <div className="bg-white border border-gray-200 rounded-2xl p-5 flex flex-col justify-between shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Jadwal Aktif</span>
            <span className="p-2 bg-indigo-50 text-indigo-500 rounded-lg">
              <CalendarDays size={18} />
            </span>
          </div>
          <div className="mt-4">
            <div className="text-2xl lg:text-3xl font-black text-gray-800">
              {activeSchedulesCount} <span className="text-sm text-gray-400 font-semibold">dari {ajkList.length} Rute</span>
            </div>
            <p className="text-xs text-gray-400 font-bold mt-1">Sistem Antar Jemput Kantor (AJK) aktif harian</p>
          </div>
          <div className="absolute right-[-10px] bottom-[-15px] text-gray-100/30 font-black text-6xl pointer-events-none select-none">
            AJK
          </div>
        </div>

        {/* Total Passengers Serviced */}
        <div className="bg-white border border-gray-200 rounded-2xl p-5 flex flex-col justify-between shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Total Penumpang</span>
            <span className="p-2 bg-blue-50 text-blue-500 rounded-lg">
              <Users size={18} />
            </span>
          </div>
          <div className="mt-4">
            <div className="text-2xl lg:text-3xl font-black text-gray-800">{totalPassengersCount} Orang</div>
            <p className="text-xs text-gray-400 font-bold mt-1">Karyawan/staf yang menggunakan layanan aktif harian</p>
          </div>
          <div className="absolute right-[-10px] bottom-[-15px] text-gray-100/30 font-black text-6xl pointer-events-none select-none">
            Pax
          </div>
        </div>

        {/* Info Card */}
        <div className="bg-blue-50/75 border border-blue-100 rounded-2xl p-5 flex flex-col justify-between shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-extrabold text-blue-700 uppercase tracking-wider">Info Operasional</span>
            <span className="p-2 bg-blue-100 text-blue-600 rounded-lg">
              <Briefcase size={18} />
            </span>
          </div>
          <div className="mt-3 text-xs text-blue-800 font-medium leading-relaxed">
            Sistem AJK merupakan rute rutin terjadwal dari titik kumpul perumahan/stasiun langsung ke area perkantoran pusat. Mengurangi beban administrasi pemesanan harian secara manual.
          </div>
        </div>
      </div>

      {/* SEARCH AND MAIN ACTIONS PANEL */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-gray-200 shadow-sm shrink-0">
        {/* Search Input */}
        <div className="relative w-full sm:w-80">
          <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">
            <Search size={16} />
          </span>
          <input
            type="text"
            placeholder="Cari rute, driver, no plat..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full text-xs font-semibold text-gray-700 bg-gray-50 border border-gray-200 rounded-xl py-2.5 pl-10 pr-4 focus:outline-none focus:ring-2 focus:ring-[#2F2FE4]/20 focus:border-[#2F2FE4]"
          />
        </div>

        {/* Add AJK Button */}
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="w-full sm:w-auto flex items-center justify-center gap-2 bg-[#2F2FE4] hover:bg-[#2020D0] text-white font-extrabold text-xs px-5 py-2.5 rounded-xl shadow-md border border-transparent transition-all active:scale-95 transform hover:scale-[1.01] cursor-pointer"
        >
          <Plus size={18} />
          <span>Tambah Jadwal AJK</span>
        </button>
      </div>

      {/* INTERACTIVE FORM PANEL (FADE IN/OUT) */}
      <AnimatePresence>
        {showAddForm && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="bg-white border border-gray-200 rounded-2xl p-6 shadow-md"
          >
            <div className="flex items-center justify-between border-b border-gray-100 pb-3 mb-4">
              <h3 className="text-sm font-black text-gray-800 flex items-center gap-2">
                <CalendarDays className="text-[#2F2FE4]" size={18} />
                <span>Form Buat Jadwal Rutin AJK Baru</span>
              </h3>
              <button
                onClick={() => setShowAddForm(false)}
                className="text-xs text-gray-400 hover:text-gray-650 font-extrabold cursor-pointer"
              >
                Tutup [X]
              </button>
            </div>

            {formError && (
              <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 p-3 rounded-xl text-xs font-semibold mb-4">
                <AlertTriangle size={16} className="shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                
                {/* Route Name */}
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5">
                    Nama Rute AJK
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: Jemputan BCA Sudirman Pagi"
                    value={routeName}
                    onChange={(e) => setRouteName(e.target.value)}
                    className="w-full text-xs font-semibold text-gray-700 border border-gray-200 rounded-lg p-2.5 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-[#2F2FE4]/10 focus:border-[#2F2FE4]"
                  />
                </div>

                {/* Driver */}
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5">
                    Driver (Sopir)
                  </label>
                  <select
                    required
                    value={driverId}
                    onChange={(e) => setDriverId(e.target.value)}
                    className="w-full text-xs font-semibold text-gray-700 border border-gray-200 rounded-lg p-2.5 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-[#2F2FE4]/10 focus:border-[#2F2FE4]"
                  >
                    <option value="">-- Pilih Driver --</option>
                    {driversList.map((driver) => (
                      <option key={driver.id} value={driver.id}>
                        {driver.name} ({driver.status === 'Ready' ? 'Ready' : 'Sedang Jalan'})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Armada */}
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5">
                    Armada Mobil
                  </label>
                  <select
                    required
                    value={armadaId}
                    onChange={(e) => setArmadaId(e.target.value)}
                    className="w-full text-xs font-semibold text-gray-700 border border-gray-200 rounded-lg p-2.5 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-[#2F2FE4]/10 focus:border-[#2F2FE4]"
                  >
                    <option value="">-- Pilih Armada --</option>
                    {armadaList.map((car) => (
                      <option key={car.id} value={car.id}>
                        {car.plateNumber} — {car.carType} ({car.status})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Rute & Jadwal Waktu Per Titik Lokasi */}
                <div className="col-span-full bg-gray-50 p-4 rounded-xl border border-gray-200 space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-1">
                    <div>
                      <label className="text-xs font-bold text-gray-500 uppercase tracking-wider flex items-center gap-1.5">
                        <MapPin size={14} className="text-[#2F2FE4]" />
                        <span>Rute &amp; Jadwal Waktu per Titik ({routeStops.length} Titik)</span>
                      </label>
                      <p className="text-[10px] text-gray-400 font-semibold mt-0.5">
                        Tentukan lokasi dan jam jadwal kedatangan/keberangkatan masing-masing titik.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setRouteStops([...routeStops, { stopName: '', time: '07:00' }])}
                      className="text-xs font-extrabold text-[#2F2FE4] hover:text-[#2020D0] bg-white border border-gray-200 rounded-lg px-2.5 py-1.5 shadow-sm transition-all self-start sm:self-center cursor-pointer"
                    >
                      + Tambah Titik &amp; Jadwal Jam
                    </button>
                  </div>

                  <div className="space-y-2.5">
                    {routeStops.map((stop, rIndex) => (
                      <div key={rIndex} className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 bg-white p-2.5 rounded-lg border border-gray-100">
                        <span className="text-[9px] font-black text-gray-400 w-16 bg-gray-50 border border-gray-200 rounded px-1.5 py-1 text-center select-none uppercase shrink-0">
                          {rIndex === 0 ? 'Mulai' : rIndex === routeStops.length - 1 ? 'Kantor' : `Titik {rIndex}`}
                        </span>
                        
                        <input
                          type="text"
                          placeholder={rIndex === 0 ? 'Lokasi Penjemputan Mulai' : rIndex === routeStops.length - 1 ? 'Kantor / Tujuan Akhir' : 'Nama Titik / Lokasi Singgah'}
                          value={stop.stopName}
                          required
                          onChange={(e) => {
                            const updated = [...routeStops];
                            updated[rIndex].stopName = e.target.value;
                            setRouteStops(updated);
                          }}
                          className="flex-1 px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#2F2FE4]/10 text-xs font-semibold"
                        />

                        <div className="flex items-center gap-1 shrink-0 w-full sm:w-28">
                          <Clock size={12} className="text-gray-400 shrink-0" />
                          <input
                            type="time"
                            required
                            value={stop.time}
                            onChange={(e) => {
                              const updated = [...routeStops];
                              updated[rIndex].time = e.target.value;
                              setRouteStops(updated);
                            }}
                            className="flex-1 px-2 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#2F2FE4]/10 text-xs font-bold"
                          />
                        </div>

                        {routeStops.length > 2 && (
                          <button
                            type="button"
                            onClick={() => {
                              const updated = routeStops.filter((_, idx) => idx !== rIndex);
                              setRouteStops(updated);
                            }}
                            className="p-1.5 bg-red-50 text-[#E3342F] hover:bg-red-100 rounded-lg border border-transparent transition-all shrink-0 self-end sm:self-center cursor-pointer"
                            title="Hapus Titik Ini"
                          >
                            <Trash2 size={14} />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Passenger Count */}
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5">
                    Kapasitas / Penumpang (Orang)
                  </label>
                  <input
                    type="number"
                    required
                    min={1}
                    max={30}
                    value={passengerCount}
                    onChange={(e) => setPassengerCount(parseInt(e.target.value, 10) || 0)}
                    className="w-full text-xs font-semibold text-gray-700 border border-gray-200 rounded-lg p-2.5 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-[#2F2FE4]/10 focus:border-[#2F2FE4]"
                  />
                </div>
              </div>

              {/* Day selection */}
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">
                  Hari Operasional Rutin
                </label>
                <div className="flex flex-wrap gap-2">
                  {daysOfWeek.map((day) => {
                    const isSelected = selectedDays.includes(day);
                    return (
                      <button
                        type="button"
                        key={day}
                        onClick={() => handleDayToggle(day)}
                        className={`text-xs font-bold px-3 py-1.5 rounded-lg border transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-[#2F2FE4] border-transparent text-white shadow-sm'
                            : 'bg-gray-50 border-gray-200 text-gray-500 hover:bg-gray-100'
                        }`}
                      >
                        {isSelected && <Check size={12} className="inline mr-1 -mt-0.5" />}
                        {day}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="flex justify-end gap-3 pt-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-xs px-5 py-2.5 rounded-xl transition-all cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="bg-[#2F2FE4] hover:bg-[#2020D0] text-white font-extrabold text-xs px-5 py-2.5 rounded-xl shadow-md transition-all cursor-pointer"
                >
                  Simpan Jadwal AJK
                </button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* AJK SCHEDULES INTERACTIVE GRID/LIST */}
      <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden flex-1 min-h-0">
        <div className="p-5 border-b border-gray-100">
          <h3 className="text-sm font-black text-gray-800">Daftar Jadwal Rute Antar Jemput Kantoran</h3>
          <p className="text-[11px] text-gray-400 font-bold mt-0.5">Seluruh rute kontrak bulanan instansi, lengkap dengan driver, jam operasional, dan rincian multi-stop.</p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50/70 border-b border-gray-200 text-xs font-bold text-gray-500 uppercase tracking-wider">
                <th className="py-3.5 px-4 font-semibold">Nama Rute / Klien</th>
                <th className="py-3.5 px-4 font-semibold">Driver &amp; Armada</th>
                <th className="py-3.5 px-4 font-semibold">Jadwal &amp; Hari</th>
                <th className="py-3.5 px-4 font-semibold">Titik Kumpul &amp; Tujuan</th>
                <th className="py-3.5 px-4 font-semibold text-center">Penumpang</th>
                <th className="py-3.5 px-4 font-semibold text-center">Status</th>
                <th className="py-3.5 px-4 font-semibold text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-xs text-gray-750 font-semibold">
              {filteredAjk.map((ajk) => (
                <tr key={ajk.id} className="hover:bg-gray-50/40 transition-colors">
                  
                  {/* Route name */}
                  <td className="py-4 px-4">
                    <div className="font-bold text-gray-800 flex items-center gap-1.5">
                      <Building size={16} className="text-[#2F2FE4] shrink-0" />
                      <span>{ajk.routeName}</span>
                    </div>
                    <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wide">ID: {ajk.id}</span>
                  </td>

                  {/* Driver & vehicle */}
                  <td className="py-4 px-4">
                    <div className="font-bold text-gray-800">{ajk.driverName}</div>
                    <div className="text-gray-400 font-bold mt-0.5">{ajk.carType}</div>
                    <div className="font-bold text-indigo-600 font-mono text-[9px] bg-indigo-50 px-1.5 py-0.5 rounded inline-block mt-1 border border-indigo-100">
                      {ajk.plateNumber}
                    </div>
                  </td>

                  {/* Days & Time */}
                  <td className="py-4 px-4">
                    <div className="flex flex-wrap gap-1 mb-1.5">
                      {ajk.days.map((day) => (
                        <span key={day} className="bg-gray-100 text-gray-500 font-extrabold px-1.5 py-0.5 rounded text-[9px] border border-gray-150">
                          {day.substring(0, 3)}
                        </span>
                      ))}
                    </div>
                    {(() => {
                      const stops = ajk.routeStops && ajk.routeStops.length > 0
                        ? ajk.routeStops
                        : [
                            { stopName: ajk.pickupPoint || 'Mulai', time: '06:00' },
                            { stopName: ajk.officeDestination || 'Tujuan', time: '07:30' }
                          ];
                      const firstTime = stops[0]?.time || '06:00';
                      const lastTime = stops[stops.length - 1]?.time || '07:30';
                      return (
                        <div className="flex items-center gap-1 text-gray-500 font-bold">
                          <Clock size={11} className="text-gray-450" />
                          <span>{firstTime} - {lastTime}</span>
                        </div>
                      );
                    })()}
                  </td>

                  {/* Points */}
                  <td className="py-4 px-4 max-w-xs">
                    {(() => {
                      const stops = ajk.routeStops && ajk.routeStops.length > 0
                        ? ajk.routeStops
                        : [
                            { stopName: ajk.pickupPoint || 'Mulai', time: '06:00' },
                            { stopName: ajk.officeDestination || 'Tujuan', time: '07:30' }
                          ];
                      return (
                        <div className="space-y-1.5 pl-1.5 border-l border-indigo-100 ml-1 py-1">
                          {stops.map((stop, sIdx, sArr) => (
                            <div key={sIdx} className="relative flex items-center justify-between gap-1.5 pl-2.5">
                              <div className="flex items-center gap-1.5">
                                <span className={`absolute -left-[4.5px] top-1.5 rounded-full border ${
                                  sIdx === 0 
                                    ? 'bg-green-500 border-green-500' 
                                    : sIdx === sArr.length - 1 
                                      ? 'bg-[#2F2FE4] border-[#2F2FE4]' 
                                      : 'bg-white border-indigo-400'
                                }`} style={{ width: '8px', height: '8px' }} />
                                <span className="text-[10px] text-gray-600 font-semibold leading-tight">{stop.stopName}</span>
                              </div>
                              <span className="text-[10px] font-extrabold text-indigo-600 bg-indigo-50 px-1 py-0.5 rounded font-mono shrink-0 ml-2">
                                {stop.time}
                              </span>
                            </div>
                          ))}
                        </div>
                      );
                    })()}
                  </td>

                  {/* Passenger count */}
                  <td className="py-4 px-4 text-center">
                    <div className="font-black text-gray-800 text-sm">{ajk.passengerCount}</div>
                    <span className="text-[9px] text-gray-400 font-bold uppercase">Karyawan</span>
                  </td>

                  {/* Status */}
                  <td className="py-4 px-4 text-center">
                    <button
                      onClick={() => handleToggleStatus(ajk.id, ajk.status)}
                      title="Klik untuk mengubah status aktif"
                      className="focus:outline-none hover:scale-105 transition-all inline-block cursor-pointer"
                    >
                      {ajk.status === 'Aktif' ? (
                        <span className="flex items-center justify-center gap-1 bg-green-50 border border-green-200 text-[#38C172] font-black text-[9px] px-2.5 py-1 rounded-full uppercase">
                          <CheckCircle2 size={11} />
                          <span>Aktif</span>
                        </span>
                      ) : (
                        <span className="flex items-center justify-center gap-1 bg-gray-150 border border-gray-250 text-gray-400 font-bold text-[9px] px-2.5 py-1 rounded-full uppercase">
                          <span>Nonaktif</span>
                        </span>
                      )}
                    </button>
                  </td>

                  {/* Actions */}
                  <td className="py-4 px-4 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <button
                        onClick={() => handleToggleStatus(ajk.id, ajk.status)}
                        className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors border border-transparent cursor-pointer"
                        title="Ubah Status Aktif/Nonaktif"
                      >
                        {ajk.status === 'Aktif' ? <ToggleRight size={20} className="text-[#2F2FE4]" /> : <ToggleLeft size={20} />}
                      </button>
                      <button
                        onClick={() => {
                          if (confirm(`Apakah Anda yakin ingin menghapus jadwal AJK ${ajk.routeName}?`)) {
                            onDeleteAjk(ajk.id);
                          }
                        }}
                        className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors border border-transparent cursor-pointer"
                        title="Hapus Jadwal"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}

              {filteredAjk.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-gray-400 font-bold text-xs">
                    <Info size={18} className="inline mr-2 -mt-0.5 text-gray-300" />
                    Tidak ada jadwal AJK yang cocok atau terdaftar.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

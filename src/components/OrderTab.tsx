/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Driver, Armada, Order, MaintenanceRecord } from '../types';
import { Trash2, Calendar, Clock, MapPin, ChevronDown, CheckCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface OrderTabProps {
  ordersList: Order[];
  driversList: Driver[];
  armadaList: Armada[];
  maintenanceList?: MaintenanceRecord[];
  onAddOrder: (orderData: Omit<Order, 'id' | 'status'>) => void;
  onCancelOrder: (id: string) => void;
}

export default function OrderTab({
  ordersList,
  driversList,
  armadaList,
  maintenanceList = [],
  onAddOrder,
  onCancelOrder,
}: OrderTabProps) {
  const [selectedDriverId, setSelectedDriverId] = useState('');
  const [selectedArmadaId, setSelectedArmadaId] = useState('');
  const [departureDate, setDepartureDate] = useState('');
  const [departureTime, setDepartureTime] = useState('');
  const [returnDate, setReturnDate] = useState('');
  const [returnTime, setReturnTime] = useState('');
  const [routes, setRoutes] = useState<string[]>(['', '']);
  const [revenue, setRevenue] = useState('4500000');
  const [operationalCost, setOperationalCost] = useState('1200000');
  const [errorMsg, setErrorMsg] = useState('');

  // Helper function to check if two date ranges overlap
  const isOverlapping = (startA: string, endA: string, startB: string, endB: string) => {
    // Standard string date comparison works safely for YYYY-MM-DD
    return startA <= endB && endA >= startB;
  };

  // Check schedule conflicts in real-time on data level
  const selectedDriver = driversList.find((d) => d.id === selectedDriverId);
  const selectedArmada = armadaList.find((a) => a.id === selectedArmadaId);

  const driverConflict = selectedDriver && departureDate && returnDate
    ? ordersList.find(
        (o) => o.driverId === selectedDriver.id && 
               o.status === 'Dalam Perjalanan' && 
               isOverlapping(departureDate, returnDate, o.departureDate, o.returnDate)
      )
    : null;

  const armadaConflict = selectedArmada && departureDate && returnDate
    ? ordersList.find(
        (o) => o.armadaId === selectedArmada.id && 
               o.status === 'Dalam Perjalanan' && 
               isOverlapping(departureDate, returnDate, o.departureDate, o.returnDate)
      )
    : null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!selectedDriverId) {
      setErrorMsg('Silakan pilih driver terlebih dahulu.');
      return;
    }
    if (!selectedArmadaId) {
      setErrorMsg('Silakan pilih armada terlebih dahulu.');
      return;
    }
    if (!departureDate) {
      setErrorMsg('Silakan tentukan tanggal berangkat.');
      return;
    }
    if (!departureTime) {
      setErrorMsg('Silakan tentukan jam berangkat.');
      return;
    }
    if (!returnDate) {
      setErrorMsg('Silakan tentukan tanggal selesai/kembali.');
      return;
    }
    if (!returnTime) {
      setErrorMsg('Silakan tentukan jam selesai/kembali.');
      return;
    }
    if (departureDate && returnDate && returnDate < departureDate) {
      setErrorMsg('Tanggal selesai/kembali tidak boleh sebelum tanggal keberangkatan.');
      return;
    }

    // Validate schedule conflicts on form submit as a final safeguard
    if (driverConflict) {
      setErrorMsg(`Conflict: Driver ${selectedDriver?.name} sudah memiliki jadwal rute pada rentang tanggal tersebut.`);
      return;
    }
    if (armadaConflict) {
      setErrorMsg(`Conflict: Armada ${selectedArmada?.plateNumber} sudah memiliki jadwal rute pada rentang tanggal tersebut.`);
      return;
    }

    const filteredRoutes = routes.map((r) => r.trim()).filter((r) => r !== '');
    if (filteredRoutes.length < 2) {
      setErrorMsg('Rute perjalanan harus memiliki minimal lokasi awal dan lokasi akhir.');
      return;
    }
    if (routes.some((r) => !r.trim())) {
      setErrorMsg('Semua kolom rute (titik singgah/tujuan) wajib diisi.');
      return;
    }

    const origin = routes[0].trim();
    const destination = routes[routes.length - 1].trim();

    const revNum = parseFloat(revenue) || 0;
    const opCostNum = parseFloat(operationalCost) || 0;

    if (revNum < 0 || opCostNum < 0) {
      setErrorMsg('Nilai pendapatan dan biaya operasional tidak boleh negatif.');
      return;
    }

    const driver = driversList.find((d) => d.id === selectedDriverId);
    const armada = armadaList.find((a) => a.id === selectedArmadaId);

    if (driver && armada) {
      onAddOrder({
        driverId: selectedDriverId,
        driverName: driver.name,
        armadaId: selectedArmadaId,
        plateNumber: armada.plateNumber,
        carType: armada.carType,
        departureDate,
        departureTime,
        returnDate,
        returnTime,
        origin,
        destination,
        routes: filteredRoutes,
        revenue: revNum,
        operationalCost: opCostNum,
      });

      // Reset form fields
      setSelectedDriverId('');
      setSelectedArmadaId('');
      setDepartureDate('');
      setDepartureTime('');
      setReturnDate('');
      setReturnTime('');
      setRoutes(['', '']);
      setRevenue('4500000');
      setOperationalCost('1200000');
    }
  };

  const formatTime = (timeStr: string) => {
    if (!timeStr) return '';
    const [hoursStr, minutesStr] = timeStr.split(':');
    const hours = parseInt(hoursStr, 10);
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const formattedHours = hours % 12 || 12;
    const padHours = formattedHours < 10 ? `0${formattedHours}` : formattedHours;
    return `${padHours}.${minutesStr} ${ampm}`;
  };

  const activeOrders = ordersList.filter((o) => o.status === 'Dalam Perjalanan');
  const displayRowsCount = Math.max(3, activeOrders.length);
  const rowsToRender = Array.from({ length: displayRowsCount }).map((_, index) => {
    return activeOrders[index] || null;
  });

  return (
    <div id="order-tab-container" className="flex flex-col h-full space-y-6 overflow-y-auto">
      {/* Upper Layout: Booking Form (Full-width centered) */}
      <div className="w-full shrink-0">
        
        {/* Booking Form */}
        <div className="w-full max-w-4xl mx-auto bg-gray-50/50 p-5 rounded-xl border border-gray-200 shadow-sm space-y-4">
          <div>
            <h3 className="text-sm font-black text-gray-800 flex items-center gap-2">
              <Calendar size={18} className="text-[#2F2FE4]" />
              <span>Formulir Jadwal Pemesanan Rute</span>
            </h3>
            <p className="text-[10px] text-gray-400 font-bold mt-0.5">
              Buat rute perjalanan baru dengan tanggal, driver, armada, dan validasi tabrakan jadwal otomatis (dilakukan di database/sistem).
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            
            {/* Row 1: Tanggal Berangkat */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex flex-col space-y-1">
                <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider pl-1">
                  Tanggal Keberangkatan
                </label>
                <div className="relative">
                  <input
                    type="date"
                    required
                    value={departureDate}
                    onChange={(e) => setDepartureDate(e.target.value)}
                    className="w-full px-4 py-2.5 bg-white border border-[#CCCCCC] rounded-lg text-gray-800 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#2F2FE4]/20 cursor-pointer"
                  />
                  <div className="absolute inset-y-0 right-0 flex items-center pr-4 pointer-events-none text-gray-400">
                    <Calendar size={14} />
                  </div>
                </div>
              </div>

              <div className="flex flex-col space-y-1">
                <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider pl-1">
                  Jam Keberangkatan
                </label>
                <div className="relative">
                  <input
                    type="time"
                    required
                    value={departureTime}
                    onChange={(e) => setDepartureTime(e.target.value)}
                    className="w-full px-4 py-2.5 bg-white border border-[#CCCCCC] rounded-lg text-gray-800 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#2F2FE4]/20 cursor-pointer"
                  />
                  <div className="absolute inset-y-0 right-0 flex items-center pr-4 pointer-events-none text-gray-400">
                    <Clock size={14} />
                  </div>
                </div>
              </div>
            </div>

            {/* Row 1.5: Tanggal Selesai / Kembali */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex flex-col space-y-1">
                <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider pl-1">
                  Tanggal Selesai / Kembali (Estimasi)
                </label>
                <div className="relative">
                  <input
                    type="date"
                    required
                    value={returnDate}
                    onChange={(e) => setReturnDate(e.target.value)}
                    className="w-full px-4 py-2.5 bg-white border border-[#CCCCCC] rounded-lg text-gray-800 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#2F2FE4]/20 cursor-pointer"
                  />
                  <div className="absolute inset-y-0 right-0 flex items-center pr-4 pointer-events-none text-gray-400">
                    <Calendar size={14} />
                  </div>
                </div>
              </div>

              <div className="flex flex-col space-y-1">
                <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider pl-1">
                  Jam Selesai / Kembali (Estimasi)
                </label>
                <div className="relative">
                  <input
                    type="time"
                    required
                    value={returnTime}
                    onChange={(e) => setReturnTime(e.target.value)}
                    className="w-full px-4 py-2.5 bg-white border border-[#CCCCCC] rounded-lg text-gray-800 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#2F2FE4]/20 cursor-pointer"
                  />
                  <div className="absolute inset-y-0 right-0 flex items-center pr-4 pointer-events-none text-gray-400">
                    <Clock size={14} />
                  </div>
                </div>
              </div>
            </div>

            {/* Row 2: Dropdowns */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex flex-col space-y-1">
                <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider pl-1">
                  Pilih Driver
                </label>
                <div className="relative">
                  <select
                    value={selectedDriverId}
                    required
                    onChange={(e) => setSelectedDriverId(e.target.value)}
                    className={`w-full px-4 py-2.5 bg-white border rounded-lg text-gray-800 text-xs font-semibold appearance-none focus:outline-none focus:ring-2 focus:ring-[#2F2FE4]/20 cursor-pointer ${
                      driverConflict ? 'border-red-400 bg-red-50/20' : 'border-[#CCCCCC]'
                    }`}
                  >
                    <option value="">-- Pilih Driver --</option>
                    {driversList.map((driver) => {
                      const busy = departureDate && returnDate && ordersList.some(
                        (o) => o.driverId === driver.id && 
                               o.status === 'Dalam Perjalanan' && 
                               isOverlapping(departureDate, returnDate, o.departureDate, o.returnDate)
                      );
                      return (
                        <option key={driver.id} value={driver.id} disabled={!!busy}>
                          {driver.name} {busy ? '(X - Sibuk di tgl ini)' : driver.status !== 'Ready' ? '(Sedang Jalan)' : '(Tersedia)'}
                        </option>
                      );
                    })}
                  </select>
                  <div className="absolute inset-y-0 right-0 flex items-center pr-4 pointer-events-none text-gray-400">
                    <ChevronDown size={16} />
                  </div>
                </div>
                {driverConflict && (
                  <p className="text-[10px] text-red-500 font-bold mt-1">
                    ⚠️ {selectedDriver?.name} sudah memiliki rute terjadwal antara {departureDate} s/d {returnDate}!
                  </p>
                )}
              </div>

              <div className="flex flex-col space-y-1">
                <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider pl-1">
                  Pilih Armada
                </label>
                <div className="relative">
                  <select
                    value={selectedArmadaId}
                    required
                    onChange={(e) => setSelectedArmadaId(e.target.value)}
                    className={`w-full px-4 py-2.5 bg-white border rounded-lg text-gray-800 text-xs font-semibold appearance-none focus:outline-none focus:ring-2 focus:ring-[#2F2FE4]/20 cursor-pointer ${
                      armadaConflict ? 'border-red-400 bg-red-50/20' : 'border-[#CCCCCC]'
                    }`}
                  >
                    <option value="">-- Pilih Armada --</option>
                    {armadaList.map((vehicle) => {
                      const isRepair = vehicle.status === 'Di Perbaiki';
                      const busy = departureDate && returnDate && ordersList.some(
                        (o) => o.armadaId === vehicle.id && 
                               o.status === 'Dalam Perjalanan' && 
                               isOverlapping(departureDate, returnDate, o.departureDate, o.returnDate)
                      );
                      return (
                        <option key={vehicle.id} value={vehicle.id} disabled={isRepair || !!busy}>
                          {vehicle.plateNumber} — {vehicle.carType} {isRepair ? '(🛠️ Perbaikan)' : busy ? '(X - Sibuk di tgl ini)' : ''}
                        </option>
                      );
                    })}
                  </select>
                  <div className="absolute inset-y-0 right-0 flex items-center pr-4 pointer-events-none text-gray-400">
                    <ChevronDown size={16} />
                  </div>
                </div>
                {armadaConflict && (
                  <p className="text-[10px] text-red-500 font-bold mt-1">
                    ⚠️ Armada {selectedArmada?.plateNumber} sudah memiliki rute terjadwal antara {departureDate} s/d {returnDate}!
                  </p>
                )}
              </div>
            </div>

            {/* Row 3: Rute Perjalanan */}
            <div className="bg-white p-4 rounded-lg border border-gray-200 space-y-3">
              <div className="flex items-center justify-between mb-1">
                <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider flex items-center gap-1.5">
                  <MapPin size={14} className="text-[#2F2FE4]" />
                  <span>Rute Perjalanan ({routes.length} Titik)</span>
                </label>
                <button
                  type="button"
                  onClick={() => setRoutes([...routes, ''])}
                  className="text-[10px] font-extrabold text-[#2F2FE4] hover:text-[#2020D0] bg-gray-50 border border-gray-200 rounded-lg px-2.5 py-1 shadow-sm transition-all cursor-pointer"
                >
                  + Tambah Titik Singgah
                </button>
              </div>

              <div className="space-y-2">
                {routes.map((route, rIndex) => (
                  <div key={rIndex} className="flex items-center gap-2">
                    <span className="text-[9px] font-black text-gray-400 w-16 bg-gray-50 border border-gray-200 rounded px-1.5 py-1.5 text-center select-none uppercase shrink-0">
                      {rIndex === 0 ? 'Mulai' : rIndex === routes.length - 1 ? 'Tujuan' : `Singgah ${rIndex}`}
                    </span>
                    <input
                      type="text"
                      placeholder={rIndex === 0 ? 'Lokasi Keberangkatan' : rIndex === routes.length - 1 ? 'Lokasi Akhir / Tujuan' : `Lokasi Singgah`}
                      value={route}
                      required
                      onChange={(e) => {
                        const updated = [...routes];
                        updated[rIndex] = e.target.value;
                        setRoutes(updated);
                      }}
                      className="flex-1 px-3 py-1.5 bg-white border border-[#CCCCCC] rounded-lg text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#2F2FE4]/10 text-xs font-semibold"
                    />
                    {routes.length > 2 && (
                      <button
                        type="button"
                        onClick={() => {
                          const updated = routes.filter((_, idx) => idx !== rIndex);
                          setRoutes(updated);
                        }}
                        className="p-1.5 bg-red-50 text-[#E3342F] hover:bg-red-100 rounded-lg border border-transparent transition-all shrink-0 cursor-pointer"
                        title="Hapus Titik Ini"
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Row 4: Keuangan */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex flex-col space-y-1">
                <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider pl-1">
                  Pendapatan Estimasi (Rp)
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-4 font-bold text-xs text-gray-400">
                    Rp
                  </span>
                  <input
                    type="number"
                    placeholder="Contoh: 4500000"
                    value={revenue}
                    onChange={(e) => setRevenue(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 bg-white border border-[#CCCCCC] rounded-lg text-gray-800 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#2F2FE4]/20"
                  />
                </div>
              </div>

              <div className="flex flex-col space-y-1">
                <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider pl-1">
                  Biaya Operasional (Rp)
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-4 font-bold text-xs text-gray-400">
                    Rp
                  </span>
                  <input
                    type="number"
                    placeholder="Contoh: 1200000"
                    value={operationalCost}
                    onChange={(e) => setOperationalCost(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 bg-white border border-[#CCCCCC] rounded-lg text-gray-800 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#2F2FE4]/20"
                  />
                </div>
              </div>
            </div>

            {/* Error message */}
            {errorMsg && (
              <div className="text-xs font-bold text-red-600 bg-red-50 border border-red-200 rounded-lg p-2.5">
                {errorMsg}
              </div>
            )}

            {/* Submit Button */}
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={!!driverConflict || !!armadaConflict}
                className={`px-10 py-2.5 text-white font-bold text-xs rounded-lg transition-all transform active:scale-95 shadow-sm cursor-pointer ${
                  driverConflict || armadaConflict
                    ? 'bg-gray-300 cursor-not-allowed text-gray-500'
                    : 'bg-[#2F2FE4] hover:bg-[#2020D0] hover:scale-[1.01]'
                }`}
              >
                Tambahkan Rute &amp; Jadwal
              </button>
            </div>
          </form>
        </div>

      </div>

      {/* Bottom Layout: Active Orders List */}
      <div id="order-list-card" className="flex-1 bg-gray-50/30 border border-gray-200 rounded-xl p-5 overflow-y-auto shadow-sm min-h-[300px]">
        <div className="flex items-center justify-between mb-4 pb-2 border-b border-gray-100">
          <div>
            <h4 className="text-xs font-extrabold text-gray-500 uppercase tracking-widest">
              Daftar Jadwal Perjalanan Terpantau ({activeOrders.length} Trip)
            </h4>
            <p className="text-[9px] text-gray-400 font-bold">
              Daftar trip perjalanan aktif yang sedang berjalan atau dijadwalkan secara sistem.
            </p>
          </div>
        </div>

        <div className="space-y-4">
          {rowsToRender.map((order, index) => {
            if (order) {
              return (
                <motion.div
                  key={order.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white border border-[#E2E8F0] rounded-lg p-4 flex items-center justify-between shadow-sm hover:shadow-md transition-shadow min-h-[76px]"
                >
                  <div className="flex-1 flex items-center">
                    <div className="w-1/2">
                      <div className="font-bold text-gray-800 text-base">{order.driverName}</div>
                      <div className="text-sm text-gray-500 font-medium flex items-center gap-2">
                        <span>{order.plateNumber} — {order.carType}</span>
                      </div>
                    </div>
                    <div className="w-1/2 flex flex-col items-start md:items-center space-y-1.5">
                      <div className="font-bold text-gray-700 text-xs flex flex-col space-y-1">
                        <div className="flex items-center gap-1.5">
                          <span className="text-[9px] bg-emerald-50 text-emerald-700 border border-emerald-200 px-1.5 py-0.5 rounded font-black uppercase tracking-wider">Pergi</span>
                          <span>{order.departureDate} &bull; {formatTime(order.departureTime) || order.departureTime}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-[9px] bg-indigo-50 text-[#2F2FE4] border border-indigo-200 px-1.5 py-0.5 rounded font-black uppercase tracking-wider">Pulang</span>
                          <span>{order.returnDate} &bull; {formatTime(order.returnTime) || order.returnTime}</span>
                        </div>
                      </div>
                      <div className="text-xs text-gray-500 font-medium flex flex-wrap items-center gap-1 mt-1 justify-start md:justify-center">
                        <span className="font-bold text-gray-700">{order.origin}</span>
                        {order.routes && order.routes.length > 2 && order.routes.slice(1, -1).map((stop, sIdx) => (
                          <React.Fragment key={sIdx}>
                            <span className="text-gray-300 font-black">&rarr;</span>
                            <span className="bg-indigo-50 text-indigo-600 px-1.5 py-0.5 rounded text-[10px] font-extrabold">{stop}</span>
                          </React.Fragment>
                        ))}
                        <span className="text-gray-300 font-black">&rarr;</span>
                        <span className="font-bold text-[#2F2FE4]">{order.destination}</span>
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => onCancelOrder(order.id)}
                    className="p-2 text-[#E3342F] hover:bg-red-50 rounded-lg border border-transparent hover:border-[#E3342F]/30 transition-all ml-4 cursor-pointer"
                    title="Batalkan Perjalanan"
                  >
                    <Trash2 size={20} />
                  </button>
                </motion.div>
              );
            } else {
              // Placeholder row matching the visual design exactly
              return (
                <div
                  key={`placeholder-${index}`}
                  className="bg-white/50 border border-dashed border-gray-300 rounded-lg p-4 flex items-center justify-between min-h-[76px]"
                >
                  <div className="flex-1 flex items-center">
                    <div className="w-1/2">
                      <div className="h-4 w-28 bg-gray-200/60 rounded animate-pulse mb-2"></div>
                      <div className="h-3 w-40 bg-gray-200/40 rounded animate-pulse"></div>
                    </div>
                    <div className="w-1/2 flex flex-col items-start md:items-center">
                      <div className="h-4 w-16 bg-gray-200/60 rounded animate-pulse mb-2"></div>
                      <div className="h-3 w-24 bg-gray-200/40 rounded animate-pulse"></div>
                    </div>
                  </div>
                  <button className="p-2 text-gray-300 cursor-not-allowed">
                    <Trash2 size={20} />
                  </button>
                </div>
              );
            }
          })}
        </div>
      </div>
    </div>
  );
}

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Armada, MaintenanceRecord } from '../types';
import { Wrench, Trash2, Calendar, DollarSign, Plus, Search, Info, Trash, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface PerbaikanTabProps {
  maintenanceList: MaintenanceRecord[];
  armadaList: Armada[];
  onAddMaintenance: (record: Omit<MaintenanceRecord, 'id'>) => void;
  onDeleteMaintenance: (id: string) => void;
}

export default function PerbaikanTab({
  maintenanceList,
  armadaList,
  onAddMaintenance,
  onDeleteMaintenance,
}: PerbaikanTabProps) {
  const [selectedArmadaId, setSelectedArmadaId] = useState('');
  
  // Multi input damages state
  const [damagesInput, setDamagesInput] = useState<{ description: string; cost: string }[]>([
    { description: '', cost: '' }
  ]);
  
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [searchQuery, setSearchQuery] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const handleAddDamageField = () => {
    setDamagesInput([...damagesInput, { description: '', cost: '' }]);
  };

  const handleRemoveDamageField = (index: number) => {
    if (damagesInput.length <= 1) return;
    setDamagesInput(damagesInput.filter((_, i) => i !== index));
  };

  const handleDamageChange = (index: number, field: 'description' | 'cost', value: string) => {
    const updated = [...damagesInput];
    updated[index][field] = value;
    setDamagesInput(updated);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!selectedArmadaId) {
      setErrorMsg('Silakan pilih armada/mobil terlebih dahulu.');
      return;
    }

    const filledDamages = damagesInput.filter((d) => d.description.trim() !== '');
    if (filledDamages.length === 0) {
      setErrorMsg('Silakan isi rincian keluhan/kerusakan mobil minimal 1 baris.');
      return;
    }

    const parsedDamages = [];
    for (const item of filledDamages) {
      const cNum = parseFloat(item.cost);
      if (isNaN(cNum) || cNum < 0) {
        setErrorMsg(`Silakan masukkan biaya yang valid untuk kerusakan "${item.description}".`);
        return;
      }
      parsedDamages.push({
        id: `dmg-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        description: item.description.trim(),
        status: 'Menunggu' as const,
        cost: cNum,
      });
    }

    if (!date) {
      setErrorMsg('Silakan tentukan tanggal perbaikan.');
      return;
    }

    const armada = armadaList.find((a) => a.id === selectedArmadaId);
    if (armada) {
      const totalCost = parsedDamages.reduce((sum, d) => sum + d.cost, 0);
      const combinedDescription = parsedDamages.map((d) => d.description).join(', ');

      onAddMaintenance({
        armadaId: selectedArmadaId,
        plateNumber: armada.plateNumber,
        carType: armada.carType,
        damages: parsedDamages,
        totalCost,
        date,
        status: 'Dalam Perbaikan',
        // Backwards compatibility keys
        description: combinedDescription,
        cost: totalCost,
      } as any);

      // Reset form
      setSelectedArmadaId('');
      setDamagesInput([{ description: '', cost: '' }]);
      setDate(new Date().toISOString().split('T')[0]);
    }
  };

  // Filter maintenance records based on search query
  const filteredList = maintenanceList.filter((item) => {
    const combinedDesc = item.description || (item.damages ? item.damages.map(d => d.description).join(' ') : '');
    return (
      item.plateNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.carType.toLowerCase().includes(searchQuery.toLowerCase()) ||
      combinedDesc.toLowerCase().includes(searchQuery.toLowerCase())
    );
  });

  const totalMaintenanceCost = maintenanceList.reduce((acc, curr) => acc + (curr.totalCost || curr.cost || 0), 0);

  // Helper to format currency to Rupiah (Rp.)
  const formatRupiah = (value: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const formatDateReadable = (dateStr: string) => {
    if (!dateStr) return '';
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      const months = [
        'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
        'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
      ];
      return `${parseInt(parts[2], 10)} ${months[parseInt(parts[1], 10) - 1]} ${parts[0]}`;
    }
    return dateStr;
  };

  return (
    <div id="perbaikan-tab-container" className="flex flex-col h-full space-y-6">
      {/* Top Stats and Header Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-1 bg-[#2F2FE4] text-white rounded-2xl p-6 shadow-md flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-white/70 uppercase tracking-widest">
              Total Pengeluaran Perbaikan
            </p>
            <p className="text-2xl lg:text-3xl font-black mt-2">
              {formatRupiah(totalMaintenanceCost)}
            </p>
          </div>
          <div className="bg-white/20 p-3 rounded-full">
            <Wrench size={32} className="text-white" />
          </div>
        </div>

        <div className="md:col-span-2 bg-white border border-gray-200 rounded-2xl p-6 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-blue-50 text-[#2F2FE4] rounded-full shrink-0">
            <Info size={24} />
          </div>
          <div>
            <h3 className="font-extrabold text-gray-800 text-base">Manajemen Pemeliharaan Armada</h3>
            <p className="text-sm text-gray-500 font-medium mt-1 leading-relaxed">
              Catat setiap pengeluaran perbaikan, keluhan, maupun ganti suku cadang kendaraan di sini.
              Ketika mobil dimasukkan ke dalam perbaikan, status armada otomatis berubah menjadi <strong>"Di Perbaiki"</strong>.
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start flex-1 min-h-0 overflow-y-auto">
        {/* Left Form: Add Maintenance with Multi-input damages */}
        <div className="lg:col-span-1 bg-[#EAECEF] border border-[#D5D8DC] rounded-2xl p-6 shadow-sm flex flex-col space-y-4">
          <div>
            <h2 className="text-base font-black text-gray-600 uppercase tracking-wider">
              Input Perbaikan Baru
            </h2>
            <p className="text-[11px] text-gray-400 font-semibold mt-0.5">
              Mendukung multi input laporan keluhan kerusakan sekaligus.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* SELECT VEHICLE */}
            <div className="flex flex-col space-y-1">
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wider pl-1">
                Pilih Kendaraan / Armada
              </label>
              <select
                value={selectedArmadaId}
                required
                onChange={(e) => setSelectedArmadaId(e.target.value)}
                className="w-full px-4 py-3 bg-white border border-[#CCCCCC] rounded-lg text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#2F2FE4]/30 font-semibold cursor-pointer text-sm"
              >
                <option value="">Pilih Mobil</option>
                {armadaList.map((veh) => (
                  <option key={veh.id} value={veh.id}>
                    {veh.plateNumber} — {veh.carType} ({veh.status})
                  </option>
                ))}
              </select>
            </div>

            {/* MULTI INPUT DAMAGES */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider pl-1">
                  Rincian Kerusakan &amp; Biaya
                </label>
                <button
                  type="button"
                  onClick={handleAddDamageField}
                  className="text-[10px] font-extrabold text-[#2F2FE4] hover:text-[#2020D0] bg-white border border-gray-200 px-2.5 py-1 rounded-md shadow-xs hover:shadow-sm transition-all"
                >
                  + Tambah Baris
                </button>
              </div>

              <div className="space-y-2.5 max-h-[250px] overflow-y-auto pr-1">
                {damagesInput.map((dmg, idx) => (
                  <div key={idx} className="flex gap-2 items-center bg-white p-2 rounded-lg border border-[#DDDDDD] relative group">
                    <div className="flex-1 space-y-1.5">
                      <input
                        type="text"
                        placeholder="Deskripsi kerusakan (contoh: Ganti Ban)"
                        value={dmg.description}
                        required={idx === 0}
                        onChange={(e) => handleDamageChange(idx, 'description', e.target.value)}
                        className="w-full px-2 py-1.5 bg-gray-50 border border-gray-150 rounded text-xs text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#2F2FE4]/20 font-semibold placeholder-gray-400"
                      />
                      <div className="relative">
                        <span className="absolute inset-y-0 left-2 flex items-center text-[10px] font-bold text-gray-400">Rp</span>
                        <input
                          type="number"
                          placeholder="Biaya (contoh: 400000)"
                          value={dmg.cost}
                          required={idx === 0 || dmg.description.trim() !== ''}
                          onChange={(e) => handleDamageChange(idx, 'cost', e.target.value)}
                          className="w-full pl-7 pr-2 py-1.5 bg-gray-50 border border-gray-150 rounded text-xs text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#2F2FE4]/20 font-bold placeholder-gray-400"
                        />
                      </div>
                    </div>
                    {damagesInput.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveDamageField(idx)}
                        className="p-1.5 bg-red-50 text-red-500 hover:bg-red-100 rounded transition-colors self-stretch flex items-center justify-center border border-red-100"
                        title="Hapus baris ini"
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* DATE */}
            <div className="flex flex-col space-y-1">
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wider pl-1">
                Tanggal Perbaikan
              </label>
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-4 py-3 bg-white border border-[#CCCCCC] rounded-lg text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#2F2FE4]/30 font-semibold cursor-pointer text-sm"
              />
            </div>

            {errorMsg && (
              <div className="text-xs font-semibold text-red-600 bg-red-50 border border-red-200 rounded-md p-2 text-center flex items-center gap-1 justify-center">
                <AlertCircle size={12} />
                <span>{errorMsg}</span>
              </div>
            )}

            <button
              type="submit"
              className="w-full flex items-center justify-center gap-2 bg-[#2F2FE4] hover:bg-[#2020D0] text-white py-3 px-4 rounded-lg font-bold text-base shadow-sm transition-all transform active:scale-95 cursor-pointer"
            >
              <Plus size={18} />
              <span>Simpan Laporan Masuk</span>
            </button>
          </form>
        </div>

        {/* Right Panel: List of Maintenance Records */}
        <div className="lg:col-span-2 bg-[#EAECEF] border border-[#D5D8DC] rounded-2xl p-6 shadow-sm flex flex-col space-y-4 h-full min-h-[400px]">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <h2 className="text-base font-black text-gray-600 uppercase tracking-wider">
              Log Riwayat Perbaikan
            </h2>

            {/* Search Input */}
            <div className="relative w-full sm:w-64">
              <input
                type="text"
                placeholder="Cari armada, plat, atau rincian..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-white border border-[#CCCCCC] rounded-lg text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#2F2FE4]/30 font-semibold"
              />
              <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-gray-400">
                <Search size={16} />
              </div>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto space-y-3 pr-1">
            {filteredList.length === 0 ? (
              <div className="bg-white/50 border border-dashed border-gray-300 rounded-xl p-12 text-center text-gray-400 font-bold flex flex-col items-center justify-center space-y-3">
                <Wrench size={40} className="stroke-[1.5] text-gray-300" />
                <p>Belum ada riwayat perbaikan yang tercatat atau cocok.</p>
              </div>
            ) : (
              <AnimatePresence>
                {filteredList.map((item) => (
                  <motion.div
                    key={item.id}
                    layout
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="bg-white rounded-xl p-4 md:p-5 border border-gray-200/80 shadow-sm flex items-start justify-between gap-4 hover:shadow-md transition-shadow"
                  >
                    <div className="space-y-2 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="bg-[#2F2FE4]/10 text-[#2F2FE4] text-xs font-extrabold px-2.5 py-1 rounded-full uppercase tracking-wider font-mono">
                          {item.plateNumber}
                        </span>
                        <span className="text-xs font-bold text-gray-400 uppercase">
                          {item.carType}
                        </span>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase shrink-0 ${
                          item.status === 'Selesai' ? 'bg-green-50 text-green-600 border border-green-200' : 'bg-amber-50 text-amber-600 border border-amber-200'
                        }`}>
                          {item.status || 'Dalam Perbaikan'}
                        </span>
                      </div>

                      {/* Display individual damages list elegantly */}
                      {item.damages && item.damages.length > 0 ? (
                        <div className="bg-gray-50 p-3 rounded-lg border border-gray-150 space-y-2">
                          <p className="text-[10px] font-black text-gray-400 uppercase tracking-wider">
                            Rincian Kerusakan:
                          </p>
                          <div className="space-y-1.5 divide-y divide-gray-100">
                            {item.damages.map((dmg) => (
                              <div key={dmg.id} className="flex items-center justify-between text-xs font-semibold pt-1 first:pt-0 text-gray-600">
                                <span className="flex items-center gap-1.5">
                                  <span className={`w-1.5 h-1.5 rounded-full ${dmg.status === 'Selesai' ? 'bg-[#38C172]' : 'bg-amber-500'}`} />
                                  <span>{dmg.description}</span>
                                </span>
                                <span className="font-bold text-gray-700 font-mono">{formatRupiah(dmg.cost)}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      ) : (
                        <p className="text-base font-extrabold text-gray-700">
                          {item.description}
                        </p>
                      )}

                      <div className="flex flex-wrap gap-4 text-xs font-semibold text-gray-400 border-t border-gray-100 pt-2">
                        <span className="flex items-center gap-1.5 text-[#38C172] font-black font-mono">
                          {formatRupiah(item.totalCost || item.cost || 0)}
                        </span>
                        <span className="flex items-center gap-1.5 text-gray-400">
                          <Calendar size={14} />
                          <span>{formatDateReadable(item.date)}</span>
                        </span>
                      </div>
                    </div>

                    <button
                      onClick={() => onDeleteMaintenance(item.id)}
                      className="p-2 text-[#E3342F] hover:bg-red-50 rounded-lg border border-transparent hover:border-red-200 transition-colors shrink-0 self-center"
                      title="Hapus Catatan"
                    >
                      <Trash2 size={18} />
                    </button>
                  </motion.div>
                ))}
              </AnimatePresence>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

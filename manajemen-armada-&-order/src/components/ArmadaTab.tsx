/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Armada, MaintenanceRecord } from '../types';
import { 
  Search, 
  Plus, 
  Trash2, 
  Edit3, 
  Check, 
  X, 
  Info, 
  Wrench, 
  CheckCircle2, 
  AlertCircle, 
  Calendar, 
  DollarSign,
  Wifi, 
  Wind, 
  Usb, 
  Tv, 
  Users, 
  ArrowLeft, 
  FileText,
  Sparkles,
  ChevronRight,
  ShieldAlert
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface ArmadaTabProps {
  armadaList: Armada[];
  maintenanceList: MaintenanceRecord[];
  onAddArmada: (plateNumber: string, carType: string, extra?: Partial<Armada>) => void;
  onUpdateArmada: (id: string, updated: Partial<Armada>) => void;
  onDeleteArmada: (id: string) => void;
  onResolveMaintenance: (recordId: string, damageId?: string, isAll?: boolean) => void;
  onManualCompleteMaintenance: (armadaId: string) => void;
}

export default function ArmadaTab({
  armadaList,
  maintenanceList,
  onAddArmada,
  onUpdateArmada,
  onDeleteArmada,
  onResolveMaintenance,
  onManualCompleteMaintenance,
}: ArmadaTabProps) {
  // Navigation State
  const [viewMode, setViewMode] = useState<'list' | 'create' | 'edit'>('list');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  
  // State for detail modal
  const [selectedDetailArmada, setSelectedDetailArmada] = useState<Armada | null>(null);

  // Form states for Create & Edit page
  const [formPlate, setFormPlate] = useState('');
  const [formType, setFormType] = useState('');
  const [formStatus, setFormStatus] = useState<'Ready' | 'Di Perbaiki' | 'Dalam Perjalanan'>('Ready');
  const [formCapacity, setFormCapacity] = useState<number>(14);
  const [formHasWifi, setFormHasWifi] = useState(false);
  const [formHasAc, setFormHasAc] = useState(true);
  const [formHasUsb, setFormHasUsb] = useState(false);
  const [formHasEntertainment, setFormHasEntertainment] = useState(false);
  const [formFacilityNotes, setFormFacilityNotes] = useState('');

  // Open creation page
  const handleOpenCreate = () => {
    setFormPlate('');
    setFormType('');
    setFormStatus('Ready');
    setFormCapacity(14);
    setFormHasWifi(false);
    setFormHasAc(true);
    setFormHasUsb(false);
    setFormHasEntertainment(false);
    setFormFacilityNotes('');
    setEditingId(null);
    setViewMode('create');
  };

  // Open edit page
  const handleOpenEdit = (item: Armada) => {
    setFormPlate(item.plateNumber);
    setFormType(item.carType);
    setFormStatus(item.status);
    setFormCapacity(item.capacity ?? 14);
    setFormHasWifi(item.hasWifi ?? false);
    setFormHasAc(item.hasAc ?? true);
    setFormHasUsb(item.hasUsb ?? false);
    setFormHasEntertainment(item.hasEntertainment ?? false);
    setFormFacilityNotes(item.facilityNotes ?? '');
    setEditingId(item.id);
    setViewMode('edit');
  };

  // Submit form (Save / Update)
  const handleSaveForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formPlate.trim() || !formType.trim()) {
      alert('Plat Nomor dan Tipe Mobil wajib diisi.');
      return;
    }

    const extraData = {
      capacity: Number(formCapacity),
      hasWifi: formHasWifi,
      hasAc: formHasAc,
      hasUsb: formHasUsb,
      hasEntertainment: formHasEntertainment,
      facilityNotes: formFacilityNotes,
      status: formStatus
    };

    if (viewMode === 'create') {
      onAddArmada(formPlate.toUpperCase(), formType, extraData);
    } else if (viewMode === 'edit' && editingId) {
      onUpdateArmada(editingId, {
        plateNumber: formPlate.toUpperCase(),
        carType: formType,
        ...extraData
      });
    }

    setViewMode('list');
  };

  // Quick capacity preset buttons
  const applyCapacityPreset = (val: number) => {
    setFormCapacity(val);
  };

  // Filter list
  const filteredList = armadaList.filter(
    (item) =>
      item.plateNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.carType.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.status.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Helper to format currency
  const formatRupiah = (value: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  return (
    <div id="armada-tab-container" className="flex flex-col h-full space-y-4 relative">
      <AnimatePresence mode="wait">
        {viewMode === 'list' ? (
          <motion.div
            key="list-view"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-4"
          >
            {/* Top Toolbar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-xl border border-[#E2E8F0] shadow-2xs">
              <div className="relative flex-1">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-500">
                  <Search size={18} />
                </span>
                <input
                  type="text"
                  placeholder="Cari armada berdasarkan tipe, plat nomor, atau status..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 bg-[#F1F3F5] border border-gray-200 rounded-lg text-xs font-semibold text-gray-800 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#2F2FE4]/20 focus:border-[#2F2FE4]"
                />
              </div>

              <button
                type="button"
                onClick={handleOpenCreate}
                className="w-full sm:w-auto flex items-center justify-center gap-1.5 bg-[#2F2FE4] hover:bg-[#2020D0] text-white text-xs font-extrabold px-4 py-2 rounded-xl shadow-xs cursor-pointer transition-all active:scale-95 shrink-0"
              >
                <Plus size={16} />
                <span>Tambah Armada Baru</span>
              </button>
            </div>

            {/* List Container Card */}
            <div id="armada-list-card" className="bg-[#EAECEF]/40 border border-[#D5D8DC] rounded-xl p-4 md:p-6 shadow-xs min-h-[400px]">
              <div className="space-y-3.5">
                {filteredList.map((item) => {
                  const activeRecord = maintenanceList.find(
                    (m) => m.armadaId === item.id && m.status === 'Dalam Perbaikan'
                  );
                  const hasActiveReport = !!activeRecord || item.status === 'Di Perbaiki';
                  const unresolvedCount = activeRecord?.damages 
                    ? activeRecord.damages.filter(d => d.status !== 'Selesai').length 
                    : (hasActiveReport ? 1 : 0);

                  return (
                    <div
                      key={item.id}
                      className={`bg-white border rounded-xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-2xs hover:shadow-sm transition-all ${
                        hasActiveReport 
                          ? 'border-rose-200 bg-rose-50/5 hover:bg-rose-50/10' 
                          : 'border-[#E2E8F0]'
                      }`}
                    >
                      <div className="flex-1 flex flex-col md:flex-row md:items-center gap-4">
                        {/* Left Block: Plate Number badge & car type */}
                        <div className="md:w-1/4">
                          <span className="inline-block px-3 py-1.5 bg-gray-100 border border-gray-300 text-gray-850 font-black tracking-wider text-sm rounded-lg text-center font-mono">
                            {item.plateNumber}
                          </span>
                        </div>

                        {/* Middle Block: Car Type & Capacity & Facilities Badge list */}
                        <div className="flex-1 space-y-1.5">
                          <div className="flex flex-wrap items-center gap-2">
                            <h4 className="text-sm font-black text-gray-850">{item.carType}</h4>
                            <span className="flex items-center gap-1 text-[10px] font-extrabold text-indigo-700 bg-indigo-50 border border-indigo-150 px-2 py-0.5 rounded-full">
                              <Users size={11} />
                              <span>{item.capacity ?? 14} Seat</span>
                            </span>
                            {hasActiveReport && (
                              <span className="flex items-center gap-1 text-[10px] font-black text-rose-700 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded-full shrink-0 animate-pulse">
                                <AlertCircle size={11} className="text-rose-600" />
                                <span>Ada Keluhan ({unresolvedCount})</span>
                              </span>
                            )}
                          </div>

                          {/* Facilities Summary Icons Row */}
                          <div className="flex flex-wrap items-center gap-1.5 text-[10px] font-bold text-gray-500">
                            {item.hasWifi && (
                              <span className="flex items-center gap-1 bg-blue-50 border border-blue-150 text-blue-700 px-1.5 py-0.5 rounded-md">
                                <Wifi size={10} />
                                <span>WiFi</span>
                              </span>
                            )}
                            {item.hasAc && (
                              <span className="flex items-center gap-1 bg-green-50 border border-green-150 text-green-700 px-1.5 py-0.5 rounded-md">
                                <Wind size={10} />
                                <span>AC</span>
                              </span>
                            )}
                            {item.hasUsb && (
                              <span className="flex items-center gap-1 bg-amber-50 border border-amber-150 text-amber-700 px-1.5 py-0.5 rounded-md">
                                <Usb size={10} />
                                <span>USB</span>
                              </span>
                            )}
                            {item.hasEntertainment && (
                              <span className="flex items-center gap-1 bg-purple-50 border border-purple-150 text-purple-700 px-1.5 py-0.5 rounded-md">
                                <Tv size={10} />
                                <span>TV</span>
                              </span>
                            )}
                            {!item.hasWifi && !item.hasAc && !item.hasUsb && !item.hasEntertainment && (
                              <span className="text-gray-400 italic font-semibold">Standard Unit (Tidak ada opsi tambahan)</span>
                            )}
                          </div>
                        </div>

                        {/* Right Block: Status Badge */}
                        <div className="md:w-1/4">
                          <span
                            className={`px-4 py-1.5 rounded-full text-[10px] font-extrabold text-white inline-block text-center min-w-[120px] uppercase tracking-wider ${
                              item.status === 'Ready'
                                ? 'bg-emerald-600'
                                : item.status === 'Di Perbaiki'
                                ? 'bg-rose-600'
                                : 'bg-blue-600'
                            }`}
                          >
                            {item.status}
                          </span>
                        </div>
                      </div>

                      {/* Actions Panel */}
                      <div className="flex items-center gap-2 border-t md:border-t-0 pt-3 md:pt-0 border-gray-100 shrink-0">
                        {/* LAPORAN BUTTON */}
                        <button
                          onClick={() => setSelectedDetailArmada(item)}
                          className={`px-3.5 py-1.5 rounded-xl text-[10px] font-black transition-all flex items-center gap-1.5 shadow-2xs relative ${
                            hasActiveReport 
                              ? 'bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200' 
                              : 'bg-indigo-50 hover:bg-indigo-100 text-[#2F2FE4] border border-indigo-200/50 hover:border-indigo-300'
                          }`}
                        >
                          {hasActiveReport ? (
                            <AlertCircle size={13} className="text-rose-600 animate-pulse" />
                          ) : (
                            <FileText size={13} />
                          )}
                          <span>Laporan</span>
                          
                          {hasActiveReport && (
                            <span className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-rose-600 text-white border border-white text-[9px] font-black rounded-full flex items-center justify-center shadow-xs animate-bounce">
                              {unresolvedCount}
                            </span>
                          )}
                        </button>

                        {/* EDIT BUTTON (Opens dedicated page) */}
                        <button
                          onClick={() => handleOpenEdit(item)}
                          className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-xl border border-transparent hover:border-emerald-200 transition-all cursor-pointer"
                          title="Edit Data Detail Armada"
                        >
                          <Edit3 size={16} />
                        </button>
                        
                        {/* DELETE BUTTON */}
                        <button
                          onClick={() => {
                            if (confirm(`Apakah Anda yakin ingin menghapus armada ${item.plateNumber}?`)) {
                              onDeleteArmada(item.id);
                            }
                          }}
                          disabled={item.status === 'Dalam Perjalanan'}
                          className={`p-2 rounded-xl border border-transparent transition-all ${
                            item.status === 'Dalam Perjalanan'
                              ? 'text-gray-300 cursor-not-allowed'
                              : 'text-rose-600 hover:bg-rose-50 hover:border-rose-200'
                          }`}
                          title={item.status === 'Dalam Perjalanan' ? 'Mobil sedang bertugas dalam perjalanan' : 'Hapus armada'}
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  );
                })}

                {filteredList.length === 0 && (
                  <div className="bg-white border border-[#E2E8F0] rounded-xl py-14 text-center text-gray-500 font-bold text-xs">
                    Tidak ada armada ditemukan dengan kata kunci pencarian Anda.
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        ) : (
          /* DEDICATED NEW PAGE FOR ADDING/EDITING ARMADA */
          <motion.div
            key="form-view"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden"
          >
            {/* Form Title Header */}
            <div className="bg-gray-50 border-b border-gray-150 p-5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setViewMode('list')}
                  className="p-2 hover:bg-gray-200 text-gray-600 rounded-lg transition-colors cursor-pointer"
                >
                  <ArrowLeft size={16} />
                </button>
                <div>
                  <h3 className="text-sm md:text-base font-black text-gray-800 flex items-center gap-2">
                    <Sparkles className="text-indigo-600" size={18} />
                    <span>{viewMode === 'create' ? 'Tambah Unit Armada Baru' : 'Edit Informasi Detail Armada'}</span>
                  </h3>
                  <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider mt-0.5">
                    {viewMode === 'create' ? 'Lengkapi data spesifikasi kendaraan baru' : `Mengubah spesifikasi kendaraan ${formPlate}`}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setViewMode('list')}
                className="text-xs font-black text-gray-500 hover:text-gray-800 transition-colors"
              >
                Batal
              </button>
            </div>

            {/* Form Action Area */}
            <form onSubmit={handleSaveForm} className="p-6 space-y-6">
              
              {/* Main double column container */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                
                {/* LEFT COLUMN: Core vehicle details */}
                <div className="space-y-4">
                  <h4 className="text-xs font-black text-gray-400 uppercase tracking-wider pb-2 border-b border-gray-100 flex items-center gap-1.5">
                    <FileText size={14} className="text-indigo-600" />
                    <span>Informasi Utama Kendaraan</span>
                  </h4>

                  {/* Plat Nomor */}
                  <div className="text-xs font-semibold">
                    <label className="text-gray-700 block mb-1">Plat Nomor (Nomor Polisi)</label>
                    <input
                      type="text"
                      placeholder="Contoh: B 1234 XYZ, DK 9999 CD"
                      value={formPlate}
                      onChange={(e) => setFormPlate(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs font-bold text-gray-800 uppercase focus:outline-none focus:ring-2 focus:ring-[#2F2FE4]/20 focus:border-[#2F2FE4]"
                      required
                    />
                    <p className="text-[10px] text-gray-400 font-medium mt-1">Harap sertakan kode kota dan seri belakang dengan benar.</p>
                  </div>

                  {/* Tipe / Model Unit */}
                  <div className="text-xs font-semibold">
                    <label className="text-gray-700 block mb-1">Tipe / Model Mobil (Unit)</label>
                    <input
                      type="text"
                      placeholder="Contoh: Toyota HiAce Premio, Isuzu Elf Long, Medium Bus"
                      value={formType}
                      onChange={(e) => setFormType(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs font-bold text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#2F2FE4]/20 focus:border-[#2F2FE4]"
                      required
                    />
                  </div>

                  {/* Kapasitas Kursi */}
                  <div className="text-xs font-semibold">
                    <label className="text-gray-700 block mb-1 flex items-center gap-1">
                      <Users size={14} className="text-gray-400" />
                      <span>Jumlah Kapasitas Kursi / Penumpang (Pax)</span>
                    </label>
                    
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min={1}
                        max={100}
                        value={formCapacity}
                        onChange={(e) => setFormCapacity(Number(e.target.value))}
                        className="w-24 px-3 py-2 border border-gray-300 rounded-lg text-xs font-bold text-gray-800 text-center focus:outline-none focus:ring-2 focus:ring-[#2F2FE4]/20 focus:border-[#2F2FE4]"
                        required
                      />
                      <span className="text-xs font-bold text-gray-500">Penumpang</span>
                    </div>

                    {/* Presets Row */}
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      <button
                        type="button"
                        onClick={() => applyCapacityPreset(10)}
                        className={`px-2.5 py-1 text-[10px] font-extrabold rounded-lg border transition-all ${
                          formCapacity === 10
                            ? 'bg-indigo-50 border-indigo-300 text-indigo-700'
                            : 'bg-white border-gray-200 text-gray-600 hover:border-gray-300'
                        }`}
                      >
                        10 Seat (Minibus)
                      </button>
                      <button
                        type="button"
                        onClick={() => applyCapacityPreset(14)}
                        className={`px-2.5 py-1 text-[10px] font-extrabold rounded-lg border transition-all ${
                          formCapacity === 14
                            ? 'bg-indigo-50 border-indigo-300 text-indigo-700'
                            : 'bg-white border-gray-200 text-gray-600 hover:border-gray-300'
                        }`}
                      >
                        14 Seat (HiAce)
                      </button>
                      <button
                        type="button"
                        onClick={() => applyCapacityPreset(19)}
                        className={`px-2.5 py-1 text-[10px] font-extrabold rounded-lg border transition-all ${
                          formCapacity === 19
                            ? 'bg-indigo-50 border-indigo-300 text-indigo-700'
                            : 'bg-white border-gray-200 text-gray-600 hover:border-gray-300'
                        }`}
                      >
                        19 Seat (Elf Long)
                      </button>
                      <button
                        type="button"
                        onClick={() => applyCapacityPreset(29)}
                        className={`px-2.5 py-1 text-[10px] font-extrabold rounded-lg border transition-all ${
                          formCapacity === 29
                            ? 'bg-indigo-50 border-indigo-300 text-indigo-700'
                            : 'bg-white border-gray-200 text-gray-600 hover:border-gray-300'
                        }`}
                      >
                        29 Seat (Medium Bus)
                      </button>
                    </div>
                  </div>

                  {/* Status Armada Select Card */}
                  <div className="text-xs font-semibold">
                    <label className="text-gray-700 block mb-2">Status Operasional Awal</label>
                    <div className="grid grid-cols-3 gap-2">
                      <button
                        type="button"
                        onClick={() => setFormStatus('Ready')}
                        className={`p-2 rounded-xl border text-center font-bold flex flex-col items-center justify-center gap-1 cursor-pointer transition-all ${
                          formStatus === 'Ready'
                            ? 'bg-emerald-50 border-emerald-300 text-emerald-800 ring-2 ring-emerald-600/15'
                            : 'bg-white border-gray-200 text-gray-500 hover:bg-gray-50'
                        }`}
                      >
                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                        <span className="text-[10px] uppercase">Ready</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setFormStatus('Di Perbaiki')}
                        className={`p-2 rounded-xl border text-center font-bold flex flex-col items-center justify-center gap-1 cursor-pointer transition-all ${
                          formStatus === 'Di Perbaiki'
                            ? 'bg-rose-50 border-rose-300 text-rose-800 ring-2 ring-rose-600/15'
                            : 'bg-white border-gray-200 text-gray-500 hover:bg-gray-50'
                        }`}
                      >
                        <span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span>
                        <span className="text-[10px] uppercase">Di Perbaiki</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setFormStatus('Dalam Perjalanan')}
                        className={`p-2 rounded-xl border text-center font-bold flex flex-col items-center justify-center gap-1 cursor-pointer transition-all ${
                          formStatus === 'Dalam Perjalanan'
                            ? 'bg-blue-50 border-blue-300 text-blue-800 ring-2 ring-blue-600/15'
                            : 'bg-white border-gray-200 text-gray-500 hover:bg-gray-50'
                        }`}
                      >
                        <span className="w-2.5 h-2.5 rounded-full bg-blue-500"></span>
                        <span className="text-[10px] uppercase">Bertugas</span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* RIGHT COLUMN: Amenities & Premium Facilities Checkbox cards */}
                <div className="space-y-4">
                  <h4 className="text-xs font-black text-gray-400 uppercase tracking-wider pb-2 border-b border-gray-100 flex items-center gap-1.5">
                    <Sparkles size={14} className="text-indigo-600" />
                    <span>Fasilitas &amp; Fitur Unit Armada</span>
                  </h4>

                  <p className="text-[10px] text-gray-500 font-bold leading-relaxed">
                    Pilih fasilitas kenyamanan premium yang tersedia dan aktif di dalam unit armada ini untuk informasi layanan AJK dan charter:
                  </p>

                  {/* Grid of Interactive Facility Cards */}
                  <div className="grid grid-cols-2 gap-3">
                    {/* Wifi Card */}
                    <button
                      type="button"
                      onClick={() => setFormHasWifi(!formHasWifi)}
                      className={`p-3.5 rounded-xl border text-left flex items-start gap-2.5 cursor-pointer transition-all active:scale-98 ${
                        formHasWifi
                          ? 'bg-blue-50 border-blue-300 text-blue-900 ring-1 ring-blue-500/20'
                          : 'bg-white border-gray-200 text-gray-500 hover:bg-gray-50'
                      }`}
                    >
                      <div className={`p-1.5 rounded-lg shrink-0 ${formHasWifi ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-400'}`}>
                        <Wifi size={14} />
                      </div>
                      <div className="text-xs">
                        <strong className="font-bold block">WiFi Internet</strong>
                        <span className="text-[9px] text-gray-400 font-medium">Modem internet aktif</span>
                      </div>
                    </button>

                    {/* AC Card */}
                    <button
                      type="button"
                      onClick={() => setFormHasAc(!formHasAc)}
                      className={`p-3.5 rounded-xl border text-left flex items-start gap-2.5 cursor-pointer transition-all active:scale-98 ${
                        formHasAc
                          ? 'bg-green-50 border-green-300 text-green-900 ring-1 ring-green-500/20'
                          : 'bg-white border-gray-200 text-gray-500 hover:bg-gray-50'
                      }`}
                    >
                      <div className={`p-1.5 rounded-lg shrink-0 ${formHasAc ? 'bg-green-500 text-white' : 'bg-gray-100 text-gray-400'}`}>
                        <Wind size={14} />
                      </div>
                      <div className="text-xs">
                        <strong className="font-bold block">Pendingin AC</strong>
                        <span className="text-[9px] text-gray-400 font-medium">Sistem AC Double Blower</span>
                      </div>
                    </button>

                    {/* USB Charger Card */}
                    <button
                      type="button"
                      onClick={() => setFormHasUsb(!formHasUsb)}
                      className={`p-3.5 rounded-xl border text-left flex items-start gap-2.5 cursor-pointer transition-all active:scale-98 ${
                        formHasUsb
                          ? 'bg-amber-50 border-amber-300 text-amber-900 ring-1 ring-amber-500/20'
                          : 'bg-white border-gray-200 text-gray-500 hover:bg-gray-50'
                      }`}
                    >
                      <div className={`p-1.5 rounded-lg shrink-0 ${formHasUsb ? 'bg-amber-500 text-white' : 'bg-gray-100 text-gray-400'}`}>
                        <Usb size={14} />
                      </div>
                      <div className="text-xs">
                        <strong className="font-bold block">USB Charger</strong>
                        <span className="text-[9px] text-gray-400 font-medium">Port charger di setiap baris</span>
                      </div>
                    </button>

                    {/* Entertainment System Card */}
                    <button
                      type="button"
                      onClick={() => setFormHasEntertainment(!formHasEntertainment)}
                      className={`p-3.5 rounded-xl border text-left flex items-start gap-2.5 cursor-pointer transition-all active:scale-98 ${
                        formHasEntertainment
                          ? 'bg-purple-50 border-purple-300 text-purple-900 ring-1 ring-purple-500/20'
                          : 'bg-white border-gray-200 text-gray-500 hover:bg-gray-50'
                      }`}
                    >
                      <div className={`p-1.5 rounded-lg shrink-0 ${formHasEntertainment ? 'bg-purple-500 text-white' : 'bg-gray-100 text-gray-400'}`}>
                        <Tv size={14} />
                      </div>
                      <div className="text-xs">
                        <strong className="font-bold block">Entertainment</strong>
                        <span className="text-[9px] text-gray-400 font-medium">TV Monitor &amp; Audio Karaoke</span>
                      </div>
                    </button>
                  </div>

                  {/* Additional Facility Notes */}
                  <div className="text-xs font-semibold">
                    <label className="text-gray-700 block mb-1">Catatan Khusus Fasilitas (Opsional)</label>
                    <textarea
                      rows={3}
                      placeholder="Masukkan catatan pendukung, contoh: Tersedia bantal leher, air minum botol gratis, asuransi perjalanan aktif, toilet khusus, dsb."
                      value={formFacilityNotes}
                      onChange={(e) => setFormFacilityNotes(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs font-medium text-gray-750 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#2F2FE4]/20 focus:border-[#2F2FE4]"
                    />
                  </div>
                </div>

              </div>

              {/* Bottom Action Form Bar */}
              <div className="pt-5 border-t border-gray-150 flex flex-col sm:flex-row sm:items-center justify-end gap-2 text-xs">
                <button
                  type="button"
                  onClick={() => setViewMode('list')}
                  className="w-full sm:w-auto text-center px-5 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-extrabold rounded-xl cursor-pointer transition-colors"
                >
                  Batalkan &amp; Kembali
                </button>
                <button
                  type="submit"
                  className="w-full sm:w-auto flex items-center justify-center gap-1.5 bg-[#2F2FE4] hover:bg-[#2020D0] text-white font-extrabold px-6 py-2.5 rounded-xl shadow-md cursor-pointer transition-all active:scale-95"
                >
                  <Check size={16} />
                  <span>{viewMode === 'create' ? 'Simpan Unit Baru' : 'Simpan Perubahan Unit'}</span>
                </button>
              </div>

            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* DETAILED MODAL (Laporan kerusakan) */}
      <AnimatePresence>
        {selectedDetailArmada && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full max-h-[85vh] overflow-hidden border border-gray-100 flex flex-col"
            >
              {/* Modal Header */}
              <div className="p-6 border-b border-gray-150 flex items-center justify-between bg-gray-50">
                <div>
                  <h3 className="text-base font-black text-gray-800 tracking-tight flex items-center gap-2">
                    <Wrench className="text-[#2F2FE4]" size={18} />
                    <span>Laporan Kerusakan & Bengkel</span>
                  </h3>
                  <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider mt-1">
                    {selectedDetailArmada.carType} — <span className="text-[#2F2FE4] font-black">{selectedDetailArmada.plateNumber}</span>
                  </p>
                </div>
                <button
                  onClick={() => setSelectedDetailArmada(null)}
                  className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-200/60 rounded-full transition-all cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Modal Content */}
              <div className="p-6 overflow-y-auto flex-1 space-y-6">
                
                {/* 1. EXISTING SECTION: Active Repair Card */}
                {(() => {
                  const activeRecord = maintenanceList.find(
                    (m) => m.armadaId === selectedDetailArmada.id && m.status === 'Dalam Perbaikan'
                  );

                  return (
                    <div className="space-y-3">
                      <h4 className="text-xs font-black text-gray-400 uppercase tracking-wider pb-1 border-b border-gray-100 flex items-center gap-1.5">
                        <Wrench size={14} className="text-rose-600" />
                        <span>Status &amp; Perbaikan Aktif</span>
                      </h4>

                      {selectedDetailArmada.status === 'Di Perbaiki' ? (
                        <div className="bg-red-50/70 border border-red-200 rounded-xl p-4 space-y-4">
                          <div className="flex items-center justify-between">
                            <span className="flex items-center gap-1.5 text-xs font-bold text-red-700 uppercase tracking-wide">
                              <AlertCircle size={14} />
                              Sedang dalam perbaikan
                            </span>
                            {activeRecord && (
                              <span className="text-[11px] font-semibold text-gray-500 font-mono bg-white px-2 py-0.5 rounded border border-gray-200">
                                Mulai: {activeRecord.date}
                              </span>
                            )}
                          </div>

                          {activeRecord && activeRecord.damages && activeRecord.damages.length > 0 ? (
                            <div className="space-y-2">
                              <p className="text-[10px] font-black text-rose-700 uppercase tracking-wider">
                                Keluhan / Rincian Kerusakan Bengkel:
                              </p>
                              <div className="divide-y divide-red-100 bg-white rounded-xl border border-red-100 overflow-hidden shadow-2xs">
                                {activeRecord.damages.map((dmg) => (
                                  <div key={dmg.id} className="p-3 flex items-center justify-between gap-3 text-xs">
                                    <div className="space-y-0.5">
                                      <p className="font-bold text-gray-800">{dmg.description}</p>
                                      <p className="font-black text-emerald-600">{formatRupiah(dmg.cost)}</p>
                                    </div>
                                    <div>
                                      {dmg.status === 'Selesai' ? (
                                        <span className="flex items-center gap-1 text-[10px] font-black text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-full uppercase">
                                          ✓ Selesai
                                        </span>
                                      ) : (
                                        <button
                                          onClick={() => onResolveMaintenance(activeRecord.id, dmg.id)}
                                          className="flex items-center gap-1 text-[10px] font-black text-[#2F2FE4] hover:text-white bg-indigo-50 hover:bg-[#2F2FE4] border border-indigo-200 px-2.5 py-1 rounded-full transition-all cursor-pointer"
                                        >
                                          <Check size={11} />
                                          <span>Selesaikan</span>
                                        </button>
                                      )}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          ) : (
                            <p className="text-xs text-red-700 font-semibold italic">
                              Tidak ada rincian keluhan kerusakan spesifik yang diinput.
                            </p>
                          )}

                          <div className="pt-2 border-t border-red-200/50">
                            <button
                              onClick={() => {
                                if (confirm('Apakah Anda yakin ingin menyelesaikan semua perbaikan untuk mobil ini?')) {
                                  onManualCompleteMaintenance(selectedDetailArmada.id);
                                }
                              }}
                              className="w-full flex items-center justify-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white py-2 px-4 rounded-xl font-bold text-xs transition-all shadow-sm cursor-pointer"
                            >
                              <CheckCircle2 size={14} />
                              <span>Selesaikan Semua Perbaikan (Manual Admin)</span>
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 text-center py-6">
                          <CheckCircle2 size={24} className="text-emerald-500 mx-auto mb-2 animate-bounce" />
                          <p className="text-xs font-bold text-gray-700">Kendaraan dalam kondisi prima</p>
                          <p className="text-[10px] text-gray-400 font-semibold mt-0.5 uppercase tracking-wider">Tidak ada laporan kerusakan aktif.</p>
                        </div>
                      )}
                    </div>
                  );
                })()}

                {/* 2. EXISTING SECTION: Maintenance History */}
                <div className="space-y-3">
                  <h4 className="text-xs font-black text-gray-400 uppercase tracking-wider pb-1 border-b border-gray-100 flex items-center gap-1.5">
                    <Calendar size={14} className="text-gray-500" />
                    <span>Riwayat Laporan Perbaikan Bengkel Lampau</span>
                  </h4>
                  {(() => {
                    const completedRecords = maintenanceList.filter(
                      (m) => m.armadaId === selectedDetailArmada.id && m.status === 'Selesai'
                    );

                    if (completedRecords.length === 0) {
                      return (
                        <p className="text-xs text-gray-400 italic bg-gray-50 border border-gray-150 rounded-xl p-4 text-center font-bold">
                          Belum ada riwayat perbaikan sebelumnya untuk armada ini.
                        </p>
                      );
                    }

                    return (
                      <div className="space-y-2.5">
                        {completedRecords.map((mRecord) => (
                          <div key={mRecord.id} className="bg-white border border-gray-150 rounded-xl p-3.5 space-y-2.5 shadow-xs">
                            <div className="flex justify-between items-center text-xs">
                              <span className="flex items-center gap-1 text-gray-500 font-bold">
                                <Calendar size={13} />
                                <span>Selesai pada: {mRecord.completedAt ? new Date(mRecord.completedAt).toLocaleDateString('id-ID') : mRecord.date}</span>
                              </span>
                              <span className="font-mono font-extrabold text-emerald-600 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-lg text-[11px]">
                                {formatRupiah(mRecord.totalCost || mRecord.cost || 0)}
                              </span>
                            </div>

                            {mRecord.damages && mRecord.damages.length > 0 ? (
                              <div className="bg-gray-50 rounded-xl p-2.5 divide-y divide-gray-100 text-xs">
                                {mRecord.damages.map((dmg) => (
                                  <div key={dmg.id} className="py-1.5 flex items-center justify-between text-gray-600">
                                    <span className="font-semibold">{dmg.description}</span>
                                    <span className="font-medium text-gray-400">{formatRupiah(dmg.cost)}</span>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <p className="text-xs text-gray-600 font-bold">
                                {mRecord.description}
                              </p>
                            )}
                          </div>
                        ))}
                      </div>
                    );
                  })()}
                </div>
              </div>

              {/* Modal Footer */}
              <div className="p-4 border-t border-gray-150 flex justify-end bg-gray-50 gap-2">
                <button
                  onClick={() => setSelectedDetailArmada(null)}
                  className="px-5 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-xl text-xs font-bold transition-all cursor-pointer"
                >
                  Tutup
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

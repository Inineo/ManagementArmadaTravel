/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Order } from '../types';
import { ArrowLeft, Clock, ShieldCheck, CheckCircle, XCircle, ImageIcon, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface DetailPerjalananProps {
  order: Order;
  onBack: () => void;
  onCompleteOrder: (id: string) => void;
  onCancelOrder: (id: string) => void;
}

interface LogAktivitas {
  id: string;
  tipe: string;
  waktu: string;
  lokasi: string;
  tanggal: string;
}

export default function DetailPerjalanan({
  order,
  onBack,
  onCompleteOrder,
  onCancelOrder,
}: DetailPerjalananProps) {
  const [selectedLog, setSelectedLog] = useState<LogAktivitas | null>(null);
  // Foto real dari API
  const [photos, setPhotos] = useState<{ id: string; url: string; uploadedAt: string }[]>([]);
  const [photosLoading, setPhotosLoading] = useState(false);
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);

  // Fetch foto dari API saat view gambar laporan dibuka
  useEffect(() => {
    if (!selectedLog) return;
    setPhotosLoading(true);
    setCurrentPhotoIndex(0);
    fetch(`/api/laporan-foto?tripId=${encodeURIComponent(order.id)}`)
      .then(res => res.json())
      .then(data => setPhotos(data.photos || []))
      .catch(() => setPhotos([]))
      .finally(() => setPhotosLoading(false));
  }, [selectedLog, order.id]);

  // Parse time to AM/PM for standard display
  const formatTimeAMPM = (timeStr: string) => {
    if (!timeStr) return '08.00 AM';
    const [hoursStr, minutesStr] = timeStr.split(':');
    const hours = parseInt(hoursStr, 10);
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const formattedHours = hours % 12 || 12;
    const padHours = formattedHours < 10 ? `0${formattedHours}` : formattedHours;
    return `${padHours}.${minutesStr} ${ampm}`;
  };

  // Convert "2026-06-30" to standard Indonesian display date or nice format
  const formatDateReadable = (dateStr: string) => {
    if (!dateStr) return '30 Juni 2026';
    const months = [
      'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
      'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
    ];
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      const year = parts[0];
      const monthIndex = parseInt(parts[1], 10) - 1;
      const day = parseInt(parts[2], 10);
      return `${day} ${months[monthIndex]} ${year}`;
    }
    return dateStr;
  };

  const getAmPmHour = (timeStr: string, offsetHours: number) => {
    if (!timeStr) return '10.00 AM';
    const [hoursStr, minutesStr] = timeStr.split(':');
    let hours = (parseInt(hoursStr, 10) + offsetHours) % 24;
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const formattedHours = hours % 12 || 12;
    const padHours = formattedHours < 10 ? `0${formattedHours}` : formattedHours;
    return `${padHours}.${minutesStr} ${ampm}`;
  };

  // Create 2 mock activity logs exactly matching the style shown in the screenshots
  const logs: LogAktivitas[] = [
    {
      id: 'log-1',
      tipe: 'Mulai Jalan',
      waktu: formatTimeAMPM(order.departureTime),
      lokasi: 'Jl. Anggajaya 1, Gejayan, Condongcatur, Kec. Depok, Kabupaten Sleman, Daerah Istimewa Yogyakarta',
      tanggal: formatDateReadable(order.departureDate),
    },
    {
      id: 'log-2',
      tipe: 'Dalam Perjalanan',
      waktu: getAmPmHour(order.departureTime, 2),
      lokasi: 'Jl. Anggajaya 1, Gejayan, Condongcatur, Kec. Depok, Kabupaten Sleman, Daerah Istimewa Yogyakarta',
      tanggal: formatDateReadable(order.departureDate),
    },
  ];

  // Render Screenshot 1: "Gambar Laporan" view
  if (selectedLog) {
    const hasRealPhotos = photos.length > 0;
    const currentPhoto = hasRealPhotos ? photos[currentPhotoIndex] : null;

    return (
      <div id="image-report-container" className="flex flex-col h-full bg-[#F0F2F5]">
        {/* Header navigation */}
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={() => setSelectedLog(null)}
            className="flex items-center gap-2 text-[#2F2FE4] hover:text-[#2020D0] font-bold text-xl transition-colors focus:outline-none"
          >
            <ArrowLeft size={24} className="stroke-[3px]" />
            <span>Detail Perjalanan</span>
          </button>
          {hasRealPhotos && (
            <span className="text-xs font-bold text-gray-500 bg-white px-3 py-1.5 rounded-full border border-gray-200">
              {currentPhotoIndex + 1} / {photos.length} Foto
            </span>
          )}
        </div>

        {/* Image Content Canvas */}
        <div className="flex-1 relative bg-black rounded-2xl overflow-hidden shadow-lg border border-gray-200">
          {photosLoading ? (
            <div className="w-full h-full flex items-center justify-center bg-gray-900">
              <div className="text-center text-white">
                <Loader2 size={32} className="animate-spin mx-auto mb-2" />
                <p className="text-sm font-bold">Memuat foto laporan...</p>
              </div>
            </div>
          ) : hasRealPhotos && currentPhoto ? (
            <>
              <img
                src={currentPhoto.url}
                alt={`Foto Laporan ${currentPhotoIndex + 1}`}
                className="w-full h-full object-cover"
              />
              {/* Navigasi foto */}
              {photos.length > 1 && (
                <>
                  <button
                    onClick={() => setCurrentPhotoIndex(i => Math.max(0, i - 1))}
                    disabled={currentPhotoIndex === 0}
                    className="absolute left-3 top-1/2 -translate-y-1/2 p-2 bg-black/50 hover:bg-black/70 text-white rounded-full disabled:opacity-30 transition-all cursor-pointer"
                  >
                    <ChevronLeft size={20} />
                  </button>
                  <button
                    onClick={() => setCurrentPhotoIndex(i => Math.min(photos.length - 1, i + 1))}
                    disabled={currentPhotoIndex === photos.length - 1}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-2 bg-black/50 hover:bg-black/70 text-white rounded-full disabled:opacity-30 transition-all cursor-pointer"
                  >
                    <ChevronRight size={20} />
                  </button>
                  {/* Dot indicators */}
                  <div className="absolute top-3 left-1/2 -translate-x-1/2 flex gap-1.5">
                    {photos.map((_, i) => (
                      <button
                        key={i}
                        onClick={() => setCurrentPhotoIndex(i)}
                        className={`w-2 h-2 rounded-full transition-all cursor-pointer ${
                          i === currentPhotoIndex ? 'bg-white scale-125' : 'bg-white/50'
                        }`}
                      />
                    ))}
                  </div>
                </>
              )}
              {/* Overlay info */}
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 via-black/60 to-transparent p-6 flex flex-col justify-end text-white">
                <h2 className="text-lg md:text-xl font-bold leading-snug tracking-wide drop-shadow-md">
                  {selectedLog.lokasi}
                </h2>
                <p className="text-sm text-white/90 mt-1.5 font-medium flex items-center gap-2">
                  <Clock size={14} />
                  <span>{selectedLog.waktu}, {selectedLog.tanggal}</span>
                </p>
                <p className="text-[10px] text-white/60 font-bold mt-1">
                  Diupload: {new Date(currentPhoto.uploadedAt).toLocaleString('id-ID')}
                </p>
              </div>
            </>
          ) : (
            /* Placeholder jika belum ada foto dari driver */
            <>
              <img
                src="/bus_report_detail.jpg"
                alt="Foto Laporan Perjalanan (Demo)"
                className="w-full h-full object-cover opacity-60"
              />
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/50">
                <ImageIcon size={40} className="text-white/60 mb-3" />
                <p className="text-white font-black text-sm">Belum Ada Foto Laporan</p>
                <p className="text-white/70 text-xs font-semibold mt-1 text-center px-8">
                  Driver belum mengupload foto untuk trip ini.<br />
                  Foto dapat diupload di halaman <strong>/driver/laporan</strong>
                </p>
              </div>
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 via-black/60 to-transparent p-6 flex flex-col justify-end text-white">
                <h2 className="text-lg font-bold leading-snug drop-shadow-md">{selectedLog.lokasi}</h2>
                <p className="text-sm text-white/95 mt-1.5 font-medium flex items-center gap-2">
                  <Clock size={14} />
                  <span>{selectedLog.waktu}, {selectedLog.tanggal}</span>
                </p>
              </div>
            </>
          )}
        </div>
      </div>
    );
  }

  // Render Screenshot 2: "Detail Perjalanan & Log Aktivitas" view
  return (
    <div id="trip-detail-dashboard" className="flex flex-col h-full bg-[#F0F2F5] space-y-6">
      {/* Top Header Navigation */}
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-[#2F2FE4] hover:text-[#2020D0] font-bold text-xl transition-colors focus:outline-none"
        >
          <ArrowLeft size={24} className="stroke-[3px]" />
          <span>Dashboard</span>
        </button>

        {/* Actions header shortcut */}
        <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-xl shadow-sm border border-gray-200 text-xs font-bold text-gray-500">
          <ShieldCheck size={16} className="text-green-500" />
          <span>SISTEM MONITORING GPS AKTIF</span>
        </div>
      </div>

      {/* Primary Panels Layout */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-6 items-start min-h-0 overflow-y-auto">
        {/* Left Column (Detail Perjalanan card) */}
        <div className="lg:col-span-1 bg-[#EAECEF] border border-[#D5D8DC] rounded-2xl p-6 shadow-sm flex flex-col space-y-4">
          <h2 className="text-base font-extrabold text-gray-600 uppercase tracking-wider mb-2">
            Detail Perjalanan
          </h2>
          
          <div className="bg-white rounded-xl p-5 space-y-4 shadow-sm border border-gray-200/50">
            <div>
              <p className="text-xs font-bold text-gray-400 uppercase">Driver</p>
              <p className="text-lg font-black text-gray-800 mt-1">Driver {order.driverName}</p>
            </div>

            <div className="border-t border-gray-100 pt-3">
              <p className="text-xs font-bold text-gray-400 uppercase">Kendaraan / Armada</p>
              <p className="text-base font-extrabold text-gray-800 mt-1">
                {order.plateNumber} — {order.carType}
              </p>
            </div>

            <div className="border-t border-gray-100 pt-3">
              <p className="text-xs font-bold text-gray-400 uppercase mb-3">Rute Perjalanan Terjadwal ({order.routes?.length || 2} Titik)</p>
              <div className="space-y-3.5 pl-2 border-l border-indigo-200 ml-2 mb-4 relative py-1">
                {(order.routes && order.routes.length > 0 ? order.routes : [order.origin, order.destination]).map((stop, stopIdx, stopArr) => (
                  <div key={stopIdx} className="relative flex items-start gap-2.5">
                    <span className={`absolute -left-[12.5px] top-1 w-2.5 h-2.5 rounded-full border-2 ${
                      stopIdx === 0 
                        ? 'bg-green-500 border-white shadow-sm' 
                        : stopIdx === stopArr.length - 1 
                          ? 'bg-[#2F2FE4] border-white shadow-sm' 
                          : 'bg-white border-indigo-400'
                    }`} style={{ width: '10px', height: '10px' }} />
                    <div className="flex flex-col">
                      <span className="text-[9px] text-gray-400 font-black uppercase tracking-wider leading-none">
                        {stopIdx === 0 ? 'Mulai Keberangkatan' : stopIdx === stopArr.length - 1 ? 'Tujuan Akhir' : `Pemberhentian ${stopIdx}`}
                      </span>
                      <span className="text-xs font-bold text-gray-700 mt-0.5">{stop}</span>
                    </div>
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-2 gap-2 mt-2 pt-2 border-t border-gray-100">
                <div>
                  <p className="text-[9px] font-black text-emerald-600 uppercase tracking-wider">Mulai Pergi</p>
                  <p className="text-xs font-bold text-gray-700 mt-0.5">{formatDateReadable(order.departureDate)}</p>
                  <p className="text-[10px] font-medium text-gray-400 mt-0.5 flex items-center gap-1">
                    <Clock size={11} /> {formatTimeAMPM(order.departureTime)}
                  </p>
                </div>
                <div>
                  <p className="text-[9px] font-black text-[#2F2FE4] uppercase tracking-wider">Estimasi Kembali</p>
                  <p className="text-xs font-bold text-gray-700 mt-0.5">{formatDateReadable(order.returnDate)}</p>
                  <p className="text-[10px] font-medium text-gray-400 mt-0.5 flex items-center gap-1">
                    <Clock size={11} /> {formatTimeAMPM(order.returnTime)}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Selesaikan / Batalkan action triggers directly from detail page */}
          <div className="bg-white/80 rounded-xl p-4 space-y-2 border border-gray-200">
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider text-center mb-1">
              Kelola Perjalanan
            </p>
            <button
              onClick={() => {
                onCompleteOrder(order.id);
                onBack();
              }}
              className="w-full flex items-center justify-center gap-2 bg-[#38C172] hover:bg-green-600 text-white py-2.5 px-4 rounded-lg font-bold text-sm shadow-sm transition-all"
            >
              <CheckCircle size={16} />
              <span>Selesaikan Perjalanan</span>
            </button>
            <button
              onClick={() => {
                onCancelOrder(order.id);
                onBack();
              }}
              className="w-full flex items-center justify-center gap-2 bg-[#E3342F] hover:bg-red-600 text-white py-2.5 px-4 rounded-lg font-bold text-sm shadow-sm transition-all"
            >
              <XCircle size={16} />
              <span>Batalkan Perjalanan</span>
            </button>
          </div>
        </div>

        {/* Right Column (Log Aktivitas Perjalanan) */}
        <div className="lg:col-span-2 bg-[#EAECEF] border border-[#D5D8DC] rounded-2xl p-6 shadow-sm flex flex-col space-y-4">
          <h2 className="text-base font-extrabold text-gray-600 uppercase tracking-wider">
            Log Aktivitas Perjalanan
          </h2>

          <div className="space-y-4">
            {logs.map((log) => (
              <div
                key={log.id}
                className="bg-white rounded-xl p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm border border-gray-200 hover:shadow-md transition-shadow"
              >
                <div className="flex-1 flex items-start gap-4">
                  {/* Left info */}
                  <div className="min-w-[100px] flex flex-col">
                    <span className="font-extrabold text-gray-800 text-sm">{log.tipe}</span>
                    <span className="text-xs text-gray-500 font-bold mt-0.5">{log.waktu}</span>
                  </div>

                  {/* Middle address */}
                  <div className="flex-1 text-sm font-semibold text-gray-600 leading-relaxed">
                    {log.lokasi}
                  </div>
                </div>

                {/* Right link */}
                <button
                  onClick={() => setSelectedLog(log)}
                  className="text-[#2F2FE4] hover:text-[#2020D0] hover:underline text-xs font-extrabold tracking-wide shrink-0 transition-colors focus:outline-none"
                >
                  Lihat Gambar Laporan &rarr;
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

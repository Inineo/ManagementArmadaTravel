/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Order } from '../types';
import { ArrowLeft, MapPin, Clock, Calendar, ShieldCheck, CheckCircle, XCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import busImage from '../assets/images/bus_report_detail_1783238150169.jpg';

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
  // State to track if we are viewing the report image details (Screenshot 1)
  const [selectedLog, setSelectedLog] = useState<LogAktivitas | null>(null);

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
    return (
      <div id="image-report-container" className="flex flex-col h-full bg-[#F0F2F5]">
        {/* Header navigation */}
        <div className="flex items-center mb-6">
          <button
            onClick={() => setSelectedLog(null)}
            className="flex items-center gap-2 text-[#2F2FE4] hover:text-[#2020D0] font-bold text-xl transition-colors focus:outline-none"
          >
            <ArrowLeft size={24} className="stroke-[3px]" />
            <span>Detail Perjalanan</span>
          </button>
        </div>

        {/* Image Content Canvas */}
        <div className="flex-1 relative bg-black rounded-2xl overflow-hidden shadow-lg border border-gray-200">
          <img
            src={busImage}
            alt="Foto Laporan Perjalanan"
            className="w-full h-full object-cover"
            referrerPolicy="no-referrer"
          />
          {/* Text overlay exactly matching Screenshot 1 */}
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 via-black/60 to-transparent p-6 md:p-8 flex flex-col justify-end text-white">
            <h2 className="text-lg md:text-2xl font-bold leading-snug tracking-wide text-white drop-shadow-md">
              {selectedLog.lokasi}
            </h2>
            <p className="text-sm md:text-lg text-white/95 mt-2 font-medium drop-shadow-sm flex items-center gap-2">
              <Clock size={16} />
              <span>{selectedLog.waktu}, {selectedLog.tanggal}</span>
            </p>
          </div>
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

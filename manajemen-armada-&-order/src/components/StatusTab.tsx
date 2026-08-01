/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Order } from '../types';
import { SlidersHorizontal, ArrowRight, CheckCircle, XCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface StatusTabProps {
  ordersList: Order[];
  onCompleteOrder: (id: string) => void;
  onCancelOrder: (id: string) => void;
  onViewDetail: (order: Order) => void;
}

export default function StatusTab({
  ordersList,
  onCompleteOrder,
  onCancelOrder,
  onViewDetail,
}: StatusTabProps) {
  const [filterQuery, setFilterQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedOrderForAction, setSelectedOrderForAction] = useState<string | null>(null);

  // Active trips "Dalam Perjalanan"
  const activeTrips = ordersList.filter((o) => o.status === 'Dalam Perjalanan');

  const filteredTrips = activeTrips.filter(
    (trip) =>
      trip.driverName.toLowerCase().includes(filterQuery.toLowerCase()) ||
      trip.plateNumber.toLowerCase().includes(filterQuery.toLowerCase()) ||
      trip.origin.toLowerCase().includes(filterQuery.toLowerCase()) ||
      trip.destination.toLowerCase().includes(filterQuery.toLowerCase())
  );

  const formatTime = (timeStr: string) => {
    if (!timeStr) return '';
    const [hoursStr, minutesStr] = timeStr.split(':');
    const hours = parseInt(hoursStr, 10);
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const formattedHours = hours % 12 || 12;
    const padHours = formattedHours < 10 ? `0${formattedHours}` : formattedHours;
    return `${padHours}.${minutesStr} ${ampm}`;
  };

  return (
    <div id="status-tab-container" className="flex flex-col h-full space-y-4">
      {/* Filter Button & Filter input */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2 text-[#2F2FE4] hover:text-[#2020D0] font-semibold text-base transition-colors py-1.5 px-3 rounded-lg hover:bg-[#EAECEF]"
          >
            <SlidersHorizontal size={18} />
            <span>Filter</span>
          </button>
          
          {showFilters && (
            <motion.input
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: '250px', opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              type="text"
              placeholder="Cari rute, driver, plat..."
              value={filterQuery}
              onChange={(e) => setFilterQuery(e.target.value)}
              className="px-3 py-1.5 bg-[#EAECEF] border border-[#CCCCCC] rounded-lg text-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-[#2F2FE4]/30"
            />
          )}
        </div>
      </div>

      {/* Trips list */}
      <div id="status-list-container" className="flex-1 overflow-y-auto space-y-4">
        <AnimatePresence initial={false}>
          {filteredTrips.map((trip) => {
            const isActionOpen = selectedOrderForAction === trip.id;
            return (
              <motion.div
                key={trip.id}
                layout
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-white border border-[#E2E8F0] rounded-xl shadow-sm hover:shadow-md transition-all overflow-hidden"
              >
                <div className="p-5 flex flex-wrap md:flex-nowrap items-center justify-between gap-4">
                  {/* Driver and Vehicle info */}
                  <div className="w-full md:w-5/12">
                    <div className="font-bold text-gray-800 text-lg">{trip.driverName}</div>
                    <div className="text-sm font-semibold text-gray-500 mt-0.5">
                      {trip.plateNumber} — {trip.carType}
                    </div>
                  </div>

                  {/* Route and time */}
                  <div className="w-full md:w-3/12 flex flex-col justify-center">
                    <div className="font-bold text-gray-700 text-base">
                      {formatTime(trip.departureTime) || trip.departureTime}
                    </div>
                    <div className="text-sm font-semibold text-gray-500 mt-0.5">
                      {trip.origin} - {trip.destination}
                    </div>
                  </div>

                  {/* Status badge with green dot pulse */}
                  <div className="w-full md:w-3/12 flex items-center justify-start md:justify-center">
                    <div className="flex items-center gap-2 px-4 py-2 bg-green-50 rounded-full border border-green-100">
                      <span className="relative flex h-3 w-3">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-3 w-3 bg-[#38C172]"></span>
                      </span>
                      <span className="text-sm font-bold text-[#38C172]">
                        Dalam Perjalanan
                      </span>
                    </div>
                  </div>

                  {/* Action trigger button */}
                  <div className="w-full md:w-1/12 flex justify-end">
                    <button
                      onClick={() => onViewDetail(trip)}
                      className="p-2.5 rounded-full border border-gray-200 text-[#2F2FE4] hover:bg-blue-50 hover:scale-[1.05] transition-all"
                      title="Lihat Detail Perjalanan"
                    >
                      <ArrowRight size={20} />
                    </button>
                  </div>
                </div>

                {/* Sliding Action Panel when arrow is clicked */}
                {isActionOpen && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="bg-gray-50 border-t border-[#E2E8F0] p-4 flex justify-between items-center"
                  >
                    <span className="text-sm font-semibold text-gray-600">
                      Kelola perjalanan untuk {trip.driverName}:
                    </span>
                    <div className="flex gap-3">
                      <button
                        onClick={() => {
                          onCompleteOrder(trip.id);
                          setSelectedOrderForAction(null);
                        }}
                        className="flex items-center gap-2 bg-[#38C172] hover:bg-green-600 text-white px-4 py-2 rounded-lg font-bold text-sm shadow-sm transition-all hover:scale-[1.02]"
                      >
                        <CheckCircle size={16} />
                        <span>Selesaikan Trip</span>
                      </button>
                      <button
                        onClick={() => {
                          onCancelOrder(trip.id);
                          setSelectedOrderForAction(null);
                        }}
                        className="flex items-center gap-2 bg-[#E3342F] hover:bg-red-600 text-white px-4 py-2 rounded-lg font-bold text-sm shadow-sm transition-all hover:scale-[1.02]"
                      >
                        <XCircle size={16} />
                        <span>Batalkan Trip</span>
                      </button>
                    </div>
                  </motion.div>
                )}
              </motion.div>
            );
          })}

          {filteredTrips.length === 0 && (
            <div className="text-center py-16 bg-white border border-[#E2E8F0] rounded-xl shadow-sm text-gray-500 font-medium">
              Tidak ada perjalanan yang sedang aktif. Silakan tambahkan order baru!
            </div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

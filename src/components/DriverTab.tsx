/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Driver } from '../types';
import { Search, Plus, Trash2, Edit3, Check, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface DriverTabProps {
  driversList: Driver[];
  onAddDriver: (name: string, phoneNumber: string) => void;
  onUpdateDriver: (id: string, updated: Partial<Driver>) => void;
  onDeleteDriver: (id: string) => void;
}

export default function DriverTab({
  driversList,
  onAddDriver,
  onUpdateDriver,
  onDeleteDriver,
}: DriverTabProps) {
  const [newName, setNewName] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  // Editing state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editStatus, setEditStatus] = useState<Driver['status']>('Ready');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim() || !newPhone.trim()) return;
    onAddDriver(newName, newPhone);
    setNewName('');
    setNewPhone('');
  };

  const startEditing = (driver: Driver) => {
    setEditingId(driver.id);
    setEditName(driver.name);
    setEditPhone(driver.phoneNumber);
    setEditStatus(driver.status);
  };

  const saveEditing = (id: string) => {
    if (!editName.trim() || !editPhone.trim()) return;
    onUpdateDriver(id, {
      name: editName,
      phoneNumber: editPhone,
      status: editStatus,
    });
    setEditingId(null);
  };

  const filteredList = driversList.filter(
    (driver) =>
      driver.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      driver.phoneNumber.includes(searchQuery) ||
      driver.status.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div id="driver-tab-container" className="flex flex-col h-full space-y-4">
      {/* Input Header */}
      <form onSubmit={handleSubmit} className="flex gap-4 items-center">
        <input
          type="text"
          placeholder="Nama Driver"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          className="flex-1 px-4 py-3 bg-[#EAECEF] border border-[#CCCCCC] rounded-lg text-gray-800 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#2F2FE4]/30"
        />
        <input
          type="text"
          placeholder="Nomor Telepon / HP"
          value={newPhone}
          onChange={(e) => setNewPhone(e.target.value)}
          className="flex-1 px-4 py-3 bg-[#EAECEF] border border-[#CCCCCC] rounded-lg text-gray-800 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#2F2FE4]/30"
        />
        <button
          type="submit"
          className="px-6 py-3 bg-[#2F2FE4] hover:bg-[#2020D0] text-white rounded-lg transition-colors flex items-center justify-center font-bold"
        >
          <Plus size={24} />
        </button>
      </form>

      {/* Search Input */}
      <div className="relative">
        <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-500">
          <Search size={20} />
        </span>
        <input
          type="text"
          placeholder="Search Driver"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-2 bg-[#EAECEF] border border-[#CCCCCC] rounded-lg text-gray-800 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#2F2FE4]/30"
        />
      </div>

      {/* Drivers List Card */}
      <div id="drivers-list-card" className="flex-1 bg-[#EAECEF]/40 border border-[#D5D8DC] rounded-xl p-6 overflow-y-auto shadow-sm">
        <div className="space-y-4">
          <AnimatePresence initial={false}>
            {filteredList.map((driver) => (
              <motion.div
                key={driver.id}
                layout
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-white border border-[#E2E8F0] rounded-lg p-4 flex items-center justify-between shadow-sm hover:shadow-md transition-shadow"
              >
                {editingId === driver.id ? (
                  <div className="flex-1 flex flex-wrap gap-3 items-center mr-4">
                    <input
                      type="text"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      className="px-3 py-1.5 border border-[#CCCCCC] rounded-md text-gray-800 font-semibold focus:outline-none flex-1 min-w-[120px]"
                    />
                    <input
                      type="text"
                      value={editPhone}
                      onChange={(e) => setEditPhone(e.target.value)}
                      className="px-3 py-1.5 border border-[#CCCCCC] rounded-md text-gray-800 focus:outline-none w-48"
                    />
                    <select
                      value={editStatus}
                      onChange={(e) => setEditStatus(e.target.value as Driver['status'])}
                      className="px-3 py-1.5 border border-[#CCCCCC] rounded-md text-gray-800 focus:outline-none"
                    >
                      <option value="Ready">Ready</option>
                      <option value="Dalam Perjalanan">Dalam Perjalanan</option>
                    </select>
                  </div>
                ) : (
                  <div className="flex-1 flex items-center">
                    <div className="w-1/3 font-bold text-gray-800 text-base">
                      {driver.name}
                    </div>
                    <div className="w-1/3 text-gray-600 font-medium">
                      {driver.phoneNumber}
                    </div>
                    <div className="w-1/3 flex justify-start">
                      <span
                        className={`px-6 py-1.5 rounded-full text-xs font-semibold text-white inline-block text-center min-w-[100px] ${
                          driver.status === 'Ready'
                            ? 'bg-[#38C172]' // Green
                            : 'bg-[#3490DC]' // Blue (Dalam Perjalanan)
                        }`}
                      >
                        {driver.status === 'Ready' ? 'Ready' : 'Dalam Perjalanan'}
                      </span>
                    </div>
                  </div>
                )}

                {/* Actions */}
                <div className="flex items-center gap-3">
                  {editingId === driver.id ? (
                    <>
                      <button
                        onClick={() => saveEditing(driver.id)}
                        className="p-2 text-green-600 hover:bg-green-50 rounded-full transition-colors"
                      >
                        <Check size={20} />
                      </button>
                      <button
                        onClick={() => setEditingId(null)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-full transition-colors"
                      >
                        <X size={20} />
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        onClick={() => startEditing(driver)}
                        className="p-2 text-[#38C172] hover:bg-green-50 rounded-lg border border-transparent hover:border-[#38C172]/30 transition-all"
                      >
                        <Edit3 size={20} />
                      </button>
                      <button
                        onClick={() => onDeleteDriver(driver.id)}
                        disabled={driver.status === 'Dalam Perjalanan'}
                        className={`p-2 rounded-lg border border-transparent transition-all ${
                          driver.status === 'Dalam Perjalanan'
                            ? 'text-gray-300 cursor-not-allowed'
                            : 'text-[#E3342F] hover:bg-red-50 hover:border-[#E3342F]/30'
                        }`}
                        title={driver.status === 'Dalam Perjalanan' ? 'Driver sedang dalam tugas' : 'Hapus driver'}
                      >
                        <Trash2 size={20} />
                      </button>
                    </>
                  )}
                </div>
              </motion.div>
            ))}

            {filteredList.length === 0 && (
              <div className="text-center py-12 text-gray-500 font-medium">
                Tidak ada driver ditemukan.
              </div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Driver, Armada, Order, MaintenanceRecord } from '../types';
import { Trash2, Plus, ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import StatusBadge from './StatusBadge';

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
  const [revenue, setRevenue] = useState('');
  const [operationalCost, setOperationalCost] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);

  // Available drivers and armadas (not in maintenance or trip)
  const availableDrivers = driversList.filter((d) => d.status === 'Ready');
  const availableArmada = armadaList.filter((a) => a.status === 'Ready');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!selectedDriverId || !selectedArmadaId || !departureDate || !returnDate) {
      setErrorMsg('Mohon lengkapi semua field yang wajib diisi');
      return;
    }

    if (returnDate < departureDate) {
      setErrorMsg('Tanggal kembali tidak boleh lebih awal dari tanggal berangkat');
      return;
    }

    const selectedDriver = driversList.find((d) => d.id === selectedDriverId);
    const selectedArmada = armadaList.find((a) => a.id === selectedArmadaId);

    if (selectedDriver && selectedArmada) {
      const origin = routes[0] || 'Titik Awal';
      const destination = routes[routes.length - 1] || 'Tujuan';

      onAddOrder({
        driverId: selectedDriver.id,
        driverName: selectedDriver.name,
        armadaId: selectedArmada.id,
        plateNumber: selectedArmada.plateNumber,
        carType: selectedArmada.carType,
        departureDate,
        departureTime: departureTime || '08:00',
        returnDate,
        returnTime: returnTime || '17:00',
        origin,
        destination,
        routes: routes.filter((r) => r.trim() !== ''),
        revenue: parseFloat(revenue) || 0,
        operationalCost: parseFloat(operationalCost) || 0,
      });

      // Reset form
      setSelectedDriverId('');
      setSelectedArmadaId('');
      setDepartureDate('');
      setDepartureTime('');
      setReturnDate('');
      setReturnTime('');
      setRoutes(['', '']);
      setRevenue('');
      setOperationalCost('');
    }
  };

  const activeOrders = ordersList.filter((o) => o.status === 'Dalam Perjalanan');

  return (
    <div className="flex flex-col h-full gap-6">
      {/* Form Section */}
      <div className="card">
        <h3 className="text-heading mb-4">Buat Order Baru</h3>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Driver Selection */}
            <div>
              <label className="text-label block mb-2">Driver</label>
              <select
                value={selectedDriverId}
                onChange={(e) => setSelectedDriverId(e.target.value)}
                className="input-field"
                required
              >
                <option value="">Pilih Driver</option>
                {availableDrivers.map((driver) => (
                  <option key={driver.id} value={driver.id}>
                    {driver.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Armada Selection */}
            <div>
              <label className="text-label block mb-2">Armada</label>
              <select
                value={selectedArmadaId}
                onChange={(e) => setSelectedArmadaId(e.target.value)}
                className="input-field"
                required
              >
                <option value="">Pilih Armada</option>
                {availableArmada.map((armada) => (
                  <option key={armada.id} value={armada.id}>
                    {armada.plateNumber} - {armada.carType}
                  </option>
                ))}
              </select>
            </div>

            {/* Departure Date */}
            <div>
              <label className="text-label block mb-2">Tanggal Berangkat</label>
              <input
                type="date"
                value={departureDate}
                onChange={(e) => setDepartureDate(e.target.value)}
                className="input-field"
                required
              />
            </div>

            {/* Return Date */}
            <div>
              <label className="text-label block mb-2">Tanggal Kembali</label>
              <input
                type="date"
                value={returnDate}
                onChange={(e) => setReturnDate(e.target.value)}
                className="input-field"
                required
              />
            </div>

            {/* Origin */}
            <div>
              <label className="text-label block mb-2">Dari</label>
              <input
                type="text"
                placeholder="Kota asal"
                value={routes[0]}
                onChange={(e) => {
                  const newRoutes = [...routes];
                  newRoutes[0] = e.target.value;
                  setRoutes(newRoutes);
                }}
                className="input-field"
              />
            </div>

            {/* Destination */}
            <div>
              <label className="text-label block mb-2">Ke</label>
              <input
                type="text"
                placeholder="Kota tujuan"
                value={routes[1]}
                onChange={(e) => {
                  const newRoutes = [...routes];
                  newRoutes[1] = e.target.value;
                  setRoutes(newRoutes);
                }}
                className="input-field"
              />
            </div>
          </div>

          {errorMsg && (
            <div className="text-caption text-red-600 bg-red-50 border border-red-200 rounded-lg p-3">
              {errorMsg}
            </div>
          )}

          <div className="flex justify-end">
            <button type="submit" className="btn btn-success">
              <Plus size={18} />
              <span>Tambah Order</span>
            </button>
          </div>
        </form>
      </div>

      {/* Orders List */}
      <div className="flex-1 min-h-0 flex flex-col">
        <h3 className="text-heading mb-4">Order Aktif ({activeOrders.length})</h3>

        <div className="flex-1 overflow-y-auto space-y-3">
          {activeOrders.length === 0 ? (
            <div className="card text-center py-12">
              <p className="text-body text-gray-400">Belum ada order aktif</p>
            </div>
          ) : (
            activeOrders.map((order) => {
              const isExpanded = expandedOrderId === order.id;

              return (
                <motion.div
                  key={order.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="card card-hover"
                >
                  {/* Main Info - Always Visible */}
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="text-subheading">{order.driverName}</span>
                        <StatusBadge status={order.status} size="sm" />
                      </div>
                      <div className="text-caption">
                        {order.plateNumber} • {order.origin} → {order.destination}
                      </div>
                      <div className="text-caption mt-1">
                        {order.departureDate} - {order.returnDate}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setExpandedOrderId(isExpanded ? null : order.id)}
                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                      >
                        <ChevronDown
                          size={20}
                          className={`transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                        />
                      </button>
                      <button onClick={() => onCancelOrder(order.id)} className="btn btn-danger">
                        <Trash2 size={16} />
                        <span>Batalkan</span>
                      </button>
                    </div>
                  </div>

                  {/* Expanded Details */}
                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden"
                      >
                        <div className="mt-4 pt-4 border-t border-gray-200 space-y-2">
                          <div className="grid grid-cols-2 gap-4 text-caption">
                            <div>
                              <span className="text-label">Waktu Berangkat:</span>
                              <p>{order.departureTime || '-'}</p>
                            </div>
                            <div>
                              <span className="text-label">Waktu Kembali:</span>
                              <p>{order.returnTime || '-'}</p>
                            </div>
                            <div>
                              <span className="text-label">Pendapatan:</span>
                              <p>Rp {order.revenue?.toLocaleString('id-ID') || 0}</p>
                            </div>
                            <div>
                              <span className="text-label">Biaya Operasional:</span>
                              <p>Rp {order.operationalCost?.toLocaleString('id-ID') || 0}</p>
                            </div>
                          </div>
                          {order.routes && order.routes.length > 2 && (
                            <div>
                              <span className="text-label">Rute:</span>
                              <p className="text-caption">{order.routes.join(' → ')}</p>
                            </div>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}

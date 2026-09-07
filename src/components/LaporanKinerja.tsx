/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Driver, Armada, TripHistory, Order } from '../types';
import { Users, Truck, TrendingUp, Award, Activity } from 'lucide-react';
import StatusBadge from './StatusBadge';

interface LaporanKinerjaProps {
  driversList: Driver[];
  armadaList: Armada[];
  historyList: TripHistory[];
  ordersList: Order[];
}

export default function LaporanKinerja({
  driversList,
  armadaList,
  historyList,
  ordersList,
}: LaporanKinerjaProps) {
  // Calculate driver performance
  const driverPerformance = driversList.map((driver) => {
    const completedTrips = historyList.filter(
      (h) => h.driverName === driver.name && h.status === 'Selesai'
    ).length;
    
    const canceledTrips = historyList.filter(
      (h) => h.driverName === driver.name && h.status === 'Dibatalkan'
    ).length;

    const totalRevenue = historyList
      .filter((h) => h.driverName === driver.name && h.status === 'Selesai')
      .reduce((sum, h) => sum + (h.revenue || 0), 0);

    return {
      ...driver,
      completedTrips,
      canceledTrips,
      totalRevenue,
    };
  }).sort((a, b) => b.completedTrips - a.completedTrips);

  // Calculate armada performance
  const armadaPerformance = armadaList.map((armada) => {
    const completedTrips = historyList.filter(
      (h) => h.plateNumber === armada.plateNumber && h.status === 'Selesai'
    ).length;

    const totalRevenue = historyList
      .filter((h) => h.plateNumber === armada.plateNumber && h.status === 'Selesai')
      .reduce((sum, h) => sum + (h.revenue || 0), 0);

    return {
      ...armada,
      completedTrips,
      totalRevenue,
    };
  }).sort((a, b) => b.completedTrips - a.completedTrips);

  // Overall stats
  const totalDrivers = driversList.length;
  const activeDrivers = driversList.filter((d) => d.status === 'Dalam Perjalanan').length;
  const totalArmada = armadaList.length;
  const activeArmada = armadaList.filter((a) => a.status === 'Dalam Perjalanan').length;

  return (
    <div className="flex flex-col h-full gap-6 overflow-y-auto pb-8 pr-1">
      {/* Header */}
      <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm">
        <h2 className="text-lg font-black text-gray-800">Laporan Kinerja & Log Aktivitas</h2>
        <p className="text-xs text-gray-500 font-semibold mt-0.5">Performa driver dan armada, serta log aktivitas terkini</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="card">
          <div className="flex items-center justify-between mb-2">
            <span className="text-label">Total Driver</span>
            <Users size={18} className="text-blue-600" />
          </div>
          <div className="text-heading text-2xl font-bold">{totalDrivers}</div>
          <div className="text-caption mt-1">{activeDrivers} bertugas</div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between mb-2">
            <span className="text-label">Total Armada</span>
            <Truck size={18} className="text-green-600" />
          </div>
          <div className="text-heading text-2xl font-bold">{totalArmada}</div>
          <div className="text-caption mt-1">{activeArmada} beroperasi</div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between mb-2">
            <span className="text-label">Total Trip</span>
            <Activity size={18} className="text-purple-600" />
          </div>
          <div className="text-heading text-2xl font-bold">{historyList.length}</div>
          <div className="text-caption mt-1">Selesai & dibatalkan</div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between mb-2">
            <span className="text-label">Avg Trip/Driver</span>
            <TrendingUp size={18} className="text-amber-600" />
          </div>
          <div className="text-heading text-2xl font-bold">
            {totalDrivers > 0 ? Math.round(historyList.length / totalDrivers) : 0}
          </div>
          <div className="text-caption mt-1">Per driver</div>
        </div>
      </div>

      {/* Driver Performance */}
      <div className="space-y-3">
        <h3 className="text-heading flex items-center gap-2">
          <Award size={20} className="text-blue-600" />
          <span>Performa Driver</span>
        </h3>
        
        {driverPerformance.length === 0 ? (
          <div className="card text-center py-8">
            <p className="text-body text-gray-400">Belum ada data driver</p>
          </div>
        ) : (
          driverPerformance.map((driver, index) => (
            <div key={driver.id} className="card card-hover">
              <div className="flex items-center gap-4">
                {/* Ranking */}
                <div className={`flex items-center justify-center w-12 h-12 rounded-full font-bold ${
                  index === 0 ? 'bg-yellow-100 text-yellow-700' :
                  index === 1 ? 'bg-gray-100 text-gray-700' :
                  index === 2 ? 'bg-orange-100 text-orange-700' :
                  'bg-gray-50 text-gray-500'
                }`}>
                  #{index + 1}
                </div>

                {/* Driver Info */}
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-1">
                    <span className="text-subheading">{driver.name}</span>
                    <StatusBadge status={driver.status} size="sm" />
                  </div>
                  <div className="text-caption">{driver.phoneNumber}</div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <div className="text-label">Trip Selesai</div>
                    <div className="text-heading text-xl font-bold text-green-600">
                      {driver.completedTrips}
                    </div>
                  </div>
                  <div>
                    <div className="text-label">Dibatalkan</div>
                    <div className="text-heading text-xl font-bold text-red-600">
                      {driver.canceledTrips}
                    </div>
                  </div>
                  <div>
                    <div className="text-label">Revenue</div>
                    <div className="text-heading text-sm font-bold text-blue-600">
                      Rp {(driver.totalRevenue / 1000000).toFixed(1)}jt
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Armada Performance */}
      <div className="space-y-3">
        <h3 className="text-heading flex items-center gap-2">
          <Truck size={20} className="text-green-600" />
          <span>Performa Armada</span>
        </h3>
        
        {armadaPerformance.length === 0 ? (
          <div className="card text-center py-8">
            <p className="text-body text-gray-400">Belum ada data armada</p>
          </div>
        ) : (
          armadaPerformance.map((armada, index) => (
            <div key={armada.id} className="card card-hover">
              <div className="flex items-center gap-4">
                {/* Ranking */}
                <div className={`flex items-center justify-center w-12 h-12 rounded-full font-bold ${
                  index === 0 ? 'bg-yellow-100 text-yellow-700' :
                  index === 1 ? 'bg-gray-100 text-gray-700' :
                  index === 2 ? 'bg-orange-100 text-orange-700' :
                  'bg-gray-50 text-gray-500'
                }`}>
                  #{index + 1}
                </div>

                {/* Armada Info */}
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-1">
                    <span className="text-subheading">{armada.plateNumber}</span>
                    <StatusBadge status={armada.status} size="sm" />
                  </div>
                  <div className="text-caption">{armada.carType}</div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 gap-4 text-center">
                  <div>
                    <div className="text-label">Trip Selesai</div>
                    <div className="text-heading text-xl font-bold text-green-600">
                      {armada.completedTrips}
                    </div>
                  </div>
                  <div>
                    <div className="text-label">Revenue</div>
                    <div className="text-heading text-sm font-bold text-blue-600">
                      Rp {(armada.totalRevenue / 1000000).toFixed(1)}jt
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Recent Log */}
      <div className="space-y-3">
        <h3 className="text-heading">Log Aktivitas Terkini</h3>
        {historyList.length === 0 ? (
          <div className="card text-center py-8">
            <p className="text-body text-gray-400">Belum ada aktivitas</p>
          </div>
        ) : (
          historyList.slice(0, 3).map((trip) => (
            <div key={trip.id} className="card">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="text-subheading">{trip.driverName}</div>
                  <div className="text-caption mt-1">
                    {trip.plateNumber} • {trip.origin} → {trip.destination}
                  </div>
                  <div className="text-caption mt-1 text-gray-500">
                    {trip.departureDate} - Selesai
                  </div>
                </div>
                <StatusBadge status={trip.status} size="sm" />
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

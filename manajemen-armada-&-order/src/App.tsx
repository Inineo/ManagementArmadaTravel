/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import ArmadaTab from './components/ArmadaTab';
import DriverTab from './components/DriverTab';
import OrderTab from './components/OrderTab';
import StatusTab from './components/StatusTab';
import LaporanTab from './components/LaporanTab';
import DetailPerjalanan from './components/DetailPerjalanan';
import PerbaikanTab from './components/PerbaikanTab';
import AjkTab from './components/AjkTab';
import { TabType, Armada, Driver, Order, TripHistory, MaintenanceRecord, AjkSchedule, AjkInvoice } from './types';
import { motion, AnimatePresence } from 'motion/react';
import { Shield, HelpCircle, Truck, Info } from 'lucide-react';

// Default mock data to populate the app initially if localStorage is empty
const INITIAL_ARMADA: Armada[] = [
  { id: 'armada-1', plateNumber: 'B 1234 XYZ', carType: 'Toyota HiAce', status: 'Ready' },
  { id: 'armada-2', plateNumber: 'B 5678 AB', carType: 'Toyota HiAce', status: 'Ready' },
  { id: 'armada-3', plateNumber: 'DK 9999 CD', carType: 'Toyota HiAce', status: 'Di Perbaiki' },
];

const INITIAL_DRIVERS: Driver[] = [
  { id: 'driver-1', name: 'Agus', phoneNumber: '0812-3456-7890', status: 'Ready' },
  { id: 'driver-2', name: 'Budi', phoneNumber: '0812-9876-5432', status: 'Ready' },
  { id: 'driver-3', name: 'Siti', phoneNumber: '0813-1122-3344', status: 'Ready' },
  { id: 'driver-4', name: 'Dedi', phoneNumber: '0811-5566-7788', status: 'Ready' },
];

const INITIAL_ORDERS: Order[] = [
  {
    id: 'order-1',
    driverId: 'driver-1',
    driverName: 'Agus',
    armadaId: 'armada-1',
    plateNumber: 'B 1234 XYZ',
    carType: 'Toyota HiAce',
    departureDate: '2026-06-30',
    departureTime: '08:00',
    returnDate: '2026-07-02',
    returnTime: '17:00',
    origin: 'Jogja',
    destination: 'Bali',
    routes: ['Jogja', 'Solo', 'Banyuwangi', 'Bali'],
    status: 'Dalam Perjalanan',
    revenue: 4500000,
    operationalCost: 1200000,
  }
];

const INITIAL_HISTORY: TripHistory[] = [
  {
    id: 'hist-1',
    driverName: 'Budi',
    plateNumber: 'B 5678 AB',
    carType: 'Toyota HiAce',
    departureDate: '2026-06-28',
    departureTime: '10:00',
    returnDate: '2026-06-28',
    returnTime: '14:30',
    origin: 'Jakarta',
    destination: 'Bandung',
    routes: ['Jakarta', 'Cikampek', 'Bandung'],
    status: 'Selesai',
    completedAt: '2026-06-28T14:30:00Z',
    revenue: 3500000,
    operationalCost: 900000,
  },
  {
    id: 'hist-2',
    driverName: 'Dedi',
    plateNumber: 'B 1234 XYZ',
    carType: 'Toyota HiAce',
    departureDate: '2026-06-29',
    departureTime: '13:00',
    returnDate: '2026-06-29',
    returnTime: '13:45',
    origin: 'Surabaya',
    destination: 'Malang',
    routes: ['Surabaya', 'Sidoarjo', 'Malang'],
    status: 'Dibatalkan',
    completedAt: '2026-06-29T13:45:00Z',
    revenue: 2000000,
    operationalCost: 500000,
  }
];

const INITIAL_MAINTENANCE: MaintenanceRecord[] = [
  {
    id: 'maint-1',
    armadaId: 'armada-3',
    plateNumber: 'DK 9999 CD',
    carType: 'Toyota HiAce',
    damages: [
      { id: 'dmg-1', description: 'Servis Radiator', status: 'Menunggu', cost: 700000 },
      { id: 'dmg-2', description: 'Ganti Oli Mesin', status: 'Selesai', cost: 500000 }
    ],
    totalCost: 1200000,
    date: '2026-06-25',
    status: 'Dalam Perbaikan',
  },
  {
    id: 'maint-2',
    armadaId: 'armada-1',
    plateNumber: 'B 1234 XYZ',
    carType: 'Toyota HiAce',
    damages: [
      { id: 'dmg-3', description: 'Ganti Kampas Rem', status: 'Selesai', cost: 500000 },
      { id: 'dmg-4', description: 'Tune Up', status: 'Selesai', cost: 350000 }
    ],
    totalCost: 850000,
    date: '2026-06-28',
    status: 'Selesai',
    completedAt: '2026-06-29T10:00:00Z',
  }
];

const INITIAL_AJK: AjkSchedule[] = [
  {
    id: 'ajk-1',
    routeName: 'Antar Jemput BCA Sudirman',
    driverId: 'driver-2',
    driverName: 'Budi',
    armadaId: 'armada-2',
    plateNumber: 'B 5678 AB',
    carType: 'Toyota HiAce',
    days: ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat'],
    pickupPoint: 'Bekasi Barat (Dekat Metmall)',
    officeDestination: 'Menara BCA Grand Indonesia, Jakarta Pusat',
    routes: ['Bekasi Barat (Dekat Metmall)', 'Pintu Tol Bekasi Barat', 'Cawang', 'Kuningan', 'Menara BCA Grand Indonesia, Jakarta Pusat'],
    routeStops: [
      { stopName: 'Bekasi Barat (Dekat Metmall)', time: '06:15' },
      { stopName: 'Pintu Tol Bekasi Barat', time: '06:30' },
      { stopName: 'Cawang (Titik Transit)', time: '07:00' },
      { stopName: 'Kuningan (Titik Penurunan)', time: '07:30' },
      { stopName: 'Menara BCA Grand Indonesia, Jakarta Pusat', time: '08:00' }
    ],
    passengerCount: 12,
    status: 'Aktif',
  },
  {
    id: 'ajk-2',
    routeName: 'Jemputan Mandiri Gatot Subroto',
    driverId: 'driver-3',
    driverName: 'Siti',
    armadaId: 'armada-1',
    plateNumber: 'B 1234 XYZ',
    carType: 'Toyota HiAce',
    days: ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat'],
    pickupPoint: 'Depok Margonda (Stasiun)',
    officeDestination: 'Plaza Mandiri Gatot Subroto, Jakarta Selatan',
    routes: ['Depok Margonda (Stasiun)', 'Lenteng Agung', 'Pasar Minggu', 'Plaza Mandiri Gatot Subroto, Jakarta Selatan'],
    routeStops: [
      { stopName: 'Depok Margonda (Stasiun)', time: '06:30' },
      { stopName: 'Lenteng Agung (Titik Transit)', time: '06:50' },
      { stopName: 'Pasar Minggu (Titik Transit)', time: '07:10' },
      { stopName: 'Plaza Mandiri Gatot Subroto, Jakarta Selatan', time: '07:45' }
    ],
    passengerCount: 14,
    status: 'Aktif',
  }
];

const INITIAL_AJK_INVOICES: AjkInvoice[] = [
  {
    id: 'inv-1',
    companyName: 'PT Bank BCA Tbk',
    invoiceNumber: 'INV/AJK/2026/04-001',
    billingMonth: 'April 2026',
    amount: 15000000,
    status: 'Lunas',
    dueDate: '2026-05-15',
    paymentDate: '2026-05-10',
    delinquentMonths: 0,
    notes: 'Pembayaran lancar tepat waktu via transfer bank'
  },
  {
    id: 'inv-2',
    companyName: 'PT Bank Mandiri Tbk',
    invoiceNumber: 'INV/AJK/2026/04-002',
    billingMonth: 'April 2026',
    amount: 18000000,
    status: 'Menunggak',
    dueDate: '2026-05-15',
    delinquentMonths: 2,
    notes: 'Menunggu persetujuan klaim dari Procurement Pusat'
  },
  {
    id: 'inv-3',
    companyName: 'PT Astra International Tbk',
    invoiceNumber: 'INV/AJK/2026/03-010',
    billingMonth: 'Maret 2026',
    amount: 12500000,
    status: 'Menunggak',
    dueDate: '2026-04-15',
    delinquentMonths: 3,
    notes: 'Menunggak 3 bulan+. Surat Peringatan (SP-1) penagihan resmi telah dilayangkan'
  },
  {
    id: 'inv-4',
    companyName: 'PT Astra International Tbk',
    invoiceNumber: 'INV/AJK/2026/04-010',
    billingMonth: 'April 2026',
    amount: 12500000,
    status: 'Menunggak',
    dueDate: '2026-05-15',
    delinquentMonths: 2,
    notes: 'Menunggak 2 bulan. Proses verifikasi lembar kehadiran (timesheet)'
  },
  {
    id: 'inv-5',
    companyName: 'PT Bank Mandiri Tbk',
    invoiceNumber: 'INV/AJK/2026/05-002',
    billingMonth: 'Mei 2026',
    amount: 18000000,
    status: 'Menunggak',
    dueDate: '2026-06-15',
    delinquentMonths: 1,
    notes: 'Klaim invoice baru diajukan ke bagian keuangan'
  }
];

export default function App() {
  const [activeTab, setActiveTab] = useState<TabType>('order');
  const [selectedOrderDetail, setSelectedOrderDetail] = useState<Order | null>(null);

  // Load from LocalStorage or fallback to mock data
  const [armadaList, setArmadaList] = useState<Armada[]>(() => {
    const saved = localStorage.getItem('fleet_armada');
    return saved ? JSON.parse(saved) : INITIAL_ARMADA;
  });

  const [driversList, setDriversList] = useState<Driver[]>(() => {
    const saved = localStorage.getItem('fleet_drivers');
    return saved ? JSON.parse(saved) : INITIAL_DRIVERS;
  });

  const [ordersList, setOrdersList] = useState<Order[]>(() => {
    const saved = localStorage.getItem('fleet_orders');
    return saved ? JSON.parse(saved) : INITIAL_ORDERS;
  });

  const [historyList, setHistoryList] = useState<TripHistory[]>(() => {
    const saved = localStorage.getItem('fleet_history');
    return saved ? JSON.parse(saved) : INITIAL_HISTORY;
  });

  const [maintenanceList, setMaintenanceList] = useState<MaintenanceRecord[]>(() => {
    const saved = localStorage.getItem('fleet_maintenance');
    return saved ? JSON.parse(saved) : INITIAL_MAINTENANCE;
  });

  const [ajkList, setAjkList] = useState<AjkSchedule[]>(() => {
    const saved = localStorage.getItem('fleet_ajk');
    return saved ? JSON.parse(saved) : INITIAL_AJK;
  });

  const [ajkInvoiceList, setAjkInvoiceList] = useState<AjkInvoice[]>(() => {
    const saved = localStorage.getItem('fleet_ajk_invoices');
    return saved ? JSON.parse(saved) : INITIAL_AJK_INVOICES;
  });

  // Keep drivers & armada status fully in sync with ordersList on initial load
  useEffect(() => {
    // If a driver or vehicle is assigned to an active order (status: 'Dalam Perjalanan'),
    // their status must be 'Dalam Perjalanan' as well.
    const activeOrders = ordersList.filter((o) => o.status === 'Dalam Perjalanan');
    
    setArmadaList((prev) =>
      prev.map((armada) => {
        const isActive = activeOrders.some((o) => o.armadaId === armada.id);
        if (isActive) {
          return { ...armada, status: 'Dalam Perjalanan' };
        } else if (armada.status === 'Dalam Perjalanan') {
          return { ...armada, status: 'Ready' };
        }
        return armada;
      })
    );

    setDriversList((prev) =>
      prev.map((driver) => {
        const isActive = activeOrders.some((o) => o.driverId === driver.id);
        if (isActive) {
          return { ...driver, status: 'Dalam Perjalanan' };
        } else if (driver.status === 'Dalam Perjalanan') {
          return { ...driver, status: 'Ready' };
        }
        return driver;
      })
    );
  }, []);

  // Save to LocalStorage on changes
  useEffect(() => {
    localStorage.setItem('fleet_armada', JSON.stringify(armadaList));
  }, [armadaList]);

  useEffect(() => {
    localStorage.setItem('fleet_drivers', JSON.stringify(driversList));
  }, [driversList]);

  useEffect(() => {
    localStorage.setItem('fleet_orders', JSON.stringify(ordersList));
  }, [ordersList]);

   useEffect(() => {
    localStorage.setItem('fleet_history', JSON.stringify(historyList));
  }, [historyList]);

  useEffect(() => {
    localStorage.setItem('fleet_maintenance', JSON.stringify(maintenanceList));
  }, [maintenanceList]);

  useEffect(() => {
    localStorage.setItem('fleet_ajk', JSON.stringify(ajkList));
  }, [ajkList]);

  useEffect(() => {
    localStorage.setItem('fleet_ajk_invoices', JSON.stringify(ajkInvoiceList));
  }, [ajkInvoiceList]);

  // Operations: AJK
  const handleAddAjk = (schedule: Omit<AjkSchedule, 'id'>) => {
    const newSchedule: AjkSchedule = {
      ...schedule,
      id: `ajk-${Date.now()}`,
    };
    setAjkList((prev) => [...prev, newSchedule]);
  };

  const handleUpdateAjk = (id: string, updated: Partial<AjkSchedule>) => {
    setAjkList((prev) =>
      prev.map((item) => (item.id === id ? { ...item, ...updated } : item))
    );
  };

  const handleDeleteAjk = (id: string) => {
    setAjkList((prev) => prev.filter((item) => item.id !== id));
  };

  // Operations: AJK Invoices
  const handleAddAjkInvoice = (invoice: Omit<AjkInvoice, 'id'>) => {
    const newInvoice: AjkInvoice = {
      ...invoice,
      id: `inv-${Date.now()}`,
    };
    setAjkInvoiceList((prev) => [newInvoice, ...prev]);
  };

  const handleUpdateAjkInvoice = (id: string, updated: Partial<AjkInvoice>) => {
    setAjkInvoiceList((prev) =>
      prev.map((item) => (item.id === id ? { ...item, ...updated } : item))
    );
  };

  const handleDeleteAjkInvoice = (id: string) => {
    setAjkInvoiceList((prev) => prev.filter((item) => item.id !== id));
  };

  // Operations: MAINTENANCE
  const handleAddMaintenance = (record: Omit<MaintenanceRecord, 'id'>) => {
    const newRecord: MaintenanceRecord = {
      ...record,
      id: `maint-${Date.now()}`,
    };
    setMaintenanceList((prev) => [...prev, newRecord]);
    
    // Auto-update status of Armada to "Di Perbaiki"
    setArmadaList((prev) =>
      prev.map((arm) =>
        arm.id === record.armadaId
          ? { ...arm, status: 'Di Perbaiki' }
          : arm
      )
    );
  };

  const handleResolveMaintenance = (recordId: string, damageId?: string, isAll?: boolean) => {
    setMaintenanceList((prev) => {
      const updatedList = prev.map((item) => {
        if (item.id !== recordId) return item;

        const currentDamages = item.damages || [];
        const newDamages = currentDamages.map((dmg) => {
          if (isAll) {
            return { ...dmg, status: 'Selesai' as const };
          }
          if (damageId && dmg.id === damageId) {
            return { ...dmg, status: 'Selesai' as const };
          }
          return dmg;
        });

        // Check if all damages are 'Selesai' now
        const allResolved = newDamages.every((d) => d.status === 'Selesai');
        const newRecordStatus = allResolved ? 'Selesai' : 'Dalam Perbaikan';
        const completedAt = allResolved ? new Date().toISOString() : undefined;

        return {
          ...item,
          damages: newDamages,
          status: newRecordStatus,
          completedAt,
        };
      });

      // If the record became Selesai, we also set the armada status to 'Ready'
      const targetRecord = updatedList.find((r) => r.id === recordId);
      if (targetRecord && targetRecord.status === 'Selesai') {
        setArmadaList((prevArmada) =>
          prevArmada.map((arm) =>
            arm.id === targetRecord.armadaId ? { ...arm, status: 'Ready' } : arm
          )
        );
      }

      return updatedList;
    });
  };

  const handleManualCompleteMaintenance = (armadaId: string) => {
    const activeRecord = maintenanceList.find((m) => m.armadaId === armadaId && m.status === 'Dalam Perbaikan');
    if (activeRecord) {
      handleResolveMaintenance(activeRecord.id, undefined, true);
    } else {
      setArmadaList((prev) =>
        prev.map((arm) => (arm.id === armadaId ? { ...arm, status: 'Ready' } : arm))
      );
    }
  };

  const handleDeleteMaintenance = (id: string) => {
    setMaintenanceList((prev) => prev.filter((item) => item.id !== id));
  };

  // Operations: ARMADA
  const handleAddArmada = (plateNumber: string, carType: string, extra?: Partial<Armada>) => {
    const newArmada: Armada = {
      id: `armada-${Date.now()}`,
      plateNumber,
      carType,
      status: 'Ready',
      ...extra,
    };
    setArmadaList((prev) => [...prev, newArmada]);
  };

  const handleUpdateArmada = (id: string, updated: Partial<Armada>) => {
    setArmadaList((prev) =>
      prev.map((item) => (item.id === id ? { ...item, ...updated } : item))
    );
  };

  const handleDeleteArmada = (id: string) => {
    setArmadaList((prev) => prev.filter((item) => item.id !== id));
  };

  // Operations: DRIVERS
  const handleAddDriver = (name: string, phoneNumber: string) => {
    const newDriver: Driver = {
      id: `driver-${Date.now()}`,
      name,
      phoneNumber,
      status: 'Ready',
    };
    setDriversList((prev) => [...prev, newDriver]);
  };

  const handleUpdateDriver = (id: string, updated: Partial<Driver>) => {
    setDriversList((prev) =>
      prev.map((item) => (item.id === id ? { ...item, ...updated } : item))
    );
  };

  const handleDeleteDriver = (id: string) => {
    setDriversList((prev) => prev.filter((item) => item.id !== id));
  };

  // Operations: ORDERS & TRIPS
  const handleAddOrder = (orderData: Omit<Order, 'id' | 'status'>) => {
    const newOrder: Order = {
      ...orderData,
      id: `order-${Date.now()}`,
      status: 'Dalam Perjalanan',
    };

    setOrdersList((prev) => [...prev, newOrder]);

    // Update statuses of assigned Driver & Vehicle to "Dalam Perjalanan"
    setArmadaList((prev) =>
      prev.map((armada) =>
        armada.id === orderData.armadaId ? { ...armada, status: 'Dalam Perjalanan' } : armada
      )
    );

    setDriversList((prev) =>
      prev.map((driver) =>
        driver.id === orderData.driverId ? { ...driver, status: 'Dalam Perjalanan' } : driver
      )
    );
  };

  const handleCancelOrder = (id: string) => {
    const order = ordersList.find((o) => o.id === id);
    if (!order) return;

    // Remove from active orders and append cancelled trip to history
    setOrdersList((prev) => prev.filter((o) => o.id !== id));

    const historyItem: TripHistory = {
      id: `hist-${Date.now()}`,
      driverName: order.driverName,
      plateNumber: order.plateNumber,
      carType: order.carType,
      departureDate: order.departureDate,
      departureTime: order.departureTime,
      returnDate: order.returnDate,
      returnTime: order.returnTime,
      origin: order.origin,
      destination: order.destination,
      routes: order.routes || [order.origin, order.destination],
      status: 'Dibatalkan',
      completedAt: new Date().toISOString(),
      revenue: order.revenue,
      operationalCost: order.operationalCost,
    };
    setHistoryList((prev) => [historyItem, ...prev]);

    // Release Driver & Armada back to "Ready" status
    setArmadaList((prev) =>
      prev.map((armada) =>
        armada.id === order.armadaId
          ? { ...armada, status: armada.status === 'Dalam Perjalanan' ? 'Ready' : armada.status }
          : armada
      )
    );

    setDriversList((prev) =>
      prev.map((driver) =>
        driver.id === order.driverId
          ? { ...driver, status: driver.status === 'Dalam Perjalanan' ? 'Ready' : driver.status }
          : driver
      )
    );
  };

  const handleCompleteOrder = (id: string) => {
    const order = ordersList.find((o) => o.id === id);
    if (!order) return;

    // Move from active orders to completed history log
    setOrdersList((prev) => prev.filter((o) => o.id !== id));

    const historyItem: TripHistory = {
      id: `hist-${Date.now()}`,
      driverName: order.driverName,
      plateNumber: order.plateNumber,
      carType: order.carType,
      departureDate: order.departureDate,
      departureTime: order.departureTime,
      returnDate: order.returnDate,
      returnTime: order.returnTime,
      origin: order.origin,
      destination: order.destination,
      routes: order.routes || [order.origin, order.destination],
      status: 'Selesai',
      completedAt: new Date().toISOString(),
      revenue: order.revenue,
      operationalCost: order.operationalCost,
    };
    setHistoryList((prev) => [historyItem, ...prev]);

    // Release Driver & Armada to "Ready"
    setArmadaList((prev) =>
      prev.map((armada) =>
        armada.id === order.armadaId
          ? { ...armada, status: armada.status === 'Dalam Perjalanan' ? 'Ready' : armada.status }
          : armada
      )
    );

    setDriversList((prev) =>
      prev.map((driver) =>
        driver.id === order.driverId
          ? { ...driver, status: driver.status === 'Dalam Perjalanan' ? 'Ready' : driver.status }
          : driver
      )
    );
  };

  const handleClearHistory = () => {
    if (confirm('Apakah Anda yakin ingin menghapus seluruh log riwayat perjalanan?')) {
      setHistoryList([]);
    }
  };

  // Render the current view based on selected tab
  const renderTabContent = () => {
    switch (activeTab) {
      case 'order':
        return (
          <OrderTab
            ordersList={ordersList}
            driversList={driversList}
            armadaList={armadaList}
            maintenanceList={maintenanceList}
            onAddOrder={handleAddOrder}
            onCancelOrder={handleCancelOrder}
          />
        );
      case 'ajk':
        return (
          <AjkTab
            ajkList={ajkList}
            driversList={driversList}
            armadaList={armadaList}
            onAddAjk={handleAddAjk}
            onUpdateAjk={handleUpdateAjk}
            onDeleteAjk={handleDeleteAjk}
            ajkInvoiceList={ajkInvoiceList}
            onAddAjkInvoice={handleAddAjkInvoice}
            onUpdateAjkInvoice={handleUpdateAjkInvoice}
            onDeleteAjkInvoice={handleDeleteAjkInvoice}
          />
        );
      case 'status':
        return (
          <StatusTab
            ordersList={ordersList}
            onCompleteOrder={handleCompleteOrder}
            onCancelOrder={handleCancelOrder}
            onViewDetail={setSelectedOrderDetail}
          />
        );
      case 'armada':
        return (
          <ArmadaTab
            armadaList={armadaList}
            maintenanceList={maintenanceList}
            onAddArmada={handleAddArmada}
            onUpdateArmada={handleUpdateArmada}
            onDeleteArmada={handleDeleteArmada}
            onResolveMaintenance={handleResolveMaintenance}
            onManualCompleteMaintenance={handleManualCompleteMaintenance}
          />
        );
      case 'driver':
        return (
          <DriverTab
            driversList={driversList}
            onAddDriver={handleAddDriver}
            onUpdateDriver={handleUpdateDriver}
            onDeleteDriver={handleDeleteDriver}
          />
        );
      case 'perbaikan':
        return (
          <PerbaikanTab
            maintenanceList={maintenanceList}
            armadaList={armadaList}
            onAddMaintenance={handleAddMaintenance}
            onDeleteMaintenance={handleDeleteMaintenance}
          />
        );
      case 'laporan':
        return (
          <LaporanTab
            ordersList={ordersList}
            driversList={driversList}
            armadaList={armadaList}
            historyList={historyList}
            maintenanceList={maintenanceList}
            ajkInvoiceList={ajkInvoiceList}
            onClearHistory={handleClearHistory}
          />
        );
      default:
        return null;
    }
  };

  if (selectedOrderDetail) {
    return (
      <div id="app-root-container" className="h-screen w-screen bg-[#F0F2F5] text-gray-800 overflow-hidden font-sans p-6 lg:p-8">
        <DetailPerjalanan
          order={selectedOrderDetail}
          onBack={() => setSelectedOrderDetail(null)}
          onCompleteOrder={handleCompleteOrder}
          onCancelOrder={handleCancelOrder}
        />
      </div>
    );
  }

  return (
    <div id="app-root-container" className="flex h-screen w-screen bg-[#F0F2F5] text-gray-800 overflow-hidden font-sans">
      {/* Sidebar navigation */}
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />

      {/* Main Workspace Frame */}
      <div id="workspace-container" className="flex-1 flex flex-col min-w-0 h-full p-6 lg:p-8">
        
        {/* Top Header Panel */}
        <div id="workspace-header" className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-black text-gray-900 tracking-tight flex items-center gap-2">
              <Truck className="text-[#2F2FE4]" size={28} />
              <span>Sistem Manajemen Armada & Booking</span>
            </h1>
            <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mt-1">
              Dashboard Operasional Transportasi
            </p>
          </div>
          
          <div className="flex items-center gap-2 text-xs bg-white py-2 px-4 rounded-full shadow-sm border border-gray-200 text-gray-600 font-semibold">
            <Info size={14} className="text-[#2F2FE4]" />
            <span>Mode Demo Aktif (Data Tersimpan di Browser)</span>
          </div>
        </div>

        {/* Tab View Canvas */}
        <div id="tab-canvas" className="flex-1 min-h-0 bg-white border border-[#E2E8F0] rounded-2xl p-6 shadow-sm overflow-hidden flex flex-col justify-between">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.18 }}
              className="flex-1 min-h-0 h-full"
            >
              {renderTabContent()}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Workspace Footer Info */}
        <div id="workspace-footer" className="mt-4 flex justify-between items-center text-[11px] font-bold text-gray-400 tracking-wider">
          <div className="flex items-center gap-1">
            <Shield size={12} />
            <span>SECURE FLEET CONTROLLER</span>
          </div>
          <div>
            <span>VERSID 1.1.0 &copy; 2026</span>
          </div>
        </div>
      </div>
    </div>
  );
}

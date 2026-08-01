/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { TabType } from '../types';
import { ClipboardList, Navigation, Truck, Users, BarChart3, User, Wrench, Building2 } from 'lucide-react';
import { motion } from 'motion/react';

interface SidebarProps {
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;
}

export default function Sidebar({ activeTab, setActiveTab }: SidebarProps) {
  const menuItems = [
    { id: 'order' as TabType, label: 'Order', icon: ClipboardList },
    { id: 'ajk' as TabType, label: 'Jadwal AJK', icon: Building2 },
    { id: 'status' as TabType, label: 'Status', icon: Navigation },
    { id: 'armada' as TabType, label: 'Armada', icon: Truck },
    { id: 'driver' as TabType, label: 'Driver', icon: Users },
    { id: 'perbaikan' as TabType, label: 'Perbaikan', icon: Wrench },
    { id: 'laporan' as TabType, label: 'Laporan', icon: BarChart3 },
  ];

  return (
    <div id="sidebar-container" className="w-64 bg-[#EAECEF] h-full flex flex-col justify-between p-4 border-r border-[#D5D8DC]">
      <div className="flex flex-col gap-3">
        {menuItems.map((item) => {
          const isActive = activeTab === item.id;
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              id={`sidebar-tab-${item.id}`}
              onClick={() => setActiveTab(item.id)}
              className="relative w-full text-left focus:outline-none"
            >
              <div
                className={`flex items-center gap-4 py-3 px-5 rounded-lg text-white font-semibold transition-all duration-300 text-lg shadow-sm ${
                  isActive
                    ? 'bg-[#2F2FE4] ring-2 ring-[#5B5BFF]/30 scale-[1.02] shadow-md'
                    : 'bg-[#4343F0]/95 hover:bg-[#2F2FE4] hover:scale-[1.01]'
                }`}
              >
                <Icon size={22} className={isActive ? 'text-white' : 'text-white/90'} />
                <span>{item.label}</span>
                {isActive && (
                  <motion.div
                    layoutId="activeIndicator"
                    className="absolute left-1 top-3 bottom-3 w-1 bg-white rounded-full"
                    transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                  />
                )}
              </div>
            </button>
          );
        })}
      </div>

      <div id="sidebar-footer" className="mt-auto">
        <div className="flex items-center gap-4 py-4 px-6 rounded-lg bg-[#2F2FE4] text-white font-semibold text-lg shadow-md cursor-pointer hover:bg-[#2020D0] transition-colors">
          <div className="bg-white/20 p-1.5 rounded-full">
            <User size={24} className="text-white" />
          </div>
          <span>User</span>
        </div>
      </div>
    </div>
  );
}

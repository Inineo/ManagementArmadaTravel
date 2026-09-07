/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from 'react';
import { TabType } from '../types';
import { ClipboardList, Navigation, Truck, Users, BarChart3, User, Wrench, Building2, Settings, LogOut, ChevronUp, DollarSign } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface SidebarProps {
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;
}

export default function Sidebar({ activeTab, setActiveTab }: SidebarProps) {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };

    if (isDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isDropdownOpen]);

  const menuCategories = [
    {
      category: 'Operasional',
      items: [
        { id: 'order' as TabType, label: 'Order', icon: ClipboardList },
        { id: 'ajk' as TabType, label: 'Jadwal AJK', icon: Building2 },
        { id: 'status' as TabType, label: 'Status', icon: Navigation },
      ]
    },
    {
      category: 'Manajemen',
      items: [
        { id: 'armada' as TabType, label: 'Armada', icon: Truck },
        { id: 'driver' as TabType, label: 'Driver', icon: Users },
        { id: 'perbaikan' as TabType, label: 'Perbaikan', icon: Wrench },
      ]
    },
    {
      category: 'Laporan',
      items: [
        { id: 'laporan-ajk' as TabType, label: 'Laporan AJK & Invoice', icon: Building2 },
        { id: 'laporan-kinerja' as TabType, label: 'Laporan Kinerja & Log', icon: Users },
        { id: 'laporan-keuangan' as TabType, label: 'Laporan Keuangan', icon: DollarSign },
      ]
    }
  ];

  const userMenuItems = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'settings', label: 'Settings', icon: Settings },
    { id: 'logout', label: 'Logout', icon: LogOut },
  ];

  const handleUserMenuClick = (id: string) => {
    console.log(`${id} clicked`);
    setIsDropdownOpen(false);
    // Add your navigation/action logic here
  };

  return (
    <div id="sidebar-container" className="w-56 bg-[#EAECEF] h-full flex flex-col justify-between p-3 border-r border-[#D5D8DC]">
      <div className="flex flex-col gap-3.5 overflow-y-auto flex-1 pr-1 scrollbar-thin">
        {menuCategories.map((category, categoryIndex) => (
          <div key={category.category}>
            {/* Category Label */}
            <div className="px-2.5 mb-1.5 text-[10px] font-bold text-[#6B7280] uppercase tracking-wider">
              {category.category}
            </div>
            
            {/* Menu Items */}
            <div className="flex flex-col gap-1.5">
              {category.items.map((item) => {
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
                      className={`flex items-center gap-2.5 py-2.5 px-3.5 rounded-xl text-white font-semibold transition-all duration-300 text-sm shadow-sm ${
                        isActive
                          ? 'bg-[#2F2FE4] ring-2 ring-[#5B5BFF]/30 shadow-md'
                          : 'bg-[#4343F0]/95 hover:bg-[#2F2FE4]'
                      }`}
                    >
                      <Icon size={18} className={isActive ? 'text-white' : 'text-white/90'} />
                      <span className="truncate">{item.label}</span>
                      {isActive && (
                        <motion.div
                          layoutId="activeIndicator"
                          className="absolute left-1 top-2 bottom-2 w-1 bg-white rounded-full"
                          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                        />
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
            
            {/* Separator - only if not last category */}
            {categoryIndex < menuCategories.length - 1 && (
              <div className="mt-2.5 h-px bg-[#D5D8DC]" />
            )}
          </div>
        ))}
      </div>

      <div id="sidebar-footer" className="mt-auto relative" ref={dropdownRef}>
        {/* Dropdown Menu */}
        <AnimatePresence>
          {isDropdownOpen && (
            <motion.div
              initial={{ opacity: 0, x: -10, scale: 0.95 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: -10, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className="absolute bottom-0 left-full ml-2 w-48 bg-white rounded-lg shadow-2xl border border-[#D5D8DC] overflow-hidden z-50"
            >
              {userMenuItems.map((item, index) => {
                const Icon = item.icon;
                const isLogout = item.id === 'logout';
                return (
                  <button
                    key={item.id}
                    onClick={() => handleUserMenuClick(item.id)}
                    className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors ${
                      isLogout 
                        ? 'text-red-600 hover:bg-red-50' 
                        : 'text-[#374151] hover:bg-[#F3F4F6]'
                    } ${index !== userMenuItems.length - 1 ? 'border-b border-[#E5E7EB]' : ''}`}
                  >
                    <Icon size={18} />
                    <span className="font-medium">{item.label}</span>
                  </button>
                );
              })}
            </motion.div>
          )}
        </AnimatePresence>

        {/* User Button */}
        <button
          onClick={() => setIsDropdownOpen(!isDropdownOpen)}
          className="w-full flex items-center gap-2.5 py-2.5 px-3.5 rounded-xl bg-[#2F2FE4] text-white font-semibold text-sm shadow-md hover:bg-[#2020D0] transition-all focus:outline-none focus:ring-2 focus:ring-[#5B5BFF]/30"
        >
          <div className="bg-white/20 p-1 rounded-full">
            <User size={18} className="text-white" />
          </div>
          <span className="flex-1">Akun</span>
          <motion.div
            animate={{ rotate: isDropdownOpen ? 180 : 0 }}
            transition={{ duration: 0.2 }}
          >
            <ChevronUp size={16} />
          </motion.div>
        </button>
      </div>
    </div>
  );
}

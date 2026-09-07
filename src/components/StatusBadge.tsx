/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Circle } from 'lucide-react';

type StatusType = 
  | 'Ready' 
  | 'Dalam Perjalanan' 
  | 'Di Perbaiki' 
  | 'Aktif' 
  | 'Selesai' 
  | 'Dibatalkan'
  | 'Lunas'
  | 'Menunggak'
  | 'Dalam Perbaikan'
  | 'Menunggu';

interface StatusBadgeProps {
  status: StatusType | string;
  size?: 'sm' | 'md' | 'lg';
}

const statusConfig: Record<string, { bg: string; text: string; dot: string }> = {
  // Positive/Active States (Green)
  'Ready': { bg: 'bg-green-100', text: 'text-green-700', dot: 'text-green-500' },
  'Aktif': { bg: 'bg-green-100', text: 'text-green-700', dot: 'text-green-500' },
  'Selesai': { bg: 'bg-green-100', text: 'text-green-700', dot: 'text-green-500' },
  'Lunas': { bg: 'bg-green-100', text: 'text-green-700', dot: 'text-green-500' },
  
  // In Progress States (Yellow/Amber)
  'Dalam Perjalanan': { bg: 'bg-amber-100', text: 'text-amber-700', dot: 'text-amber-500' },
  'Di Perbaiki': { bg: 'bg-amber-100', text: 'text-amber-700', dot: 'text-amber-500' },
  'Dalam Perbaikan': { bg: 'bg-amber-100', text: 'text-amber-700', dot: 'text-amber-500' },
  'Menunggu': { bg: 'bg-amber-100', text: 'text-amber-700', dot: 'text-amber-500' },
  
  // Negative States (Red)
  'Dibatalkan': { bg: 'bg-red-100', text: 'text-red-700', dot: 'text-red-500' },
  'Menunggak': { bg: 'bg-red-100', text: 'text-red-700', dot: 'text-red-500' },
  
  // Default (Gray)
  'default': { bg: 'bg-gray-100', text: 'text-gray-700', dot: 'text-gray-500' },
};

const sizeConfig = {
  sm: { container: 'px-2 py-0.5 text-xs', dot: 8 },
  md: { container: 'px-3 py-1 text-sm', dot: 10 },
  lg: { container: 'px-4 py-1.5 text-base', dot: 12 },
};

export default function StatusBadge({ status, size = 'md' }: StatusBadgeProps) {
  const config = statusConfig[status] || statusConfig.default;
  const sizeStyle = sizeConfig[size];

  return (
    <span
      className={`inline-flex items-center gap-1.5 ${sizeStyle.container} ${config.bg} ${config.text} rounded-full font-semibold whitespace-nowrap`}
    >
      <Circle size={sizeStyle.dot} className={`${config.dot} fill-current`} />
      {status}
    </span>
  );
}

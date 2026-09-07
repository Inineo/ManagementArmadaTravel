/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { AnimatePresence } from 'motion/react';
import Toast, { ToastProps } from './Toast';

interface ToastContainerProps {
  toasts: Omit<ToastProps, 'onClose'>[];
  onClose: (id: string) => void;
}

export default function ToastContainer({ toasts, onClose }: ToastContainerProps) {
  return (
    <div className="fixed top-6 right-6 z-[9999] flex flex-col gap-3">
      <AnimatePresence>
        {toasts.map((toast) => (
          <Toast key={toast.id} {...toast} onClose={onClose} />
        ))}
      </AnimatePresence>
    </div>
  );
}

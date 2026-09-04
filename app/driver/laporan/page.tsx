'use client';

/**
 * /driver/laporan — Halaman upload foto laporan untuk driver
 * Diakses oleh driver dari device/tab mereka sendiri.
 * Admin tidak perlu mengakses halaman ini.
 */

import React, { useState, useRef, useCallback } from 'react';
import { Upload, X, CheckCircle, AlertCircle, Camera, Loader2, ImageIcon } from 'lucide-react';

interface UploadedPhoto {
  id: string;
  url: string;
  filename: string;
  compressedSizeKB: number;
  originalSizeKB: number;
  compressionRatio: string;
}

interface PreviewFile {
  file: File;
  previewUrl: string;
  name: string;
  sizeKB: number;
}

export default function LaporanDriverPage() {
  const [tripId, setTripId] = useState('');
  const [driverName, setDriverName] = useState('');
  const [previews, setPreviews] = useState<PreviewFile[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState<UploadedPhoto[] | null>(null);
  const [error, setError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = useCallback((files: FileList | null) => {
    if (!files) return;
    setError('');
    setUploadResult(null);

    const newPreviews: PreviewFile[] = [];
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

    for (const file of Array.from(files)) {
      if (!allowedTypes.includes(file.type)) {
        setError(`File "${file.name}" tidak didukung. Gunakan JPEG, PNG, atau WebP.`);
        return;
      }
      if (file.size > 20 * 1024 * 1024) { // Max 20MB per file sebelum kompresi
        setError(`File "${file.name}" terlalu besar (max 20MB).`);
        return;
      }
      newPreviews.push({
        file,
        previewUrl: URL.createObjectURL(file),
        name: file.name,
        sizeKB: Math.round(file.size / 1024),
      });
    }

    setPreviews(prev => [...prev, ...newPreviews].slice(0, 5)); // Max 5 foto
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    handleFileSelect(e.dataTransfer.files);
  }, [handleFileSelect]);

  const removePreview = (index: number) => {
    setPreviews(prev => {
      URL.revokeObjectURL(prev[index].previewUrl);
      return prev.filter((_, i) => i !== index);
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!tripId.trim()) { setError('ID Trip wajib diisi.'); return; }
    if (!driverName.trim()) { setError('Nama driver wajib diisi.'); return; }
    if (previews.length === 0) { setError('Pilih minimal 1 foto untuk dilaporkan.'); return; }

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append('tripId', tripId.trim());
      formData.append('driverName', driverName.trim());
      for (const preview of previews) {
        formData.append('foto', preview.file);
      }

      const res = await fetch('/api/laporan-foto/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Upload gagal. Coba lagi.');
        return;
      }

      setUploadResult(data.photos);
      setPreviews([]);
      setTripId('');
      setDriverName('');
    } catch {
      setError('Koneksi gagal. Pastikan terhubung ke jaringan kantor.');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F0F2F5] flex items-center justify-center p-4">
      <div className="w-full max-w-lg">

        {/* Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-[#2F2FE4] rounded-2xl mb-3 shadow-lg">
            <Camera size={28} className="text-white" />
          </div>
          <h1 className="text-xl font-black text-gray-900">Upload Foto Laporan</h1>
          <p className="text-xs text-gray-500 font-semibold mt-1">
            PT Armada Trans Logistik — Sistem Laporan Perjalanan
          </p>
        </div>

        {/* Hasil Upload Sukses */}
        {uploadResult && (
          <div className="bg-green-50 border border-green-200 rounded-2xl p-5 mb-5 shadow-sm">
            <div className="flex items-center gap-2 mb-3">
              <CheckCircle size={20} className="text-green-600" />
              <span className="font-black text-green-800 text-sm">
                {uploadResult.length} Foto Berhasil Diupload!
              </span>
            </div>
            <div className="space-y-2">
              {uploadResult.map((photo) => (
                <div key={photo.id} className="bg-white rounded-xl p-3 border border-green-100 text-xs font-semibold text-gray-600 flex items-center justify-between">
                  <span className="truncate max-w-[60%]">{photo.filename}</span>
                  <span className="text-green-600 font-black shrink-0">
                    {photo.originalSizeKB}KB → {photo.compressedSizeKB}KB ({photo.compressionRatio} lebih kecil)
                  </span>
                </div>
              ))}
            </div>
            <p className="text-[10px] text-green-700 font-bold mt-3 text-center">
              Foto tersimpan selama 14 hari. Admin dapat melihat di dashboard.
            </p>
            <button
              onClick={() => setUploadResult(null)}
              className="w-full mt-3 bg-green-600 hover:bg-green-700 text-white font-extrabold text-xs py-2 rounded-xl cursor-pointer transition-colors"
            >
              Upload Foto Lagi
            </button>
          </div>
        )}

        {!uploadResult && (
          <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 space-y-5">

            {/* Trip ID */}
            <div>
              <label className="block text-[11px] font-black text-gray-500 uppercase tracking-wider mb-1.5">
                ID Trip / Nomor Order
              </label>
              <input
                type="text"
                value={tripId}
                onChange={(e) => setTripId(e.target.value)}
                placeholder="Contoh: trip_20260904_001"
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-xs font-bold text-gray-800 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-[#2F2FE4]/20"
              />
            </div>

            {/* Nama Driver */}
            <div>
              <label className="block text-[11px] font-black text-gray-500 uppercase tracking-wider mb-1.5">
                Nama Driver
              </label>
              <input
                type="text"
                value={driverName}
                onChange={(e) => setDriverName(e.target.value)}
                placeholder="Nama lengkap driver"
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-xs font-bold text-gray-800 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-[#2F2FE4]/20"
              />
            </div>

            {/* Drop Zone */}
            <div>
              <label className="block text-[11px] font-black text-gray-500 uppercase tracking-wider mb-1.5">
                Foto Laporan (Maks. 5 Foto)
              </label>
              <div
                onDrop={handleDrop}
                onDragOver={(e) => e.preventDefault()}
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-gray-300 hover:border-[#2F2FE4] rounded-xl p-6 text-center cursor-pointer transition-colors bg-gray-50 hover:bg-indigo-50/30 group"
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/jpg,image/png,image/webp"
                  multiple
                  className="hidden"
                  onChange={(e) => handleFileSelect(e.target.files)}
                />
                <Upload size={24} className="mx-auto text-gray-400 group-hover:text-[#2F2FE4] mb-2 transition-colors" />
                <p className="text-xs font-bold text-gray-500 group-hover:text-[#2F2FE4]">
                  Klik atau seret foto ke sini
                </p>
                <p className="text-[10px] text-gray-400 font-semibold mt-1">
                  JPEG, PNG, WebP — Maks. 20MB per foto. Foto otomatis dikompres.
                </p>
              </div>
            </div>

            {/* Preview Foto */}
            {previews.length > 0 && (
              <div className="grid grid-cols-3 gap-2">
                {previews.map((preview, index) => (
                  <div key={index} className="relative group rounded-xl overflow-hidden aspect-square border border-gray-200">
                    <img
                      src={preview.previewUrl}
                      alt={preview.name}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <button
                        type="button"
                        onClick={() => removePreview(index)}
                        className="p-1.5 bg-red-500 rounded-full text-white"
                      >
                        <X size={14} />
                      </button>
                    </div>
                    <div className="absolute bottom-0 left-0 right-0 bg-black/60 px-1.5 py-1">
                      <p className="text-[9px] text-white font-bold truncate">{preview.sizeKB}KB</p>
                    </div>
                  </div>
                ))}
                {previews.length < 5 && (
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="aspect-square border-2 border-dashed border-gray-300 rounded-xl flex items-center justify-center cursor-pointer hover:border-[#2F2FE4] transition-colors bg-gray-50"
                  >
                    <ImageIcon size={20} className="text-gray-400" />
                  </div>
                )}
              </div>
            )}

            {/* Error */}
            {error && (
              <div className="flex items-start gap-2 bg-red-50 border border-red-200 rounded-xl p-3 text-xs font-bold text-red-700">
                <AlertCircle size={14} className="shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={isUploading || previews.length === 0}
              className="w-full bg-[#2F2FE4] hover:bg-[#2020D0] disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-extrabold text-sm py-3 rounded-xl shadow-sm transition-all active:scale-95 flex items-center justify-center gap-2 cursor-pointer"
            >
              {isUploading ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  <span>Mengompresi & Mengupload...</span>
                </>
              ) : (
                <>
                  <Upload size={16} />
                  <span>Upload {previews.length > 0 ? `${previews.length} Foto` : 'Foto'} Laporan</span>
                </>
              )}
            </button>

            <p className="text-[10px] text-gray-400 font-semibold text-center">
              Foto akan otomatis dihapus setelah 14 hari. Hanya admin yang dapat melihat.
            </p>
          </form>
        )}
      </div>
    </div>
  );
}

// src/components/finance-metrics/pantry/BarcodeScanModal.tsx
import React, { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import { Modal } from '../../ui/modal';

// A BarcodeDetector API não está nos tipos padrão do DOM — declaração mínima.
interface DetectedBarcode {
  rawValue: string;
}
interface BarcodeDetectorLike {
  detect(source: ImageBitmapSource): Promise<DetectedBarcode[]>;
}
type BarcodeDetectorCtor = new (opts?: { formats?: string[] }) => BarcodeDetectorLike;

const getDetectorCtor = (): BarcodeDetectorCtor | null =>
  (window as unknown as { BarcodeDetector?: BarcodeDetectorCtor }).BarcodeDetector ?? null;

interface BarcodeScanModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDetected: (code: string) => void;
}

const BARCODE_FORMATS = ['ean_13', 'ean_8', 'upc_a', 'upc_e', 'code_128', 'code_39', 'qr_code'];

const BarcodeScanModal: React.FC<BarcodeScanModalProps> = ({ isOpen, onClose, onDetected }) => {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [manualCode, setManualCode] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const supported = getDetectorCtor() != null;

  useEffect(() => {
    if (!isOpen) {
      setManualCode('');
      setIsScanning(false);
      setPreviewUrl((url) => {
        if (url) URL.revokeObjectURL(url);
        return null;
      });
    }
  }, [isOpen]);

  const handleFile = async (file?: File | null) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      toast.error('Selecione uma imagem.');
      return;
    }
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(URL.createObjectURL(file));

    const Ctor = getDetectorCtor();
    if (!Ctor) return; // sem suporte: usuário usa o campo manual

    setIsScanning(true);
    try {
      const detector = new Ctor({ formats: BARCODE_FORMATS });
      const bitmap = await createImageBitmap(file);
      const codes = await detector.detect(bitmap);
      bitmap.close?.();
      const code = codes.find((c) => c.rawValue)?.rawValue;
      if (code) {
        onDetected(code.trim());
        onClose();
      } else {
        toast.info('Nenhum código detectado. Tente outra foto ou digite manualmente.');
      }
    } catch {
      toast.error('Falha ao ler o código. Digite manualmente.');
    } finally {
      setIsScanning(false);
    }
  };

  const handleManualSubmit = () => {
    const code = manualCode.trim();
    if (!code) {
      toast.error('Digite o código.');
      return;
    }
    onDetected(code);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} className="max-w-md">
      <div className="p-6 space-y-4">
        <div>
          <h2 className="text-xl font-semibold text-slate-800 dark:text-white">
            Escanear Código de Barras
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Envie uma foto do código de barras do produto.
          </p>
        </div>

        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          capture="environment"
          className="hidden"
          onChange={(e) => handleFile(e.target.files?.[0])}
        />

        {previewUrl ? (
          <div className="relative">
            <img
              src={previewUrl}
              alt="Pré-visualização do código"
              className="w-full max-h-56 object-contain rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900"
            />
            {isScanning && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/30 rounded-lg">
                <span className="text-white flex items-center gap-2">
                  <i className="fas fa-spinner fa-spin"></i> Lendo código...
                </span>
              </div>
            )}
          </div>
        ) : (
          <button
            onClick={() => inputRef.current?.click()}
            className="w-full border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-xl py-8 flex flex-col items-center gap-2 text-slate-500 dark:text-slate-400 hover:border-sky-400 hover:text-sky-500 transition-colors"
          >
            <i className="fas fa-barcode text-3xl"></i>
            <span className="text-sm font-medium">Tirar foto ou escolher imagem</span>
          </button>
        )}

        {!supported && (
          <p className="text-xs text-amber-600 dark:text-amber-400">
            <i className="fas fa-info-circle mr-1"></i>
            Seu navegador não detecta códigos automaticamente. Digite o código abaixo.
          </p>
        )}

        {/* Fallback manual (sempre disponível) */}
        <div className="border-t border-slate-200 dark:border-slate-700 pt-4">
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
            Ou digite o código
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              inputMode="numeric"
              value={manualCode}
              onChange={(e) => setManualCode(e.target.value)}
              placeholder="Ex.: 7891234567890"
              className="flex-1 px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500"
            />
            <button
              onClick={handleManualSubmit}
              className="px-4 py-2 bg-sky-500 text-white rounded-lg hover:bg-sky-600 transition-colors whitespace-nowrap"
            >
              Usar
            </button>
          </div>
        </div>

        <div className="flex justify-end pt-1">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-700 transition-colors"
          >
            Cancelar
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default BarcodeScanModal;

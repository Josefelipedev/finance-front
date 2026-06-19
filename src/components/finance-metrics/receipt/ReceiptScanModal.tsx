// src/components/finance-metrics/receipt/ReceiptScanModal.tsx
import React, { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import { Modal } from '../../ui/modal';
import { useReceiptScan, ReceiptScanResult } from '../../../hooks/useReceiptScan';

interface ReceiptScanModalProps {
  isOpen: boolean;
  onClose: () => void;
  onScanned: (result: ReceiptScanResult) => void;
}

const ReceiptScanModal: React.FC<ReceiptScanModalProps> = ({ isOpen, onClose, onScanned }) => {
  const { scan, isLoading } = useReceiptScan();
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Limpa estado ao fechar
  useEffect(() => {
    if (!isOpen) {
      setFile(null);
      setPreviewUrl((url) => {
        if (url) URL.revokeObjectURL(url);
        return null;
      });
    }
  }, [isOpen]);

  const handleSelect = (selected?: File | null) => {
    if (!selected) return;
    if (!selected.type.startsWith('image/')) {
      toast.error('Selecione um arquivo de imagem.');
      return;
    }
    if (selected.size > 10 * 1024 * 1024) {
      toast.error('Imagem muito grande (máx. 10MB).');
      return;
    }
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setFile(selected);
    setPreviewUrl(URL.createObjectURL(selected));
  };

  const handleAnalyze = async () => {
    if (!file) return;
    try {
      const result = await scan(file);
      toast.success('Recibo analisado!');
      onScanned(result);
      onClose();
    } catch {
      toast.error('Não foi possível analisar o recibo. Tente outra foto.');
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} className="max-w-md">
      <div className="p-6 space-y-4">
        <div>
          <h2 className="text-xl font-semibold text-slate-800 dark:text-white">
            Escanear Recibo
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Envie uma foto do recibo. A IA detecta valor, estabelecimento e categoria
            automaticamente.
          </p>
        </div>

        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          capture="environment"
          className="hidden"
          onChange={(e) => handleSelect(e.target.files?.[0])}
        />

        {previewUrl ? (
          <div className="relative">
            <img
              src={previewUrl}
              alt="Pré-visualização do recibo"
              className="w-full max-h-72 object-contain rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900"
            />
            <button
              onClick={() => inputRef.current?.click()}
              disabled={isLoading}
              className="absolute top-2 right-2 px-3 py-1.5 text-xs bg-white/90 dark:bg-slate-800/90 text-slate-700 dark:text-slate-200 rounded-lg shadow hover:bg-white dark:hover:bg-slate-700 disabled:opacity-50"
            >
              <i className="fas fa-sync-alt mr-1"></i>Trocar
            </button>
          </div>
        ) : (
          <button
            onClick={() => inputRef.current?.click()}
            className="w-full border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-xl py-10 flex flex-col items-center gap-2 text-slate-500 dark:text-slate-400 hover:border-sky-400 hover:text-sky-500 transition-colors"
          >
            <i className="fas fa-camera text-3xl"></i>
            <span className="text-sm font-medium">Tirar foto ou escolher imagem</span>
            <span className="text-xs">JPG ou PNG, até 10MB</span>
          </button>
        )}

        <div className="flex justify-end gap-3 pt-2">
          <button
            onClick={onClose}
            disabled={isLoading}
            className="px-4 py-2 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-700 transition-colors disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            onClick={handleAnalyze}
            disabled={!file || isLoading}
            className="px-4 py-2 bg-sky-500 text-white rounded-lg hover:bg-sky-600 transition-colors disabled:opacity-50 flex items-center gap-2"
          >
            {isLoading ? (
              <>
                <i className="fas fa-spinner fa-spin"></i>
                Analisando...
              </>
            ) : (
              <>
                <i className="fas fa-wand-magic-sparkles"></i>
                Analisar
              </>
            )}
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default ReceiptScanModal;

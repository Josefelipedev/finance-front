import { useState } from 'react';
import api from '../services/api';

// ===================== TYPES =====================

export interface ReceiptScanResult {
  amount: number | null;
  description: string;
  category: string;
}

// Lê um File de imagem e devolve { base64 sem prefixo, mimeType }
function fileToBase64(file: File): Promise<{ base64: string; mimeType: string }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      // result = "data:image/jpeg;base64,XXXX" → separa prefixo do conteúdo
      const comma = result.indexOf(',');
      resolve({
        base64: comma >= 0 ? result.slice(comma + 1) : result,
        mimeType: file.type || 'image/jpeg',
      });
    };
    reader.onerror = () => reject(new Error('Falha ao ler a imagem'));
    reader.readAsDataURL(file);
  });
}

// ===================== HOOK =====================

export function useReceiptScan() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const scan = async (file: File): Promise<ReceiptScanResult> => {
    setIsLoading(true);
    setError(null);

    try {
      const { base64, mimeType } = await fileToBase64(file);
      const result = await api.post<ReceiptScanResult>('/analysis/receipt', {
        image: base64,
        mimeType,
      });

      if (!result) {
        throw new Error('Não foi possível analisar o recibo');
      }

      return result;
    } catch (err) {
      setError(err as Error);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  return { scan, isLoading, error };
}

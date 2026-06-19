// src/components/UserProfile/CoupleCard.tsx
import React, { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { useUserProfile } from '../../hooks/useUserProfile';

const CoupleCard: React.FC = () => {
  const { profile, getProfile, associateAsCouple, dissociateCouple, isLoading } = useUserProfile();

  const [spousePhone, setSpousePhone] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUnlinking, setIsUnlinking] = useState(false);

  useEffect(() => {
    getProfile().catch(() => {});
  }, [getProfile]);

  const isMarried = Boolean(profile?.isMarried && profile?.spouseId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const phone = spousePhone.trim();
    if (!phone) {
      toast.error('Informe o telefone do cônjuge.');
      return;
    }
    setIsSubmitting(true);
    try {
      const message = await associateAsCouple(phone);
      toast.success(typeof message === 'string' ? message : 'Casal vinculado com sucesso!');
      setSpousePhone('');
    } catch (err) {
      toast.error((err as Error).message || 'Não foi possível vincular o casal.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUnlink = async () => {
    setIsUnlinking(true);
    try {
      const message = await dissociateCouple();
      toast.success(typeof message === 'string' ? message : 'Vínculo desfeito.');
    } catch (err) {
      toast.error((err as Error).message || 'Não foi possível desvincular.');
    } finally {
      setIsUnlinking(false);
    }
  };

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] lg:p-6">
      <div className="flex items-center gap-3 mb-5">
        <div className="w-11 h-11 rounded-full bg-rose-100 dark:bg-rose-900/30 text-rose-500 flex items-center justify-center">
          <i className="fas fa-heart"></i>
        </div>
        <div>
          <h4 className="text-lg font-semibold text-gray-800 dark:text-white/90">Finanças do Casal</h4>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Vincule sua conta à do seu cônjuge para compartilhar as finanças
          </p>
        </div>
      </div>

      {isMarried ? (
        <div className="space-y-3">
          <div className="flex items-center gap-3 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 p-4">
            <i className="fas fa-circle-check text-emerald-500 text-xl"></i>
            <div>
              <p className="font-medium text-emerald-800 dark:text-emerald-300">
                Vinculado a {profile?.spouse?.name || 'seu cônjuge'}
              </p>
              <p className="text-sm text-emerald-600 dark:text-emerald-400">
                As finanças, metas, listas e despensa são compartilhadas entre vocês.
              </p>
            </div>
          </div>
          <button
            onClick={handleUnlink}
            disabled={isUnlinking}
            className="text-sm text-rose-500 hover:text-rose-600 transition-colors flex items-center gap-2 disabled:opacity-60"
          >
            {isUnlinking ? (
              <i className="fas fa-spinner fa-spin"></i>
            ) : (
              <i className="fas fa-unlink"></i>
            )}
            Desvincular casal
          </button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Telefone do cônjuge
            </label>
            <input
              type="tel"
              inputMode="tel"
              value={spousePhone}
              onChange={(e) => setSpousePhone(e.target.value)}
              placeholder="Ex.: +351 912 345 678"
              className="w-full px-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-rose-400"
            />
            <p className="mt-1 text-xs text-gray-400">
              O cônjuge precisa já ter uma conta com este telefone cadastrado.
            </p>
          </div>
          <button
            type="submit"
            disabled={isSubmitting || isLoading}
            className="w-full sm:w-auto px-5 py-2.5 bg-rose-500 text-white rounded-lg hover:bg-rose-600 transition-colors shadow-sm flex items-center justify-center gap-2 disabled:opacity-60"
          >
            {isSubmitting ? (
              <>
                <i className="fas fa-spinner fa-spin"></i>
                Vinculando...
              </>
            ) : (
              <>
                <i className="fas fa-link"></i>
                Vincular cônjuge
              </>
            )}
          </button>
        </form>
      )}
    </div>
  );
};

export default CoupleCard;

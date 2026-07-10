// src/components/UserProfile/CoupleCard.tsx
// Card compacto no perfil — a gestão completa vive na página /casal
import React, { useEffect } from 'react';
import { Link } from 'react-router';
import { useUserProfile } from '../../hooks/useUserProfile';

const CoupleCard: React.FC = () => {
  const { profile, getProfile } = useUserProfile();

  useEffect(() => {
    getProfile().catch(() => {});
  }, [getProfile]);

  const isMarried = Boolean(profile?.isMarried && profile?.spouseId);

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-white/[0.06] dark:bg-gray-800 lg:p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-50 text-brand-600 dark:bg-brand-400/10 dark:text-brand-300">
            <i className="fas fa-heart"></i>
          </div>
          <div>
            <h4 className="text-lg font-semibold text-gray-800 dark:text-white/90">
              Finanças do Casal
            </h4>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {isMarried
                ? `Vinculado a ${profile?.spouse?.name || 'seu par'} — workspace compartilhado ativo`
                : 'Vincule sua conta à do seu par para compartilhar as finanças'}
            </p>
          </div>
        </div>
        <Link
          to="/casal"
          className="flex items-center justify-center gap-2 whitespace-nowrap rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 dark:border-white/[0.08] dark:text-gray-300 dark:hover:bg-white/5"
        >
          {isMarried ? 'Gerenciar casal' : 'Vincular agora'}
          <i className="fas fa-arrow-right text-xs"></i>
        </Link>
      </div>
    </div>
  );
};

export default CoupleCard;

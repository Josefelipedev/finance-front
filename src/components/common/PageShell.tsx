import React from 'react';

type PageShellProps = {
  title: string;
  description?: string;
  actions?: React.ReactNode;
  children: React.ReactNode;
};

/** Cartão padrão das páginas — superfície elevada sobre o fundo grafite. */
export function Surface({
  className = '',
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className={`rounded-2xl border border-gray-200 bg-white shadow-theme-sm dark:border-white/[0.06] dark:bg-gray-800 ${className}`}
    >
      {children}
    </div>
  );
}

/** Cabeçalho consistente para todas as páginas do app (título, descrição e ações). */
export default function PageShell({ title, description, actions, children }: PageShellProps) {
  return (
    <div className="space-y-5 sm:space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-display text-xl font-semibold tracking-tight text-gray-900 dark:text-white sm:text-2xl">
            {title}
          </h1>
          {description && (
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{description}</p>
          )}
        </div>
        {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
      </div>
      {children}
    </div>
  );
}

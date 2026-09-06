/**
 * A navegação por abas de um ecrã.
 *
 * Nasceu de o Planeamento ter sido dissolvido: as abas dele foram para casa
 * (Orçamento, Metas, Análises) e o mesmo `<nav>` ia ser copiado para três
 * ficheiros. Três cópias divergem — foi assim que as cores dos gráficos
 * ficaram diferentes das do resto da app.
 *
 * Não é o `VerticalTabs` de `ui/tabs`: aquele é uma lista lateral para
 * formulários longos, este é a barra horizontal por cima do conteúdo.
 */
export interface SegmentedTab<T extends string> {
  key: T;
  label: string;
  /** Um número por cima da aba — quantas coisas lá esperam por atenção. */
  badge?: number;
}

export default function SegmentedTabs<T extends string>({
  tabs,
  active,
  onChange,
  className = '',
}: {
  tabs: SegmentedTab<T>[];
  active: T;
  onChange: (key: T) => void;
  className?: string;
}) {
  return (
    <nav
      role="tablist"
      className={`flex gap-1 overflow-x-auto rounded-xl bg-gray-100 p-1 dark:bg-gray-900 ${className}`}
    >
      {tabs.map((tab) => (
        <button
          key={tab.key}
          type="button"
          role="tab"
          aria-selected={active === tab.key}
          onClick={() => onChange(tab.key)}
          className={`flex shrink-0 items-center gap-2 rounded-lg px-3.5 py-2 text-sm font-medium transition-colors ${
            active === tab.key
              ? 'bg-white text-gray-900 shadow-theme-xs dark:bg-white/[0.06] dark:text-white'
              : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
          }`}
        >
          {tab.label}
          {tab.badge != null && tab.badge > 0 && (
            <span className="rounded-full bg-warning-100 px-1.5 text-[10px] font-semibold text-warning-700 dark:bg-warning-500/20 dark:text-warning-400">
              {tab.badge}
            </span>
          )}
        </button>
      ))}
    </nav>
  );
}

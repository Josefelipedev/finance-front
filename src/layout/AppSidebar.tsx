import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router';
import { useSidebar } from '../context/SidebarContext';
import api from '../services/api';

type NavItem = { name: string; path: string; icon: string };
type NavSection = { label: string; items: NavItem[] };

const sections: NavSection[] = [
  {
    label: 'Visão geral',
    items: [
      { name: 'Dashboard', path: '/', icon: 'chart-line' },
      { name: 'Análises', path: '/analises', icon: 'chart-pie' },
      { name: 'Relatório', path: '/relatorio', icon: 'file-lines' },
      { name: 'Calendário', path: '/calendario', icon: 'calendar-days' },
    ],
  },
  {
    label: 'Dia a dia',
    items: [
      { name: 'Transações', path: '/transacoes', icon: 'arrow-right-arrow-left' },
      { name: 'Recorrentes', path: '/recorrentes', icon: 'rotate' },
      { name: 'Contas a Pagar', path: '/contas-a-pagar', icon: 'file-invoice-dollar' },
      { name: 'Compras', path: '/compras', icon: 'cart-shopping' },
      { name: 'Despensa', path: '/despensa', icon: 'box-open' },
      { name: 'Preços', path: '/precos', icon: 'magnifying-glass-dollar' },
    ],
  },
  {
    label: 'Planejamento',
    items: [
      { name: 'Metas', path: '/metas', icon: 'trophy' },
      { name: 'Orçamento', path: '/orcamento', icon: 'wallet' },
      { name: 'Contas', path: '/contas', icon: 'building-columns' },
      { name: 'Categorias', path: '/categorias', icon: 'tags' },
      { name: 'Casal', path: '/casal', icon: 'heart' },
      { name: 'Fiscal', path: '/fiscal', icon: 'file-invoice' },
    ],
  },
  {
    label: 'Cozinha',
    items: [{ name: 'Planejador Alimentar', path: '/meal-planner', icon: 'utensils' }],
  },
];

const AppSidebar: React.FC = () => {
  const { isExpanded, isMobileOpen, isHovered, setIsHovered, toggleMobileSidebar } = useSidebar();
  const location = useLocation();
  const [hasCoupleInvite, setHasCoupleInvite] = useState(false);

  // Sinaliza convite de casal pendente com um ponto no item "Casal"
  useEffect(() => {
    api
      .get<{ received: unknown[] }>('/contacts/couple/invites')
      .then((data) => setHasCoupleInvite((data?.received?.length ?? 0) > 0))
      .catch(() => {});
  }, [location.pathname]);

  const showLabels = isExpanded || isHovered || isMobileOpen;
  const isActive = (path: string) => location.pathname === path;

  return (
    <aside
      className={`fixed top-0 left-0 z-50 mt-16 flex h-screen flex-col border-r border-gray-200 bg-white px-4 transition-all duration-300 ease-in-out lg:mt-0 dark:border-white/[0.06] dark:bg-gray-900
        ${isExpanded || isMobileOpen ? 'w-[280px]' : isHovered ? 'w-[280px]' : 'w-[90px]'}
        ${isMobileOpen ? 'translate-x-0' : '-translate-x-full'}
        lg:translate-x-0`}
      onMouseEnter={() => !isExpanded && setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Wordmark */}
      <div className={`flex items-center py-7 ${!showLabels ? 'lg:justify-center' : 'justify-start px-1'}`}>
        <Link to="/" className="flex items-center gap-2.5">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-brand-400 font-display text-lg font-bold text-gray-950 shadow-glow">
            F
          </span>
          {showLabels && (
            <span className="font-display text-xl font-semibold tracking-tight text-gray-900 dark:text-white">
              fin<span className="text-brand-500 dark:text-brand-400">ploit</span>
            </span>
          )}
        </Link>
      </div>

      <nav className="no-scrollbar flex flex-1 flex-col gap-6 overflow-y-auto pb-8">
        {sections.map((section) => (
          <div key={section.label}>
            <h2
              className={`mb-2 flex text-[11px] font-semibold uppercase tracking-widest text-gray-400 dark:text-gray-500 ${
                !showLabels ? 'lg:justify-center' : 'px-3'
              }`}
            >
              {showLabels ? section.label : '·'}
            </h2>
            <ul className="flex flex-col gap-1">
              {section.items.map((item) => {
                const active = isActive(item.path);
                return (
                  <li key={item.path}>
                    <Link
                      to={item.path}
                      onClick={() => isMobileOpen && toggleMobileSidebar()}
                      className={`group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-theme-sm font-medium transition-colors ${
                        active
                          ? 'bg-brand-50 text-brand-700 dark:bg-brand-400/10 dark:text-brand-300'
                          : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-white/5 dark:hover:text-gray-200'
                      } ${!showLabels ? 'lg:justify-center' : ''}`}
                    >
                      {active && showLabels && (
                        <span className="absolute left-0 top-1/2 h-5 w-1 -translate-y-1/2 rounded-r-full bg-brand-400"></span>
                      )}
                      <i
                        className={`fas fa-${item.icon} w-5 text-center text-base ${
                          active
                            ? 'text-brand-600 dark:text-brand-400'
                            : 'text-gray-400 group-hover:text-gray-600 dark:text-gray-500 dark:group-hover:text-gray-300'
                        }`}
                      ></i>
                      {showLabels && <span>{item.name}</span>}
                      {item.path === '/casal' && hasCoupleInvite && (
                        <span className="ml-auto h-2 w-2 animate-pulse rounded-full bg-brand-400"></span>
                      )}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>
    </aside>
  );
};

export default AppSidebar;

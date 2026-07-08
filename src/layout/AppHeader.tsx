import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { toast } from 'sonner';
import { useSidebar } from '../context/SidebarContext';
import { ThemeToggleButton } from '../components/common/ThemeToggleButton';
import UserDropdown from '../components/header/UserDropdown';
import AddFinanceModal, { FinancePrefill } from '../components/finance-metrics/AddFinanceModal';
import ReceiptScanModal from '../components/finance-metrics/receipt/ReceiptScanModal';

const AppHeader: React.FC = () => {
  const { toggleSidebar, toggleMobileSidebar } = useSidebar();
  const navigate = useNavigate();

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isReceiptOpen, setIsReceiptOpen] = useState(false);
  const [prefill, setPrefill] = useState<FinancePrefill | undefined>(undefined);

  const handleToggle = () => {
    if (window.innerWidth >= 1024) {
      toggleSidebar();
    } else {
      toggleMobileSidebar();
    }
  };

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key === 'k') {
        event.preventDefault();
        navigate('/buscar');
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [navigate]);

  return (
    <header className="sticky top-0 z-99999 flex w-full border-b border-gray-200 bg-white/90 backdrop-blur-sm dark:border-white/[0.06] dark:bg-gray-950/80">
      <div className="flex w-full items-center justify-between gap-2 px-3 py-3 sm:gap-4 lg:px-6">
        <div className="flex items-center gap-2 sm:gap-3">
          <button
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-gray-200 text-gray-500 transition-colors hover:bg-gray-100 dark:border-white/[0.06] dark:text-gray-400 dark:hover:bg-white/5"
            onClick={handleToggle}
            aria-label="Alternar menu lateral"
          >
            <i className="fas fa-bars-staggered text-sm"></i>
          </button>

          {/* Wordmark no mobile (a sidebar fica oculta) */}
          <Link to="/" className="flex items-center gap-2 lg:hidden">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-400 font-display text-base font-bold text-gray-950">
              F
            </span>
            <span className="font-display text-lg font-semibold tracking-tight text-gray-900 dark:text-white">
              fin<span className="text-brand-500 dark:text-brand-400">ploit</span>
            </span>
          </Link>

          {/* Busca global */}
          <button
            onClick={() => navigate('/buscar')}
            className="hidden items-center gap-3 rounded-xl border border-gray-200 bg-gray-50 py-2.5 pl-4 pr-3 text-sm text-gray-400 transition-colors hover:border-gray-300 md:flex lg:w-72 dark:border-white/[0.06] dark:bg-white/[0.03] dark:text-gray-500 dark:hover:border-white/10"
          >
            <i className="fas fa-magnifying-glass text-xs"></i>
            <span className="flex-1 text-left">Buscar...</span>
            <kbd className="rounded-md border border-gray-200 bg-white px-1.5 py-0.5 text-[10px] font-medium text-gray-400 dark:border-white/10 dark:bg-white/5 dark:text-gray-500">
              ⌘K
            </kbd>
          </button>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          {/* Ações rápidas */}
          <button
            onClick={() => {
              setPrefill(undefined);
              setIsAddModalOpen(true);
            }}
            className="flex items-center gap-2 rounded-xl bg-brand-400 px-3 py-2.5 text-sm font-semibold text-gray-950 shadow-glow transition-colors hover:bg-brand-300 sm:px-4"
          >
            <i className="fas fa-plus text-xs"></i>
            <span className="hidden sm:inline">Nova transação</span>
          </button>
          <button
            onClick={() => setIsReceiptOpen(true)}
            aria-label="Escanear recibo"
            title="Escanear recibo"
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-gray-200 text-gray-500 transition-colors hover:bg-gray-100 dark:border-white/[0.06] dark:text-gray-400 dark:hover:bg-white/5"
          >
            <i className="fas fa-camera text-sm"></i>
          </button>

          <Link
            to="/notificacoes"
            aria-label="Notificações"
            className="hidden h-10 w-10 items-center justify-center rounded-xl border border-gray-200 text-gray-500 transition-colors hover:bg-gray-100 sm:flex dark:border-white/[0.06] dark:text-gray-400 dark:hover:bg-white/5"
          >
            <i className="fas fa-bell text-sm"></i>
          </Link>

          <ThemeToggleButton />
          <UserDropdown />
        </div>
      </div>

      <AddFinanceModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        prefill={prefill}
        onSuccess={() => {
          toast.success('Transação adicionada com sucesso!');
          setIsAddModalOpen(false);
          setPrefill(undefined);
        }}
      />

      <ReceiptScanModal
        isOpen={isReceiptOpen}
        onClose={() => setIsReceiptOpen(false)}
        onScanned={(result) => {
          setPrefill({
            amount: result.amount ?? undefined,
            description: result.description,
            categoryName: result.category,
            type: 'expense',
          });
          setIsAddModalOpen(true);
        }}
      />
    </header>
  );
};

export default AppHeader;

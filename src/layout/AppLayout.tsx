import { Suspense } from 'react';
import { SidebarProvider, useSidebar } from '../context/SidebarContext';
import { Outlet } from 'react-router';
import AppHeader from './AppHeader';
import Backdrop from './Backdrop';
import AppSidebar from './AppSidebar';

const RouteLoader = () => (
  <div className="flex h-[60vh] items-center justify-center">
    <span className="h-8 w-8 animate-spin rounded-full border-2 border-brand-400 border-t-transparent"></span>
  </div>
);

const LayoutContent: React.FC = () => {
  const { isExpanded, isHovered, isMobileOpen } = useSidebar();

  return (
    <div className="min-h-screen bg-gray-50 xl:flex dark:bg-gray-950">
      <div>
        <AppSidebar />
        <Backdrop />
      </div>
      <div
        className={`flex-1 transition-all duration-300 ease-in-out ${
          isExpanded || isHovered ? 'lg:ml-[280px]' : 'lg:ml-[90px]'
        } ${isMobileOpen ? 'ml-0' : ''}`}
      >
        <AppHeader />
        <div className="mx-auto max-w-(--breakpoint-2xl) p-4 md:p-6">
          <Suspense fallback={<RouteLoader />}>
            <Outlet />
          </Suspense>
        </div>
      </div>
    </div>
  );
};

const AppLayout: React.FC = () => {
  return (
    <SidebarProvider>
      <LayoutContent />
    </SidebarProvider>
  );
};

export default AppLayout;

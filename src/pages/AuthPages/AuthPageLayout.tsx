import React from 'react';
import GridShape from '../../components/common/GridShape';
import { Link } from 'react-router';
import ThemeTogglerTwo from '../../components/common/ThemeTogglerTwo';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative p-6 bg-white z-1 dark:bg-gray-900 sm:p-0">
      <div className="relative flex flex-col justify-center w-full h-screen lg:flex-row dark:bg-gray-900 sm:p-0">
        {children}
        <div className="items-center hidden w-full h-full lg:w-1/2 bg-gray-950 lg:grid">
          <div className="relative flex items-center justify-center z-1">
            {/* <!-- ===== Common Grid Shape Start ===== --> */}
            <GridShape />
            <div className="flex flex-col items-center max-w-xs">
              <Link to="/" className="mb-5 flex items-center gap-3">
                <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-400 font-display text-2xl font-bold text-gray-950 shadow-glow">
                  F
                </span>
                <span className="font-display text-3xl font-semibold tracking-tight text-white">
                  fin<span className="text-brand-400">ploit</span>
                </span>
              </Link>
              <p className="text-center text-gray-400">
                As finanças do casal, com clareza e num só lugar.
              </p>
            </div>
          </div>
        </div>
        <div className="fixed z-50 hidden bottom-6 right-6 sm:block">
          <ThemeTogglerTwo />
        </div>
      </div>
    </div>
  );
}

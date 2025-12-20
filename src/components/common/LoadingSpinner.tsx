import React from 'react';

interface LoadingSpinnerProps {
    size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
    color?: 'primary' | 'secondary' | 'white' | 'brand';
    className?: string;
    message?: string;
    fullScreen?: boolean;
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
                                                           size = 'md',
                                                           color = 'primary',
                                                           className = '',
                                                           message,
                                                           fullScreen = false,
                                                       }) => {
    const sizeClasses = {
        xs: 'w-4 h-4 border-2',
        sm: 'w-6 h-6 border-2',
        md: 'w-8 h-8 border-3',
        lg: 'w-12 h-12 border-4',
        xl: 'w-16 h-16 border-4',
    };

    const colorClasses = {
        primary: 'border-gray-200 border-t-gray-600',
        secondary: 'border-gray-200 border-t-gray-400',
        white: 'border-white/20 border-t-white',
        brand: 'border-brand-100 border-t-brand-500',
    };

    const spinner = (
        <div className="flex flex-col items-center justify-center gap-3">
            <div
                className={`${sizeClasses[size]} ${colorClasses[color]} rounded-full animate-spin ${className}`}
            />
            {message && (
                <p className="text-sm text-gray-600 dark:text-gray-300">{message}</p>
            )}
        </div>
    );

    if (fullScreen) {
        return (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm">
                {spinner}
            </div>
        );
    }

    return spinner;
};

export default LoadingSpinner;

// Versão com dots para loading (alternativa)
export const LoadingDots: React.FC<{ className?: string }> = ({ className }) => (
    <div className={`flex space-x-1 ${className}`}>
        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
    </div>
);

// Versão com skeleton loader
export const SkeletonLoader: React.FC<{
    type?: 'text' | 'card' | 'list' | 'avatar';
    count?: number;
    className?: string;
}> = ({ type = 'text', count = 1, className = '' }) => {
    const skeletons = Array.from({ length: count }, (_, i) => {
        switch (type) {
            case 'text':
                return (
                    <div key={i} className="animate-pulse">
                        <div className={`h-4 bg-gray-200 dark:bg-gray-700 rounded ${className}`}></div>
                    </div>
                );
            case 'card':
                return (
                    <div key={i} className="animate-pulse">
                        <div className={`h-48 bg-gray-200 dark:bg-gray-700 rounded-lg ${className}`}></div>
                    </div>
                );
            case 'list':
                return (
                    <div key={i} className="flex items-center space-x-4 animate-pulse">
                        <div className="w-12 h-12 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
                        <div className="flex-1">
                            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-2"></div>
                            <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
                        </div>
                    </div>
                );
            case 'avatar':
                return (
                    <div key={i} className="animate-pulse">
                        <div className={`rounded-full bg-gray-200 dark:bg-gray-700 ${className}`}></div>
                    </div>
                );
            default:
                return null;
        }
    });

    return <>{skeletons}</>;
};
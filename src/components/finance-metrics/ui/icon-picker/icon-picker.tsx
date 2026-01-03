// src/components/ui/icon-picker.tsx
import React from 'react';

interface IconPickerProps {
  selectedIcon: string;
  onIconChange: (icon: string) => void;
  iconOptions?: string[];
  className?: string;
}

const defaultIconOptions = [
  'shopping-cart',
  'home',
  'car',
  'utensils',
  'heart',
  'graduation-cap',
  'plane',
  'money-bill',
  'credit-card',
  'wallet',
  'piggy-bank',
  'chart-line',
  'gift',
  'film',
  'music',
  'dumbbell',
  'briefcase',
  'wifi',
  'mobile-alt',
];

const IconPicker: React.FC<IconPickerProps> = ({
  selectedIcon,
  onIconChange,
  iconOptions = defaultIconOptions,
  className = '',
}) => {
  return (
    <div className={`${className}`}>
      <div className="flex flex-wrap gap-2">
        {iconOptions.map((icon) => (
          <button
            key={icon}
            type="button"
            onClick={() => onIconChange(icon)}
            className={`p-3 rounded-lg border transition-all ${
              selectedIcon === icon
                ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30 shadow-sm scale-105'
                : 'border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 hover:scale-[1.02]'
            }`}
            title={icon.replace('-', ' ')}
            aria-label={`Selecionar ícone ${icon}`}
          >
            <i className={`fas fa-${icon} text-lg text-gray-600 dark:text-gray-300`}></i>
          </button>
        ))}
      </div>
      {selectedIcon && (
        <div className="mt-3 text-sm text-gray-500 dark:text-gray-400">
          <span className="font-medium">Selecionado:</span>{' '}
          <i className={`fas fa-${selectedIcon} ml-2 mr-1`}></i>
          <span className="capitalize">{selectedIcon.replace('-', ' ')}</span>
        </div>
      )}
    </div>
  );
};

export default IconPicker;

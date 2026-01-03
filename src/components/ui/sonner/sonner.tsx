import { Toaster as Sonner } from 'sonner';
import { useTheme } from '../../../context/ThemeContext.tsx';

type ToasterProps = React.ComponentProps<typeof Sonner>;

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme } = useTheme();

  return (
    <Sonner
      position="top-center"
      theme={theme === 'dark' ? 'dark' : 'light'}
      className="toaster group"
      toastOptions={{
        classNames: {
          // Usando as cores do seu tema definido no tailwind.config
          toast:
            'group toast group-[.toaster]:bg-gray-25 dark:group-[.toaster]:bg-gray-900 group-[.toaster]:text-gray-900 dark:group-[.toaster]:text-gray-50 group-[.toaster]:border-gray-200 dark:group-[.toaster]:border-gray-800 group-[.toaster]:shadow-theme-lg',
          description: 'group-[.toast]:text-gray-600 dark:group-[.toast]:text-gray-400',
          actionButton:
            'group-[.toast]:bg-blue-light-500 group-[.toast]:text-white hover:group-[.toast]:bg-blue-light-600 dark:group-[.toast]:bg-blue-light-400 dark:group-[.toast]:text-gray-900',
          cancelButton:
            'group-[.toast]:bg-gray-100 group-[.toast]:text-gray-700 hover:group-[.toast]:bg-gray-200 dark:group-[.toast]:bg-gray-800 dark:group-[.toast]:text-gray-300',
        },
      }}
      {...props}
    />
  );
};

export { Toaster };

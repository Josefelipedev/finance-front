import { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export default class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('ErrorBoundary capturou:', error, info.componentStack);
  }

  render() {
    if (this.state.hasError) {
      return (
        this.props.fallback ?? (
          <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900">
            <div className="text-center p-8 max-w-md">
              <h2 className="text-2xl font-bold text-slate-800 dark:text-white mb-2">
                Algo deu errado
              </h2>
              <p className="text-slate-500 dark:text-slate-400 mb-6">
                {this.state.error?.message ?? 'Erro inesperado. Tente recarregar a página.'}
              </p>
              <button
                onClick={() => window.location.reload()}
                className="px-4 py-2 bg-sky-500 text-white rounded-lg hover:bg-sky-600 transition-colors"
              >
                Recarregar página
              </button>
            </div>
          </div>
        )
      );
    }

    return this.props.children;
  }
}

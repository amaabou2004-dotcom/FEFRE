import React, { Component, ErrorInfo, ReactNode } from 'react';
import { RefreshCw, AlertTriangle, Home } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('[ErrorBoundary caught error]:', error, errorInfo);
  }

  private handleReload = () => {
    window.location.reload();
  };

  private handleGoHome = () => {
    window.location.href = '/';
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-[#F8FAFD] dark:bg-[#01184C] px-4 py-12">
          <div className="max-w-md w-full bg-white dark:bg-[#0A2254] rounded-2xl p-8 border border-slate-200 dark:border-white/10 shadow-2xl text-center">
            <div className="w-14 h-14 rounded-2xl bg-amber-500/10 dark:bg-amber-400/10 flex items-center justify-center text-amber-500 mx-auto mb-5">
              <AlertTriangle className="w-7 h-7" />
            </div>
            <h1 className="text-xl font-extrabold text-[#01184C] dark:text-white mb-2">
              Excellence Services SARL
            </h1>
            <p className="text-sm text-slate-600 dark:text-slate-300 mb-6 leading-relaxed">
              Une anomalie passagère est survenue lors du chargement des modules interactifs. Veuillez rafraîchir la page pour rétablir la connexion.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button
                type="button"
                onClick={this.handleReload}
                className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-full bg-[#D4AF37] hover:bg-[#E5C358] text-[#01184C] text-sm font-bold shadow-md transition-all cursor-pointer"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Actualiser la page</span>
              </button>
              <button
                type="button"
                onClick={this.handleGoHome}
                className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-full bg-slate-100 dark:bg-white/10 hover:bg-slate-200 dark:hover:bg-white/20 text-slate-700 dark:text-white text-sm font-semibold transition-all cursor-pointer"
              >
                <Home className="w-4 h-4" />
                <span>Page d'accueil</span>
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

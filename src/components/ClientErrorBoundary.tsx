'use client';

import { Component, type ReactNode } from 'react';

type Props = { children: ReactNode };
type State = { hasError: boolean };

export default class ClientErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-dvh flex-col items-center justify-center bg-slate-950 px-4 py-8 text-center">
          <p className="mb-4 text-slate-200">
            Une erreur s&apos;est produite.
          </p>
          <p className="mb-6 text-sm text-slate-400">
            Rechargez la page ou ouvrez le site dans le navigateur Chrome ou Firefox (pas dans l&apos;application Messenger).
          </p>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="rounded-lg bg-amber-500 px-4 py-2 text-sm font-medium text-slate-900 hover:bg-amber-400"
          >
            Recharger
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

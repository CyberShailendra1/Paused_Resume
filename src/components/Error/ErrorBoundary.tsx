import React, { Component, ErrorInfo, ReactNode } from 'react';
import { ErrorPage } from './ErrorPage';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
    };
  }

  public static getDerivedStateFromError(error: Error): State {
    // Suppress system error display and mark state as hasError
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log privately to console for developer diagnostics without displaying to end-user UI
    console.warn('ErrorBoundary intercepted runtime exception:', error.message);
  }

  public handleReset = () => {
    this.setState({ hasError: false, error: undefined });
    window.location.href = '/';
  };

  public render() {
    if (this.state.hasError) {
      // Never render system error stack traces or raw technical messages
      return (
        <ErrorPage 
          errorTitle="Something Went Wrong"
          errorMessage="We encountered an issue rendering this section. Don't worry, your resume documents and saved data are intact."
          onReset={this.handleReset}
        />
      );
    }

    return this.props.children;
  }
}

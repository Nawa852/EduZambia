import React from 'react';
import { AlertTriangle, RefreshCw, WifiOff } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ErrorStateProps {
  title?: string;
  description?: string;
  onRetry?: () => void;
  retryLabel?: string;
  variant?: 'error' | 'offline';
  className?: string;
}

export function ErrorState({
  title = "Something didn't load",
  description = "We couldn't reach the server. Check your connection and try again.",
  onRetry,
  retryLabel = 'Try again',
  variant = 'error',
  className = '',
}: ErrorStateProps) {
  const Icon = variant === 'offline' ? WifiOff : AlertTriangle;
  return (
    <div className={`flex flex-col items-center justify-center py-10 px-4 text-center ${className}`}>
      <div className="w-14 h-14 rounded-2xl bg-destructive/10 flex items-center justify-center mb-3">
        <Icon className="w-7 h-7 text-destructive" />
      </div>
      <h3 className="text-base font-semibold text-foreground mb-1">{title}</h3>
      <p className="text-sm text-muted-foreground max-w-sm">{description}</p>
      {onRetry && (
        <Button variant="outline" onClick={onRetry} className="mt-4 gap-2 rounded-full">
          <RefreshCw className="w-4 h-4" /> {retryLabel}
        </Button>
      )}
    </div>
  );
}

interface State { hasError: boolean; error: Error | null }
interface BoundaryProps { children: React.ReactNode; onReset?: () => void; label?: string }

/** Scoped, in-page error boundary — does NOT navigate away. Use inside tabs/sections. */
export class InlineErrorBoundary extends React.Component<BoundaryProps, State> {
  state: State = { hasError: false, error: null };
  static getDerivedStateFromError(error: Error): State { return { hasError: true, error }; }
  componentDidCatch(err: Error) { console.error('InlineErrorBoundary:', err); }
  reset = () => { this.setState({ hasError: false, error: null }); this.props.onReset?.(); };
  render() {
    if (this.state.hasError) {
      return (
        <ErrorState
          title={this.props.label || 'This section crashed'}
          description={this.state.error?.message || 'Try reloading this section.'}
          onRetry={this.reset}
        />
      );
    }
    return this.props.children;
  }
}

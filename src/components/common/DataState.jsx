import { AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function LoadingState({ message = 'Loading…' }) {
  return (
    <div className="h-full min-h-48 flex items-center justify-center" role="status">
      <div className="text-center">
        <RefreshCw
          className="w-8 h-8 animate-spin text-muted-foreground mx-auto mb-2"
          aria-hidden="true"
        />
        <p className="text-sm text-muted-foreground">{message}</p>
      </div>
    </div>
  );
}

export function ErrorState({ message = 'Unable to load this information', onRetry }) {
  return (
    <div className="h-full min-h-48 flex items-center justify-center px-6" role="alert">
      <div className="max-w-sm text-center">
        <AlertCircle className="w-9 h-9 text-red-500 mx-auto mb-3" aria-hidden="true" />
        <h3 className="font-semibold text-foreground">Something went wrong</h3>
        <p className="text-sm text-muted-foreground mt-1 mb-4">{message}</p>
        {onRetry && (
          <Button variant="outline" onClick={onRetry}>
            Try again
          </Button>
        )}
      </div>
    </div>
  );
}

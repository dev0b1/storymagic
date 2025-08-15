import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { AlertCircle } from 'lucide-react';

interface ConfigErrorProps {
  message?: string;
  showReload?: boolean;
}

export function ConfigError({ 
  message = "The application is not configured properly. Please check the environment variables.", 
  showReload = true 
}: ConfigErrorProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-200 via-pink-100 to-white flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <Alert variant="destructive" className="border-2">
          <AlertCircle className="h-5 w-5" />
          <AlertTitle>Configuration Error</AlertTitle>
          <AlertDescription className="mt-2">
            {message}
            {showReload && (
              <Button
                variant="outline"
                className="mt-4 w-full"
                onClick={() => window.location.reload()}
              >
                Reload Page
              </Button>
            )}
          </AlertDescription>
        </Alert>
      </div>
    </div>
  );
}

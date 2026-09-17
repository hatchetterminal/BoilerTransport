import { Toaster } from 'sonner';

export default function Layout({ children }) {
  return (
    <div className="min-h-screen bg-background">
      {children}

      <Toaster
        position="top-center"
        offset={{ top: 'var(--notification-top)' }}
        mobileOffset={{ top: 'var(--notification-top)', left: 16, right: 16 }}
        toastOptions={{
          style: {
            borderRadius: '16px',
            padding: '16px',
            fontSize: '14px',
            background: 'hsl(var(--card))',
            color: 'hsl(var(--foreground))',
            border: '1px solid hsl(var(--border))',
          },
        }}
      />
    </div>
  );
}

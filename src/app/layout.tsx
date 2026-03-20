import type { Metadata } from 'next';
import './globals.css';
import { Sidebar } from '@/components/ui/sidebar';
import { Providers } from '@/components/providers';
import { AlertBanner } from '@/components/ui/alert-banner';

export const metadata: Metadata = {
  title: 'API Integration System',
  description: 'Centralized platform for managing API integrations, workflow automations, and data synchronization',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="font-sans antialiased">
        <Providers>
          <div className="flex min-h-screen">
            <Sidebar />
            <main className="flex-1 overflow-auto">
              <AlertBanner
                variant="warning"
                message="This is a demo site with sample data. All integrations, sync runs, and workflows shown are simulated and not connected to real services."
              />
              <div className="p-8">
                {children}
              </div>
            </main>
          </div>
        </Providers>
      </body>
    </html>
  );
}

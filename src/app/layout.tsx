import type { Metadata } from 'next';
import './globals.css';
import { Sidebar } from '@/components/ui/sidebar';

export const metadata: Metadata = {
  title: 'API Integration System',
  description: 'Centralized platform for managing API integrations, workflow automations, and data synchronization',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="font-sans antialiased">
        <div className="flex min-h-screen">
          <Sidebar />
          <main className="flex-1 p-8 overflow-auto">
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}

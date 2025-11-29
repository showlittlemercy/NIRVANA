import { ClerkProvider } from '@clerk/nextjs';
import { dark } from '@clerk/themes';
import './globals.css';
import { Toaster } from '@/components/ui/sonner';

export const metadata = {
  title: 'Nirvana - E-commerce Store',
  description: 'Your gateway to premium products - Created by Priyanshu',
};

export default function RootLayout({ children }) {
  return (
    <ClerkProvider
      appearance={{
        baseTheme: dark,
        variables: {
          colorPrimary: '#8b5cf6',
          colorBackground: '#0f0a1e',
          colorText: '#ffffff',
        },
      }}
    >
      <html lang="en" className="dark">
        <body className="min-h-screen bg-gradient-to-br from-[#0f0a1e] via-[#1a0b2e] to-[#0f0a1e] text-white">
          {children}
          <Toaster />
        </body>
      </html>
    </ClerkProvider>
  );
}
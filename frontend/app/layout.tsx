import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Discord Server Manager — Web Panel',
  description: 'Production-ready Discord server, category, and channel management panel powered by discord.js v14.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="bg-discord-darkest text-discord-text min-h-screen antialiased">
        {children}
      </body>
    </html>
  );
}


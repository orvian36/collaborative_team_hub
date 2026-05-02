import './globals.css';
import ThemeProvider from '@/components/ThemeProvider';

export const metadata = {
  title: 'Collaborative Team Hub',
  description:
    'A full-stack web application for teams to manage shared goals, post announcements, and track action items in real time.',
  manifest: '/manifest.json',
};

export const viewport = {
  themeColor: '#3b82f6',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}

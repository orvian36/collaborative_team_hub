import './globals.css';

export const metadata = {
  title: 'Collaborative Team Hub',
  description: 'A full-stack web application for teams to manage shared goals, post announcements, and track action items in real time.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}

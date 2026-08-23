import './globals.css';

export const metadata = {
  title: "Shaw D'SIX Portal",
  description: "Community portal untuk Workshop Shaw D'SIX",
};

export default function RootLayout({ children }) {
  return (
    <html lang="id">
      <body>{children}</body>
    </html>
  );
}

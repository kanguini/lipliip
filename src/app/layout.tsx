import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "Lipliip · Convites digitais", template: "%s · Lipliip" },
  description: "Convites digitais pessoais e intransmissíveis para casamentos, noivados e aniversários.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Playfair+Display:ital,wght@0,400;0,600;1,400&family=Cormorant+Garamond:ital,wght@0,400;0,600;1,400&family=Poppins:wght@400;600;700&family=Great+Vibes&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="font-sans">{children}</body>
    </html>
  );
}

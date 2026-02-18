import type { Metadata } from "next";
import { Geist, Geist_Mono, Playfair_Display } from "next/font/google";
import { DM_Sans } from 'next/font/google'; // Import DM Sans
import "./globals.css";
import { Toaster } from 'react-hot-toast'; // New import

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// Define DM Sans
const dmSans = DM_Sans({
  subsets: ['latin'],
  variable: '--font-dm-sans',
  display: 'swap',
});

const playfairDisplay = Playfair_Display({
  subsets: ['latin'],
  variable: '--font-playfair-display',
  display: 'swap',
});


export const metadata: Metadata = {
  title: "Library Tool",
  description: "A modern, collegiate library management tool.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        // Apply the new font variables. DM Sans for sans, Playfair Display for serif.
        // Geist fonts can remain for monospaced or specific elements if desired.
        className={`${dmSans.variable} ${playfairDisplay.variable} ${geistSans.variable} ${geistMono.variable} antialiased font-sans`}
      >
        <div className="min-h-screen bg-background text-foreground">
          <main className="container mx-auto px-4 py-8">
            {children}
          </main>
        </div>
        <Toaster />
      </body>
    </html>
  );
}



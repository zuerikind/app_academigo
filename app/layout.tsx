import type { Metadata } from "next";
import { Inter, Manrope } from "next/font/google";
import { Toaster } from "sonner";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

const manrope = Manrope({
  variable: "--font-manrope",
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Academigo — Premium Online Tutoring",
    template: "%s | Academigo",
  },
  description:
    "Strukturierte Nachhilfe in Mathematik, Physik und Chemie — online und in Zürich.",
  icons: {
    icon: [{ url: "/brand/logo-icon.png", type: "image/png" }],
    apple: [{ url: "/brand/logo-icon.png", type: "image/png" }],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${manrope.variable} h-full`}
      suppressHydrationWarning
    >
      <body className="min-h-full bg-white font-sans text-academy-navy antialiased">
        {children}
        <Toaster
          position="top-center"
          richColors
          toastOptions={{
            style: {
              fontFamily: "var(--font-inter)",
              fontSize: "0.875rem",
            },
          }}
        />
      </body>
    </html>
  );
}

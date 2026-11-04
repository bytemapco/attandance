import type { Metadata } from "next";
import { Plus_Jakarta_Sans, Geist_Mono } from "next/font/google";
import { Toaster } from "react-hot-toast";
import "./globals.css";

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-plus-jakarta",
  display: "swap",
  weight: ["300", "400", "500", "600", "700", "800"],
});

const geistMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-geist-mono",
  display: "swap",
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: {
    default: "SAHAJ | Campus, made effortless",
    template: "%s | SAHAJ",
  },
  description: "Connected campus technology platform — attendance, operations & academic management",
  keywords: ["SAHAJ", "Campus Platform", "Attendance Platform", "AI Verification", "Geofence Attendance"],
  icons: {
    icon: "/favicon.ico",
    apple: "/sahaj-app-icon.png",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }): React.ReactElement {
  return (
    <html lang="en">
      <body className={`${plusJakarta.variable} ${geistMono.variable} bg-background text-foreground antialiased min-h-screen font-sans`}>
        {children}
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            className: "text-xs font-medium font-sans",
            style: {
              background: "var(--card)",
              color: "var(--foreground)",
              border: "1px solid var(--border)",
              borderRadius: "8px",
              fontSize: "14px",
              padding: "10px 14px",
              boxShadow: "none",
            },
            success: {
              iconTheme: {
                primary: "var(--success)",
                secondary: "var(--card)",
              },
            },
            error: {
              iconTheme: {
                primary: "var(--destructive)",
                secondary: "var(--card)",
              },
            },
          }}
        />
      </body>
    </html>
  );
}

import type { Metadata } from "next";
import { Plus_Jakarta_Sans, Geist_Mono, Inter } from "next/font/google";
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

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Smart Attendance System | AI Multi-Layer Verification",
    template: "%s | Smart Attendance System",
  },
  description: "AI-powered multi-layered smart attendance verification & management dashboard",
  keywords: ["Smart Attendance", "AI Verification", "Geofence Attendance", "Liveness Detection", "Attendance Management"],
  icons: {
    icon: "/favicon.ico",
    apple: "/favicon.ico",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }): React.ReactElement {
  return (
    <html lang="en">
      <body className={`${plusJakarta.variable} ${geistMono.variable} ${inter.variable} bg-background text-foreground antialiased min-h-screen font-sans`}>
        {children}
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            className: "text-xs font-medium",
            style: {
              background: "var(--card, #ffffff)",
              color: "var(--foreground, #0f172a)",
              border: "1px solid var(--border, #e2e8f0)",
              borderRadius: "0.75rem",
              fontSize: "13px",
              padding: "10px 14px",
              boxShadow: "0 4px 16px -2px rgba(0, 0, 0, 0.08)",
            },
            success: {
              iconTheme: {
                primary: "#10b981",
                secondary: "#ffffff",
              },
            },
            error: {
              iconTheme: {
                primary: "#ef4444",
                secondary: "#ffffff",
              },
            },
          }}
        />
      </body>
    </html>
  );
}

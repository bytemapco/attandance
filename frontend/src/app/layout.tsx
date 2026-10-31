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
  keywords: ["SAHAJ", "Campus Platform", "Smart Attendance", "AI Verification", "Geofence Attendance"],
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
              background: "#ffffff",
              color: "#202b30",
              border: "1px solid #e3e1dc",
              borderRadius: "0.625rem",
              fontSize: "13px",
              padding: "10px 14px",
              boxShadow: "0 4px 16px -2px rgba(40, 54, 59, 0.08)",
            },
            success: {
              iconTheme: {
                primary: "#247653",
                secondary: "#ffffff",
              },
            },
            error: {
              iconTheme: {
                primary: "#b54242",
                secondary: "#ffffff",
              },
            },
          }}
        />
      </body>
    </html>
  );
}

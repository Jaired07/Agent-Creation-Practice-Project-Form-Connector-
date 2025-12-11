import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { validateEnv } from "@/lib/env";
import { ClerkProvider } from "@clerk/nextjs";

// Validate environment variables on app startup
try {
  validateEnv();
} catch (error) {
  console.error("❌ Environment validation failed:");
  console.error(error.message);
  // Don't throw - let the app start so the error is visible in the UI
  // Individual API routes will handle missing env vars gracefully
}

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "Form Connector - Admin Dashboard",
  description: "Capture form submissions and route to multiple destinations",
};

/**
 * Root layout component
 * 
 * Wraps the entire application with ClerkProvider for authentication
 * and validates environment variables on startup.
 * 
 * @param {Object} props - Component props
 * @param {React.ReactNode} props.children - Child components
 * @returns {JSX.Element} Root layout with authentication provider
 */
export default function RootLayout({ children }) {
  return (
    <ClerkProvider>
      <html lang="en">
        <body
          className={`${geistSans.variable} ${geistMono.variable} antialiased`}
        >
          {children}
        </body>
      </html>
    </ClerkProvider>
  );
}

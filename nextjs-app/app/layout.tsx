import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { AuthProvider } from "@/components/auth-provider";
import { AuthModalProvider } from "@/contexts/auth-modal-context";
import { AuthModalWrapper } from "@/components/auth/auth-modal-wrapper";
import { ScheduleProvider } from "@/contexts/schedule-context";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "SoonerFlow - OU Degree Planner",
  description: "The intelligent degree planner for OU students. Visual scheduling, AI recommendations, and your entire academic journey in one flow.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <AuthProvider>
          <ScheduleProvider>
            <AuthModalProvider>
              <ThemeProvider
                attribute="class"
                defaultTheme="dark"
                enableSystem={false}
                disableTransitionOnChange
              >
                {children}
                <AuthModalWrapper />
              </ThemeProvider>
            </AuthModalProvider>
          </ScheduleProvider>
        </AuthProvider>
      </body>
    </html>
  );
}

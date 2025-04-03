// app/layout.tsx
import { Inter } from "next/font/google";
import "./globals.css";
import RootLayoutClient from "@/components/RootLayoutClient";
import { ReactNode } from "react";

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: "Everest Warriors",
  description: "Sign up for pickup games",
  icons: {
    icon: "/images/logo-ew.png",
  },
};

interface RootLayoutProps {
  children: ReactNode;
}

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="en">
      <body className={`${inter.className} bg-gray-100 min-h-screen`}>
        <RootLayoutClient>
          {children}
        </RootLayoutClient>
      </body>
    </html>
  );
}
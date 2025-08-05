"use client";

import { useEffect, ReactNode } from "react";
import { AuthProvider } from "@/context/AuthContext";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import GuestApprovalNotification from "@/components/GuestApprovalNotification";
import { Amplify } from 'aws-amplify';
import outputs from "../amplify_outputs.json"

Amplify.configure(outputs, { ssr: true });

interface RootLayoutClientProps {
  children: ReactNode;
}

export default function RootLayoutClient({ children }: RootLayoutClientProps) {

  return (
    <AuthProvider>
      <Navbar />
      <GuestApprovalNotification />
      <main className="min-h-[calc(100vh-130px)]">{children}</main>
      <Footer />
    </AuthProvider>
  );
}
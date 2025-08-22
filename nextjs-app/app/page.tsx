"use client";

import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Hero from "@/components/sections/hero";

export default function LandingPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [showLoadingTimeout, setShowLoadingTimeout] = useState(false);

  useEffect(() => {
    // If user is authenticated, redirect to dashboard
    if (status === "authenticated" && session) {
      router.push("/dashboard");
    }
    
    // Add timeout for loading state
    const timer = setTimeout(() => {
      setShowLoadingTimeout(true);
    }, 3000);
    
    return () => clearTimeout(timer);
  }, [status, session, router]);

  // Show loading state while checking authentication (add timeout)
  if (status === "loading" && !showLoadingTimeout) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto"></div>
          <p className="mt-4 text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  // If not authenticated, show hero page
  return <Hero />;
}
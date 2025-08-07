"use client";

import { Button } from "@/components/ui/button";
import { X, User, Zap } from "lucide-react";
import { useDemoMode } from "@/contexts/demo-mode-context";
import { useAuthModal } from "@/contexts/auth-modal-context";

export function DemoBanner() {
  const { isDemoMode, disableDemoMode } = useDemoMode();
  const { openModal } = useAuthModal();

  if (!isDemoMode) return null;

  const handleSignUp = () => {
    openModal();
  };

  const handleCloseBanner = () => {
    disableDemoMode();
  };

  return (
    <div className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white px-4 py-3 relative">
      <div className="flex items-center justify-between max-w-7xl mx-auto">
        <div className="flex items-center gap-3">
          <div className="bg-white/20 p-1 rounded-full">
            <Zap className="h-4 w-4" />
          </div>
          <span className="font-medium">Demo Mode</span>
          <span className="text-blue-100 text-sm hidden sm:inline">
            You're exploring SoonerSync with sample data
          </span>
        </div>
        
        <div className="flex items-center gap-3">
          <Button
            onClick={handleSignUp}
            size="sm"
            variant="secondary"
            className="bg-white text-blue-600 hover:bg-blue-50 text-sm"
          >
            <User className="h-3 w-3 mr-1" />
            Sign Up to Save
          </Button>
          <button
            onClick={handleCloseBanner}
            className="text-white/70 hover:text-white transition-colors"
            aria-label="Close demo banner"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
"use client";

import { motion, AnimatePresence } from "framer-motion";
import { signIn } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Github } from "lucide-react";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AuthModal({ isOpen, onClose }: AuthModalProps) {
  const handleGithubSignIn = async () => {
    await signIn("github", {
      callbackUrl: "/scheduler", // Redirect to scheduler after successful login
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader className="text-center space-y-4">
          <div className="mx-auto w-12 h-12 bg-gray-900 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-xl">S</span>
          </div>
          <div>
            <DialogTitle className="text-2xl font-semibold text-gray-900">
              Welcome to SoonerSync
            </DialogTitle>
            <p className="text-gray-600 mt-2">
              Sign in to save your schedule and track degree progress
            </p>
          </div>
        </DialogHeader>

        <div className="space-y-4 mt-6">
          <Button
            onClick={handleGithubSignIn}
            variant="outline"
            className="w-full h-12 border-gray-300 hover:bg-gray-50 transition-colors"
            size="lg"
          >
            <Github className="mr-3 h-5 w-5" />
            Continue with GitHub
          </Button>

          <div className="text-center text-sm text-gray-500">
            By continuing, you agree to our Terms of Service and Privacy Policy
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
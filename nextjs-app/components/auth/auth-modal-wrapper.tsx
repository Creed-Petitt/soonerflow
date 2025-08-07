"use client";

import { useAuthModal } from "@/contexts/auth-modal-context";
import { AuthModal } from "./auth-modal";

export function AuthModalWrapper() {
  const { isOpen, closeModal } = useAuthModal();

  return <AuthModal isOpen={isOpen} onClose={closeModal} />;
}
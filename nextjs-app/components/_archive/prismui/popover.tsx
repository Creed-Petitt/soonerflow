"use client"

import * as React from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  Popover,
  PopoverContent as ShadcnPopoverContent,
  PopoverTrigger as ShadcnPopoverTrigger,
} from "@/components/ui/popover"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { X } from "lucide-react"

// Context for managing popover state and form data
const PopoverContext = React.createContext<{
  isOpen?: boolean
  onOpenChange?: (open: boolean) => void
  formData?: string
  setFormData?: (data: string) => void
}>({})

interface PopoverRootProps {
  children: React.ReactNode
}

export function PopoverRoot({ children }: PopoverRootProps) {
  const [isOpen, setIsOpen] = React.useState(false)
  const [formData, setFormData] = React.useState("")

  return (
    <PopoverContext.Provider value={{ 
      isOpen, 
      onOpenChange: setIsOpen, 
      formData, 
      setFormData 
    }}>
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        {children}
      </Popover>
    </PopoverContext.Provider>
  )
}

interface PopoverTriggerProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "outline" | "secondary" | "ghost"
  children: React.ReactNode
}

export function PopoverTrigger({ 
  variant = "outline", 
  children, 
  className,
  ...props 
}: PopoverTriggerProps) {
  return (
    <ShadcnPopoverTrigger asChild>
      <Button variant={variant} className={className} {...props}>
        {children}
      </Button>
    </ShadcnPopoverTrigger>
  )
}

interface PopoverContentProps {
  children: React.ReactNode
  className?: string
}

export function PopoverContent({ children, className = "" }: PopoverContentProps) {
  return (
    <ShadcnPopoverContent 
      className={`p-0 ${className}`}
      asChild
    >
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -8 }}
        transition={{ duration: 0.2 }}
      >
        {children}
      </motion.div>
    </ShadcnPopoverContent>
  )
}

interface PopoverHeaderProps {
  children: React.ReactNode
  className?: string
}

export function PopoverHeader({ children, className = "" }: PopoverHeaderProps) {
  const { onOpenChange } = React.useContext(PopoverContext)
  
  return (
    <div className={`flex items-center justify-between border-b px-4 py-3 ${className}`}>
      <div className="space-y-1">
        {typeof children === 'string' ? (
          <h3 className="text-lg font-semibold">{children}</h3>
        ) : (
          children
        )}
      </div>
      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8"
        onClick={() => onOpenChange?.(false)}
      >
        <X className="h-4 w-4" />
      </Button>
    </div>
  )
}

interface PopoverBodyProps {
  children: React.ReactNode
  className?: string
}

export function PopoverBody({ children, className = "" }: PopoverBodyProps) {
  return (
    <div className={`p-4 space-y-4 ${className}`}>
      {children}
    </div>
  )
}

interface PopoverFooterProps {
  children: React.ReactNode
  className?: string
}

export function PopoverFooter({ children, className = "" }: PopoverFooterProps) {
  return (
    <div className={`flex items-center justify-end gap-2 border-t px-4 py-3 ${className}`}>
      {children}
    </div>
  )
}

interface PopoverCloseButtonProps {
  children?: React.ReactNode
}

export function PopoverCloseButton({ children = "Cancel" }: PopoverCloseButtonProps) {
  const { onOpenChange } = React.useContext(PopoverContext)
  
  return (
    <Button 
      variant="outline" 
      size="sm"
      onClick={() => onOpenChange?.(false)}
    >
      {children}
    </Button>
  )
}

interface PopoverButtonProps {
  children: React.ReactNode
  onClick?: () => void
  className?: string
}

export function PopoverButton({ children, onClick, className = "" }: PopoverButtonProps) {
  const { onOpenChange } = React.useContext(PopoverContext)
  
  const handleClick = () => {
    onClick?.()
    onOpenChange?.(false)
  }
  
  return (
    <button
      className={`flex items-center gap-2 w-full px-3 py-2 text-sm text-left hover:bg-muted rounded-md transition-colors ${className}`}
      onClick={handleClick}
    >
      {children}
    </button>
  )
}

// Form components
interface PopoverFormProps {
  children: React.ReactNode
  onSubmit?: (note: string) => void
}

export function PopoverForm({ children, onSubmit }: PopoverFormProps) {
  const { formData, onOpenChange } = React.useContext(PopoverContext)
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit?.(formData || "")
    onOpenChange?.(false)
  }
  
  return (
    <form onSubmit={handleSubmit} className="h-full flex flex-col">
      {children}
    </form>
  )
}

interface PopoverLabelProps {
  children: React.ReactNode
}

export function PopoverLabel({ children }: PopoverLabelProps) {
  return (
    <div className="px-4 py-3 border-b">
      <Label className="font-medium">{children}</Label>
    </div>
  )
}

export function PopoverTextarea() {
  const { formData, setFormData } = React.useContext(PopoverContext)
  
  return (
    <div className="p-4 flex-1">
      <Textarea
        placeholder="Enter your note..."
        value={formData}
        onChange={(e) => setFormData?.(e.target.value)}
        className="min-h-[100px] resize-none border-0 focus-visible:ring-0 focus-visible:ring-offset-0"
      />
    </div>
  )
}

interface PopoverSubmitButtonProps {
  children: React.ReactNode
}

export function PopoverSubmitButton({ children }: PopoverSubmitButtonProps) {
  return (
    <Button type="submit" size="sm">
      {children}
    </Button>
  )
}
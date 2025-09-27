'use client'

import { useState, useEffect } from 'react'
import { X, BookOpen } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface DemoBannerProps {
  onBrowseClasses: () => void
}

export function DemoBanner({ onBrowseClasses }: DemoBannerProps) {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    const dismissed = localStorage.getItem('demo-banner-dismissed')
    if (!dismissed) {
      setIsVisible(true)
    }
  }, [])

  const handleDismiss = () => {
    setIsVisible(false)
    localStorage.setItem('demo-banner-dismissed', 'true')
  }

  if (!isVisible) return null

  return (
    <div className="mx-4 mb-4 rounded-lg border border-red-500/20 bg-red-500/5 p-3">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <div className="h-2 w-2 rounded-full bg-red-500 animate-pulse" />
            <p className="text-sm font-medium text-red-400">Demo Schedule</p>
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Sample CS classes shown to demonstrate SoonerFlow.
            <Button
              variant="link"
              size="sm"
              className="h-auto p-0 text-xs text-red-400 hover:text-red-300 underline ml-1"
              onClick={onBrowseClasses}
            >
              Browse & Add Classes
            </Button>
            {' '}to get started with your real schedule.
          </p>
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="h-6 w-6 p-0 text-muted-foreground hover:text-foreground"
          onClick={handleDismiss}
        >
          <X className="h-3 w-3" />
        </Button>
      </div>
    </div>
  )
}
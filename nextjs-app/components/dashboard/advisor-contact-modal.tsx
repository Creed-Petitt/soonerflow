"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Mail, User, ExternalLink } from "lucide-react"
import { useSession } from "next-auth/react"

interface AdvisorContactModalProps {
  isOpen: boolean
  onClose: () => void
}

export function AdvisorContactModal({ isOpen, onClose }: AdvisorContactModalProps) {
  const { data: session } = useSession()
  const [advisorEmail, setAdvisorEmail] = useState("")
  const [advisorName, setAdvisorName] = useState("")
  const [isEditing, setIsEditing] = useState(false)
  const [loading, setLoading] = useState(true)
  
  // Load advisor info when modal opens
  useEffect(() => {
    if (isOpen && session?.user?.email) {
      loadAdvisorInfo()
    }
  }, [isOpen, session?.user?.email])
  
  const loadAdvisorInfo = async () => {
    try {
      const stored = localStorage.getItem(`advisor_${session?.user?.email}`)
      if (stored) {
        const data = JSON.parse(stored)
        setAdvisorEmail(data.email || "")
        setAdvisorName(data.name || "")
        setIsEditing(false)
      } else {
        setIsEditing(true)
      }
    } catch (error) {
      setIsEditing(true)
    } finally {
      setLoading(false)
    }
  }
  
  const handleSave = () => {
    if (session?.user?.email) {
      localStorage.setItem(`advisor_${session.user.email}`, JSON.stringify({
        email: advisorEmail,
        name: advisorName
      }))
      setIsEditing(false)
    }
  }
  
  const handleEmail = () => {
    if (advisorEmail) {
      const subject = encodeURIComponent("Academic Advising Question")
      const body = encodeURIComponent(`Dear ${advisorName || 'Advisor'},\n\n`)
      window.location.href = `mailto:${advisorEmail}?subject=${subject}&body=${body}`
    }
  }
  
  const handleOutlook = () => {
    if (advisorEmail) {
      const outlookUrl = `https://outlook.office.com/mail/deeplink/compose?to=${advisorEmail}&subject=${encodeURIComponent("Academic Advising Question")}`
      window.open(outlookUrl, '_blank')
    }
  }
  
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Academic Advisor Contact</DialogTitle>
          <DialogDescription>
            {isEditing ? "Set up your academic advisor's contact information" : "Contact your academic advisor"}
          </DialogDescription>
        </DialogHeader>
        
        {!loading && (
          <div className="space-y-4">
            {isEditing ? (
              <>
                <div className="space-y-2">
                  <Label htmlFor="advisor-name">Advisor Name</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="advisor-name"
                      placeholder="Dr. Jane Smith"
                      value={advisorName}
                      onChange={(e) => setAdvisorName(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="advisor-email">Advisor Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="advisor-email"
                      type="email"
                      placeholder="advisor@ou.edu"
                      value={advisorEmail}
                      onChange={(e) => setAdvisorEmail(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                
                <div className="flex gap-3">
                  <Button onClick={handleSave} disabled={!advisorEmail}>
                    Save Advisor Info
                  </Button>
                  {advisorEmail && advisorName && (
                    <Button variant="outline" onClick={() => setIsEditing(false)}>
                      Cancel
                    </Button>
                  )}
                </div>
              </>
            ) : (
              <>
                <div className="space-y-3">
                  <div className="p-4 border rounded-lg bg-muted/50">
                    <div className="flex items-center gap-2 mb-1">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">{advisorName || "Your Advisor"}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Mail className="h-3 w-3" />
                      <span>{advisorEmail}</span>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Button onClick={handleEmail} className="w-full">
                      <Mail className="mr-2 h-4 w-4" />
                      Send Email (Default Client)
                    </Button>
                    
                    <Button onClick={handleOutlook} variant="outline" className="w-full">
                      <ExternalLink className="mr-2 h-4 w-4" />
                      Open in Outlook Web
                    </Button>
                  </div>
                  
                  <Button 
                    variant="ghost" 
                    onClick={() => setIsEditing(true)}
                    className="w-full"
                  >
                    Edit Advisor Information
                  </Button>
                </div>
              </>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
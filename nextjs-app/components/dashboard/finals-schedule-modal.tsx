"use client"

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Clock, Calendar } from "lucide-react"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

interface FinalsScheduleModalProps {
  isOpen: boolean
  onClose: () => void
}

// Finals schedule pattern for Fall 2025 (Dec 15-19)
const finalsSchedule = {
  mwf: [
    { classTime: "7:30 AM", day: "Thursday", date: "Dec 18", examTime: "10:30 AM - 12:30 PM" },
    { classTime: "8:00 AM", day: "Wednesday", date: "Dec 17", examTime: "10:30 AM - 12:30 PM" },
    { classTime: "9:00 AM", day: "Tuesday", date: "Dec 16", examTime: "8:00 AM - 10:00 AM" },
    { classTime: "10:00 AM", day: "Wednesday", date: "Dec 17", examTime: "8:00 AM - 10:00 AM" },
    { classTime: "11:00 AM", day: "Monday", date: "Dec 15", examTime: "1:30 PM - 3:30 PM" },
    { classTime: "12:00 PM", day: "Thursday", date: "Dec 18", examTime: "1:30 PM - 3:30 PM" },
    { classTime: "1:00 PM", day: "Friday", date: "Dec 19", examTime: "8:00 AM - 10:00 AM" },
    { classTime: "2:00 PM", day: "Friday", date: "Dec 19", examTime: "4:30 PM - 6:30 PM" },
    { classTime: "3:00 PM", day: "Thursday", date: "Dec 18", examTime: "4:30 PM - 6:30 PM" },
    { classTime: "4:00 PM", day: "Tuesday", date: "Dec 16", examTime: "10:30 AM - 12:30 PM" },
  ],
  tr: [
    { classTime: "7:30 AM", day: "Monday", date: "Dec 15", examTime: "10:30 AM - 12:30 PM" },
    { classTime: "8:30 AM", day: "Tuesday", date: "Dec 16", examTime: "4:30 PM - 6:30 PM" },
    { classTime: "9:00 AM", day: "Monday", date: "Dec 15", examTime: "8:00 AM - 10:00 AM" },
    { classTime: "9:30 AM", day: "Monday", date: "Dec 15", examTime: "8:00 AM - 10:00 AM" },
    { classTime: "10:30 AM", day: "Thursday", date: "Dec 18", examTime: "8:00 AM - 10:00 AM" },
    { classTime: "11:30 AM", day: "Friday", date: "Dec 19", examTime: "10:30 AM - 12:30 PM" },
    { classTime: "12:00 PM", day: "Wednesday", date: "Dec 17", examTime: "1:30 PM - 3:30 PM" },
    { classTime: "12:30 PM", day: "Wednesday", date: "Dec 17", examTime: "1:30 PM - 3:30 PM" },
    { classTime: "1:30 PM", day: "Tuesday", date: "Dec 16", examTime: "1:30 PM - 3:30 PM" },
    { classTime: "2:30 PM", day: "Friday", date: "Dec 19", examTime: "1:30 PM - 3:30 PM" },
    { classTime: "3:00 PM", day: "Wednesday", date: "Dec 17", examTime: "4:30 PM - 6:30 PM" },
    { classTime: "3:30 PM", day: "Wednesday", date: "Dec 17", examTime: "4:30 PM - 6:30 PM" },
    { classTime: "4:30 PM", day: "Monday", date: "Dec 15", examTime: "4:30 PM - 6:30 PM" },
  ]
}

export function FinalsScheduleModal({ isOpen, onClose }: FinalsScheduleModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden bg-zinc-900 border-zinc-800 p-0">
        <div className="p-6 pb-0">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Fall 2025 Finals Schedule
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-2 text-sm text-muted-foreground mt-4">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              <span>Finals Week: December 15-19, 2025</span>
            </div>
          </div>
        </div>
        
        <div className="overflow-y-auto max-h-[60vh] px-6">
          <div className="space-y-6 pb-2">
            {/* MWF Classes */}
            <div>
            <h3 className="text-lg font-semibold mb-3">Monday, Wednesday, Friday Classes</h3>
            <div className="rounded-lg border border-zinc-800">
              <Table>
                <TableHeader>
                  <TableRow className="bg-zinc-800/50">
                    <TableHead className="text-xs font-medium w-20">Class</TableHead>
                    <TableHead className="text-xs font-medium">Exam Day</TableHead>
                    <TableHead className="text-xs font-medium">Exam Time</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {finalsSchedule.mwf.map((item, idx) => (
                    <TableRow key={idx} className="hover:bg-zinc-800/30">
                      <TableCell className="font-medium text-xs">{item.classTime}</TableCell>
                      <TableCell className="text-xs">
                        {item.day}, {item.date}
                      </TableCell>
                      <TableCell className="text-xs">{item.examTime}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
          
          {/* TR Classes */}
          <div>
            <h3 className="text-lg font-semibold mb-3">Tuesday, Thursday Classes</h3>
            <div className="rounded-lg border border-zinc-800">
              <Table>
                <TableHeader>
                  <TableRow className="bg-zinc-800/50">
                    <TableHead className="text-xs font-medium w-20">Class</TableHead>
                    <TableHead className="text-xs font-medium">Exam Day</TableHead>
                    <TableHead className="text-xs font-medium">Exam Time</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {finalsSchedule.tr.map((item, idx) => (
                    <TableRow key={idx} className="hover:bg-zinc-800/30">
                      <TableCell className="font-medium text-xs">{item.classTime}</TableCell>
                      <TableCell className="text-xs">
                        {item.day}, {item.date}
                      </TableCell>
                      <TableCell className="text-xs">{item.examTime}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
          </div>
        </div>
        
        <div className="text-xs text-muted-foreground p-6 pt-4 border-t border-zinc-800">
          * Evening classes and classes meeting once a week will have finals during their regular class time in finals week.
        </div>
      </DialogContent>
    </Dialog>
  )
}
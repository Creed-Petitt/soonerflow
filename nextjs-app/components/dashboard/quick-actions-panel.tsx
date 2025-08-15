import { Button } from "@/components/ui/button";
import { 
  CalendarDays, 
  GitBranch, 
  FileText
} from "lucide-react";
import Link from "next/link";

export function QuickActionsPanel() {

  return (
    <div>
      <h2 className="text-xl font-bold mb-3">Quick Actions</h2>
      <div className="space-y-2">
        <Link href="/scheduler">
          <Button variant="ghost" className="w-full justify-start h-10 hover:bg-accent">
            <CalendarDays className="h-4 w-4 mr-3" />
            Plan Schedule
          </Button>
        </Link>
        <Link href="/flowchart">
          <Button variant="ghost" className="w-full justify-start h-10 hover:bg-accent">
            <GitBranch className="h-4 w-4 mr-3" />
            View Prerequisites
          </Button>
        </Link>
        <Link href="/requirements">
          <Button variant="ghost" className="w-full justify-start h-10 hover:bg-accent">
            <FileText className="h-4 w-4 mr-3" />
            University Requirements
          </Button>
        </Link>
      </div>
    </div>
  );
}
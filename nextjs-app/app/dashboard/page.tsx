import { Home, Calendar, Search, GraduationCap, User, BookOpen, Settings } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ThemeToggle } from "@/components/theme-toggle"
import Link from "next/link"

export default function Page() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Top Navigation Bar */}
      <nav className="border-b border-border px-6 py-3">
        <div className="flex items-center justify-between">
          {/* Left side - Navigation Links */}
          <div className="flex items-center space-x-8">
            <div className="flex items-center space-x-6">
              <Link href="/dashboard" className="text-sm font-medium text-foreground hover:text-primary transition-colors">
                Home
              </Link>
              <Link href="/scheduler" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
                Scheduler
              </Link>
              <Link href="/browse" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
                Browse Classes
              </Link>
              <Link href="/progress" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
                Degree Progress
              </Link>
              <Link href="/professors" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
                Professors
              </Link>
              <Link href="/canvas" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
                Canvas
              </Link>
            </div>
          </div>

          {/* Right side - Search and Controls */}
          <div className="flex items-center space-x-4">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search classes..."
                className="pl-8 w-[250px] h-9 bg-muted/50 border-0"
              />
            </div>
            <ThemeToggle />
            <Button variant="ghost" size="sm">
              <Settings className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm">
              <User className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </nav>

      {/* Main Content Area */}
      <main className="flex-1 p-6">
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>My Week at a Glance</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-48 bg-muted/50 rounded-lg flex items-center justify-center">
                <p className="text-muted-foreground">Calendar view coming soon...</p>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Degree Progress</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="h-8 bg-muted/50 rounded" />
                <div className="h-8 bg-muted/50 rounded" />
                <div className="h-8 bg-muted/50 rounded" />
              </div>
            </CardContent>
          </Card>
        </div>
        
        <div className="grid gap-6 md:grid-cols-3 mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="h-8 bg-muted/50 rounded" />
                <div className="h-8 bg-muted/50 rounded" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Current Classes</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-2 rounded bg-muted/30">
                  <div>
                    <p className="font-medium">ECE 2214</p>
                    <p className="text-sm text-muted-foreground">Digital Design</p>
                  </div>
                  <Button variant="ghost" size="sm">View</Button>
                </div>
                <div className="flex items-center justify-between p-2 rounded bg-muted/30">
                  <div>
                    <p className="font-medium">CS 2334</p>
                    <p className="text-sm text-muted-foreground">Programming Structures</p>
                  </div>
                  <Button variant="ghost" size="sm">View</Button>
                </div>
                <div className="flex items-center justify-between p-2 rounded bg-muted/30">
                  <div>
                    <p className="font-medium">MATH 2443</p>
                    <p className="text-sm text-muted-foreground">Calculus III</p>
                  </div>
                  <Button variant="ghost" size="sm">View</Button>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Upcoming Assignments</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-sm">Lab 3 - Logic Gates</p>
                    <p className="text-xs text-muted-foreground">ECE 2214 • Due Friday</p>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-sm">Project 2 - Data Structures</p>
                    <p className="text-xs text-muted-foreground">CS 2334 • Due Monday</p>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-sm">Problem Set 8</p>
                    <p className="text-xs text-muted-foreground">MATH 2443 • Due Wednesday</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
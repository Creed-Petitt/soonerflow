import * as React from "react"
import { Plus } from "lucide-react"

import { Calendars } from "@/components/calendars"
import { DatePicker } from "@/components/date-picker"
import { NavUser } from "@/components/nav-user"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  SidebarSeparator,
} from "@/components/ui/sidebar"

// Sample OU class data
const data = {
  user: {
    name: "OU Student",
    email: "student@ou.edu",
    avatar: "/avatars/student.jpg",
  },
  selectedClass: {
    subject: "ECE",
    number: "2214",
    title: "Digital Design",
    instructor: "Dr. Smith",
    credits: 3,
    time: "MWF 10:00-10:50 AM",
    location: "Felgar Hall 300",
    rating: 4.2,
    difficulty: 3.1,
  },
  classInfo: [
    {
      name: "Class Details",
      items: ["3 Credit Hours", "MWF 10:00-10:50", "Felgar Hall 300"],
    },
    {
      name: "Professor Info", 
      items: ["Dr. Smith", "4.2/5.0 Rating", "3.1/5.0 Difficulty"],
    },
    {
      name: "Requirements",
      items: ["Major Requirement", "Prerequisite: ECE 2113"],
    },
  ],
}

export function SidebarRight({
  ...props
}: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar
      collapsible="none"
      className="sticky top-0 hidden h-svh border-l lg:flex"
      {...props}
    >
      <SidebarHeader className="border-sidebar-border h-16 border-b">
        <NavUser user={data.user} />
      </SidebarHeader>
      <SidebarContent>
        <div className="p-4">
          <h3 className="font-semibold text-lg mb-2">
            {data.selectedClass.subject} {data.selectedClass.number}
          </h3>
          <p className="text-sm text-muted-foreground mb-4">
            {data.selectedClass.title}
          </p>
        </div>
        <SidebarSeparator className="mx-0" />
        <Calendars calendars={data.classInfo} />
      </SidebarContent>
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton>
              <Plus />
              <span>Add to Schedule</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  )
}

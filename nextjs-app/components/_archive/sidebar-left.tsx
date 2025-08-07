"use client"

import * as React from "react"
import {
  Home,
  Calendar,
  Search,
  GraduationCap,
  User,
  BookOpen,
  Settings2,
} from "lucide-react"

import { NavFavorites } from "@/components/nav-favorites"
import { NavMain } from "@/components/nav-main"
import { NavSecondary } from "@/components/nav-secondary"
import { NavWorkspaces } from "@/components/nav-workspaces"
import { TeamSwitcher } from "@/components/team-switcher"
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarRail,
} from "@/components/ui/sidebar"

// OU Class Manager navigation data
const data = {
  teams: [
    {
      name: "OU Class Manager",
      logo: GraduationCap,
      plan: "Spring 2025",
    },
  ],
  navMain: [
    {
      title: "🏠 Home",
      url: "/dashboard",
      icon: Home,
      isActive: true,
    },
    {
      title: "📅 Scheduler", 
      url: "#",
      icon: Calendar,
    },
    {
      title: "🔍 Browse Classes",
      url: "#",
      icon: Search,
    },
    {
      title: "🎓 Degree Progress",
      url: "#",
      icon: GraduationCap,
    },
    {
      title: "👤 Professors",
      url: "#",
      icon: User,
    },
    {
      title: "📚 Canvas",
      url: "#",
      icon: BookOpen,
    },
  ],
  navSecondary: [
    {
      title: "⚙️ Settings",
      url: "#",
      icon: Settings2,
    },
  ],
  favorites: [
    {
      name: "Fall 2025 Schedule",
      url: "#",
      emoji: "🍂",
    },
    {
      name: "Spring 2026 Schedule",
      url: "#",
      emoji: "🌸",
    },
    {
      name: "Summer 2026 Plan",
      url: "#",
      emoji: "☀️",
    },
    {
      name: "Computer Engineering Track",
      url: "#",
      emoji: "💻",
    },
    {
      name: "Math Requirements",
      url: "#",
      emoji: "📐",
    },
    {
      name: "Gen Ed Courses",
      url: "#",
      emoji: "📚",
    },
  ],
  workspaces: [
    {
      name: "Course Planning",
      emoji: "📋",
      pages: [
        {
          name: "Fall 2025 Classes",
          url: "#",
          emoji: "🍂",
        },
        {
          name: "Spring 2026 Classes",
          url: "#",
          emoji: "🌸",
        },
        {
          name: "Summer Options",
          url: "#",
          emoji: "☀️",
        },
      ],
    },
    {
      name: "Major Requirements",
      emoji: "🎓",
      pages: [
        {
          name: "Core Engineering Courses",
          url: "#",
          emoji: "⚙️",
        },
        {
          name: "Computer Science Electives",
          url: "#",
          emoji: "💻",
        },
        {
          name: "Mathematics Requirements",
          url: "#",
          emoji: "📐",
        },
      ],
    },
    {
      name: "General Education",
      emoji: "📚",
      pages: [
        {
          name: "Natural Sciences",
          url: "#",
          emoji: "🔬",
        },
        {
          name: "Social Sciences",
          url: "#",
          emoji: "🏛️",
        },
        {
          name: "Arts & Humanities",
          url: "#",
          emoji: "🎨",
        },
      ],
    },
  ],
}

export function SidebarLeft({
  ...props
}: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar className="border-r-0" {...props}>
      <SidebarHeader>
        <TeamSwitcher teams={data.teams} />
        <NavMain items={data.navMain} />
      </SidebarHeader>
      <SidebarContent>
        <NavFavorites favorites={data.favorites} />
        <NavWorkspaces workspaces={data.workspaces} />
        <NavSecondary items={data.navSecondary} className="mt-auto" />
      </SidebarContent>
      <SidebarRail />
    </Sidebar>
  )
}

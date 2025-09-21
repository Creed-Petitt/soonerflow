"use client"

import { useId } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  CalendarDaysIcon,
} from "lucide-react"

import UserMenu from "@/components/navbar-components/user-menu"
import { Button } from "@/components/ui/button"
import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
} from "@/components/ui/navigation-menu"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

// Navigation links with icons for desktop icon-only navigation
const navigationLinks = [
  { href: "/scheduler", label: "Scheduler", icon: CalendarDaysIcon },
]

export default function CustomNavbar() {
  const id = useId()
  const pathname = usePathname()

  return (
    <header className="px-2 md:px-3 mb-2">
      <div className="flex h-14 items-center justify-between gap-4">
        {/* Left side */}
        <div className="flex flex-1 items-center gap-4">
          {/* Logo and Brand */}
          <div className="flex items-center gap-2">
            <svg width="70px" height="70px" viewBox="-102.4 -102.4 1228.80 1228.80" version="1.1" xmlns="http://www.w3.org/2000/svg" fill="#000000" transform="rotate(270)matrix(1, 0, 0, 1, 0, 0)" stroke="#000000" strokeWidth="0.01024"><g id="SVGRepo_bgCarrier" strokeWidth="0"></g><g id="SVGRepo_tracerCarrier" strokeLinecap="round" strokeLinejoin="round" stroke="#CCCCCC" strokeWidth="6.144"><path d="M625.6 516.8l19.2 81.6 104-38.4 4.8 14.4-110.4 40L560 824l-14.4-6.4 83.2-203.2-169.6-25.6 64 217.6c3.2 8-1.6 17.6-11.2 19.2s-17.6-1.6-19.2-11.2l-68.8-232-153.6-22.4 1.6-16 145.6 22.4-28.8-96-116.8 59.2-14.4-28.8 129.6-65.6L480 217.6 254.4 499.2l-12.8-9.6L480 190.4l9.6 6.4 27.2 11.2-96 227.2 177.6 41.6-64-268.8 16-3.2 67.2 278.4 136 32c8 1.6 14.4 11.2 11.2 19.2-1.6 8-11.2 14.4-19.2 11.2l-120-28.8zM608 512l-185.6-43.2 30.4 102.4 176 25.6L608 512z m-46.4-313.6l12.8-9.6L784 484.8l-12.8 9.6-209.6-296zM768 588.8l12.8 9.6-201.6 240-12.8-9.6 201.6-240z m-278.4 240l-11.2 11.2-232-243.2 11.2-11.2 232 243.2z" fill="#df0c41"></path><path d="M400 448m-64 0a64 64 0 1 0 128 0 64 64 0 1 0-128 0Z" fill="#5c5c5c"></path><path d="M640 608m-56 0a56 56 0 1 0 112 0 56 56 0 1 0-112 0Z" fill="#5c5c5c"></path><path d="M208 624c-44.8 0-80-35.2-80-80s35.2-80 80-80 80 35.2 80 80-35.2 80-80 80z m0-32c27.2 0 48-20.8 48-48s-20.8-48-48-48-48 20.8-48 48 20.8 48 48 48zM528 960c-44.8 0-80-35.2-80-80s35.2-80 80-80 80 35.2 80 80-35.2 80-80 80z m0-32c27.2 0 48-20.8 48-48s-20.8-48-48-48-48 20.8-48 48 20.8 48 48 48zM528 224c-44.8 0-80-35.2-80-80s35.2-80 80-80 80 35.2 80 80-35.2 80-80 80z m0-32c27.2 0 48-20.8 48-48s-20.8-48-48-48-48 20.8-48 48 20.8 48 48 48zM816 624c-44.8 0-80-35.2-80-80s35.2-80 80-80 80 35.2 80 80-35.2 80-80 80z m0-32c27.2 0 48-20.8 48-48s-20.8-48-48-48-48 20.8-48 48 20.8 48 48 48z" fill="#5c5c5c"></path></g><g id="SVGRepo_iconCarrier"><path d="M625.6 516.8l19.2 81.6 104-38.4 4.8 14.4-110.4 40L560 824l-14.4-6.4 83.2-203.2-169.6-25.6 64 217.6c3.2 8-1.6 17.6-11.2 19.2s-17.6-1.6-19.2-11.2l-68.8-232-153.6-22.4 1.6-16 145.6 22.4-28.8-96-116.8 59.2-14.4-28.8 129.6-65.6L480 217.6 254.4 499.2l-12.8-9.6L480 190.4l9.6 6.4 27.2 11.2-96 227.2 177.6 41.6-64-268.8 16-3.2 67.2 278.4 136 32c8 1.6 14.4 11.2 11.2 19.2-1.6 8-11.2 14.4-19.2 11.2l-120-28.8zM608 512l-185.6-43.2 30.4 102.4 176 25.6L608 512z m-46.4-313.6l12.8-9.6L784 484.8l-12.8 9.6-209.6-296zM768 588.8l12.8 9.6-201.6 240-12.8-9.6 201.6-240z m-278.4 240l-11.2 11.2-232-243.2 11.2-11.2 232 243.2z" fill="#df0c41"></path><path d="M400 448m-64 0a64 64 0 1 0 128 0 64 64 0 1 0-128 0Z" fill="#5c5c5c"></path><path d="M640 608m-56 0a56 56 0 1 0 112 0 56 56 0 1 0-112 0Z" fill="#5c5c5c"></path><path d="M208 624c-44.8 0-80-35.2-80-80s35.2-80 80-80 80 35.2 80 80-35.2 80-80 80z m0-32c27.2 0 48-20.8 48-48s-20.8-48-48-48-48 20.8-48 48 20.8 48 48 48zM528 960c-44.8 0-80-35.2-80-80s35.2-80 80-80 80 35.2 80 80-35.2 80-80 80z m0-32c27.2 0 48-20.8 48-48s-20.8-48-48-48-48 20.8-48 48 20.8 48 48 48zM528 224c-44.8 0-80-35.2-80-80s35.2-80 80-80 80 35.2 80 80-35.2 80-80 80z m0-32c27.2 0 48-20.8 48-48s-20.8-48-48-48-48 20.8-48 48 20.8 48 48 48zM816 624c-44.8 0-80-35.2-80-80s35.2-80 80-80 80 35.2 80 80-35.2 80-80 80z m0-32c27.2 0 48-20.8 48-48s-20.8-48-48-48-48 20.8-48 48 20.8 48 48 48z" fill="#5c5c5c"></path></g></svg>
            <span className="font-bold text-2xl text-foreground">SoonerFlow</span>
          </div>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                className="group size-8 md:hidden"
                variant="ghost"
                size="icon"
              >
                <svg
                  className="pointer-events-none"
                  width={16}
                  height={16}
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M4 12L20 12"
                    className="origin-center -translate-y-[7px] transition-all duration-300 ease-[cubic-bezier(.5,.85,.25,1.1)] group-aria-expanded:translate-x-0 group-aria-expanded:translate-y-0 group-aria-expanded:rotate-[315deg]"
                  />
                  <path
                    d="M4 12H20"
                    className="origin-center transition-all duration-300 ease-[cubic-bezier(.5,.85,.25,1.8)] group-aria-expanded:rotate-45"
                  />
                  <path
                    d="M4 12H20"
                    className="origin-center translate-y-[7px] transition-all duration-300 ease-[cubic-bezier(.5,.85,.25,1.1)] group-aria-expanded:translate-y-0 group-aria-expanded:rotate-[135deg]"
                  />
                </svg>
              </Button>
            </PopoverTrigger>
            <PopoverContent align="start" className="w-36 p-1 md:hidden">
              <NavigationMenu className="max-w-none *:w-full">
                <NavigationMenuList className="flex-col items-start gap-0 md:gap-2">
                  {navigationLinks.map((link, index) => {
                    const Icon = link.icon
                    const isActive = pathname === link.href
                    return (
                      <NavigationMenuItem key={index} className="w-full">
                        {(link as any).disabled ? (
                          <div className="flex-row items-center gap-2 py-1.5 px-3 text-muted-foreground cursor-not-allowed">
                            <Icon
                              size={16}
                              className="text-muted-foreground opacity-50"
                              aria-hidden="true"
                            />
                            <span className="opacity-50">{link.label}</span>
                          </div>
                        ) : (
                          <NavigationMenuLink
                            href={link.href}
                            className="flex-row items-center gap-2 py-1.5"
                            active={isActive}
                          >
                            <Icon
                              size={16}
                              className="text-muted-foreground"
                              aria-hidden="true"
                            />
                            <span>{link.label}</span>
                          </NavigationMenuLink>
                        )}
                      </NavigationMenuItem>
                    )
                  })}
                </NavigationMenuList>
              </NavigationMenu>
            </PopoverContent>
          </Popover>
          <div className="flex items-center gap-2">
            <NavigationMenu className="hidden md:flex">
              <NavigationMenuList className="gap-1">
                <TooltipProvider>
                  {navigationLinks.map((link) => {
                    const isActive = pathname === link.href
                    return (
                      <NavigationMenuItem key={link.label}>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            {(link as any).disabled ? (
                              <div className="flex size-8 items-center justify-center p-1.5 rounded-md text-muted-foreground opacity-50 cursor-not-allowed">
                                <link.icon size={18} aria-hidden="true" />
                                <span className="sr-only">{link.label}</span>
                              </div>
                            ) : (
                              <NavigationMenuLink
                                href={link.href}
                                className={`flex size-8 items-center justify-center p-1.5 rounded-md transition-colors ${
                                  isActive 
                                    ? "bg-muted text-foreground" 
                                    : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                                }`}
                              >
                                <link.icon size={18} aria-hidden="true" />
                                <span className="sr-only">{link.label}</span>
                              </NavigationMenuLink>
                            )}
                          </TooltipTrigger>
                          <TooltipContent
                            side="bottom"
                            className="px-2 py-1 text-xs bg-background border"
                          >
                            <p>{link.label}</p>
                          </TooltipContent>
                        </Tooltip>
                      </NavigationMenuItem>
                    )
                  })}
                </TooltipProvider>
              </NavigationMenuList>
            </NavigationMenu>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <UserMenu />
        </div>
      </div>
    </header>
  )
}
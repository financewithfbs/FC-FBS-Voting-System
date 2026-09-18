"use client"

import { usePathname } from "next/navigation"
import Navbar from "@/components/Navbar"

export default function LayoutShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const isAuthRoute = pathname?.startsWith("/auth/")

  if (isAuthRoute) {
    return <>{children}</>
  }

  return (
    <>
      <Navbar />
      <main className="container mx-auto px-4 py-8">{children}</main>
    </>
  )
}
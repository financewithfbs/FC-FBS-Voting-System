"use client"

import { useSession } from "next-auth/react"
import { useRouter, usePathname } from "next/navigation"
import { useEffect, useRef, useState } from "react"

type Role = "ADMIN" | "USER" | string | undefined

export default function Home() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const pathname = usePathname()
  const redirectingRef = useRef(false)
  const [phase, setPhase] = useState<"checking" | "redirecting">("checking")

  useEffect(() => {
    // Only act on the root route
    if (pathname !== "/") return

    // Wait until session status is resolved
    if (status === "loading") {
      setPhase("checking")
      return
    }

    // Guard against double-firing (React Strict Mode, fast re-renders, etc.)
    if (redirectingRef.current) return
    redirectingRef.current = true

    setPhase("redirecting")

    if (status === "authenticated") {
      const role = (session?.user as { role?: Role })?.role
      const target = role === "ADMIN" ? "/admin" : "/vote"

      // Slight delay lets the spinner animate in before the route swaps
      const t = setTimeout(() => router.replace(target), 150)
      return () => clearTimeout(t)
    }

    // Not authenticated
    const t = setTimeout(() => router.replace("/auth/signup"), 150)
    return () => clearTimeout(t)
  }, [status, session, router, pathname])

  return (
    <div
      className="min-h-[100dvh] bg-gradient-to-br from-purple-50 via-white to-indigo-50 dark:from-[#0f0d1a] dark:via-[#131029] dark:to-[#1b1440] flex items-center justify-center px-6"
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <div className="text-center max-w-sm">
        {/* Spinner */}
        <div className="relative mx-auto w-20 h-20">
          <div className="absolute inset-0 border-4 border-purple-200 dark:border-purple-900 rounded-full" />
          <div className="absolute inset-0 border-4 border-transparent border-t-purple-600 dark:border-t-purple-400 rounded-full animate-spin" />
          <div className="absolute inset-0 bg-gradient-to-r from-purple-600/20 to-indigo-600/20 rounded-full blur-2xl animate-pulse" />
        </div>

        {/* Text */}
        <p className="mt-6 text-xl font-semibold bg-gradient-to-r from-purple-600 to-indigo-600 dark:from-purple-400 dark:to-indigo-400 bg-clip-text text-transparent">
          {phase === "checking" ? "Checking your session…" : "Redirecting…"}
        </p>
        <p className="text-gray-500 dark:text-gray-400 mt-2 text-sm">
          {phase === "checking"
            ? "This will only take a moment"
            : "Please wait while we set up your experience"}
        </p>

        {/* Dots indicator */}
        <div className="mt-6 flex items-center justify-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-purple-500/70 dark:bg-purple-400/70 animate-bounce [animation-delay:-0.3s]" />
          <span className="w-2 h-2 rounded-full bg-purple-500/70 dark:bg-purple-400/70 animate-bounce [animation-delay:-0.15s]" />
          <span className="w-2 h-2 rounded-full bg-purple-500/70 dark:bg-purple-400/70 animate-bounce" />
        </div>
      </div>
    </div>
  )
}
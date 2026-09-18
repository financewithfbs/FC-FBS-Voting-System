"use client"

import Link from "next/link"
import { useSession, signOut } from "next-auth/react"
import { useState, useEffect, useRef } from "react"
import Image from "next/image"
import { usePathname } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"

export default function Navbar() {
  const { data: session } = useSession()
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [showDropdown, setShowDropdown] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const mobileMenuRef = useRef<HTMLDivElement>(null)
  const pathname = usePathname()

  // Check if current page is auth page
  const isAuthPage = pathname === "/auth/signin" || pathname === "/auth/signup"

  // Scroll effect
  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  // Click-outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (mobileMenuRef.current && !mobileMenuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false)
      }
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  // Lock scroll when mobile menu open
  useEffect(() => {
    if (isMenuOpen) {
      document.body.style.overflow = "hidden"
    } else {
      document.body.style.overflow = ""
    }
    return () => {
      document.body.style.overflow = ""
    }
  }, [isMenuOpen])

  const getInitials = (email: string | null | undefined) => {
    if (!email) return "U"
    return email.substring(0, 2).toUpperCase()
  }

  if (isAuthPage) return null

  return (
    <>
      {/* ───────── Main navbar ───────── */}
      <motion.nav
        initial={{ y: -80, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className={`
          fixed top-0 left-0 w-full z-[1002]
          transition-all duration-500
          ${scrolled
            ? "bg-white/75 dark:bg-[#0f0d1a]/85 backdrop-blur-2xl shadow-[0_8px_30px_-8px_rgba(99,86,215,0.25)] dark:shadow-[0_8px_30px_-8px_rgba(0,0,0,0.7)] border-b border-white/60 dark:border-white/10"
            : "bg-white/55 dark:bg-[#0f0d1a]/60 backdrop-blur-xl border-b border-white/40 dark:border-white/5"
          }
        `}
      >
        {/* Gradient hairline at the bottom edge */}
        <div className="absolute inset-x-0 -bottom-px h-px bg-gradient-to-r from-transparent via-[#7E5FFF]/40 to-transparent" />

        <div className="w-full px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16 md:h-20">
            {/* ───────── Logo + brand ───────── */}
            <Link href="/" className="flex items-center gap-2 sm:gap-3 group">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-br from-[#6356D7] to-[#7E5FFF] rounded-full blur-xl opacity-40 group-hover:opacity-70 transition-all duration-500" />
                <Image
                  src="/images/Transparent logo.png"
                  alt="Finance Committee logo"
                  width={100}
                  height={100}
                  className="relative w-10 h-10 md:w-14 md:h-14 object-contain drop-shadow-[0_4px_12px_rgba(140,91,255,0.4)] transition-all duration-500 group-hover:scale-110"
                  priority
                />
              </div>

              <div className="flex flex-col leading-tight min-w-0">
                <span className="block bg-gradient-to-r from-[#6356D7] via-[#7E5FFF] to-[#a385ff] bg-clip-text text-transparent text-sm sm:text-lg md:text-xl font-bold truncate">
                  FC Voting System
                </span>
                <span className="block text-[#6d6a7c] dark:text-gray-400 text-[10px] sm:text-xs md:text-sm font-medium tracking-wide">
                  FOSTIIMA Chapter
                </span>
              </div>
            </Link>

            {/* ───────── Desktop actions ───────── */}
            <div className="hidden md:flex items-center gap-4">
              {session ? (
                <>
                  {/* Primary CTA */}
                  <Link
                    href={session.user?.role === "ADMIN" ? "/admin" : "/debates"}
                    className="relative group"
                  >
                    <div className="absolute -inset-0.5 bg-gradient-to-r from-[#6356D7] via-[#7E5FFF] to-[#a385ff] rounded-2xl blur-lg opacity-60 group-hover:opacity-95 transition-all duration-300" />
                    <div className="relative px-5 py-2.5 rounded-2xl bg-gradient-to-r from-[#6356D7] via-[#7E5FFF] to-[#a385ff] bg-[length:200%_100%] group-hover:bg-[position:100%_0] text-white text-sm font-semibold shadow-lg transition-[background-position] duration-700 overflow-hidden flex items-center gap-2">
                      <span className="absolute inset-x-0 top-0 h-px bg-white/40 rounded-t-2xl" />
                      <span className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/30 to-transparent" />
                      <span className="relative">
                        {session.user?.role === "ADMIN" ? "Admin Panel" : "Vote Now"}
                      </span>
                      <svg
                        className="relative w-4 h-4 transition-transform group-hover:translate-x-0.5"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M5 12h14M12 5l7 7-7 7" />
                      </svg>
                    </div>
                  </Link>

                  {/* Profile dropdown */}
                  <div className="relative" ref={dropdownRef}>
                    <button
                      onClick={() => setShowDropdown(!showDropdown)}
                      className="relative group"
                      aria-label="Open profile menu"
                    >
                      <div className="absolute -inset-1 bg-gradient-to-r from-[#6356D7] to-[#7E5FFF] rounded-full blur-lg opacity-50 group-hover:opacity-90 transition-all duration-300" />
                      <div className="relative w-11 h-11 rounded-full bg-gradient-to-br from-[#6356D7] via-[#7E5FFF] to-[#a385ff] text-white flex items-center justify-center text-sm font-bold shadow-lg border-2 border-white/70 dark:border-white/20 group-hover:border-white group-hover:scale-105 transition-all duration-300">
                        {getInitials(session.user?.email)}
                      </div>
                      {session.user?.role === "AUDIENCE" && (
                        <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-green-500 border-2 border-white dark:border-[#0f0d1a] shadow-[0_0_10px_rgba(34,197,94,0.8)]">
                          <span className="absolute inset-0 rounded-full bg-green-400 animate-ping" />
                        </span>
                      )}
                    </button>

                    <AnimatePresence>
                      {showDropdown && (
                        <motion.div
                          initial={{ opacity: 0, y: -8, scale: 0.96 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: -8, scale: 0.96 }}
                          transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
                          className="absolute right-0 mt-3 w-72 rounded-2xl p-[1px] bg-gradient-to-b from-[#6356D7]/40 to-transparent z-50"
                        >
                          <div className="rounded-2xl overflow-hidden bg-white/95 dark:bg-[#0f0d1a]/95 backdrop-blur-xl border border-white/60 dark:border-white/10 shadow-[0_20px_60px_-20px_rgba(99,86,215,0.5)] dark:shadow-[0_20px_60px_-20px_rgba(0,0,0,0.9)]">
                            {/* Header */}
                            <div className="p-4 border-b border-gray-100 dark:border-white/5">
                              <p className="text-[10px] uppercase tracking-widest font-semibold text-gray-500 dark:text-gray-400 mb-1">
                                Signed in as
                              </p>
                              <p className="font-semibold text-[#313053] dark:text-white break-all text-sm">
                                {session.user?.email}
                              </p>
                            </div>

                            {/* Role + status */}
                            <div className="p-4 border-b border-gray-100 dark:border-white/5 flex items-center justify-between gap-2">
                              <span className="text-[10px] font-bold uppercase tracking-widest bg-gradient-to-r from-[#6356D7] to-[#7E5FFF] text-white px-3 py-1 rounded-full shadow-sm">
                                {session.user?.role}
                              </span>
                              {session.user?.role === "AUDIENCE" && (
                                <span className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/25 px-2.5 py-1 rounded-full border border-green-200/70 dark:border-green-900/40">
                                  <span className="relative flex w-1.5 h-1.5">
                                    <span className="absolute inline-flex h-full w-full rounded-full bg-green-500 opacity-75 animate-ping" />
                                    <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-green-500" />
                                  </span>
                                  Can Vote
                                </span>
                              )}
                            </div>

                            {/* Sign out */}
                            <div className="p-3">
                              <button
                                onClick={() => signOut()}
                                className="relative group w-full overflow-hidden rounded-xl"
                              >
                                <div className="absolute -inset-0.5 bg-gradient-to-r from-red-500 to-rose-500 rounded-xl blur-md opacity-50 group-hover:opacity-90 transition-all duration-300" />
                                <div className="relative w-full py-2.5 bg-gradient-to-r from-red-500 via-rose-500 to-red-500 bg-[length:200%_100%] group-hover:bg-[position:100%_0] text-white rounded-xl text-sm font-semibold shadow-md transition-[background-position] duration-700 flex items-center justify-center gap-2">
                                  <span className="absolute inset-x-0 top-0 h-px bg-white/40 rounded-t-xl" />
                                  <svg className="relative w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                                  </svg>
                                  <span className="relative">Sign Out</span>
                                </div>
                              </button>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </>
              ) : (
                <div className="flex items-center gap-3">
                  <Link
                    href="/auth/signin"
                    className="group relative px-5 py-2.5 rounded-2xl border-2 border-[#6356D7]/60 dark:border-[#7E5FFF]/50 text-[#6356D7] dark:text-[#b3a6ff] text-sm font-semibold hover:bg-gradient-to-r hover:from-[#6356D7] hover:to-[#7E5FFF] hover:text-white hover:border-transparent transition-all duration-300 transform hover:scale-[1.03] shadow-sm hover:shadow-lg"
                  >
                    Sign In
                  </Link>

                  <Link href="/auth/signup" className="relative group">
                    <div className="absolute -inset-0.5 bg-gradient-to-r from-[#6356D7] via-[#7E5FFF] to-[#a385ff] rounded-2xl blur-lg opacity-60 group-hover:opacity-95 transition-all duration-300" />
                    <div className="relative px-5 py-2.5 rounded-2xl bg-gradient-to-r from-[#6356D7] via-[#7E5FFF] to-[#a385ff] bg-[length:200%_100%] group-hover:bg-[position:100%_0] text-white text-sm font-semibold shadow-lg transition-[background-position] duration-700 overflow-hidden flex items-center gap-2">
                      <span className="absolute inset-x-0 top-0 h-px bg-white/40 rounded-t-2xl" />
                      <span className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/30 to-transparent" />
                      <span className="relative">Sign Up</span>
                    </div>
                  </Link>
                </div>
              )}
            </div>

            {/* ───────── Mobile toggle ───────── */}
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="md:hidden relative w-11 h-11 rounded-2xl bg-white/70 dark:bg-white/[0.05] border border-white/70 dark:border-white/10 backdrop-blur-xl flex items-center justify-center shadow-sm transition-all duration-300 hover:scale-105"
              aria-label="Toggle menu"
              aria-expanded={isMenuOpen}
            >
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-[#6356D7]/20 to-[#7E5FFF]/20 blur-md" />
              <div className="relative flex flex-col items-center justify-center space-y-1.5">
                <span className={`block w-5 h-0.5 bg-gradient-to-r from-[#6356D7] to-[#7E5FFF] rounded-full transition-all duration-300 ${isMenuOpen ? "rotate-45 translate-y-2" : ""}`} />
                <span className={`block w-5 h-0.5 bg-gradient-to-r from-[#6356D7] to-[#7E5FFF] rounded-full transition-all duration-300 ${isMenuOpen ? "opacity-0 scale-x-0" : ""}`} />
                <span className={`block w-5 h-0.5 bg-gradient-to-r from-[#6356D7] to-[#7E5FFF] rounded-full transition-all duration-300 ${isMenuOpen ? "-rotate-45 -translate-y-2" : ""}`} />
              </div>
            </button>
          </div>
        </div>
      </motion.nav>

      {/* ───────── Spacer ───────── */}
      <div className="h-16 md:h-20" />

      {/* ───────── Session info bar ───────── */}
      <AnimatePresence>
        {session && (
          <motion.div
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -20, opacity: 0 }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            className={`
              fixed top-16 md:top-20 left-0 w-full z-[1001]
              transition-all duration-300
              ${scrolled
                ? "bg-white/70 dark:bg-[#0f0d1a]/80 backdrop-blur-xl"
                : "bg-white/55 dark:bg-[#0f0d1a]/60 backdrop-blur-md"
              }
              border-b border-white/50 dark:border-white/5
            `}
          >
            <div className="absolute inset-x-0 -bottom-px h-px bg-gradient-to-r from-transparent via-[#7E5FFF]/30 to-transparent" />

            <div className="w-full px-4 sm:px-6 lg:px-8">
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center py-2 text-xs sm:text-sm gap-1.5 sm:gap-0">
                <div className="flex items-center gap-2 sm:gap-3 overflow-hidden">
                  <span className="text-[#6d6a7c] dark:text-gray-400 whitespace-nowrap text-[11px] sm:text-xs">
                    Welcome back,
                  </span>
                  <span className="font-semibold text-[#313053] dark:text-gray-100 truncate max-w-[140px] sm:max-w-[260px] md:max-w-[380px] text-[11px] sm:text-xs">
                    {session.user?.email}
                  </span>
                  <span className="shrink-0 text-[9px] sm:text-[10px] font-bold uppercase tracking-widest bg-gradient-to-r from-[#6356D7] to-[#7E5FFF] text-white px-2.5 py-1 rounded-full shadow-sm">
                    {session.user?.role}
                  </span>
                </div>

                {session.user?.role === "AUDIENCE" && (
                  <span className="inline-flex items-center gap-1.5 text-[10px] sm:text-[11px] font-semibold uppercase tracking-wider text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/25 px-2.5 py-1 rounded-full border border-green-200/70 dark:border-green-900/40 w-fit">
                    <span className="relative flex w-1.5 h-1.5">
                      <span className="absolute inline-flex h-full w-full rounded-full bg-green-500 opacity-75 animate-ping" />
                      <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-green-500" />
                    </span>
                    Voting Access
                  </span>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ───────── Mobile menu ───────── */}
      <AnimatePresence>
        {isMenuOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
              className="md:hidden fixed inset-0 z-[999] bg-black/30 dark:bg-black/60 backdrop-blur-sm"
              onClick={() => setIsMenuOpen(false)}
            />

            {/* Panel */}
            <motion.div
              ref={mobileMenuRef}
              initial={{ y: -20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -20, opacity: 0 }}
              transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
              className="md:hidden fixed top-16 left-0 right-0 w-full z-[1000] px-3 pt-3 pb-6"
              style={{ maxHeight: "calc(100vh - 4rem)", overflowY: "auto" }}
            >
              <div className="relative rounded-3xl overflow-hidden bg-white/95 dark:bg-[#0f0d1a]/95 backdrop-blur-2xl border border-white/70 dark:border-white/10 shadow-[0_20px_60px_-20px_rgba(99,86,215,0.5)] dark:shadow-[0_20px_60px_-20px_rgba(0,0,0,0.9)]">
                {/* Top hairline */}
                <div className="absolute inset-x-8 -top-px h-px bg-gradient-to-r from-transparent via-[#7E5FFF]/60 to-transparent" />

                <div className="p-4 space-y-3">
                  {/* Leaderboard (featured row) */}
                  <Link
                    href="/leaderboard"
                    onClick={() => setIsMenuOpen(false)}
                    className="relative group block"
                  >
                    <div className="absolute -inset-0.5 bg-gradient-to-r from-amber-400 via-orange-400 to-amber-400 rounded-2xl blur-md opacity-0 group-hover:opacity-70 transition-all duration-300" />
                    <div className="relative flex items-center gap-3 p-3.5 rounded-2xl bg-gradient-to-r from-amber-50/90 to-orange-50/90 dark:from-amber-900/25 dark:to-orange-900/20 border border-amber-200/70 dark:border-amber-900/40 backdrop-blur-sm transition-all duration-300 group-hover:scale-[1.01]">
                      <div className="shrink-0 w-11 h-11 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-white shadow-lg">
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                        </svg>
                      </div>
                      <div className="flex-1 min-w-0">
                        <span className="block font-bold text-gray-900 dark:text-white text-sm">
                          Leaderboard
                        </span>
                        <span className="block text-[11px] text-gray-500 dark:text-gray-400">
                          View debate results
                        </span>
                      </div>
                      <svg className="w-4 h-4 text-gray-400 transition-transform group-hover:translate-x-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M9 18l6-6-6-6" />
                      </svg>
                    </div>
                  </Link>

                  {session ? (
                    <div className="space-y-3">
                      {/* Primary CTA */}
                      <Link
                        href={session.user?.role === "ADMIN" ? "/admin" : "/debates"}
                        onClick={() => setIsMenuOpen(false)}
                        className="relative group block"
                      >
                        <div className="absolute -inset-0.5 bg-gradient-to-r from-[#6356D7] via-[#7E5FFF] to-[#a385ff] rounded-2xl blur-lg opacity-60 group-hover:opacity-95 transition-all duration-300" />
                        <div className="relative flex items-center gap-3 p-4 rounded-2xl bg-gradient-to-r from-[#6356D7] via-[#7E5FFF] to-[#a385ff] bg-[length:200%_100%] group-hover:bg-[position:100%_0] text-white shadow-lg transition-[background-position] duration-700 overflow-hidden group-hover:scale-[1.01]">
                          <span className="absolute inset-x-0 top-0 h-px bg-white/40 rounded-t-2xl" />
                          <span className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/30 to-transparent" />
                          <div className="relative shrink-0 w-11 h-11 rounded-xl bg-white/20 backdrop-blur flex items-center justify-center border border-white/30">
                            {session.user?.role === "ADMIN" ? (
                              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                            ) : (
                              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                              </svg>
                            )}
                          </div>
                          <div className="relative flex-1 min-w-0">
                            <span className="block font-bold text-base">
                              {session.user?.role === "ADMIN" ? "Admin Panel" : "Vote Now"}
                            </span>
                            <span className="block text-white/80 text-xs">
                              {session.user?.role === "ADMIN"
                                ? "Manage debates & scores"
                                : "Cast your vote in debates"}
                            </span>
                          </div>
                        </div>
                      </Link>

                      {/* User card */}
                      <div className="relative rounded-2xl p-[1px] bg-gradient-to-br from-[#6356D7]/30 via-[#7E5FFF]/20 to-transparent">
                        <div className="rounded-2xl bg-white/80 dark:bg-white/[0.04] backdrop-blur-xl p-4 border border-white/70 dark:border-white/10">
                          <div className="flex items-center gap-3 mb-4">
                            <div className="relative shrink-0">
                              <div className="absolute inset-0 bg-gradient-to-br from-[#6356D7] to-[#7E5FFF] rounded-full blur-md opacity-60" />
                              <div className="relative w-12 h-12 rounded-full bg-gradient-to-br from-[#6356D7] via-[#7E5FFF] to-[#a385ff] text-white flex items-center justify-center text-base font-bold shadow-lg border-2 border-white/70 dark:border-white/20">
                                {getInitials(session.user?.email)}
                              </div>
                              {session.user?.role === "AUDIENCE" && (
                                <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-green-500 border-2 border-white dark:border-[#0f0d1a]">
                                  <span className="absolute inset-0 rounded-full bg-green-400 animate-ping" />
                                </span>
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-[10px] uppercase tracking-widest font-semibold text-gray-500 dark:text-gray-400 mb-1">
                                Signed in as
                              </p>
                              <p className="font-semibold text-[#313053] dark:text-white text-xs break-all">
                                {session.user?.email}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center justify-between gap-2 mb-4">
                            <span className="text-[10px] font-bold uppercase tracking-widest bg-gradient-to-r from-[#6356D7] to-[#7E5FFF] text-white px-3 py-1 rounded-full shadow-sm">
                              {session.user?.role}
                            </span>
                            {session.user?.role === "AUDIENCE" && (
                              <span className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/25 px-2.5 py-1 rounded-full border border-green-200/70 dark:border-green-900/40">
                                <span className="relative flex w-1.5 h-1.5">
                                  <span className="absolute inline-flex h-full w-full rounded-full bg-green-500 opacity-75 animate-ping" />
                                  <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-green-500" />
                                </span>
                                Can Vote
                              </span>
                            )}
                          </div>

                          <button
                            onClick={() => {
                              signOut()
                              setIsMenuOpen(false)
                            }}
                            className="relative group w-full overflow-hidden rounded-xl"
                          >
                            <div className="absolute -inset-0.5 bg-gradient-to-r from-red-500 to-rose-500 rounded-xl blur-md opacity-50 group-hover:opacity-90 transition-all duration-300" />
                            <div className="relative w-full py-3 bg-gradient-to-r from-red-500 via-rose-500 to-red-500 bg-[length:200%_100%] group-hover:bg-[position:100%_0] text-white rounded-xl text-sm font-semibold shadow-md transition-[background-position] duration-700 flex items-center justify-center gap-2">
                              <span className="absolute inset-x-0 top-0 h-px bg-white/40 rounded-t-xl" />
                              <svg className="relative w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                              </svg>
                              <span className="relative">Sign Out</span>
                            </div>
                          </button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <Link
                        href="/auth/signin"
                        onClick={() => setIsMenuOpen(false)}
                        className="relative group block"
                      >
                        <div className="relative flex items-center gap-3 p-4 rounded-2xl border-2 border-[#6356D7]/60 dark:border-[#7E5FFF]/50 text-[#6356D7] dark:text-[#b3a6ff] hover:bg-gradient-to-r hover:from-[#6356D7] hover:to-[#7E5FFF] hover:text-white hover:border-transparent transition-all duration-300 group-hover:scale-[1.01]">
                          <div className="shrink-0 w-11 h-11 rounded-xl bg-[#6356D7]/10 dark:bg-[#6356D7]/20 flex items-center justify-center group-hover:bg-white/20 transition-all duration-300">
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                            </svg>
                          </div>
                          <div className="flex-1 min-w-0">
                            <span className="block font-bold text-base">Sign In</span>
                            <span className="block text-xs opacity-80">Access your account</span>
                          </div>
                        </div>
                      </Link>

                      <Link
                        href="/auth/signup"
                        onClick={() => setIsMenuOpen(false)}
                        className="relative group block"
                      >
                        <div className="absolute -inset-0.5 bg-gradient-to-r from-[#6356D7] via-[#7E5FFF] to-[#a385ff] rounded-2xl blur-lg opacity-60 group-hover:opacity-95 transition-all duration-300" />
                        <div className="relative flex items-center gap-3 p-4 rounded-2xl bg-gradient-to-r from-[#6356D7] via-[#7E5FFF] to-[#a385ff] bg-[length:200%_100%] group-hover:bg-[position:100%_0] text-white shadow-lg transition-[background-position] duration-700 overflow-hidden group-hover:scale-[1.01]">
                          <span className="absolute inset-x-0 top-0 h-px bg-white/40 rounded-t-2xl" />
                          <span className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/30 to-transparent" />
                          <div className="relative shrink-0 w-11 h-11 rounded-xl bg-white/20 backdrop-blur flex items-center justify-center border border-white/30">
                            <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                            </svg>
                          </div>
                          <div className="relative flex-1 min-w-0">
                            <span className="block font-bold text-base">Sign Up</span>
                            <span className="block text-white/80 text-xs">Create new account</span>
                          </div>
                        </div>
                      </Link>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  )
}
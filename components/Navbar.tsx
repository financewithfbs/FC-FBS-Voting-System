"use client"

import Link from "next/link"
import { useSession, signOut } from "next-auth/react"
import { useState, useEffect, useRef } from "react"
import Image from "next/image"
import { usePathname } from "next/navigation"

export default function Navbar() {
  const { data: session } = useSession()
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [showDropdown, setShowDropdown] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const mobileMenuRef = useRef<HTMLDivElement>(null)
  const pathname = usePathname()

  // Check if current page is auth page
  const isAuthPage = pathname === '/auth/signin' || pathname === '/auth/signup'

  // Handle scroll effect
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20)
    }
    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  // Handle click outside for mobile menu
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

  const getInitials = (email: string | null | undefined) => {
    if (!email) return "U"
    return email.substring(0, 2).toUpperCase()
  }

  // Don't render navbar on auth pages
  if (isAuthPage) {
    return null
  }

  return (
    <>
      <nav className={`fixed top-0 left-0 w-full z-[1002] transition-all duration-500 ${
        scrolled 
          ? 'backdrop-blur-xl bg-gradient-to-r from-[#ede9fe]/95 via-[#e9d5ff]/95 to-[#ddd6fe]/95 shadow-lg' 
          : 'backdrop-blur-md bg-gradient-to-r from-[#ede9fe]/90 via-[#e9d5ff]/90 to-[#ddd6fe]/90 shadow-md'
      } border-b border-white/30 flex items-center`}>
        <div className="w-full px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16 md:h-20">
            {/* Logo and Brand */}
            <div className="flex items-center space-x-2 sm:space-x-3">
              <div className="relative group">
                <Image
                  src="/images/Transparent logo.png"
                  alt="Finance Committee logo"
                  width={100}
                  height={100}
                  className="w-10 h-10 md:w-14 md:h-14 object-contain drop-shadow-[0_4px_12px_rgba(140,91,255,0.3)] transition-all duration-300 group-hover:scale-110 group-hover:drop-shadow-[0_6px_16px_rgba(140,91,255,0.5)]"
                  priority
                />
                <div className="absolute inset-0 bg-gradient-to-r from-[#8C5BFF]/20 to-[#6356D7]/20 rounded-full blur-xl group-hover:blur-2xl transition-all duration-300"></div>
              </div>

              <Link href="/" className="flex flex-col">
                <span className="block bg-gradient-to-r from-[#8C5BFF] to-[#6356D7] bg-clip-text text-transparent text-base sm:text-xl md:text-2xl font-bold cursor-pointer hover:from-[#6356D7] hover:to-[#8C5BFF] transition-all duration-300">
                  FC Voting System
                </span>
                <span className="block text-[#6d6a7c] text-xs sm:text-sm md:text-base font-medium tracking-wide">
                  FOSTIIMA Chapter
                </span>
              </Link>
            </div>

            {/* Desktop Menu - Right Side */}
            <div className="hidden md:flex items-center space-x-8">
              {/* Uncomment Leaderboard link if needed */}
              {/* <Link 
                href="/leaderboard" 
                className="text-[#313053] hover:text-[#8C5BFF] transition-all duration-300 text-base font-medium px-3 py-2 relative group"
              >
                Leaderboard
                <span className="absolute bottom-0 left-1/2 w-0 h-0.5 bg-gradient-to-r from-[#8C5BFF] to-[#6356D7] group-hover:w-full group-hover:left-0 transition-all duration-300"></span>
              </Link> */}
              
              {session ? (
                <div className="flex items-center space-x-4">
                  {session.user?.role !== "ADMIN" && (
                    <Link 
                      href="/debates" 
                      className="relative group"
                    >
                      <div className="absolute inset-0 bg-gradient-to-r from-[#8C5BFF] to-[#6356D7] rounded-xl blur-lg group-hover:blur-xl opacity-50 group-hover:opacity-75 transition-all duration-300"></div>
                      <span className="relative block bg-gradient-to-r from-[#8C5BFF] to-[#6356D7] text-white px-6 py-2.5 rounded-xl text-sm font-medium hover:shadow-2xl transform hover:scale-105 transition-all duration-300">
                        Vote Now
                      </span>
                    </Link>
                  )}
                  
                  {session.user?.role === "ADMIN" && (
                    <Link 
                      href="/admin" 
                      className="relative group"
                    >
                      <div className="absolute inset-0 bg-gradient-to-r from-[#8C5BFF] to-[#6356D7] rounded-xl blur-lg group-hover:blur-xl opacity-50 group-hover:opacity-75 transition-all duration-300"></div>
                      <span className="relative block bg-gradient-to-r from-[#8C5BFF] to-[#6356D7] text-white px-6 py-2.5 rounded-xl text-sm font-medium hover:shadow-2xl transform hover:scale-105 transition-all duration-300">
                        Admin Panel
                      </span>
                    </Link>
                  )}
                  
                  {/* Profile Dropdown */}
                  <div className="relative" ref={dropdownRef}>
                    <button
                      onClick={() => setShowDropdown(!showDropdown)}
                      className="relative group"
                    >
                      <div className="absolute inset-0 bg-gradient-to-r from-[#8C5BFF] to-[#6356D7] rounded-full blur-md group-hover:blur-lg opacity-60 group-hover:opacity-80 transition-all duration-300"></div>
                      <div className="relative w-11 h-11 rounded-full bg-gradient-to-r from-[#8C5BFF] to-[#6356D7] text-white flex items-center justify-center text-sm font-bold shadow-lg cursor-pointer border-2 border-white/50 group-hover:border-white group-hover:scale-110 transition-all duration-300">
                        {getInitials(session.user?.email)}
                      </div>
                    </button>
                    
                    {showDropdown && (
                      <div className="absolute right-0 mt-3 w-72 bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl p-5 z-50 border border-[#ddd6fe] animate-fade-in-down">
                        <div className="mb-4 pb-4 border-b border-[#ede9fe]">
                          <p className="text-xs text-[#6d6a7c] mb-1">Signed in as</p>
                          <p className="font-semibold text-[#313053] break-all text-sm">{session.user?.email}</p>
                        </div>
                        <div className="flex items-center justify-between mb-4">
                          <span className="text-xs bg-gradient-to-r from-[#ede9fe] to-[#f6f3ff] text-[#8C5BFF] px-4 py-2 rounded-full font-semibold shadow-sm border border-[#ddd6fe]">
                            {session.user?.role}
                          </span>
                          {session.user?.role === "AUDIENCE" && (
                            <span className="text-xs text-green-600 flex items-center bg-green-50 px-3 py-1.5 rounded-full">
                              <svg className="w-4 h-4 mr-1 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                              </svg>
                              Can Vote
                            </span>
                          )}
                        </div>
                        <button
                          onClick={() => signOut()}
                          className="w-full px-4 py-3 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-xl hover:shadow-xl transform hover:scale-[1.02] transition-all duration-300 text-sm font-medium relative group"
                        >
                          <div className="absolute inset-0 bg-gradient-to-r from-red-500 to-red-600 rounded-xl blur-md group-hover:blur-lg opacity-50"></div>
                          <span className="relative">Sign Out</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="flex items-center space-x-4">
                  <Link 
                    href="/auth/signin" 
                    className="relative group"
                  >
                    <span className="relative block text-[#8C5BFF] border-2 border-[#8C5BFF] px-6 py-2.5 rounded-xl text-sm font-medium hover:bg-gradient-to-r hover:from-[#8C5BFF] hover:to-[#6356D7] hover:text-white hover:border-transparent transition-all duration-300 transform hover:scale-105 shadow-md hover:shadow-xl">
                      Sign In
                    </span>
                  </Link>
                  <Link 
                    href="/auth/signup" 
                    className="relative group"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-[#8C5BFF] to-[#6356D7] rounded-xl blur-lg group-hover:blur-xl opacity-50 group-hover:opacity-75 transition-all duration-300"></div>
                    <span className="relative block bg-gradient-to-r from-[#8C5BFF] to-[#6356D7] text-white px-6 py-2.5 rounded-xl text-sm font-medium hover:shadow-2xl transform hover:scale-105 transition-all duration-300">
                      Sign Up
                    </span>
                  </Link>
                </div>
              )}
            </div>

            {/* Mobile menu button - Enhanced */}
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="md:hidden relative w-12 h-12 rounded-xl bg-gradient-to-r from-[#ede9fe] to-[#f6f3ff] hover:from-[#e9d5ff] hover:to-[#ede9fe] transition-all duration-300 group"
              aria-label="Open menu"
            >
              <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-[#8C5BFF]/20 to-[#6356D7]/20 blur-md group-hover:blur-lg transition-all duration-300"></div>
              <div className="relative flex flex-col items-center justify-center space-y-1.5">
                <span className={`block w-6 h-0.5 bg-gradient-to-r from-[#8C5BFF] to-[#6356D7] rounded-full transition-all duration-300 ${isMenuOpen ? 'rotate-45 translate-y-2' : ''}`}></span>
                <span className={`block w-6 h-0.5 bg-gradient-to-r from-[#8C5BFF] to-[#6356D7] rounded-full transition-all duration-300 ${isMenuOpen ? 'opacity-0' : ''}`}></span>
                <span className={`block w-6 h-0.5 bg-gradient-to-r from-[#8C5BFF] to-[#6356D7] rounded-full transition-all duration-300 ${isMenuOpen ? '-rotate-45 -translate-y-2' : ''}`}></span>
              </div>
            </button>
          </div>
        </div>

        {/* Mobile Menu - Enhanced */}
        <div
          ref={mobileMenuRef}
          className={`md:hidden fixed top-16 left-0 right-0 w-full bg-white/95 backdrop-blur-xl shadow-2xl transition-all duration-500 ease-in-out transform ${
            isMenuOpen 
              ? 'translate-y-0 opacity-100 visible' 
              : '-translate-y-2 opacity-0 invisible pointer-events-none'
          }`}
          style={{ maxHeight: 'calc(100vh - 4rem)', overflowY: 'auto' }}
        >
          <div className="p-5 space-y-4">
            {/* Leaderboard Link */}
            <Link 
              href="/leaderboard" 
              className="flex items-center space-x-3 p-4 bg-gradient-to-r from-[#ede9fe] to-[#f6f3ff] rounded-2xl hover:from-[#e9d5ff] hover:to-[#ede9fe] transition-all duration-300 group"
              onClick={() => setIsMenuOpen(false)}
            >
              <div className="w-12 h-12 rounded-xl bg-gradient-to-r from-[#8C5BFF] to-[#6356D7] flex items-center justify-center shadow-lg group-hover:scale-110 transition-all duration-300">
                <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <div>
                <span className="block text-[#313053] font-bold text-lg">Leaderboard</span>
                <span className="block text-[#6d6a7c] text-sm">View debate results</span>
              </div>
            </Link>
            
            {session ? (
              <div className="space-y-3">
                {session.user?.role !== "ADMIN" && (
                  <Link
                    href="/debates"
                    className="block relative group"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-[#8C5BFF] to-[#6356D7] rounded-2xl blur-xl opacity-50 group-hover:opacity-75 transition-all duration-300"></div>
                    <div className="relative bg-gradient-to-r from-[#8C5BFF] to-[#6356D7] p-5 rounded-2xl text-white transform group-hover:scale-[1.02] transition-all duration-300">
                      <div className="flex items-center space-x-3">
                        <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur flex items-center justify-center">
                          <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                          </svg>
                        </div>
                        <div>
                          <span className="block font-bold text-lg">Vote Now</span>
                          <span className="block text-white/80 text-sm">Cast your vote in debates</span>
                        </div>
                      </div>
                    </div>
                  </Link>
                )}
                
                {session.user?.role === "ADMIN" && (
                  <Link
                    href="/admin"
                    className="block relative group"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-[#8C5BFF] to-[#6356D7] rounded-2xl blur-xl opacity-50 group-hover:opacity-75 transition-all duration-300"></div>
                    <div className="relative bg-gradient-to-r from-[#8C5BFF] to-[#6356D7] p-5 rounded-2xl text-white transform group-hover:scale-[1.02] transition-all duration-300">
                      <div className="flex items-center space-x-3">
                        <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur flex items-center justify-center">
                          <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        </div>
                        <div>
                          <span className="block font-bold text-lg">Admin Panel</span>
                          <span className="block text-white/80 text-sm">Manage debates & scores</span>
                        </div>
                      </div>
                    </div>
                  </Link>
                )}
                
                {/* Mobile User Info - Enhanced */}
                <div className="p-5 bg-gradient-to-br from-[#ede9fe] to-[#f6f3ff] rounded-2xl border border-[#ddd6fe]">
                  <div className="flex items-center space-x-4 mb-4">
                    <div className="relative">
                      <div className="absolute inset-0 bg-gradient-to-r from-[#8C5BFF] to-[#6356D7] rounded-full blur-md opacity-60"></div>
                      <div className="relative w-14 h-14 rounded-full bg-gradient-to-r from-[#8C5BFF] to-[#6356D7] text-white flex items-center justify-center text-lg font-bold shadow-lg border-2 border-white">
                        {getInitials(session.user?.email)}
                      </div>
                    </div>
                    <div className="flex-1">
                      <p className="text-xs text-[#6d6a7c] mb-1">Logged in as</p>
                      <p className="font-semibold text-[#313053] text-sm break-all">{session.user?.email}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-xs bg-white text-[#8C5BFF] px-4 py-2 rounded-full font-semibold shadow-sm border border-[#ddd6fe]">
                      {session.user?.role}
                    </span>
                    {session.user?.role === "AUDIENCE" && (
                      <span className="text-xs text-green-600 flex items-center bg-white px-3 py-1.5 rounded-full shadow-sm">
                        <svg className="w-4 h-4 mr-1 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                        Voting Access
                      </span>
                    )}
                  </div>
                  
                  <button
                    onClick={() => {
                      signOut()
                      setIsMenuOpen(false)
                    }}
                    className="w-full relative group"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-red-500 to-red-600 rounded-xl blur-md group-hover:blur-lg opacity-50 group-hover:opacity-75 transition-all duration-300"></div>
                    <div className="relative bg-gradient-to-r from-red-500 to-red-600 text-white px-4 py-3.5 rounded-xl font-medium transform group-hover:scale-[1.02] transition-all duration-300 flex items-center justify-center space-x-2">
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                      </svg>
                      <span>Sign Out</span>
                    </div>
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <Link
                  href="/auth/signin"
                  className="block relative group"
                  onClick={() => setIsMenuOpen(false)}
                >
                  <div className="relative border-2 border-[#8C5BFF] p-5 rounded-2xl text-[#8C5BFF] hover:bg-gradient-to-r hover:from-[#8C5BFF] hover:to-[#6356D7] hover:text-white hover:border-transparent transition-all duration-300 transform group-hover:scale-[1.02]">
                    <div className="flex items-center space-x-3">
                      <div className="w-12 h-12 rounded-xl bg-[#8C5BFF]/10 flex items-center justify-center group-hover:bg-white/20 transition-all duration-300">
                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                        </svg>
                      </div>
                      <div>
                        <span className="block font-bold text-lg">Sign In</span>
                        <span className="block text-sm opacity-80">Access your account</span>
                      </div>
                    </div>
                  </div>
                </Link>

                <Link
                  href="/auth/signup"
                  className="block relative group"
                  onClick={() => setIsMenuOpen(false)}
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-[#8C5BFF] to-[#6356D7] rounded-2xl blur-xl opacity-50 group-hover:opacity-75 transition-all duration-300"></div>
                  <div className="relative bg-gradient-to-r from-[#8C5BFF] to-[#6356D7] p-5 rounded-2xl text-white transform group-hover:scale-[1.02] transition-all duration-300">
                    <div className="flex items-center space-x-3">
                      <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur flex items-center justify-center">
                        <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                        </svg>
                      </div>
                      <div>
                        <span className="block font-bold text-lg">Sign Up</span>
                        <span className="block text-white/80 text-sm">Create new account</span>
                      </div>
                    </div>
                  </div>
                </Link>
              </div>
            )}
          </div>
        </div>
      </nav>

      {/* Spacer - only render when not on auth pages */}
      {!isAuthPage && <div className="h-16 md:h-20"></div>}

      {/* User info bar - only render when not on auth pages and session exists */}
      {!isAuthPage && session && (
        <div className={`fixed top-16 md:top-20 left-0 w-full z-[1001] transition-all duration-300 ${
          scrolled ? 'bg-gradient-to-r from-[#ede9fe]/95 to-[#f6f3ff]/95 backdrop-blur-md' : 'bg-gradient-to-r from-[#ede9fe] to-[#f6f3ff]'
        } border-b border-[#ddd6fe]`}>
          <div className="w-full px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center py-2 sm:py-2.5 text-xs sm:text-sm space-y-1 sm:space-y-0">
              <div className="flex items-center space-x-2 sm:space-x-3 overflow-hidden">
                <span className="text-[#6d6a7c] whitespace-nowrap">Welcome back,</span>
                <span className="font-medium text-[#313053] truncate max-w-[150px] sm:max-w-[300px] md:max-w-[400px]">
                  {session.user?.email}
                </span>
                <span className="bg-white text-[#8C5BFF] text-[10px] sm:text-xs px-2 sm:px-3 py-1 rounded-full shadow-sm border border-[#ddd6fe] whitespace-nowrap">
                  {session.user?.role}
                </span>
              </div>
              {session.user?.role === "AUDIENCE" && (
                <span className="flex items-center text-green-600 bg-white px-2 sm:px-3 py-1 rounded-full shadow-sm w-fit text-[10px] sm:text-xs">
                  <svg className="w-3 h-3 sm:w-4 sm:h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span className="hidden xs:inline">Voting</span> Access
                </span>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Add animation keyframes to global CSS */}
      <style jsx global>{`
        @keyframes fade-in-down {
          0% {
            opacity: 0;
            transform: translateY(-10px);
          }
          100% {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        .animate-fade-in-down {
          animation: fade-in-down 0.3s ease-out;
        }
      `}</style>
    </>
  )
}
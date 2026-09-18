"use client"

import { useState, useEffect, useRef } from "react"
import { useSession } from "next-auth/react"
import { motion, AnimatePresence } from "framer-motion"

interface DebateTeam {
  teamId: string
  teamName: string
  panelistScore: number
  audienceVotes: number
  panelistWeighted: number
  audienceWeighted: number
  totalScore: number
}

interface DebateResult {
  debateId: string
  debateNumber: number
  name: string
  status: string
  teams: DebateTeam[]
  winner: {
    teamId: string
    teamName: string
    score: number
  } | null
}

interface Winners {
  first: { teamId: string; teamName: string; score: number } | null
  second: { teamId: string; teamName: string; score: number } | null
  third: { teamId: string; teamName: string; score: number } | null
}

interface ResultsData {
  debates: DebateResult[]
  winners?: Winners
  round: number
}

export default function LeaderboardPage() {
  const { data: session, status } = useSession()
  const [currentRound, setCurrentRound] = useState(1)
  const [results, setResults] = useState<ResultsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const [mouse, setMouse] = useState({ x: 0, y: 0 })
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    fetchResults()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentRound])

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      setMouse({
        x: e.clientX / window.innerWidth - 0.5,
        y: e.clientY / window.innerHeight - 0.5,
      })
    }
    window.addEventListener("mousemove", onMove)
    return () => window.removeEventListener("mousemove", onMove)
  }, [])

  const fetchResults = async () => {
    setLoading(true)
    setError("")
    try {
      const res = await fetch(`/api/debate-results?round=${currentRound}`)

      if (res.status === 401) {
        setError("Please sign in to view the leaderboard")
        return
      }

      if (!res.ok) {
        throw new Error(`Failed to fetch results: ${res.status}`)
      }

      const data = await res.json()

      if (!data || (data.debates && data.debates.length === 0)) {
        setError(`No results available for Round ${currentRound}`)
      } else {
        setResults(data)
      }
    } catch (error) {
      console.error("Error fetching results:", error)
      setError("Failed to load results. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  const getRoundInfo = () => {
    switch (currentRound) {
      case 1:
        return {
          title: "Round 1 — Semi-Finals",
          description: "6 debates with 2 teams each. Winner from each debate advances to Round 2.",
          icon: "🎯",
          gradient: "from-blue-500 via-indigo-500 to-purple-500",
          glow: "shadow-[0_20px_60px_-20px_rgba(59,130,246,0.5)]",
          label: "Semi-Finals",
          sublabel: "6 Debates",
        }
      case 2:
        return {
          title: "Round 2 — Finals",
          description: "3 debates with winners from Round 1. Final winners decided!",
          icon: "⚡",
          gradient: "from-[#6356D7] via-[#7E5FFF] to-pink-500",
          glow: "shadow-[0_20px_60px_-20px_rgba(126,95,255,0.5)]",
          label: "Finals",
          sublabel: "3 Debates",
        }
      default:
        return {
          title: "Leaderboard",
          description: "",
          icon: "📊",
          gradient: "from-gray-500 to-gray-700",
          glow: "shadow-[0_20px_60px_-20px_rgba(107,114,128,0.5)]",
          label: "Results",
          sublabel: "View",
        }
    }
  }

  const getMedal = (position: number) => {
    switch (position) {
      case 0:
        return {
          emoji: "🥇",
          label: "Gold",
          gradient: "from-yellow-400 via-amber-400 to-yellow-500",
          glow: "shadow-[0_20px_60px_-15px_rgba(251,191,36,0.6)]",
          ring: "ring-amber-400/50",
          bg: "from-amber-50/90 to-yellow-50/90 dark:from-amber-900/25 dark:to-yellow-900/20",
          text: "text-amber-700 dark:text-amber-300",
        }
      case 1:
        return {
          emoji: "🥈",
          label: "Silver",
          gradient: "from-slate-300 via-slate-400 to-slate-500",
          glow: "shadow-[0_20px_60px_-15px_rgba(148,163,184,0.6)]",
          ring: "ring-slate-300/50",
          bg: "from-slate-50/90 to-gray-50/90 dark:from-slate-800/40 dark:to-slate-900/30",
          text: "text-slate-700 dark:text-slate-300",
        }
      case 2:
        return {
          emoji: "🥉",
          label: "Bronze",
          gradient: "from-orange-400 via-amber-500 to-orange-500",
          glow: "shadow-[0_20px_60px_-15px_rgba(251,146,60,0.6)]",
          ring: "ring-orange-400/50",
          bg: "from-orange-50/90 to-amber-50/90 dark:from-orange-900/25 dark:to-amber-900/20",
          text: "text-orange-700 dark:text-orange-300",
        }
      default:
        return { emoji: "", label: "", gradient: "", glow: "", ring: "", bg: "", text: "" }
    }
  }

  const roundInfo = getRoundInfo()

  const roundOptions = [
    { value: 1, label: "Semi-Finals", sublabel: "6 Debates", emoji: "🎯", gradient: "from-blue-500 to-indigo-500" },
    { value: 2, label: "Finals", sublabel: "3 Debates", emoji: "⚡", gradient: "from-[#6356D7] to-pink-500" },
  ]

  // ───────── Loading ─────────
  if (status === "loading" || loading) {
    return (
      <div className="relative min-h-screen overflow-hidden bg-[#F7F5FF] dark:bg-[#08061a] text-gray-900 dark:text-gray-100">
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(120%_100%_at_50%_0%,#EDE7FF_0%,#F7F5FF_40%,#F7F5FF_100%)] dark:bg-[radial-gradient(120%_100%_at_50%_0%,#1a1238_0%,#0d0a1f_45%,#08061a_100%)]" />
          <div className="absolute -top-48 -left-48 w-[36rem] h-[36rem] rounded-full bg-[#B09EE4]/50 dark:bg-[#6356D7]/25 blur-[120px] animate-float-slow" />
          <div className="absolute -bottom-56 -right-48 w-[40rem] h-[40rem] rounded-full bg-[#7E5FFF]/40 dark:bg-[#261753]/60 blur-[140px] animate-float-slower" />
          <div
            className="absolute inset-0 opacity-[0.035] dark:opacity-[0.06]"
            style={{
              backgroundImage:
                "linear-gradient(to right, currentColor 1px, transparent 1px), linear-gradient(to bottom, currentColor 1px, transparent 1px)",
              backgroundSize: "42px 42px",
              maskImage: "radial-gradient(ellipse at center, black 30%, transparent 75%)",
              WebkitMaskImage: "radial-gradient(ellipse at center, black 30%, transparent 75%)",
            }}
          />
        </div>

        <div className="relative z-10 max-w-7xl mx-auto py-24 px-4">
          <div className="rounded-3xl p-12 bg-white/60 dark:bg-white/[0.03] backdrop-blur-2xl border border-white/70 dark:border-white/10 shadow-[0_20px_60px_-20px_rgba(99,86,215,0.3)] dark:shadow-[0_20px_60px_-20px_rgba(0,0,0,0.8)]">
            <div className="flex flex-col items-center justify-center py-16">
              <div className="relative w-24 h-24">
                <div className="absolute inset-0 border-4 border-[#6356D7]/20 dark:border-white/10 rounded-full" />
                <div className="absolute inset-0 border-4 border-transparent border-t-[#7E5FFF] rounded-full animate-spin" />
                <div className="absolute inset-0 bg-gradient-to-r from-[#6356D7]/30 to-[#7E5FFF]/30 rounded-full blur-2xl animate-pulse" />
              </div>
              <p className="mt-8 text-2xl font-bold bg-gradient-to-r from-[#6356D7] via-[#7E5FFF] to-[#a385ff] bg-clip-text text-transparent">
                Loading Results
              </p>
              <p className="text-gray-500 dark:text-gray-400 mt-2 text-sm">
                Please wait while we fetch the latest scores...
              </p>
            </div>
          </div>
        </div>

        <style jsx>{`
          @keyframes floatSlow {
            0%, 100% { transform: translateY(0) translateX(0); }
            50% { transform: translateY(-18px) translateX(10px); }
          }
          .animate-float-slow { animation: floatSlow 10s ease-in-out infinite; }
          @keyframes floatSlower {
            0%, 100% { transform: translateY(0) translateX(0); }
            50% { transform: translateY(14px) translateX(-12px); }
          }
          .animate-float-slower { animation: floatSlower 14s ease-in-out infinite; }
        `}</style>
      </div>
    )
  }

  // ───────── Main page ─────────
  return (
    <div className="relative min-h-screen overflow-hidden bg-[#F7F5FF] dark:bg-[#08061a] text-gray-900 dark:text-gray-100 selection:bg-[#7E5FFF]/30">
      {/* ───────── Ambient background ───────── */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(120%_100%_at_50%_0%,#EDE7FF_0%,#F7F5FF_40%,#F7F5FF_100%)] dark:bg-[radial-gradient(120%_100%_at_50%_0%,#1a1238_0%,#0d0a1f_45%,#08061a_100%)]" />

        <div
          className="absolute -top-48 -left-48 w-[36rem] h-[36rem] rounded-full bg-[#B09EE4]/50 dark:bg-[#6356D7]/25 blur-[120px] animate-float-slow"
          style={{ transform: `translate3d(${mouse.x * 20}px, ${mouse.y * 20}px, 0)` }}
        />
        <div
          className="absolute -bottom-56 -right-48 w-[40rem] h-[40rem] rounded-full bg-[#7E5FFF]/40 dark:bg-[#261753]/60 blur-[140px] animate-float-slower"
          style={{ transform: `translate3d(${mouse.x * -20}px, ${mouse.y * -20}px, 0)` }}
        />
        <div
          className="absolute top-1/3 left-1/2 w-72 h-72 rounded-full bg-[#6356D7]/20 dark:bg-[#7E5FFF]/15 blur-[100px] animate-float-slow"
          style={{ transform: `translate3d(${mouse.x * 15}px, ${mouse.y * -15}px, 0)` }}
        />

        <div
          className="absolute inset-0 opacity-[0.035] dark:opacity-[0.06]"
          style={{
            backgroundImage:
              "linear-gradient(to right, currentColor 1px, transparent 1px), linear-gradient(to bottom, currentColor 1px, transparent 1px)",
            backgroundSize: "42px 42px",
            maskImage: "radial-gradient(ellipse at center, black 30%, transparent 75%)",
            WebkitMaskImage: "radial-gradient(ellipse at center, black 30%, transparent 75%)",
          }}
        />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto py-10 px-4 sm:px-6 lg:px-8">
        {/* ───────── Header ───────── */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          className="mb-10"
        >
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-5 mb-6">
            <div className="flex items-center gap-5">
              <div className="relative shrink-0">
                <div className="absolute inset-0 bg-gradient-to-br from-[#6356D7] to-[#7E5FFF] rounded-2xl blur-xl opacity-50" />
                <div className="relative w-16 h-16 bg-gradient-to-br from-[#6356D7] via-[#7E5FFF] to-[#a385ff] rounded-2xl shadow-2xl flex items-center justify-center transform hover:rotate-6 transition-all duration-500">
                  <span className="text-3xl drop-shadow-lg">📊</span>
                </div>
                <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white dark:border-[#08061a] shadow-lg">
                  <div className="absolute inset-0 bg-green-400 rounded-full animate-ping" />
                </div>
              </div>

              <div className="min-w-0">
                <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold leading-tight">
                  Debate{" "}
                  <span className="bg-gradient-to-r from-[#6356D7] via-[#7E5FFF] to-[#a385ff] bg-clip-text text-transparent">
                    Leaderboard
                  </span>
                </h1>
                <p className="text-gray-600 dark:text-gray-400 mt-1.5 flex items-center gap-2 text-sm">
                  <span className="relative flex w-2 h-2">
                    <span className="absolute inline-flex h-full w-full rounded-full bg-green-500 opacity-75 animate-ping" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
                  </span>
                  Live Results • Real-time Updates
                </p>
              </div>
            </div>

            {/* Round Selector */}
            <div className="relative shrink-0" ref={dropdownRef}>
              <button
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="group relative w-full md:w-72 rounded-2xl p-[1px] transition-transform duration-300 hover:scale-[1.01]"
              >
                <div className={`absolute inset-0 bg-gradient-to-r ${currentRound === 1 ? "from-blue-500 to-indigo-500" : "from-[#6356D7] to-pink-500"} rounded-2xl opacity-60 group-hover:opacity-90 transition-opacity duration-300`} />
                <div className="relative flex items-center justify-between gap-3 p-3 rounded-2xl bg-white/90 dark:bg-white/[0.05] backdrop-blur-xl">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${currentRound === 1 ? "from-blue-500 to-indigo-500" : "from-[#6356D7] to-pink-500"} flex items-center justify-center text-white text-lg shadow-lg`}>
                      {roundOptions.find((r) => r.value === currentRound)?.emoji}
                    </div>
                    <div className="text-left leading-tight">
                      <p className="text-[10px] uppercase tracking-wider font-semibold text-gray-500 dark:text-gray-400">
                        Viewing
                      </p>
                      <p className="font-semibold text-sm text-gray-800 dark:text-gray-100">
                        {roundOptions.find((r) => r.value === currentRound)?.label}
                      </p>
                    </div>
                  </div>
                  <svg
                    className={`w-5 h-5 text-gray-400 dark:text-gray-500 transition-transform duration-300 ${isDropdownOpen ? "rotate-180" : ""}`}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </button>

              <AnimatePresence>
                {isDropdownOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -8, scale: 0.96 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -8, scale: 0.96 }}
                    transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
                    className="absolute right-0 mt-2 w-full md:w-72 rounded-2xl p-[1px] bg-gradient-to-b from-[#6356D7]/40 to-transparent z-50"
                  >
                    <div className="rounded-2xl overflow-hidden bg-white/95 dark:bg-[#0f0d1a]/95 backdrop-blur-xl border border-white/60 dark:border-white/10 shadow-[0_20px_60px_-20px_rgba(99,86,215,0.5)] dark:shadow-[0_20px_60px_-20px_rgba(0,0,0,0.9)]">
                      <div className="p-2 space-y-1">
                        {roundOptions.map((option) => {
                          const active = currentRound === option.value
                          return (
                            <button
                              key={option.value}
                              onClick={() => {
                                setCurrentRound(option.value)
                                setIsDropdownOpen(false)
                              }}
                              className={`
                                w-full flex items-center gap-3 p-3 rounded-xl transition-all duration-300
                                ${active ? "bg-gradient-to-r from-[#6356D7]/10 to-[#7E5FFF]/10 dark:from-[#6356D7]/20 dark:to-[#7E5FFF]/20" : "hover:bg-gray-100/70 dark:hover:bg-white/[0.04]"}
                              `}
                            >
                              <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${option.gradient} flex items-center justify-center text-white text-lg shadow-md shrink-0`}>
                                {option.emoji}
                              </div>
                              <div className="flex-1 text-left leading-tight">
                                <p className={`font-semibold text-sm ${active ? "text-[#6356D7] dark:text-[#b3a6ff]" : "text-gray-800 dark:text-gray-200"}`}>
                                  {option.label}
                                </p>
                                <p className="text-[11px] text-gray-500 dark:text-gray-400">
                                  {option.sublabel}
                                </p>
                              </div>
                              {active && (
                                <motion.span
                                  initial={{ scale: 0 }}
                                  animate={{ scale: 1 }}
                                  className="w-2 h-2 rounded-full bg-[#6356D7] dark:bg-[#b3a6ff] shadow-[0_0_10px_rgba(99,86,215,0.8)] shrink-0"
                                />
                              )}
                            </button>
                          )
                        })}
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          <div className="h-px w-full bg-gradient-to-r from-transparent via-[#7E5FFF]/40 to-transparent" />
        </motion.div>

        {/* ───────── Round info banner ───────── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1], delay: 0.1 }}
          className={`relative mb-8 overflow-hidden rounded-3xl p-6 sm:p-7 text-white bg-gradient-to-r ${roundInfo.gradient} ${roundInfo.glow}`}
        >
          {/* Inner blobs */}
          <div className="absolute -top-16 -right-16 w-56 h-56 rounded-full bg-white/20 blur-3xl" />
          <div className="absolute -bottom-16 -left-16 w-56 h-56 rounded-full bg-white/10 blur-3xl" />

          {/* Fine grid */}
          <div
            className="absolute inset-0 opacity-10"
            style={{
              backgroundImage:
                "linear-gradient(to right, rgba(255,255,255,0.6) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.6) 1px, transparent 1px)",
              backgroundSize: "40px 40px",
              maskImage: "radial-gradient(ellipse at 30% 50%, black 40%, transparent 80%)",
              WebkitMaskImage: "radial-gradient(ellipse at 30% 50%, black 40%, transparent 80%)",
            }}
          />

          <div className="relative flex items-center gap-5">
            <motion.div
              animate={{ y: [0, -8, 0] }}
              transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
              className="text-5xl sm:text-6xl drop-shadow-lg shrink-0"
            >
              {roundInfo.icon}
            </motion.div>
            <div className="min-w-0">
              <div className="inline-flex items-center gap-2 mb-2 px-2.5 py-0.5 rounded-full bg-white/20 backdrop-blur-sm border border-white/30">
                <span className="text-[10px] font-bold uppercase tracking-widest">
                  {roundInfo.label}
                </span>
                <span className="w-1 h-1 rounded-full bg-white/60" />
                <span className="text-[10px] font-bold uppercase tracking-widest opacity-80">
                  {roundInfo.sublabel}
                </span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-bold leading-tight drop-shadow-sm">
                {roundInfo.title}
              </h2>
              <p className="text-white/90 text-sm sm:text-base mt-1">
                {roundInfo.description}
              </p>
            </div>
          </div>
        </motion.div>

        {/* ───────── Error ───────── */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10, height: 0 }}
              animate={{ opacity: 1, y: 0, height: "auto" }}
              exit={{ opacity: 0, y: -10, height: 0 }}
              className="mb-6"
            >
              <div className="bg-red-50/90 dark:bg-red-900/25 backdrop-blur-sm border-l-4 border-red-500 text-red-700 dark:text-red-300 p-4 rounded-2xl flex items-center gap-3 animate-shake shadow-[0_10px_30px_-15px_rgba(239,68,68,0.5)]">
                <span className="text-2xl">❌</span>
                <span className="flex-1 font-medium text-sm">{error}</span>
                <button
                  onClick={() => fetchResults()}
                  className="text-red-500 hover:text-red-700 dark:hover:text-red-200 transition-colors"
                  aria-label="Retry"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {results && !error && (
          <>
            {/* ───────── Champions (Round 2) ───────── */}
            {currentRound === 2 && results.winners && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
                className="mb-10"
              >
                <div className="relative overflow-hidden rounded-3xl p-6 sm:p-8 bg-gradient-to-br from-amber-50/80 via-orange-50/60 to-yellow-50/80 dark:from-amber-950/30 dark:via-orange-950/20 dark:to-yellow-950/30 backdrop-blur-2xl border border-amber-200/70 dark:border-amber-900/40 shadow-[0_20px_60px_-20px_rgba(251,191,36,0.5)]">
                  {/* Top hairline */}
                  <div className="absolute inset-x-12 -top-px h-px bg-gradient-to-r from-transparent via-amber-400/70 to-transparent" />

                  {/* Ambient blobs */}
                  <div className="absolute -top-24 left-1/4 w-72 h-72 rounded-full bg-amber-300/30 dark:bg-amber-600/20 blur-3xl" />
                  <div className="absolute -bottom-24 right-1/4 w-72 h-72 rounded-full bg-orange-300/30 dark:bg-orange-600/20 blur-3xl" />

                  <div className="relative">
                    {/* Header */}
                    <div className="text-center mb-8">
                      <motion.div
                        initial={{ scale: 0.7, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ delay: 0.2, type: "spring", stiffness: 200, damping: 15 }}
                        className="inline-flex items-center gap-3 px-5 py-2 rounded-full bg-white/80 dark:bg-white/[0.06] backdrop-blur-xl border border-amber-300/60 dark:border-amber-900/40 shadow-lg mb-4"
                      >
                        <span className="text-2xl">🏆</span>
                        <span className="font-bold bg-gradient-to-r from-amber-500 via-orange-500 to-amber-500 bg-clip-text text-transparent tracking-wider">
                          CHAMPIONS
                        </span>
                        <span className="text-2xl">🏆</span>
                      </motion.div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        The top three teams of the tournament
                      </p>
                    </div>

                    {/* Podium grid */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-5 md:gap-6">
                      {[results.winners.first, results.winners.second, results.winners.third].map((winner, index) => {
                        if (!winner) return null
                        const medal = getMedal(index)
                        const isFirst = index === 0
                        return (
                          <motion.div
                            key={winner.teamId}
                            initial={{ opacity: 0, y: 30, scale: 0.9 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            transition={{
                              duration: 0.6,
                              delay: 0.3 + index * 0.15,
                              ease: [0.22, 1, 0.36, 1],
                            }}
                            whileHover={{ y: -8, scale: isFirst ? 1.06 : 1.04 }}
                            className={`relative rounded-3xl p-6 text-center bg-gradient-to-br ${medal.bg} border border-white/70 dark:border-white/10 ${medal.glow} backdrop-blur-2xl overflow-hidden`}
                          >
                            {/* Top hairline */}
                            <div className={`absolute inset-x-8 -top-px h-px bg-gradient-to-r from-transparent via-current to-transparent ${medal.text} opacity-50`} />

                            {/* Corner accent */}
                            <div className={`absolute -top-12 -right-12 w-32 h-32 rounded-full bg-gradient-to-br ${medal.gradient} opacity-20 blur-2xl`} />

                            {/* Medal */}
                            <div className="relative mb-4">
                              <motion.div
                                animate={isFirst ? { y: [0, -6, 0] } : {}}
                                transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
                                className={`inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br ${medal.gradient} shadow-xl ring-2 ${medal.ring} ring-offset-2 ring-offset-white dark:ring-offset-[#0f0d1a]`}
                              >
                                <span className="text-4xl drop-shadow-lg">{medal.emoji}</span>
                              </motion.div>

                              {isFirst && (
                                <motion.div
                                  initial={{ opacity: 0, scale: 0.5 }}
                                  animate={{ opacity: 1, scale: 1 }}
                                  transition={{ delay: 0.8, type: "spring" }}
                                  className="absolute -top-2 -right-2 px-2 py-1 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 text-white text-[9px] font-bold uppercase tracking-widest shadow-lg"
                                >
                                  Champion
                                </motion.div>
                              )}
                            </div>

                            {/* Team name */}
                            <h4 className="relative font-bold text-lg text-gray-900 dark:text-white mb-3 truncate px-2">
                              {winner.teamName}
                            </h4>

                            {/* Score */}
                            <div className="relative mb-2">
                              <p className={`text-4xl font-bold ${medal.text} tabular-nums`}>
                                {winner.score}
                              </p>
                              <p className="text-[10px] uppercase tracking-widest font-semibold text-gray-500 dark:text-gray-400 mt-1">
                                Final Score
                              </p>
                            </div>

                            {/* Medal label */}
                            <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/60 dark:bg-white/[0.06] border border-white/70 dark:border-white/10 backdrop-blur-sm`}>
                              <span className="w-1.5 h-1.5 rounded-full bg-current opacity-60" />
                              <span className={`text-[10px] font-bold uppercase tracking-widest ${medal.text}`}>
                                {medal.label}
                              </span>
                            </div>
                          </motion.div>
                        )
                      })}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* ───────── Debates grid ───────── */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <AnimatePresence mode="popLayout">
                {results.debates.map((debate, index) => {
                  const isActive = debate.status === "ACTIVE"
                  const isCompleted = debate.status === "COMPLETED"
                  const statusColor = isCompleted
                    ? "text-green-600 dark:text-green-400"
                    : isActive
                    ? "text-amber-600 dark:text-amber-400"
                    : "text-gray-500 dark:text-gray-400"
                  const statusBg = isCompleted
                    ? "bg-green-500"
                    : isActive
                    ? "bg-amber-500"
                    : "bg-gray-400"

                  return (
                    <motion.div
                      key={debate.debateId}
                      layout
                      initial={{ opacity: 0, y: 30, scale: 0.96 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -10, scale: 0.96 }}
                      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1], delay: index * 0.05 }}
                      whileHover={{ y: -6 }}
                      className="relative rounded-3xl overflow-hidden bg-white/70 dark:bg-white/[0.03] backdrop-blur-2xl border border-white/70 dark:border-white/10 shadow-[0_20px_60px_-20px_rgba(99,86,215,0.25)] dark:shadow-[0_20px_60px_-20px_rgba(0,0,0,0.8)] transition-shadow duration-500"
                    >
                      {/* Top hairline */}
                      <div className="absolute inset-x-10 top-0 h-px bg-gradient-to-r from-transparent via-[#7E5FFF]/50 to-transparent z-10" />

                      {/* Header stripe */}
                      <div className="relative bg-gradient-to-r from-[#6356D7] via-[#7E5FFF] to-[#a385ff] p-5 overflow-hidden">
                        <div className="absolute -top-8 -right-8 w-28 h-28 rounded-full bg-white/20 blur-2xl" />
                        <div className="absolute top-1/2 -left-8 w-24 h-24 rounded-full bg-white/10 blur-2xl" />

                        <div className="relative flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <h3 className="text-lg font-bold text-white truncate drop-shadow-sm">
                              {debate.name || `Debate ${debate.debateNumber}`}
                            </h3>
                            <div className={`inline-flex items-center gap-1.5 mt-1.5 px-2 py-0.5 rounded-full bg-white/20 backdrop-blur-sm border border-white/30`}>
                              <span className="relative flex w-1.5 h-1.5">
                                {isActive && <span className="absolute inline-flex h-full w-full rounded-full bg-white opacity-75 animate-ping" />}
                                <span className={`relative inline-flex rounded-full h-1.5 w-1.5 bg-white`} />
                              </span>
                              <span className="text-[10px] font-bold uppercase tracking-widest text-white">
                                {isCompleted ? "Completed" : isActive ? "In Progress" : "Upcoming"}
                              </span>
                            </div>
                          </div>

                          {/* Debate number badge */}
                          <div className="shrink-0 w-11 h-11 rounded-2xl bg-white/20 backdrop-blur-sm border border-white/30 flex items-center justify-center">
                            <span className="text-sm font-bold text-white">
                              #{debate.debateNumber}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Teams comparison */}
                      <div className="p-5 sm:p-6">
                        <div className="grid grid-cols-2 gap-3 sm:gap-4">
                          {debate.teams.map((team, idx) => {
                            const isWinner = debate.winner?.teamId === team.teamId
                            const accent = idx === 0 ? "blue" : "purple"

                            return (
                              <div
                                key={team.teamId}
                                className={`relative rounded-2xl p-3 sm:p-4 overflow-hidden border transition-all duration-300 ${
                                  isWinner
                                    ? "bg-gradient-to-br from-green-50/90 to-emerald-50/90 dark:from-green-900/25 dark:to-emerald-900/20 border-green-300/70 dark:border-green-900/50 shadow-[0_10px_30px_-15px_rgba(34,197,94,0.5)]"
                                    : "bg-white/60 dark:bg-white/[0.02] border-gray-200/60 dark:border-white/10"
                                }`}
                              >
                                {isWinner && (
                                  <div className="absolute -top-8 -right-8 w-24 h-24 rounded-full bg-green-400/30 blur-2xl" />
                                )}

                                {/* Team name */}
                                <div className="relative mb-3 flex items-start justify-between gap-2">
                                  <div className={`font-bold text-sm truncate ${idx === 0 ? "text-blue-600 dark:text-blue-400" : "text-purple-600 dark:text-purple-400"}`}>
                                    {team.teamName}
                                  </div>
                                  {isWinner && (
                                    <motion.span
                                      initial={{ scale: 0, rotate: -30 }}
                                      animate={{ scale: 1, rotate: 0 }}
                                      transition={{ type: "spring", stiffness: 400, damping: 20 }}
                                      className="shrink-0 text-lg"
                                    >
                                      🏆
                                    </motion.span>
                                  )}
                                </div>

                                {/* Score rows */}
                                <div className="relative space-y-2">
                                  {/* Panelist */}
                                  <div className="rounded-xl bg-white/70 dark:bg-white/[0.04] border border-gray-200/60 dark:border-white/10 px-3 py-2">
                                    <div className="flex items-center justify-between gap-2">
                                      <span className="text-[10px] uppercase tracking-widest font-semibold text-gray-500 dark:text-gray-400">
                                        Panelist
                                      </span>
                                      <span className="text-[9px] font-bold text-[#6356D7] dark:text-[#b3a6ff] px-1.5 py-0.5 rounded-full bg-[#6356D7]/10 dark:bg-[#6356D7]/25">
                                        70%
                                      </span>
                                    </div>
                                    <p className="font-bold text-base text-gray-900 dark:text-white tabular-nums mt-0.5">
                                      {team.panelistWeighted}
                                    </p>
                                  </div>

                                  {/* Audience */}
                                  <div className="rounded-xl bg-white/70 dark:bg-white/[0.04] border border-gray-200/60 dark:border-white/10 px-3 py-2">
                                    <div className="flex items-center justify-between gap-2">
                                      <span className="text-[10px] uppercase tracking-widest font-semibold text-gray-500 dark:text-gray-400">
                                        Audience
                                      </span>
                                      <span className="text-[9px] font-bold text-[#7E5FFF] dark:text-[#b3a6ff] px-1.5 py-0.5 rounded-full bg-[#7E5FFF]/10 dark:bg-[#7E5FFF]/25">
                                        30%
                                      </span>
                                    </div>
                                    <div className="flex items-baseline justify-between gap-1 mt-0.5">
                                      <p className="font-bold text-base text-gray-900 dark:text-white tabular-nums">
                                        {team.audienceWeighted}
                                      </p>
                                      <p className="text-[10px] text-gray-500 dark:text-gray-400 tabular-nums">
                                        {team.audienceVotes} votes
                                      </p>
                                    </div>
                                  </div>

                                  {/* Total */}
                                  <div className={`relative overflow-hidden rounded-xl px-3 py-2.5 bg-gradient-to-r ${
                                    isWinner
                                      ? "from-green-500/15 via-emerald-500/15 to-green-500/15 dark:from-green-500/25 dark:via-emerald-500/25 dark:to-green-500/25 border border-green-400/40 dark:border-green-500/40"
                                      : "from-[#6356D7]/10 via-[#7E5FFF]/10 to-[#6356D7]/10 dark:from-[#6356D7]/20 dark:via-[#7E5FFF]/20 dark:to-[#6356D7]/20 border border-[#6356D7]/25 dark:border-[#6356D7]/40"
                                  }`}>
                                    <div className="flex items-center justify-between gap-2">
                                      <span className="text-[10px] uppercase tracking-widest font-semibold text-gray-600 dark:text-gray-300">
                                        Total
                                      </span>
                                    </div>
                                    <p className={`font-bold text-xl tabular-nums mt-0.5 ${
                                      isWinner ? "text-green-600 dark:text-green-400" : "text-[#6356D7] dark:text-[#b3a6ff]"
                                    }`}>
                                      {team.totalScore}
                                    </p>
                                  </div>
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    </motion.div>
                  )
                })}
              </AnimatePresence>
            </div>

            {/* ───────── Stats overview ───────── */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1], delay: 0.3 }}
              className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-4"
            >
              {[
                {
                  label: "Total Debates",
                  value: results.debates.length,
                  icon: "🎤",
                  gradient: "from-[#6356D7] to-[#7E5FFF]",
                  text: "text-[#6356D7] dark:text-[#b3a6ff]",
                },
                {
                  label: "Total Votes",
                  value: results.debates.reduce(
                    (acc, debate) => acc + debate.teams.reduce((sum, team) => sum + team.audienceVotes, 0),
                    0
                  ),
                  icon: "🗳️",
                  gradient: "from-purple-500 to-pink-500",
                  text: "text-purple-600 dark:text-purple-400",
                },
                {
                  label: "Completed",
                  value: results.debates.filter((d) => d.status === "COMPLETED").length,
                  icon: "✓",
                  gradient: "from-green-500 to-emerald-500",
                  text: "text-green-600 dark:text-green-400",
                },
                {
                  label: "Active",
                  value: results.debates.filter((d) => d.status === "ACTIVE").length,
                  icon: "⚡",
                  gradient: "from-amber-500 to-orange-500",
                  text: "text-amber-600 dark:text-amber-400",
                },
              ].map((stat, index) => (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.4 + index * 0.06 }}
                  whileHover={{ y: -4 }}
                  className="relative rounded-2xl p-[1px] overflow-hidden"
                >
                  <div className={`absolute inset-0 bg-gradient-to-br ${stat.gradient} opacity-60`} />
                  <div className="relative rounded-2xl bg-white/85 dark:bg-[#0f0d1a]/85 backdrop-blur-xl p-4 border border-white/70 dark:border-white/10">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-[10px] uppercase tracking-widest font-semibold text-gray-500 dark:text-gray-400">
                        {stat.label}
                      </p>
                      <div className={`w-7 h-7 rounded-lg bg-gradient-to-br ${stat.gradient} flex items-center justify-center text-white text-xs shadow-md`}>
                        {stat.icon}
                      </div>
                    </div>
                    <p className={`text-2xl font-bold ${stat.text} tabular-nums`}>
                      {stat.value}
                    </p>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          </>
        )}

        {/* ───────── Footer note ───────── */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.8 }}
          className="mt-10 flex justify-center"
        >
          <div className="inline-flex items-center gap-2.5 px-4 py-2 rounded-full bg-white/60 dark:bg-white/[0.03] border border-white/70 dark:border-white/10 backdrop-blur-xl text-xs text-gray-500 dark:text-gray-400">
            <span className="relative flex w-1.5 h-1.5">
              <span className="absolute inline-flex h-full w-full rounded-full bg-green-500 opacity-75 animate-ping" />
              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-green-500" />
            </span>
            <span>Last updated:</span>
            <span className="font-medium text-gray-700 dark:text-gray-300 tabular-nums">
              {new Date().toLocaleString()}
            </span>
          </div>
        </motion.div>
      </div>

      {/* ───────── Animations ───────── */}
      <style jsx>{`
        @keyframes floatSlow {
          0%, 100% { transform: translateY(0) translateX(0); }
          50% { transform: translateY(-18px) translateX(10px); }
        }
        .animate-float-slow { animation: floatSlow 10s ease-in-out infinite; }

        @keyframes floatSlower {
          0%, 100% { transform: translateY(0) translateX(0); }
          50% { transform: translateY(14px) translateX(-12px); }
        }
        .animate-float-slower { animation: floatSlower 14s ease-in-out infinite; }

        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          10%, 30%, 50%, 70%, 90% { transform: translateX(-3px); }
          20%, 40%, 60%, 80% { transform: translateX(3px); }
        }
        .animate-shake { animation: shake 0.5s ease-in-out; }
      `}</style>
    </div>
  )
}
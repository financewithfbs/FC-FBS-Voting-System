"use client"

import { useState, useEffect } from "react"
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

export default function Results() {
  const [currentRound, setCurrentRound] = useState(1)
  const [results, setResults] = useState<ResultsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [exportLoading, setExportLoading] = useState(false)

  useEffect(() => {
    fetchResults()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentRound])

  const fetchResults = async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/debate-results?round=${currentRound}`)
      if (!res.ok) throw new Error("Failed to fetch results")
      const data = await res.json()
      setResults(data)
    } catch (error) {
      console.error("Error fetching results:", error)
    } finally {
      setLoading(false)
    }
  }

  const getRoundInfo = () => {
    switch (currentRound) {
      case 1:
        return {
          title: "Semi-Finals Results",
          subtitle: "6 debates · winners advance to Finals",
          icon: "🎯",
          gradient: "from-blue-500 via-indigo-500 to-purple-500",
          glow: "shadow-[0_20px_60px_-20px_rgba(59,130,246,0.5)]",
          label: "Semi-Finals",
          sublabel: "6 Debates",
        }
      case 2:
        return {
          title: "Finals Results",
          subtitle: "3 debates · champions crowned",
          icon: "⚡",
          gradient: "from-[#6356D7] via-[#7E5FFF] to-pink-500",
          glow: "shadow-[0_20px_60px_-20px_rgba(126,95,255,0.5)]",
          label: "Finals",
          sublabel: "3 Debates",
        }
      default:
        return {
          title: "Results",
          subtitle: "",
          icon: "📊",
          gradient: "from-gray-500 to-gray-700",
          glow: "shadow-[0_20px_60px_-20px_rgba(107,114,128,0.5)]",
          label: "Results",
          sublabel: "—",
        }
    }
  }

  const getMedal = (position: number) => {
    switch (position) {
      case 0:
        return {
          emoji: "🥇",
          label: "Gold",
          gradient: "from-amber-400 via-yellow-400 to-amber-500",
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

  const getRoundName = () => {
    switch (currentRound) {
      case 1:
        return "Semi_Finals"
      case 2:
        return "Finals"
      default:
        return "Results"
    }
  }

  const exportToCSV = () => {
    if (!results) return

    setExportLoading(true)
    try {
      const headers = [
        "Round",
        "Debate Number",
        "Debate Name",
        "Team 1",
        "Team 1 Score",
        "Team 2",
        "Team 2 Score",
        "Winner",
        "Winner Score",
      ]

      const rows = results.debates.map((debate) => [
        currentRound === 1 ? "Semi-Finals" : "Finals",
        debate.debateNumber,
        debate.name || `Debate ${debate.debateNumber}`,
        debate.teams[0]?.teamName || "",
        debate.teams[0]?.totalScore || 0,
        debate.teams[1]?.teamName || "",
        debate.teams[1]?.totalScore || 0,
        debate.winner?.teamName || "",
        debate.winner?.score || 0,
      ])

      const csvContent = [
        headers.join(","),
        ...rows.map((row) => row.map((cell) => `"${cell}"`).join(",")),
      ].join("\n")

      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
      const link = document.createElement("a")
      const url = URL.createObjectURL(blob)

      const date = new Date().toISOString().split("T")[0]
      link.setAttribute("href", url)
      link.setAttribute("download", `debate_results_${getRoundName()}_${date}.csv`)
      link.style.visibility = "hidden"

      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
    } catch (error) {
      console.error("Error exporting CSV:", error)
      alert("Failed to export results. Please try again.")
    } finally {
      setExportLoading(false)
    }
  }

  // ───────── Loading ─────────
  if (loading) {
    return (
      <div className="relative rounded-2xl p-8 bg-gradient-to-br from-white via-violet-50/30 to-indigo-50/40 dark:from-[#0f0d1a] dark:via-[#100c20] dark:to-[#130f26] border border-violet-100/60 dark:border-white/5 shadow-[0_8px_40px_-12px_rgba(99,86,215,0.15)]">
        <div className="flex flex-col items-center justify-center py-16">
          <div className="relative w-12 h-12">
            <div className="absolute inset-0 rounded-full border-[3px] border-violet-100 dark:border-white/10" />
            <div className="absolute inset-0 rounded-full border-[3px] border-transparent border-t-violet-600 dark:border-t-violet-400 animate-spin" />
            <div className="absolute -inset-2 rounded-full bg-violet-500/10 blur-xl animate-pulse" />
          </div>
          <p className="mt-5 text-sm font-medium text-gray-600 dark:text-gray-400">
            Loading results…
          </p>
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
            Fetching the latest scores
          </p>
        </div>
      </div>
    )
  }

  const roundInfo = getRoundInfo()

  return (
    <div className="space-y-6">
      {/* ───────── Round Hero ───────── */}
      <div
        className={`relative overflow-hidden rounded-2xl bg-gradient-to-r ${roundInfo.gradient} ${roundInfo.glow} p-6 sm:p-7 text-white`}
      >
        {/* Inner blobs */}
        <div className="absolute -top-16 -right-16 w-56 h-56 rounded-full bg-white/20 blur-3xl" />
        <div className="absolute -bottom-16 -left-16 w-56 h-56 rounded-full bg-white/10 blur-3xl" />

        {/* Fine grid overlay */}
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

        <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-5">
          <div className="flex items-center gap-5">
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
              <p className="text-white/85 text-sm sm:text-base mt-1">
                {roundInfo.subtitle}
              </p>
            </div>
          </div>

          {/* Round selector pills */}
          <div className="flex gap-2 shrink-0 bg-white/15 backdrop-blur-md rounded-2xl p-1.5 border border-white/20">
            {[
              { n: 1, label: "Semi-Finals", icon: "🎯" },
              { n: 2, label: "Finals", icon: "⚡" },
            ].map((r) => {
              const active = currentRound === r.n
              return (
                <button
                  key={r.n}
                  onClick={() => setCurrentRound(r.n)}
                  className={`relative flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all duration-300 whitespace-nowrap ${
                    active
                      ? "bg-white text-gray-900 shadow-lg"
                      : "text-white/80 hover:bg-white/10 hover:text-white"
                  }`}
                >
                  <span className="text-sm">{r.icon}</span>
                  <span>{r.label}</span>
                </button>
              )
            })}
          </div>
        </div>
      </div>

      {results && (
        <>
          {/* ───────── Champions (Round 2) ───────── */}
          {currentRound === 2 && results.winners && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
              className="relative overflow-hidden rounded-2xl p-6 sm:p-8 bg-gradient-to-br from-amber-50/80 via-orange-50/60 to-yellow-50/80 dark:from-amber-950/30 dark:via-orange-950/20 dark:to-yellow-950/30 border border-amber-200/70 dark:border-amber-900/40 shadow-[0_20px_60px_-20px_rgba(251,191,36,0.5)]"
            >
              <div className="absolute inset-x-12 -top-px h-px bg-gradient-to-r from-transparent via-amber-400/70 to-transparent" />
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
                    <span className="font-bold bg-gradient-to-r from-amber-500 via-orange-500 to-amber-500 bg-clip-text text-transparent tracking-wider text-sm">
                      CHAMPIONS
                    </span>
                    <span className="text-2xl">🏆</span>
                  </motion.div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    The top three teams of the tournament
                  </p>
                </div>

                {/* Podium */}
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
                        <div className={`absolute inset-x-8 -top-px h-px bg-gradient-to-r from-transparent via-current to-transparent ${medal.text} opacity-50`} />
                        <div className={`absolute -top-12 -right-12 w-32 h-32 rounded-full bg-gradient-to-br ${medal.gradient} opacity-20 blur-2xl`} />

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

                        <h4 className="relative font-bold text-lg text-gray-900 dark:text-white mb-3 truncate px-2">
                          {winner.teamName}
                        </h4>

                        <div className="relative mb-2">
                          <p className={`text-4xl font-bold ${medal.text} tabular-nums`}>
                            {winner.score}
                          </p>
                          <p className="text-[10px] uppercase tracking-widest font-semibold text-gray-500 dark:text-gray-400 mt-1">
                            Final Score
                          </p>
                        </div>

                        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/60 dark:bg-white/[0.06] border border-white/70 dark:border-white/10 backdrop-blur-sm">
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
            </motion.div>
          )}

          {/* ───────── Debates Grid ───────── */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <AnimatePresence mode="popLayout">
              {results.debates.map((debate, index) => {
                const isCompleted = debate.status === "COMPLETED"
                const isActive = debate.status === "ACTIVE"
                const statusColor = isCompleted
                  ? "text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200/70 dark:border-emerald-500/20"
                  : isActive
                  ? "text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-500/10 border-amber-200/70 dark:border-amber-500/20"
                  : "text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-white/5 border-gray-200/70 dark:border-white/10"
                const statusDot = isCompleted ? "bg-emerald-500" : isActive ? "bg-amber-500" : "bg-gray-400"
                const statusLabel = isCompleted ? "Completed" : isActive ? "In Progress" : "Upcoming"

                return (
                  <motion.div
                    key={debate.debateId}
                    layout
                    initial={{ opacity: 0, y: 30, scale: 0.96 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -10, scale: 0.96 }}
                    transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1], delay: index * 0.05 }}
                    whileHover={{ y: -4 }}
                    className="relative rounded-2xl overflow-hidden bg-white dark:bg-white/[0.02] border border-violet-100/70 dark:border-white/5 hover:border-violet-300 dark:hover:border-violet-500/30 hover:shadow-[0_20px_60px_-20px_rgba(99,86,215,0.3)] dark:hover:shadow-[0_20px_60px_-20px_rgba(0,0,0,0.8)] transition-all"
                  >
                    {/* Header stripe */}
                    <div className="relative bg-gradient-to-r from-[#6356D7] via-[#7E5FFF] to-[#a385ff] px-5 py-4 overflow-hidden">
                      <div className="absolute -top-8 -right-8 w-28 h-28 rounded-full bg-white/20 blur-2xl" />
                      <div className="absolute top-1/2 -left-8 w-24 h-24 rounded-full bg-white/10 blur-2xl" />

                      <div className="relative flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <h3 className="text-base font-bold text-white truncate drop-shadow-sm">
                            {debate.name || `Debate ${debate.debateNumber}`}
                          </h3>
                          <div className="inline-flex items-center gap-1.5 mt-1.5 px-2 py-0.5 rounded-full bg-white/20 backdrop-blur-sm border border-white/30">
                            <span className="relative flex w-1.5 h-1.5">
                              {isActive && (
                                <span className="absolute inline-flex h-full w-full rounded-full bg-white opacity-75 animate-ping" />
                              )}
                              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-white" />
                            </span>
                            <span className="text-[10px] font-bold uppercase tracking-widest text-white">
                              {statusLabel}
                            </span>
                          </div>
                        </div>

                        <div className="shrink-0 w-11 h-11 rounded-2xl bg-white/20 backdrop-blur-sm border border-white/30 flex items-center justify-center">
                          <span className="text-sm font-bold text-white tabular-nums">
                            #{debate.debateNumber}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Teams */}
                    <div className="p-5">
                      <div className="grid grid-cols-2 gap-3 sm:gap-4">
                        {debate.teams.map((team, idx) => {
                          const isWinner = debate.winner?.teamId === team.teamId
                          return (
                            <div
                              key={team.teamId}
                              className={`relative rounded-2xl p-3 sm:p-4 overflow-hidden border transition-all duration-300 ${
                                isWinner
                                  ? "bg-gradient-to-br from-emerald-50/90 to-green-50/90 dark:from-emerald-900/25 dark:to-green-900/20 border-emerald-300/70 dark:border-emerald-900/50 shadow-[0_10px_30px_-15px_rgba(34,197,94,0.5)]"
                                  : "bg-white/70 dark:bg-white/[0.02] border-gray-200/60 dark:border-white/10"
                              }`}
                            >
                              {isWinner && (
                                <div className="absolute -top-8 -right-8 w-24 h-24 rounded-full bg-emerald-400/30 blur-2xl" />
                              )}

                              <div className="relative mb-3 flex items-start justify-between gap-2">
                                <div className={`font-bold text-sm truncate ${
                                  idx === 0
                                    ? "text-blue-600 dark:text-blue-400"
                                    : "text-violet-600 dark:text-violet-400"
                                }`}>
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

                              <div className="relative space-y-2">
                                {/* Panelist */}
                                <div className="rounded-xl bg-white/80 dark:bg-white/[0.04] border border-gray-200/60 dark:border-white/10 px-3 py-2">
                                  <div className="flex items-center justify-between gap-2">
                                    <span className="text-[10px] uppercase tracking-widest font-semibold text-gray-500 dark:text-gray-400">
                                      Panelist
                                    </span>
                                    <span className="text-[9px] font-bold text-violet-700 dark:text-violet-300 px-1.5 py-0.5 rounded-full bg-violet-50 dark:bg-violet-500/15 border border-violet-200/60 dark:border-violet-500/20">
                                      70%
                                    </span>
                                  </div>
                                  <p className="font-bold text-base text-gray-900 dark:text-white tabular-nums mt-0.5">
                                    {team.panelistWeighted}
                                  </p>
                                </div>

                                {/* Audience */}
                                <div className="rounded-xl bg-white/80 dark:bg-white/[0.04] border border-gray-200/60 dark:border-white/10 px-3 py-2">
                                  <div className="flex items-center justify-between gap-2">
                                    <span className="text-[10px] uppercase tracking-widest font-semibold text-gray-500 dark:text-gray-400">
                                      Audience
                                    </span>
                                    <span className="text-[9px] font-bold text-indigo-700 dark:text-indigo-300 px-1.5 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-500/15 border border-indigo-200/60 dark:border-indigo-500/20">
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
                                    ? "from-emerald-500/15 via-green-500/15 to-emerald-500/15 dark:from-emerald-500/25 dark:via-green-500/25 dark:to-emerald-500/25 border border-emerald-400/40 dark:border-emerald-500/40"
                                    : "from-[#6356D7]/10 via-[#7E5FFF]/10 to-[#6356D7]/10 dark:from-[#6356D7]/20 dark:via-[#7E5FFF]/20 dark:to-[#6356D7]/20 border border-[#6356D7]/25 dark:border-[#6356D7]/40"
                                }`}>
                                  <span className="text-[10px] uppercase tracking-widest font-semibold text-gray-600 dark:text-gray-300">
                                    Total
                                  </span>
                                  <p className={`font-bold text-xl tabular-nums mt-0.5 ${
                                    isWinner
                                      ? "text-emerald-600 dark:text-emerald-400"
                                      : "text-[#6356D7] dark:text-[#b3a6ff]"
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

          {/* ───────── Action bar ───────── */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 rounded-2xl p-4 bg-white/60 dark:bg-white/[0.02] backdrop-blur-xl border border-violet-100/70 dark:border-white/10"
          >
            {/* Info */}
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#6356D7] to-[#7E5FFF] flex items-center justify-center shadow-md shrink-0">
                <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <div className="min-w-0">
                <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500 dark:text-gray-400">
                  Ready to export
                </p>
                <p className="text-xs text-gray-700 dark:text-gray-300 truncate">
                  {results.debates.length} debates · {getRoundName().replace("_", " ")}
                </p>
              </div>
            </div>

            {/* Export button */}
            <button
              onClick={exportToCSV}
              disabled={exportLoading || !results}
              className="relative group shrink-0 overflow-hidden rounded-xl transition-transform duration-200 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:scale-100"
            >
              <div className="absolute -inset-0.5 bg-gradient-to-r from-[#6356D7] via-[#7E5FFF] to-[#a385ff] rounded-xl blur-md opacity-60 group-hover:opacity-90 transition-all duration-300" />
              <div className="relative px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#6356D7] via-[#7E5FFF] to-[#a385ff] bg-[length:200%_100%] group-hover:bg-[position:100%_0] text-white text-sm font-semibold shadow-lg transition-[background-position] duration-700 flex items-center gap-2">
                <span className="absolute inset-x-0 top-0 h-px bg-white/40 rounded-t-xl" />
                <span className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/30 to-transparent" />
                {exportLoading ? (
                  <>
                    <div className="relative w-4 h-4 border-2 border-white/70 border-t-transparent rounded-full animate-spin" />
                    <span className="relative">Exporting…</span>
                  </>
                ) : (
                  <>
                    <svg className="relative w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                    <span className="relative">Export CSV</span>
                  </>
                )}
              </div>
            </button>
          </motion.div>
        </>
      )}
    </div>
  )
}
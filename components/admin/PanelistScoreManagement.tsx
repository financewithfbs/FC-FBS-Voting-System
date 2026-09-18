"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { motion, AnimatePresence } from "framer-motion"

interface Team {
  id: string
  name: string
}

interface Debate {
  id: string
  round: number
  debateNumber: number
  name: string | null
  teams: {
    team: Team
  }[]
}

interface Props {
  selectedDebateId: string | null
  onDebateSelect: (id: string | null) => void
}

export default function PanelistScoreManagement({ selectedDebateId, onDebateSelect }: Props) {
  const { data: session } = useSession()
  const [debates, setDebates] = useState<Debate[]>([])
  const [loading, setLoading] = useState(true)
  const [scores, setScores] = useState<Record<string, number>>({})
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState({ type: "", text: "" })
  const [selectedRound, setSelectedRound] = useState(1)

  useEffect(() => {
    if (session?.user?.role === "ADMIN") {
      fetchDebates()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session])

  useEffect(() => {
    if (selectedDebateId) {
      fetchExistingScores(selectedDebateId)
    } else {
      setScores({})
    }
  }, [selectedDebateId])

  const fetchDebates = async () => {
    try {
      const res = await fetch("/api/admin/debates")
      if (!res.ok) throw new Error("Failed to fetch debates")
      const data = await res.json()
      setDebates(data)
    } catch (error) {
      console.error("Error fetching debates:", error)
      setMessage({ type: "error", text: "Failed to load debates" })
    } finally {
      setLoading(false)
    }
  }

  const fetchExistingScores = async (debateId: string) => {
    try {
      const res = await fetch(`/api/admin/panelist-scores/debate?debateId=${debateId}`)
      if (res.ok) {
        const data = await res.json()
        const scoresMap: Record<string, number> = {}
        data.forEach((score: any) => {
          scoresMap[score.teamId] = score.score
        })
        setScores(scoresMap)
      }
    } catch (error) {
      console.error("Error fetching scores:", error)
    }
  }

  const handleScoreChange = (teamId: string, score: number) => {
    const validScore = Math.min(100, Math.max(0, score))
    setScores((prev) => ({ ...prev, [teamId]: validScore }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedDebateId) return

    setSaving(true)
    setMessage({ type: "", text: "" })

    const selectedDebate = debates.find((d) => d.id === selectedDebateId)
    if (!selectedDebate) return

    const missingTeams = selectedDebate.teams.filter((team) => !scores[team.team.id])
    if (missingTeams.length > 0) {
      setMessage({
        type: "error",
        text: `Missing scores for: ${missingTeams.map((t) => t.team.name).join(", ")}`,
      })
      setSaving(false)
      return
    }

    try {
      const scoresArray = Object.entries(scores).map(([teamId, score]) => ({
        teamId,
        score,
      }))

      const res = await fetch("/api/admin/panelist-scores/debate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          debateId: selectedDebateId,
          scores: scoresArray,
        }),
      })

      const data = await res.json()

      if (res.ok) {
        setMessage({ type: "success", text: "Scores saved successfully!" })
        setTimeout(() => setMessage({ type: "", text: "" }), 3000)
      } else {
        setMessage({ type: "error", text: data.error || "Error saving scores" })
      }
    } catch (error) {
      console.error("Error saving scores:", error)
      setMessage({ type: "error", text: "Error saving scores" })
    } finally {
      setSaving(false)
    }
  }

  // ───────── Access denied ─────────
  if (!session || session.user?.role !== "ADMIN") {
    return (
      <div className="relative rounded-2xl p-8 bg-gradient-to-br from-white via-violet-50/30 to-indigo-50/40 dark:from-[#0f0d1a] dark:via-[#100c20] dark:to-[#130f26] border border-violet-100/60 dark:border-white/5 shadow-[0_8px_40px_-12px_rgba(99,86,215,0.15)]">
        <div className="text-center py-12">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-violet-100 to-indigo-100 dark:from-violet-500/15 dark:to-indigo-500/10 mb-4 border border-violet-200/70 dark:border-violet-500/20">
            <svg className="w-6 h-6 text-violet-600 dark:text-violet-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="11" width="18" height="11" rx="2" />
              <path d="M7 11V7a5 5 0 0110 0v4" />
            </svg>
          </div>
          <span className="block text-[10px] font-bold uppercase tracking-[0.18em] text-violet-600 dark:text-violet-400 mb-1.5">
            Restricted
          </span>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
            Admin access required
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            You don't have permission to enter panelist scores.
          </p>
        </div>
      </div>
    )
  }

  // ───────── Loading ─────────
  if (loading) {
    return (
      <div className="relative rounded-2xl p-8 bg-gradient-to-br from-white via-violet-50/30 to-indigo-50/40 dark:from-[#0f0d1a] dark:via-[#100c20] dark:to-[#130f26] border border-violet-100/60 dark:border-white/5 shadow-[0_8px_40px_-12px_rgba(99,86,215,0.15)]">
        <div className="flex flex-col items-center justify-center py-14">
          <div className="relative w-12 h-12">
            <div className="absolute inset-0 rounded-full border-[3px] border-violet-100 dark:border-white/10" />
            <div className="absolute inset-0 rounded-full border-[3px] border-transparent border-t-violet-600 dark:border-t-violet-400 animate-spin" />
            <div className="absolute -inset-2 rounded-full bg-violet-500/10 blur-xl animate-pulse" />
          </div>
          <p className="mt-5 text-sm font-medium text-gray-600 dark:text-gray-400">
            Loading debates…
          </p>
        </div>
      </div>
    )
  }

  const roundDebates = debates.filter((d) => d.round === selectedRound)
  const selectedDebate = debates.find((d) => d.id === selectedDebateId)
  const filledCount = selectedDebate
    ? selectedDebate.teams.filter((t) => scores[t.team.id] !== undefined && scores[t.team.id] !== 0).length
    : 0
  const totalTeams = selectedDebate?.teams.length ?? 0
  const filledPct = totalTeams > 0 ? (filledCount / totalTeams) * 100 : 0

  const rounds = [
    {
      n: 1,
      label: "Semi-Finals",
      sublabel: "Round 1",
      icon: "🎯",
      gradient: "from-blue-500 via-indigo-500 to-purple-500",
    },
    {
      n: 2,
      label: "Finals",
      sublabel: "Round 2",
      icon: "⚡",
      gradient: "from-[#6356D7] via-[#7E5FFF] to-pink-500",
    },
  ]

  return (
    <div className="relative">
      {/* Ambient decoration */}
      <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden rounded-3xl">
        <div className="absolute -top-40 -right-40 w-96 h-96 rounded-full bg-violet-300/20 dark:bg-violet-500/10 blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 rounded-full bg-indigo-300/20 dark:bg-indigo-500/10 blur-3xl" />
      </div>

      <div className="relative rounded-2xl bg-gradient-to-br from-white via-violet-50/20 to-indigo-50/30 dark:from-[#0f0d1a] dark:via-[#100c20] dark:to-[#130f26] border border-violet-100/60 dark:border-white/5 shadow-[0_8px_40px_-12px_rgba(99,86,215,0.15)] dark:shadow-[0_8px_40px_-12px_rgba(0,0,0,0.7)] overflow-hidden">
        {/* ───────── Header ───────── */}
        <div className="relative p-5 sm:p-6 border-b border-violet-100/60 dark:border-white/5">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="relative shrink-0">
                <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-violet-500 to-indigo-600 blur-md opacity-40" />
                <div className="relative w-12 h-12 rounded-2xl bg-gradient-to-br from-violet-500 via-violet-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-violet-500/25">
                  <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                  </svg>
                </div>
              </div>
              <div>
                <div className="flex items-center gap-2.5 flex-wrap mb-0.5">
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white tracking-tight">
                    Panelist Score Management
                  </h2>
                  {selectedDebate && (
                    <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-violet-700 dark:text-violet-300 bg-violet-50 dark:bg-violet-500/10 px-2 py-0.5 rounded-md border border-violet-200/70 dark:border-violet-500/20 tabular-nums">
                      <span className="w-1.5 h-1.5 rounded-full bg-violet-500" />
                      {filledCount}/{totalTeams} scored
                    </span>
                  )}
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Enter and save judge scores for each debate
                </p>
              </div>
            </div>

            {/* Round segmented control */}
            <div className="grid grid-cols-2 gap-1 p-1 rounded-2xl bg-gray-50/80 dark:bg-white/[0.03] border border-violet-100/70 dark:border-white/10">
              {rounds.map((r) => {
                const active = selectedRound === r.n
                const count = debates.filter((d) => d.round === r.n).length
                return (
                  <button
                    key={r.n}
                    onClick={() => {
                      setSelectedRound(r.n)
                      onDebateSelect(null)
                    }}
                    className={`relative rounded-xl p-[1px] transition-all duration-300 ${
                      active ? "scale-[1.02]" : "hover:scale-[1.01]"
                    }`}
                  >
                    {active && (
                      <div className={`absolute inset-0 rounded-xl bg-gradient-to-r ${r.gradient}`} />
                    )}
                    <div
                      className={`
                        relative flex items-center gap-2 px-3 py-2 rounded-xl transition-all duration-300
                        ${
                          active
                            ? `bg-gradient-to-r ${r.gradient} text-white shadow-[0_6px_20px_-6px_rgba(126,95,255,0.5)]`
                            : "bg-white/80 dark:bg-white/[0.04] text-gray-700 dark:text-gray-300"
                        }
                      `}
                    >
                      <span className="text-base shrink-0">{r.icon}</span>
                      <div className="text-left leading-tight min-w-0">
                        <p className="font-semibold text-xs truncate">{r.label}</p>
                        <p className={`text-[10px] truncate ${active ? "text-white/80" : "text-gray-500 dark:text-gray-400"}`}>
                          {count} debate{count !== 1 ? "s" : ""}
                        </p>
                      </div>
                    </div>
                  </button>
                )
              })}
            </div>
          </div>
        </div>

        {/* ───────── Message alert ───────── */}
        <div className="px-5 sm:px-6 pt-4">
          <AnimatePresence>
            {message.text && (
              <motion.div
                initial={{ opacity: 0, y: -6, height: 0 }}
                animate={{ opacity: 1, y: 0, height: "auto" }}
                exit={{ opacity: 0, y: -6, height: 0 }}
                className="overflow-hidden"
              >
                <div
                  className={`p-3 rounded-xl flex items-center gap-2.5 text-sm border ${
                    message.type === "success"
                      ? "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-200/70 dark:border-emerald-500/20"
                      : "bg-red-50 dark:bg-red-500/10 text-red-700 dark:text-red-300 border-red-200/70 dark:border-red-500/20"
                  }`}
                >
                  <span>{message.type === "success" ? "✅" : "❌"}</span>
                  <span className="flex-1 font-medium">{message.text}</span>
                  <button
                    onClick={() => setMessage({ type: "", text: "" })}
                    className="opacity-60 hover:opacity-100 transition-opacity"
                    aria-label="Dismiss"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* ───────── Main grid ───────── */}
        <div className="p-5 sm:p-6 grid grid-cols-1 lg:grid-cols-5 gap-5">
          {/* Debate list (2/5) */}
          <div className="lg:col-span-2">
            <div className="rounded-2xl bg-white dark:bg-white/[0.02] border border-violet-100/70 dark:border-white/5 shadow-sm overflow-hidden lg:sticky lg:top-6">
              <div className="px-5 py-3.5 border-b border-violet-100/60 dark:border-white/5 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-100 to-indigo-100 dark:from-violet-500/20 dark:to-indigo-500/15 text-violet-700 dark:text-violet-400 flex items-center justify-center border border-violet-200/70 dark:border-violet-500/20">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                    </svg>
                  </div>
                  <h4 className="text-sm font-semibold text-gray-900 dark:text-white">
                    Select debate
                  </h4>
                </div>
                <span className="text-[11px] font-medium text-gray-500 dark:text-gray-400 tabular-nums bg-gray-50 dark:bg-white/5 px-2 py-1 rounded-md">
                  {roundDebates.length}
                </span>
              </div>

              <div className="p-3 max-h-[520px] overflow-y-auto custom-scrollbar">
                {roundDebates.length === 0 ? (
                  <div className="text-center py-12 rounded-xl bg-gray-50/50 dark:bg-white/[0.02] border border-dashed border-violet-200/70 dark:border-white/10">
                    <div className="text-3xl mb-2 opacity-40">🎤</div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      No debates in this round
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <AnimatePresence mode="popLayout">
                      {roundDebates.map((debate, index) => {
                        const isSelected = selectedDebateId === debate.id
                        return (
                          <motion.button
                            key={debate.id}
                            layout
                            initial={{ opacity: 0, y: 12 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -6 }}
                            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1], delay: index * 0.03 }}
                            onClick={() => onDebateSelect(debate.id)}
                            className={`relative w-full text-left rounded-xl p-[1px] transition-all duration-300 overflow-hidden ${
                              isSelected
                                ? "bg-gradient-to-r from-violet-500 via-indigo-500 to-violet-500 shadow-[0_8px_24px_-8px_rgba(126,95,255,0.5)]"
                                : "bg-transparent hover:bg-violet-100/40 dark:hover:bg-white/[0.03]"
                            }`}
                          >
                            <div
                              className={`
                                relative flex items-start gap-3 p-3.5 rounded-xl transition-all duration-300
                                ${
                                  isSelected
                                    ? "bg-gradient-to-br from-violet-500/10 via-indigo-500/10 to-violet-500/10 dark:bg-white/[0.03]"
                                    : "bg-white dark:bg-white/[0.02] border border-violet-100/70 dark:border-white/5"
                                }
                              `}
                            >
                              {/* Icon */}
                              <div
                                className={`
                                  shrink-0 w-9 h-9 rounded-lg flex items-center justify-center text-sm font-bold tabular-nums border transition-all
                                  ${
                                    isSelected
                                      ? "bg-gradient-to-br from-violet-500 to-indigo-600 text-white border-transparent shadow-md"
                                      : "bg-gray-50 dark:bg-white/5 text-gray-600 dark:text-gray-400 border-violet-100 dark:border-white/5"
                                  }
                                `}
                              >
                                #{debate.debateNumber}
                              </div>

                              {/* Content */}
                              <div className="flex-1 min-w-0">
                                <p className={`text-sm font-semibold truncate ${
                                  isSelected ? "text-violet-900 dark:text-white" : "text-gray-900 dark:text-white"
                                }`}>
                                  {debate.name || `Debate ${debate.debateNumber}`}
                                </p>
                                <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5 truncate">
                                  {debate.teams.map((t) => t.team.name).join(" vs ")}
                                </p>
                              </div>

                              {/* Chevron */}
                              <svg
                                className={`shrink-0 w-4 h-4 transition-transform ${
                                  isSelected
                                    ? "text-violet-600 dark:text-violet-400 translate-x-0.5"
                                    : "text-gray-300 dark:text-gray-600"
                                }`}
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                                strokeWidth="2.5"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              >
                                <path d="M9 5l7 7-7 7" />
                              </svg>
                            </div>
                          </motion.button>
                        )
                      })}
                    </AnimatePresence>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Score entry (3/5) */}
          <div className="lg:col-span-3">
            <AnimatePresence mode="wait">
              {selectedDebate ? (
                <motion.div
                  key={selectedDebate.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                  className="rounded-2xl bg-white dark:bg-white/[0.02] border border-violet-100/70 dark:border-white/5 shadow-sm overflow-hidden"
                >
                  {/* Header */}
                  <div className="relative px-5 py-4 border-b border-violet-100/60 dark:border-white/5 bg-gradient-to-r from-violet-50/50 to-indigo-50/30 dark:from-violet-500/[0.06] dark:to-indigo-500/[0.04]">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <span className="inline-flex items-center justify-center w-6 h-6 rounded-md bg-gradient-to-br from-violet-500 to-indigo-600 text-white text-[10px] font-bold tabular-nums shadow-sm">
                            #{selectedDebate.debateNumber}
                          </span>
                          <h3 className="text-base font-semibold text-gray-900 dark:text-white truncate">
                            {selectedDebate.name || `Debate ${selectedDebate.debateNumber}`}
                          </h3>
                        </div>
                        <p className="text-[11px] text-gray-500 dark:text-gray-400">
                          Enter scores from 0 to 100 · 0.5 increments allowed
                        </p>
                      </div>

                      {totalTeams > 0 && (
                        <div className="shrink-0 text-right">
                          <p className="text-[10px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                            Progress
                          </p>
                          <p className="text-sm font-bold tabular-nums bg-gradient-to-r from-violet-600 to-indigo-600 bg-clip-text text-transparent">
                            {filledCount}/{totalTeams}
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Progress bar */}
                    {totalTeams > 0 && (
                      <div className="mt-3 h-1 rounded-full bg-violet-100/70 dark:bg-white/5 overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${filledPct}%` }}
                          transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                          className={`h-full rounded-full bg-gradient-to-r ${
                            filledPct === 100
                              ? "from-emerald-500 via-emerald-500 to-green-500"
                              : "from-violet-500 via-violet-600 to-indigo-600"
                          }`}
                        />
                      </div>
                    )}
                  </div>

                  {/* Form */}
                  <form onSubmit={handleSubmit} className="p-5 space-y-3.5">
                    {selectedDebate.teams.map((team, index) => {
                      const score = scores[team.team.id]
                      const hasScore = score !== undefined && score !== null
                      const teamAccent = index === 0
                        ? { gradient: "from-blue-500 to-indigo-500", text: "text-blue-600 dark:text-blue-400", bg: "bg-blue-50 dark:bg-blue-500/10", border: "border-blue-200/70 dark:border-blue-500/20", dot: "bg-blue-500" }
                        : { gradient: "from-violet-500 to-pink-500", text: "text-violet-600 dark:text-violet-400", bg: "bg-violet-50 dark:bg-violet-500/10", border: "border-violet-200/70 dark:border-violet-500/20", dot: "bg-violet-500" }

                      return (
                        <motion.div
                          key={team.team.id}
                          initial={{ opacity: 0, y: 12 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.3, delay: index * 0.05 }}
                          className={`relative rounded-xl p-[1px] transition-all ${
                            hasScore
                              ? `bg-gradient-to-r ${teamAccent.gradient}`
                              : "bg-transparent"
                          }`}
                        >
                          <div
                            className={`
                              relative rounded-xl p-3.5 sm:p-4 transition-all
                              ${
                                hasScore
                                  ? "bg-white dark:bg-white/[0.02]"
                                  : "bg-gray-50/70 dark:bg-white/[0.02] border border-violet-100/70 dark:border-white/5"
                              }
                            `}
                          >
                            <div className="flex items-center justify-between gap-4">
                              {/* Team info */}
                              <div className="flex items-center gap-3 min-w-0 flex-1">
                                <div
                                  className={`shrink-0 w-9 h-9 rounded-xl bg-gradient-to-br ${teamAccent.gradient} flex items-center justify-center text-white text-sm font-bold shadow-md`}
                                >
                                  {index + 1}
                                </div>
                                <div className="min-w-0">
                                  <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                                    {team.team.name}
                                  </p>
                                  <div className="flex items-center gap-1.5 mt-0.5">
                                    <span className={`w-1.5 h-1.5 rounded-full ${hasScore ? teamAccent.dot : "bg-gray-300 dark:bg-gray-600"}`} />
                                    <span className={`text-[10px] font-semibold uppercase tracking-wider ${
                                      hasScore ? teamAccent.text : "text-gray-400 dark:text-gray-500"
                                    }`}>
                                      {hasScore ? "Scored" : "Pending"}
                                    </span>
                                  </div>
                                </div>
                              </div>

                              {/* Score input */}
                              <div className="flex items-center gap-2 shrink-0">
                                <div className="relative">
                                  <input
                                    type="number"
                                    min="0"
                                    max="100"
                                    step="0.5"
                                    value={score ?? ""}
                                    onChange={(e) =>
                                      handleScoreChange(team.team.id, parseFloat(e.target.value) || 0)
                                    }
                                    placeholder="—"
                                    required
                                    className={`
                                      w-24 px-3 py-2.5 rounded-xl text-center text-base font-bold tabular-nums
                                      bg-white dark:bg-white/[0.03]
                                      text-gray-900 dark:text-gray-100
                                      border-2 transition-all
                                      placeholder:text-gray-300 dark:placeholder:text-gray-600
                                      focus:outline-none
                                      ${
                                        hasScore
                                          ? `border-transparent focus:border-violet-400 dark:focus:border-violet-500/50 focus:shadow-[0_0_0_4px_rgba(139,92,246,0.12)]`
                                          : `border-violet-100 dark:border-white/10 focus:border-violet-400 dark:focus:border-violet-500/50 focus:shadow-[0_0_0_4px_rgba(139,92,246,0.12)]`
                                      }
                                    `}
                                  />
                                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-gray-400 dark:text-gray-500 pointer-events-none">
                                    /100
                                  </span>
                                </div>

                                {/* Stepper buttons */}
                                <div className="flex flex-col gap-0.5">
                                  <button
                                    type="button"
                                    onClick={() =>
                                      handleScoreChange(team.team.id, Math.min(100, (score || 0) + 0.5))
                                    }
                                    className="w-6 h-5 rounded-t-md flex items-center justify-center bg-gray-100 hover:bg-violet-100 dark:bg-white/5 dark:hover:bg-violet-500/15 text-gray-600 hover:text-violet-600 dark:text-gray-400 dark:hover:text-violet-400 transition-all active:scale-95"
                                    aria-label="Increase score"
                                  >
                                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                                      <path d="M5 12h14M12 5v14" />
                                    </svg>
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() =>
                                      handleScoreChange(team.team.id, Math.max(0, (score || 0) - 0.5))
                                    }
                                    className="w-6 h-5 rounded-b-md flex items-center justify-center bg-gray-100 hover:bg-violet-100 dark:bg-white/5 dark:hover:bg-violet-500/15 text-gray-600 hover:text-violet-600 dark:text-gray-400 dark:hover:text-violet-400 transition-all active:scale-95"
                                    aria-label="Decrease score"
                                  >
                                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                                      <path d="M5 12h14" />
                                    </svg>
                                  </button>
                                </div>
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      )
                    })}

                    {/* Submit */}
                    <div className="pt-3 flex flex-col sm:flex-row sm:justify-end gap-3">
                      <button
                        type="button"
                        onClick={() => setScores({})}
                        className="px-4 py-2.5 rounded-xl text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-white/[0.03] border border-violet-100 dark:border-white/10 hover:bg-gray-50 dark:hover:bg-white/[0.06] transition-all active:scale-[0.98]"
                      >
                        Clear all
                      </button>
                      <button
                        type="submit"
                        disabled={saving || filledCount !== totalTeams}
                        className="group relative overflow-hidden rounded-xl transition-transform duration-200 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:scale-100"
                      >
                        <div className="absolute -inset-0.5 bg-gradient-to-r from-violet-500 via-violet-600 to-indigo-600 rounded-xl blur-md opacity-60 group-hover:opacity-90 transition-all duration-300" />
                        <div className="relative px-6 py-2.5 rounded-xl bg-gradient-to-r from-violet-500 via-violet-600 to-indigo-600 bg-[length:200%_100%] group-hover:bg-[position:100%_0] text-white text-sm font-semibold shadow-md transition-[background-position] duration-700 flex items-center gap-2">
                          <span className="absolute inset-x-0 top-0 h-px bg-white/40 rounded-t-xl" />
                          <span className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/25 to-transparent" />
                          {saving ? (
                            <>
                              <div className="relative w-3.5 h-3.5 border-2 border-white/70 border-t-transparent rounded-full animate-spin" />
                              <span className="relative">Saving…</span>
                            </>
                          ) : (
                            <>
                              <svg className="relative w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M5 13l4 4L19 7" />
                              </svg>
                              <span className="relative">Save scores</span>
                            </>
                          )}
                        </div>
                      </button>
                    </div>
                  </form>
                </motion.div>
              ) : (
                <motion.div
                  key="empty"
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                  className="rounded-2xl bg-white dark:bg-white/[0.02] border border-violet-100/70 dark:border-white/5 shadow-sm overflow-hidden"
                >
                  <div className="text-center py-20 px-6">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-100 to-indigo-100 dark:from-violet-500/15 dark:to-indigo-500/10 mb-4 border border-violet-200/70 dark:border-violet-500/20">
                      <svg className="w-7 h-7 text-violet-500 dark:text-violet-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" />
                      </svg>
                    </div>
                    <h4 className="text-base font-semibold text-gray-900 dark:text-white mb-1">
                      Select a debate
                    </h4>
                    <p className="text-sm text-gray-500 dark:text-gray-400 max-w-xs mx-auto">
                      Pick a debate from the list on the left to begin entering panelist scores.
                    </p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 5px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #ddd6fe;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #c4b5fd;
        }
        :global(.dark) .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #3f3f46;
        }
        :global(.dark) .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #52525b;
        }

        input[type="number"]::-webkit-outer-spin-button,
        input[type="number"]::-webkit-inner-spin-button {
          -webkit-appearance: none;
          margin: 0;
        }
        input[type="number"] {
          -moz-appearance: textfield;
        }
      `}</style>
    </div>
  )
}
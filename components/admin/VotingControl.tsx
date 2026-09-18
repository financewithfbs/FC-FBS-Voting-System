"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { motion, AnimatePresence } from "framer-motion"

interface Debate {
  id: string
  round: number
  debateNumber: number
  name: string | null
  status: string
  teams: {
    team: {
      id: string
      name: string
    }
  }[]
  votingControl: {
    isActive: boolean
    startTime: string | null
    endTime: string | null
  } | null
}

export default function VotingControl() {
  const { data: session } = useSession()
  const [debates, setDebates] = useState<Debate[]>([])
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState<string | null>(null)
  const [message, setMessage] = useState({ type: "", text: "" })
  const [selectedRound, setSelectedRound] = useState<number>(1)

  useEffect(() => {
    if (session?.user?.role === "ADMIN") {
      fetchDebates()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session])

  const fetchDebates = async () => {
    setLoading(true)
    try {
      const res = await fetch("/api/admin/debates")

      if (res.status === 401) {
        setMessage({
          type: "error",
          text: "Unauthorized access. Please refresh and sign in again.",
        })
        return
      }

      if (!res.ok) {
        const errorData = await res.json()
        throw new Error(errorData.error || "Failed to fetch debates")
      }

      const data = await res.json()
      setDebates(data)
    } catch (error: any) {
      console.error("Error fetching debates:", error)
      setMessage({ type: "error", text: error.message || "Failed to load debates" })
    } finally {
      setLoading(false)
    }
  }

  const toggleVoting = async (debateId: string, currentStatus: boolean) => {
    setUpdating(debateId)
    setMessage({ type: "", text: "" })

    try {
      const res = await fetch("/api/admin/debate-control", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ debateId, isActive: !currentStatus }),
      })

      const data = await res.json()

      if (!res.ok) throw new Error(data.error || "Failed to update voting status")

      setMessage({
        type: "success",
        text: `Voting ${!currentStatus ? "started" : "stopped"} successfully!`,
      })

      setDebates((prev) =>
        prev.map((debate) =>
          debate.id === debateId
            ? {
                ...debate,
                status: !currentStatus ? "ACTIVE" : "UPCOMING",
                votingControl: debate.votingControl
                  ? {
                      ...debate.votingControl,
                      isActive: !currentStatus,
                      startTime: !currentStatus
                        ? new Date().toISOString()
                        : debate.votingControl.startTime,
                      endTime: currentStatus
                        ? new Date().toISOString()
                        : debate.votingControl.endTime,
                    }
                  : {
                      isActive: !currentStatus,
                      startTime: !currentStatus ? new Date().toISOString() : null,
                      endTime: currentStatus ? new Date().toISOString() : null,
                    },
              }
            : debate
        )
      )

      setTimeout(() => setMessage({ type: "", text: "" }), 3000)
    } catch (error: any) {
      console.error("Error updating voting control:", error)
      setMessage({ type: "error", text: error.message || "Failed to update voting status" })
    } finally {
      setUpdating(null)
    }
  }

  // ───────── Access guard ─────────
  if (!session || session.user?.role !== "ADMIN") {
    return (
      <div className="relative rounded-3xl p-6 bg-white/60 dark:bg-white/[0.03] backdrop-blur-2xl border border-white/70 dark:border-white/10 shadow-[0_20px_60px_-20px_rgba(99,86,215,0.2)]">
        <div className="text-center py-10">
          <div className="relative inline-block mb-4">
            <div className="absolute inset-0 bg-gradient-to-br from-[#6356D7]/30 to-[#7E5FFF]/30 rounded-full blur-2xl" />
            <div className="relative w-16 h-16 rounded-2xl bg-gradient-to-br from-[#6356D7]/20 to-[#7E5FFF]/20 border border-[#6356D7]/30 flex items-center justify-center">
              <span className="text-3xl">🔒</span>
            </div>
          </div>
          <p className="text-[10px] uppercase tracking-widest font-semibold text-[#6356D7] dark:text-[#b3a6ff] mb-1">
            Restricted
          </p>
          <p className="text-gray-600 dark:text-gray-400 text-sm">
            Admin access required
          </p>
        </div>
      </div>
    )
  }

  // ───────── Loading ─────────
  if (loading) {
    return (
      <div className="relative rounded-3xl p-6 bg-white/60 dark:bg-white/[0.03] backdrop-blur-2xl border border-white/70 dark:border-white/10 shadow-[0_20px_60px_-20px_rgba(99,86,215,0.2)]">
        <div className="flex justify-center items-center py-12">
          <div className="relative w-10 h-10">
            <div className="absolute inset-0 border-4 border-[#6356D7]/20 dark:border-white/10 rounded-full" />
            <div className="absolute inset-0 border-4 border-transparent border-t-[#7E5FFF] rounded-full animate-spin" />
            <div className="absolute inset-0 bg-gradient-to-r from-[#6356D7]/30 to-[#7E5FFF]/30 rounded-full blur-xl animate-pulse" />
          </div>
        </div>
      </div>
    )
  }

  const filteredDebates = debates.filter((d) => d.round === selectedRound)

  const rounds = [
    {
      n: 1,
      label: "Semi-Finals",
      sublabel: "Round 1",
      icon: "🎯",
      gradient: "from-blue-500 via-indigo-500 to-purple-500",
      glow: "shadow-[0_10px_30px_-10px_rgba(59,130,246,0.5)]",
    },
    {
      n: 2,
      label: "Finals",
      sublabel: "Round 2",
      icon: "⚡",
      gradient: "from-[#6356D7] via-[#7E5FFF] to-pink-500",
      glow: "shadow-[0_10px_30px_-10px_rgba(126,95,255,0.5)]",
    },
  ]

  return (
    <div className="relative rounded-3xl p-6 sm:p-7 bg-white/60 dark:bg-white/[0.03] backdrop-blur-2xl border border-white/70 dark:border-white/10 shadow-[0_20px_60px_-20px_rgba(99,86,215,0.25)] dark:shadow-[0_20px_60px_-20px_rgba(0,0,0,0.8)] overflow-hidden">
      {/* Top hairline */}
      <div className="absolute inset-x-10 -top-px h-px bg-gradient-to-r from-transparent via-[#7E5FFF]/60 to-transparent" />

      {/* Inner ambient blob */}
      <div className="pointer-events-none absolute -top-24 -right-24 w-64 h-64 rounded-full bg-[#7E5FFF]/15 dark:bg-[#7E5FFF]/10 blur-3xl" />

      {/* ───────── Header ───────── */}
      <div className="relative flex items-start justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <div className="relative shrink-0">
            <div className="absolute inset-0 bg-gradient-to-br from-[#6356D7] to-[#7E5FFF] rounded-xl blur-lg opacity-50" />
            <div className="relative w-11 h-11 rounded-xl bg-gradient-to-br from-[#6356D7] via-[#7E5FFF] to-[#a385ff] flex items-center justify-center shadow-lg">
              <svg
                className="w-5 h-5 text-white"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
            </div>
          </div>
          <div className="leading-tight">
            <h3 className="text-base sm:text-lg font-bold text-gray-900 dark:text-white">
              Debate Voting{" "}
              <span className="bg-gradient-to-r from-[#6356D7] via-[#7E5FFF] to-[#a385ff] bg-clip-text text-transparent">
                Control
              </span>
            </h3>
            <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5">
              Start or stop voting per debate in real time
            </p>
          </div>
        </div>

        {/* Live count pill */}
        <div className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/70 dark:bg-white/[0.05] border border-white/70 dark:border-white/10 backdrop-blur-sm">
          <span className="relative flex w-1.5 h-1.5">
            {debates.some((d) => d.votingControl?.isActive) && (
              <span className="absolute inline-flex h-full w-full rounded-full bg-green-500 opacity-75 animate-ping" />
            )}
            <span
              className={`relative inline-flex rounded-full h-1.5 w-1.5 ${
                debates.some((d) => d.votingControl?.isActive) ? "bg-green-500" : "bg-gray-400"
              }`}
            />
          </span>
          <span className="text-[10px] font-bold uppercase tracking-widest text-gray-600 dark:text-gray-300 tabular-nums">
            {debates.filter((d) => d.votingControl?.isActive).length} / {debates.length} Live
          </span>
        </div>
      </div>

      {/* ───────── Message alert ───────── */}
      <AnimatePresence>
        {message.text && (
          <motion.div
            initial={{ opacity: 0, y: -10, height: 0 }}
            animate={{ opacity: 1, y: 0, height: "auto" }}
            exit={{ opacity: 0, y: -10, height: 0 }}
            transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
            className={`mb-4 overflow-hidden`}
          >
            <div
              className={`p-3 rounded-2xl flex items-center gap-2 text-sm border backdrop-blur-sm ${
                message.type === "success"
                  ? "bg-green-50/90 dark:bg-green-900/25 text-green-700 dark:text-green-300 border-green-200/70 dark:border-green-900/40 shadow-[0_10px_30px_-15px_rgba(34,197,94,0.5)]"
                  : "bg-red-50/90 dark:bg-red-900/25 text-red-700 dark:text-red-300 border-red-200/70 dark:border-red-900/40 shadow-[0_10px_30px_-15px_rgba(239,68,68,0.5)]"
              }`}
            >
              <span className="text-base">{message.type === "success" ? "✅" : "❌"}</span>
              <span className="flex-1 font-medium">{message.text}</span>
              <button
                onClick={() => setMessage({ type: "", text: "" })}
                className="text-current opacity-60 hover:opacity-100 transition-opacity"
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

      {/* ───────── Round selector ───────── */}
      <div className="relative mb-6">
        <div className="grid grid-cols-2 gap-2 p-1.5 rounded-2xl bg-white/60 dark:bg-white/[0.03] border border-white/70 dark:border-white/10 backdrop-blur-sm">
          {rounds.map((r) => {
            const active = selectedRound === r.n
            const count = debates.filter((d) => d.round === r.n).length
            const liveCount = debates.filter((d) => d.round === r.n && d.votingControl?.isActive).length

            return (
              <button
                key={r.n}
                onClick={() => setSelectedRound(r.n)}
                className={`relative group rounded-xl p-[1px] transition-all duration-300 ${
                  active ? "scale-[1.02]" : "hover:scale-[1.01]"
                }`}
              >
                {active && (
                  <div className={`absolute inset-0 bg-gradient-to-r ${r.gradient} rounded-xl`} />
                )}
                <div
                  className={`
                    relative flex items-center gap-2.5 px-3 py-2.5 rounded-xl transition-all duration-300
                    ${
                      active
                        ? `bg-gradient-to-r ${r.gradient} text-white ${r.glow}`
                        : "bg-white/80 dark:bg-white/[0.04] text-gray-700 dark:text-gray-300"
                    }
                  `}
                >
                  <span className="text-lg shrink-0">{r.icon}</span>
                  <div className="text-left leading-tight min-w-0 flex-1">
                    <p className="font-semibold text-sm truncate">{r.label}</p>
                    <p className={`text-[10px] truncate ${active ? "text-white/80" : "text-gray-500 dark:text-gray-400"}`}>
                      {count} debate{count !== 1 ? "s" : ""}
                      {liveCount > 0 && (
                        <span className="ml-1.5 inline-flex items-center gap-1">
                          <span className="w-1 h-1 rounded-full bg-green-400 animate-pulse" />
                          <span className="tabular-nums">{liveCount} live</span>
                        </span>
                      )}
                    </p>
                  </div>
                  {active && (
                    <span className="shrink-0 w-1.5 h-1.5 rounded-full bg-white shadow-[0_0_10px_rgba(255,255,255,0.9)] animate-pulse" />
                  )}
                </div>
              </button>
            )
          })}
        </div>
      </div>

      {/* ───────── Debate list ───────── */}
      <div className="space-y-3">
        {filteredDebates.length === 0 ? (
          <div className="text-center py-12 rounded-2xl bg-white/40 dark:bg-white/[0.02] border border-dashed border-gray-200 dark:border-white/10">
            <div className="text-4xl mb-3 opacity-60">🎤</div>
            <p className="text-gray-500 dark:text-gray-400 text-sm">
              No debates found for this round.
            </p>
          </div>
        ) : (
          <AnimatePresence mode="popLayout">
            {filteredDebates.map((debate, index) => {
              const isActive = debate.votingControl?.isActive || false
              const startTime = debate.votingControl?.startTime
              const endTime = debate.votingControl?.endTime
              const isUpdating = updating === debate.id

              return (
                <motion.div
                  key={debate.id}
                  layout
                  initial={{ opacity: 0, y: 20, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -10, scale: 0.98 }}
                  transition={{
                    duration: 0.4,
                    ease: [0.22, 1, 0.36, 1],
                    delay: index * 0.04,
                  }}
                  className={`
                    relative rounded-2xl p-[1px] overflow-hidden transition-all duration-500
                    ${isActive ? "bg-gradient-to-r from-green-400/60 via-emerald-400/60 to-green-400/60" : "bg-transparent"}
                  `}
                >
                  {/* Active glow */}
                  {isActive && (
                    <div className="absolute -inset-1 bg-gradient-to-r from-green-400/40 to-emerald-400/40 rounded-2xl blur-xl opacity-60" />
                  )}

                  <div
                    className={`
                      relative rounded-2xl p-4 sm:p-5 transition-all duration-300
                      ${
                        isActive
                          ? "bg-gradient-to-br from-green-50/95 to-emerald-50/95 dark:from-green-900/25 dark:to-emerald-900/20 border border-transparent"
                          : "bg-white/70 dark:bg-white/[0.02] border border-white/70 dark:border-white/10 hover:border-[#7E5FFF]/30"
                      }
                    `}
                  >
                    {/* Row: header + toggle */}
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div className="flex items-start gap-3 min-w-0 flex-1">
                        {/* Debate icon */}
                        <div className="relative shrink-0">
                          {isActive && (
                            <div className="absolute inset-0 bg-gradient-to-br from-green-500 to-emerald-500 rounded-xl blur-lg opacity-60" />
                          )}
                          <div
                            className={`
                              relative w-11 h-11 rounded-xl flex items-center justify-center text-white text-lg shadow-lg
                              ${
                                isActive
                                  ? "bg-gradient-to-br from-green-500 via-emerald-500 to-green-500"
                                  : debate.round === 1
                                  ? "bg-gradient-to-br from-blue-500 via-indigo-500 to-purple-500"
                                  : "bg-gradient-to-br from-[#6356D7] via-[#7E5FFF] to-pink-500"
                              }
                            `}
                          >
                            {isActive ? (
                              <span className="relative flex items-center justify-center">
                                <span className="absolute inline-flex w-full h-full rounded-full bg-white opacity-30 animate-ping" />
                                <svg
                                  className="relative w-5 h-5"
                                  fill="none"
                                  viewBox="0 0 24 24"
                                  stroke="currentColor"
                                  strokeWidth="2.5"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                >
                                  <path d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                                </svg>
                              </span>
                            ) : (
                              <span>{debate.round === 1 ? "🎯" : "⚡"}</span>
                            )}
                          </div>
                        </div>

                        {/* Name + status */}
                        <div className="min-w-0 flex-1">
                          <h4 className="font-bold text-gray-900 dark:text-white text-sm sm:text-base truncate">
                            {debate.name || `Debate ${debate.debateNumber}`}
                          </h4>

                          <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
                            <span
                              className={`
                                inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border
                                ${
                                  isActive
                                    ? "bg-green-100/80 dark:bg-green-900/30 text-green-700 dark:text-green-300 border-green-200/70 dark:border-green-900/40"
                                    : "bg-gray-100/80 dark:bg-white/[0.04] text-gray-600 dark:text-gray-400 border-gray-200/70 dark:border-white/10"
                                }
                              `}
                            >
                              <span className="relative flex w-1.5 h-1.5">
                                {isActive && (
                                  <span className="absolute inline-flex h-full w-full rounded-full bg-green-500 opacity-75 animate-ping" />
                                )}
                                <span
                                  className={`relative inline-flex rounded-full h-1.5 w-1.5 ${
                                    isActive ? "bg-green-500" : "bg-gray-400"
                                  }`}
                                />
                              </span>
                              {isActive ? "Active" : "Inactive"}
                            </span>

                            {startTime && (
                              <span className="inline-flex items-center gap-1 text-[10px] font-medium text-gray-500 dark:text-gray-400 tabular-nums">
                                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                  <circle cx="12" cy="12" r="10" />
                                  <path d="M12 6v6l4 2" />
                                </svg>
                                Started {new Date(startTime).toLocaleTimeString()}
                              </span>
                            )}

                            {endTime && !isActive && (
                              <span className="inline-flex items-center gap-1 text-[10px] font-medium text-gray-500 dark:text-gray-400 tabular-nums">
                                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                  <circle cx="12" cy="12" r="10" />
                                  <path d="M12 6v6l4 2" />
                                </svg>
                                Ended {new Date(endTime).toLocaleTimeString()}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Toggle button */}
                      <button
                        onClick={() => toggleVoting(debate.id, isActive)}
                        disabled={isUpdating}
                        className="relative group/btn shrink-0 overflow-hidden rounded-xl transition-transform duration-200 hover:scale-[1.03] active:scale-[0.97] disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:scale-100"
                      >
                        <div
                          className={`
                            absolute -inset-0.5 rounded-xl blur-md opacity-60 group-hover/btn:opacity-90 transition-all duration-300
                            ${
                              isActive
                                ? "bg-gradient-to-r from-red-500 to-rose-500"
                                : "bg-gradient-to-r from-green-500 to-emerald-500"
                            }
                          `}
                        />
                        <div
                          className={`
                            relative px-4 py-2.5 rounded-xl text-white text-xs sm:text-sm font-semibold shadow-lg
                            bg-gradient-to-r bg-[length:200%_100%] group-hover/btn:bg-[position:100%_0]
                            transition-[background-position] duration-700
                            ${
                              isActive
                                ? "from-red-500 via-rose-500 to-red-500"
                                : "from-green-500 via-emerald-500 to-green-500"
                            }
                          `}
                        >
                          <span className="absolute inset-x-0 top-0 h-px bg-white/40 rounded-t-xl" />
                          <span className="absolute inset-0 -translate-x-full group-hover/btn:translate-x-full transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/30 to-transparent" />

                          <span className="relative flex items-center justify-center gap-1.5">
                            {isUpdating ? (
                              <>
                                <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                <span className="hidden sm:inline">Updating...</span>
                              </>
                            ) : isActive ? (
                              <>
                                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
                                  <rect x="6" y="6" width="12" height="12" rx="1.5" />
                                </svg>
                                <span className="hidden sm:inline">Stop</span>
                              </>
                            ) : (
                              <>
                                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
                                  <path d="M8 5v14l11-7z" />
                                </svg>
                                <span className="hidden sm:inline">Start</span>
                              </>
                            )}
                          </span>
                        </div>
                      </button>
                    </div>

                    {/* Teams row */}
                    <div className="pt-3 border-t border-gray-200/70 dark:border-white/10">
                      <p className="text-[10px] uppercase tracking-widest font-semibold text-gray-500 dark:text-gray-400 mb-2">
                        Teams
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {debate.teams.map((team, idx) => (
                          <div
                            key={team.team.id}
                            className={`
                              inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border backdrop-blur-sm transition-all duration-300
                              ${
                                isActive
                                  ? "bg-white/80 dark:bg-white/[0.06] text-green-800 dark:text-green-200 border-green-300/70 dark:border-green-900/50"
                                  : "bg-white/80 dark:bg-white/[0.04] text-gray-700 dark:text-gray-300 border-gray-200/70 dark:border-white/10"
                              }
                            `}
                          >
                            <span
                              className={`
                                w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-bold text-white
                                ${
                                  idx === 0
                                    ? "bg-gradient-to-br from-blue-500 to-indigo-500"
                                    : "bg-gradient-to-br from-[#6356D7] to-pink-500"
                                }
                              `}
                            >
                              {idx + 1}
                            </span>
                            <span className="truncate max-w-[140px]">{team.team.name}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </motion.div>
              )
            })}
          </AnimatePresence>
        )}
      </div>

      {/* ───────── Tip footer ───────── */}
      <div className="mt-5 relative overflow-hidden rounded-2xl p-3.5 bg-gradient-to-r from-[#6356D7]/8 via-[#7E5FFF]/8 to-[#6356D7]/8 dark:from-[#6356D7]/15 dark:via-[#7E5FFF]/15 dark:to-[#6356D7]/15 border border-[#6356D7]/20 dark:border-[#6356D7]/30 backdrop-blur-sm">
        <div className="absolute -top-6 -right-6 w-20 h-20 rounded-full bg-[#7E5FFF]/20 blur-2xl" />
        <div className="relative flex items-start gap-2.5">
          <div className="shrink-0 w-7 h-7 rounded-lg bg-gradient-to-br from-[#6356D7] to-[#7E5FFF] flex items-center justify-center shadow">
            <span className="text-xs">💡</span>
          </div>
          <p className="text-[11px] sm:text-xs text-[#313053] dark:text-[#c4b8ff] leading-relaxed">
            Control voting for each debate individually. When active, audience can vote for their preferred team in that debate.
          </p>
        </div>
      </div>
    </div>
  )
}
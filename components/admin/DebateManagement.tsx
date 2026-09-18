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
  status: string
  teams: {
    team: Team
    score: number | null
  }[]
}

export default function DebateManagement() {
  const { data: session } = useSession()
  const [debates, setDebates] = useState<Debate[]>([])
  const [teams, setTeams] = useState<Team[]>([])
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState({ type: "", text: "" })
  const [selectedRound, setSelectedRound] = useState(1)
  const [selectedTeams, setSelectedTeams] = useState<{
    [key: string]: { team1: string; team2: string }
  }>({})
  const [initializing, setInitializing] = useState(false)
  const [assigningId, setAssigningId] = useState<string | null>(null)

  useEffect(() => {
    if (session?.user?.role === "ADMIN") {
      fetchDebates()
      fetchTeams()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session])

  const fetchDebates = async () => {
    try {
      const res = await fetch("/api/admin/debates")
      if (!res.ok) {
        const errorData = await res.json()
        throw new Error(errorData.error || "Failed to fetch debates")
      }
      const data = await res.json()
      setDebates(data)

      const initialSelected: { [key: string]: { team1: string; team2: string } } = {}
      data.forEach((debate: Debate) => {
        if (debate.teams.length === 2) {
          initialSelected[debate.id] = {
            team1: debate.teams[0].team.id,
            team2: debate.teams[1].team.id,
          }
        } else if (debate.teams.length === 1) {
          initialSelected[debate.id] = {
            team1: debate.teams[0].team.id,
            team2: "",
          }
        } else {
          initialSelected[debate.id] = { team1: "", team2: "" }
        }
      })
      setSelectedTeams(initialSelected)
    } catch (error) {
      console.error("Error fetching debates:", error)
      setMessage({ type: "error", text: "Failed to load debates" })
    } finally {
      setLoading(false)
    }
  }

  const fetchTeams = async () => {
    try {
      const res = await fetch("/api/teams")
      if (!res.ok) throw new Error("Failed to fetch teams")
      const data = await res.json()
      setTeams(data)
    } catch (error) {
      console.error("Error fetching teams:", error)
    }
  }

  const createDebateStructure = async () => {
    if (!confirm("This will create the debate structure for both rounds. Continue?")) return

    setInitializing(true)
    setMessage({ type: "", text: "" })

    try {
      for (let i = 0; i < 6; i++) {
        const debateNumber = i + 1
        const res = await fetch("/api/admin/debates", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            round: 1,
            debateNumber,
            name: `Semi-Final Debate ${debateNumber}`,
          }),
        })

        if (!res.ok) {
          const errorData = await res.json()
          if (res.status === 400 && errorData.error?.includes("already exists")) continue
          throw new Error(errorData.error || `Failed to create debate ${debateNumber}`)
        }
      }

      for (let i = 0; i < 3; i++) {
        const debateNumber = i + 1
        const res = await fetch("/api/admin/debates", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            round: 2,
            debateNumber,
            name: `Final Debate ${debateNumber}`,
          }),
        })

        if (!res.ok) {
          const errorData = await res.json()
          if (res.status === 400 && errorData.error?.includes("already exists")) continue
          throw new Error(errorData.error || `Failed to create debate ${debateNumber}`)
        }
      }

      setMessage({ type: "success", text: "Debate structure created successfully!" })
      fetchDebates()
      setTimeout(() => setMessage({ type: "", text: "" }), 3000)
    } catch (error: any) {
      console.error("Error creating debates:", error)
      setMessage({ type: "error", text: error.message || "Failed to create debate structure" })
    } finally {
      setInitializing(false)
    }
  }

  const handleTeamSelect = (
    debateId: string,
    teamPosition: "team1" | "team2",
    teamId: string
  ) => {
    setSelectedTeams((prev) => ({
      ...prev,
      [debateId]: {
        ...prev[debateId],
        [teamPosition]: teamId,
      },
    }))
  }

  const assignTeams = async (debateId: string) => {
    const selection = selectedTeams[debateId]
    if (!selection?.team1 || !selection?.team2) {
      setMessage({ type: "error", text: "Please select both teams" })
      return
    }

    if (selection.team1 === selection.team2) {
      setMessage({ type: "error", text: "Please select two different teams" })
      return
    }

    setAssigningId(debateId)
    setMessage({ type: "", text: "" })

    try {
      const res = await fetch(`/api/admin/debates`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: debateId,
          teamIds: [selection.team1, selection.team2],
        }),
      })

      if (!res.ok) {
        const errorData = await res.json()
        throw new Error(errorData.error || "Failed to assign teams")
      }

      setMessage({ type: "success", text: "Teams assigned successfully!" })
      fetchDebates()
      setTimeout(() => setMessage({ type: "", text: "" }), 3000)
    } catch (error: any) {
      console.error("Error assigning teams:", error)
      setMessage({ type: "error", text: error.message || "Failed to assign teams" })
    } finally {
      setAssigningId(null)
    }
  }

  const updateDebateStatus = async (debateId: string, status: string) => {
    try {
      const res = await fetch(`/api/admin/debates`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: debateId, status }),
      })

      if (!res.ok) {
        const errorData = await res.json()
        throw new Error(errorData.error || "Failed to update debate status")
      }

      setMessage({ type: "success", text: "Debate status updated!" })
      fetchDebates()
      setTimeout(() => setMessage({ type: "", text: "" }), 3000)
    } catch (error: any) {
      console.error("Error updating debate status:", error)
      setMessage({ type: "error", text: error.message || "Failed to update debate status" })
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
            You don't have permission to manage debates.
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

  const rounds = [
    {
      n: 1,
      label: "Semi-Finals",
      sublabel: "Round 1 · 6 debates",
      icon: "🎯",
      gradient: "from-blue-500 via-indigo-500 to-purple-500",
    },
    {
      n: 2,
      label: "Finals",
      sublabel: "Round 2 · 3 debates",
      icon: "⚡",
      gradient: "from-[#6356D7] via-[#7E5FFF] to-pink-500",
    },
  ]

  const statusStyles: Record<string, { bg: string; text: string; border: string; dot: string; label: string }> = {
    ACTIVE: {
      bg: "bg-emerald-50 dark:bg-emerald-500/10",
      text: "text-emerald-700 dark:text-emerald-300",
      border: "border-emerald-200/70 dark:border-emerald-500/20",
      dot: "bg-emerald-500",
      label: "Active",
    },
    COMPLETED: {
      bg: "bg-slate-50 dark:bg-slate-500/10",
      text: "text-slate-700 dark:text-slate-300",
      border: "border-slate-200/70 dark:border-slate-500/20",
      dot: "bg-slate-400",
      label: "Completed",
    },
    UPCOMING: {
      bg: "bg-amber-50 dark:bg-amber-500/10",
      text: "text-amber-700 dark:text-amber-300",
      border: "border-amber-200/70 dark:border-amber-500/20",
      dot: "bg-amber-500",
      label: "Upcoming",
    },
  }

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
                    <path d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                </div>
              </div>
              <div>
                <div className="flex items-center gap-2.5 flex-wrap mb-0.5">
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white tracking-tight">
                    Debate Management
                  </h2>
                  <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-violet-700 dark:text-violet-300 bg-violet-50 dark:bg-violet-500/10 px-2 py-0.5 rounded-md border border-violet-200/70 dark:border-violet-500/20 tabular-nums">
                    <span className="w-1.5 h-1.5 rounded-full bg-violet-500" />
                    {debates.length} total
                  </span>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Create debates, assign teams, and manage status
                </p>
              </div>
            </div>

            {/* Initialize button */}
            <button
              onClick={createDebateStructure}
              disabled={initializing}
              className="relative group shrink-0 overflow-hidden rounded-xl transition-transform duration-200 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:scale-100"
            >
              <div className="absolute -inset-0.5 bg-gradient-to-r from-emerald-500 via-green-500 to-emerald-500 rounded-xl blur-md opacity-60 group-hover:opacity-90 transition-all duration-300" />
              <div className="relative px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 via-green-500 to-emerald-500 bg-[length:200%_100%] group-hover:bg-[position:100%_0] text-white text-sm font-semibold shadow-md transition-[background-position] duration-700 flex items-center gap-2">
                <span className="absolute inset-x-0 top-0 h-px bg-white/40 rounded-t-xl" />
                <span className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/25 to-transparent" />
                {initializing ? (
                  <>
                    <div className="relative w-3.5 h-3.5 border-2 border-white/70 border-t-transparent rounded-full animate-spin" />
                    <span className="relative">Initializing…</span>
                  </>
                ) : (
                  <>
                    <svg className="relative w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M12 5v14M5 12h14" />
                    </svg>
                    <span className="relative">Initialize Structure</span>
                  </>
                )}
              </div>
            </button>
          </div>

          {/* Round selector */}
          <div className="mt-5 grid grid-cols-2 gap-2 p-1.5 rounded-2xl bg-white/60 dark:bg-white/[0.03] border border-white/70 dark:border-white/10 backdrop-blur-sm">
            {rounds.map((r) => {
              const active = selectedRound === r.n
              const count = debates.filter((d) => d.round === r.n).length
              return (
                <button
                  key={r.n}
                  onClick={() => setSelectedRound(r.n)}
                  className={`relative rounded-xl p-[1px] transition-all duration-300 ${
                    active ? "scale-[1.02]" : "hover:scale-[1.01]"
                  }`}
                >
                  {active && (
                    <div className={`absolute inset-0 rounded-xl bg-gradient-to-r ${r.gradient}`} />
                  )}
                  <div
                    className={`
                      relative flex items-center gap-2.5 px-3 py-2.5 rounded-xl transition-all duration-300
                      ${
                        active
                          ? `bg-gradient-to-r ${r.gradient} text-white shadow-[0_6px_20px_-6px_rgba(126,95,255,0.5)]`
                          : "bg-white/80 dark:bg-white/[0.04] text-gray-700 dark:text-gray-300"
                      }
                    `}
                  >
                    <span className="text-lg shrink-0">{r.icon}</span>
                    <div className="text-left leading-tight min-w-0 flex-1">
                      <p className="font-semibold text-sm truncate">{r.label}</p>
                      <p className={`text-[10px] truncate ${active ? "text-white/80" : "text-gray-500 dark:text-gray-400"}`}>
                        {r.sublabel}
                        {count > 0 && <span className="ml-1.5 tabular-nums">· {count} created</span>}
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

        {/* ───────── Debates grid ───────── */}
        <div className="p-5 sm:p-6">
          {roundDebates.length === 0 ? (
            <div className="text-center py-16 rounded-2xl bg-gradient-to-b from-violet-50/50 to-transparent dark:from-white/[0.02] dark:to-transparent border border-dashed border-violet-200/70 dark:border-white/10">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-100 to-indigo-100 dark:from-violet-500/15 dark:to-indigo-500/10 mb-4 border border-violet-200/70 dark:border-violet-500/20">
                <span className="text-3xl">🎤</span>
              </div>
              <h4 className="text-base font-semibold text-gray-900 dark:text-white mb-1">
                No debates in this round yet
              </h4>
              <p className="text-sm text-gray-500 dark:text-gray-400 max-w-sm mx-auto mb-5">
                Click <span className="font-medium text-violet-600 dark:text-violet-400">Initialize Structure</span> to
                generate the 6 semi-finals and 3 finals debates.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              <AnimatePresence mode="popLayout">
                {roundDebates.map((debate, index) => {
                  const status = statusStyles[debate.status] || statusStyles.UPCOMING
                  const teamsAssigned = debate.teams.length
                  const needsTeams = teamsAssigned < 2
                  const team1 = debate.teams[0]?.team
                  const team2 = debate.teams[1]?.team

                  return (
                    <motion.div
                      key={debate.id}
                      layout
                      initial={{ opacity: 0, y: 20, scale: 0.97 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -10, scale: 0.97 }}
                      transition={{
                        duration: 0.4,
                        ease: [0.22, 1, 0.36, 1],
                        delay: index * 0.04,
                      }}
                      className="relative rounded-2xl bg-white dark:bg-white/[0.02] border border-violet-100/70 dark:border-white/5 hover:border-violet-300 dark:hover:border-violet-500/30 hover:shadow-[0_20px_60px_-20px_rgba(99,86,215,0.3)] dark:hover:shadow-[0_20px_60px_-20px_rgba(0,0,0,0.8)] transition-all overflow-hidden"
                    >
                      {/* Top gradient hairline */}
                      <div className={`absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent ${
                        debate.round === 1 ? "via-blue-500/50" : "via-[#7E5FFF]/50"
                      } to-transparent`} />

                      {/* Card header */}
                      <div className="p-4 border-b border-violet-100/60 dark:border-white/5">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-center gap-2.5 min-w-0 flex-1">
                            <div className={`shrink-0 w-9 h-9 rounded-xl bg-gradient-to-br ${
                              debate.round === 1
                                ? "from-blue-500 via-indigo-500 to-purple-500"
                                : "from-[#6356D7] via-[#7E5FFF] to-pink-500"
                            } flex items-center justify-center text-white text-sm font-bold tabular-nums shadow-md`}>
                              {debate.debateNumber}
                            </div>
                            <div className="min-w-0">
                              <h4 className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                                {debate.name || `Debate ${debate.debateNumber}`}
                              </h4>
                              <div className="flex items-center gap-1.5 mt-1">
                                <span className="relative flex w-1.5 h-1.5">
                                  {debate.status === "ACTIVE" && (
                                    <span className={`absolute inline-flex h-full w-full rounded-full ${status.dot} opacity-75 animate-ping`} />
                                  )}
                                  <span className={`relative inline-flex rounded-full h-1.5 w-1.5 ${status.dot}`} />
                                </span>
                                <span className={`text-[10px] font-bold uppercase tracking-wider ${status.text}`}>
                                  {status.label}
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* Status select */}
                          <select
                            value={debate.status}
                            onChange={(e) => updateDebateStatus(debate.id, e.target.value)}
                            className={`shrink-0 text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-lg border cursor-pointer focus:outline-none focus:ring-2 focus:ring-violet-500/30 transition-all ${status.bg} ${status.text} ${status.border}`}
                          >
                            <option value="UPCOMING">Upcoming</option>
                            <option value="ACTIVE">Active</option>
                            <option value="COMPLETED">Completed</option>
                          </select>
                        </div>
                      </div>

                      {/* Teams section */}
                      <div className="p-4">
                        {teamsAssigned === 0 ? (
                          <div className="text-center py-6 rounded-xl bg-gray-50/60 dark:bg-white/[0.02] border border-dashed border-violet-200/70 dark:border-white/10">
                            <p className="text-xs text-gray-500 dark:text-gray-400 italic">
                              No teams assigned yet
                            </p>
                          </div>
                        ) : (
                          <div className="space-y-2">
                            {[team1, team2].filter(Boolean).map((team, idx) => {
                              const teamIndex = debate.teams.findIndex((dt) => dt.team.id === team!.id)
                              const teamData = debate.teams[teamIndex]
                              return (
                                <div
                                  key={team!.id}
                                  className="flex items-center justify-between gap-3 rounded-xl bg-gray-50/70 dark:bg-white/[0.02] border border-violet-100/70 dark:border-white/5 px-3 py-2.5"
                                >
                                  <div className="flex items-center gap-2 min-w-0 flex-1">
                                    <span className={`shrink-0 w-5 h-5 rounded-md flex items-center justify-center text-[10px] font-bold text-white ${
                                      idx === 0
                                        ? "bg-gradient-to-br from-blue-500 to-indigo-500"
                                        : "bg-gradient-to-br from-violet-500 to-pink-500"
                                    }`}>
                                      {teamIndex + 1}
                                    </span>
                                    <span className="text-xs font-semibold text-gray-900 dark:text-white truncate">
                                      {team!.name}
                                    </span>
                                  </div>

                                  {teamData.score !== null && (
                                    <span className="shrink-0 inline-flex items-center gap-1 text-[10px] font-bold tabular-nums px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-200/70 dark:border-emerald-500/20">
                                      <svg className="w-2.5 h-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M5 13l4 4L19 7" />
                                      </svg>
                                      {teamData.score}
                                    </span>
                                  )}
                                </div>
                              )
                            })}
                          </div>
                        )}

                        {/* Assignment form */}
                        {needsTeams && (
                          <div className="mt-3.5 pt-3.5 border-t border-violet-100/60 dark:border-white/5 space-y-3">
                            <p className="text-[10px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 flex items-center gap-1.5">
                              <span className="w-1 h-1 rounded-full bg-violet-500" />
                              Assign teams
                            </p>

                            <select
                              value={selectedTeams[debate.id]?.team1 || ""}
                              onChange={(e) => handleTeamSelect(debate.id, "team1", e.target.value)}
                              className="w-full text-xs rounded-lg px-3 py-2 bg-white dark:bg-white/[0.03] border border-violet-100 dark:border-white/10 text-gray-900 dark:text-gray-100 focus:outline-none focus:border-violet-400 dark:focus:border-violet-500/50 focus:shadow-[0_0_0_4px_rgba(139,92,246,0.12)] transition-all"
                            >
                              <option value="">Select Team 1</option>
                              {teams
                                .filter((t) => t.id !== selectedTeams[debate.id]?.team2)
                                .map((team) => (
                                  <option key={team.id} value={team.id}>
                                    {team.name}
                                  </option>
                                ))}
                            </select>

                            <select
                              value={selectedTeams[debate.id]?.team2 || ""}
                              onChange={(e) => handleTeamSelect(debate.id, "team2", e.target.value)}
                              disabled={!selectedTeams[debate.id]?.team1}
                              className="w-full text-xs rounded-lg px-3 py-2 bg-white dark:bg-white/[0.03] border border-violet-100 dark:border-white/10 text-gray-900 dark:text-gray-100 focus:outline-none focus:border-violet-400 dark:focus:border-violet-500/50 focus:shadow-[0_0_0_4px_rgba(139,92,246,0.12)] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              <option value="">Select Team 2</option>
                              {teams
                                .filter((t) => t.id !== selectedTeams[debate.id]?.team1)
                                .map((team) => (
                                  <option key={team.id} value={team.id}>
                                    {team.name}
                                  </option>
                                ))}
                            </select>

                            <button
                              onClick={() => assignTeams(debate.id)}
                              disabled={
                                !selectedTeams[debate.id]?.team1 ||
                                !selectedTeams[debate.id]?.team2 ||
                                assigningId === debate.id
                              }
                              className="group/btn relative w-full overflow-hidden rounded-lg transition-transform duration-200 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:scale-100"
                            >
                              <div className={`absolute -inset-0.5 bg-gradient-to-r ${
                                debate.round === 1
                                  ? "from-blue-500 via-indigo-500 to-purple-500"
                                  : "from-[#6356D7] via-[#7E5FFF] to-pink-500"
                              } rounded-lg blur-md opacity-60 group-hover/btn:opacity-90 transition-all duration-300`} />
                              <div className={`relative w-full py-2 rounded-lg text-white text-xs font-semibold shadow-md transition-[background-position] duration-700 bg-gradient-to-r bg-[length:200%_100%] group-hover/btn:bg-[position:100%_0] flex items-center justify-center gap-1.5 ${
                                debate.round === 1
                                  ? "from-blue-500 via-indigo-500 to-purple-500"
                                  : "from-[#6356D7] via-[#7E5FFF] to-pink-500"
                              }`}>
                                <span className="absolute inset-x-0 top-0 h-px bg-white/40 rounded-t-lg" />
                                <span className="absolute inset-0 -translate-x-full group-hover/btn:translate-x-full transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/25 to-transparent" />
                                {assigningId === debate.id ? (
                                  <>
                                    <div className="relative w-3 h-3 border-2 border-white/70 border-t-transparent rounded-full animate-spin" />
                                    <span className="relative">Assigning…</span>
                                  </>
                                ) : (
                                  <>
                                    <svg className="relative w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                      <path d="M5 13l4 4L19 7" />
                                    </svg>
                                    <span className="relative">Assign Teams</span>
                                  </>
                                )}
                              </div>
                            </button>
                          </div>
                        )}
                      </div>

                      {/* Card footer: debate ID */}
                      <div className="px-4 py-2 border-t border-violet-100/40 dark:border-white/5 bg-gray-50/40 dark:bg-white/[0.01]">
                        <p className="text-[10px] text-gray-400 dark:text-gray-500 font-mono truncate">
                          ID: {debate.id.slice(0, 12)}…
                        </p>
                      </div>
                    </motion.div>
                  )
                })}
              </AnimatePresence>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
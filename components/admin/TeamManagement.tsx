"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { motion, AnimatePresence } from "framer-motion"

interface Team {
  id: string
  name: string
  description: string | null
}

interface TeamWithStats extends Team {
  voteCount?: number
  panelistScoreCount?: number
}

export default function TeamManagement() {
  const { data: session, status } = useSession()
  const [teams, setTeams] = useState<TeamWithStats[]>([])
  const [loading, setLoading] = useState(false)
  const [editingTeam, setEditingTeam] = useState<Team | null>(null)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [searchTerm, setSearchTerm] = useState("")
  const [fetchingStats, setFetchingStats] = useState(false)

  useEffect(() => {
    if (session?.user?.role === "ADMIN") {
      fetchTeams()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session])

  const fetchTeams = async () => {
    try {
      const res = await fetch("/api/teams")
      if (!res.ok) throw new Error("Failed to fetch teams")
      const data = await res.json()
      await fetchTeamStats(data)
    } catch (error) {
      console.error("Error fetching teams:", error)
      setError("Failed to load teams")
    }
  }

  const fetchTeamStats = async (teamsData: Team[]) => {
    setFetchingStats(true)
    try {
      const voteCountMap: Record<string, number> = {}
      const scoreCountMap: Record<string, number> = {}

      try {
        const resultsRes = await fetch("/api/debate-results?round=1")
        if (resultsRes.ok) {
          const resultsData = await resultsRes.json()
          if (resultsData.debates) {
            resultsData.debates.forEach((debate: any) => {
              debate.teams.forEach((team: any) => {
                if (!voteCountMap[team.teamId]) voteCountMap[team.teamId] = 0
                voteCountMap[team.teamId] += team.audienceVotes || 0
              })
            })
          }
        }
      } catch {
        console.log("Results API not available yet")
      }

      try {
        const scoresRes = await fetch("/api/admin/panelist-scores")
        if (scoresRes.ok) {
          const scoresData = await scoresRes.json()
          scoresData.forEach((score: any) => {
            if (!scoreCountMap[score.teamId]) scoreCountMap[score.teamId] = 0
            scoreCountMap[score.teamId]++
          })
        }
      } catch {
        console.log("Panelist scores API not available yet")
      }

      const teamsWithStats = teamsData.map((team) => ({
        ...team,
        voteCount: voteCountMap[team.id] || 0,
        panelistScoreCount: scoreCountMap[team.id] || 0,
      }))

      setTeams(teamsWithStats)
    } catch (error) {
      console.error("Error fetching team stats:", error)
      setTeams(teamsData)
    } finally {
      setFetchingStats(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    setError("")
    setSuccess("")

    const formData = new FormData(e.currentTarget)
    const name = formData.get("name") as string
    const description = formData.get("description") as string

    if (name.length < 1) {
      setError("Team name must be at least 2 characters long")
      setLoading(false)
      return
    }

    if (name.length > 50) {
      setError("Team name must be less than 50 characters")
      setLoading(false)
      return
    }

    try {
      let url = "/api/teams"
      let method = "POST"

      if (editingTeam) {
        const existingTeam = teams.find(
          (t) =>
            t.name.toLowerCase() === name.toLowerCase() && t.id !== editingTeam.id
        )
        if (existingTeam) {
          setError("A team with this name already exists")
          setLoading(false)
          return
        }
        url = `/api/teams/${editingTeam.id}`
        method = "PUT"
      } else {
        const existingTeam = teams.find(
          (t) => t.name.toLowerCase() === name.toLowerCase()
        )
        if (existingTeam) {
          setError("A team with this name already exists")
          setLoading(false)
          return
        }
      }

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, description }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || `Failed to save team (Status: ${res.status})`)
      }

      e.currentTarget.reset()
      setEditingTeam(null)
      setSuccess(editingTeam ? "Team updated successfully!" : "Team created successfully!")
      fetchTeams()
      setTimeout(() => setSuccess(""), 3000)
    } catch (error: any) {
      console.error("Error saving team:", error)
      setError(error.message || "Error saving team")
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (
      !confirm(
        "Are you sure you want to delete this team? This will also delete all votes and scores associated with this team."
      )
    )
      return

    try {
      const res = await fetch(`/api/teams/${id}`, { method: "DELETE" })
      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || `Failed to delete team (Status: ${res.status})`)
      }

      setSuccess("Team deleted successfully!")
      fetchTeams()
      setTimeout(() => setSuccess(""), 3000)
    } catch (error: any) {
      console.error("Error deleting team:", error)
      setError(error.message || "Error deleting team")
    }
  }

  const filteredTeams = teams.filter(
    (team) =>
      team.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (team.description &&
        team.description.toLowerCase().includes(searchTerm.toLowerCase()))
  )

  // ───────── Loading ─────────
  if (status === "loading" || fetchingStats) {
    return (
      <div className="relative rounded-2xl p-8 bg-gradient-to-br from-white via-violet-50/30 to-indigo-50/40 dark:from-[#0f0d1a] dark:via-[#100c20] dark:to-[#130f26] border border-violet-100/60 dark:border-white/5 shadow-[0_8px_40px_-12px_rgba(99,86,215,0.15)]">
        <div className="flex flex-col items-center justify-center py-16">
          <div className="relative w-12 h-12">
            <div className="absolute inset-0 rounded-full border-[3px] border-violet-100 dark:border-white/10" />
            <div className="absolute inset-0 rounded-full border-[3px] border-transparent border-t-violet-600 dark:border-t-violet-400 animate-spin" />
            <div className="absolute -inset-2 rounded-full bg-violet-500/10 blur-xl animate-pulse" />
          </div>
          <p className="mt-5 text-sm font-medium text-gray-600 dark:text-gray-400">
            Loading teams…
          </p>
        </div>
      </div>
    )
  }

  // ───────── Access denied ─────────
  if (session?.user?.role !== "ADMIN") {
    return (
      <div className="relative rounded-2xl p-8 bg-gradient-to-br from-white via-violet-50/30 to-indigo-50/40 dark:from-[#0f0d1a] dark:via-[#100c20] dark:to-[#130f26] border border-violet-100/60 dark:border-white/5 shadow-[0_8px_40px_-12px_rgba(99,86,215,0.15)]">
        <div className="text-center py-16 px-6">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-violet-100 to-indigo-100 dark:from-violet-500/15 dark:to-indigo-500/10 mb-5 border border-violet-200/70 dark:border-violet-500/20">
            <svg className="w-6 h-6 text-violet-600 dark:text-violet-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="11" width="18" height="11" rx="2" />
              <path d="M7 11V7a5 5 0 0110 0v4" />
            </svg>
          </div>
          <span className="block text-[10px] font-bold uppercase tracking-[0.18em] text-violet-600 dark:text-violet-400 mb-1.5">
            Restricted
          </span>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1.5">
            Access denied
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 max-w-xs mx-auto">
            You need admin privileges to manage teams.
          </p>
        </div>
      </div>
    )
  }

  const slotsLeft = Math.max(0, 12 - teams.length)
  const fillPct = Math.min(100, (teams.length / 12) * 100)

  // Rank styles for top 3
  const rankStyles = [
    {
      bg: "bg-gradient-to-br from-amber-50 to-yellow-100/60 dark:from-amber-500/15 dark:to-yellow-500/10",
      border: "border-amber-200 dark:border-amber-500/30",
      text: "text-amber-700 dark:text-amber-400",
      dot: "bg-amber-500",
      emoji: "🥇",
    },
    {
      bg: "bg-gradient-to-br from-slate-50 to-slate-100/60 dark:from-slate-500/15 dark:to-slate-400/10",
      border: "border-slate-200 dark:border-slate-500/30",
      text: "text-slate-600 dark:text-slate-300",
      dot: "bg-slate-400",
      emoji: "🥈",
    },
    {
      bg: "bg-gradient-to-br from-orange-50 to-amber-50/60 dark:from-orange-500/15 dark:to-amber-500/10",
      border: "border-orange-200 dark:border-orange-500/30",
      text: "text-orange-700 dark:text-orange-400",
      dot: "bg-orange-500",
      emoji: "🥉",
    },
  ]

  return (
    <div className="relative">
      {/* Ambient decoration */}
      <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden rounded-3xl">
        <div className="absolute -top-40 -right-40 w-96 h-96 rounded-full bg-violet-300/20 dark:bg-violet-500/10 blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 rounded-full bg-indigo-300/20 dark:bg-indigo-500/10 blur-3xl" />
      </div>

      {/* ───────── Main container ───────── */}
      <div className="relative rounded-2xl bg-gradient-to-br from-white via-violet-50/20 to-indigo-50/30 dark:from-[#0f0d1a] dark:via-[#100c20] dark:to-[#130f26] border border-violet-100/60 dark:border-white/5 shadow-[0_8px_40px_-12px_rgba(99,86,215,0.15)] dark:shadow-[0_8px_40px_-12px_rgba(0,0,0,0.7)] overflow-hidden">
        {/* ───────── Header ───────── */}
        <div className="relative p-5 sm:p-6 border-b border-violet-100/60 dark:border-white/5">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="relative shrink-0">
                <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-violet-500 to-indigo-600 blur-md opacity-40" />
                <div className="relative w-12 h-12 rounded-2xl bg-gradient-to-br from-violet-500 via-violet-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-violet-500/25">
                  <svg className="w-5.5 h-5.5 text-white" width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
              </div>
              <div>
                <div className="flex items-center gap-2.5 flex-wrap mb-0.5">
                  <h1 className="text-xl font-semibold text-gray-900 dark:text-white tracking-tight">
                    Team Management
                  </h1>
                  <div className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-violet-700 dark:text-violet-300 bg-violet-50 dark:bg-violet-500/10 px-2 py-0.5 rounded-md border border-violet-200/70 dark:border-violet-500/20">
                    <span className="w-1.5 h-1.5 rounded-full bg-violet-500" />
                    <span className="tabular-nums">{teams.length}</span>
                    <span className="text-violet-400 dark:text-violet-500/60">/</span>
                    <span className="tabular-nums">12</span>
                  </div>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Create, edit, and organize teams
                </p>
              </div>
            </div>

            {/* Search */}
            <div className="relative w-full sm:w-72">
              <input
                type="text"
                placeholder="Search teams…"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="peer w-full pl-10 pr-9 py-2.5 text-sm rounded-xl bg-white dark:bg-white/[0.03] border border-violet-100 dark:border-white/10 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:border-violet-400 dark:focus:border-violet-500/50 focus:shadow-[0_0_0_4px_rgba(139,92,246,0.12)] transition-all"
              />
              <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-gray-500 peer-focus:text-violet-500 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="7" />
                <path d="M21 21l-4.3-4.3" />
              </svg>
              <AnimatePresence>
                {searchTerm && (
                  <motion.button
                    initial={{ opacity: 0, scale: 0.7 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.7 }}
                    onClick={() => setSearchTerm("")}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 w-6 h-6 rounded-md flex items-center justify-center text-gray-400 hover:text-violet-600 hover:bg-violet-50 dark:hover:bg-violet-500/10 dark:hover:text-violet-400 transition-all"
                    aria-label="Clear search"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </motion.button>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Fill progress bar */}
          <div className="mt-4 flex items-center gap-3">
            <div className="flex-1 h-1.5 rounded-full bg-violet-100/70 dark:bg-white/5 overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${fillPct}%` }}
                transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                className="h-full rounded-full bg-gradient-to-r from-violet-500 via-violet-600 to-indigo-600"
              />
            </div>
            <span className="text-[11px] font-medium text-gray-500 dark:text-gray-400 tabular-nums whitespace-nowrap">
              {teams.length} of 12 filled
            </span>
          </div>
        </div>

        {/* ───────── Alerts ───────── */}
        <div className="px-5 sm:px-6 pt-4">
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -6, height: 0 }}
                animate={{ opacity: 1, y: 0, height: "auto" }}
                exit={{ opacity: 0, y: -6, height: 0 }}
                className="overflow-hidden mb-3"
              >
                <div className="p-3 rounded-xl flex items-center gap-2.5 text-sm bg-red-50 dark:bg-red-500/10 border border-red-200/70 dark:border-red-500/20 text-red-700 dark:text-red-300">
                  <span className="text-base">❌</span>
                  <span className="flex-1 font-medium">{error}</span>
                  <button onClick={() => setError("")} className="opacity-60 hover:opacity-100 transition-opacity" aria-label="Dismiss">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 18L18 6M6 6l12 12" /></svg>
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <AnimatePresence>
            {success && (
              <motion.div
                initial={{ opacity: 0, y: -6, height: 0 }}
                animate={{ opacity: 1, y: 0, height: "auto" }}
                exit={{ opacity: 0, y: -6, height: 0 }}
                className="overflow-hidden mb-3"
              >
                <div className="p-3 rounded-xl flex items-center gap-2.5 text-sm bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200/70 dark:border-emerald-500/20 text-emerald-700 dark:text-emerald-300">
                  <span className="text-base">✅</span>
                  <span className="flex-1 font-medium">{success}</span>
                  <button onClick={() => setSuccess("")} className="opacity-60 hover:opacity-100 transition-opacity" aria-label="Dismiss">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 18L18 6M6 6l12 12" /></svg>
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* ───────── Main grid ───────── */}
        <div className="p-5 sm:p-6 grid grid-cols-1 lg:grid-cols-5 gap-5">
          {/* Form column (2/5) */}
          <div className="lg:col-span-2">
            <div className="rounded-2xl bg-white dark:bg-white/[0.02] border border-violet-100/70 dark:border-white/5 shadow-sm overflow-hidden lg:sticky lg:top-6">
              {/* Form header */}
              <div className="relative px-5 py-3.5 border-b border-violet-100/60 dark:border-white/5">
                <div className="flex items-center gap-2.5">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                    editingTeam
                      ? "bg-gradient-to-br from-amber-100 to-orange-100 dark:from-amber-500/20 dark:to-orange-500/15 text-amber-700 dark:text-amber-400 border border-amber-200/70 dark:border-amber-500/20"
                      : "bg-gradient-to-br from-violet-100 to-indigo-100 dark:from-violet-500/20 dark:to-indigo-500/15 text-violet-700 dark:text-violet-400 border border-violet-200/70 dark:border-violet-500/20"
                  }`}>
                    {editingTeam ? (
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    ) : (
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M12 5v14M5 12h14" />
                      </svg>
                    )}
                  </div>
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
                    {editingTeam ? "Edit team" : "Add new team"}
                  </h3>
                  {editingTeam && (
                    <span className="ml-auto text-[10px] font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-500/10 px-2 py-0.5 rounded-md border border-amber-200/70 dark:border-amber-500/20">
                      Editing
                    </span>
                  )}
                </div>
              </div>

              {/* Form body */}
              <form onSubmit={handleSubmit} className="p-5 space-y-4">
                <div>
                  <label className="flex items-center justify-between text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                    <span>Team name <span className="text-red-500">*</span></span>
                    <span className="text-[10px] font-normal text-gray-400 dark:text-gray-500">max 50</span>
                  </label>
                  <input
                    type="text"
                    name="name"
                    defaultValue={editingTeam?.name}
                    required
                    maxLength={50}
                    placeholder="e.g., Marketing Mavericks"
                    className="w-full px-3.5 py-2.5 rounded-xl text-sm bg-gray-50/70 dark:bg-white/[0.03] border border-violet-100 dark:border-white/10 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:bg-white dark:focus:bg-white/[0.05] focus:border-violet-400 dark:focus:border-violet-500/50 focus:shadow-[0_0_0_4px_rgba(139,92,246,0.1)] transition-all"
                  />
                </div>

                <div>
                  <label className="flex items-center justify-between text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                    <span>Description <span className="font-normal text-gray-400 dark:text-gray-500">(optional)</span></span>
                    <span className="text-[10px] font-normal text-gray-400 dark:text-gray-500">max 200</span>
                  </label>
                  <textarea
                    name="description"
                    defaultValue={editingTeam?.description || ""}
                    rows={4}
                    maxLength={200}
                    placeholder="What makes this team stand out?"
                    className="w-full px-3.5 py-2.5 rounded-xl text-sm bg-gray-50/70 dark:bg-white/[0.03] border border-violet-100 dark:border-white/10 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:bg-white dark:focus:bg-white/[0.05] focus:border-violet-400 dark:focus:border-violet-500/50 focus:shadow-[0_0_0_4px_rgba(139,92,246,0.1)] transition-all resize-none"
                  />
                </div>

                <div className="flex gap-2 pt-1">
                  <button
                    type="submit"
                    disabled={loading}
                    className="group relative flex-1 py-2.5 rounded-xl text-white text-sm font-semibold shadow-md shadow-violet-500/20 transition-all active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed disabled:active:scale-100 overflow-hidden"
                  >
                    <span className="absolute inset-0 bg-gradient-to-r from-violet-500 via-violet-600 to-indigo-600" />
                    <span className="absolute inset-0 bg-gradient-to-r from-violet-600 via-indigo-600 to-violet-600 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                    <span className="absolute inset-x-0 top-0 h-px bg-white/40" />
                    <span className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/25 to-transparent" />
                    <span className="relative flex items-center justify-center gap-2">
                      {loading ? (
                        <>
                          <div className="w-3.5 h-3.5 border-2 border-white/70 border-t-transparent rounded-full animate-spin" />
                          Saving…
                        </>
                      ) : editingTeam ? (
                        "Save changes"
                      ) : (
                        "Add team"
                      )}
                    </span>
                  </button>

                  {editingTeam && (
                    <button
                      type="button"
                      onClick={() => {
                        setEditingTeam(null)
                        setError("")
                      }}
                      className="px-4 py-2.5 rounded-xl text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-white/[0.03] border border-violet-100 dark:border-white/10 hover:bg-gray-50 dark:hover:bg-white/[0.06] transition-all active:scale-[0.98]"
                    >
                      Cancel
                    </button>
                  )}
                </div>
              </form>

              {/* Stats footer */}
              <div className="px-5 py-4 border-t border-violet-100/60 dark:border-white/5 bg-gradient-to-b from-transparent to-violet-50/40 dark:to-white/[0.01]">
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-xl bg-white dark:bg-white/[0.03] border border-violet-100/70 dark:border-white/5 p-3">
                    <div className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1">
                      <span className="w-1 h-1 rounded-full bg-violet-500" />
                      Total
                    </div>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white tabular-nums leading-none">
                      {teams.length}
                    </p>
                    <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-1">active teams</p>
                  </div>
                  <div className="rounded-xl bg-white dark:bg-white/[0.03] border border-violet-100/70 dark:border-white/5 p-3">
                    <div className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1">
                      <span className="w-1 h-1 rounded-full bg-emerald-500" />
                      Slots left
                    </div>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white tabular-nums leading-none">
                      {slotsLeft}
                    </p>
                    <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-1">of 12 max</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Teams list (3/5) */}
          <div className="lg:col-span-3">
            <div className="rounded-2xl bg-white dark:bg-white/[0.02] border border-violet-100/70 dark:border-white/5 shadow-sm overflow-hidden">
              {/* List header */}
              <div className="relative px-5 py-3.5 border-b border-violet-100/60 dark:border-white/5 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-100 to-indigo-100 dark:from-violet-500/20 dark:to-indigo-500/15 text-violet-700 dark:text-violet-400 flex items-center justify-center border border-violet-200/70 dark:border-violet-500/20">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M4 6h16M4 12h16M4 18h16" />
                    </svg>
                  </div>
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
                    Teams
                  </h3>
                </div>
                <span className="text-[11px] font-medium text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-white/5 px-2.5 py-1 rounded-md tabular-nums">
                  {filteredTeams.length} {filteredTeams.length === 1 ? "result" : "results"}
                </span>
              </div>

              {/* List body */}
              <div className="p-3 sm:p-4">
                {filteredTeams.length === 0 ? (
                  <div className="text-center py-16 rounded-xl bg-gradient-to-b from-violet-50/50 to-transparent dark:from-white/[0.02] dark:to-transparent border border-dashed border-violet-200/70 dark:border-white/10">
                    <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-violet-100 to-indigo-100 dark:from-violet-500/15 dark:to-indigo-500/10 mb-4 border border-violet-200/70 dark:border-violet-500/20">
                      <span className="text-2xl">{searchTerm ? "🔍" : "👥"}</span>
                    </div>
                    <p className="text-sm font-semibold text-gray-800 dark:text-gray-200 mb-1">
                      {searchTerm ? "No matches found" : "No teams yet"}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-4 max-w-xs mx-auto">
                      {searchTerm
                        ? "Try a different search term"
                        : "Add your first team using the form on the left"}
                    </p>
                    {searchTerm && (
                      <button
                        onClick={() => setSearchTerm("")}
                        className="px-3.5 py-1.5 rounded-lg text-xs font-semibold text-violet-700 dark:text-violet-300 bg-violet-50 dark:bg-violet-500/10 hover:bg-violet-100 dark:hover:bg-violet-500/20 border border-violet-200/70 dark:border-violet-500/20 transition-all"
                      >
                        Clear search
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="space-y-2 max-h-[560px] overflow-y-auto pr-1 custom-scrollbar">
                    <AnimatePresence mode="popLayout">
                      {filteredTeams.map((team, index) => {
                        const isTop3 = index < 3
                        const rank = isTop3 ? rankStyles[index] : null

                        return (
                          <motion.div
                            key={team.id}
                            layout
                            initial={{ opacity: 0, y: 12 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -6 }}
                            transition={{
                              duration: 0.35,
                              ease: [0.22, 1, 0.36, 1],
                              delay: index * 0.025,
                            }}
                            whileHover={{ y: -2 }}
                            className="group relative rounded-xl bg-white dark:bg-white/[0.02] border border-violet-100/70 dark:border-white/5 hover:border-violet-300 dark:hover:border-violet-500/30 hover:shadow-[0_8px_24px_-8px_rgba(139,92,246,0.25)] dark:hover:shadow-[0_8px_24px_-8px_rgba(139,92,246,0.15)] transition-all"
                          >
                            <div className="flex items-start gap-3.5 p-3.5">
                              {/* Rank badge */}
                              <div className="relative shrink-0">
                                <div
                                  className={`w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold tabular-nums border ${
                                    rank
                                      ? `${rank.bg} ${rank.text} ${rank.border}`
                                      : "bg-gray-50 dark:bg-white/5 text-gray-500 dark:text-gray-400 border-violet-100 dark:border-white/5"
                                  }`}
                                >
                                  {isTop3 ? (
                                    <span className="text-base">{rank!.emoji}</span>
                                  ) : (
                                    index + 1
                                  )}
                                </div>
                              </div>

                              {/* Content */}
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                                  <h4 className="text-[13.5px] font-semibold text-gray-900 dark:text-white truncate">
                                    {team.name}
                                  </h4>
                                  {isTop3 && (
                                    <span className={`shrink-0 inline-flex items-center gap-1 text-[9.5px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-md ${rank!.bg} ${rank!.text} border ${rank!.border}`}>
                                      <span className={`w-1 h-1 rounded-full ${rank!.dot}`} />
                                      Top {index + 1}
                                    </span>
                                  )}
                                </div>

                                {team.description ? (
                                  <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2 leading-relaxed">
                                    {team.description}
                                  </p>
                                ) : (
                                  <p className="text-xs text-gray-400 dark:text-gray-500 italic">
                                    No description provided
                                  </p>
                                )}

                                {/* Stats row */}
                                <div className="flex items-center gap-3.5 mt-2 text-[11px] text-gray-500 dark:text-gray-400">
                                  {team.voteCount !== undefined && (
                                    <span className="inline-flex items-center gap-1.5">
                                      <svg className="w-3.5 h-3.5 text-violet-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M9 12l2 2 4-4" />
                                        <circle cx="12" cy="12" r="10" />
                                      </svg>
                                      <span className="tabular-nums font-semibold text-gray-700 dark:text-gray-300">{team.voteCount}</span>
                                      <span>{team.voteCount === 1 ? "vote" : "votes"}</span>
                                    </span>
                                  )}
                                  {team.panelistScoreCount !== undefined && (
                                    <span className="inline-flex items-center gap-1.5">
                                      <svg className="w-3.5 h-3.5 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                                      </svg>
                                      <span className="tabular-nums font-semibold text-gray-700 dark:text-gray-300">{team.panelistScoreCount}</span>
                                      <span>{team.panelistScoreCount === 1 ? "score" : "scores"}</span>
                                    </span>
                                  )}
                                </div>
                              </div>

                              {/* Actions */}
                              <div
                                className="flex items-center gap-0.5 shrink-0 opacity-60 group-hover:opacity-100 transition-opacity"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    e.preventDefault()
                                    setEditingTeam(team)
                                    setError("")
                                    window.scrollTo({ top: 0, behavior: "smooth" })
                                  }}
                                  className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-violet-600 dark:hover:text-violet-400 hover:bg-violet-50 dark:hover:bg-violet-500/10 transition-all active:scale-95"
                                  title="Edit team"
                                  type="button"
                                >
                                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                  </svg>
                                </button>

                                <button
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    e.preventDefault()
                                    handleDelete(team.id)
                                  }}
                                  className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 transition-all active:scale-95"
                                  title="Delete team"
                                  type="button"
                                >
                                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                  </svg>
                                </button>
                              </div>
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
        .line-clamp-2 {
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
      `}</style>
    </div>
  )
}
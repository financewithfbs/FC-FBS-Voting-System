"use client"

import { useState } from "react"
import { useSession } from "next-auth/react"
import { motion, AnimatePresence } from "framer-motion"

interface VoteRecord {
  id: string
  round: number
  votedAt: string
  voter: {
    id: string
    name: string
    email: string
    pgp: string | null
    section: string | null
    role: string
    registeredAt: string
  }
  team: {
    id: string
    name: string
  }
  votingSession: {
    startTime: string | null
    endTime: string | null
    wasActive: boolean
  } | null
}

interface Summary {
  totalVotes: number
  uniqueVoters: number
  votesPerRound: Record<number, number>
  votersPerRound: Record<number, number>
}

export default function AudienceVotesExport() {
  const { data: session } = useSession()
  const [loading, setLoading] = useState(false)
  const [exportLoading, setExportLoading] = useState<"csv" | "json" | null>(null)
  const [selectedRound, setSelectedRound] = useState<string>("all")
  const [voteData, setVoteData] = useState<{
    votes: VoteRecord[]
    summary: Summary
  } | null>(null)
  const [message, setMessage] = useState({ type: "", text: "" })
  const [showAll, setShowAll] = useState(false)

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
            You don't have permission to export audience votes.
          </p>
        </div>
      </div>
    )
  }

  const fetchVoteData = async () => {
    setLoading(true)
    setMessage({ type: "", text: "" })

    try {
      const res = await fetch(`/api/admin/audience-votes?round=${selectedRound}`)
      if (!res.ok) throw new Error("Failed to fetch vote data")

      const data = await res.json()
      setVoteData(data)
      setShowAll(false)
    } catch (error: any) {
      console.error("Error fetching vote data:", error)
      setMessage({ type: "error", text: error.message || "Failed to load vote data" })
    } finally {
      setLoading(false)
    }
  }

  const exportToCSV = () => {
    if (!voteData) return

    setExportLoading("csv")
    try {
      const headers = [
        "Round",
        "Voter Name",
        "Voter Email",
        "PGP",
        "Section",
        "Voter Role",
        "Team Voted For",
        "Vote Time",
        "Registration Date",
        "Voting Session Start",
        "Voting Session End",
        "Was Voting Active",
      ]

      const rows = voteData.votes.map((vote) => [
        vote.round,
        vote.voter.name,
        vote.voter.email,
        vote.voter.pgp || "N/A",
        vote.voter.section || "N/A",
        vote.voter.role,
        vote.team.name,
        new Date(vote.votedAt).toLocaleString(),
        new Date(vote.voter.registeredAt).toLocaleDateString(),
        vote.votingSession?.startTime
          ? new Date(vote.votingSession.startTime).toLocaleString()
          : "N/A",
        vote.votingSession?.endTime
          ? new Date(vote.votingSession.endTime).toLocaleString()
          : "N/A",
        vote.votingSession?.wasActive ? "Yes" : "No",
      ])

      const csvContent = [
        headers.join(","),
        ...rows.map((row) => row.map((cell) => `"${cell}"`).join(",")),
      ].join("\n")

      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
      const link = document.createElement("a")
      const url = URL.createObjectURL(blob)
      const date = new Date().toISOString().split("T")[0]
      const roundText = selectedRound === "all" ? "all_rounds" : `round_${selectedRound}`
      link.setAttribute("href", url)
      link.setAttribute("download", `audience_votes_${roundText}_${date}.csv`)
      link.style.visibility = "hidden"
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)

      setMessage({ type: "success", text: "CSV exported successfully!" })
      setTimeout(() => setMessage({ type: "", text: "" }), 3000)
    } catch (error) {
      console.error("Error exporting CSV:", error)
      setMessage({ type: "error", text: "Failed to export CSV" })
    } finally {
      setExportLoading(null)
    }
  }

  const exportToJSON = () => {
    if (!voteData) return

    setExportLoading("json")
    try {
      const exportData = {
        exportedAt: new Date().toISOString(),
        filters: { round: selectedRound },
        summary: voteData.summary,
        votes: voteData.votes,
      }

      const blob = new Blob([JSON.stringify(exportData, null, 2)], {
        type: "application/json",
      })
      const link = document.createElement("a")
      const url = URL.createObjectURL(blob)
      const date = new Date().toISOString().split("T")[0]
      const roundText = selectedRound === "all" ? "all_rounds" : `round_${selectedRound}`
      link.setAttribute("href", url)
      link.setAttribute("download", `audience_votes_${roundText}_${date}.json`)
      link.style.visibility = "hidden"
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)

      setMessage({ type: "success", text: "JSON exported successfully!" })
      setTimeout(() => setMessage({ type: "", text: "" }), 3000)
    } catch (error) {
      console.error("Error exporting JSON:", error)
      setMessage({ type: "error", text: "Failed to export JSON" })
    } finally {
      setExportLoading(null)
    }
  }

  const displayedVotes = voteData
    ? showAll
      ? voteData.votes
      : voteData.votes.slice(0, 5)
    : []

  const statCards = voteData
    ? [
        {
          label: "Total Votes",
          value: voteData.summary.totalVotes,
          icon: "🗳️",
          gradient: "from-violet-500 to-indigo-600",
          text: "text-violet-700 dark:text-violet-300",
        },
        {
          label: "Unique Voters",
          value: voteData.summary.uniqueVoters,
          icon: "👤",
          gradient: "from-blue-500 to-cyan-500",
          text: "text-blue-700 dark:text-blue-300",
        },
        {
          label: "Rounds with Votes",
          value: Object.keys(voteData.summary.votesPerRound).length,
          icon: "📅",
          gradient: "from-emerald-500 to-green-500",
          text: "text-emerald-700 dark:text-emerald-300",
        },
        {
          label: "Records Loaded",
          value: voteData.votes.length,
          icon: "📊",
          gradient: "from-amber-500 to-orange-500",
          text: "text-amber-700 dark:text-amber-300",
        },
      ]
    : []

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
                    <path d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                </div>
              </div>
              <div>
                <div className="flex items-center gap-2.5 flex-wrap mb-0.5">
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white tracking-tight">
                    Audience Voting Details
                  </h2>
                  {voteData && (
                    <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-violet-700 dark:text-violet-300 bg-violet-50 dark:bg-violet-500/10 px-2 py-0.5 rounded-md border border-violet-200/70 dark:border-violet-500/20 tabular-nums">
                      <span className="w-1.5 h-1.5 rounded-full bg-violet-500" />
                      {voteData.votes.length} records
                    </span>
                  )}
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Explore, filter, and export individual vote records
                </p>
              </div>
            </div>
          </div>

          {/* Filter row */}
          <div className="mt-5 flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1.5">
                Filter by round
              </label>
              <div className="relative">
                <select
                  value={selectedRound}
                  onChange={(e) => setSelectedRound(e.target.value)}
                  className="peer w-full appearance-none pl-10 pr-10 py-2.5 text-sm rounded-xl bg-white dark:bg-white/[0.03] border border-violet-100 dark:border-white/10 text-gray-900 dark:text-gray-100 focus:outline-none focus:border-violet-400 dark:focus:border-violet-500/50 focus:shadow-[0_0_0_4px_rgba(139,92,246,0.12)] transition-all cursor-pointer"
                >
                  <option value="all">All Rounds</option>
                  <option value="1">Round 1 · Semi-Finals</option>
                  <option value="2">Round 2 · Finals</option>
                  <option value="3">Round 3</option>
                </select>
                <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-gray-500 peer-focus:text-violet-500 transition-colors pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M3 6h18M6 12h12M9 18h6" />
                </svg>
                <svg className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-gray-500 peer-focus:text-violet-500 transition-colors pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M6 9l6 6 6-6" />
                </svg>
              </div>
            </div>

            <div className="flex items-end">
              <button
                onClick={fetchVoteData}
                disabled={loading}
                className="relative group w-full sm:w-auto overflow-hidden rounded-xl transition-transform duration-200 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:scale-100"
              >
                <div className="absolute -inset-0.5 bg-gradient-to-r from-violet-500 via-violet-600 to-indigo-600 rounded-xl blur-md opacity-60 group-hover:opacity-90 transition-all duration-300" />
                <div className="relative px-5 py-2.5 rounded-xl bg-gradient-to-r from-violet-500 via-violet-600 to-indigo-600 bg-[length:200%_100%] group-hover:bg-[position:100%_0] text-white text-sm font-semibold shadow-md transition-[background-position] duration-700 flex items-center gap-2">
                  <span className="absolute inset-x-0 top-0 h-px bg-white/40 rounded-t-xl" />
                  <span className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/25 to-transparent" />
                  {loading ? (
                    <>
                      <div className="relative w-4 h-4 border-2 border-white/70 border-t-transparent rounded-full animate-spin" />
                      <span className="relative">Loading…</span>
                    </>
                  ) : (
                    <>
                      <svg className="relative w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="11" cy="11" r="7" />
                        <path d="M21 21l-4.3-4.3" />
                      </svg>
                      <span className="relative">Load Data</span>
                    </>
                  )}
                </div>
              </button>
            </div>
          </div>
        </div>

        {/* ───────── Message ───────── */}
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

        {/* ───────── Content ───────── */}
        <div className="p-5 sm:p-6">
          <AnimatePresence mode="wait">
            {voteData ? (
              <motion.div
                key="loaded"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                className="space-y-5"
              >
                {/* Stats */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                  {statCards.map((stat, i) => (
                    <motion.div
                      key={stat.label}
                      initial={{ opacity: 0, y: 15 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.06, duration: 0.4 }}
                      whileHover={{ y: -3 }}
                      className="relative rounded-2xl p-[1px] overflow-hidden"
                    >
                      <div className={`absolute inset-0 bg-gradient-to-br ${stat.gradient} opacity-50`} />
                      <div className="relative rounded-2xl bg-white/85 dark:bg-[#0f0d1a]/85 backdrop-blur-xl p-3.5 border border-white/70 dark:border-white/10">
                        <div className="flex items-center justify-between mb-2">
                          <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500 dark:text-gray-400">
                            {stat.label}
                          </p>
                          <div className={`w-7 h-7 rounded-lg bg-gradient-to-br ${stat.gradient} flex items-center justify-center text-white text-xs shadow-md`}>
                            {stat.icon}
                          </div>
                        </div>
                        <p className={`text-2xl font-bold ${stat.text} tabular-nums leading-none`}>
                          {stat.value}
                        </p>
                      </div>
                    </motion.div>
                  ))}
                </div>

                {/* Votes per Round breakdown */}
                <div className="rounded-2xl bg-white dark:bg-white/[0.02] border border-violet-100/70 dark:border-white/5 shadow-sm overflow-hidden">
                  <div className="px-5 py-3.5 border-b border-violet-100/60 dark:border-white/5 flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-violet-100 to-indigo-100 dark:from-violet-500/20 dark:to-indigo-500/15 text-violet-700 dark:text-violet-400 flex items-center justify-center border border-violet-200/70 dark:border-violet-500/20">
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                      </svg>
                    </div>
                    <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
                      Votes per round
                    </h3>
                  </div>
                  <div className="p-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {[1, 2, 3].map((round) => {
                      const votes = voteData.summary.votesPerRound[round] || 0
                      const voters = voteData.summary.votersPerRound[round] || 0
                      const totalVotes = voteData.summary.totalVotes || 1
                      const pct = (votes / totalVotes) * 100
                      return (
                        <motion.div
                          key={round}
                          initial={{ opacity: 0, y: 12 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: round * 0.06, duration: 0.4 }}
                          className="relative rounded-xl bg-gray-50/70 dark:bg-white/[0.02] border border-violet-100/70 dark:border-white/5 p-3.5 overflow-hidden"
                        >
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-1.5">
                              <span className="text-base">{round === 1 ? "🎯" : round === 2 ? "⚡" : "📊"}</span>
                              <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                                Round {round}
                              </span>
                            </div>
                            <span className="text-lg font-bold text-violet-600 dark:text-violet-400 tabular-nums">
                              {votes}
                            </span>
                          </div>
                          {/* Progress bar */}
                          <div className="h-1 rounded-full bg-violet-100/70 dark:bg-white/5 overflow-hidden mb-2">
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${pct}%` }}
                              transition={{ duration: 0.6, delay: round * 0.1, ease: [0.22, 1, 0.36, 1] }}
                              className="h-full rounded-full bg-gradient-to-r from-violet-500 to-indigo-600"
                            />
                          </div>
                          <p className="text-[10px] text-gray-500 dark:text-gray-400 tabular-nums">
                            {voters} unique voter{voters !== 1 ? "s" : ""}
                          </p>
                        </motion.div>
                      )
                    })}
                  </div>
                </div>

                {/* Preview table */}
                <div className="rounded-2xl bg-white dark:bg-white/[0.02] border border-violet-100/70 dark:border-white/5 shadow-sm overflow-hidden">
                  <div className="px-5 py-3.5 border-b border-violet-100/60 dark:border-white/5 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-violet-100 to-indigo-100 dark:from-violet-500/20 dark:to-indigo-500/15 text-violet-700 dark:text-violet-400 flex items-center justify-center border border-violet-200/70 dark:border-violet-500/20">
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M4 6h16M4 12h16M4 18h16" />
                        </svg>
                      </div>
                      <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
                        Preview
                      </h3>
                    </div>
                    <span className="text-[11px] font-medium text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-white/5 px-2 py-1 rounded-md tabular-nums">
                      {displayedVotes.length} of {voteData.votes.length}
                    </span>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="min-w-full">
                      <thead>
                        <tr className="border-b border-violet-100/60 dark:border-white/5 bg-gray-50/60 dark:bg-white/[0.02]">
                          <th className="px-4 py-2.5 text-left text-[10px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">Round</th>
                          <th className="px-4 py-2.5 text-left text-[10px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">Voter</th>
                          <th className="px-4 py-2.5 text-left text-[10px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">Team</th>
                          <th className="px-4 py-2.5 text-left text-[10px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 hidden md:table-cell">Email</th>
                          <th className="px-4 py-2.5 text-left text-[10px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 hidden lg:table-cell">Time</th>
                        </tr>
                      </thead>
                      <tbody>
                        {displayedVotes.map((vote, idx) => (
                          <motion.tr
                            key={vote.id}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: idx * 0.03 }}
                            className="border-b border-violet-100/40 dark:border-white/5 hover:bg-violet-50/40 dark:hover:bg-white/[0.02] transition-colors"
                          >
                            <td className="px-4 py-2.5">
                              <span className={`inline-flex items-center gap-1 text-[10px] font-bold tabular-nums px-2 py-0.5 rounded-md border ${
                                vote.round === 1
                                  ? "bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-300 border-blue-200/70 dark:border-blue-500/20"
                                  : vote.round === 2
                                  ? "bg-violet-50 dark:bg-violet-500/10 text-violet-700 dark:text-violet-300 border-violet-200/70 dark:border-violet-500/20"
                                  : "bg-gray-50 dark:bg-white/5 text-gray-700 dark:text-gray-300 border-gray-200/70 dark:border-white/10"
                              }`}>
                                R{vote.round}
                              </span>
                            </td>
                            <td className="px-4 py-2.5">
                              <div className="flex items-center gap-2">
                                <span className="shrink-0 w-6 h-6 rounded-full bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center text-[9px] font-bold text-white">
                                  {vote.voter.name.charAt(0).toUpperCase()}
                                </span>
                                <span className="text-xs font-semibold text-gray-900 dark:text-white truncate max-w-[140px]">
                                  {vote.voter.name}
                                </span>
                              </div>
                            </td>
                            <td className="px-4 py-2.5">
                              <span className="inline-flex items-center gap-1 text-xs text-violet-700 dark:text-violet-300">
                                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                  <path d="M9 12l2 2 4-4" />
                                  <circle cx="12" cy="12" r="10" />
                                </svg>
                                {vote.team.name}
                              </span>
                            </td>
                            <td className="px-4 py-2.5 text-xs text-gray-500 dark:text-gray-400 hidden md:table-cell">
                              {vote.voter.email}
                            </td>
                            <td className="px-4 py-2.5 text-xs text-gray-500 dark:text-gray-400 tabular-nums hidden lg:table-cell">
                              {new Date(vote.votedAt).toLocaleString()}
                            </td>
                          </motion.tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Show more / less */}
                  {voteData.votes.length > 5 && (
                    <div className="px-5 py-3 border-t border-violet-100/60 dark:border-white/5 text-center">
                      <button
                        onClick={() => setShowAll(!showAll)}
                        className="inline-flex items-center gap-1.5 text-xs font-semibold text-violet-600 dark:text-violet-400 hover:text-violet-700 dark:hover:text-violet-300 transition-colors"
                      >
                        <span>
                          {showAll
                            ? "Show less"
                            : `Show all ${voteData.votes.length} records`}
                        </span>
                        <svg
                          className={`w-3.5 h-3.5 transition-transform ${showAll ? "rotate-180" : ""}`}
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          strokeWidth="2.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <path d="M19 9l-7 7-7-7" />
                        </svg>
                      </button>
                    </div>
                  )}
                </div>

                {/* Export actions */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 rounded-2xl p-4 bg-white/60 dark:bg-white/[0.02] backdrop-blur-xl border border-violet-100/70 dark:border-white/10">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center shadow-md shrink-0">
                      <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M12 10v6m0 0l-3-3m3 3l3-3M3 17V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500 dark:text-gray-400">
                        Ready to export
                      </p>
                      <p className="text-xs text-gray-700 dark:text-gray-300">
                        {voteData.votes.length} records
                        {selectedRound === "all" ? " across all rounds" : ` from Round ${selectedRound}`}
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    {/* CSV */}
                    <button
                      onClick={exportToCSV}
                      disabled={exportLoading !== null}
                      className="relative group flex-1 sm:flex-none overflow-hidden rounded-xl transition-transform duration-200 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:scale-100"
                    >
                      <div className="absolute -inset-0.5 bg-gradient-to-r from-emerald-500 via-green-500 to-emerald-500 rounded-xl blur-md opacity-60 group-hover:opacity-90 transition-all duration-300" />
                      <div className="relative px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 via-green-500 to-emerald-500 bg-[length:200%_100%] group-hover:bg-[position:100%_0] text-white text-sm font-semibold shadow-md transition-[background-position] duration-700 flex items-center gap-2">
                        <span className="absolute inset-x-0 top-0 h-px bg-white/40 rounded-t-xl" />
                        <span className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/25 to-transparent" />
                        {exportLoading === "csv" ? (
                          <>
                            <div className="relative w-4 h-4 border-2 border-white/70 border-t-transparent rounded-full animate-spin" />
                            <span className="relative">Exporting…</span>
                          </>
                        ) : (
                          <>
                            <svg className="relative w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                            </svg>
                            <span className="relative">CSV</span>
                          </>
                        )}
                      </div>
                    </button>

                    {/* JSON */}
                    <button
                      onClick={exportToJSON}
                      disabled={exportLoading !== null}
                      className="relative group flex-1 sm:flex-none overflow-hidden rounded-xl transition-transform duration-200 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:scale-100"
                    >
                      <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-500 via-indigo-500 to-blue-500 rounded-xl blur-md opacity-60 group-hover:opacity-90 transition-all duration-300" />
                      <div className="relative px-4 py-2.5 rounded-xl bg-gradient-to-r from-blue-500 via-indigo-500 to-blue-500 bg-[length:200%_100%] group-hover:bg-[position:100%_0] text-white text-sm font-semibold shadow-md transition-[background-position] duration-700 flex items-center gap-2">
                        <span className="absolute inset-x-0 top-0 h-px bg-white/40 rounded-t-xl" />
                        <span className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/25 to-transparent" />
                        {exportLoading === "json" ? (
                          <>
                            <div className="relative w-4 h-4 border-2 border-white/70 border-t-transparent rounded-full animate-spin" />
                            <span className="relative">Exporting…</span>
                          </>
                        ) : (
                          <>
                            <svg className="relative w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                            </svg>
                            <span className="relative">JSON</span>
                          </>
                        )}
                      </div>
                    </button>
                  </div>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="empty"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                className="text-center py-16 rounded-2xl bg-gradient-to-b from-violet-50/50 to-transparent dark:from-white/[0.02] dark:to-transparent border border-dashed border-violet-200/70 dark:border-white/10"
              >
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-100 to-indigo-100 dark:from-violet-500/15 dark:to-indigo-500/10 mb-4 border border-violet-200/70 dark:border-violet-500/20">
                  <svg className="w-7 h-7 text-violet-500 dark:text-violet-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M9 17V7h6v10M5 21h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v14a2 2 0 002 2z" />
                  </svg>
                </div>
                <h4 className="text-base font-semibold text-gray-900 dark:text-white mb-1">
                  No data loaded yet
                </h4>
                <p className="text-sm text-gray-500 dark:text-gray-400 max-w-sm mx-auto">
                  Choose a round filter and click <span className="font-medium text-violet-600 dark:text-violet-400">Load Data</span> to fetch audience votes.
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  )
}
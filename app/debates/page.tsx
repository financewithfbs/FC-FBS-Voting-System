"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
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
  }[]
  votingControl: {
    isActive: boolean
  } | null
}

interface VoteStatus {
  [debateId: string]: boolean
}

export default function DebatesPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [debates, setDebates] = useState<Debate[]>([])
  const [selectedRound, setSelectedRound] = useState(1)
  const [loading, setLoading] = useState(true)
  const [votingFor, setVotingFor] = useState<string | null>(null)
  const [selectedTeam, setSelectedTeam] = useState<{ [debateId: string]: string }>({})
  const [voteStatus, setVoteStatus] = useState<VoteStatus>({})
  const [message, setMessage] = useState({ type: '', text: '' })
  const [mouse, setMouse] = useState({ x: 0, y: 0 })

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/signin")
    }
  }, [status, router])

  useEffect(() => {
    if (session) {
      fetchDebates()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session, selectedRound])

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

  const fetchDebates = async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/debates?round=${selectedRound}`)
      if (!res.ok) throw new Error("Failed to fetch debates")
      const data = await res.json()
      setDebates(data)
      await checkVoteStatus(data)
    } catch (error) {
      console.error("Error fetching debates:", error)
      setMessage({ type: 'error', text: 'Failed to load debates' })
    } finally {
      setLoading(false)
    }
  }

  const checkVoteStatus = async (debatesList: Debate[]) => {
    const statusMap: VoteStatus = {}
    for (const debate of debatesList) {
      try {
        const res = await fetch(`/api/debate-vote/status?debateId=${debate.id}`)
        if (res.ok) {
          const data = await res.json()
          statusMap[debate.id] = data.hasVoted
        }
      } catch (error) {
        console.error(`Error checking vote status for debate ${debate.id}:`, error)
      }
    }
    setVoteStatus(statusMap)
  }

  const handleVote = async (debateId: string) => {
    const teamId = selectedTeam[debateId]
    if (!teamId) {
      setMessage({ type: 'error', text: 'Please select a team to vote for' })
      return
    }

    setVotingFor(debateId)
    setMessage({ type: '', text: '' })

    try {
      const res = await fetch("/api/debate-vote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ debateId, teamId })
      })

      const data = await res.json()

      if (res.ok) {
        setMessage({ type: 'success', text: 'Vote cast successfully!' })
        setVoteStatus(prev => ({ ...prev, [debateId]: true }))
        setSelectedTeam(prev => {
          const newState = { ...prev }
          delete newState[debateId]
          return newState
        })
      } else {
        setMessage({ type: 'error', text: data.error || 'Failed to cast vote' })
      }
    } catch (error) {
      console.error("Error casting vote:", error)
      setMessage({ type: 'error', text: 'Network error. Please try again.' })
    } finally {
      setVotingFor(null)
    }
  }

  // ───────── Loading ─────────
  if (status === "loading" || loading) {
    return (
      <div className="relative min-h-screen overflow-hidden bg-[#F7F5FF] dark:bg-[#08061a] text-gray-900 dark:text-gray-100">
        {/* Ambient background */}
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
                Loading Debates
              </p>
              <p className="text-gray-500 dark:text-gray-400 mt-2 text-sm">
                Please wait while we prepare the voting session...
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

  // ───────── Admin block ─────────
  if (session?.user?.role === "ADMIN") {
    return (
      <div className="relative min-h-screen overflow-hidden bg-[#F7F5FF] dark:bg-[#08061a] text-gray-900 dark:text-gray-100">
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(120%_100%_at_50%_0%,#FFF7E5_0%,#F7F5FF_45%,#F7F5FF_100%)] dark:bg-[radial-gradient(120%_100%_at_50%_0%,#2a1e08_0%,#0d0a1f_45%,#08061a_100%)]" />
          <div className="absolute -top-40 -left-40 w-[32rem] h-[32rem] rounded-full bg-amber-300/30 dark:bg-amber-600/15 blur-[120px] animate-float-slow" />
          <div className="absolute -bottom-40 -right-40 w-[36rem] h-[36rem] rounded-full bg-[#7E5FFF]/30 dark:bg-[#6356D7]/20 blur-[140px] animate-float-slower" />
        </div>

        <div className="relative z-10 max-w-2xl mx-auto py-20 px-4">
          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
            className="relative rounded-3xl p-8 sm:p-10 text-center bg-white/70 dark:bg-white/[0.04] backdrop-blur-2xl border border-white/70 dark:border-white/10 shadow-[0_20px_60px_-20px_rgba(251,191,36,0.3)] dark:shadow-[0_20px_60px_-20px_rgba(0,0,0,0.8)]"
          >
            {/* Top gradient hairline */}
            <div className="absolute inset-x-12 -top-px h-px bg-gradient-to-r from-transparent via-amber-400/70 to-transparent" />

            <div className="text-7xl mb-6 animate-bounce drop-shadow-[0_10px_30px_rgba(251,191,36,0.4)]">👑</div>

            <h2 className="text-3xl font-bold mb-3 bg-gradient-to-r from-amber-500 via-orange-500 to-amber-500 bg-clip-text text-transparent">
              Admins Cannot Vote
            </h2>

            <p className="text-gray-600 dark:text-gray-400 mb-8 text-base leading-relaxed max-w-md mx-auto">
              As an admin, you cannot participate in voting. Please use the admin panel to manage debates.
            </p>

            <button onClick={() => router.push('/admin')} className="relative group mx-auto">
              <div className="absolute -inset-1 bg-gradient-to-r from-amber-500 via-orange-500 to-amber-500 rounded-2xl blur-lg opacity-60 group-hover:opacity-100 transition-all duration-300" />
              <div className="relative px-8 py-3.5 bg-gradient-to-r from-amber-500 via-orange-500 to-amber-500 bg-[length:200%_100%] group-hover:bg-[position:100%_0] text-white rounded-2xl font-semibold text-sm transition-[background-position] duration-700 shadow-lg flex items-center gap-2">
                <span className="absolute inset-x-0 top-0 h-px bg-white/50 rounded-t-2xl" />
                <span className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/30 to-transparent rounded-2xl" />
                <span className="relative">Go to Admin Panel</span>
                <svg className="relative w-4 h-4 transition-transform group-hover:translate-x-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M5 12h14M12 5l7 7-7 7" />
                </svg>
              </div>
            </button>
          </motion.div>
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

  const roundDebates = debates.filter(d => d.round === selectedRound)

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
          <div className="flex flex-col sm:flex-row sm:items-center gap-5 mb-6">
            <div className="relative shrink-0">
              <div className="absolute inset-0 bg-gradient-to-br from-[#6356D7] to-[#7E5FFF] rounded-2xl blur-xl opacity-50" />
              <div className="relative w-16 h-16 bg-gradient-to-br from-[#6356D7] via-[#7E5FFF] to-[#a385ff] rounded-2xl shadow-2xl flex items-center justify-center transform hover:rotate-6 transition-all duration-500">
                <span className="text-3xl drop-shadow-lg">🗳️</span>
              </div>
              <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white dark:border-[#08061a] shadow-lg">
                <div className="absolute inset-0 bg-green-400 rounded-full animate-ping" />
              </div>
            </div>

            <div className="flex-1">
              <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold leading-tight">
                Debate{" "}
                <span className="bg-gradient-to-r from-[#6356D7] via-[#7E5FFF] to-[#a385ff] bg-clip-text text-transparent">
                  Voting
                </span>
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-1.5 flex items-center gap-2 text-sm">
                <span className="relative flex w-2 h-2">
                  <span className="absolute inline-flex h-full w-full rounded-full bg-green-500 opacity-75 animate-ping" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
                </span>
                Vote for your favorite team in each debate
              </p>
            </div>
          </div>

          <div className="h-px w-full bg-gradient-to-r from-transparent via-[#7E5FFF]/40 to-transparent" />
        </motion.div>

        {/* ───────── Round selector ───────── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1], delay: 0.1 }}
          className="mb-8"
        >
          <div className="relative rounded-3xl p-5 sm:p-6 bg-white/60 dark:bg-white/[0.03] backdrop-blur-2xl border border-white/70 dark:border-white/10 shadow-[0_20px_60px_-20px_rgba(99,86,215,0.2)] dark:shadow-[0_20px_60px_-20px_rgba(0,0,0,0.8)]">
            <div className="absolute inset-x-12 -top-px h-px bg-gradient-to-r from-transparent via-[#7E5FFF]/60 to-transparent" />

            <div className="flex flex-col gap-4">
              <div className="flex items-center gap-3">
                <div className="bg-gradient-to-br from-[#6356D7] to-[#7E5FFF] rounded-xl p-2 shadow-lg">
                  <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                </div>
                <label className="font-semibold text-gray-800 dark:text-gray-200 text-sm uppercase tracking-wider">
                  Select Round
                </label>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {[
                  {
                    n: 1,
                    label: "Round 1",
                    sub: "Semi-Finals",
                    icon: "🎯",
                    gradient: "from-blue-500 via-indigo-500 to-purple-500",
                  },
                  {
                    n: 2,
                    label: "Round 2",
                    sub: "Finals",
                    icon: "⚡",
                    gradient: "from-[#6356D7] via-[#7E5FFF] to-pink-500",
                  },
                ].map((r) => {
                  const active = selectedRound === r.n
                  return (
                    <button
                      key={r.n}
                      onClick={() => setSelectedRound(r.n)}
                      className={`relative group overflow-hidden rounded-2xl p-[1px] transition-all duration-300 ${
                        active ? "scale-[1.02]" : "hover:scale-[1.01]"
                      }`}
                    >
                      {/* Active glow */}
                      <div
                        className={`absolute inset-0 bg-gradient-to-r ${r.gradient} transition-opacity duration-300 ${
                          active ? "opacity-100" : "opacity-0 group-hover:opacity-60"
                        }`}
                      />
                      <div
                        className={`relative flex items-center gap-3 px-4 py-3.5 rounded-2xl transition-all duration-300 ${
                          active
                            ? `bg-gradient-to-r ${r.gradient} text-white shadow-[0_10px_30px_-10px_rgba(126,95,255,0.6)]`
                            : "bg-white/80 dark:bg-white/[0.04] text-gray-700 dark:text-gray-300 border border-gray-200/60 dark:border-white/10"
                        }`}
                      >
                        <span className="text-2xl drop-shadow">{r.icon}</span>
                        <div className="text-left flex-1 leading-tight">
                          <p className="font-semibold text-sm">{r.label}</p>
                          <p className={`text-xs ${active ? "text-white/80" : "text-gray-500 dark:text-gray-400"}`}>
                            {r.sub}
                          </p>
                        </div>
                        {active && (
                          <span className="w-2 h-2 rounded-full bg-white shadow-[0_0_10px_rgba(255,255,255,0.9)] animate-pulse" />
                        )}
                      </div>
                    </button>
                  )
                })}
              </div>

              <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
                {selectedRound === 1
                  ? "6 Semi-Final debates • Winner from each advances to Finals"
                  : "3 Final debates • Winners are champions!"}
              </p>
            </div>
          </div>
        </motion.div>

        {/* ───────── Message alert ───────── */}
        <AnimatePresence>
          {message.text && (
            <motion.div
              initial={{ opacity: 0, y: -10, height: 0 }}
              animate={{ opacity: 1, y: 0, height: "auto" }}
              exit={{ opacity: 0, y: -10, height: 0 }}
              transition={{ duration: 0.3 }}
              className={`mb-6 p-4 rounded-2xl flex items-start gap-3 backdrop-blur-sm border ${
                message.type === 'success'
                  ? 'bg-green-50/90 dark:bg-green-900/25 text-green-700 dark:text-green-300 border-green-200 dark:border-green-900/40 shadow-[0_10px_30px_-15px_rgba(34,197,94,0.5)]'
                  : 'bg-red-50/90 dark:bg-red-900/25 text-red-700 dark:text-red-300 border-red-200 dark:border-red-900/40 shadow-[0_10px_30px_-15px_rgba(239,68,68,0.5)]'
              }`}
            >
              <span className="text-xl">{message.type === 'success' ? '✅' : '❌'}</span>
              <span className="flex-1 font-medium text-sm">{message.text}</span>
              <button
                onClick={() => setMessage({ type: '', text: '' })}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
                aria-label="Dismiss"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ───────── Debates grid ───────── */}
        {roundDebates.length === 0 ? (
          <div className="text-center py-20 rounded-3xl bg-white/60 dark:bg-white/[0.03] backdrop-blur-2xl border border-white/70 dark:border-white/10">
            <div className="text-6xl mb-4">🎤</div>
            <p className="text-gray-600 dark:text-gray-300 text-xl mb-2 font-semibold">No debates available</p>
            <p className="text-gray-400 dark:text-gray-500 text-sm">Please check back later</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <AnimatePresence mode="popLayout">
              {roundDebates.map((debate, index) => {
                const isVotingActive = debate.votingControl?.isActive || false
                const hasVoted = voteStatus[debate.id]
                const selected = selectedTeam[debate.id]
                const isVoting = votingFor === debate.id
                const gradFrom = debate.round === 1 ? "from-blue-500" : "from-[#6356D7]"
                const gradVia = debate.round === 1 ? "via-indigo-500" : "via-[#7E5FFF]"
                const gradTo = debate.round === 1 ? "to-purple-500" : "to-pink-500"

                return (
                  <motion.div
                    key={debate.id}
                    layout
                    initial={{ opacity: 0, y: 30, scale: 0.96 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -10, scale: 0.96 }}
                    transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1], delay: index * 0.05 }}
                    whileHover={isVotingActive && !hasVoted ? { y: -6 } : {}}
                    className={`
                      group relative rounded-3xl overflow-hidden backdrop-blur-2xl border transition-all duration-500
                      bg-white/70 dark:bg-white/[0.03]
                      border-white/70 dark:border-white/10
                      shadow-[0_20px_60px_-20px_rgba(99,86,215,0.25)] dark:shadow-[0_20px_60px_-20px_rgba(0,0,0,0.8)]
                      ${!isVotingActive && !hasVoted ? 'opacity-70' : ''}
                    `}
                  >
                    {/* Top gradient hairline */}
                    <div className={`absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent ${gradVia === "via-indigo-500" ? "via-indigo-500/60" : "via-[#7E5FFF]/60"} to-transparent z-10`} />

                    {/* Header stripe */}
                    <div className={`relative bg-gradient-to-r ${gradFrom} ${gradVia} ${gradTo} p-5 overflow-hidden`}>
                      {/* Inner blob accent */}
                      <div className="absolute -top-8 -right-8 w-24 h-24 rounded-full bg-white/20 blur-2xl" />
                      <div className="absolute top-1/2 -left-8 w-20 h-20 rounded-full bg-white/10 blur-2xl" />

                      <div className="relative flex justify-between items-start gap-3">
                        <div className="min-w-0">
                          <h3 className="text-lg font-bold text-white truncate drop-shadow-sm">
                            {debate.name || `Debate ${debate.debateNumber}`}
                          </h3>
                          <p className="text-white/80 text-xs uppercase tracking-wider mt-1 font-medium">
                            {debate.round === 1 ? 'Semi-Finals' : 'Finals'}
                          </p>
                        </div>

                        <AnimatePresence>
                          {hasVoted && (
                            <motion.span
                              initial={{ opacity: 0, scale: 0.7 }}
                              animate={{ opacity: 1, scale: 1 }}
                              exit={{ opacity: 0, scale: 0.7 }}
                              className="shrink-0 inline-flex items-center gap-1 bg-white/25 backdrop-blur-sm text-white px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border border-white/30 shadow-lg"
                            >
                              <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
                                <polyline points="20 6 9 17 4 12" />
                              </svg>
                              Voted
                            </motion.span>
                          )}
                        </AnimatePresence>
                      </div>
                    </div>

                    {/* Voting status bar */}
                    <div className="px-5 py-2.5 border-b border-gray-200/60 dark:border-white/10 bg-white/40 dark:bg-white/[0.02] backdrop-blur-sm">
                      <div className="flex items-center gap-2">
                        <span className="relative flex w-2 h-2">
                          {isVotingActive && (
                            <span className="absolute inline-flex h-full w-full rounded-full bg-green-500 opacity-75 animate-ping" />
                          )}
                          <span className={`relative inline-flex rounded-full h-2 w-2 ${isVotingActive ? 'bg-green-500' : 'bg-red-500'}`} />
                        </span>
                        <span className={`text-xs font-semibold uppercase tracking-wider ${isVotingActive ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                          {isVotingActive ? 'Voting Open' : 'Voting Closed'}
                        </span>
                      </div>
                    </div>

                    {/* Teams */}
                    <div className="p-5">
                      <div className="space-y-2.5">
                        {debate.teams.map(({ team }) => {
                          const isChosen = selected === team.id
                          const disabled = !isVotingActive || hasVoted
                          return (
                            <label
                              key={team.id}
                              className={`
                                relative block rounded-2xl p-[1px] cursor-pointer transition-all duration-300 overflow-hidden
                                ${isChosen ? "scale-[1.02]" : ""}
                                ${disabled ? "cursor-not-allowed" : "hover:scale-[1.01]"}
                              `}
                            >
                              {/* Gradient border when selected */}
                              {isChosen && (
                                <div className={`absolute inset-0 bg-gradient-to-r ${gradFrom} ${gradVia} ${gradTo}`} />
                              )}

                              <div
                                className={`
                                  relative flex items-center gap-3 p-3.5 rounded-2xl transition-all duration-300
                                  ${
                                    isChosen
                                      ? `bg-gradient-to-r ${gradFrom}/10 ${gradVia}/10 ${gradTo}/10 dark:bg-white/[0.05]`
                                      : `bg-white/60 dark:bg-white/[0.02] border border-gray-200/60 dark:border-white/10 ${!disabled ? "hover:bg-white/80 dark:hover:bg-white/[0.05] hover:border-[#7E5FFF]/40" : ""}`
                                  }
                                  ${disabled ? 'opacity-60' : ''}
                                `}
                              >
                                {/* Custom radio */}
                                <div className={`relative shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all duration-300 ${
                                  isChosen
                                    ? `border-transparent bg-gradient-to-r ${gradFrom} ${gradVia} ${gradTo}`
                                    : 'border-gray-300 dark:border-gray-600'
                                }`}>
                                  {isChosen && (
                                    <motion.span
                                      initial={{ scale: 0 }}
                                      animate={{ scale: 1 }}
                                      className="w-2 h-2 rounded-full bg-white shadow"
                                    />
                                  )}
                                </div>

                                <span className={`font-semibold text-sm flex-1 truncate ${isChosen ? 'text-gray-900 dark:text-white' : 'text-gray-800 dark:text-gray-200'}`}>
                                  {team.name}
                                </span>

                                {isChosen && (
                                  <motion.svg
                                    initial={{ scale: 0, rotate: -90 }}
                                    animate={{ scale: 1, rotate: 0 }}
                                    transition={{ type: "spring", stiffness: 400, damping: 20 }}
                                    className="w-4 h-4 text-[#6356D7] dark:text-[#b3a6ff] shrink-0"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="3"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                  >
                                    <polyline points="20 6 9 17 4 12" />
                                  </motion.svg>
                                )}

                                <input
                                  type="radio"
                                  name={`debate-${debate.id}`}
                                  value={team.id}
                                  checked={isChosen}
                                  onChange={() =>
                                    setSelectedTeam((prev) => ({ ...prev, [debate.id]: team.id }))
                                  }
                                  disabled={disabled}
                                  className="sr-only"
                                />
                              </div>
                            </label>
                          )
                        })}
                      </div>

                      {/* Action area */}
                      <AnimatePresence mode="wait">
                        {isVotingActive && !hasVoted && (
                          <motion.button
                            key="vote-btn"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            onClick={() => handleVote(debate.id)}
                            disabled={isVoting || !selected}
                            className="relative group/btn w-full mt-4 overflow-hidden rounded-2xl transition-transform duration-200 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                          >
                            <div className={`absolute -inset-0.5 bg-gradient-to-r ${gradFrom} ${gradVia} ${gradTo} rounded-2xl blur-lg opacity-60 group-hover/btn:opacity-90 transition-all duration-300`} />
                            <div className={`relative w-full py-3 bg-gradient-to-r ${gradFrom} ${gradVia} ${gradTo} bg-[length:200%_100%] group-hover/btn:bg-[position:100%_0] text-white rounded-2xl font-semibold text-sm transition-[background-position] duration-700 shadow-lg`}>
                              <span className="absolute inset-x-0 top-0 h-px bg-white/40 rounded-t-2xl" />
                              <span className="absolute inset-0 -translate-x-full group-hover/btn:translate-x-full transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/30 to-transparent" />
                              <span className="relative flex items-center justify-center gap-2">
                                {isVoting ? (
                                  <>
                                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                    <span>Submitting...</span>
                                  </>
                                ) : (
                                  <>
                                    <span>Submit Vote</span>
                                    <svg className="w-4 h-4 transition-transform group-hover/btn:translate-x-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                      <path d="M5 12h14M12 5l7 7-7 7" />
                                    </svg>
                                  </>
                                )}
                              </span>
                            </div>
                          </motion.button>
                        )}

                        {hasVoted && (
                          <motion.div
                            key="voted-state"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="mt-4 p-3.5 rounded-2xl bg-gradient-to-r from-green-50/90 to-emerald-50/90 dark:from-green-900/20 dark:to-emerald-900/20 border border-green-200/70 dark:border-green-900/40 text-center backdrop-blur-sm"
                          >
                            <div className="flex items-center justify-center gap-2 text-green-700 dark:text-green-300 text-sm font-medium">
                              <span className="w-5 h-5 rounded-full bg-green-500 flex items-center justify-center">
                                <svg className="w-3 h-3 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
                                  <polyline points="20 6 9 17 4 12" />
                                </svg>
                              </span>
                              You have voted in this debate
                            </div>
                          </motion.div>
                        )}

                        {!isVotingActive && !hasVoted && (
                          <motion.div
                            key="closed-state"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="mt-4 p-3.5 rounded-2xl bg-gray-100/70 dark:bg-white/[0.03] border border-gray-200/60 dark:border-white/10 text-center backdrop-blur-sm"
                          >
                            <div className="flex items-center justify-center gap-2 text-gray-500 dark:text-gray-400 text-sm font-medium">
                              <span className="w-1.5 h-1.5 rounded-full bg-gray-400" />
                              Voting is currently closed
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </motion.div>
                )
              })}
            </AnimatePresence>
          </div>
        )}

        {/* ───────── Footer note ───────── */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.6 }}
          className="mt-10 flex justify-center"
        >
          <div className="inline-flex items-center gap-2.5 px-4 py-2 rounded-full bg-white/60 dark:bg-white/[0.03] border border-white/70 dark:border-white/10 backdrop-blur-xl text-xs text-gray-500 dark:text-gray-400">
            <span className="text-base">🗳️</span>
            <span>You can vote once per debate</span>
            <span className="w-1 h-1 rounded-full bg-gray-400/50" />
            <span>Choose wisely</span>
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
      `}</style>
    </div>
  )
}
"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { motion, AnimatePresence } from "framer-motion"
import TeamManagement from "@/components/admin/TeamManagement"
import DebateManagement from "@/components/admin/DebateManagement"
import PanelistScoreManagement from "@/components/admin/PanelistScoreManagement"
import Results from "@/components/admin/Results"
import VotingControl from "@/components/admin/VotingControl"
import AudienceVotesExport from "@/components/admin/AudienceVotesExport"

export default function AdminPage() {
  const { data: session } = useSession()
  const [activeTab, setActiveTab] = useState("teams")
  const [selectedDebateId, setSelectedDebateId] = useState<string | null>(null)
  const [serverTime, setServerTime] = useState("")
  const [mounted, setMounted] = useState(false)

  // Live clock (client-side only, avoids hydration mismatch)
  useEffect(() => {
    setMounted(true)
    const tick = () => setServerTime(new Date().toLocaleTimeString())
    tick()
    const interval = setInterval(tick, 1000)
    return () => clearInterval(interval)
  }, [])

  // ───────── Access denied ─────────
  if (!session || session.user?.role !== "ADMIN") {
    return (
      <div className="min-h-[60vh] flex items-center justify-center px-4">
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="relative rounded-3xl p-8 sm:p-10 max-w-md w-full text-center bg-white/70 dark:bg-white/[0.03] backdrop-blur-2xl border border-white/70 dark:border-white/10 shadow-[0_20px_60px_-20px_rgba(239,68,68,0.35)] dark:shadow-[0_20px_60px_-20px_rgba(0,0,0,0.8)]"
        >
          {/* Top hairline */}
          <div className="absolute inset-x-12 -top-px h-px bg-gradient-to-r from-transparent via-red-400/70 to-transparent" />

          <div className="relative inline-block mb-5">
            <div className="absolute inset-0 bg-gradient-to-br from-red-400/40 to-rose-400/40 rounded-2xl blur-2xl" />
            <div className="relative w-16 h-16 rounded-2xl bg-gradient-to-br from-red-100 to-rose-100 dark:from-red-500/15 dark:to-rose-500/10 border border-red-200/70 dark:border-red-500/20 flex items-center justify-center mx-auto">
              <svg className="w-7 h-7 text-red-600 dark:text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="11" width="18" height="11" rx="2" />
                <path d="M7 11V7a5 5 0 0110 0v4" />
              </svg>
            </div>
          </div>

          <span className="block text-[10px] font-bold uppercase tracking-[0.18em] text-red-600 dark:text-red-400 mb-1.5">
            Restricted Access
          </span>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            You don't belong here
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
            Administrator privileges are required to access this panel.
          </p>

          <div className="inline-flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-widest text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-white/5 px-3 py-1.5 rounded-full border border-gray-200/70 dark:border-white/10">
            <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
            <span className="tabular-nums">Role: {session?.user?.role ?? "GUEST"}</span>
          </div>
        </motion.div>
      </div>
    )
  }

  const tabs = [
    { id: "teams", label: "Team Management", short: "Teams", icon: "👥" },
    { id: "debates", label: "Debate Management", short: "Debates", icon: "🎤" },
    { id: "scores", label: "Panelist Scores", short: "Scores", icon: "📝" },
    { id: "results", label: "View Results", short: "Results", icon: "📊" },
    { id: "voting", label: "Voting Control", short: "Voting", icon: "⏰" },
    { id: "audience", label: "Audience Votes", short: "Audience", icon: "👤" },
  ]

  const activeTabData = tabs.find((t) => t.id === activeTab)

  return (
    <div className="relative min-h-screen bg-[#F7F5FF] dark:bg-[#08061a] text-gray-900 dark:text-gray-100 selection:bg-violet-500/25">
      {/* ───────── Ambient background ───────── */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden -z-10">
        <div className="absolute inset-0 bg-[radial-gradient(120%_100%_at_50%_0%,#EDE7FF_0%,#F7F5FF_40%,#F7F5FF_100%)] dark:bg-[radial-gradient(120%_100%_at_50%_0%,#1a1238_0%,#0d0a1f_45%,#08061a_100%)]" />
        <div className="absolute -top-48 -left-48 w-[36rem] h-[36rem] rounded-full bg-[#B09EE4]/40 dark:bg-[#6356D7]/20 blur-[120px] animate-float-slow" />
        <div className="absolute -bottom-56 -right-48 w-[40rem] h-[40rem] rounded-full bg-[#7E5FFF]/35 dark:bg-[#261753]/50 blur-[140px] animate-float-slower" />
        <div
          className="absolute inset-0 opacity-[0.03] dark:opacity-[0.06]"
          style={{
            backgroundImage:
              "linear-gradient(to right, currentColor 1px, transparent 1px), linear-gradient(to bottom, currentColor 1px, transparent 1px)",
            backgroundSize: "42px 42px",
            maskImage: "radial-gradient(ellipse at center, black 30%, transparent 75%)",
            WebkitMaskImage: "radial-gradient(ellipse at center, black 30%, transparent 75%)",
          }}
        />
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* ───────── Header ───────── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="mb-8"
        >
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5">
            {/* Title block */}
            <div className="flex items-center gap-4">
              <div className="relative shrink-0">
                <div className="absolute inset-0 bg-gradient-to-br from-[#6356D7] to-[#7E5FFF] rounded-2xl blur-xl opacity-50" />
                <div className="relative w-16 h-16 rounded-2xl bg-gradient-to-br from-[#6356D7] via-[#7E5FFF] to-[#a385ff] flex items-center justify-center shadow-2xl">
                  <svg className="w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="3" />
                    <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 11-2.83 2.83l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 11-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 11-2.83-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 110-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 112.83-2.83l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 114 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 112.83 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 110 4h-.09a1.65 1.65 0 00-1.51 1z" />
                  </svg>
                </div>
                {/* Live dot */}
                <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-emerald-500 border-2 border-white dark:border-[#08061a] shadow-[0_0_12px_rgba(34,197,94,0.8)]">
                  <span className="absolute inset-0 rounded-full bg-emerald-400 animate-ping" />
                </span>
              </div>

              <div>
                <div className="flex items-center gap-2.5 mb-1">
                  <h1 className="text-2xl sm:text-3xl font-bold leading-tight">
                    Admin{" "}
                    <span className="bg-gradient-to-r from-[#6356D7] via-[#7E5FFF] to-[#a385ff] bg-clip-text text-transparent">
                      Control Panel
                    </span>
                  </h1>
                  <span className="hidden sm:inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-200/70 dark:border-emerald-500/20">
                    <span className="relative flex w-1.5 h-1.5">
                      <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-500 opacity-75 animate-ping" />
                      <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500" />
                    </span>
                    Live
                  </span>
                </div>
                <p className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  <span className="truncate max-w-[240px] sm:max-w-none">
                    Logged in as{" "}
                    <span className="font-medium text-gray-700 dark:text-gray-300">
                      {session.user?.email}
                    </span>
                  </span>
                </p>
              </div>
            </div>

            {/* Right side: server time + role chip */}
            <div className="flex items-center gap-3 flex-wrap">
              <div className="inline-flex items-center gap-2.5 bg-white/70 dark:bg-white/[0.04] backdrop-blur-xl rounded-2xl px-3.5 py-2.5 border border-white/70 dark:border-white/10 shadow-sm">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#6356D7] to-[#7E5FFF] flex items-center justify-center shadow-md">
                  <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10" />
                    <path d="M12 6v6l4 2" />
                  </svg>
                </div>
                <div className="leading-tight">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                    Server Time
                  </p>
                  <p className="text-sm font-semibold text-gray-900 dark:text-white tabular-nums">
                    {mounted ? serverTime : "—:—:—"}
                  </p>
                </div>
              </div>

              <div className="hidden sm:inline-flex items-center gap-2 bg-gradient-to-r from-[#6356D7] to-[#7E5FFF] text-white px-3.5 py-2.5 rounded-2xl shadow-lg">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                </svg>
                <span className="text-xs font-bold uppercase tracking-widest">
                  Admin
                </span>
              </div>
            </div>
          </div>

          {/* Hairline */}
          <div className="mt-6 h-px w-full bg-gradient-to-r from-transparent via-[#7E5FFF]/40 to-transparent" />
        </motion.div>

        {/* ───────── Tabs ───────── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1], delay: 0.1 }}
          className="mb-6"
        >
          <div className="relative rounded-2xl p-[1px] bg-gradient-to-r from-[#6356D7]/25 via-[#7E5FFF]/15 to-[#6356D7]/25">
            <div className="rounded-2xl bg-white/75 dark:bg-[#0f0d1a]/80 backdrop-blur-xl p-1.5 border border-white/70 dark:border-white/10 shadow-[0_20px_60px_-20px_rgba(99,86,215,0.25)] dark:shadow-[0_20px_60px_-20px_rgba(0,0,0,0.8)]">
              <nav className="flex gap-1 overflow-x-auto scrollbar-none">
                {tabs.map((tab) => {
                  const active = activeTab === tab.id
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`relative flex-1 min-w-fit px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all duration-300 whitespace-nowrap ${
                        active
                          ? "text-white"
                          : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 hover:bg-white/70 dark:hover:bg-white/[0.04]"
                      }`}
                    >
                      {active && (
                        <motion.span
                          layoutId="admin-tab-active"
                          transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                          className="absolute inset-0 rounded-xl bg-gradient-to-r from-[#6356D7] via-[#7E5FFF] to-[#a385ff] shadow-[0_8px_24px_-8px_rgba(126,95,255,0.7)]"
                        >
                          <span className="absolute inset-x-2 top-0 h-px bg-white/40 rounded-t-xl" />
                        </motion.span>
                      )}
                      <span className="relative flex items-center justify-center gap-2">
                        <span className="text-base">{tab.icon}</span>
                        <span className="hidden sm:inline">{tab.label}</span>
                        <span className="sm:hidden">{tab.short}</span>
                      </span>
                    </button>
                  )
                })}
              </nav>
            </div>
          </div>
        </motion.div>

        {/* ───────── Content ───────── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1], delay: 0.2 }}
          className="relative rounded-3xl p-[1px] bg-gradient-to-b from-[#6356D7]/20 via-[#7E5FFF]/10 to-transparent"
        >
          <div className="rounded-3xl bg-white/80 dark:bg-[#0f0d1a]/85 backdrop-blur-2xl border border-white/70 dark:border-white/10 shadow-[0_20px_60px_-20px_rgba(99,86,215,0.2)] dark:shadow-[0_20px_60px_-20px_rgba(0,0,0,0.8)] overflow-hidden">
            {/* Top hairline */}
            <div className="absolute inset-x-12 -top-px h-px bg-gradient-to-r from-transparent via-[#7E5FFF]/60 to-transparent" />

            {/* Active tab indicator strip */}
            <div className="px-6 sm:px-8 pt-6 sm:pt-7">
              <div className="flex items-center gap-3 mb-5">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#6356D7]/15 to-[#7E5FFF]/15 dark:from-[#6356D7]/25 dark:to-[#7E5FFF]/20 border border-[#6356D7]/25 dark:border-[#6356D7]/40 flex items-center justify-center text-base">
                  {activeTabData?.icon}
                </div>
                <div>
                  <h2 className="text-base font-semibold text-gray-900 dark:text-white">
                    {activeTabData?.label}
                  </h2>
                  <p className="text-[11px] text-gray-500 dark:text-gray-400">
                    Manage and configure this section
                  </p>
                </div>
              </div>
              <div className="h-px w-full bg-gradient-to-r from-[#7E5FFF]/30 via-[#7E5FFF]/10 to-transparent" />
            </div>

            {/* Tab content with animated transitions */}
            <div className="p-6 sm:p-8">
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeTab}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                >
                  {activeTab === "teams" && <TeamManagement />}
                  {activeTab === "debates" && <DebateManagement />}
                  {activeTab === "scores" && (
                    <PanelistScoreManagement
                      selectedDebateId={selectedDebateId}
                      onDebateSelect={setSelectedDebateId}
                    />
                  )}
                  {activeTab === "results" && <Results />}
                  {activeTab === "voting" && <VotingControl />}
                  {activeTab === "audience" && <AudienceVotesExport />}
                </motion.div>
              </AnimatePresence>
            </div>
          </div>
        </motion.div>

        {/* ───────── Footer status strip ───────── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1], delay: 0.3 }}
          className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-3"
        >
          {[
            {
              label: "Active Tab",
              value: activeTabData?.label ?? activeTab,
              icon: activeTabData?.icon ?? "📋",
              gradient: "from-[#6356D7] to-[#7E5FFF]",
            },
            {
              label: "Selected Debate",
              value: selectedDebateId ? `${selectedDebateId.slice(0, 6)}…` : "None",
              icon: "🎤",
              gradient: "from-blue-500 to-indigo-500",
            },
            {
              label: "Admin Status",
              value: "Active",
              icon: "✓",
              gradient: "from-emerald-500 to-green-500",
            },
            {
              label: "Session",
              value: "Authenticated",
              icon: "🔐",
              gradient: "from-amber-500 to-orange-500",
            },
          ].map((stat) => (
            <div
              key={stat.label}
              className="relative rounded-2xl p-[1px] overflow-hidden"
            >
              <div className={`absolute inset-0 bg-gradient-to-br ${stat.gradient} opacity-50`} />
              <div className="relative rounded-2xl bg-white/85 dark:bg-[#0f0d1a]/85 backdrop-blur-xl p-3.5 border border-white/70 dark:border-white/10">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500 dark:text-gray-400">
                    {stat.label}
                  </p>
                  <div className={`w-6 h-6 rounded-lg bg-gradient-to-br ${stat.gradient} flex items-center justify-center text-white text-[10px] shadow-md`}>
                    {stat.icon}
                  </div>
                </div>
                <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                  {stat.value}
                </p>
              </div>
            </div>
          ))}
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

        .scrollbar-none::-webkit-scrollbar {
          display: none;
        }
        .scrollbar-none {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </div>
  )
}
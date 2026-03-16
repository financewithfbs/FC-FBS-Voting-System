"use client"

import { useState, useEffect, useRef } from "react"
import { useSession } from "next-auth/react"

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
  const [hoveredDebate, setHoveredDebate] = useState<string | null>(null)
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    fetchResults()
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
    switch(currentRound) {
      case 1:
        return {
          title: "Round 1 - Semi-Finals",
          description: "6 debates with 2 teams each. Winner from each debate advances to Round 2.",
          icon: "🎯",
          color: "from-blue-600 to-indigo-600",
          bgColor: "from-blue-50 to-indigo-50",
          shortLabel: "Semi-Finals",
          longLabel: "Semi-Finals (6 Debates)",
          emoji: "🎯"
        }
      case 2:
        return {
          title: "Round 2 - FINALS",
          description: "3 debates with winners from Round 1. Final winners decided!",
          icon: "⚡",
          color: "from-purple-600 to-pink-600",
          bgColor: "from-purple-50 to-pink-50",
          shortLabel: "Finals",
          longLabel: "Finals (3 Debates)",
          emoji: "⚡"
        }
      default:
        return {
          title: "Leaderboard",
          description: "",
          icon: "📊",
          color: "from-gray-600 to-gray-700",
          bgColor: "from-gray-50 to-gray-100",
          shortLabel: "Results",
          longLabel: "View Results",
          emoji: "📊"
        }
    }
  }

  const getMedal = (position: number) => {
    switch(position) {
      case 0: return { emoji: "🥇", label: "Gold", color: "from-yellow-400 to-yellow-500", bg: "bg-yellow-50" }
      case 1: return { emoji: "🥈", label: "Silver", color: "from-gray-300 to-gray-400", bg: "bg-gray-50" }
      case 2: return { emoji: "🥉", label: "Bronze", color: "from-orange-400 to-orange-500", bg: "bg-orange-50" }
      default: return { emoji: "", label: "", color: "", bg: "" }
    }
  }

  const roundInfo = getRoundInfo()

  const roundOptions = [
    { value: 1, label: "Semi-Finals (6 Debates)", emoji: "🎯", color: "blue" },
    { value: 2, label: "Finals (3 Debates)", emoji: "⚡", color: "purple" }
  ]

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-indigo-50 py-12 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="bg-white/70 backdrop-blur-sm rounded-3xl shadow-2xl p-12">
            <div className="flex flex-col items-center justify-center py-16">
              <div className="relative">
                <div className="w-24 h-24 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin"></div>
                <div className="absolute inset-0 bg-gradient-to-r from-purple-600/20 to-indigo-600/20 rounded-full blur-2xl animate-pulse"></div>
              </div>
              <p className="mt-8 text-2xl font-semibold bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent">
                Loading Results
              </p>
              <p className="text-gray-500 mt-2">Please wait while we fetch the latest scores...</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-indigo-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header Section */}
        <div className="mb-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="relative">
                <div className="w-16 h-16 bg-gradient-to-r from-purple-600 to-indigo-600 rounded-2xl shadow-xl flex items-center justify-center transform hover:rotate-6 transition-all duration-300">
                  <span className="text-4xl">📊</span>
                </div>
                <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white animate-pulse"></div>
              </div>
              <div>
                <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent">
                  Debate Leaderboard
                </h1>
                <p className="text-gray-600 mt-1 flex items-center gap-2">
                  <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                  Live Results • Real-time Updates
                </p>
              </div>
            </div>

            {/* Round Selector Dropdown */}
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="group relative w-full md:w-80 bg-white/80 backdrop-blur-sm hover:bg-white rounded-2xl shadow-lg border border-white/50 p-1 transition-all duration-300 hover:shadow-xl"
              >
                <div className="flex items-center justify-between p-3">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl bg-gradient-to-r ${
                      currentRound === 1 ? 'from-blue-500 to-indigo-500' : 'from-purple-500 to-pink-500'
                    } flex items-center justify-center text-white text-lg shadow-md`}>
                      {roundOptions.find(r => r.value === currentRound)?.emoji}
                    </div>
                    <div className="text-left">
                      <p className="text-xs text-gray-500">Viewing</p>
                      <p className="font-semibold text-gray-800">
                        {roundOptions.find(r => r.value === currentRound)?.label}
                      </p>
                    </div>
                  </div>
                  <svg 
                    className={`w-5 h-5 text-gray-400 transition-transform duration-300 ${isDropdownOpen ? 'rotate-180' : ''}`} 
                    fill="none" 
                    viewBox="0 0 24 24" 
                    stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </button>

              {isDropdownOpen && (
                <div className="absolute right-0 mt-2 w-full md:w-80 bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden z-50 animate-fade-in-down">
                  <div className="p-2 space-y-1">
                    {roundOptions.map((option) => (
                      <button
                        key={option.value}
                        onClick={() => {
                          setCurrentRound(option.value)
                          setIsDropdownOpen(false)
                        }}
                        className={`
                          w-full flex items-center gap-3 p-3 rounded-xl transition-all duration-300
                          ${currentRound === option.value 
                            ? `bg-gradient-to-r ${
                                option.color === 'blue' ? 'from-blue-50 to-indigo-50 border-l-4 border-blue-500' : 'from-purple-50 to-pink-50 border-l-4 border-purple-500'
                              }` 
                            : 'hover:bg-gray-50'
                          }
                        `}
                      >
                        <div className={`w-10 h-10 rounded-xl bg-gradient-to-r ${
                          option.color === 'blue' ? 'from-blue-500 to-indigo-500' : 'from-purple-500 to-pink-500'
                        } flex items-center justify-center text-white text-lg shadow-md`}>
                          {option.emoji}
                        </div>
                        <div className="flex-1 text-left">
                          <p className={`font-medium ${
                            currentRound === option.value 
                              ? option.color === 'blue' ? 'text-blue-700' : 'text-purple-700'
                              : 'text-gray-700'
                          }`}>
                            {option.label}
                          </p>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Decorative Line */}
          <div className="mt-6 h-1 w-full bg-gradient-to-r from-purple-200 via-indigo-200 to-purple-200 rounded-full"></div>
        </div>

        {/* Round Info Card */}
        <div className={`mb-8 bg-gradient-to-r ${roundInfo.color} rounded-2xl shadow-xl p-6 text-white`}>
          <div className="flex items-center gap-4">
            <div className="text-5xl animate-bounce-slow">{roundInfo.icon}</div>
            <div>
              <h2 className="text-2xl md:text-3xl font-bold mb-2">{roundInfo.title}</h2>
              <p className="text-white/90 text-lg">{roundInfo.description}</p>
            </div>
          </div>
        </div>

        {error ? (
          <div className="bg-red-50 border-l-4 border-red-500 text-red-700 p-4 rounded-lg flex items-center gap-3 animate-shake">
            <span className="text-2xl">❌</span>
            <span className="flex-1 font-medium">{error}</span>
            <button onClick={() => fetchResults()} className="text-red-500 hover:text-red-700">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </button>
          </div>
        ) : results && (
          <>
            {/* Round 2 Winners Display */}
            {currentRound === 2 && results.winners && (
              <div className="mb-8">
                <div className="bg-gradient-to-r from-yellow-50 to-orange-50 rounded-2xl p-6 border border-yellow-200">
                  <h3 className="text-2xl font-bold text-center mb-6">🏆 CHAMPIONS 🏆</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {[results.winners.first, results.winners.second, results.winners.third].map((winner, index) => {
                      if (!winner) return null;
                      const medal = getMedal(index);
                      return (
                        <div key={winner.teamId} className={`bg-white rounded-xl p-6 text-center shadow-lg transform hover:scale-105 transition-all duration-300 ${medal.bg}`}>
                          <div className={`text-5xl mb-3 inline-block p-3 rounded-full bg-gradient-to-r ${medal.color}`}>
                            {medal.emoji}
                          </div>
                          <h4 className="font-bold text-xl text-gray-800 mb-2">{winner.teamName}</h4>
                          <p className="text-2xl font-bold text-purple-600 mb-2">{winner.score}</p>
                          <p className="text-sm text-gray-500">{medal.label} Medal</p>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* Debates Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {results.debates.map((debate) => (
                <div
                  key={debate.debateId}
                  className={`
                    bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl overflow-hidden border-2 transition-all duration-300
                    ${hoveredDebate === debate.debateId ? 'border-purple-400 scale-[1.02]' : 'border-transparent'}
                  `}
                  onMouseEnter={() => setHoveredDebate(debate.debateId)}
                  onMouseLeave={() => setHoveredDebate(null)}
                >
                  {/* Debate Header */}
                  <div className="bg-gradient-to-r from-purple-600 to-indigo-600 p-4">
                    <h3 className="text-xl font-bold text-white">
                      {debate.name || `Debate ${debate.debateNumber}`}
                    </h3>
                    <p className="text-white/80 text-sm mt-1">
                      {debate.status === 'COMPLETED' ? '✓ Completed' : debate.status === 'ACTIVE' ? '⚡ In Progress' : '⏳ Upcoming'}
                    </p>
                  </div>

                  {/* Teams Comparison */}
                  <div className="p-6">
                    <div className="grid grid-cols-2 gap-4">
                      {debate.teams.map((team, idx) => (
                        <div key={team.teamId} className="text-center">
                          <div className={`font-bold text-lg mb-2 ${idx === 0 ? 'text-blue-600' : 'text-purple-600'}`}>
                            {team.teamName}
                          </div>
                          <div className="space-y-2">
                            <div className="bg-gray-50 rounded-lg p-2">
                              <p className="text-xs text-gray-500">Panelist (70%)</p>
                              <p className="font-bold text-gray-800">{team.panelistWeighted}</p>
                            </div>
                            <div className="bg-gray-50 rounded-lg p-2">
                              <p className="text-xs text-gray-500">Audience (30%)</p>
                              <p className="font-bold text-gray-800">{team.audienceWeighted}</p>
                            </div>
                            <div className="bg-gradient-to-r from-purple-50 to-indigo-50 rounded-lg p-2">
                              <p className="text-xs text-gray-500">Total</p>
                              <p className="font-bold text-lg text-purple-600">{team.totalScore}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Winner Indicator */}
                    {debate.winner && (
                      <div className="mt-4 pt-4 border-t border-gray-200 text-center">
                        <span className="inline-flex items-center gap-2 px-4 py-2 bg-green-100 text-green-700 rounded-full text-sm font-medium">
                          🏆 Winner: {debate.winner.teamName} (Score: {debate.winner.score})
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Stats Overview */}
            <div className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-white/70 backdrop-blur-sm rounded-xl p-4 shadow-lg border border-white/50">
                <p className="text-sm text-gray-500 mb-1">Total Debates</p>
                <p className="text-2xl font-bold text-gray-800">{results.debates.length}</p>
              </div>
              <div className="bg-white/70 backdrop-blur-sm rounded-xl p-4 shadow-lg border border-white/50">
                <p className="text-sm text-gray-500 mb-1">Total Votes</p>
                <p className="text-2xl font-bold text-purple-600">
                  {results.debates.reduce((acc, debate) => 
                    acc + debate.teams.reduce((sum, team) => sum + team.audienceVotes, 0), 0
                  )}
                </p>
              </div>
              <div className="bg-white/70 backdrop-blur-sm rounded-xl p-4 shadow-lg border border-white/50">
                <p className="text-sm text-gray-500 mb-1">Completed</p>
                <p className="text-2xl font-bold text-green-600">
                  {results.debates.filter(d => d.status === 'COMPLETED').length}
                </p>
              </div>
              <div className="bg-white/70 backdrop-blur-sm rounded-xl p-4 shadow-lg border border-white/50">
                <p className="text-sm text-gray-500 mb-1">Active</p>
                <p className="text-2xl font-bold text-yellow-600">
                  {results.debates.filter(d => d.status === 'ACTIVE').length}
                </p>
              </div>
            </div>
          </>
        )}

        {/* Footer */}
        <div className="mt-8 text-center text-sm text-gray-400">
          <p>Last updated: {new Date().toLocaleString()}</p>
        </div>
      </div>

      {/* Global Styles for Animations */}
      <style jsx>{`
        @keyframes bounce-slow {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }
        .animate-bounce-slow {
          animation: bounce-slow 2s infinite;
        }
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          10%, 30%, 50%, 70%, 90% { transform: translateX(-2px); }
          20%, 40%, 60%, 80% { transform: translateX(2px); }
        }
        .animate-shake {
          animation: shake 0.5s ease-in-out;
        }
        @keyframes fadeInDown {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fade-in-down {
          animation: fadeInDown 0.2s ease-out;
        }
      `}</style>
    </div>
  );
}
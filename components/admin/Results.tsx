"use client"

import { useState, useEffect } from "react"

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
  const [hoveredDebate, setHoveredDebate] = useState<string | null>(null)
  const [exportLoading, setExportLoading] = useState(false)

  useEffect(() => {
    fetchResults()
  }, [currentRound])

  const fetchResults = async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/debate-results?round=${currentRound}`)
      if (!res.ok) throw new Error('Failed to fetch results')
      const data = await res.json()
      setResults(data)
    } catch (error) {
      console.error("Error fetching results:", error)
    } finally {
      setLoading(false)
    }
  }

  const getRoundTitle = () => {
    switch(currentRound) {
      case 1:
        return { title: "Semi-Finals Results", subtitle: "6 Debates - Winners advance to Finals", icon: "🎯", color: "from-blue-600 to-indigo-600" }
      case 2:
        return { title: "Finals Results", subtitle: "3 Debates - Champions Crowned! 🏆", icon: "⚡", color: "from-purple-600 to-pink-600" }
      default:
        return { title: "Results", subtitle: "", icon: "📊", color: "from-gray-600 to-gray-700" }
    }
  }

  const getMedal = (position: number) => {
    switch(position) {
      case 0: return { emoji: "🥇", label: "Gold", color: "from-yellow-400 to-yellow-500" }
      case 1: return { emoji: "🥈", label: "Silver", color: "from-gray-300 to-gray-400" }
      case 2: return { emoji: "🥉", label: "Bronze", color: "from-orange-400 to-orange-500" }
      default: return { emoji: "", label: "", color: "" }
    }
  }

  const getRoundName = () => {
    switch(currentRound) {
      case 1: return "Semi_Finals"
      case 2: return "Finals"
      default: return "Results"
    }
  }

  const exportToCSV = () => {
    if (!results) return
    
    setExportLoading(true)
    try {
      const headers = [
        'Round',
        'Debate Number',
        'Debate Name',
        'Team 1',
        'Team 1 Score',
        'Team 2',
        'Team 2 Score',
        'Winner',
        'Winner Score'
      ]

      const rows = results.debates.map(debate => [
        currentRound === 1 ? 'Semi-Finals' : 'Finals', // Use currentRound instead of debate.round
        debate.debateNumber,
        debate.name || `Debate ${debate.debateNumber}`,
        debate.teams[0]?.teamName || '',
        debate.teams[0]?.totalScore || 0,
        debate.teams[1]?.teamName || '',
        debate.teams[1]?.totalScore || 0,
        debate.winner?.teamName || '',
        debate.winner?.score || 0
      ])

      const csvContent = [
        headers.join(','),
        ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
      ].join('\n')

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
      const link = document.createElement('a')
      const url = URL.createObjectURL(blob)
      
      const date = new Date().toISOString().split('T')[0]
      link.setAttribute('href', url)
      link.setAttribute('download', `debate_results_${getRoundName()}_${date}.csv`)
      link.style.visibility = 'hidden'
      
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

  if (loading) {
    return (
      <div className="bg-gradient-to-br from-white to-purple-50 rounded-2xl shadow-xl p-8">
        <div className="flex flex-col items-center justify-center py-16">
          <div className="relative">
            <div className="w-20 h-20 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin"></div>
            <div className="absolute inset-0 bg-gradient-to-r from-purple-600/20 to-indigo-600/20 rounded-full blur-xl animate-pulse"></div>
          </div>
          <p className="mt-6 text-gray-600 font-medium text-lg">Loading results...</p>
          <p className="text-sm text-gray-400">Please wait while we fetch the data</p>
        </div>
      </div>
    )
  }

  const roundInfo = getRoundTitle()

  return (
    <div className="bg-gradient-to-br from-white to-purple-50 rounded-2xl shadow-xl overflow-hidden">
      {/* Header with Gradient */}
      <div className={`bg-gradient-to-r ${roundInfo.color} p-6 md:p-8`}>
        <div className="flex items-center gap-4">
          <div className="text-5xl md:text-6xl animate-bounce-slow">{roundInfo.icon}</div>
          <div>
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-2">{roundInfo.title}</h2>
            <p className="text-white/90 text-lg flex items-center gap-2">
              <span className="w-2 h-2 bg-white rounded-full animate-pulse"></span>
              {roundInfo.subtitle}
            </p>
          </div>
        </div>
        
        {/* Round Selector */}
        <div className="mt-6 flex gap-3">
          <button
            onClick={() => setCurrentRound(1)}
            className={`px-4 py-2 rounded-lg font-medium transition-all ${
              currentRound === 1 
                ? 'bg-white text-blue-600 shadow-lg' 
                : 'bg-white/20 text-white hover:bg-white/30'
            }`}
          >
            Semi-Finals
          </button>
          <button
            onClick={() => setCurrentRound(2)}
            className={`px-4 py-2 rounded-lg font-medium transition-all ${
              currentRound === 2 
                ? 'bg-white text-purple-600 shadow-lg' 
                : 'bg-white/20 text-white hover:bg-white/30'
            }`}
          >
            Finals
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="p-6 md:p-8">
        {results && (
          <>
            {/* Round 2 Winners Display */}
            {currentRound === 2 && results.winners && (
              <div className="mb-8">
                <div className="bg-gradient-to-r from-yellow-50 to-orange-50 rounded-xl p-6 border border-yellow-200">
                  <h3 className="text-2xl font-bold text-center mb-6">🏆 CHAMPIONS 🏆</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {[results.winners.first, results.winners.second, results.winners.third].map((winner, index) => {
                      if (!winner) return null;
                      const medal = getMedal(index);
                      return (
                        <div key={winner.teamId} className="bg-white rounded-xl p-6 text-center shadow-lg">
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
                    bg-white rounded-xl shadow-lg overflow-hidden border-2 transition-all duration-300
                    ${hoveredDebate === debate.debateId ? 'border-purple-400 shadow-xl' : 'border-gray-100'}
                  `}
                  onMouseEnter={() => setHoveredDebate(debate.debateId)}
                  onMouseLeave={() => setHoveredDebate(null)}
                >
                  {/* Debate Header */}
                  <div className="bg-gradient-to-r from-purple-600 to-indigo-600 p-4">
                    <div className="flex justify-between items-center">
                      <h3 className="text-lg font-bold text-white">
                        {debate.name || `Debate ${debate.debateNumber}`}
                      </h3>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        debate.status === 'COMPLETED' ? 'bg-green-200 text-green-800' :
                        debate.status === 'ACTIVE' ? 'bg-yellow-200 text-yellow-800' :
                        'bg-gray-200 text-gray-800'
                      }`}>
                        {debate.status}
                      </span>
                    </div>
                  </div>

                  {/* Teams */}
                  <div className="p-4">
                    <div className="grid grid-cols-2 gap-4">
                      {debate.teams.map((team, idx) => (
                        <div key={team.teamId} className="text-center">
                          <p className={`font-semibold mb-2 ${idx === 0 ? 'text-blue-600' : 'text-purple-600'}`}>
                            {team.teamName}
                          </p>
                          <div className="space-y-1 text-sm">
                            <p>Panelist: <span className="font-bold">{team.panelistWeighted}</span></p>
                            <p>Audience: <span className="font-bold">{team.audienceWeighted}</span></p>
                            <p className="text-lg font-bold text-purple-600">{team.totalScore}</p>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Winner */}
                    {debate.winner && (
                      <div className="mt-4 pt-4 border-t border-gray-200 text-center">
                        <span className="inline-flex items-center gap-2 px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm">
                          🏆 Winner: {debate.winner.teamName} ({debate.winner.score})
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Export Button */}
            <div className="mt-6 flex justify-end">
              <button
                onClick={exportToCSV}
                disabled={exportLoading || !results}
                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl hover:shadow-lg transform hover:scale-105 transition-all duration-200 disabled:opacity-50"
              >
                {exportLoading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Exporting...</span>
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                    <span>Export Results</span>
                  </>
                )}
              </button>
            </div>
          </>
        )}
      </div>

      <style jsx>{`
        @keyframes bounce-slow {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-5px); }
        }
        .animate-bounce-slow {
          animation: bounce-slow 2s infinite;
        }
      `}</style>
    </div>
  )
}
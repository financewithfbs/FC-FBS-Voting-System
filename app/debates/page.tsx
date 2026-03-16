"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import Image from "next/image"

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
  const [hoveredDebate, setHoveredDebate] = useState<string | null>(null)

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/signin")
    }
  }, [status, router])

  useEffect(() => {
    if (session) {
      fetchDebates()
    }
  }, [session, selectedRound])

  const fetchDebates = async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/debates?round=${selectedRound}`)
      if (!res.ok) throw new Error("Failed to fetch debates")
      const data = await res.json()
      setDebates(data)
      
      // Check vote status for each debate
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
        setMessage({ 
          type: 'success', 
          text: 'Vote cast successfully!' 
        })
        // Update vote status
        setVoteStatus(prev => ({ ...prev, [debateId]: true }))
        // Clear selection
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
                Loading Debates
              </p>
              <p className="text-gray-500 mt-2">Please wait while we prepare the voting session...</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (session?.user?.role === "ADMIN") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-indigo-50 py-12 px-4">
        <div className="max-w-2xl mx-auto">
          <div className="bg-white/90 backdrop-blur-sm rounded-3xl shadow-2xl p-8 text-center border border-yellow-200">
            <div className="text-7xl mb-6 animate-bounce">👑</div>
            <h2 className="text-3xl font-bold text-gray-800 mb-4">Admins Cannot Vote</h2>
            <p className="text-gray-600 mb-8 text-lg">
              As an admin, you cannot participate in voting. Please use the admin panel to manage debates.
            </p>
            <button
              onClick={() => router.push('/admin')}
              className="relative group"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-indigo-600 rounded-xl blur-lg group-hover:blur-xl opacity-50 group-hover:opacity-75 transition-all duration-300"></div>
              <div className="relative bg-gradient-to-r from-purple-600 to-indigo-600 text-white px-8 py-4 rounded-xl font-semibold hover:shadow-2xl transform hover:scale-105 transition-all duration-200">
                Go to Admin Panel
              </div>
            </button>
          </div>
        </div>
      </div>
    )
  }

  const roundDebates = debates.filter(d => d.round === selectedRound)

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-indigo-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header Section */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <div className="relative">
              <div className="w-16 h-16 bg-gradient-to-r from-purple-600 to-indigo-600 rounded-2xl shadow-xl flex items-center justify-center transform hover:rotate-6 transition-all duration-300">
                <span className="text-4xl">🗳️</span>
              </div>
              <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white animate-pulse"></div>
            </div>
            <div>
              <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent">
                Debate Voting
              </h1>
              <p className="text-gray-600 mt-1 flex items-center gap-2">
                <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                Vote for your favorite team in each debate
              </p>
            </div>
          </div>

          {/* Decorative Line */}
          <div className="h-1 w-full bg-gradient-to-r from-purple-200 via-indigo-200 to-purple-200 rounded-full"></div>
        </div>

        {/* Round Selector */}
        <div className="mb-8">
          <div className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-lg p-4 border border-white/50">
            <div className="flex flex-col sm:flex-row sm:items-center gap-4">
              <div className="flex items-center gap-3">
                <div className="bg-gradient-to-r from-purple-600 to-indigo-600 rounded-xl p-2">
                  <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                </div>
                <label className="font-semibold text-gray-700">Select Round:</label>
              </div>

              <div className="flex-1 flex gap-3">
                <button
                  onClick={() => setSelectedRound(1)}
                  className={`flex-1 py-3 rounded-xl font-medium transition-all duration-300 ${
                    selectedRound === 1
                      ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg scale-105'
                      : 'bg-white text-gray-700 hover:shadow-md border border-gray-200'
                  }`}
                >
                  <span className="text-xl mr-2">🎯</span>
                  Round 1 - Semi-Finals
                </button>
                <button
                  onClick={() => setSelectedRound(2)}
                  className={`flex-1 py-3 rounded-xl font-medium transition-all duration-300 ${
                    selectedRound === 2
                      ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg scale-105'
                      : 'bg-white text-gray-700 hover:shadow-md border border-gray-200'
                  }`}
                >
                  <span className="text-xl mr-2">⚡</span>
                  Round 2 - Finals
                </button>
              </div>
            </div>

            <p className="mt-3 text-sm text-gray-500 text-center">
              {selectedRound === 1 
                ? "6 Semi-Final debates • Winner from each advances to Finals"
                : "3 Final debates • Winners are champions!"}
            </p>
          </div>
        </div>

        {/* Message Alert */}
        {message.text && (
          <div className={`mb-6 p-4 rounded-xl flex items-start gap-3 ${
            message.type === 'success'
              ? 'bg-green-50 text-green-700 border-l-4 border-green-500'
              : 'bg-red-50 text-red-700 border-l-4 border-red-500'
          }`}>
            <span className="text-2xl">{message.type === 'success' ? '✅' : '❌'}</span>
            <span className="flex-1 font-medium">{message.text}</span>
            <button onClick={() => setMessage({ type: '', text: '' })} className="text-gray-400 hover:text-gray-600">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        )}

        {/* Debates Grid */}
        {roundDebates.length === 0 ? (
          <div className="text-center py-16 bg-white/70 backdrop-blur-sm rounded-3xl">
            <div className="text-6xl mb-4">🎤</div>
            <p className="text-gray-600 text-xl mb-2">No debates available</p>
            <p className="text-gray-400">Please check back later</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {roundDebates.map((debate) => {
              const isVotingActive = debate.votingControl?.isActive || false
              const hasVoted = voteStatus[debate.id]
              const isSelected = selectedTeam[debate.id]

              return (
                <div
                  key={debate.id}
                  className={`
                    bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl overflow-hidden border-2 transition-all duration-300
                    ${hoveredDebate === debate.id ? 'border-purple-400 scale-[1.02]' : 'border-transparent'}
                    ${!isVotingActive ? 'opacity-75' : ''}
                  `}
                  onMouseEnter={() => setHoveredDebate(debate.id)}
                  onMouseLeave={() => setHoveredDebate(null)}
                >
                  {/* Debate Header */}
                  <div className={`bg-gradient-to-r ${
                    debate.round === 1 ? 'from-blue-600 to-indigo-600' : 'from-purple-600 to-pink-600'
                  } p-4`}>
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="text-xl font-bold text-white">
                          {debate.name || `Debate ${debate.debateNumber}`}
                        </h3>
                        <p className="text-white/80 text-sm mt-1">
                          {debate.round === 1 ? 'Semi-Finals' : 'Finals'}
                        </p>
                      </div>
                      {hasVoted && (
                        <span className="bg-green-500 text-white px-3 py-1 rounded-full text-xs font-medium">
                          ✓ Voted
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Voting Status */}
                  <div className="px-4 py-2 bg-gray-50 border-b border-gray-200">
                    <div className="flex items-center gap-2">
                      <span className={`w-2 h-2 rounded-full ${isVotingActive ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></span>
                      <span className="text-sm text-gray-600">
                        {isVotingActive ? 'Voting Open' : 'Voting Closed'}
                      </span>
                    </div>
                  </div>

                  {/* Teams */}
                  <div className="p-4">
                    <div className="space-y-4">
                      {debate.teams.map(({ team }) => (
                        <label
                          key={team.id}
                          className={`
                            block p-4 rounded-xl border-2 cursor-pointer transition-all duration-200
                            ${selectedTeam[debate.id] === team.id
                              ? 'border-purple-500 bg-gradient-to-r from-purple-50 to-indigo-50 shadow-lg'
                              : 'border-gray-200 hover:border-purple-300 hover:bg-gray-50'
                            }
                            ${!isVotingActive || hasVoted ? 'cursor-not-allowed opacity-50' : ''}
                          `}
                        >
                          <div className="flex items-center gap-3">
                            <input
                              type="radio"
                              name={`debate-${debate.id}`}
                              value={team.id}
                              checked={selectedTeam[debate.id] === team.id}
                              onChange={() => setSelectedTeam(prev => ({
                                ...prev,
                                [debate.id]: team.id
                              }))}
                              disabled={!isVotingActive || hasVoted}
                              className="w-5 h-5 text-purple-600 focus:ring-purple-500"
                            />
                            <span className="font-medium text-gray-800">{team.name}</span>
                          </div>
                        </label>
                      ))}
                    </div>

                    {/* Vote Button */}
                    {isVotingActive && !hasVoted && (
                      <button
                        onClick={() => handleVote(debate.id)}
                        disabled={votingFor === debate.id || !selectedTeam[debate.id]}
                        className="mt-4 w-full py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl font-semibold hover:shadow-lg transform hover:scale-[1.02] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {votingFor === debate.id ? (
                          <div className="flex items-center justify-center gap-2">
                            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                            <span>Submitting...</span>
                          </div>
                        ) : (
                          'Submit Vote'
                        )}
                      </button>
                    )}

                    {hasVoted && (
                      <div className="mt-4 p-3 bg-green-50 text-green-700 rounded-xl text-center text-sm">
                        You have voted in this debate
                      </div>
                    )}

                    {!isVotingActive && !hasVoted && (
                      <div className="mt-4 p-3 bg-gray-50 text-gray-500 rounded-xl text-center text-sm">
                        Voting is currently closed
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Footer Info */}
        <div className="mt-8 text-center text-sm text-gray-400">
          <p>🗳️ You can vote once per debate • Choose your favorite team wisely</p>
        </div>
      </div>
    </div>
  )
}
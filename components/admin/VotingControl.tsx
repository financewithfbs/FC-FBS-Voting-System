"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"

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
  const [message, setMessage] = useState({ type: '', text: '' })
  const [selectedRound, setSelectedRound] = useState<number>(1)

  useEffect(() => {
    if (session?.user?.role === "ADMIN") {
      fetchDebates()
    }
  }, [session])

  const fetchDebates = async () => {
    setLoading(true)
    try {
      // Use the debates API to get all debates with their voting control
      const res = await fetch("/api/admin/debates")
      
      if (res.status === 401) {
        setMessage({ type: 'error', text: 'Unauthorized access. Please refresh and sign in again.' })
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
      setMessage({ type: 'error', text: error.message || 'Failed to load debates' })
    } finally {
      setLoading(false)
    }
  }

  const toggleVoting = async (debateId: string, currentStatus: boolean) => {
    setUpdating(debateId)
    setMessage({ type: '', text: '' })

    try {
      const res = await fetch("/api/admin/debate-control", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          debateId, 
          isActive: !currentStatus 
        })
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || "Failed to update voting status")
      }

      setMessage({ 
        type: 'success', 
        text: `Voting ${!currentStatus ? 'started' : 'stopped'} successfully!` 
      })
      
      // Update local state
      setDebates(prev => 
        prev.map(debate => 
          debate.id === debateId 
            ? { 
                ...debate, 
                status: !currentStatus ? "ACTIVE" : "UPCOMING",
                votingControl: debate.votingControl ? {
                  ...debate.votingControl,
                  isActive: !currentStatus,
                  startTime: !currentStatus ? new Date().toISOString() : debate.votingControl.startTime,
                  endTime: currentStatus ? new Date().toISOString() : debate.votingControl.endTime
                } : {
                  isActive: !currentStatus,
                  startTime: !currentStatus ? new Date().toISOString() : null,
                  endTime: currentStatus ? new Date().toISOString() : null
                }
              }
            : debate
        )
      )

      setTimeout(() => setMessage({ type: '', text: '' }), 3000)
    } catch (error: any) {
      console.error("Error updating voting control:", error)
      setMessage({ type: 'error', text: error.message || "Failed to update voting status" })
    } finally {
      setUpdating(null)
    }
  }

  const getRoundIcon = (round: number) => {
    switch(round) {
      case 1: return "🎯"
      case 2: return "⚡"
      default: return "📊"
    }
  }

  const getRoundColor = (round: number) => {
    switch(round) {
      case 1: return "from-blue-600 to-indigo-600"
      case 2: return "from-purple-600 to-pink-600"
      default: return "from-gray-600 to-gray-700"
    }
  }

  if (!session || session.user?.role !== "ADMIN") {
    return (
      <div className="bg-white rounded-2xl shadow-lg p-6">
        <div className="text-center py-8">
          <div className="text-4xl mb-4">🔒</div>
          <p className="text-gray-600">Admin access required</p>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="bg-white rounded-2xl shadow-lg p-6">
        <div className="flex justify-center items-center py-8">
          <div className="w-8 h-8 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin"></div>
        </div>
      </div>
    )
  }

  const filteredDebates = debates.filter(d => d.round === selectedRound)

  return (
    <div className="bg-white rounded-2xl shadow-lg p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="bg-gradient-to-r from-purple-600 to-indigo-600 rounded-lg p-2">
          <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
        </div>
        <h3 className="text-lg font-bold text-gray-800">Debate Voting Control</h3>
      </div>

      {message.text && (
        <div className={`mb-4 p-3 rounded-lg text-sm ${
          message.type === 'success' 
            ? 'bg-green-50 text-green-700 border-l-4 border-green-500'
            : 'bg-red-50 text-red-700 border-l-4 border-red-500'
        }`}>
          {message.text}
        </div>
      )}

      {/* Round Selector */}
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setSelectedRound(1)}
          className={`px-4 py-2 rounded-lg font-medium transition-all ${
            selectedRound === 1 
              ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white' 
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          Round 1 - Semi-Finals
        </button>
        <button
          onClick={() => setSelectedRound(2)}
          className={`px-4 py-2 rounded-lg font-medium transition-all ${
            selectedRound === 2 
              ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white' 
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          Round 2 - Finals
        </button>
      </div>

      <div className="space-y-4">
        {filteredDebates.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            No debates found for this round.
          </div>
        ) : (
          filteredDebates.map((debate) => {
            const isActive = debate.votingControl?.isActive || false
            const startTime = debate.votingControl?.startTime
            const endTime = debate.votingControl?.endTime

            return (
              <div 
                key={debate.id}
                className={`p-4 rounded-xl border-2 transition-all duration-300 ${
                  isActive 
                    ? 'border-green-400 bg-green-50/50' 
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-lg bg-gradient-to-r ${getRoundColor(debate.round)} flex items-center justify-center text-white text-lg`}>
                      {getRoundIcon(debate.round)}
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-800">
                        {debate.name || `Debate ${debate.debateNumber}`}
                      </h4>
                      <div className="flex items-center gap-2 mt-1">
                        <span className={`text-xs px-2 py-0.5 rounded-full ${
                          isActive 
                            ? 'bg-green-100 text-green-700' 
                            : 'bg-gray-100 text-gray-600'
                        }`}>
                          {isActive ? '● Active' : '○ Inactive'}
                        </span>
                        {startTime && (
                          <span className="text-xs text-gray-500">
                            Started: {new Date(startTime).toLocaleTimeString()}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => toggleVoting(debate.id, isActive)}
                    disabled={updating === debate.id}
                    className={`relative px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                      isActive
                        ? 'bg-red-500 hover:bg-red-600 text-white'
                        : 'bg-green-500 hover:bg-green-600 text-white'
                    } disabled:opacity-50 disabled:cursor-not-allowed`}
                  >
                    {updating === debate.id ? (
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        <span>Updating...</span>
                      </div>
                    ) : (
                      isActive ? 'Stop Voting' : 'Start Voting'
                    )}
                  </button>
                </div>

                {/* Teams in this debate */}
                <div className="mt-3 pt-3 border-t border-gray-200">
                  <p className="text-xs text-gray-500 mb-2">Teams in this debate:</p>
                  <div className="flex gap-4">
                    {debate.teams.map((team, index) => (
                      <div key={team.team.id} className="flex items-center gap-2">
                        <span className="text-sm font-medium text-gray-700">
                          Team {index + 1}:
                        </span>
                        <span className="text-sm bg-purple-100 text-purple-700 px-2 py-1 rounded-full">
                          {team.team.name}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {endTime && (
                  <div className="mt-2 text-xs text-gray-500">
                    Ended: {new Date(endTime).toLocaleTimeString()}
                  </div>
                )}
              </div>
            )
          })
        )}
      </div>

      <div className="mt-4 p-3 bg-blue-50 rounded-lg text-xs text-blue-700">
        <p>💡 Control voting for each debate individually. When active, audience can vote for their preferred team in that debate.</p>
      </div>
    </div>
  )
}
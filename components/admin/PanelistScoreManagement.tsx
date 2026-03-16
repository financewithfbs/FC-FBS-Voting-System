"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"

interface Team {
  id: string
  name: string
}

interface Debate {
  id: string
  round: number
  debateNumber: number
  name: string | null
  teams: {
    team: Team
  }[]
}

interface Props {
  selectedDebateId: string | null
  onDebateSelect: (id: string | null) => void
}

export default function PanelistScoreManagement({ selectedDebateId, onDebateSelect }: Props) {
  const { data: session } = useSession()
  const [debates, setDebates] = useState<Debate[]>([])
  const [loading, setLoading] = useState(true)
  const [scores, setScores] = useState<Record<string, number>>({})
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState({ type: '', text: '' })
  const [selectedRound, setSelectedRound] = useState(1)

  useEffect(() => {
    if (session?.user?.role === "ADMIN") {
      fetchDebates()
    }
  }, [session])

  useEffect(() => {
    if (selectedDebateId) {
      fetchExistingScores(selectedDebateId)
    }
  }, [selectedDebateId])

  const fetchDebates = async () => {
    try {
      const res = await fetch("/api/admin/debates")
      if (!res.ok) throw new Error("Failed to fetch debates")
      const data = await res.json()
      setDebates(data)
    } catch (error) {
      console.error("Error fetching debates:", error)
      setMessage({ type: 'error', text: 'Failed to load debates' })
    } finally {
      setLoading(false)
    }
  }

  const fetchExistingScores = async (debateId: string) => {
    try {
      const res = await fetch(`/api/admin/panelist-scores/debate?debateId=${debateId}`)
      if (res.ok) {
        const data = await res.json()
        const scoresMap: Record<string, number> = {}
        data.forEach((score: any) => {
          scoresMap[score.teamId] = score.score
        })
        setScores(scoresMap)
      }
    } catch (error) {
      console.error("Error fetching scores:", error)
    }
  }

  const handleScoreChange = (teamId: string, score: number) => {
    const validScore = Math.min(100, Math.max(0, score))
    setScores(prev => ({ ...prev, [teamId]: validScore }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedDebateId) return

    setSaving(true)
    setMessage({ type: '', text: '' })

    const selectedDebate = debates.find(d => d.id === selectedDebateId)
    if (!selectedDebate) return

    // Check if all teams have scores
    const missingTeams = selectedDebate.teams.filter(team => !scores[team.team.id])
    if (missingTeams.length > 0) {
      setMessage({
        type: 'error',
        text: `Please enter scores for all teams: ${missingTeams.map(t => t.team.name).join(', ')}`
      })
      setSaving(false)
      return
    }

    try {
      const scoresArray = Object.entries(scores).map(([teamId, score]) => ({
        teamId,
        score
      }))

      const res = await fetch("/api/admin/panelist-scores/debate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          debateId: selectedDebateId,
          scores: scoresArray
        })
      })

      const data = await res.json()

      if (res.ok) {
        setMessage({ type: 'success', text: 'Scores saved successfully!' })
        setTimeout(() => setMessage({ type: '', text: '' }), 3000)
      } else {
        setMessage({ type: 'error', text: data.error || 'Error saving scores' })
      }
    } catch (error) {
      console.error("Error saving scores:", error)
      setMessage({ type: 'error', text: 'Error saving scores' })
    } finally {
      setSaving(false)
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

  const roundDebates = debates.filter(d => d.round === selectedRound)
  const selectedDebate = debates.find(d => d.id === selectedDebateId)

  return (
    <div className="bg-white rounded-2xl shadow-lg p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="bg-gradient-to-r from-purple-600 to-indigo-600 rounded-lg p-2">
          <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
        </div>
        <h3 className="text-lg font-bold text-gray-800">Panelist Score Management</h3>
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
          onClick={() => {
            setSelectedRound(1)
            onDebateSelect(null)
          }}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            selectedRound === 1
              ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          Round 1 - Semi-Finals
        </button>
        <button
          onClick={() => {
            setSelectedRound(2)
            onDebateSelect(null)
          }}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            selectedRound === 2
              ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          Round 2 - Finals
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Debate List */}
        <div className="lg:col-span-1 border-r pr-4">
          <h4 className="font-semibold text-gray-700 mb-3">Select Debate</h4>
          <div className="space-y-2 max-h-[500px] overflow-y-auto">
            {roundDebates.map((debate) => (
              <button
                key={debate.id}
                onClick={() => onDebateSelect(debate.id)}
                className={`w-full text-left p-3 rounded-lg transition-all ${
                  selectedDebateId === debate.id
                    ? 'bg-purple-100 border-2 border-purple-500'
                    : 'bg-gray-50 hover:bg-gray-100 border-2 border-transparent'
                }`}
              >
                <div className="font-medium text-gray-800">
                  {debate.name || `Debate ${debate.debateNumber}`}
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  {debate.teams.map(t => t.team.name).join(' vs ')}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Score Entry Form */}
        <div className="lg:col-span-2">
          {selectedDebate ? (
            <form onSubmit={handleSubmit} className="space-y-4">
              <h4 className="font-semibold text-gray-700 mb-3">
                Enter Scores for {selectedDebate.name || `Debate ${selectedDebate.debateNumber}`}
              </h4>

              <div className="space-y-3">
                {selectedDebate.teams.map((team) => (
                  <div key={team.team.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <span className="font-medium text-gray-700">{team.team.name}</span>
                    <div className="flex items-center gap-3">
                      <input
                        type="number"
                        min="0"
                        max="100"
                        step="0.5"
                        value={scores[team.team.id] || ''}
                        onChange={(e) => handleScoreChange(team.team.id, parseFloat(e.target.value) || 0)}
                        className="w-24 px-3 py-2 border border-gray-300 rounded-lg text-center focus:outline-none focus:ring-2 focus:ring-purple-500"
                        placeholder="0-100"
                        required
                      />
                      <span className="text-sm text-gray-500 w-16">
                        {scores[team.team.id] ? '✓ Set' : 'Pending'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex justify-end pt-4">
                <button
                  type="submit"
                  disabled={saving}
                  className="px-6 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-lg hover:shadow-lg transition-all disabled:opacity-50"
                >
                  {saving ? 'Saving...' : 'Save Scores'}
                </button>
              </div>
            </form>
          ) : (
            <div className="text-center py-12 text-gray-500">
              Select a debate from the list to enter panelist scores
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
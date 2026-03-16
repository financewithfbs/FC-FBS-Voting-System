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
  const [message, setMessage] = useState({ type: '', text: '' })
  const [selectedRound, setSelectedRound] = useState(1)
  const [selectedTeams, setSelectedTeams] = useState<{[key: string]: { team1: string; team2: string }}>({})

  useEffect(() => {
    if (session?.user?.role === "ADMIN") {
      fetchDebates()
      fetchTeams()
    }
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
      
      // Initialize selected teams state based on existing assignments
      const initialSelected: {[key: string]: { team1: string; team2: string }} = {}
      data.forEach((debate: Debate) => {
        if (debate.teams.length === 2) {
          initialSelected[debate.id] = {
            team1: debate.teams[0].team.id,
            team2: debate.teams[1].team.id
          }
        } else if (debate.teams.length === 1) {
          initialSelected[debate.id] = {
            team1: debate.teams[0].team.id,
            team2: ''
          }
        } else {
          initialSelected[debate.id] = { team1: '', team2: '' }
        }
      })
      setSelectedTeams(initialSelected)
    } catch (error) {
      console.error("Error fetching debates:", error)
      setMessage({ type: 'error', text: 'Failed to load debates' })
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

    setLoading(true)
    setMessage({ type: '', text: '' })

    try {
      // Create 6 debates for Round 1
      for (let i = 0; i < 6; i++) {
        const debateNumber = i + 1
        const res = await fetch("/api/admin/debates", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            round: 1,
            debateNumber: debateNumber,
            name: `Semi-Final Debate ${debateNumber}`
          })
        })

        if (!res.ok) {
          const errorData = await res.json()
          if (res.status === 400 && errorData.error?.includes("already exists")) {
            continue
          }
          throw new Error(errorData.error || `Failed to create debate ${debateNumber}`)
        }
      }

      // Create 3 debates for Round 2
      for (let i = 0; i < 3; i++) {
        const debateNumber = i + 1
        const res = await fetch("/api/admin/debates", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            round: 2,
            debateNumber: debateNumber,
            name: `Final Debate ${debateNumber}`
          })
        })

        if (!res.ok) {
          const errorData = await res.json()
          if (res.status === 400 && errorData.error?.includes("already exists")) {
            continue
          }
          throw new Error(errorData.error || `Failed to create debate ${debateNumber}`)
        }
      }

      setMessage({ type: 'success', text: 'Debate structure created successfully!' })
      fetchDebates()
      setTimeout(() => setMessage({ type: '', text: '' }), 3000)
    } catch (error: any) {
      console.error("Error creating debates:", error)
      setMessage({ type: 'error', text: error.message || 'Failed to create debate structure' })
    } finally {
      setLoading(false)
    }
  }

  const handleTeamSelect = (debateId: string, teamPosition: 'team1' | 'team2', teamId: string) => {
    setSelectedTeams(prev => ({
      ...prev,
      [debateId]: {
        ...prev[debateId],
        [teamPosition]: teamId
      }
    }))
  }

  const assignTeams = async (debateId: string) => {
    const teams = selectedTeams[debateId]
    if (!teams?.team1 || !teams?.team2) {
      setMessage({ type: 'error', text: 'Please select both teams' })
      return
    }

    if (teams.team1 === teams.team2) {
      setMessage({ type: 'error', text: 'Please select two different teams' })
      return
    }

    try {
      const res = await fetch(`/api/admin/debates`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: debateId,
          teamIds: [teams.team1, teams.team2]
        })
      })

      if (!res.ok) {
        const errorData = await res.json()
        throw new Error(errorData.error || "Failed to assign teams")
      }

      setMessage({ type: 'success', text: 'Teams assigned successfully!' })
      fetchDebates()
      setTimeout(() => setMessage({ type: '', text: '' }), 3000)
    } catch (error: any) {
      console.error("Error assigning teams:", error)
      setMessage({ type: 'error', text: error.message || 'Failed to assign teams' })
    }
  }

  const updateDebateStatus = async (debateId: string, status: string) => {
    try {
      const res = await fetch(`/api/admin/debates`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: debateId,
          status
        })
      })

      if (!res.ok) {
        const errorData = await res.json()
        throw new Error(errorData.error || "Failed to update debate status")
      }

      setMessage({ type: 'success', text: 'Debate status updated!' })
      fetchDebates()
      setTimeout(() => setMessage({ type: '', text: '' }), 3000)
    } catch (error: any) {
      console.error("Error updating debate status:", error)
      setMessage({ type: 'error', text: error.message || 'Failed to update debate status' })
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

  return (
    <div className="bg-white rounded-2xl shadow-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="bg-gradient-to-r from-purple-600 to-indigo-600 rounded-lg p-2">
            <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
          </div>
          <h3 className="text-lg font-bold text-gray-800">Debate Management</h3>
        </div>

        <button
          onClick={createDebateStructure}
          disabled={loading}
          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
        >
          Initialize Debate Structure
        </button>
      </div>

      {message.text && (
        <div className={`mb-4 p-3 rounded-lg text-sm ${
          message.type === 'success' 
            ? 'bg-green-50 text-green-700 border-l-4 border-green-500'
            : message.type === 'error'
            ? 'bg-red-50 text-red-700 border-l-4 border-red-500'
            : 'bg-blue-50 text-blue-700 border-l-4 border-blue-500'
        }`}>
          {message.text}
        </div>
      )}

      {/* Round Selector */}
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setSelectedRound(1)}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            selectedRound === 1
              ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          Round 1 - Semi-Finals (6 Debates)
        </button>
        <button
          onClick={() => setSelectedRound(2)}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            selectedRound === 2
              ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          Round 2 - Finals (3 Debates)
        </button>
      </div>

      {/* Debates Grid */}
      {roundDebates.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          No debates created yet. Click "Initialize Debate Structure" to create them.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {roundDebates.map((debate) => (
            <div key={debate.id} className="border rounded-xl p-4 hover:shadow-lg transition-shadow">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h4 className="font-semibold text-gray-800">
                    {debate.name || `Debate ${debate.debateNumber}`}
                  </h4>
                  <p className="text-xs text-gray-500 mt-1">ID: {debate.id.slice(0, 8)}...</p>
                </div>
                <select
                  value={debate.status}
                  onChange={(e) => updateDebateStatus(debate.id, e.target.value)}
                  className={`text-xs px-2 py-1 rounded-full border-0 font-medium ${
                    debate.status === 'ACTIVE' ? 'bg-green-100 text-green-700' :
                    debate.status === 'COMPLETED' ? 'bg-gray-100 text-gray-700' :
                    'bg-yellow-100 text-yellow-700'
                  }`}
                >
                  <option value="UPCOMING">Upcoming</option>
                  <option value="ACTIVE">Active</option>
                  <option value="COMPLETED">Completed</option>
                </select>
              </div>

              {/* Teams in this debate */}
              <div className="space-y-2 mb-3">
                {debate.teams.length === 0 ? (
                  <p className="text-sm text-gray-400 italic">No teams assigned</p>
                ) : (
                  debate.teams.map((dt, index) => (
                    <div key={dt.team.id} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-gray-500 w-16">
                          Team {index + 1}:
                        </span>
                        <span className="text-sm bg-purple-100 text-purple-700 px-2 py-1 rounded-full">
                          {dt.team.name}
                        </span>
                      </div>
                      {dt.score && (
                        <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">
                          Score: {dt.score}
                        </span>
                      )}
                    </div>
                  ))
                )}
              </div>

              {/* Team Assignment */}
              {debate.teams.length < 2 && (
                <div className="mt-3 pt-3 border-t border-gray-200">
                  <p className="text-xs text-gray-500 mb-2">Assign teams:</p>
                  <div className="space-y-3">
                    <select
                      value={selectedTeams[debate.id]?.team1 || ''}
                      onChange={(e) => handleTeamSelect(debate.id, 'team1', e.target.value)}
                      className="w-full text-sm border border-gray-300 rounded-lg px-2 py-1"
                    >
                      <option value="">Select Team 1</option>
                      {teams
                        .filter(t => t.id !== selectedTeams[debate.id]?.team2)
                        .map(team => (
                          <option key={team.id} value={team.id}>
                            {team.name}
                          </option>
                        ))}
                    </select>
                    
                    <select
                      value={selectedTeams[debate.id]?.team2 || ''}
                      onChange={(e) => handleTeamSelect(debate.id, 'team2', e.target.value)}
                      className="w-full text-sm border border-gray-300 rounded-lg px-2 py-1"
                      disabled={!selectedTeams[debate.id]?.team1}
                    >
                      <option value="">Select Team 2</option>
                      {teams
                        .filter(t => t.id !== selectedTeams[debate.id]?.team1)
                        .map(team => (
                          <option key={team.id} value={team.id}>
                            {team.name}
                          </option>
                        ))}
                    </select>

                    <button
                      onClick={() => assignTeams(debate.id)}
                      disabled={!selectedTeams[debate.id]?.team1 || !selectedTeams[debate.id]?.team2}
                      className="w-full px-3 py-2 bg-purple-600 text-white text-sm rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Assign Teams
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
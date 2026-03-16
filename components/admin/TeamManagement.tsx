"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";

interface Team {
  id: string;
  name: string;
  description: string | null;
}

interface TeamWithStats extends Team {
  voteCount?: number;
  panelistScoreCount?: number;
}

export default function TeamManagement() {
  const { data: session, status } = useSession();
  const [teams, setTeams] = useState<TeamWithStats[]>([]);
  const [loading, setLoading] = useState(false);
  const [editingTeam, setEditingTeam] = useState<Team | null>(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [hoveredTeam, setHoveredTeam] = useState<string | null>(null);
  const [fetchingStats, setFetchingStats] = useState(false);

  useEffect(() => {
    if (session?.user?.role === "ADMIN") {
      fetchTeams();
    }
  }, [session]);

  const fetchTeams = async () => {
    try {
      const res = await fetch("/api/teams");
      if (!res.ok) throw new Error("Failed to fetch teams");
      const data = await res.json();

      // Fetch stats for each team
      await fetchTeamStats(data);
    } catch (error) {
      console.error("Error fetching teams:", error);
      setError("Failed to load teams");
    }
  };

  const fetchTeamStats = async (teamsData: Team[]) => {
    setFetchingStats(true);
    try {
      // Try to fetch debate results to get vote counts
      let voteCountMap: Record<string, number> = {};
      let scoreCountMap: Record<string, number> = {};

      try {
        // Fetch results for Round 1 debates
        const resultsRes = await fetch("/api/debate-results?round=1");
        if (resultsRes.ok) {
          const resultsData = await resultsRes.json();

          // Aggregate votes from all debates
          if (resultsData.debates) {
            resultsData.debates.forEach((debate: any) => {
              debate.teams.forEach((team: any) => {
                if (!voteCountMap[team.teamId]) {
                  voteCountMap[team.teamId] = 0;
                }
                voteCountMap[team.teamId] += team.audienceVotes || 0;
              });
            });
          }
        }
      } catch (error) {
        console.log("Results API not available yet, using default values");
      }

      try {
        // Fetch panelist scores
        const scoresRes = await fetch("/api/admin/panelist-scores");
        if (scoresRes.ok) {
          const scoresData = await scoresRes.json();
          scoresData.forEach((score: any) => {
            if (!scoreCountMap[score.teamId]) {
              scoreCountMap[score.teamId] = 0;
            }
            scoreCountMap[score.teamId]++;
          });
        }
      } catch (error) {
        console.log(
          "Panelist scores API not available yet, using default values",
        );
      }

      const teamsWithStats = teamsData.map((team) => ({
        ...team,
        voteCount: voteCountMap[team.id] || 0,
        panelistScoreCount: scoreCountMap[team.id] || 0,
      }));

      setTeams(teamsWithStats);
    } catch (error) {
      console.error("Error fetching team stats:", error);
      setTeams(teamsData);
    } finally {
      setFetchingStats(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    const formData = new FormData(e.currentTarget);
    const name = formData.get("name") as string;
    const description = formData.get("description") as string;

    // Validate team name length
    if (name.length < 1) {
      setError("Team name must be at least 2 characters long");
      setLoading(false);
      return;
    }

    if (name.length > 50) {
      setError("Team name must be less than 50 characters");
      setLoading(false);
      return;
    }

    try {
      let res;
      let url;
      let method;

      if (editingTeam) {
        // Check if another team with same name exists (excluding current team)
        const existingTeam = teams.find(
          (t) =>
            t.name.toLowerCase() === name.toLowerCase() &&
            t.id !== editingTeam.id,
        );
        if (existingTeam) {
          setError("A team with this name already exists");
          setLoading(false);
          return;
        }

        url = `/api/teams/${editingTeam.id}`;
        method = "PUT";
        console.log(`Sending ${method} request to ${url}`, {
          name,
          description,
        });
      } else {
        // Check if team with same name exists
        const existingTeam = teams.find(
          (t) => t.name.toLowerCase() === name.toLowerCase(),
        );
        if (existingTeam) {
          setError("A team with this name already exists");
          setLoading(false);
          return;
        }

        url = "/api/teams";
        method = "POST";
        console.log(`Sending ${method} request to ${url}`, {
          name,
          description,
        });
      }

      res = await fetch(url, {
        method: method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name, description }),
      });

      console.log("Response status:", res.status);
      const data = await res.json();
      console.log("Response data:", data);

      if (!res.ok) {
        throw new Error(
          data.error || `Failed to save team (Status: ${res.status})`,
        );
      }

      if (e.currentTarget) {
        e.currentTarget.reset();
      }

      setEditingTeam(null);
      setSuccess(
        editingTeam
          ? "Team updated successfully!"
          : "Team created successfully!",
      );
      fetchTeams();

      setTimeout(() => setSuccess(""), 3000);
    } catch (error: any) {
      console.error("Error saving team:", error);
      setError(error.message || "Error saving team");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (
      !confirm(
        "Are you sure you want to delete this team? This will also delete all votes and scores associated with this team.",
      )
    )
      return;

    try {
      console.log(`Sending DELETE request to /api/teams/${id}`);
      const res = await fetch(`/api/teams/${id}`, {
        method: "DELETE",
      });

      console.log("Response status:", res.status);
      const data = await res.json();
      console.log("Response data:", data);

      if (!res.ok) {
        throw new Error(
          data.error || `Failed to delete team (Status: ${res.status})`,
        );
      }

      setSuccess("Team deleted successfully!");
      fetchTeams();

      setTimeout(() => setSuccess(""), 3000);
    } catch (error: any) {
      console.error("Error deleting team:", error);
      setError(error.message || "Error deleting team");
    }
  };

  const filteredTeams = teams.filter(
    (team) =>
      team.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (team.description &&
        team.description.toLowerCase().includes(searchTerm.toLowerCase())),
  );

  if (status === "loading" || fetchingStats) {
    return (
      <div className="bg-gradient-to-br from-white to-purple-50 rounded-2xl shadow-xl p-6 md:p-8">
        <div className="flex flex-col items-center justify-center py-12 md:py-16">
          <div className="relative">
            <div className="w-16 h-16 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin"></div>
            <div className="absolute inset-0 bg-gradient-to-r from-purple-600/20 to-indigo-600/20 rounded-full blur-xl animate-pulse"></div>
          </div>
          <p className="mt-6 text-gray-600 font-medium">Loading teams...</p>
        </div>
      </div>
    );
  }

  if (session?.user?.role !== "ADMIN") {
    return (
      <div className="bg-gradient-to-br from-white to-purple-50 rounded-2xl shadow-xl p-6 md:p-8">
        <div className="text-center py-12 md:py-16">
          <div className="text-6xl mb-4">🔒</div>
          <h3 className="text-xl font-bold text-gray-800 mb-2">
            Access Denied
          </h3>
          <p className="text-gray-600">
            You need admin privileges to access this page.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-white to-purple-50 rounded-2xl shadow-xl p-4 sm:p-6 md:p-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 md:mb-8">
        <div className="flex items-center gap-3 mb-4 sm:mb-0">
          <div className="bg-gradient-to-r from-purple-600 to-indigo-600 w-1 h-8 rounded-full"></div>
          <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-800">
            Team Management
          </h2>
          <span className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white text-xs px-3 py-1 rounded-full font-semibold shadow-lg">
            {teams.length}/12 Teams
          </span>
        </div>

        {/* Search Bar */}
        <div className="relative">
          <input
            type="text"
            placeholder="Search teams..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full sm:w-64 pl-10 pr-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200"
          />
          <svg
            className="absolute left-3 top-2.5 w-5 h-5 text-gray-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
          {searchTerm && (
            <button
              onClick={() => setSearchTerm("")}
              className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* Messages */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 text-red-700 rounded-xl border-l-4 border-red-500 flex items-start gap-3 animate-shake">
          <span className="text-xl">❌</span>
          <span className="flex-1">{error}</span>
          <button
            onClick={() => setError("")}
            className="text-red-500 hover:text-red-700"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>
      )}

      {success && (
        <div className="mb-6 p-4 bg-green-50 text-green-700 rounded-xl border-l-4 border-green-500 flex items-start gap-3 animate-slide-down">
          <span className="text-xl">✅</span>
          <span className="flex-1">{success}</span>
          <button
            onClick={() => setSuccess("")}
            className="text-green-500 hover:text-green-700"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
        {/* Add/Edit Team Form */}
        <div className="order-2 lg:order-1">
          <div className="bg-white rounded-2xl shadow-lg p-5 sm:p-6 border border-gray-100 hover:shadow-xl transition-all duration-300">
            <div className="flex items-center gap-3 mb-6">
              <div className="bg-gradient-to-r from-purple-600 to-indigo-600 rounded-lg p-2">
                {editingTeam ? (
                  <svg
                    className="w-5 h-5 text-white"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                    />
                  </svg>
                ) : (
                  <svg
                    className="w-5 h-5 text-white"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 4v16m8-8H4"
                    />
                  </svg>
                )}
              </div>
              <h3 className="text-lg sm:text-xl font-bold text-gray-800">
                {editingTeam ? "Edit Team" : "Add New Team"}
              </h3>
              {editingTeam && (
                <span className="bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded-full">
                  Editing Mode
                </span>
              )}
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block mb-2 text-sm font-medium text-gray-700">
                  Team Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="name"
                  defaultValue={editingTeam?.name}
                  required
                  maxLength={50}
                  className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200"
                  placeholder="Enter team name (2-50 characters)"
                />
              </div>

              <div>
                <label className="block mb-2 text-sm font-medium text-gray-700">
                  Description{" "}
                  <span className="text-gray-400 text-xs">(optional)</span>
                </label>
                <textarea
                  name="description"
                  defaultValue={editingTeam?.description || ""}
                  rows={4}
                  maxLength={200}
                  className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200 resize-none"
                  placeholder="Enter team description (max 200 characters)"
                />
              </div>

              <div className="flex flex-col sm:flex-row gap-3 pt-4">
                <button
                  type="submit"
                  disabled={loading}
                  className="relative group flex-1"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-indigo-600 rounded-xl blur-lg group-hover:blur-xl opacity-50 group-hover:opacity-75 transition-all duration-300"></div>
                  <div className="relative w-full px-6 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl font-semibold hover:shadow-2xl transform hover:scale-105 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed">
                    {loading ? (
                      <div className="flex items-center justify-center space-x-2">
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        <span>Saving...</span>
                      </div>
                    ) : editingTeam ? (
                      "Update Team"
                    ) : (
                      "Add Team"
                    )}
                  </div>
                </button>

                {editingTeam && (
                  <button
                    type="button"
                    onClick={() => {
                      setEditingTeam(null);
                      setError("");
                    }}
                    className="px-6 py-3 border-2 border-gray-300 rounded-xl text-gray-700 font-medium hover:bg-gray-50 hover:border-gray-400 transition-all duration-200 transform hover:scale-105"
                  >
                    Cancel
                  </button>
                )}
              </div>
            </form>

            {/* Quick Stats */}
            <div className="mt-6 pt-6 border-t border-gray-200">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gradient-to-r from-purple-50 to-indigo-50 rounded-lg p-3 text-center">
                  <p className="text-2xl font-bold text-purple-600">
                    {teams.length}
                  </p>
                  <p className="text-xs text-gray-600">Total Teams</p>
                </div>
                <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg p-3 text-center">
                  <p className="text-2xl font-bold text-green-600">
                    {12 - teams.length}
                  </p>
                  <p className="text-xs text-gray-600">Slots Left</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Teams List */}
        <div className="order-1 lg:order-2">
          <div className="bg-white rounded-2xl shadow-lg p-5 sm:p-6 border border-gray-100">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="bg-gradient-to-r from-purple-600 to-indigo-600 rounded-lg p-2">
                  <svg
                    className="w-5 h-5 text-white"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                    />
                  </svg>
                </div>
                <h3 className="text-lg sm:text-xl font-bold text-gray-800">
                  Teams List
                </h3>
              </div>
              <span className="bg-gray-100 text-gray-600 text-sm px-3 py-1 rounded-full">
                {filteredTeams.length}{" "}
                {filteredTeams.length === 1 ? "team" : "teams"} found
              </span>
            </div>

            {filteredTeams.length === 0 ? (
              <div className="text-center py-12 bg-gray-50 rounded-xl">
                {searchTerm ? (
                  <>
                    <div className="text-5xl mb-4">🔍</div>
                    <p className="text-gray-600 text-lg mb-2">No teams found</p>
                    <p className="text-sm text-gray-400">
                      Try adjusting your search term
                    </p>
                    <button
                      onClick={() => setSearchTerm("")}
                      className="mt-4 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-all duration-200"
                    >
                      Clear search
                    </button>
                  </>
                ) : (
                  <>
                    <div className="text-5xl mb-4">👥</div>
                    <p className="text-gray-600 text-lg mb-2">
                      No teams added yet
                    </p>
                    <p className="text-sm text-gray-400">
                      Create your first team using the form
                    </p>
                  </>
                )}
              </div>
            ) : (
              <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
                {filteredTeams.map((team, index) => (
                  <div
                    key={team.id}
                    className={`group relative bg-gradient-to-r from-gray-50 to-white rounded-xl p-4 border-2 transition-all duration-300 transform hover:-translate-y-1 hover:shadow-xl ${
                      hoveredTeam === team.id
                        ? "border-purple-300 shadow-lg"
                        : "border-gray-100"
                    }`}
                    onMouseEnter={() => setHoveredTeam(team.id)}
                    onMouseLeave={() => setHoveredTeam(null)}
                  >
                    {/* Rank Indicator */}
                    <div className="absolute -left-2 top-1/2 transform -translate-y-1/2">
                      <div
                        className={`w-1.5 h-12 rounded-full ${
                          index < 3
                            ? "bg-gradient-to-b from-yellow-400 to-yellow-500"
                            : "bg-gray-300"
                        }`}
                      ></div>
                    </div>

                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pl-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-bold text-gray-800 truncate">
                            {team.name}
                          </h4>
                          {index < 3 && (
                            <span
                              className="text-yellow-500 text-lg animate-pulse"
                              title="Top 3 team"
                            >
                              ⭐
                            </span>
                          )}
                        </div>
                        {team.description ? (
                          <p className="text-sm text-gray-600 line-clamp-2">
                            {team.description}
                          </p>
                        ) : (
                          <p className="text-sm text-gray-400 italic">
                            No description
                          </p>
                        )}

                        {/* Team Stats Tags */}
                        <div className="flex flex-wrap gap-2 mt-2">
                          <span
                            className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded-full"
                            title="Team ID"
                          >
                            ID: {team.id.substring(0, 8)}...
                          </span>
                          {team.voteCount !== undefined && (
                            <span
                              className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full"
                              title="Audience votes"
                            >
                              🗳️ {team.voteCount}{" "}
                              {team.voteCount === 1 ? "vote" : "votes"}
                            </span>
                          )}
                          {team.panelistScoreCount !== undefined && (
                            <span
                              className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full"
                              title="Panelist scores"
                            >
                              📊 {team.panelistScoreCount}{" "}
                              {team.panelistScoreCount === 1
                                ? "score"
                                : "scores"}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Action Buttons - FIXED: Added stopPropagation and higher z-index */}
                      <div
                        className="flex items-center gap-2"
                        onClick={(e) => e.stopPropagation()}
                        style={{ position: "relative", zIndex: 20 }}
                      >
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            e.preventDefault();
                            setEditingTeam(team);
                            setError("");
                            // Scroll to form smoothly
                            window.scrollTo({ top: 0, behavior: "smooth" });
                          }}
                          className="relative group/edit cursor-pointer"
                          title="Edit team"
                          type="button"
                        >
                          <div className="absolute inset-0 bg-blue-500 rounded-lg blur-md group-hover/edit:blur-lg opacity-0 group-hover/edit:opacity-50 transition-all duration-300"></div>
                          <div className="relative p-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-all duration-200 transform group-hover/edit:scale-110">
                            <svg
                              className="w-5 h-5"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                              />
                            </svg>
                          </div>
                        </button>

                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            e.preventDefault();
                            handleDelete(team.id);
                          }}
                          className="relative group/delete cursor-pointer"
                          title="Delete team"
                          type="button"
                        >
                          <div className="absolute inset-0 bg-red-500 rounded-lg blur-md group-hover/delete:blur-lg opacity-0 group-hover/delete:opacity-50 transition-all duration-300"></div>
                          <div className="relative p-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-all duration-200 transform group-hover/delete:scale-110">
                            <svg
                              className="w-5 h-5"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                              />
                            </svg>
                          </div>
                        </button>
                      </div>
                    </div>

                    {/* Hover Effect Border */}
                    <div
                      className={`absolute inset-0 rounded-xl border-2 transition-all duration-300 pointer-events-none ${
                        hoveredTeam === team.id
                          ? "border-purple-300 opacity-100"
                          : "border-transparent opacity-0"
                      }`}
                    ></div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Add global styles for custom scrollbar */}
      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #f1f1f1;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: linear-gradient(to bottom, #8c5bff, #6356d7);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: linear-gradient(to bottom, #7b4aee, #5245c6);
        }
        @keyframes shake {
          0%,
          100% {
            transform: translateX(0);
          }
          10%,
          30%,
          50%,
          70%,
          90% {
            transform: translateX(-2px);
          }
          20%,
          40%,
          60%,
          80% {
            transform: translateX(2px);
          }
        }
        .animate-shake {
          animation: shake 0.5s ease-in-out;
        }
        @keyframes slideDown {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-slide-down {
          animation: slideDown 0.3s ease-out;
        }
        .line-clamp-2 {
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
      `}</style>
    </div>
  );
}

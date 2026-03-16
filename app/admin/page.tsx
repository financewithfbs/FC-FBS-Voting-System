"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import TeamManagement from "@/components/admin/TeamManagement";
import DebateManagement from "@/components/admin/DebateManagement";
import PanelistScoreManagement from "@/components/admin/PanelistScoreManagement";
import Results from "@/components/admin/Results";
import VotingControl from "@/components/admin/VotingControl";
import AudienceVotesExport from "@/components/admin/AudienceVotesExport";

export default function AdminPage() {
  const { data: session } = useSession();
  const [activeTab, setActiveTab] = useState("teams");
  const [selectedDebateId, setSelectedDebateId] = useState<string | null>(null);

  if (!session || session.user?.role !== "ADMIN") {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="bg-gradient-to-br from-white to-red-50 rounded-2xl shadow-xl p-8 md:p-12 max-w-md w-full text-center border border-red-100">
          <div className="text-7xl mb-6 animate-bounce">🔒</div>
          <h2 className="text-2xl md:text-3xl font-bold text-gray-800 mb-3">
            Access Denied
          </h2>
          <p className="text-gray-600 mb-6">
            You need administrator privileges to access this panel.
          </p>
          <div className="w-16 h-1 bg-gradient-to-r from-red-500 to-pink-500 mx-auto rounded-full"></div>
        </div>
      </div>
    );
  }

  const tabs = [
    { id: "teams", label: "Team Management", icon: "👥" },
    { id: "debates", label: "Debate Management", icon: "🎤" },
    { id: "scores", label: "Panelist Scores", icon: "📝" },
    { id: "results", label: "View Results", icon: "📊" },
    { id: "voting", label: "Voting Control", icon: "⏰" },
    { id: "audience", label: "Audience Votes", icon: "👤" },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-indigo-50 py-6 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header Section */}
        <div className="mb-8 md:mb-10">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="relative">
                <div className="w-14 h-14 md:w-16 md:h-16 bg-gradient-to-r from-purple-600 to-indigo-600 rounded-2xl shadow-xl flex items-center justify-center transform hover:rotate-6 transition-all duration-300">
                  <span className="text-3xl md:text-4xl">⚙️</span>
                </div>
                <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white animate-pulse"></div>
              </div>
              <div>
                <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent">
                  Admin Panel
                </h1>
                <p className="text-gray-600 mt-1 flex items-center gap-2">
                  <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                  Logged in as {session.user?.email}
                </p>
              </div>
            </div>

            {/* Quick Stats */}
            <div className="flex items-center gap-3 bg-white/60 backdrop-blur-sm rounded-2xl p-3 shadow-lg border border-white/50">
              <div className="bg-gradient-to-r from-purple-600 to-indigo-600 rounded-xl p-2">
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
                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <div>
                <p className="text-xs text-gray-500">Server Time</p>
                <p className="text-sm font-semibold text-gray-800">
                  {new Date().toLocaleTimeString()}
                </p>
              </div>
            </div>
          </div>

          {/* Decorative Line */}
          <div className="mt-6 h-1 w-full bg-gradient-to-r from-purple-200 via-indigo-200 to-purple-200 rounded-full"></div>
        </div>

        {/* Tabs Navigation */}
        <div className="mb-8">
          <div className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-lg p-2 border border-white/50">
            <nav className="flex flex-wrap gap-2">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`
                    relative flex-1 sm:flex-none px-6 py-3 rounded-xl font-medium text-sm sm:text-base
                    transition-all duration-300 transform hover:scale-105
                    ${
                      activeTab === tab.id
                        ? "bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-lg"
                        : "text-gray-600 hover:bg-gray-100"
                    }
                  `}
                >
                  <span className="flex items-center justify-center gap-2">
                    <span className="text-lg">{tab.icon}</span>
                    <span className="hidden sm:inline">{tab.label}</span>
                    <span className="sm:hidden">{tab.label.split(" ")[0]}</span>
                  </span>
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* Content Area */}
        <div className="relative">
          {/* Background Decoration */}
          <div className="absolute inset-0 bg-gradient-to-r from-purple-100/30 to-indigo-100/30 rounded-3xl blur-3xl -z-10"></div>

          {/* Content Card */}
          <div className="bg-white/90 backdrop-blur-sm rounded-3xl shadow-2xl p-6 md:p-8 border border-white/50">
            {/* Tab Content with Animation */}
            <div className="transition-all duration-500 ease-in-out">
              {activeTab === "teams" && (
                <div className="animate-fade-in">
                  <TeamManagement />
                </div>
              )}
              {activeTab === "debates" && (
                <div className="animate-fade-in">
                  <DebateManagement />
                </div>
              )}
              {activeTab === "scores" && (
                <div className="animate-fade-in">
                  <PanelistScoreManagement 
                    selectedDebateId={selectedDebateId}
                    onDebateSelect={setSelectedDebateId}
                  />
                </div>
              )}
              {activeTab === "results" && (
                <div className="animate-fade-in">
                  <Results />
                </div>
              )}
              {activeTab === "voting" && (
                <div className="animate-fade-in">
                  <VotingControl />
                </div>
              )}
              {activeTab === "audience" && (
                <div className="animate-fade-in">
                  <AudienceVotesExport />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer Stats */}
        <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="bg-white/50 backdrop-blur-sm rounded-xl p-3 border border-white/50">
            <p className="text-xs text-gray-500">Active Tab</p>
            <p className="font-semibold text-gray-800 capitalize">
              {activeTab}
            </p>
          </div>
          <div className="bg-white/50 backdrop-blur-sm rounded-xl p-3 border border-white/50">
            <p className="text-xs text-gray-500">Selected Debate</p>
            <p className="font-semibold text-gray-800">
              {selectedDebateId ? `Debate ${selectedDebateId.slice(0, 4)}...` : 'None'}
            </p>
          </div>
          <div className="bg-white/50 backdrop-blur-sm rounded-xl p-3 border border-white/50">
            <p className="text-xs text-gray-500">Admin Status</p>
            <p className="font-semibold text-green-600">Active</p>
          </div>
          <div className="bg-white/50 backdrop-blur-sm rounded-xl p-3 border border-white/50">
            <p className="text-xs text-gray-500">Session</p>
            <p className="font-semibold text-purple-600">Authenticated</p>
          </div>
        </div>
      </div>

      {/* Add global styles for animations */}
      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .animate-fade-in {
          animation: fadeIn 0.5s ease-out;
        }
      `}</style>
    </div>
  );
}
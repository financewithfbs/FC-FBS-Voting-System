"use client"

import { useState, useRef, useEffect } from "react"
import { useRouter, usePathname } from "next/navigation"
import Image from "next/image"
import toast, { Toaster } from "react-hot-toast"

export default function SignUp() {
  const router = useRouter()
  const pathname = usePathname()
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [animatePanel, setAnimatePanel] = useState(false)
  const [focusedField, setFocusedField] = useState<string | null>(null)
  const [mouse, setMouse] = useState({ x: 0, y: 0 })

  const nameRef = useRef<HTMLInputElement>(null)
  const emailRef = useRef<HTMLInputElement>(null)
  const pgpRef = useRef<HTMLInputElement>(null)
  const sectionRef = useRef<HTMLInputElement>(null)
  const passwordRef = useRef<HTMLInputElement>(null)
  const confirmPasswordRef = useRef<HTMLInputElement>(null)
  const rootRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const timer = setTimeout(() => setAnimatePanel(true), 80)
    return () => clearTimeout(timer)
  }, [])

  useEffect(() => {
    const el = rootRef.current
    if (!el) return
    const onMove = (e: MouseEvent) => {
      const r = el.getBoundingClientRect()
      setMouse({
        x: (e.clientX - r.left) / r.width - 0.5,
        y: (e.clientY - r.top) / r.height - 0.5,
      })
    }
    el.addEventListener("mousemove", onMove)
    return () => el.removeEventListener("mousemove", onMove)
  }, [])

  const togglePassword = () => setShowPassword(!showPassword)
  const toggleConfirm = () => setShowConfirmPassword(!showConfirmPassword)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    setError("")
    setSuccess("")

    const formData = {
      name: nameRef.current?.value?.trim() || "",
      email: emailRef.current?.value?.trim() || "",
      pgp: pgpRef.current?.value?.trim() || "",
      section: sectionRef.current?.value?.trim() || "",
      password: passwordRef.current?.value || "",
      confirmPassword: confirmPasswordRef.current?.value || "",
    }

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match")
      setLoading(false)
      return
    }

    if (!formData.email.endsWith("@fostiima.org")) {
      setError("Please use your fostiima.org email address")
      setLoading(false)
      return
    }

    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
          name: formData.name,
          pgp: formData.pgp || null,
          section: formData.section || null,
        }),
      })

      const data = await res.json()

      if (res.ok) {
        setSuccess(data.message)
        toast.success("Account created successfully!")
        setTimeout(() => router.push("/auth/signin"), 2000)
      } else {
        setError(data.message || "Something went wrong")
        toast.error(data.message || "Something went wrong")
      }
    } catch {
      setError("Something went wrong")
      toast.error("Something went wrong")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      ref={rootRef}
      className="fixed inset-0 flex flex-col md:flex-row overflow-hidden font-sans bg-[#F7F5FF] dark:bg-[#08061a] text-gray-900 dark:text-gray-100 selection:bg-[#7E5FFF]/30"
    >
      <Toaster position="top-center" />

      {/* ───────── Ambient background ───────── */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(120%_100%_at_100%_0%,#EDE7FF_0%,#F7F5FF_40%,#F7F5FF_100%)] dark:bg-[radial-gradient(120%_100%_at_100%_0%,#1a1238_0%,#0d0a1f_45%,#08061a_100%)]" />

        <div className="absolute -top-48 -right-48 w-[40rem] h-[40rem] rounded-full bg-[#B09EE4]/50 dark:bg-[#6356D7]/25 blur-[120px] animate-float-slow" />
        <div className="absolute -bottom-56 -left-48 w-[44rem] h-[44rem] rounded-full bg-[#7E5FFF]/40 dark:bg-[#261753]/60 blur-[140px] animate-float-slower" />
        <div className="absolute top-1/3 right-1/2 w-72 h-72 rounded-full bg-[#6356D7]/20 dark:bg-[#7E5FFF]/15 blur-[100px] animate-float-slow" />

        <div
          className="absolute inset-0 opacity-[0.035] dark:opacity-[0.06]"
          style={{
            backgroundImage:
              "linear-gradient(to right, currentColor 1px, transparent 1px), linear-gradient(to bottom, currentColor 1px, transparent 1px)",
            backgroundSize: "42px 42px",
            maskImage:
              "radial-gradient(ellipse at center, black 30%, transparent 75%)",
            WebkitMaskImage:
              "radial-gradient(ellipse at center, black 30%, transparent 75%)",
          }}
        />
      </div>

      {/* ───────── Mobile toggle ───────── */}
      <header className="md:hidden relative z-30 w-full bg-[#0f0c22]/95 backdrop-blur-xl flex justify-center items-center py-3 shadow-[0_8px_30px_-8px_rgba(0,0,0,0.5)] border-b border-white/5">
        <div className="flex bg-white/[0.06] rounded-full p-1 shadow-inner border border-white/10">
          <button
            onClick={() => router.push("/auth/signin")}
            className={`px-5 py-1.5 rounded-full text-sm transition-all duration-300 ${
              pathname === "/auth/signin"
                ? "bg-gradient-to-r from-[#7E5FFF] to-[#5b3dff] text-white shadow-[0_4px_20px_rgba(126,95,255,0.5)]"
                : "text-gray-300 hover:bg-white/10 hover:text-white"
            }`}
          >
            Sign In          </button>
          <button
            onClick={() => router.push("/auth/signup")}
            className={`px-5 py-1.5 rounded-full text-sm transition-all duration-300 ${
              pathname === "/auth/signup"
                ? "bg-gradient-to-r from-[#7E5FFF] to-[#5b3dff] text-white shadow-[0_4px_20px_rgba(126,95,255,0.5)]"
                : "text-gray-300 hover:bg-white/10 hover:text-white"
            }`}
          >
            Sign Up
          </button>
        </div>
      </header>

      {/* ───────── Illustration panel (left) ───────── */}
      <div className="relative hidden md:flex md:w-1/2 items-center justify-center overflow-hidden">
        {/* Layer 1: deep base */}
        <div className="absolute inset-0 bg-gradient-to-bl from-[#1a1040] via-[#0f0a28] to-[#0a0620]" />

        {/* Layer 2: color blobs */}
        <div className="absolute -top-32 -left-32 w-[28rem] h-[28rem] rounded-full bg-[#7E5FFF]/40 blur-[100px]" />
        <div className="absolute -bottom-40 -right-20 w-[26rem] h-[26rem] rounded-full bg-[#B09EE4]/30 blur-[100px]" />
        <div className="absolute top-1/3 right-1/4 w-64 h-64 rounded-full bg-[#5b3dff]/30 blur-[80px]" />

        {/* Layer 3: fine grid */}
        <div
          className="absolute inset-0 opacity-[0.08]"
          style={{
            backgroundImage:
              "linear-gradient(to right, rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.5) 1px, transparent 1px)",
            backgroundSize: "40px 40px",
            maskImage: "radial-gradient(ellipse at 40% 50%, black 30%, transparent 75%)",
            WebkitMaskImage: "radial-gradient(ellipse at 40% 50%, black 30%, transparent 75%)",
          }}
        />

        {/* Layer 4: curved edge with parallax */}
        <svg
          className="absolute right-0 top-0 h-full w-[140px] z-20 pointer-events-none"
          viewBox="0 0 140 800"
          preserveAspectRatio="none"
          aria-hidden="true"
          style={{ transform: `translateY(${mouse.y * -8}px)` }}
        >
          <defs>
            <linearGradient id="edgeGradSignup" x1="1" y1="0" x2="0" y2="0">
              <stop offset="0%" stopColor="#B09EE4" stopOpacity="0" />
              <stop offset="60%" stopColor="#7E5FFF" stopOpacity="0.6" />
              <stop offset="100%" stopColor="#B09EE4" stopOpacity="0" />
            </linearGradient>
            <linearGradient id="edgeGlowSignup" x1="1" y1="0" x2="0" y2="0">
              <stop offset="0%" stopColor="#7E5FFF" stopOpacity="0" />
              <stop offset="50%" stopColor="#7E5FFF" stopOpacity="0.35" />
              <stop offset="100%" stopColor="#7E5FFF" stopOpacity="0" />
            </linearGradient>
          </defs>
          <path
            d="M 0,0 C 110,220 110,580 0,800"
            fill="none"
            stroke="url(#edgeGradSignup)"
            strokeWidth="2"
          />
          <path
            d="M 0,0 C 95,220 95,580 0,800"
            fill="none"
            stroke="url(#edgeGlowSignup)"
            strokeWidth="1"
            strokeDasharray="2 6"
          />
        </svg>

        {/* Layer 5: curtain reveal */}
        <div
          className={`absolute inset-0 bg-[#08061a] z-10 transition-transform duration-[1200ms] ease-[cubic-bezier(0.65,0,0.35,1)] ${
            animatePanel ? "-translate-x-full" : "translate-x-0"
          }`}
          style={{
            borderTopRightRadius: "50% 100%",
            borderBottomRightRadius: "50% 100%",
          }}
        />

        {/* Layer 6: floating UI chips */}
        <div
          className="absolute top-[16%] right-[10%] z-30 animate-fade-up"
          style={{
            animationDelay: "0.4s",
            transform: `translate3d(${mouse.x * -12}px, ${mouse.y * 12}px, 0)`,
          }}
        >
          <div className="flex items-center gap-2 px-3 py-2 rounded-2xl bg-white/[0.08] backdrop-blur-xl border border-white/15 shadow-[0_8px_30px_-8px_rgba(126,95,255,0.5)]">
            <span className="text-lg">⚡</span>
            <div className="leading-tight">
              <p className="text-[10px] font-semibold text-white/60 uppercase tracking-wider">Fast</p>
              <p className="text-xs font-bold text-white">2 minute setup</p>
            </div>
          </div>
        </div>

        <div
          className="absolute top-[42%] left-[8%] z-30 animate-fade-up"
          style={{
            animationDelay: "0.7s",
            transform: `translate3d(${mouse.x * 14}px, ${mouse.y * -10}px, 0)`,
          }}
        >
          <div className="flex items-center gap-2 px-3 py-2 rounded-2xl bg-gradient-to-br from-[#7E5FFF]/30 to-[#5b3dff]/20 backdrop-blur-xl border border-white/15 shadow-[0_8px_30px_-8px_rgba(126,95,255,0.7)]">
            <span className="text-lg">🎓</span>
            <div className="leading-tight">
              <p className="text-[10px] font-semibold text-white/60 uppercase tracking-wider">Members only</p>
              <p className="text-xs font-bold text-white">FOSTIIMA org</p>
            </div>
          </div>
        </div>

        <div
          className="absolute bottom-[16%] right-[14%] z-30 animate-fade-up"
          style={{
            animationDelay: "1s",
            transform: `translate3d(${mouse.x * -10}px, ${mouse.y * -12}px, 0)`,
          }}
        >
          <div className="flex items-center gap-2 px-3 py-2 rounded-2xl bg-white/[0.08] backdrop-blur-xl border border-white/15 shadow-[0_8px_30px_-8px_rgba(176,158,228,0.5)]">
            <span className="text-lg">🛡️</span>
            <div className="leading-tight">
              <p className="text-[10px] font-semibold text-white/60 uppercase tracking-wider">Private</p>
              <p className="text-xs font-bold text-white">Your data stays safe</p>
            </div>
          </div>
        </div>

        {/* Layer 7: illustration */}
        <div
          className="relative z-30 px-6 animate-fade-up"
          style={{
            transform: `translate3d(${mouse.x * 8}px, ${mouse.y * 8}px, 0)`,
          }}
        >
          <div className="relative">
            <div className="absolute inset-0 bg-[#7E5FFF]/40 blur-3xl rounded-full scale-90" />
            <Image
              src="/images/sign-up-Vector.svg"
              alt="Signup Illustration"
              width={400}
              height={400}
              className="relative max-w-full h-auto drop-shadow-[0_20px_50px_rgba(126,95,255,0.4)]"
              priority
            />
          </div>
        </div>

        {/* Layer 8: logo */}
        <div className="absolute top-7 left-8 flex items-center gap-3 z-40 animate-fade-up" style={{ animationDelay: "0.2s" }}>
          <div className="relative">
            <div className="absolute inset-0 bg-[#7E5FFF]/60 blur-lg rounded-full" />
            <Image
              src="/images/Transparent logo.png"
              alt="Logo"
              width={65}
              height={65}
              className="relative drop-shadow-lg"
            />
          </div>
          <div className="flex flex-col leading-tight">
            <span className="text-base font-extrabold tracking-wider text-white">
              FC Voting System
            </span>
            <span className="text-sm font-medium text-white/60">
              FOSTIIMA Chapter
            </span>
          </div>
        </div>

        {/* Layer 9: floating particles */}
        <div className="absolute top-1/4 right-1/4 w-1.5 h-1.5 bg-white/60 rounded-full animate-float-slow z-30 shadow-[0_0_12px_rgba(255,255,255,0.8)]" />
        <div className="absolute bottom-1/3 left-1/4 w-2 h-2 bg-[#B09EE4]/80 rounded-full animate-float-slower z-30 shadow-[0_0_16px_rgba(176,158,228,0.9)]" />
        <div className="absolute top-1/2 left-1/3 w-1 h-1 bg-white/70 rounded-full animate-float-slow z-30 shadow-[0_0_8px_rgba(255,255,255,0.9)]" />
        <div className="absolute top-1/5 left-1/5 w-1.5 h-1.5 bg-[#7E5FFF]/80 rounded-full animate-float-slower z-30 shadow-[0_0_12px_rgba(126,95,255,0.9)]" />
        <div className="absolute bottom-1/5 right-1/3 w-2 h-2 bg-white/50 rounded-full animate-float-slow z-30 shadow-[0_0_14px_rgba(255,255,255,0.7)]" />
      </div>

      {/* ───────── Form panel ───────── */}
      <div
        className={`relative z-20 w-full md:w-1/2 flex justify-center items-start md:items-center px-6 sm:px-10 lg:px-14 py-6 md:py-8 transition-all duration-1000 ease-[cubic-bezier(0.22,1,0.36,1)] ${
          animatePanel ? "opacity-100 translate-x-0" : "opacity-0 translate-x-12"
        } md:h-full overflow-y-auto`}
      >
        <div className="w-full max-w-md my-auto">
          <div className="relative rounded-3xl p-6 sm:p-8 bg-white/60 dark:bg-white/[0.03] backdrop-blur-2xl border border-white/70 dark:border-white/10 shadow-[0_20px_60px_-20px_rgba(99,86,215,0.25)] dark:shadow-[0_20px_60px_-20px_rgba(0,0,0,0.8)]">
            <div className="absolute inset-x-8 -top-px h-px bg-gradient-to-r from-transparent via-[#7E5FFF]/60 to-transparent" />

            <form onSubmit={handleSubmit} className="space-y-3.5" autoComplete="on">
              {/* Header */}
              <div className="mb-1">
                <div className="inline-flex items-center gap-2 mb-2 px-3 py-1 rounded-full bg-[#6356D7]/10 dark:bg-[#6356D7]/25 border border-[#6356D7]/25 backdrop-blur-sm">
                  <span className="relative flex w-2 h-2">
                    <span className="absolute inline-flex h-full w-full rounded-full bg-[#6356D7] opacity-75 animate-ping" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-[#6356D7] dark:bg-[#9b8fff]" />
                  </span>
                  <span className="text-xs font-semibold text-[#6356D7] dark:text-[#b3a6ff] tracking-wide">
                    Get started
                  </span>
                </div>

                <h1 className="text-2xl sm:text-[1.75rem] font-bold leading-tight text-gray-900 dark:text-white">
                  Create your{" "}
                  <span className="bg-gradient-to-r from-[#6356D7] via-[#7E5FFF] to-[#a385ff] bg-clip-text text-transparent">
                    account
                  </span>
                </h1>

                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1.5">
                  Already have an account?{" "}
                  <button
                    type="button"
                    onClick={() => router.push("/auth/signin")}
                    className="text-[#6356D7] dark:text-[#b3a6ff] font-semibold hover:underline decoration-2 underline-offset-4"
                  >
                    Sign In here.
                  </button>
                </p>
              </div>

              {/* Error */}
              {error && (
                <div className="bg-red-50/90 dark:bg-red-900/25 backdrop-blur-sm border-l-4 border-red-500 text-red-700 dark:text-red-300 p-3 rounded-lg flex items-center gap-2 text-sm animate-shake">
                  <span>❌</span>
                  <span className="flex-1 font-medium">{error}</span>
                  <button
                    onClick={() => setError("")}
                    className="text-red-500 hover:text-red-700 dark:hover:text-red-200"
                    aria-label="Dismiss error"
                  >
                    ✕
                  </button>
                </div>
              )}

              {/* Success */}
              {success && (
                <div className="bg-green-50/90 dark:bg-green-900/25 backdrop-blur-sm border-l-4 border-green-500 text-green-700 dark:text-green-300 p-3 rounded-lg flex items-center gap-2 text-sm animate-slide-down">
                  <span>✅</span>
                  <span className="flex-1 font-medium">{success}</span>
                </div>
              )}

              {/* Name + PGP */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="relative">
                  <input
                    type="text"
                    name="name"
                    autoComplete="name"
                    placeholder="Full Name"
                    ref={nameRef}
                    required
                    onFocus={() => setFocusedField("name")}
                    onBlur={() => setFocusedField(null)}
                    className="peer w-full px-4 pt-6 pb-2 border-2 border-[#6356D7]/15 dark:border-white/10 rounded-2xl text-sm bg-white/80 dark:bg-white/[0.03] backdrop-blur-sm text-gray-900 dark:text-gray-100 placeholder-transparent focus:outline-none focus:border-[#7E5FFF] focus:bg-white dark:focus:bg-white/[0.06] focus:shadow-[0_0_0_4px_rgba(126,95,255,0.15)] transition-all duration-300"
                  />
                  <label
                    className={`absolute left-4 transition-all duration-200 pointer-events-none ${
                      focusedField === "name" || nameRef.current?.value
                        ? "top-2 text-[10px] font-semibold uppercase tracking-wider text-[#6356D7] dark:text-[#b3a6ff]"
                        : "top-1/2 -translate-y-1/2 text-sm text-gray-500 dark:text-gray-400"
                    }`}
                  >
                    Full Name *
                  </label>
                </div>
                <div className="relative">
                  <input
                    type="text"
                    name="pgp"
                    placeholder="PGP"
                    ref={pgpRef}
                    onFocus={() => setFocusedField("pgp")}
                    onBlur={() => setFocusedField(null)}
                    className="peer w-full px-4 pt-6 pb-2 border-2 border-[#6356D7]/15 dark:border-white/10 rounded-2xl text-sm bg-white/80 dark:bg-white/[0.03] backdrop-blur-sm text-gray-900 dark:text-gray-100 placeholder-transparent focus:outline-none focus:border-[#7E5FFF] focus:bg-white dark:focus:bg-white/[0.06] focus:shadow-[0_0_0_4px_rgba(126,95,255,0.15)] transition-all duration-300"
                  />
                  <label
                    className={`absolute left-4 transition-all duration-200 pointer-events-none ${
                      focusedField === "pgp" || pgpRef.current?.value
                        ? "top-2 text-[10px] font-semibold uppercase tracking-wider text-[#6356D7] dark:text-[#b3a6ff]"
                        : "top-1/2 -translate-y-1/2 text-sm text-gray-500 dark:text-gray-400"
                    }`}
                  >
                    PGP (optional)
                  </label>
                </div>
              </div>

              {/* Section */}
              <div className="relative">
                <input
                  type="text"
                  name="section"
                  placeholder="Section"
                  ref={sectionRef}
                  onFocus={() => setFocusedField("section")}
                  onBlur={() => setFocusedField(null)}
                  className="peer w-full px-4 pt-6 pb-2 border-2 border-[#6356D7]/15 dark:border-white/10 rounded-2xl text-sm bg-white/80 dark:bg-white/[0.03] backdrop-blur-sm text-gray-900 dark:text-gray-100 placeholder-transparent focus:outline-none focus:border-[#7E5FFF] focus:bg-white dark:focus:bg-white/[0.06] focus:shadow-[0_0_0_4px_rgba(126,95,255,0.15)] transition-all duration-300"
                />
                <label
                  className={`absolute left-4 transition-all duration-200 pointer-events-none ${
                    focusedField === "section" || sectionRef.current?.value
                      ? "top-2 text-[10px] font-semibold uppercase tracking-wider text-[#6356D7] dark:text-[#b3a6ff]"
                      : "top-1/2 -translate-y-1/2 text-sm text-gray-500 dark:text-gray-400"
                  }`}
                >
                  Section (optional)
                </label>
              </div>

              {/* Email */}
              <div className="relative">
                <input
                  type="email"
                  name="email"
                  autoComplete="email"
                  placeholder="Email"
                  ref={emailRef}
                  required
                  onFocus={() => setFocusedField("email")}
                  onBlur={() => setFocusedField(null)}
                  className="peer w-full px-4 pt-6 pb-2 border-2 border-[#6356D7]/15 dark:border-white/10 rounded-2xl text-sm bg-white/80 dark:bg-white/[0.03] backdrop-blur-sm text-gray-900 dark:text-gray-100 placeholder-transparent focus:outline-none focus:border-[#7E5FFF] focus:bg-white dark:focus:bg-white/[0.06] focus:shadow-[0_0_0_4px_rgba(126,95,255,0.15)] transition-all duration-300"
                />
                <label
                  className={`absolute left-4 transition-all duration-200 pointer-events-none ${
                    focusedField === "email" || emailRef.current?.value
                      ? "top-2 text-[10px] font-semibold uppercase tracking-wider text-[#6356D7] dark:text-[#b3a6ff]"
                      : "top-1/2 -translate-y-1/2 text-sm text-gray-500 dark:text-gray-400"
                  }`}
                >
                  Email Address *
                </label>
              </div>

              {/* Password + Confirm */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    name="new-password"
                    autoComplete="new-password"
                    placeholder="Password"
                    ref={passwordRef}
                    required
                    minLength={6}
                    onFocus={() => setFocusedField("password")}
                    onBlur={() => setFocusedField(null)}
                    className="peer w-full px-4 pt-6 pb-2 pr-10 border-2 border-[#6356D7]/15 dark:border-white/10 rounded-2xl text-sm bg-white/80 dark:bg-white/[0.03] backdrop-blur-sm text-gray-900 dark:text-gray-100 placeholder-transparent focus:outline-none focus:border-[#7E5FFF] focus:bg-white dark:focus:bg-white/[0.06] focus:shadow-[0_0_0_4px_rgba(126,95,255,0.15)] transition-all duration-300"
                  />
                  <label
                    className={`absolute left-4 transition-all duration-200 pointer-events-none ${
                      focusedField === "password" || passwordRef.current?.value
                        ? "top-2 text-[10px] font-semibold uppercase tracking-wider text-[#6356D7] dark:text-[#b3a6ff]"
                        : "top-1/2 -translate-y-1/2 text-sm text-gray-500 dark:text-gray-400"
                    }`}
                  >
                    Password *
                  </label>
                  <button
                    type="button"
                    onClick={togglePassword}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-[#6356D7] dark:hover:text-[#9b8fff] transition-all hover:scale-110"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    <span className="text-base">{showPassword ? "🙈" : "👁️"}</span>
                  </button>
                </div>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    name="confirm-password"
                    autoComplete="new-password"
                    placeholder="Confirm"
                    ref={confirmPasswordRef}
                    required
                    minLength={6}
                    onFocus={() => setFocusedField("confirm")}
                    onBlur={() => setFocusedField(null)}
                    className="peer w-full px-4 pt-6 pb-2 pr-10 border-2 border-[#6356D7]/15 dark:border-white/10 rounded-2xl text-sm bg-white/80 dark:bg-white/[0.03] backdrop-blur-sm text-gray-900 dark:text-gray-100 placeholder-transparent focus:outline-none focus:border-[#7E5FFF] focus:bg-white dark:focus:bg-white/[0.06] focus:shadow-[0_0_0_4px_rgba(126,95,255,0.15)] transition-all duration-300"
                  />
                  <label
                    className={`absolute left-4 transition-all duration-200 pointer-events-none ${
                      focusedField === "confirm" || confirmPasswordRef.current?.value
                        ? "top-2 text-[10px] font-semibold uppercase tracking-wider text-[#6356D7] dark:text-[#b3a6ff]"
                        : "top-1/2 -translate-y-1/2 text-sm text-gray-500 dark:text-gray-400"
                    }`}
                  >
                    Confirm *
                  </label>
                  <button
                    type="button"
                    onClick={toggleConfirm}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-[#6356D7] dark:hover:text-[#9b8fff] transition-all hover:scale-110"
                    aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                  >
                    <span className="text-base">{showConfirmPassword ? "🙈" : "👁️"}</span>
                  </button>
                </div>
              </div>

              {/* Remember */}
              <label className="flex items-center space-x-2 text-xs cursor-pointer group">
                <input
                  type="checkbox"
                  className="w-3.5 h-3.5 accent-[#6356D7] rounded border-gray-300 focus:ring-[#6356D7] transition-all duration-200 group-hover:scale-110"
                />
                <span className="font-medium text-gray-700 dark:text-gray-300 group-hover:text-[#6356D7] dark:group-hover:text-[#b3a6ff] transition-colors duration-200">
                  Remember Me
                </span>
              </label>

              {/* Submit */}
              <button
                type="submit"
                disabled={loading}
                className="relative group w-full overflow-hidden rounded-2xl transition-transform duration-200 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed"
              >
                <div className="absolute -inset-0.5 bg-gradient-to-r from-[#6356D7] via-[#7E5FFF] to-[#a385ff] rounded-2xl blur-lg opacity-60 group-hover:opacity-90 transition-all duration-300" />
                <div className="relative w-full py-3.5 bg-gradient-to-r from-[#6356D7] via-[#7E5FFF] to-[#6356D7] bg-[length:200%_100%] group-hover:bg-[position:100%_0] text-white rounded-2xl font-semibold text-sm transition-[background-position] duration-700 ease-out shadow-lg">
                  <div className="absolute inset-x-0 top-0 h-px bg-white/40 rounded-t-2xl" />
                  <span className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-out bg-gradient-to-r from-transparent via-white/30 to-transparent" />
                  <span className="relative z-10 flex items-center justify-center gap-2">
                    {loading ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        <span>Creating Account...</span>
                      </>
                    ) : (
                      "Sign Up"
                    )}
                  </span>
                </div>
              </button>

              {/* Compact info row — refined */}
              <div className="grid grid-cols-1 gap-2 pt-1">
                <div className="relative overflow-hidden bg-gradient-to-br from-[#F1ECFF]/90 to-[#E5DEFF]/70 dark:from-[#1a1533]/80 dark:to-[#241a4d]/60 p-3 rounded-2xl border border-[#B8AAFF]/60 dark:border-[#3a2d6b]/60 text-xs backdrop-blur-sm">
                  <div className="absolute -top-6 -right-6 w-20 h-20 rounded-full bg-[#7E5FFF]/20 blur-2xl" />
                  <p className="relative font-semibold text-[#313053] dark:text-[#c4b8ff] mb-1 flex items-center gap-2">
                    <span>📧</span> Email Requirements
                  </p>
                  <p className="relative text-gray-600 dark:text-gray-400">
                    Must use{" "}
                    <span className="font-mono font-semibold text-[#6356D7] dark:text-[#b3a6ff]">
                      @fostiima.org
                    </span>{" "}
                    email
                  </p>
                </div>
                <div className="relative overflow-hidden bg-gradient-to-br from-blue-50/90 to-indigo-50/70 dark:from-[#0f1533]/80 dark:to-[#131a3d]/60 p-3 rounded-2xl border border-blue-200/60 dark:border-blue-900/40 text-xs backdrop-blur-sm">
                  <div className="absolute -top-6 -right-6 w-20 h-20 rounded-full bg-blue-400/20 blur-2xl" />
                  <p className="relative font-semibold text-[#313053] dark:text-[#8fb4ff] mb-1 flex items-center gap-2">
                    <span>📚</span> PGP & Section (Optional)
                  </p>
                  <p className="relative text-gray-600 dark:text-gray-400">
                    Helps analyze voting patterns across different groups
                  </p>
                </div>
              </div>

              {/* Mobile sign-in link */}
              <div className="md:hidden text-center text-xs text-gray-600 dark:text-gray-400 pb-2">
                Already have an account?{" "}
                <button
                  type="button"
                  onClick={() => router.push("/auth/signin")}
                  className="text-[#6356D7] dark:text-[#9b8fff] font-semibold hover:underline"
                >
                  Sign In
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>

      {/* Animations */}
      <style jsx>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          10%, 30%, 50%, 70%, 90% { transform: translateX(-3px); }
          20%, 40%, 60%, 80% { transform: translateX(3px); }
        }
        .animate-shake { animation: shake 0.5s ease-in-out; }

        @keyframes slideDown {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-slide-down { animation: slideDown 0.3s ease-out; }

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

        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(24px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-up {
          animation: fadeUp 1s cubic-bezier(0.22, 1, 0.36, 1) both;
          will-change: opacity, transform;
        }
      `}</style>
    </div>
  )
}
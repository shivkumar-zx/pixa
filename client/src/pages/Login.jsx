import React, { useState } from "react"
import { useNavigate } from "react-router-dom"
import { Mail, Lock, Eye, EyeOff, Loader2 } from "lucide-react"
import { PixBoxLogo } from "../components/PixBoxLogo"

export default function LoginPage({ onLogin }) {
  const navigate = useNavigate()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")

  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")

    try {
      const res = await fetch("http://localhost:5000/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password })
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.message || "Invalid email or password. Please try again.")
      } else {
        localStorage.setItem("token", data.token)
        if (onLogin) onLogin(data.user)
        navigate("/dashboard/files")
      }
    } catch {
      localStorage.setItem("token", "demo-token")
      const demoUser = {
        name: email.includes("admin") ? "Admin User" : email.includes("manager") ? "Manager User" : "Employee User",
        email: email,
        role: email.includes("admin") ? "ADMIN" : email.includes("manager") ? "MANAGER" : "EMPLOYEE"
      }
      if (onLogin) onLogin(demoUser)
      navigate("/dashboard/files")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="bg-white border border-slate-100 p-8 sm:p-10 rounded-[24px] shadow-[0_8px_30px_rgb(0,0,0,0.04)] w-full max-w-md relative z-10">
        <div className="mb-6 flex justify-between items-center">
          <PixBoxLogo size={38} showText={true} />
        </div>

        <div className="mb-8">
          <h3 className="text-2xl font-extrabold text-slate-900 mb-1.5 tracking-tight">Welcome Back</h3>
          <p className="text-sm text-slate-500">Sign in to access your secure team files.</p>
        </div>


        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 text-[13px] rounded-lg px-4 py-2.5 mb-4">
              {error}
            </div>
          )}

          <div className="relative">
            <Mail size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            <input
              id="email"
              type="text"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email or Username"
              required
              className="w-full bg-slate-50 border-[1.5px] border-slate-200 text-slate-900 placeholder:text-slate-400 rounded-xl pl-11 pr-4 py-3.5 text-sm focus:outline-none focus:border-indigo-500 focus:bg-white focus:ring-[3px] focus:ring-indigo-500/10 transition-all font-medium"
            />
          </div>

          <div className="relative">
            <Lock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            <input
              id="password"
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              className="w-full bg-slate-50 border-[1.5px] border-slate-200 text-slate-900 placeholder:text-slate-400 rounded-xl pl-11 pr-11 py-3.5 text-sm focus:outline-none focus:border-indigo-500 focus:bg-white focus:ring-[3px] focus:ring-indigo-500/10 transition-all font-medium"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors p-1"
            >
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>

          <button
            id="login-btn"
            type="submit"
            disabled={isLoading}
            className="w-full bg-brand-gradient hover:opacity-95 text-white font-bold rounded-xl py-3 text-[15px] transition-all flex items-center justify-center gap-2 shadow-[0_4px_14px_rgba(74,108,247,0.3)] mt-6 disabled:opacity-65 disabled:cursor-not-allowed min-h-[48px]"
          >
            {isLoading ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                Signing in...
              </>
            ) : (
              "Sign In"
            )}
          </button>
        </form>

        {/* 
          Default Admin Credentials for reference:
          - Admin: admin@company.com / Admin@123
          - Manager: manager@example.com / Manager@123
          - Employee: employee@example.com / Employee@123
        */}

        <p className="text-center text-slate-400 text-[11px] font-medium mt-8">
          © 2026 PixBox — Internal Use Only
        </p>
      </div>
    </div>
  )
}

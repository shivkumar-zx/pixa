"use client"

import { useState } from "react"
import { signIn } from "next-auth/react"
import { useRouter } from "next/navigation"
import { Vault, Mail, Lock, Eye, EyeOff, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")

    try {
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      })

      if (result?.error) {
        setError("Invalid email or password. Please try again.")
      } else {
        router.push("/dashboard/files")
        router.refresh()
      }
    } catch {
      setError("Something went wrong. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="bg-white border border-slate-100 p-8 sm:p-10 rounded-[24px] shadow-[0_8px_30px_rgb(0,0,0,0.04)] w-full relative z-10">
      <div className="mb-8">
        <h3 className="text-2xl font-extrabold text-slate-900 mb-1.5 tracking-tight">Welcome Back</h3>
        <p className="text-sm text-slate-500">Sign in to access your secure files.</p>
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
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@company.com"
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

      <div className="mt-8 pt-6 border-t border-slate-200">
        <p className="text-[12px] font-semibold text-slate-400 uppercase tracking-wider text-center mb-4">Demo Credentials</p>
        <div className="grid grid-cols-1 gap-2.5">
          {[
            { role: "Admin", email: "admin@company.com", password: "Admin@123" },
            { role: "Manager", email: "manager@example.com", password: "Manager@123" },
            { role: "Employee", email: "employee@example.com", password: "Employee@123" },
          ].map((cred) => (
            <button
              key={cred.role}
              type="button"
              onClick={() => { setEmail(cred.email); setPassword(cred.password) }}
              className="text-left bg-white hover:bg-slate-50 border-[1.5px] border-slate-100 hover:border-slate-200 rounded-xl px-4 py-2.5 transition-all group flex items-center justify-between"
            >
              <div>
                <span className="text-[13px] font-bold text-slate-700">{cred.role}</span>
                <p className="text-[12px] text-slate-500 font-medium">{cred.email}</p>
              </div>
              <div className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-slate-500"><polyline points="9 18 15 12 9 6"></polyline></svg>
              </div>
            </button>
          ))}
        </div>
      </div>
      
      <p className="text-center text-slate-400 text-[11px] font-medium mt-8">
        © 2026 EmpVault — Internal Use Only
      </p>
    </div>
  )
}

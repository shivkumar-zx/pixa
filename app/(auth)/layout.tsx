import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Login – EmpVault",
  description: "Sign in to your EmpVault account",
}

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-slate-50">
      {/* Left side: Branding (hidden on mobile) */}
      <div className="hidden lg:flex flex-1 bg-brand-gradient items-center justify-center p-12 relative overflow-hidden text-white">
        {/* Decorative circles */}
        <div className="absolute top-[-100px] right-[-100px] w-[400px] h-[400px] rounded-full bg-white/10" />
        <div className="absolute bottom-[-80px] left-[-80px] w-[300px] h-[300px] rounded-full bg-white/10" />
        
        <div className="max-w-[480px] relative z-10">
          <div className="flex items-center gap-3 bg-white p-2 pr-4 rounded-xl mb-8 w-fit shadow-lg">
            <div className="w-12 h-12 bg-indigo-50/20 backdrop-blur-sm rounded-lg flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-indigo-600"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><path d="M8 12h8"/><path d="M12 8v8"/></svg>
            </div>
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">EmpVault</h1>
          </div>
          <h2 className="text-4xl font-extrabold mb-4 leading-tight">Secure internal file management for your team.</h2>
          <p className="text-lg text-white/90">Access and share employee resources, guidelines, and media securely from anywhere.</p>
        </div>
      </div>

      {/* Right side: Login form */}
      <div className="flex-1 flex items-center justify-center p-6 bg-slate-50">
        <div className="w-full max-w-[420px]">
          {children}
        </div>
      </div>
    </div>
  )
}

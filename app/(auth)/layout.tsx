import type { Metadata } from "next"
import { PixBoxLogo } from "@/components/pixbox-logo"

export const metadata: Metadata = {
  title: "Login – PixBox",
  description: "Sign in to your PixBox account",
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
          <div className="bg-white/95 backdrop-blur-md p-3 pr-6 rounded-2xl mb-8 w-fit shadow-xl border border-white/20">
            <PixBoxLogo size={42} showText={true} />
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


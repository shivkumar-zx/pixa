import * as React from "react"
import { X } from "lucide-react"
import { cn } from "../../lib/utils"

function Dialog({ open, onOpenChange, children }) {
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-in fade-in-0">
      <div 
        className="fixed inset-0" 
        onClick={() => onOpenChange && onOpenChange(false)}
      />
      <div className="relative z-50 w-full max-w-lg rounded-xl bg-card p-6 shadow-xl border border-border">
        {children}
      </div>
    </div>
  )
}

function DialogContent({ children, className }) {
  return <div className={cn("space-y-4", className)}>{children}</div>
}

function DialogHeader({ children, className }) {
  return <div className={cn("flex flex-col space-y-1.5 text-left", className)}>{children}</div>
}

function DialogTitle({ children, className }) {
  return <h2 className={cn("text-lg font-semibold leading-none tracking-tight", className)}>{children}</h2>
}

function DialogDescription({ children, className }) {
  return <p className={cn("text-sm text-muted-foreground", className)}>{children}</p>
}

function DialogFooter({ children, className }) {
  return <div className={cn("flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2 pt-4", className)}>{children}</div>
}

export {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
}

"use client"

import { useRouter, useSearchParams } from "next/navigation"
import { Search, Grid, List, FolderOpen, X, CalendarIcon } from "lucide-react"
import { useState, useEffect } from "react"
import { Input } from "@/components/ui/input"

import { motion, AnimatePresence } from "framer-motion"

export default function FileFilters() {
  const router = useRouter()
  const searchParams = useSearchParams()
  
  const currentQ = searchParams.get("q") || ""
  const currentType = searchParams.get("type") || "All"
  const currentView = searchParams.get("view") || "grid"
  const currentCategory = searchParams.get("category") || ""
  const currentYear = searchParams.get("year") || ""
  const currentMonth = searchParams.get("month") || ""
  const currentDay = searchParams.get("day") || ""
  const [search, setSearch] = useState(currentQ)

  const currentYearNum = new Date().getFullYear()
  const years = Array.from({ length: 10 }, (_, i) => currentYearNum - 5 + i)
  const months = [
    { value: "01", label: "Jan" }, { value: "02", label: "Feb" }, { value: "03", label: "Mar" },
    { value: "04", label: "Apr" }, { value: "05", label: "May" }, { value: "06", label: "Jun" },
    { value: "07", label: "Jul" }, { value: "08", label: "Aug" }, { value: "09", label: "Sep" },
    { value: "10", label: "Oct" }, { value: "11", label: "Nov" }, { value: "12", label: "Dec" }
  ]
  const days = Array.from({ length: 31 }, (_, i) => (i + 1).toString().padStart(2, '0'))


  const updateParams = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString())
    if (value && value !== "All") {
      params.set(key, value)
    } else {
      params.delete(key)
    }
    router.push(`?${params.toString()}`)
  }

  return (
    <div className="space-y-3">
      {/* Active folder filter */}
      {currentCategory && (
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-primary/10 text-primary border border-primary/20 rounded-full text-xs font-medium">
            <FolderOpen size={12} />
            Filtering by folder
            <button
              onClick={() => updateParams("category", "")}
              className="ml-1 hover:text-destructive transition-colors"
              title="Clear folder filter"
            >
              <X size={11} />
            </button>
          </div>
        </div>
      )}
      <div className="flex items-center gap-3 flex-wrap flex-1">
        <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800/50 p-1 rounded-full relative">
          {["All", "Images", "Videos", "Documents"].map((filter) => {
            const isActive = currentType === filter
            return (
              <button
                key={filter}
                onClick={() => updateParams("type", filter)}
                className={`relative px-4 py-1.5 rounded-full text-sm font-medium transition-colors z-10 ${
                  isActive
                    ? "text-slate-900 dark:text-slate-100"
                    : "text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-300"
                }`}
              >
                {isActive && (
                  <motion.div
                    layoutId="active-filter-pill"
                    className="absolute inset-0 bg-white dark:bg-slate-700 rounded-full shadow-sm"
                    transition={{ type: "spring", bounce: 0.2, duration: 0.5 }}
                    style={{ zIndex: -1 }}
                  />
                )}
                {filter}
              </button>
            )
          })}
        </div>
      </div>
      
      <div className="flex items-center justify-start gap-3">
        <div className="flex items-center gap-1 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-1 relative">
          {[
            { id: "grid", icon: Grid, title: "Grid View" },
            { id: "list", icon: List, title: "List View" }
          ].map((view) => {
            const isActive = currentView === view.id
            const Icon = view.icon
            return (
              <button 
                key={view.id}
                onClick={() => updateParams("view", view.id)}
                className={`relative p-1.5 rounded-md transition-colors z-10 ${isActive ? "text-slate-900 dark:text-slate-100" : "text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-300"}`}
                title={view.title}
              >
                {isActive && (
                  <motion.div
                    layoutId="active-view-pill"
                    className="absolute inset-0 bg-white dark:bg-slate-800 rounded-md shadow-sm border border-slate-200/50 dark:border-slate-700/50"
                    transition={{ type: "spring", bounce: 0.2, duration: 0.5 }}
                    style={{ zIndex: -1 }}
                  />
                )}
                <Icon size={16} />
              </button>
            )
          })}
        </div>

        <div className="flex items-center gap-2 pr-1 bg-card border border-border rounded-lg p-1">
          <select
            value={currentYear}
            onChange={(e) => {
              const val = e.target.value;
              const params = new URLSearchParams(searchParams.toString())
              if (val) {
                params.set("year", val)
              } else {
                params.delete("year")
                params.delete("month")
                params.delete("day")
              }
              router.push(`?${params.toString()}`)
            }}
            className="h-7 pl-2 text-xs rounded-md border-0 bg-transparent text-foreground focus:outline-none focus:ring-0 cursor-pointer"
          >
            <option value="" className="bg-card text-foreground">Year</option>
            {years.map(y => <option key={y} value={y} className="bg-card text-foreground">{y}</option>)}
          </select>

          <AnimatePresence>
            {currentYear && (
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.2 }}
              >
                <select
                  value={currentMonth}
                  onChange={(e) => {
                    const val = e.target.value;
                    const params = new URLSearchParams(searchParams.toString())
                    if (val) {
                      params.set("month", val)
                    } else {
                      params.delete("month")
                      params.delete("day")
                    }
                    router.push(`?${params.toString()}`)
                  }}
                  className="h-7 pl-2 text-xs rounded-md border-0 bg-transparent text-foreground focus:outline-none focus:ring-0 cursor-pointer"
                >
                  <option value="" className="bg-card text-foreground">Month</option>
                  {months.map(m => <option key={m.value} value={m.value} className="bg-card text-foreground">{m.label}</option>)}
                </select>
              </motion.div>
            )}

            {currentYear && currentMonth && (
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.2 }}
              >
                <select
                  value={currentDay}
                  onChange={(e) => updateParams("day", e.target.value)}
                  className="h-7 pl-2 text-xs rounded-md border-0 bg-transparent text-foreground focus:outline-none focus:ring-0 cursor-pointer"
                >
                  <option value="" className="bg-card text-foreground">Day</option>
                  {days.map(d => <option key={d} value={d} className="bg-card text-foreground">{d}</option>)}
                </select>
              </motion.div>
            )}

            {(currentYear || currentMonth || currentDay) && (
              <motion.button 
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.5 }}
                transition={{ duration: 0.2 }}
                onClick={() => {
                  const params = new URLSearchParams(searchParams.toString())
                  params.delete("year")
                  params.delete("month")
                  params.delete("day")
                  router.push(`?${params.toString()}`)
                }}
                className="text-muted-foreground hover:text-destructive p-1 rounded-md transition-colors ml-1"
                title="Clear date filters"
              >
                <X size={14} />
              </motion.button>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  )
}

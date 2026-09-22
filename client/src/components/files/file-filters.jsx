import React from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Grid, List, X } from "lucide-react"

export function FileFilters({ 
  currentType = "All", 
  onTypeChange, 
  viewMode = "grid", 
  onViewChange,
  year = "",
  month = "",
  day = "",
  onDateChange
}) {
  const currentYearNum = new Date().getFullYear()
  const years = Array.from({ length: 10 }, (_, i) => currentYearNum - 5 + i)
  const months = [
    { value: "01", label: "Jan" }, { value: "02", label: "Feb" }, { value: "03", label: "Mar" },
    { value: "04", label: "Apr" }, { value: "05", label: "May" }, { value: "06", label: "Jun" },
    { value: "07", label: "Jul" }, { value: "08", label: "Aug" }, { value: "09", label: "Sep" },
    { value: "10", label: "Oct" }, { value: "11", label: "Nov" }, { value: "12", label: "Dec" }
  ]
  const days = Array.from({ length: 31 }, (_, i) => (i + 1).toString().padStart(2, '0'))

  return (
    <div className="space-y-4 w-full">
      {/* Row 1: Apple Liquid Glass Navigation Pill Bar */}
      <div className="flex items-center gap-1 bg-slate-100/90 dark:bg-slate-800/80 p-1.5 rounded-full relative w-fit shadow-2xs border border-slate-200/70 dark:border-slate-700/70">
        {["All", "Images", "Videos", "Documents"].map((filter) => {
          const isActive = currentType === filter
          return (
            <button
              key={filter}
              onClick={() => onTypeChange && onTypeChange(filter)}
              className={`relative px-5 py-1.5 rounded-full text-sm font-semibold transition-colors z-10 select-none ${
                isActive
                  ? "text-slate-900 dark:text-slate-100 font-bold"
                  : "text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200 font-medium"
              }`}
            >
              {isActive && (
                <motion.div
                  layoutId="active-filter-pill"
                  className="absolute inset-0 bg-white dark:bg-slate-700 rounded-full shadow-xs border border-slate-200/50 dark:border-slate-600/50"
                  transition={{ type: "spring", bounce: 0.2, duration: 0.4 }}
                  style={{ zIndex: -1 }}
                />
              )}
              {filter}
            </button>
          )
        })}
      </div>

      {/* Row 2: Grid/List Toggle & Year Dropdown */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1 bg-slate-100/90 dark:bg-slate-800/80 border border-slate-200/70 dark:border-slate-700/70 rounded-xl p-1 relative shadow-2xs">
          {[
            { id: "grid", icon: Grid, title: "Grid View" },
            { id: "list", icon: List, title: "List View" }
          ].map((view) => {
            const isActive = viewMode === view.id
            const Icon = view.icon
            return (
              <button 
                key={view.id}
                onClick={() => onViewChange && onViewChange(view.id)}
                className={`relative p-1.5 rounded-lg transition-colors z-10 ${isActive ? "text-slate-900 dark:text-slate-100" : "text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200"}`}
                title={view.title}
              >
                {isActive && (
                  <motion.div
                    layoutId="active-view-pill"
                    className="absolute inset-0 bg-white dark:bg-slate-700 rounded-lg shadow-xs border border-slate-200/50 dark:border-slate-600/50"
                    transition={{ type: "spring", bounce: 0.2, duration: 0.4 }}
                    style={{ zIndex: -1 }}
                  />
                )}
                <Icon size={16} />
              </button>
            )
          })}
        </div>

        <div className="flex items-center gap-2 pr-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-1.5 shadow-2xs">
          <select
            value={year}
            onChange={(e) => onDateChange && onDateChange({ year: e.target.value, month: "", day: "" })}
            className="h-7 pl-2.5 pr-2 text-xs font-semibold rounded-md border-0 bg-transparent text-slate-800 dark:text-slate-200 focus:outline-none cursor-pointer"
          >
            <option value="" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100">Year</option>
            {years.map(y => <option key={y} value={y} className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100">{y}</option>)}
          </select>

          <AnimatePresence>
            {year && (
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.2 }}
              >
                <select
                  value={month}
                  onChange={(e) => onDateChange && onDateChange({ year, month: e.target.value, day: "" })}
                  className="h-7 pl-2 text-xs font-semibold rounded-md border-0 bg-transparent text-slate-800 dark:text-slate-200 focus:outline-none cursor-pointer"
                >
                  <option value="" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100">Month</option>
                  {months.map(m => <option key={m.value} value={m.value} className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100">{m.label}</option>)}
                </select>
              </motion.div>
            )}

            {year && month && (
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.2 }}
              >
                <select
                  value={day}
                  onChange={(e) => onDateChange && onDateChange({ year, month, day: e.target.value })}
                  className="h-7 pl-2 text-xs font-semibold rounded-md border-0 bg-transparent text-slate-800 dark:text-slate-200 focus:outline-none cursor-pointer"
                >
                  <option value="" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100">Day</option>
                  {days.map(d => <option key={d} value={d} className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100">{d}</option>)}
                </select>
              </motion.div>
            )}

            {(year || month || day) && (
              <motion.button 
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.5 }}
                transition={{ duration: 0.2 }}
                onClick={() => onDateChange && onDateChange({ year: "", month: "", day: "" })}
                className="text-slate-400 hover:text-red-500 p-1 rounded-md transition-colors ml-1"
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

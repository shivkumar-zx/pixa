"use client"

import { useState } from "react"
import { Activity, Search, Filter } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"

const actionColors: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  UPLOAD: "default",
  DOWNLOAD: "secondary",
  DELETE: "destructive",
  SHARE: "default",
  VIEW: "outline",
  RESTORE: "outline",
  LOGIN: "secondary",
  LOGOUT: "secondary",
}

export function ActivityClient({ initialLogs }: { initialLogs: any[] }) {
  const [logs] = useState(initialLogs)
  const [filterAction, setFilterAction] = useState<string>("ALL")
  const [searchQuery, setSearchQuery] = useState<string>("")

  const filteredLogs = logs.filter((log) => {
    const matchesFilter =
      filterAction === "ALL" ||
      (filterAction === "UPLOADS" && log.action === "UPLOAD") ||
      (filterAction === "DOWNLOADS" && log.action === "DOWNLOAD") ||
      (filterAction === "SHARES" && log.action === "SHARE") ||
      (filterAction === "DELETES" && (log.action === "DELETE" || log.action === "PURGE")) ||
      (filterAction === "AUTH" && (log.action === "LOGIN" || log.action === "LOGOUT"))

    const q = searchQuery.toLowerCase()
    const matchesSearch =
      !q ||
      log.user?.name?.toLowerCase().includes(q) ||
      log.user?.email?.toLowerCase().includes(q) ||
      log.file?.originalName?.toLowerCase().includes(q) ||
      log.action?.toLowerCase().includes(q)

    return matchesFilter && matchesSearch
  })

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Activity size={24} className="text-primary" /> Activity Log
          </h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            {filteredLogs.length} activity record{filteredLogs.length !== 1 ? "s" : ""}
          </p>
        </div>

        <div className="relative w-full sm:w-64">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search activity..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 rounded-xl bg-card"
          />
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
        <Filter size={15} className="text-muted-foreground mr-1 shrink-0" />
        {[
          { label: "All", value: "ALL" },
          { label: "Uploads", value: "UPLOADS" },
          { label: "Downloads", value: "DOWNLOADS" },
          { label: "Shares", value: "SHARES" },
          { label: "Deletes", value: "DELETES" },
          { label: "Auth", value: "AUTH" },
        ].map((tab) => (
          <button
            key={tab.value}
            onClick={() => setFilterAction(tab.value)}
            className={`px-3 py-1.5 text-xs font-medium rounded-xl transition-all whitespace-nowrap ${
              filterAction === tab.value
                ? "bg-primary text-primary-foreground shadow-2xs"
                : "bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {filteredLogs.length === 0 ? (
        <div className="text-center py-20 bg-card border border-border rounded-2xl">
          <Activity size={48} className="mx-auto mb-4 text-muted-foreground/30" />
          <h3 className="font-semibold text-lg">No matching activity</h3>
          <p className="text-muted-foreground text-sm mt-1">Try adjusting your filters or search query.</p>
        </div>
      ) : (
        <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-2xs">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/40 text-muted-foreground">
                  <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider">Action</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider">User</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider">Target File</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3.5">
                      <Badge variant={actionColors[log.action] ?? "secondary"} className="text-[10px] px-2 py-0.5">
                        {log.action}
                      </Badge>
                    </td>
                    <td className="px-4 py-3.5">
                      <p className="font-semibold text-xs text-foreground">{log.user?.name || "System"}</p>
                      <p className="text-[11px] text-muted-foreground">{log.user?.email || "—"}</p>
                    </td>
                    <td className="px-4 py-3.5 text-xs font-medium text-muted-foreground max-w-[220px] truncate">
                      {log.file?.originalName ?? "—"}
                    </td>
                    <td className="px-4 py-3.5 text-xs text-muted-foreground whitespace-nowrap">
                      {new Date(log.createdAt).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}

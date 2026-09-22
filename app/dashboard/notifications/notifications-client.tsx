"use client"

import { useState } from "react"
import { Bell, CheckCheck, Trash2, Loader2 } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import { useRouter } from "next/navigation"

export function NotificationsClient({ initialNotifications }: { initialNotifications: any[] }) {
  const router = useRouter()
  const [notifications, setNotifications] = useState(initialNotifications)
  const [loadingRead, setLoadingRead] = useState(false)
  const [loadingClear, setLoadingClear] = useState(false)

  const unreadCount = notifications.filter((n) => !n.isRead).length

  const handleMarkAllRead = async () => {
    setLoadingRead(true)
    try {
      const res = await fetch("/api/notifications", { method: "PUT" })
      if (res.ok) {
        toast.success("All notifications marked as read")
        setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })))
        router.refresh()
      } else {
        toast.error("Failed to mark notifications as read")
      }
    } catch {
      toast.error("Failed to mark notifications as read")
    } finally {
      setLoadingRead(false)
    }
  }

  const handleClearAll = async () => {
    if (!confirm("Are you sure you want to clear all notifications?")) return
    setLoadingClear(true)
    try {
      const res = await fetch("/api/notifications", { method: "DELETE" })
      if (res.ok) {
        toast.success("Notifications cleared")
        setNotifications([])
        router.refresh()
      } else {
        toast.error("Failed to clear notifications")
      }
    } catch {
      toast.error("Failed to clear notifications")
    } finally {
      setLoadingClear(false)
    }
  }

  const typeColors: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
    UPLOAD: "default",
    SHARE: "default",
    STORAGE_WARNING: "destructive",
    SYSTEM: "secondary",
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Bell size={24} className="text-primary" /> Notifications
          </h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            {unreadCount} unread notification{unreadCount !== 1 ? "s" : ""}
          </p>
        </div>
        {notifications.length > 0 && (
          <div className="flex items-center gap-2">
            {unreadCount > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleMarkAllRead}
                disabled={loadingRead}
                className="gap-1.5 rounded-xl shadow-2xs"
              >
                {loadingRead ? <Loader2 size={14} className="animate-spin" /> : <CheckCheck size={14} />}
                Mark all read
              </Button>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClearAll}
              disabled={loadingClear}
              className="gap-1.5 text-muted-foreground hover:text-destructive rounded-xl"
            >
              {loadingClear ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
              Clear all
            </Button>
          </div>
        )}
      </div>

      {notifications.length === 0 ? (
        <div className="text-center py-20 bg-card border border-border rounded-2xl">
          <Bell size={48} className="mx-auto mb-4 text-muted-foreground/30" />
          <h3 className="font-semibold text-lg">No notifications</h3>
          <p className="text-muted-foreground text-sm mt-1">You&apos;re all caught up!</p>
        </div>
      ) : (
        <div className="space-y-3">
          {notifications.map((notif) => (
            <Card
              key={notif.id}
              className={`transition-all border-border ${
                !notif.isRead ? "border-l-4 border-l-primary bg-primary/5" : "bg-card/60 backdrop-blur"
              }`}
            >
              <CardContent className="p-4 flex items-start gap-3.5">
                <div
                  className={`w-2.5 h-2.5 rounded-full mt-2 shrink-0 ${
                    !notif.isRead ? "bg-primary animate-pulse" : "bg-muted-foreground/30"
                  }`}
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <p className="text-sm font-semibold text-foreground">{notif.title}</p>
                    <Badge variant={typeColors[notif.type] ?? "secondary"} className="text-[10px] px-2 py-0.5">
                      {notif.type}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed">{notif.message}</p>
                  <p className="text-xs text-muted-foreground/70 mt-2">
                    {new Date(notif.createdAt).toLocaleString()}
                  </p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}

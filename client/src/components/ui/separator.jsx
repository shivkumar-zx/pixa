import * as React from "react"
import { cn } from "../../lib/utils"

function Separator({
  className,
  orientation = "horizontal",
  ...props
}) {
  return (
    <div
      data-slot="separator"
      className={cn(
        "shrink-0 bg-border",
        orientation === "horizontal" ? "h-px w-full" : "w-px h-full self-stretch",
        className
      )}
      {...props}
    />
  )
}

export { Separator }

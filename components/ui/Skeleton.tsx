import * as React from "react"

export function Skeleton({
  className = '',
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={`animate-pulse-light rounded-md bg-muted-foreground/15 ${className}`}
      {...props}
    />
  )
}

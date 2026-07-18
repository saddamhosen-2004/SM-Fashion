import * as React from "react"

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'secondary' | 'success' | 'warning' | 'danger' | 'outline'
}

export function Badge({
  className = '',
  variant = 'default',
  ...props
}: BadgeProps) {
  const baseStyles = 'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none'
  
  const variants = {
    default: 'bg-primary text-white hover:opacity-85',
    secondary: 'bg-secondary text-secondary-foreground hover:opacity-85',
    success: 'bg-success/15 text-success hover:bg-success/20',
    warning: 'bg-warning/15 text-warning hover:bg-warning/20',
    danger: 'bg-danger/15 text-danger hover:bg-danger/20',
    outline: 'text-foreground border border-border',
  }

  return (
    <div className={`${baseStyles} ${variants[variant]} ${className}`} {...props} />
  )
}

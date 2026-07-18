import * as React from "react"

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className = '', label, error, type = 'text', ...props }, ref) => {
    return (
      <div className="w-full">
        {label ? (
          <label className="block text-sm font-medium text-foreground mb-1">
            {label}
          </label>
        ) : null}
        <input
          type={type}
          className={`flex h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${error ? 'border-danger focus-visible:ring-danger' : ''} ${className}`}
          ref={ref}
          {...props}
        />
        {error ? (
          <p className="mt-1 text-xs text-danger">{error}</p>
        ) : null}
      </div>
    )
  }
)
Input.displayName = "Input"

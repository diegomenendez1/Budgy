import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "../../lib/utils"

const buttonVariants = cva(
    "inline-flex items-center justify-center whitespace-nowrap rounded-xl text-sm font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-40 active:scale-[0.97] transition-all duration-150",
    {
        variants: {
            variant: {
                default:
                    "bg-gradient-to-r from-[#0052FF] to-[#4D7CFF] text-white shadow-md shadow-[#0052FF]/20 hover:shadow-lg hover:shadow-[#0052FF]/30",
                destructive:
                    "bg-red-600 text-white hover:bg-red-700",
                outline:
                    "border border-slate-200 bg-white hover:bg-slate-50 text-slate-700",
                secondary:
                    "bg-slate-100 text-slate-700 hover:bg-slate-200",
                ghost:
                    "hover:bg-slate-100 text-slate-600",
                link:
                    "text-blue-600 underline-offset-4 hover:underline",
                glass:
                    "bg-white/80 backdrop-blur-xl border border-slate-200/60 text-slate-700 hover:bg-white shadow-sm",
                income:
                    "bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100",
                expense:
                    "bg-red-50 text-red-700 border border-red-200 hover:bg-red-100",
            },
            size: {
                default: "h-11 px-5 py-2",
                sm: "h-9 px-3 text-xs",
                lg: "h-12 px-8 text-base",
                icon: "h-11 w-11",
            },
        },
        defaultVariants: {
            variant: "default",
            size: "default",
        },
    }
)

export interface ButtonProps
    extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
    asChild?: boolean
    icon?: React.ReactNode
    iconPosition?: "left" | "right"
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
    ({ className, variant, size, asChild = false, icon, iconPosition = "left", children, ...props }, ref) => {
        const Comp = asChild ? Slot : "button"

        if (asChild) {
            return (
                <Comp
                    className={cn(buttonVariants({ variant, size, className }))}
                    ref={ref}
                    {...props}
                >
                    {children}
                </Comp>
            )
        }

        return (
            <button
                className={cn(buttonVariants({ variant, size, className }))}
                ref={ref}
                {...props}
            >
                {icon && iconPosition === "left" && <span className="mr-2">{icon}</span>}
                {children}
                {icon && iconPosition === "right" && <span className="ml-2">{icon}</span>}
            </button>
        )
    }
)
Button.displayName = "Button"

export { Button, buttonVariants }

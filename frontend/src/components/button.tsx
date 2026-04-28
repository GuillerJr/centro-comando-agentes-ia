import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../lib/utils';

const buttonVariants = cva(
  'inline-flex items-center justify-center rounded-[22px] text-sm font-semibold transition duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-300 disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        default: 'bg-[linear-gradient(135deg,#0f172a,#1e293b)] text-white shadow-[0_16px_28px_rgba(15,23,42,0.22)] hover:-translate-y-0.5 hover:shadow-[0_20px_34px_rgba(15,23,42,0.28)]',
        secondary: 'border border-slate-200 bg-white text-slate-700 shadow-[0_10px_22px_rgba(15,23,42,0.05)] hover:border-slate-300 hover:bg-slate-50',
        success: 'bg-[linear-gradient(135deg,#059669,#10b981)] text-white shadow-[0_14px_24px_rgba(16,185,129,0.24)] hover:-translate-y-0.5',
        danger: 'bg-[linear-gradient(135deg,#e11d48,#fb7185)] text-white shadow-[0_14px_24px_rgba(244,63,94,0.2)] hover:-translate-y-0.5',
        ghost: 'text-slate-600 hover:bg-slate-100 hover:text-slate-900',
      },
      size: {
        default: 'h-11 px-4 py-2.5',
        sm: 'h-9 px-3.5 text-[13px]',
        lg: 'h-12 px-5',
        icon: 'h-11 w-11',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  },
);

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> {}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(({ className, variant, size, ...props }, ref) => {
  return <button className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />;
});
Button.displayName = 'Button';

export { Button, buttonVariants };

import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../lib/utils';

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 rounded-[18px] text-sm font-semibold transition duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        default: 'border border-blue-400/30 bg-blue-500 text-white shadow-[0_12px_28px_rgba(37,99,235,0.25)] hover:bg-blue-400',
        secondary: 'border border-white/10 bg-white/[0.03] text-zinc-200 hover:bg-white/[0.06]',
        success: 'border border-emerald-400/30 bg-emerald-500 text-black shadow-[0_12px_28px_rgba(16,185,129,0.2)] hover:bg-emerald-400',
        danger: 'border border-rose-400/30 bg-rose-500 text-white shadow-[0_12px_28px_rgba(244,63,94,0.22)] hover:bg-rose-400',
        ghost: 'text-zinc-300 hover:bg-white/[0.04] hover:text-white',
      },
      size: {
        default: 'h-10 px-4 py-2',
        sm: 'h-8 px-3 text-xs',
        lg: 'h-11 px-5',
        icon: 'h-9 w-9',
      },
      fullWidth: {
        true: 'w-full sm:w-auto',
        false: '',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
      fullWidth: false,
    },
  },
);

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> {}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(({ className, variant, size, fullWidth, ...props }, ref) => {
  return <button className={cn(buttonVariants({ variant, size, fullWidth, className }))} ref={ref} {...props} />;
});
Button.displayName = 'Button';

export { Button, buttonVariants };

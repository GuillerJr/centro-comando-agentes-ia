import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../lib/utils';

const buttonVariants = cva(
  'inline-flex items-center justify-center rounded-2xl text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        default: 'bg-slate-950 text-white hover:bg-slate-800',
        secondary: 'border border-slate-200 bg-white text-slate-700 hover:bg-slate-50',
        success: 'bg-emerald-600 text-white hover:bg-emerald-500',
        danger: 'bg-rose-600 text-white hover:bg-rose-500',
        ghost: 'text-slate-600 hover:bg-slate-100 hover:text-slate-900',
      },
      size: {
        default: 'h-11 px-4 py-2',
        sm: 'h-9 px-3',
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

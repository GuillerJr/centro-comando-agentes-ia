import * as React from 'react';
import { cn } from '../lib/utils';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {}

const Input = React.forwardRef<HTMLInputElement, InputProps>(({ className, ...props }, ref) => {
  return <input ref={ref} className={cn('flex h-11 w-full rounded-[22px] border border-slate-200/90 bg-white/95 px-4 py-3 text-sm text-slate-700 shadow-[0_12px_28px_rgba(15,23,42,0.04)] outline-none transition placeholder:text-slate-400 focus:border-sky-300 focus:ring-4 focus:ring-sky-100', className)} {...props} />;
});
Input.displayName = 'Input';

export { Input };

import * as React from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { X } from 'lucide-react';
import { cn } from '../lib/utils';

export function Modal({ open, onOpenChange, title, description, children }: { open: boolean; onOpenChange: (open: boolean) => void; title: string; description?: string; children: React.ReactNode }) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm" />
        <Dialog.Content className={cn('fixed left-1/2 top-1/2 z-50 w-[calc(100vw-1.5rem)] max-w-3xl -translate-x-1/2 -translate-y-1/2 rounded-[24px] border border-white/10 bg-[#0f1117] p-0 shadow-[0_24px_80px_rgba(0,0,0,0.45)] sm:w-[min(92vw,760px)]')}>
          <div className="flex items-start justify-between gap-3 border-b border-white/8 px-4 py-4 sm:px-5">
            <div className="min-w-0">
              <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-zinc-500">Formulario operativo</p>
              <Dialog.Title className="text-base font-semibold text-white sm:text-lg">{title}</Dialog.Title>
              {description ? <Dialog.Description className="mt-1 text-sm leading-6 text-zinc-400">{description}</Dialog.Description> : null}
            </div>
            <Dialog.Close aria-label="Cerrar modal" className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/[0.03] text-zinc-400 transition hover:text-white">
              <X className="h-4 w-4" />
            </Dialog.Close>
          </div>
          <div className="scrollbar-dark max-h-[78vh] overflow-y-auto px-4 py-4 sm:px-5 sm:py-5">{children}</div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

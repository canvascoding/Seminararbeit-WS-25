'use client';

import * as React from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { X } from 'lucide-react';

interface SheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: React.ReactNode;
  side?: 'left' | 'right' | 'top' | 'bottom';
}

export function Sheet({ open, onOpenChange, children, side = 'right' }: SheetProps) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-loop-slate/40 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
        <Dialog.Content
          className={`fixed z-50 gap-4 bg-loop-sand p-6 shadow-lg transition ease-in-out data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:duration-300 data-[state=open]:duration-500 ${
            side === 'right'
              ? 'inset-y-0 right-0 h-full w-3/4 max-w-sm border-l data-[state=closed]:slide-out-to-right data-[state=open]:slide-in-from-right'
              : side === 'left'
              ? 'inset-y-0 left-0 h-full w-3/4 max-w-sm border-r data-[state=closed]:slide-out-to-left data-[state=open]:slide-in-from-left'
              : side === 'top'
              ? 'inset-x-0 top-0 border-b data-[state=closed]:slide-out-to-top data-[state=open]:slide-in-from-top'
              : 'inset-x-0 bottom-0 border-t data-[state=closed]:slide-out-to-bottom data-[state=open]:slide-in-from-bottom'
          }`}
        >
          <Dialog.Close className="absolute right-4 top-4 rounded-full p-2 opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-loop-green focus:ring-offset-2 disabled:pointer-events-none">
            <X className="h-5 w-5" />
            <span className="sr-only">Close</span>
          </Dialog.Close>
          {children}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

export function SheetTrigger({ children, ...props }: React.ComponentPropsWithoutRef<typeof Dialog.Trigger>) {
  return <Dialog.Trigger {...props}>{children}</Dialog.Trigger>;
}

export function SheetTitle({ children, className = '', ...props }: React.ComponentPropsWithoutRef<typeof Dialog.Title>) {
  return (
    <Dialog.Title className={`text-lg font-semibold text-loop-slate ${className}`} {...props}>
      {children}
    </Dialog.Title>
  );
}

export function SheetDescription({ children, className = '', ...props }: React.ComponentPropsWithoutRef<typeof Dialog.Description>) {
  return (
    <Dialog.Description className={`text-sm text-loop-slate/60 ${className}`} {...props}>
      {children}
    </Dialog.Description>
  );
}

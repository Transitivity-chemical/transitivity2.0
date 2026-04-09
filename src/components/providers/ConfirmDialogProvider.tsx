'use client';

import * as React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

/**
 * FIX-15 of post-megaplan audit: custom confirm dialog replacing browser confirm().
 *
 * Usage:
 *   const confirm = useConfirm();
 *   const ok = await confirm({
 *     title: 'Excluir usuário?',
 *     description: 'Esta ação não pode ser desfeita.',
 *     confirmLabel: 'Excluir',
 *     variant: 'destructive',
 *   });
 *   if (ok) { ... }
 */

type ConfirmOptions = {
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'default' | 'destructive';
};

type ConfirmFn = (opts: ConfirmOptions) => Promise<boolean>;

const ConfirmContext = React.createContext<ConfirmFn | null>(null);

export function useConfirm(): ConfirmFn {
  const ctx = React.useContext(ConfirmContext);
  if (!ctx) throw new Error('useConfirm must be used inside ConfirmDialogProvider');
  return ctx;
}

export function ConfirmDialogProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = React.useState<{
    open: boolean;
    options: ConfirmOptions;
    resolve?: (v: boolean) => void;
  }>({
    open: false,
    options: { title: '' },
  });

  const confirm = React.useCallback<ConfirmFn>((options) => {
    return new Promise<boolean>((resolve) => {
      setState({ open: true, options, resolve });
    });
  }, []);

  const handleClose = (value: boolean) => {
    state.resolve?.(value);
    setState((s) => ({ ...s, open: false }));
  };

  const { title, description, confirmLabel, cancelLabel, variant } = state.options;

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}
      <Dialog open={state.open} onOpenChange={(o) => !o && handleClose(false)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{title}</DialogTitle>
            {description && <DialogDescription>{description}</DialogDescription>}
          </DialogHeader>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => handleClose(false)}>
              {cancelLabel ?? 'Cancelar'}
            </Button>
            <Button
              type="button"
              variant={variant === 'destructive' ? 'destructive' : 'default'}
              onClick={() => handleClose(true)}
            >
              {confirmLabel ?? 'Confirmar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </ConfirmContext.Provider>
  );
}

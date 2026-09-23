'use client';

import { useState, useCallback } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

export function useConfirm() {
  const [open, setOpen] = useState(false);
  const [resolveRef, setResolveRef] = useState<(value: boolean) => void>(() => () => {});
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');

  const confirm = useCallback((title: string, message: string): Promise<boolean> => {
    setTitle(title);
    setMessage(message);
    setOpen(true);
    return new Promise((res) => {
      setResolveRef(() => res);
    });
  }, []);

  const handleConfirm = useCallback(() => {
    setOpen(false);
    resolveRef(true);
  }, [resolveRef]);

  const handleCancel = useCallback(() => {
    setOpen(false);
    resolveRef(false);
  }, [resolveRef]);

  const ConfirmDialog = () => (
    <Dialog open={open}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{message}</DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={handleCancel}>
            Annuler
          </Button>
          <Button variant="destructive" onClick={handleConfirm}>
            Confirmer
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );

  return [confirm, ConfirmDialog] as const;
}

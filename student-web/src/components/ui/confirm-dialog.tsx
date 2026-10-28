'use client';

import { Button } from './button';
import { Modal } from './modal';

interface Props {
  open: boolean;
  title: string;
  description: string;
  confirmLabel?: string;
  danger?: boolean;
  loading?: boolean;
  onConfirm: () => void;
  onClose: () => void;
}

export function ConfirmDialog({ open, title, description, confirmLabel = 'Confirm', danger, loading, onConfirm, onClose }: Props) {
  return (
    <Modal open={open} title={title} onClose={onClose}>
      <p className="text-mute">{description}</p>
      <div className="mt-6 flex justify-end gap-3">
        <Button variant="ghost" small onClick={onClose}>Keep as is</Button>
        <Button variant={danger ? 'danger' : 'solid'} small loading={loading} onClick={onConfirm}>{confirmLabel}</Button>
      </div>
    </Modal>
  );
}

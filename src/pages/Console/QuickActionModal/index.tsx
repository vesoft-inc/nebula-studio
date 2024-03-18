import { useCallback, useMemo } from 'react';
import { observer } from 'mobx-react-lite';
import Dialog from '@mui/material/Dialog';
import type { ModalOwnProps } from '@mui/material/Modal';
import DialogTitle from '@mui/material/DialogTitle';
import { useStore } from '@/stores';

export default observer(function QuickActionModal() {
  const { consoleStore } = useStore();
  const { quickActionModalOpen, setQuickActionModalOpen } = consoleStore;

  const slotProps: ModalOwnProps['slotProps'] = useMemo(
    () => ({ backdrop: { sx: { backdropFilter: 'blur(1px)' } } }),
    []
  );
  const handleClose = useCallback(() => setQuickActionModalOpen(false), []);

  return (
    <Dialog
      onClose={handleClose}
      open={quickActionModalOpen}
      slotProps={slotProps}
      PaperProps={{ sx: { alignSelf: 'flex-start', mt: 7.5 } }}
    >
      <DialogTitle>Set backup account</DialogTitle>
    </Dialog>
  );
});

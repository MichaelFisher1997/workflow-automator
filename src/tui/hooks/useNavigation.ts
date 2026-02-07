import { useEffect, useMemo, useState } from 'react';
import { useInput } from 'ink';
import type { VariantRow } from '../../models/workflow.js';

interface ConfirmOptions {
  dryRun: boolean;
  force: boolean;
}

interface UseNavigationOptions {
  visibleRows: VariantRow[];
  allRows: VariantRow[];
  onConfirm: (rows: VariantRow[], options: ConfirmOptions) => void | Promise<void>;
  onQuit?: () => void;
}

export function useNavigation({ visibleRows, allRows, onConfirm, onQuit }: UseNavigationOptions) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [selectedRowIds, setSelectedRowIds] = useState<Set<string>>(new Set());
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [dryRun, setDryRun] = useState(false);
  const [force, setForce] = useState(false);

  const selectedRow = visibleRows[selectedIndex] ?? null;

  useEffect(() => {
    if (visibleRows.length === 0) {
      setSelectedIndex(0);
      return;
    }
    if (selectedIndex > visibleRows.length - 1) {
      setSelectedIndex(visibleRows.length - 1);
    }
  }, [visibleRows.length, selectedIndex]);

  const selectedRows = useMemo(
    () => allRows.filter((row) => selectedRowIds.has(row.id)),
    [allRows, selectedRowIds],
  );

  useEffect(() => {
    setSelectedRowIds((previous) => {
      const validIds = new Set(allRows.map((row) => row.id));
      const next = new Set<string>();
      for (const id of previous) {
        if (validIds.has(id)) next.add(id);
      }
      if (next.size === previous.size) {
        let unchanged = true;
        for (const id of next) {
          if (!previous.has(id)) {
            unchanged = false;
            break;
          }
        }
        if (unchanged) return previous;
      }
      return next;
    });
  }, [allRows]);

  const toggleSelectedRow = (rowId: string) => {
    setSelectedRowIds((previous) => {
      const next = new Set(previous);
      if (next.has(rowId)) {
        next.delete(rowId);
      } else {
        next.add(rowId);
      }
      return next;
    });
  };

  useInput((input, key) => {
    if (isHelpOpen) {
      if (key.escape || input === '?' || input === 'q') {
        setIsHelpOpen(false);
      }
      return;
    }

    if (isConfirmOpen) {
      if (key.escape) {
        setIsConfirmOpen(false);
      } else if (input === 'd') {
        setDryRun((value) => !value);
      } else if (input === 'f') {
        setForce((value) => !value);
      } else if (key.return) {
        if (selectedRows.length > 0) {
          void onConfirm(selectedRows, { dryRun, force });
        }
        setIsConfirmOpen(false);
      }
      return;
    }

    if (visibleRows.length === 0) {
      if (input === '?') {
        setIsHelpOpen(true);
        return;
      }
      if (input === 'q' || (key.ctrl && input === 'c')) {
        onQuit?.();
      }
      return;
    }

    if (key.upArrow || input === 'k') {
      setSelectedIndex((index) => Math.max(0, index - 1));
      return;
    }

    if (key.downArrow || input === 'j') {
      setSelectedIndex((index) => Math.min(visibleRows.length - 1, index + 1));
      return;
    }

    if (input >= '1' && input <= '9') {
      const index = Number.parseInt(input, 10) - 1;
      if (index >= 0 && index < visibleRows.length) {
        setSelectedIndex(index);
      }
      return;
    }

    if (input === ' ') {
      const row = visibleRows[selectedIndex];
      if (row) toggleSelectedRow(row.id);
      return;
    }

    if (key.return) {
      const row = visibleRows[selectedIndex];
      if (!row) return;

      if (selectedRowIds.size === 0) {
        toggleSelectedRow(row.id);
      }
      setIsConfirmOpen(true);
      return;
    }

    if (input === '?') {
      setIsHelpOpen(true);
      return;
    }

    if (input === 'q' || (key.ctrl && input === 'c')) {
      onQuit?.();
    }
  });

  return {
    selectedIndex,
    selectedRow,
    selectedRows,
    selectedRowIds,
    isHelpOpen,
    isConfirmOpen,
    dryRun,
    force,
    setIsHelpOpen,
    setIsConfirmOpen,
    setDryRun,
    setForce,
  };
}

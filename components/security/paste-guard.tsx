"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";

interface PasteGuardProps {
  onConfirm: (text: string) => void;
  onCancel: () => void;
}

// NOTE: Usage requires wrapping Input or handling clipboard event externally,
// then opening this modal.
// We will export a Hook instead to attach to Inputs easily.

export function usePasteGuard() {
  const [pastedText, setPastedText] = useState<string | null>(null);
  const [resolveFn, setResolveFn] = useState<((ok: boolean) => void) | null>(
    null
  );

  const confirmPaste = (text: string): Promise<boolean> => {
    return new Promise((resolve) => {
      setPastedText(text);
      setResolveFn(() => resolve);
    });
  };

  const handleClose = (ok: boolean) => {
    if (resolveFn) resolveFn(ok);
    setPastedText(null);
    setResolveFn(null);
  };

  const PasteGuardModal = () => (
    <Dialog
      open={!!pastedText}
      onOpenChange={(open) => !open && handleClose(false)}
    >
      <DialogContent className="bg-zinc-900 border-yellow-500/30">
        <DialogHeader>
          <DialogTitle className="text-yellow-500">Verify Address</DialogTitle>
          <DialogDescription className="text-slate-300">
            You are pasting an address. Malware can modify clipboard contents.
            <br />
            <br />
            Please confirm the characters:
            <div className="mt-4 p-4 bg-black/50 rounded-xl font-mono text-center text-lg border border-white/10 break-all">
              <span className="text-green-400">{pastedText?.slice(0, 6)}</span>
              <span className="text-slate-600">...</span>
              <span className="text-green-400">{pastedText?.slice(-6)}</span>
            </div>
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            variant="outline"
            onClick={() => handleClose(false)}
            className="border-white/10 hover:bg-white/5 text-white"
          >
            Cancel
          </Button>
          <Button
            onClick={() => handleClose(true)}
            className="bg-yellow-500 text-black hover:bg-yellow-400"
          >
            Verified & Safe
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );

  return { confirmPaste, PasteGuardModal };
}

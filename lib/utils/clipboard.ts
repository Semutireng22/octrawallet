import { toast } from "sonner";

let clearTimer: NodeJS.Timeout | null = null;

export const copyWithAutoClear = (text: string, label: string = "Data") => {
  if (!text) return;

  // 1. Write to Clipboard
  navigator.clipboard
    .writeText(text)
    .then(() => {
      toast.success(`${label} copied!`, {
        description: "Clipboard will clear in 60s for security.",
      });

      // 2. Clear previous timer if exists
      if (clearTimer) clearTimeout(clearTimer);

      // 3. Set new timer
      clearTimer = setTimeout(() => {
        if (document.hasFocus()) {
          navigator.clipboard.writeText("").then(() => {
            toast.info("Clipboard cleared automatically (Security)", {
              duration: 3000,
            });
          });
        }
      }, 60000); // 60s
    })
    .catch(() => {
      toast.error("Failed to copy");
    });
};

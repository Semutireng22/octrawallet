"use client";

import { Button } from "@/components/ui/button";
import { Delete, ArrowUp, Hash } from "lucide-react";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

interface VirtualKeypadProps {
  onInput: (char: string) => void;
  onDelete: () => void;
  onClear: () => void;
  isVisible: boolean;
}

export function VirtualKeypad({
  onInput,
  onDelete,
  onClear,
  isVisible,
}: VirtualKeypadProps) {
  const [layout, setLayout] = useState<"alpha" | "sym">("alpha");
  const [isShift, setIsShift] = useState(false);

  // Standard QWERTY
  const alphaRows = [
    ["q", "w", "e", "r", "t", "y", "u", "i", "o", "p"],
    ["a", "s", "d", "f", "g", "h", "j", "k", "l"],
    ["z", "x", "c", "v", "b", "n", "m"],
  ];

  // Numbers & Symbols
  const symRows = [
    ["1", "2", "3", "4", "5", "6", "7", "8", "9", "0"],
    ["@", "#", "$", "_", "&", "-", "+", "(", ")", "/"],
    ["*", '"', "'", ":", ";", "!", "?", ",", "."], // Added . and ,
  ];

  if (!isVisible) return null;

  const currentRows = layout === "alpha" ? alphaRows : symRows;

  const handleKeyClick = (key: string) => {
    let output = key;
    if (layout === "alpha" && isShift) {
      output = key.toUpperCase();
    }
    onInput(output);
    // Auto unshift after one char? Standard behavior varies.
    // Let's keep shift strict toggle or not? Usually easier if sticky.
    // For now, let's behave like mobile: unshift after char unless caps lock (not implementing caps lock yet)
    if (isShift) setIsShift(false);
  };

  return (
    <div className="mt-4 max-w-lg mx-auto bg-black/40 backdrop-blur-md p-4 rounded-2xl border border-white/10 animate-in slide-in-from-bottom duration-300 shadow-2xl">
      <div className="flex flex-col gap-2">
        {currentRows.map((row, rowIndex) => (
          <div key={rowIndex} className="flex justify-center gap-1.5">
            {row.map((key) => (
              <Button
                key={key}
                type="button"
                variant="outline"
                className={cn(
                  "h-12 min-w-[32px] px-1 text-lg font-space border-white/10 hover:bg-yellow-500/20 hover:text-yellow-400 active:scale-95 transition-all text-slate-300",
                  isShift && layout === "alpha" && "uppercase" // Visual uppercase
                )}
                onClick={() => handleKeyClick(key)}
              >
                {layout === "alpha" && isShift ? key.toUpperCase() : key}
              </Button>
            ))}
          </div>
        ))}

        {/* Bottom Action Row */}
        <div className="flex justify-between gap-1.5 mt-1 px-1">
          {/* Shift or Sym Toggle */}
          <Button
            type="button"
            variant={isShift ? "gold" : "secondary"}
            className="w-16"
            onClick={() => {
              if (layout === "sym") {
                setLayout("alpha");
                setIsShift(false);
              } else {
                setIsShift(!isShift);
              }
            }}
          >
            {layout === "sym" ? (
              "ABC"
            ) : (
              <ArrowUp className={cn("w-5 h-5", isShift && "fill-current")} />
            )}
          </Button>

          {/* Sym / Num Toggle */}
          <Button
            type="button"
            variant="secondary"
            className="w-16 text-xs font-bold"
            onClick={() => setLayout(layout === "alpha" ? "sym" : "alpha")}
          >
            {layout === "alpha" ? "?123" : "ABC"}
          </Button>

          {/* Space */}
          <Button
            type="button"
            variant="outline"
            className="flex-1 border-white/10"
            onClick={() => onInput(" ")}
          >
            SPACE
          </Button>

          {/* Backspace */}
          <Button
            type="button"
            variant="destructive"
            className="w-16 bg-red-500/20 text-red-400 hover:bg-red-500/30"
            onClick={onDelete}
          >
            <Delete className="w-5 h-5" />
          </Button>
        </div>
      </div>
    </div>
  );
}

"use client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

const shortcuts = [
  { key: "Space", description: "Play/Pause" },
  { key: "←", description: "Rewind 5 seconds" },
  { key: "→", description: "Forward 5 seconds" },
  { key: "↑", description: "Volume up" },
  { key: "↓", description: "Volume down" },
  { key: "M", description: "Mute/Unmute" },
  { key: "F", description: "Toggle fullscreen" },
];

export function KeyboardShortcuts({ open, onOpenChange }) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Keyboard Shortcuts</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          {shortcuts.map(({ key, description }) => (
            <div key={key} className="flex items-center justify-between">
              <kbd className="px-2 py-1.5 text-xs font-semibold text-gray-800 bg-gray-100 border border-gray-200 rounded-lg dark:bg-gray-600 dark:text-gray-100 dark:border-gray-500">
                {key}
              </kbd>
              <span className="text-sm text-muted-foreground">{description}</span>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
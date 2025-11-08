// components/copy-status-modal.tsx
"use client";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Copy, Check, Edit, RotateCcw } from "lucide-react";

interface WorkStatus {
  id: string;
  ticketNumber: string;
  title: string;
  status: string;
  effortTodayFormatted: string;
  totalEffortFormatted: string;
  estimatedEffortFormatted: string;
  date: Date;
  createdAt: string;
}

interface CopyStatusModalProps {
  isOpen: boolean;
  onClose: () => void;
  workStatuses: WorkStatus[];
  title: string;
}

export function CopyStatusModal({
  isOpen,
  onClose,
  workStatuses,
  title,
}: CopyStatusModalProps) {
  const [copied, setCopied] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editedText, setEditedText] = useState("");

  // Sort workStatuses by createdAt in ascending order (oldest first)
  const sortedWorkStatuses = [...workStatuses].sort((a, b) => {
    return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
  });

  // Format date for the header (e.g., "07/11/25")
  const formatDate = (date: Date) => {
    return date
      .toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "2-digit",
        year: "2-digit",
      })
      .replace(/\//g, "/");
  };

  // Generate the status text in the desired format using sorted data
  const generateStatusText = () => {
    if (sortedWorkStatuses.length === 0) return "";

    const date = sortedWorkStatuses[0].date;
    let text = `${formatDate(date)} – Work status\n\n`;

    sortedWorkStatuses.forEach((status) => {
      text += `#${status.ticketNumber} - ${status.title}\n`;
      text += `Status: ${status.status}\n`;
      text += `Effort Today: ${status.effortTodayFormatted}\n`;
      text += `Total Effort: ${status.totalEffortFormatted}\n`;
      text += `Estimated Effort: ${status.estimatedEffortFormatted}\n\n`;
    });

    return text.trim();
  };

  const originalStatusText = generateStatusText();

  // Initialize edited text when modal opens or workStatuses changes
  // Only update if not currently editing to preserve user changes
  useEffect(() => {
    if (isOpen && sortedWorkStatuses.length > 0 && !isEditing) {
      setEditedText(originalStatusText);
    }
  }, [isOpen, sortedWorkStatuses.length]);

  // Reset editing state when modal closes
  useEffect(() => {
    if (!isOpen) {
      setIsEditing(false);
    }
  }, [isOpen]);

  const handleCopy = async () => {
    const textToCopy = isEditing ? editedText : originalStatusText;
    try {
      await navigator.clipboard.writeText(textToCopy);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy text: ", err);
      // Fallback for older browsers
      const textArea = document.createElement("textarea");
      textArea.value = textToCopy;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand("copy");
      document.body.removeChild(textArea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleEditToggle = () => {
    if (isEditing) {
      // Save changes (just toggle off editing mode)
      setIsEditing(false);
    } else {
      // Start editing - sync with current original text
      setEditedText(originalStatusText);
      setIsEditing(true);
    }
  };

  const handleReset = () => {
    setEditedText(originalStatusText);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl text-white">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>Copy {title} Status</span>
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? "You can edit the text below before copying."
              : "Preview and copy the work status. The text will be copied to your clipboard."}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="rounded-lg border relative">
            <Textarea
              value={isEditing ? editedText : originalStatusText}
              readOnly={!isEditing}
              onChange={(e) => setEditedText(e.target.value)}
              className={`min-h-[300px] font-mono text-sm resize-none ${
                isEditing && "bg-neutral-900 focus:border-blue-600"
              }`}
              placeholder="No work status available for this day..."
            />

            {sortedWorkStatuses.length > 0 && (
              <div className="absolute -top-5 right-0 flex gap-2">
                {isEditing ? (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleReset}
                    className="h-8 hover:bg-black"
                  >
                    <RotateCcw className="w-4 h-4" />
                  </Button>
                ) : (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleEditToggle}
                    className="h-8 hover:bg-black"
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                )}
              </div>
            )}
          </div>

          {sortedWorkStatuses.length === 0 && (
            <div className="text-center text-gray-500 py-4">
              No work status available for {title.toLowerCase()}
            </div>
          )}
        </div>

        <DialogFooter className="flex flex-col sm:flex-row gap-2">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant="outline"
            onClick={handleCopy}
            disabled={sortedWorkStatuses.length === 0}
            className="flex items-center gap-2"
          >
            {copied ? (
              <>
                <Check className="w-4 h-4" />
                Copied!
              </>
            ) : (
              <>
                <Copy className="w-4 h-4" />
                Copy to Clipboard
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
// components/copy-status-modal.tsx
"use client";
import { useState } from "react";
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
import {
  Copy,
  Check,
  ClipboardCopy,
  Edit,
  Save,
  RotateCcw,
} from "lucide-react";

interface WorkStatus {
  id: string;
  ticketNumber: string;
  title: string;
  status: string;
  effortToday: string;
  totalEffort: string;
  estimatedEffort: string;
  date: Date;
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

  // Generate the status text in the desired format
  const generateStatusText = () => {
    if (workStatuses.length === 0) return "";

    const date = workStatuses[0].date;
    let text = `${formatDate(date)} – Work status\n\n`;

    workStatuses.forEach((status) => {
      text += `#${status.ticketNumber} - ${status.title}\n`;
      text += `Status: ${status.status}\n`;
      text += `Effort Today: ${status.effortToday}\n`;
      text += `Total Effort: ${status.totalEffort}\n`;
      text += `Estimated Effort: ${status.estimatedEffort}\n\n`;
    });

    return text.trim();
  };

  const originalStatusText = generateStatusText();

  // Initialize edited text when modal opens or workStatuses changes
  useState(() => {
    if (workStatuses.length > 0) {
      setEditedText(originalStatusText);
    }
  });

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
      // Save changes
      setIsEditing(false);
    } else {
      // Start editing
      setEditedText(originalStatusText);
      setIsEditing(true);
    }
  };

  const handleReset = () => {
    setEditedText(originalStatusText);
    setIsEditing(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl text-white">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between ">
            <span>Copy {title} Status</span>
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? "You can edit the text below before copying. Click Save when done."
              : "Preview and copy the work status in the required format. The text will be copied to your clipboard."}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="rounded-lg border relative">
            <Textarea
              value={isEditing ? editedText : originalStatusText}
              readOnly={!isEditing}
              onChange={
                isEditing ? (e) => setEditedText(e.target.value) : undefined
              }
              className={`min-h-[300px] font-mono text-sm resize-none ${
                isEditing && "bg-neutral-900 focus:border-blue-600"
              }`}
              placeholder="No work status available for this day..."
            />

            {workStatuses.length > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleEditToggle}
                className="flex items-center hover:bg-black absolute -top-5 right-0 gap-3"
              >
                {isEditing ? (
                  <>
                    <div className="hover:cursor-pointer">
                      <RotateCcw
                        onClick={handleReset}
                        className="w-4 h-4 transition-colors"
                      />
                    </div>
                    <div className="hover:cursor-pointer">
                      <Save className="w-4 h-4 transition-colors" />
                    </div>
                  </>
                ) : (
                  <>
                    <div className="hover:cursor-pointer">
                      <Edit className="w-4 h-4" />
                    </div>
                  </>
                )}
              </Button>
            )}
          </div>

          {/* {isEditing && (
            <div className="flex justify-between items-center text-sm">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleReset}
                className="text-gray-500 hover:text-gray-700"
              >
                Reset to original
              </Button>
            </div>
          )} */}

          {workStatuses.length === 0 && (
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
            disabled={workStatuses.length === 0}
            className="flex items-center gap-2 "
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

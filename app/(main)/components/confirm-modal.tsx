// components/confirm-modal.tsx
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
import { AlertTriangle, CheckCircle, Info } from "lucide-react";

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description: string;
  confirmText?: string;
  cancelText?: string;
  variant?: "danger" | "warning" | "info" | "success";
}

export function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  confirmText = "Confirm",
  cancelText = "Cancel",
  variant = "warning",
}: ConfirmModalProps) {
  const getVariantStyles = () => {
    switch (variant) {
      case "danger":
        return {
          icon: AlertTriangle,
          iconColor: "text-red-500",
          confirmButton: "bg-red-600 hover:bg-red-700 text-white",
        };
      case "warning":
        return {
          icon: AlertTriangle,
          iconColor: "text-yellow-500",
          confirmButton: "bg-yellow-600 hover:bg-yellow-700 text-white",
        };
      case "success":
        return {
          icon: CheckCircle,
          iconColor: "text-green-500",
          confirmButton: "bg-green-600 hover:bg-green-700 text-white",
        };
      case "info":
        return {
          icon: Info,
          iconColor: "text-blue-500",
          confirmButton: "bg-blue-600 hover:bg-blue-700 text-white",
        };
      default:
        return {
          icon: AlertTriangle,
          iconColor: "text-yellow-500",
          confirmButton: "bg-yellow-600 hover:bg-yellow-700 text-white",
        };
    }
  };

  const { icon: Icon, iconColor, confirmButton } = getVariantStyles();

  const handleConfirm = () => {
    onConfirm();
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-full ${iconColor} bg-opacity-20`}>
              <Icon className="h-6 w-6" />
            </div>
            <div>
              <DialogTitle className="text-white">{title}</DialogTitle>
              <DialogDescription className="text-gray-400 mt-1">
                {description}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>
        <DialogFooter className="flex gap-4">
          <Button
            variant="outline"
            onClick={onClose}
            className="flex-1"
          >
            {cancelText}
          </Button>
          <Button
            onClick={handleConfirm}
            className={`flex-1 ${confirmButton}`}
          >
            {confirmText}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
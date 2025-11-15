"use client";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Calendar,
  Clock,
  ArrowRight,
  Plus,
  ClipboardCopy,
  Edit,
  Trash2,
  CalendarPlus,
} from "lucide-react";
import { useState, useEffect, useCallback } from "react";
import { CopyStatusModal } from "./components/copy-status-modal";
import { ConfirmModal } from "./components/confirm-modal";
import { useUser } from "../context/UserContext";
import { useToast } from "../hooks/use-toast";
import {
  getAllWorkStatuses,
  deleteWorkStatus,
  duplicateWorkStatusForToday,
} from "../../lib/actions/work_status_actions";

const statusColors = {
  "To Do": "bg-gray-100 text-gray-800",
  "In Progress": "bg-blue-100 text-blue-800",
  "Code Review": "bg-purple-100 text-purple-800",
  DQA: "bg-orange-100 text-orange-800",
  "Ready for QA": "bg-yellow-100 text-yellow-800",
  Done: "bg-green-100 text-green-800",
  Blocked: "bg-red-100 text-red-800",
};

export interface WorkStatus {
  id: string;
  ticketNumber: string;
  title: string;
  status: string;
  effortTodayFormatted: string;
  totalEffortFormatted: string;
  estimatedEffortFormatted: string;
  date: Date;
  createdAt: Date;
}

interface WorkStatusData {
  [key: string]: WorkStatus[];
}

function StatusCard({
  workStatus,
  onEdit,
  onDelete,
  onMoveToToday,
}: {
  workStatus: WorkStatus;
  onEdit: (ticketNumber: string) => void;
  onDelete: (id: string, ticketNumber: string) => void;
  onMoveToToday: (id: string, ticketNumber: string) => void;
}) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [isMoving, setIsMoving] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [moveModalOpen, setMoveModalOpen] = useState(false);

  const handleDelete = async () => {
    setIsDeleting(true);
    await onDelete(workStatus.id, workStatus.ticketNumber);
    setIsDeleting(false);
    setDeleteModalOpen(false);
  };

  const handleMoveToToday = async () => {
    setIsMoving(true);
    await onMoveToToday(workStatus.id, workStatus.ticketNumber);
    setIsMoving(false);
    setMoveModalOpen(false);
  };

  // Check if the work status is from today
  const isToday = new Date(workStatus.date).toDateString() === new Date().toDateString();

  return (
    <>
      <Card className="hover:shadow-md transition-shadow duration-200 bg-black border-gray-800">
        <CardHeader className="pb-3">
          <div className="flex justify-between items-start">
            <div className="space-y-1">
              <CardTitle className="text-lg font-semibold text-white">
                {workStatus.ticketNumber}
              </CardTitle>
              <CardDescription className="text-base text-gray-400">
                {workStatus.title}
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Badge
                className={
                  statusColors[workStatus.status as keyof typeof statusColors]
                }
              >
                {workStatus.status}
              </Badge>
              <div className="flex gap-1">
                {/* Move to Today button - only show if not already today */}
                {!isToday && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setMoveModalOpen(true)}
                    disabled={isMoving}
                    className="h-8 w-8 p-0 text-green-500 hover:text-green-700 border-green-500 hover:border-green-700"
                    title="Move to Today"
                  >
                    <CalendarPlus className="h-4 w-4" />
                  </Button>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onEdit(workStatus.ticketNumber)}
                  className="h-8 w-8 p-0"
                  title="Edit"
                >
                  <Edit className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setDeleteModalOpen(true)}
                  disabled={isDeleting}
                  className="h-8 w-8 p-0 text-red-500 hover:text-red-700 border-red-500 hover:border-red-700"
                  title="Delete"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pb-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div className="flex items-center space-x-2">
              <Clock className="h-4 w-4 text-gray-400" />
              <div>
                <div className="font-medium text-white">Today</div>
                <div className="text-gray-400">
                  {workStatus.effortTodayFormatted}
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Calendar className="h-4 w-4 text-gray-400" />
              <div>
                <div className="font-medium text-white">Total</div>
                <div className="text-gray-400">
                  {workStatus.totalEffortFormatted}
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <ArrowRight className="h-4 w-4 text-gray-400" />
              <div>
                <div className="font-medium text-white">Estimated</div>
                <div className="text-gray-400">
                  {workStatus.estimatedEffortFormatted}
                </div>
              </div>
            </div>
          </div>
          <div className="mt-3 pt-3 border-t border-gray-800 text-xs text-gray-400">
            Updated{" "}
            {workStatus.date.toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })}
          </div>
        </CardContent>
      </Card>

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        onConfirm={handleDelete}
        title="Delete Work Status"
        description={`Are you sure you want to delete ${workStatus.ticketNumber}? This action cannot be undone.`}
        confirmText={isDeleting ? "Deleting..." : "Delete"}
        cancelText="Cancel"
        variant="danger"
      />

      {/* Move to Today Confirmation Modal */}
      <ConfirmModal
        isOpen={moveModalOpen}
        onClose={() => setMoveModalOpen(false)}
        onConfirm={handleMoveToToday}
        title="Move to Today"
        description={`Move ${workStatus.ticketNumber} to today? The status will be reset to "To Do" and today's effort will be cleared.`}
        confirmText={isMoving ? "Moving..." : "Move to Today"}
        cancelText="Cancel"
        variant="info"
      />
    </>
  );
}

interface DaySectionProps {
  title: string;
  workStatuses: WorkStatus[];
  count: number;
  onEdit: (ticketNumber: string) => void;
  onDelete: (id: string, ticketNumber: string) => void;
  onMoveToToday: (id: string, ticketNumber: string) => void;
  onBulkMoveToToday?: (workStatuses: WorkStatus[]) => void;
}

export function DaySection({
  title,
  workStatuses,
  count,
  onEdit,
  onDelete,
  onMoveToToday,
  onBulkMoveToToday,
}: DaySectionProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [bulkMoveModalOpen, setBulkMoveModalOpen] = useState(false);
  
  // Check if any of the work statuses are not from today
  const hasNonTodayItems = workStatuses.some(
    (status) => new Date(status.date).toDateString() !== new Date().toDateString()
  );

  const handleBulkMoveToToday = () => {
    if (onBulkMoveToToday) {
      onBulkMoveToToday(workStatuses);
      setBulkMoveModalOpen(false);
    }
  };

  return (
    <>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-white">
            {title}
            <span className="ml-2 text-sm font-normal text-gray-400 bg-gray-900 px-2 py-1 rounded-full">
              {count} {count === 1 ? "item" : "items"}
            </span>
          </h2>

          <div className="flex gap-2">
            {/* Bulk Move to Today button - only show if there are non-today items */}
            {onBulkMoveToToday && hasNonTodayItems && (
              <Button
                variant="outline"
                size="sm"
                className="flex items-center gap-2 text-green-500 border-green-500 hover:bg-green-500 hover:text-white"
                onClick={() => setBulkMoveModalOpen(true)}
              >
                <CalendarPlus className="w-4 h-4" />
                Move All to Today
              </Button>
            )}
            <Button
              variant="outline"
              size="sm"
              className="flex items-center gap-2"
              onClick={() => setIsModalOpen(true)}
              disabled={workStatuses.length === 0}
            >
              <ClipboardCopy className="w-4 h-4" />
              Copy Status
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {workStatuses.map((status) => (
            <StatusCard
              key={status.id}
              workStatus={status}
              onEdit={onEdit}
              onDelete={onDelete}
              onMoveToToday={onMoveToToday}
            />
          ))}
        </div>

        <CopyStatusModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          workStatuses={workStatuses}
          title={title}
          onBulkMoveToToday={onBulkMoveToToday}
        />
      </div>

      {/* Bulk Move Confirmation Modal */}
      <ConfirmModal
        isOpen={bulkMoveModalOpen}
        onClose={() => setBulkMoveModalOpen(false)}
        onConfirm={handleBulkMoveToToday}
        title="Move All to Today"
        description={`Move all ${workStatuses.length} items from ${title} to today? Status will be reset to "To Do" and today's effort will be cleared for all items.`}
        confirmText="Move All to Today"
        cancelText="Cancel"
        variant="info"
      />
    </>
  );
}

// Helper function to format date for display
function formatDateDisplay(date: Date): string {
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  if (date.toDateString() === today.toDateString()) {
    return "Today";
  } else if (date.toDateString() === yesterday.toDateString()) {
    return "Yesterday";
  } else {
    return date.toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  }
}

// Helper function to parse effort string to minutes
function parseEffortToMinutes(effortString: string): number {
  if (!effortString || effortString === "0h" || effortString === "-") return 0;

  let totalMinutes = 0;

  try {
    // Extract numeric values from the formatted string
    const daysMatch = effortString.match(/(\d+)d/);
    const hoursMatch = effortString.match(/(\d+)h/);
    const minutesMatch = effortString.match(/(\d+)m/);

    if (daysMatch) totalMinutes += parseInt(daysMatch[1]) * 8 * 60; // 8 hours per day
    if (hoursMatch) totalMinutes += parseInt(hoursMatch[1]) * 60;
    if (minutesMatch) totalMinutes += parseInt(minutesMatch[1]);

    return totalMinutes;
  } catch (error) {
    console.error("Error parsing effort string:", effortString, error);
    return 0;
  }
}

// Helper function to format minutes to readable string
function formatMinutesToReadable(totalMinutes: number): string {
  if (totalMinutes <= 0) return "0h";

  const days = Math.floor(totalMinutes / (8 * 60));
  const remainingMinutes = totalMinutes % (8 * 60);
  const hours = Math.floor(remainingMinutes / 60);
  const minutes = remainingMinutes % 60;

  const parts = [];
  if (days > 0) parts.push(`${days}d`);
  if (hours > 0) parts.push(`${hours}h`);
  if (minutes > 0) parts.push(`${minutes}m`);

  return parts.join(" ") || "0h";
}

export default function Home() {
  const router = useRouter();
  const { user, isLoading: userLoading } = useUser();
  const { toast } = useToast();
  const [workStatusData, setWorkStatusData] = useState<WorkStatusData>({});
  const [isLoading, setIsLoading] = useState(true);

  // Memoize the fetch function
  const fetchWorkStatusData = useCallback(async () => {
    if (!user) {
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);

      // Get all work statuses for the user
      const result = await getAllWorkStatuses(user.id);

      if (result.success && result.data) {
        // Get dates for the last 7 days
        const today = new Date();
        const last7Days: { [key: string]: WorkStatus[] } = {};

        // Initialize last 7 days with empty arrays
        for (let i = 0; i < 7; i++) {
          const date = new Date(today);
          date.setDate(date.getDate() - i);
          const dateKey = date.toDateString();
          last7Days[dateKey] = [];
        }

        // Group work statuses by date for the last 7 days
        result.data.forEach((status: WorkStatus) => {
          const statusDate = new Date(status.date);
          const statusDateKey = statusDate.toDateString();

          // Only include statuses from the last 7 days
          const sevenDaysAgo = new Date(today);
          sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6); // -6 to include today (7 days total)
          sevenDaysAgo.setHours(0, 0, 0, 0);

          if (statusDate >= sevenDaysAgo) {
            if (!last7Days[statusDateKey]) {
              last7Days[statusDateKey] = [];
            }
            last7Days[statusDateKey].push(status);
          }
        });

        setWorkStatusData(last7Days);
      }
    } catch (error) {
      console.error("Error fetching work status data:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to fetch work status data",
      });
    } finally {
      setIsLoading(false);
    }
  }, [user, toast]);

  // Fetch work status data when user is available
  useEffect(() => {
    fetchWorkStatusData();
  }, [fetchWorkStatusData]);

  // Handle edit button click
  const handleEdit = (ticketNumber: string) => {
    router.push(`/${ticketNumber}`);
  };

  // Handle delete button click
  const handleDelete = async (id: string, ticketNumber: string) => {
    if (!user) return;

    try {
      const result = await deleteWorkStatus(id, user.id);
      if (result.success) {
        // Refresh the data
        await fetchWorkStatusData();
        toast({
          variant: "success",
          title: "Success",
          description: `Successfully deleted ${ticketNumber}`,
        });
      } else {
        toast({
          variant: "destructive",
          title: "Error",
          description: result.error || "Failed to delete work status",
        });
      }
    } catch (error) {
      console.error("Error deleting work status:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to delete work status",
      });
    }
  };

  // Handle move to today button click
  const handleMoveToToday = async (id: string, ticketNumber: string) => {
    if (!user) return;

    try {
      const result = await duplicateWorkStatusForToday(id, user.id);
      if (result.success) {
        // Refresh the data to show the new entry
        await fetchWorkStatusData();
        toast({
          variant: "success",
          title: "Success",
          description: `Successfully moved ${ticketNumber} to today`,
        });
      } else {
        toast({
          variant: "destructive",
          title: "Error",
          description: result.error || 'Failed to move work status to today',
        });
      }
    } catch (error) {
      console.error('Error moving work status to today:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: 'Failed to move work status to today',
      });
    }
  };

  // Handle bulk move to today
  const handleBulkMoveToToday = async (workStatuses: WorkStatus[]) => {
    if (!user) return;

    try {
      let successCount = 0;
      let errorCount = 0;

      // Process each work status sequentially
      for (const status of workStatuses) {
        // Only move items that are not from today
        if (new Date(status.date).toDateString() !== new Date().toDateString()) {
          const result = await duplicateWorkStatusForToday(status.id, user.id);
          if (result.success) {
            successCount++;
          } else {
            errorCount++;
          }
        }
      }

      // Refresh data
      await fetchWorkStatusData();

      // Show result message
      if (errorCount === 0) {
        toast({
          variant: "success",
          title: "Success",
          description: `Successfully moved ${successCount} items to today`,
        });
      } else {
        toast({
          variant: "warning",
          title: "Partial Success",
          description: `Moved ${successCount} items to today, ${errorCount} failed`,
        });
      }
    } catch (error) {
      console.error('Error in bulk move to today:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: 'Failed to move items to today',
      });
    }
  };

  // Calculate total today's effort from real data
  const todayKey = new Date().toDateString();
  const totalTodayEffort = (workStatusData[todayKey] || []).reduce(
    (total, status: WorkStatus) => {
      return total + parseEffortToMinutes(status.effortTodayFormatted);
    },
    0,
  );

  // Format the total effort for display
  const formattedTotalEffort = formatMinutesToReadable(totalTodayEffort);

  // Get sorted dates for display (newest first)
  const sortedDates = Object.keys(workStatusData).sort((a, b) => {
    return new Date(b).getTime() - new Date(a).getTime();
  });

  // Calculate total items across all days
  const totalItems = Object.values(workStatusData).reduce((total, statuses) => {
    return total + statuses.length;
  }, 0);

  // Calculate completed items across all days
  const completedItems = Object.values(workStatusData).reduce(
    (total, statuses) => {
      return (
        total +
        statuses.filter((item: WorkStatus) => item.status === "Done").length
      );
    },
    0,
  );

  // Calculate in progress items for today
  const todayInProgressItems = (workStatusData[todayKey] || []).filter(
    (item: WorkStatus) => item.status === "In Progress",
  ).length;

  if (userLoading || isLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-white">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black">
      {/* Header */}
      <div className="border-b border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-3xl font-bold text-white">Work Status</h1>
              <p className="text-gray-400 mt-1">
                Track your daily progress and efforts
              </p>
            </div>
            <Button
              onClick={() => router.push("/create")}
              className="flex items-center space-x-2 bg-white text-black hover:bg-gray-200 border-0"
              variant="outline"
            >
              <Plus className="h-4 w-4" />
              <span>Create Status</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="bg-black border-gray-800">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-white">
                Last 7 Days Items
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">{totalItems}</div>
              <p className="text-xs text-gray-400">Total work items</p>
            </CardContent>
          </Card>
          <Card className="bg-black border-gray-800">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-white">
                Today&lsquo;s Effort
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">
                {formattedTotalEffort}
              </div>
              <p className="text-xs text-gray-400">Total time spent today</p>
            </CardContent>
          </Card>
          <Card className="bg-black border-gray-800">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-white">
                In Progress
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">
                {todayInProgressItems}
              </div>
              <p className="text-xs text-gray-400">Active tasks today</p>
            </CardContent>
          </Card>
          <Card className="bg-black border-gray-800">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-white">
                Completed
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">
                {completedItems}
              </div>
              <p className="text-xs text-gray-400">Last 7 days</p>
            </CardContent>
          </Card>
        </div>

        {/* Work Status by Day */}
        <div className="space-y-8">
          {sortedDates.map((dateKey) => (
            <DaySection
              key={dateKey}
              title={formatDateDisplay(new Date(dateKey))}
              workStatuses={workStatusData[dateKey]}
              count={workStatusData[dateKey].length}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onMoveToToday={handleMoveToToday}
              onBulkMoveToToday={handleBulkMoveToToday}
            />
          ))}
        </div>

        {/* Empty State */}
        {!isLoading && totalItems === 0 && (
          <div className="text-center py-12">
            <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-white">
              No work status yet
            </h3>
            <p className="text-gray-400 mt-1 mb-4">
              Get started by creating your first work status entry.
            </p>
            <Button
              onClick={() => router.push("/create")}
              className="bg-white text-black hover:bg-gray-200"
            >
              <Plus className="h-4 w-4 mr-2" />
              Create First Status
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
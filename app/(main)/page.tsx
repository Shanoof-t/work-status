// app/page.tsx
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
import { Calendar, Clock, ArrowRight, Plus, ClipboardCopy, Edit, Trash2 } from "lucide-react";
import { useState, useEffect } from "react";
import { CopyStatusModal } from "./components/copy-status-modal";
import { useUser } from "../context/UserContext";
import { getAllWorkStatuses, deleteWorkStatus } from "../../lib/actions/work_status_actions";

const statusColors = {
  "To Do": "bg-gray-100 text-gray-800",
  "In Progress": "bg-blue-100 text-blue-800",
  "Code Review": "bg-purple-100 text-purple-800",
  "DQA": "bg-orange-100 text-orange-800",
  "Ready for QA": "bg-yellow-100 text-yellow-800",
  "Done": "bg-green-100 text-green-800",
  "Blocked": "bg-red-100 text-red-800",
};

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

interface WorkStatusData {
  today: WorkStatus[];
  yesterday: WorkStatus[];
  thisWeek: WorkStatus[];
}

function StatusCard({
  workStatus,
  onEdit,
  onDelete,
}: {
  workStatus: WorkStatus;
  onEdit: (ticketNumber: string) => void;
  onDelete: (id: string, ticketNumber: string) => void;
}) {
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    if (confirm(`Are you sure you want to delete ${workStatus.ticketNumber}?`)) {
      setIsDeleting(true);
      await onDelete(workStatus.id, workStatus.ticketNumber);
      setIsDeleting(false);
    }
  };

  return (
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
            <Badge className={statusColors[workStatus.status as keyof typeof statusColors]}>
              {workStatus.status}
            </Badge>
            <div className="flex gap-1">
              <Button
                variant="outline"
                size="sm"
                onClick={() => onEdit(workStatus.ticketNumber)}
                className="h-8 w-8 p-0"
              >
                <Edit className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleDelete}
                disabled={isDeleting}
                className="h-8 w-8 p-0 text-red-500 hover:text-red-700 border-red-500 hover:border-red-700"
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
              <div className="text-gray-400">{workStatus.effortTodayFormatted}</div>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Calendar className="h-4 w-4 text-gray-400" />
            <div>
              <div className="font-medium text-white">Total</div>
              <div className="text-gray-400">{workStatus.totalEffortFormatted}</div>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <ArrowRight className="h-4 w-4 text-gray-400" />
            <div>
              <div className="font-medium text-white">Estimated</div>
              <div className="text-gray-400">{workStatus.estimatedEffortFormatted}</div>
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
  );
}

interface DaySectionProps {
  title: string;
  workStatuses: WorkStatus[];
  count: number;
  onEdit: (ticketNumber: string) => void;
  onDelete: (id: string, ticketNumber: string) => void;
}

export function DaySection({ title, workStatuses, count, onEdit, onDelete }: DaySectionProps) {
  const router = useRouter();
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-white">
          {title}
          <span className="ml-2 text-sm font-normal text-gray-400 bg-gray-900 px-2 py-1 rounded-full">
            {count} {count === 1 ? "item" : "items"}
          </span>
        </h2>

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

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {workStatuses.map((status) => (
          <StatusCard 
            key={status.id} 
            workStatus={status} 
            onEdit={onEdit}
            onDelete={onDelete}
          />
        ))}
      </div>

      <CopyStatusModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        workStatuses={workStatuses}
        title={title}
      />
    </div>
  );
}

export default function Home() {
  const router = useRouter();
  const { user, isLoading: userLoading } = useUser();
  const [workStatusData, setWorkStatusData] = useState<WorkStatusData>({
    today: [],
    yesterday: [],
    thisWeek: []
  });
  const [isLoading, setIsLoading] = useState(true);

  // Fetch work status data when user is available
  useEffect(() => {
    fetchWorkStatusData();
  }, [user]);

  async function fetchWorkStatusData() {
    if (!user) {
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      
      // Get all work statuses for the user
      const result = await getAllWorkStatuses(user.id);
      
      if (result.success && result.data) {
        // Group the data by date
        const today = new Date();
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        const weekAgo = new Date(today);
        weekAgo.setDate(weekAgo.getDate() - 7);

        const groupedData: WorkStatusData = {
          today: result.data.filter((status: any) => {
            const statusDate = new Date(status.date);
            return statusDate.toDateString() === today.toDateString();
          }),
          yesterday: result.data.filter((status: any) => {
            const statusDate = new Date(status.date);
            return statusDate.toDateString() === yesterday.toDateString();
          }),
          thisWeek: result.data.filter((status: any) => {
            const statusDate = new Date(status.date);
            return statusDate >= weekAgo && statusDate < yesterday;
          })
        };

        setWorkStatusData(groupedData);
      }
    } catch (error) {
      console.error('Error fetching work status data:', error);
    } finally {
      setIsLoading(false);
    }
  }

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
      } else {
        alert(result.error || 'Failed to delete work status');
      }
    } catch (error) {
      console.error('Error deleting work status:', error);
      alert('Failed to delete work status');
    }
  };

  // Calculate total today's effort from real data
  const totalTodayEffort = workStatusData.today.reduce((total, status: any) => {
    // Only count non-negative values (skip -1 values)
    const days = status.effortTodayDays >= 0 ? status.effortTodayDays : 0;
    const hours = status.effortTodayHours >= 0 ? status.effortTodayHours : 0;
    const minutes = status.effortTodayMinutes >= 0 ? status.effortTodayMinutes : 0;
    
    return total + (days * 8 * 60) + (hours * 60) + minutes;
  }, 0);

  // Convert minutes back to days/hours/minutes for display
  const totalDays = Math.floor(totalTodayEffort / (8 * 60));
  const remainingMinutes = totalTodayEffort % (8 * 60);
  const totalHours = Math.floor(remainingMinutes / 60);
  const totalMins = remainingMinutes % 60;

  const formattedTotalEffort =
    (totalDays > 0 ? `${totalDays}d ` : "") +
    (totalHours > 0 ? `${totalHours}h ` : "") +
    (totalMins > 0 ? `${totalMins}m` : "");

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
                Today's Items
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">
                {workStatusData.today.length}
              </div>
              <p className="text-xs text-gray-400">Active work items</p>
            </CardContent>
          </Card>
          <Card className="bg-black border-gray-800">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-white">
                Today's Effort
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">
                {formattedTotalEffort || "0h"}
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
                {workStatusData.today.filter((item: any) => item.status === "In Progress").length}
              </div>
              <p className="text-xs text-gray-400">Active tasks</p>
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
                {workStatusData.thisWeek.filter((item: any) => item.status === "Done").length}
              </div>
              <p className="text-xs text-gray-400">This week</p>
            </CardContent>
          </Card>
        </div>

        {/* Work Status by Day */}
        <div className="space-y-8">
          <DaySection
            title="Today"
            workStatuses={workStatusData.today}
            count={workStatusData.today.length}
            onEdit={handleEdit}
            onDelete={handleDelete}
          />

          <DaySection
            title="Yesterday"
            workStatuses={workStatusData.yesterday}
            count={workStatusData.yesterday.length}
            onEdit={handleEdit}
            onDelete={handleDelete}
          />

          <DaySection
            title="This Week"
            workStatuses={workStatusData.thisWeek}
            count={workStatusData.thisWeek.length}
            onEdit={handleEdit}
            onDelete={handleDelete}
          />
        </div>

        {/* Empty State */}
        {!isLoading && workStatusData.today.length === 0 && workStatusData.yesterday.length === 0 && workStatusData.thisWeek.length === 0 && (
          <div className="text-center py-12">
            <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-white">No work status yet</h3>
            <p className="text-gray-400 mt-1 mb-4">Get started by creating your first work status entry.</p>
            <Button onClick={() => router.push("/create")} className="bg-white text-black hover:bg-gray-200">
              <Plus className="h-4 w-4 mr-2" />
              Create First Status
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
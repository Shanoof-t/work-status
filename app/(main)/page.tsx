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
import { Calendar, Clock, ArrowRight, Plus, ClipboardCopy } from "lucide-react";
import { useState } from "react";
import { CopyStatusModal } from "./components/copy-status-modal";

// Sample data - grouped by days
const sampleWorkStatus = {
  today: [
    {
      id: "1",
      ticketNumber: "DCV2-971",
      title: "Action button misalignment in dashboard",
      status: "DQA" as const,
      effortToday: "1d 2h 30m",
      totalEffort: "1d 2h 30m",
      estimatedEffort: "2d 0h 0m",
      date: new Date(),
    },
    {
      id: "2",
      ticketNumber: "DCV2-972",
      title: "Fix user authentication flow",
      status: "In Progress" as const,
      effortToday: "0d 4h 15m",
      totalEffort: "1d 6h 45m",
      estimatedEffort: "3d 0h 0m",
      date: new Date(),
    },
    {
      id: "3",
      ticketNumber: "DCV2-972",
      title: "Fix user authentication flow",
      status: "In Progress" as const,
      effortToday: "0d 4h 15m",
      totalEffort: "1d 6h 45m",
      estimatedEffort: "3d 0h 0m",
      date: new Date(),
    },
  ],
  yesterday: [
    {
      id: "3",
      ticketNumber: "DCV2-969",
      title: "Implement dark mode toggle",
      status: "Code Review" as const,
      effortToday: "0d 6h 0m",
      totalEffort: "2d 4h 30m",
      estimatedEffort: "2d 0h 0m",
      date: new Date(Date.now() - 86400000),
    },
    {
      id: "4",
      ticketNumber: "DCV2-970",
      title: "Optimize database queries",
      status: "Done" as const,
      effortToday: "0d 3h 45m",
      totalEffort: "1d 2h 15m",
      estimatedEffort: "1d 0h 0m",
      date: new Date(Date.now() - 86400000),
    },
  ],
  thisWeek: [
    {
      id: "5",
      ticketNumber: "DCV2-968",
      title: "Add user profile page",
      status: "Done" as const,
      effortToday: "0d 0h 0m",
      totalEffort: "3d 2h 0m",
      estimatedEffort: "4d 0h 0m",
      date: new Date(Date.now() - 172800000),
    },
    {
      id: "6",
      ticketNumber: "DCV2-967",
      title: "Fix mobile responsive issues",
      status: "Done" as const,
      effortToday: "0d 0h 0m",
      totalEffort: "2d 5h 30m",
      estimatedEffort: "3d 0h 0m",
      date: new Date(Date.now() - 259200000),
    },
  ],
};

const statusColors = {
  "To Do": "bg-gray-100 text-gray-800",
  "In Progress": "bg-blue-100 text-blue-800",
  "Code Review": "bg-purple-100 text-purple-800",
  DQA: "bg-orange-100 text-orange-800",
  "Ready for QA": "bg-yellow-100 text-yellow-800",
  Done: "bg-green-100 text-green-800",
  Blocked: "bg-red-100 text-red-800",
};

function StatusCard({
  workStatus,
}: {
  workStatus: (typeof sampleWorkStatus.today)[0];
}) {
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
          <Badge className={statusColors[workStatus.status]}>
            {workStatus.status}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="pb-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div className="flex items-center space-x-2">
            <Clock className="h-4 w-4 text-gray-400" />
            <div>
              <div className="font-medium text-white">Today</div>
              <div className="text-gray-400">{workStatus.effortToday}</div>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Calendar className="h-4 w-4 text-gray-400" />
            <div>
              <div className="font-medium text-white">Total</div>
              <div className="text-gray-400">{workStatus.totalEffort}</div>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <ArrowRight className="h-4 w-4 text-gray-400" />
            <div>
              <div className="font-medium text-white">Estimated</div>
              <div className="text-gray-400">{workStatus.estimatedEffort}</div>
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

interface WorkStatus {
  id: string
  ticketNumber: string
  title: string
  status: string
  effortToday: string
  totalEffort: string
  estimatedEffort: string
  date: Date
}

interface DaySectionProps {
  title: string
  workStatuses: WorkStatus[]
  count: number
}

export function DaySection({ title, workStatuses, count }: DaySectionProps) {
  const router = useRouter()
  const [isModalOpen, setIsModalOpen] = useState(false)

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
          <StatusCard key={status.id} workStatus={status} />
        ))}
      </div>

      <CopyStatusModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        workStatuses={workStatuses}
        title={title}
      />
    </div>
  )
}

export default function Home() {
  const router = useRouter();

  const totalTodayEffort = sampleWorkStatus.today.reduce((total, status) => {
    const match = status.effortToday.match(/(\d+)d\s*(\d+)h\s*(\d+)m/);
    if (match) {
      const days = parseInt(match[1]) || 0;
      const hours = parseInt(match[2]) || 0;
      const minutes = parseInt(match[3]) || 0;
      return total + days * 8 * 60 + hours * 60 + minutes; // Convert to minutes
    }
    return total;
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
              {/* <Plus className="w-4 h-4" /> */}
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
                {sampleWorkStatus.today.length}
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
                {
                  sampleWorkStatus.today.filter(
                    (item) => item.status === "In Progress"
                  ).length
                }
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
                {
                  sampleWorkStatus.thisWeek.filter(
                    (item) => item.status === "Done"
                  ).length
                }
              </div>
              <p className="text-xs text-gray-400">This week</p>
            </CardContent>
          </Card>
        </div>

        {/* Work Status by Day */}
        <div className="space-y-8">
          <DaySection
            title="Today"
            workStatuses={sampleWorkStatus.today}
            count={sampleWorkStatus.today.length}
          />

          <DaySection
            title="Yesterday"
            workStatuses={sampleWorkStatus.yesterday}
            count={sampleWorkStatus.yesterday.length}
          />

          <DaySection
            title="This Week"
            workStatuses={sampleWorkStatus.thisWeek}
            count={sampleWorkStatus.thisWeek.length}
          />
        </div>

        {/* Empty State (commented out for now) */}

        {/* <div className="text-center py-12">
          <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-white">No work status yet</h3>
          <p className="text-gray-400 mt-1 mb-4">Get started by creating your first work status entry.</p>
          <Button onClick={() => router.push("/create")} className="bg-white text-black hover:bg-gray-200">
            <Plus className="h-4 w-4 mr-2" />
            Create First Status
          </Button>
        </div> */}
      </div>
    </div>
  );
}
// app/[ticketNumber]/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import WorkStatusForm from "../components/work-status-form";
import { useUser } from "@/app/context/UserContext";
import { getWorkStatusByTicketNumber } from "../../../lib/actions/work_status_actions";

interface WorkStatusData {
  id: string;
  ticketNumber: string;
  title: string;
  status: string;
  effortTodayFormatted: string;
  totalEffortFormatted: string;
  estimatedEffortFormatted: string;
  date: Date;
  createdAt: Date;
  updatedAt: Date;
  effortTodayDays: number;
  effortTodayHours: number;
  effortTodayMinutes: number;
  totalEffortDays: number;
  totalEffortHours: number;
  totalEffortMinutes: number;
  estimatedEffortDays: number;
  estimatedEffortHours: number;
  estimatedEffortMinutes: number;
  userId: string;
}

export default function EditWorkStatusPage() {
  const params = useParams();
  const router = useRouter();
  const { user, isLoading: userLoading } = useUser();
  const [workStatus, setWorkStatus] = useState<WorkStatusData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const ticketNumber = params.ticketNumber as string;

  useEffect(() => {
    async function fetchWorkStatus() {
      if (!user) return;

      try {
        setIsLoading(true);
        const result = await getWorkStatusByTicketNumber(ticketNumber, user.id);

        if (result.success) {
          setWorkStatus(result.data as WorkStatusData);
        } else {
          setError(result.error || "Work status not found");
        }
      } catch (error) {
        setError("Failed to fetch work status");
        console.error("Error fetching work status:", error);
      } finally {
        setIsLoading(false);
      }
    }

    if (user) {
      fetchWorkStatus();
    }
  }, [user, ticketNumber]);

  if (userLoading || isLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-white">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-white">Please log in to edit work status</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="text-white text-xl mb-4">{error}</div>
          <button
            onClick={() => router.push("/")}
            className="text-blue-400 hover:text-blue-300"
          >
            Go back to home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex justify-center items-center">
      <WorkStatusForm
        workStatus={workStatus}
        isEdit={true}
        ticketNumber={ticketNumber}
      />
    </div>
  );
}

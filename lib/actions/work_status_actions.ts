"use server";

import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";

// Types
export type WorkStatus = {
  id?: string;
  date: Date;
  ticketNumber: string;
  title: string;
  status: string;
  effortTodayDays: number;
  effortTodayHours: number;
  effortTodayMinutes: number;
  totalEffortDays: number;
  totalEffortHours: number;
  totalEffortMinutes: number;
  estimatedEffortDays: number;
  estimatedEffortHours: number;
  estimatedEffortMinutes: number;
  createdAt?: Date;
  updatedAt?: Date;
  userId: string;
};

// Helper function to parse time string (e.g., "1d 2h 30m")
function parseTimeString(timeString: string) {
  // Default to -1 if empty or invalid (meaning unset)
  let days = -1;
  let hours = -1;
  let minutes = -1;

  if (timeString && timeString.trim() !== "") {
    const dayMatch = timeString.match(/(\d+)d/);
    const hourMatch = timeString.match(/(\d+)h/);
    const minuteMatch = timeString.match(/(\d+)m/);

    days = dayMatch ? parseInt(dayMatch[1]) : -1;
    hours = hourMatch ? parseInt(hourMatch[1]) : -1;
    minutes = minuteMatch ? parseInt(minuteMatch[1]) : -1;
  }

  return { days, hours, minutes };
}

function formatTimeString(
  days: number,
  hours: number,
  minutes: number,
): string {
  const parts = [];
  if (days >= 0) parts.push(`${days}d`);
  if (hours >= 0) parts.push(`${hours}h`);
  if (minutes >= 0) parts.push(`${minutes}m`);

  // If all are -1 (unset), return empty string (showing just d/h/m in UI)
  return parts.join(" ") || "";
}

// Create Work Status
export async function createWorkStatus(formData: FormData) {
  try {
    const effortToday = formData.get("effortToday") as string;
    const totalEffort = formData.get("totalEffort") as string;
    const estimatedEffort = formData.get("estimatedEffort") as string;
    const userId = formData.get("userId") as string;
    const ticketNumber = formData.get("ticketNumber") as string;

    // Validate userId exists
    if (!userId) {
      return { error: "User not authenticated" };
    }

    const duplicateCheck = await checkDuplicateTicketNumber(
      ticketNumber,
      userId,
    );

    if (duplicateCheck.exists) {
      return {
        error: "Another work status with this ticket number already exists",
      };
    }

    const effortTodayParsed = parseTimeString(effortToday);
    const totalEffortParsed = parseTimeString(totalEffort);
    const estimatedEffortParsed = parseTimeString(estimatedEffort);

    // Build data object, only include fields that are not -1 (unset)
    const data: WorkStatus = {
      date: new Date(formData.get("date") as string),
      ticketNumber: ticketNumber,
      title: formData.get("title") as string,
      status: formData.get("status") as string,
      userId: userId,
      effortTodayDays: effortTodayParsed.days,
      effortTodayHours: effortTodayParsed.hours,
      effortTodayMinutes: effortTodayParsed.minutes,

      estimatedEffortDays: estimatedEffortParsed.days,
      estimatedEffortHours: estimatedEffortParsed.hours,
      estimatedEffortMinutes: estimatedEffortParsed.minutes,

      totalEffortDays: totalEffortParsed.days,
      totalEffortHours: totalEffortParsed.hours,
      totalEffortMinutes: totalEffortParsed.minutes,
    };

    // Validate required fields
    if (!data.date || !data.ticketNumber || !data.title || !data.status) {
      return { error: "Missing required fields" };
    }

    console.log("Creating with data:", data);
    const workStatus = await prisma.workStatus.create({
      data: data,
    });

    revalidatePath("/");
    return { success: true, data: workStatus };
  } catch (error) {
    console.error("Error creating work status:", error);
    return { error: "Failed to create work status" };
  }
}

// Update Work Status
export async function updateWorkStatus(
  id: string,
  formData: FormData,
  userId: string,
) {
  try {
    const ticketNumber = formData.get("ticketNumber") as string;
    console.log(" from update id:", id)
    // Check for duplicate ticket number
    const duplicateCheck = await checkDuplicateTicketNumber(
      ticketNumber,
      userId,
      id,
    );
    if (duplicateCheck.exists) {
      return {
        error: "Another work status with this ticket number already exists",
      };
    }

    // First verify the work status belongs to the user
    const existingStatus = await prisma.workStatus.findFirst({
      where: { id, userId },
    });

    if (!existingStatus) {
      return { error: "Work status not found or access denied" };
    }

    const effortToday = formData.get("effortToday") as string;
    const totalEffort = formData.get("totalEffort") as string;
    const estimatedEffort = formData.get("estimatedEffort") as string;

    const effortTodayParsed = parseTimeString(effortToday);
    const totalEffortParsed = parseTimeString(totalEffort);
    const estimatedEffortParsed = parseTimeString(estimatedEffort);

    const updateData: WorkStatus = {
      date: new Date(formData.get("date") as string),
      ticketNumber: ticketNumber,
      title: formData.get("title") as string,
      status: formData.get("status") as string,
      userId: userId,
      effortTodayDays: effortTodayParsed.days,
      effortTodayHours: effortTodayParsed.hours,
      effortTodayMinutes: effortTodayParsed.minutes,

      estimatedEffortDays: estimatedEffortParsed.days,
      estimatedEffortHours: estimatedEffortParsed.hours,
      estimatedEffortMinutes: estimatedEffortParsed.minutes,

      totalEffortDays: totalEffortParsed.days,
      totalEffortHours: totalEffortParsed.hours,
      totalEffortMinutes: totalEffortParsed.minutes,
    };
    console.log("Updating with data:", updateData);
    const workStatus = await prisma.workStatus.update({
      where: { id },
      data: updateData,
    });

    revalidatePath("/");
    return { success: true, data: workStatus };
  } catch (error) {
    console.error("Error updating work status:", error);
    return { error: "Failed to update work status" };
  }
}

// Delete Work Status
export async function deleteWorkStatus(id: string, userId: string) {
  try {
    // First verify the work status belongs to the user
    const existingStatus = await prisma.workStatus.findFirst({
      where: { id, userId },
    });

    if (!existingStatus) {
      return { error: "Work status not found or access denied" };
    }

    await prisma.workStatus.delete({
      where: { id },
    });

    revalidatePath("/");
    return { success: true };
  } catch (error) {
    console.error("Error deleting work status:", error);
    return { error: "Failed to delete work status" };
  }
}

// NEW: Duplicate work status for today
export async function duplicateWorkStatusForToday(
  id: string,
  userId: string,
) {
  try {
    // First verify the work status belongs to the user
    const existingStatus = await prisma.workStatus.findFirst({
      where: { id, userId },
    });

    if (!existingStatus) {
      return { error: "Work status not found or access denied" };
    }
    console.log("existingStatus existing check", existingStatus)
    // Create a new work status with today's date and same data
    const newWorkStatus = await prisma.workStatus.create({
      data: {
        date: new Date(), // Today's date
        ticketNumber: existingStatus.ticketNumber,
        title: existingStatus.title,
        status: "To Do", // Reset status to "To Do" when moving to today
        effortTodayDays: -1, // Reset today's effort
        effortTodayHours: -1,
        effortTodayMinutes: -1,
        totalEffortDays: existingStatus.totalEffortDays,
        totalEffortHours: existingStatus.totalEffortHours,
        totalEffortMinutes: existingStatus.totalEffortMinutes,
        estimatedEffortDays: existingStatus.estimatedEffortDays,
        estimatedEffortHours: existingStatus.estimatedEffortHours,
        estimatedEffortMinutes: existingStatus.estimatedEffortMinutes,
        userId: existingStatus.userId,
      },
    });
console.log("newWorkStatus existing check", newWorkStatus)
    revalidatePath("/");
    return { success: true, data: newWorkStatus };
  } catch (error) {
    console.error("Error duplicating work status for today:", error);
    return { error: "Failed to duplicate work status" };
  }
}

// Get all work statuses for a specific user with formatted time
export async function getAllWorkStatuses(userId: string) {
  try {
    if (!userId) {
      return { error: "User not authenticated" };
    }

    const workStatuses = await prisma.workStatus.findMany({
      where: { userId },
      orderBy: {
        date: "desc",
      },
    });

    // Format the time strings for display - skip -1 values
    const formattedWorkStatuses = workStatuses.map((status) => ({
      ...status,
      effortTodayFormatted: formatTimeString(
        status.effortTodayDays,
        status.effortTodayHours,
        status.effortTodayMinutes,
      ),
      totalEffortFormatted: formatTimeString(
        status.totalEffortDays,
        status.totalEffortHours,
        status.totalEffortMinutes,
      ),
      estimatedEffortFormatted: formatTimeString(
        status.estimatedEffortDays,
        status.estimatedEffortHours,
        status.estimatedEffortMinutes,
      ),
    }));

    return { success: true, data: formattedWorkStatuses };
  } catch (error) {
    console.error("Error fetching work statuses:", error);
    return { error: "Failed to fetch work statuses" };
  }
}

// Get work statuses grouped by date for a specific user
export async function getWorkStatusesGroupedByDate(userId: string) {
  try {
    if (!userId) {
      return { error: "User not authenticated" };
    }

    const workStatuses = await prisma.workStatus.findMany({
      where: { userId },
      orderBy: {
        date: "desc",
      },
    });

    // Group by date
    const grouped: { [key: string]: WorkStatus[] } = {};

    workStatuses.forEach((status) => {
      const dateKey = status.date.toISOString().split("T")[0]; // YYYY-MM-DD

      if (!grouped[dateKey]) {
        grouped[dateKey] = [];
      }

      grouped[dateKey].push(status);
    });

    // Format each status with time strings
    const formattedGrouped: { [key: string]: unknown[] } = {};

    Object.keys(grouped).forEach((dateKey) => {
      formattedGrouped[dateKey] = grouped[dateKey].map((status) => ({
        ...status,
        effortTodayFormatted: formatTimeString(
          status.effortTodayDays,
          status.effortTodayHours,
          status.effortTodayMinutes,
        ),
        totalEffortFormatted: formatTimeString(
          status.totalEffortDays,
          status.totalEffortHours,
          status.totalEffortMinutes,
        ),
        estimatedEffortFormatted: formatTimeString(
          status.estimatedEffortDays,
          status.estimatedEffortHours,
          status.estimatedEffortMinutes,
        ),
      }));
    });

    return { success: true, data: formattedGrouped };
  } catch (error) {
    console.error("Error fetching grouped work statuses:", error);
    return { error: "Failed to fetch work statuses" };
  }
}

// Get today's work statuses for a specific user
export async function getTodayWorkStatuses(userId: string) {
  try {
    if (!userId) {
      return { error: "User not authenticated" };
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const workStatuses = await prisma.workStatus.findMany({
      where: {
        userId,
        date: {
          gte: today,
          lt: tomorrow,
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    // Format the time strings for display
    const formattedWorkStatuses = workStatuses.map((status) => ({
      ...status,
      effortTodayFormatted: formatTimeString(
        status.effortTodayDays,
        status.effortTodayHours,
        status.effortTodayMinutes,
      ),
      totalEffortFormatted: formatTimeString(
        status.totalEffortDays,
        status.totalEffortHours,
        status.totalEffortMinutes,
      ),
      estimatedEffortFormatted: formatTimeString(
        status.estimatedEffortDays,
        status.estimatedEffortHours,
        status.estimatedEffortMinutes,
      ),
    }));

    return { success: true, data: formattedWorkStatuses };
  } catch (error) {
    console.error("Error fetching today's work statuses:", error);
    return { error: "Failed to fetch today's work statuses" };
  }
}

// Get work statuses by date range for a specific user
export async function getWorkStatusesByDateRange(
  userId: string,
  startDate: Date,
  endDate: Date,
) {
  try {
    if (!userId) {
      return { error: "User not authenticated" };
    }

    const workStatuses = await prisma.workStatus.findMany({
      where: {
        userId,
        date: {
          gte: startDate,
          lte: endDate,
        },
      },
      orderBy: {
        date: "desc",
      },
    });

    // Format the time strings for display
    const formattedWorkStatuses = workStatuses.map((status) => ({
      ...status,
      effortTodayFormatted: formatTimeString(
        status.effortTodayDays,
        status.effortTodayHours,
        status.effortTodayMinutes,
      ),
      totalEffortFormatted: formatTimeString(
        status.totalEffortDays,
        status.totalEffortHours,
        status.totalEffortMinutes,
      ),
      estimatedEffortFormatted: formatTimeString(
        status.estimatedEffortDays,
        status.estimatedEffortHours,
        status.estimatedEffortMinutes,
      ),
    }));

    return { success: true, data: formattedWorkStatuses };
  } catch (error) {
    console.error("Error fetching work statuses by date range:", error);
    return { error: "Failed to fetch work statuses" };
  }
}

export async function checkDuplicateTicketNumber(
  ticketNumber: string,
  userId: string,
  excludeId?: string,
) {
  try {
    const whereClause: Prisma.WorkStatusWhereInput = {
      ticketNumber,
      userId,
    };

    if (excludeId) {
      whereClause.id = { not: excludeId };
    }

    const existing = await prisma.workStatus.findFirst({
      where: whereClause,
    });

    return { exists: !!existing, data: existing };
  } catch (error) {
    console.error("Error checking duplicate ticket:", error);
    return { exists: false, error: "Failed to check duplicate ticket" };
  }
}

// Get work status by ticket number
export async function getWorkStatusByTicketNumber(
  ticketNumber: string,
  userId: string,
) {
  try {
    if (!userId) {
      return { error: "User not authenticated" };
    }

    const workStatus = await prisma.workStatus.findFirst({
      where: {
        ticketNumber,
        userId,
      },
    });

    if (!workStatus) {
      return { error: "Work status not found" };
    }

    // Format the time strings for display
    const formattedWorkStatus = {
      ...workStatus,
      effortTodayFormatted: formatTimeString(
        workStatus.effortTodayDays,
        workStatus.effortTodayHours,
        workStatus.effortTodayMinutes,
      ),
      totalEffortFormatted: formatTimeString(
        workStatus.totalEffortDays,
        workStatus.totalEffortHours,
        workStatus.totalEffortMinutes,
      ),
      estimatedEffortFormatted: formatTimeString(
        workStatus.estimatedEffortDays,
        workStatus.estimatedEffortHours,
        workStatus.estimatedEffortMinutes,
      ),
    };

    return { success: true, data: formattedWorkStatus };
  } catch (error) {
    console.error("Error fetching work status:", error);
    return { error: "Failed to fetch work status" };
  }
}
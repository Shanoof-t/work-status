// lib/actions/work_status_actions.ts
"use server";

import { prisma } from "@/lib/prisma";

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
  // Default to 0 if empty or invalid
  let days = 0;
  let hours = 0;
  let minutes = 0;

  if (timeString && timeString.trim() !== "") {
    const dayMatch = timeString.match(/(\d+)d/);
    const hourMatch = timeString.match(/(\d+)h/);
    const minuteMatch = timeString.match(/(\d+)m/);

    days = dayMatch ? parseInt(dayMatch[1]) : 0;
    hours = hourMatch ? parseInt(hourMatch[1]) : 0;
    minutes = minuteMatch ? parseInt(minuteMatch[1]) : 0;
  }

  return { days, hours, minutes };
}

function formatTimeString(
  days: number,
  hours: number,
  minutes: number,
): string {
  const parts = [];
  if (days > 0) parts.push(`${days}d`);
  if (hours > 0) parts.push(`${hours}h`);
  if (minutes > 0) parts.push(`${minutes}m`);

  return parts.join(" ") || "0h";
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
      userId,
      ticketNumber,
    );

    if (duplicateCheck.exists) {
      return {
        error: "Another work status with this ticket number already exists",
      };
    }

    const effortTodayParsed = parseTimeString(effortToday);
    const totalEffortParsed = parseTimeString(totalEffort);
    const estimatedEffortParsed = parseTimeString(estimatedEffort);

    // Build data object
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

    // // Check for duplicate ticket number (excluding current id)
    // const duplicateCheck = await checkDuplicateTicketNumber(      
    //   userId,
    //   id,
    // );
    // if (duplicateCheck.exists) {
    //   return {
    //     error: "Another work status with this ticket number already exists",
    //   };
    // }

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

    const updateData = {
      date: new Date(formData.get("date") as string),
      ticketNumber: ticketNumber,
      title: formData.get("title") as string,
      status: formData.get("status") as string,
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

// Duplicate work status for today
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

    // Create a new work status with today's date and same data
    const newWorkStatus = await prisma.workStatus.create({
      data: {
        date: new Date(), // Today's date
        ticketNumber: existingStatus.ticketNumber,
        title: existingStatus.title,
        status: existingStatus.status, // Reset status to "To Do" when moving to today
        effortTodayDays: 0, // Reset today's effort
        effortTodayHours: 0,
        effortTodayMinutes: 0,
        totalEffortDays: existingStatus.totalEffortDays,
        totalEffortHours: existingStatus.totalEffortHours,
        totalEffortMinutes: existingStatus.totalEffortMinutes,
        estimatedEffortDays: existingStatus.estimatedEffortDays,
        estimatedEffortHours: existingStatus.estimatedEffortHours,
        estimatedEffortMinutes: existingStatus.estimatedEffortMinutes,
        userId: existingStatus.userId,
      },
    });

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
    console.error("Error fetching work statuses:", error);
    return { error: "Failed to fetch work statuses" };
  }
}

// Get work status by ID
export async function getWorkStatusById(id: string, userId: string) {
  try {
    if (!userId) {
      return { error: "User not authenticated" };
    }

    const workStatus = await prisma.workStatus.findFirst({
      where: {
        id,
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

// Get work status by ticket number and date
export async function getWorkStatusByTicketNumberAndDate(
  ticketNumber: string,
  userId: string,
  date: Date
) {
  try {
    if (!userId) {
      return { error: "User not authenticated" };
    }

    const workStatus = await prisma.workStatus.findFirst({
      where: {
        ticketNumber,
        userId,
        date: {
          equals: date
        }
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

export async function checkDuplicateTicketNumber(
  userId: string,
  ticketNumber: string,
  excludeId?: string,
) {
  try {
    const whereClause: { userId: string, ticketNumber: string, id?: { not: string; } } = {
      userId,
      ticketNumber
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
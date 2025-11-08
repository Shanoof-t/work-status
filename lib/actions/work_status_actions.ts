// lib/actions/work-status-actions.ts

'use server'

import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'

// Types
export type WorkStatus = {
    id: string
    date: Date
    ticketNumber: string
    title: string
    status: string
    effortTodayDays: number
    effortTodayHours: number
    effortTodayMinutes: number
    totalEffortDays: number
    totalEffortHours: number
    totalEffortMinutes: number
    estimatedEffortDays: number
    estimatedEffortHours: number
    estimatedEffortMinutes: number
    createdAt: Date
    updatedAt: Date
}

// Helper function to parse time string (e.g., "1d 2h 30m")
function parseTimeString(timeString: string) {
    let days = 0
    let hours = 0
    let minutes = 0

    const dayMatch = timeString.match(/(\d+)d/)
    const hourMatch = timeString.match(/(\d+)h/)
    const minuteMatch = timeString.match(/(\d+)m/)

    if (dayMatch) days = parseInt(dayMatch[1])
    if (hourMatch) hours = parseInt(hourMatch[1])
    if (minuteMatch) minutes = parseInt(minuteMatch[1])

    return { days, hours, minutes }
}

// Helper function to format time for display
function formatTimeString(days: number, hours: number, minutes: number): string {
    const parts = []
    if (days > 0) parts.push(`${days}d`)
    if (hours > 0) parts.push(`${hours}h`)
    if (minutes > 0) parts.push(`${minutes}m`)
    return parts.join(' ') || '0h'
}

// Create Work Status
export async function createWorkStatus(formData: FormData) {
    try {
        const effortToday = formData.get('effortToday') as string
        const totalEffort = formData.get('totalEffort') as string
        const estimatedEffort = formData.get('estimatedEffort') as string

        const effortTodayParsed = parseTimeString(effortToday)
        const totalEffortParsed = parseTimeString(totalEffort)
        const estimatedEffortParsed = parseTimeString(estimatedEffort)

        const rawFormData = {
            date: new Date(formData.get('date') as string),
            ticketNumber: formData.get('ticketNumber') as string,
            title: formData.get('title') as string,
            status: formData.get('status') as string,
            effortTodayDays: effortTodayParsed.days,
            effortTodayHours: effortTodayParsed.hours,
            effortTodayMinutes: effortTodayParsed.minutes,
            totalEffortDays: totalEffortParsed.days,
            totalEffortHours: totalEffortParsed.hours,
            totalEffortMinutes: totalEffortParsed.minutes,
            estimatedEffortDays: estimatedEffortParsed.days,
            estimatedEffortHours: estimatedEffortParsed.hours,
            estimatedEffortMinutes: estimatedEffortParsed.minutes,
        }

        // Validate required fields
        if (!rawFormData.date || !rawFormData.ticketNumber || !rawFormData.title || !rawFormData.status) {
            return { error: 'Missing required fields' }
        }

        const workStatus = await prisma.workStatus.create({
            data: rawFormData,
        })

        revalidatePath('/')
        return { success: true, data: workStatus }
    } catch (error) {
        console.error('Error creating work status:', error)
        return { error: 'Failed to create work status' }
    }
}

// Update Work Status
export async function updateWorkStatus(id: string, formData: FormData) {
    try {
        const effortToday = formData.get('effortToday') as string
        const totalEffort = formData.get('totalEffort') as string
        const estimatedEffort = formData.get('estimatedEffort') as string

        const effortTodayParsed = parseTimeString(effortToday)
        const totalEffortParsed = parseTimeString(totalEffort)
        const estimatedEffortParsed = parseTimeString(estimatedEffort)

        const rawFormData = {
            date: formData.get('date') ? new Date(formData.get('date') as string) : undefined,
            ticketNumber: formData.get('ticketNumber') as string,
            title: formData.get('title') as string,
            status: formData.get('status') as string,
            effortTodayDays: effortTodayParsed.days,
            effortTodayHours: effortTodayParsed.hours,
            effortTodayMinutes: effortTodayParsed.minutes,
            totalEffortDays: totalEffortParsed.days,
            totalEffortHours: totalEffortParsed.hours,
            totalEffortMinutes: totalEffortParsed.minutes,
            estimatedEffortDays: estimatedEffortParsed.days,
            estimatedEffortHours: estimatedEffortParsed.hours,
            estimatedEffortMinutes: estimatedEffortParsed.minutes,
        }

        // Remove undefined values
        const updateData = Object.fromEntries(
            Object.entries(rawFormData).filter(([_, value]) => value !== undefined)
        )

        const workStatus = await prisma.workStatus.update({
            where: { id },
            data: updateData,
        })

        revalidatePath('/')
        return { success: true, data: workStatus }
    } catch (error) {
        console.error('Error updating work status:', error)
        return { error: 'Failed to update work status' }
    }
}

// Get all work statuses with formatted time
export async function getAllWorkStatuses() {
    try {
        const workStatuses = await prisma.workStatus.findMany({
            orderBy: {
                date: 'desc',
            },
        })

        // Format the time strings for display
        const formattedWorkStatuses = workStatuses.map((status: any) => ({
            ...status,
            effortTodayFormatted: formatTimeString(
                status.effortTodayDays,
                status.effortTodayHours,
                status.effortTodayMinutes
            ),
            totalEffortFormatted: formatTimeString(
                status.totalEffortDays,
                status.totalEffortHours,
                status.totalEffortMinutes
            ),
            estimatedEffortFormatted: formatTimeString(
                status.estimatedEffortDays,
                status.estimatedEffortHours,
                status.estimatedEffortMinutes
            ),
        }))

        return { success: true, data: formattedWorkStatuses }
    } catch (error) {
        console.error('Error fetching work statuses:', error)
        return { error: 'Failed to fetch work statuses' }
    }
}
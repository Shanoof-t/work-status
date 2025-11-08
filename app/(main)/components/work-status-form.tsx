"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { createWorkStatus } from "@/lib/actions/work_status_actions";
import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@/app/context/UserContext";

const timeStringSchema = (fieldLabel: string) =>
  z
    .string()
    .min(1, `${fieldLabel} is required`)
    .refine(
      (value) => {
        const regex = /^(\d+d\s?)?(\d+h\s?)?(\d+m\s?)?$/;
        return regex.test(value.trim()) && value.trim() !== "";
      },
      {
        message: `${fieldLabel} must be in format like '1d 2h 30m'`,
      }
    );

// Form validation schema
const formSchema = z.object({
  date: z.date({ error: "Date is required" }),
  ticketNumber: z
    .string()
    .min(1, "Ticket number is required")
    .refine(
      (val) => val.trim() !== "DCV2-" && val.startsWith("DCV2-"),
      "Please complete the ticket number."
    ),
  title: z.string().min(1, "Title is required"),
  status: z.string().min(1, "Status is required"),
  effortToday: timeStringSchema("Effort Today"),
  totalEffort: timeStringSchema("Total Effort"),
  estimatedEffort: timeStringSchema("Estimated Effort"),
});

type FormValues = z.infer<typeof formSchema>;

// Time Selector Component
function TimeSelector({
  value,
  onChange,
  placeholder,
  hasError = false,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  hasError?: boolean;
}) {
  // Parse the current value into days, hours, minutes
  const parseTimeValue = (timeStr: string) => {
    let days = 0;
    let hours = 0;
    let minutes = 0;

    if (timeStr) {
      const daysMatch = timeStr.match(/(\d+)d/);
      const hoursMatch = timeStr.match(/(\d+)h/);
      const minutesMatch = timeStr.match(/(\d+)m/);

      days = daysMatch ? parseInt(daysMatch[1]) : 0;
      hours = hoursMatch ? parseInt(hoursMatch[1]) : 0;
      minutes = minutesMatch ? parseInt(minutesMatch[1]) : 0;
    }

    return { days, hours, minutes };
  };

  const { days, hours, minutes } = parseTimeValue(value);

  const handleTimeChange = (
    type: "days" | "hours" | "minutes",
    newValue: string
  ) => {
    const newDays = type === "days" ? parseInt(newValue) || 0 : days;
    const newHours = type === "hours" ? parseInt(newValue) || 0 : hours;
    const newMinutes = type === "minutes" ? parseInt(newValue) || 0 : minutes;

    // Build the output string in the format "1d 2h 30m"
    const parts = [];
    if (newDays > 0) parts.push(`${newDays}d`);
    if (newHours > 0) parts.push(`${newHours}h`);
    if (newMinutes > 0) parts.push(`${newMinutes}m`);

    const newTimeString = parts.join(" ");
    onChange(newTimeString);
  };

  return (
    <div className="flex flex-col space-y-3">
      <div className="flex gap-2 justify-between">
        {/* Days Selector */}
        <div className="flex-1">
          <label className="text-xs text-gray-400 block mb-1">Days</label>
          <Select
            value={days.toString()}
            onValueChange={(value) => handleTimeChange("days", value)}
          >
            <SelectTrigger
              className={cn(
                "w-full text-white",
                hasError && "border-rose-500 focus-visible:ring-rose-500"
              )}
            >
              <SelectValue>
                <span className="text-white">{days}d</span>
              </SelectValue>
            </SelectTrigger>
            <SelectContent className="bg-neutral-800 border-0">
              {Array.from({ length: 31 }, (_, i) => (
                <SelectItem
                  key={i}
                  value={i.toString()}
                  className="text-white focus:text-white"
                >
                  {i}d
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Hours Selector */}
        <div className="flex-1">
          <label className="text-xs text-gray-400 block mb-1">Hours</label>
          <Select
            value={hours.toString()}
            onValueChange={(value) => handleTimeChange("hours", value)}
          >
            <SelectTrigger
              className={cn(
                "w-full text-white",
                hasError && "border-rose-500 focus-visible:ring-rose-500"
              )}
            >
              <SelectValue>
                <span className="text-white">{hours}h</span>
              </SelectValue>
            </SelectTrigger>
            <SelectContent className="bg-neutral-800 border-0">
              {Array.from({ length: 24 }, (_, i) => (
                <SelectItem
                  key={i}
                  value={i.toString()}
                  className="text-white focus:text-white"
                >
                  {i}h
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Minutes Selector */}
        <div className="flex-1">
          <label className="text-xs text-gray-400 block mb-1">Minutes</label>
          <Select
            value={minutes.toString()}
            onValueChange={(value) => handleTimeChange("minutes", value)}
          >
            <SelectTrigger
              className={cn(
                "w-full text-white",
                hasError && "border-rose-500 focus-visible:ring-rose-500"
              )}
            >
              <SelectValue>
                <span className="text-white">{minutes}m</span>
              </SelectValue>
            </SelectTrigger>
            <SelectContent className="bg-neutral-800 border-0">
              {[0, 15, 30, 45].map((minute) => (
                <SelectItem
                  key={minute}
                  value={minute.toString()}
                  className="text-white focus:text-white"
                >
                  {minute}m
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Current value display */}
      <div className="text-center">
        <span className="text-sm text-gray-400">Formatted: </span>
        <span className="text-sm text-white font-medium">{value || "0h"}</span>
      </div>
    </div>
  );
}

export default function WorkStatusForm() {
  const router = useRouter();
  const { user, isLoading } = useUser();
  const [state, formAction, isPending] = useActionState(
    async (prevState: any, formData: FormData) => {
      return await createWorkStatus(formData);
    },
    null
  );
  // Initialize form with default values
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      date: new Date(), // Today's date as default
      ticketNumber: "DCV2-", // Default ticket number prefix
      title: "", // Empty title
      status: "To Do", // Default status
      effortToday: "", // Empty effort fields
      totalEffort: "",
      estimatedEffort: "",
    },
  });

  // Handle form submission
  async function onSubmit(values: FormValues) {
    if (!user) {
      alert("Please log in first");
      return;
    }

    console.log("values:", values);
    // The values will be in the format like "1d 2h 30m", "2h", "45m", etc.
    const formData = new FormData();
    formData.append("date", values.date.toISOString());
    formData.append("ticketNumber", values.ticketNumber);
    formData.append("title", values.title);
    formData.append("status", values.status);
    formData.append("effortToday", values.effortToday);
    formData.append("totalEffort", values.totalEffort);
    formData.append("estimatedEffort", values.estimatedEffort);
    formData.append("userId", user.id);

    await formAction(formData);
  }

  // Reset form on successful submission
  // useEffect(() => {
  //   if (state?.success) {
  //     form.reset();
  //     router.refresh();
  //   }
  // }, [state, form, router]);

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="text-center text-white">Loading...</div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold text-white">Work Status Form</h1>
        <p className="text-gray-600">
          Track your daily work progress and ticket status
        </p>
      </div>

      {/* {state?.error && (
        <div className="bg-destructive/15 text-destructive p-3 rounded-md">
          {state.error}
        </div>
      )}

      {state?.success && (
        <div className="bg-green-100 text-green-800 p-3 rounded-md">
          Work status submitted successfully!
        </div>
      )} */}

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* Date Field */}
          <FormField
            control={form.control}
            name="date"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel className="text-white">Date</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant={"outline"}
                        className={cn(
                          "w-full pl-3 text-left font-normal text-white",
                          !field.value && "text-muted-foreground"
                        )}
                      >
                        {field.value ? (
                          format(field.value, "PPP")
                        ) : (
                          <span>Pick a date</span>
                        )}
                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent
                    className="w-auto p-0 bg-neutral-800 border-0 text-white"
                    align="end"
                  >
                    <Calendar
                      mode="single"
                      selected={field.value}
                      onSelect={field.onChange}
                      disabled={(date) =>
                        date > new Date() || date < new Date("1900-01-01")
                      }
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                <FormMessage className="text-rose-500" />
              </FormItem>
            )}
          />

          {/* Ticket Number */}
          <FormField
            control={form.control}
            name="ticketNumber"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-white">Ticket Number</FormLabel>
                <FormControl>
                  <Input
                    placeholder="e.g., DCV2-971"
                    {...field}
                    className="text-white"
                  />
                </FormControl>
                <FormMessage className="text-rose-500" />
              </FormItem>
            )}
          />

          {/* Title */}
          <FormField
            control={form.control}
            name="title"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-white">Title</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="e.g., Action button misalignment"
                    className="resize-none text-white"
                    {...field}
                  />
                </FormControl>
                <FormMessage className="text-rose-500" />
              </FormItem>
            )}
          />

          {/* Status */}
          <FormField
            control={form.control}
            name="status"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-white">Status</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger className="text-white">
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent className="bg-neutral-800 border-0 text-white">
                    <SelectItem value="To Do" className="text-white">
                      To Do
                    </SelectItem>
                    <SelectItem value="In Progress" className="text-white">
                      In Progress
                    </SelectItem>
                    <SelectItem value="Code Review" className="text-white">
                      Code Review
                    </SelectItem>
                    <SelectItem value="DQA" className="text-white">
                      DQA
                    </SelectItem>
                    <SelectItem value="Ready for QA" className="text-white">
                      Ready for QA
                    </SelectItem>
                    <SelectItem value="Done" className="text-white">
                      Done
                    </SelectItem>
                    <SelectItem value="Blocked" className="text-white">
                      Blocked
                    </SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage className="text-rose-500" />
              </FormItem>
            )}
          />

          {/* Effort Fields */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <FormField
              control={form.control}
              name="effortToday"
              render={({ field, fieldState }) => (
                <FormItem>
                  <FormLabel className="text-white">Effort Today</FormLabel>
                  <FormControl>
                    <TimeSelector
                      value={field.value}
                      onChange={field.onChange}
                      placeholder="e.g., 8h 30m"
                      hasError={!!fieldState.error}
                    />
                  </FormControl>
                  <FormMessage className="text-rose-500" />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="totalEffort"
              render={({ field, fieldState }) => (
                <FormItem>
                  <FormLabel className="text-white">Total Effort</FormLabel>
                  <FormControl>
                    <TimeSelector
                      value={field.value}
                      onChange={field.onChange}
                      placeholder="e.g., 3d 4h 15m"
                      hasError={!!fieldState.error}
                    />
                  </FormControl>
                  <FormMessage className="text-rose-500" />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="estimatedEffort"
              render={({ field, fieldState }) => (
                <FormItem>
                  <FormLabel className="text-white">Estimated Effort</FormLabel>
                  <FormControl>
                    <TimeSelector
                      value={field.value}
                      onChange={field.onChange}
                      placeholder="e.g., 2d 6h 0m"
                      hasError={!!fieldState.error}
                    />
                  </FormControl>
                  <FormMessage className="text-rose-500" />
                </FormItem>
              )}
            />
          </div>

          {/* Submit Button */}
          <Button type="submit" className="w-full" variant="outline">
            {"Submit Work Status"}
          </Button>
          {/* <Button type="submit" className="w-full" disabled={isPending}>
            {isPending ? "Submitting..." : "Submit Work Status"}
          </Button> */}
        </form>
      </Form>
    </div>
  );
}

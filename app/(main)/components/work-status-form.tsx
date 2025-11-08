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
import { createWorkStatus, updateWorkStatus, checkDuplicateTicketNumber } from "@/lib/actions/work_status_actions";
import { useActionState, useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@/app/context/UserContext";

const timeStringSchema = (fieldLabel: string) =>
  z
    .string()
    .refine(
      (value) => {
        // If empty, it's valid (showing just d/h/m)
        if (!value || value.trim() === "") return true;
        
        // If value provided, validate the format
        const regex = /^((\d+d\s?)?(\d+h\s?)?(\d+m\s?)?)$/;
        const isValidFormat = regex.test(value.trim());
        
        if (!isValidFormat) return false;
        
        // Parse the values
        const daysMatch = value.match(/(\d+)d/);
        const hoursMatch = value.match(/(\d+)h/);
        const minutesMatch = value.match(/(\d+)m/);
        
        const days = daysMatch ? parseInt(daysMatch[1]) : 0;
        const hours = hoursMatch ? parseInt(hoursMatch[1]) : 0;
        const minutes = minutesMatch ? parseInt(minutesMatch[1]) : 0;
        
        // All values should be non-negative
        return days >= 0 && hours >= 0 && minutes >= 0;
      },
      {
        message: `${fieldLabel} must be in format like '1d 2h 30m' or '0h' for zero time`,
      }
    )
    .transform(val => val); // Default to "0h" if empty for submission

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

// Define proper types for the action state
type ActionState = 
  | { success: boolean; data: any; error?: undefined } 
  | { error: string; success?: undefined; data?: undefined }
  | null;

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

  // Check if each component has been explicitly set
  const hasDays = value.includes('d');
  const hasHours = value.includes('h');
  const hasMinutes = value.includes('m');

  const handleTimeChange = (
    type: "days" | "hours" | "minutes",
    newValue: string
  ) => {
    let newDays = days;
    let newHours = hours;
    let newMinutes = minutes;

    // Update the changed value
    if (type === "days") {
      // If selecting "d", remove days from the output
      newDays = newValue === "d" ? 0 : parseInt(newValue) || 0;
    } else if (type === "hours") {
      // If selecting "h", remove hours from the output
      newHours = newValue === "h" ? 0 : parseInt(newValue) || 0;
    } else if (type === "minutes") {
      // If selecting "m", remove minutes from the output
      newMinutes = newValue === "m" ? 0 : parseInt(newValue) || 0;
    }

    // Build the output string - only include components that have values > 0 OR were explicitly set to 0
    const parts = [];
    
    // Include days if it's being actively set or has a non-zero value
    if (type === "days") {
      if (newValue !== "d") { // If not selecting the unit label
        parts.push(`${newDays}d`);
      }
    } else if (hasDays && newDays >= 0) {
      parts.push(`${newDays}d`);
    }
    
    // Include hours if it's being actively set or has a non-zero value
    if (type === "hours") {
      if (newValue !== "h") { // If not selecting the unit label
        parts.push(`${newHours}h`);
      }
    } else if (hasHours && newHours >= 0) {
      parts.push(`${newHours}h`);
    }
    
    // Include minutes if it's being actively set or has a non-zero value
    if (type === "minutes") {
      if (newValue !== "m") { // If not selecting the unit label
        parts.push(`${newMinutes}m`);
      }
    } else if (hasMinutes && newMinutes >= 0) {
      parts.push(`${newMinutes}m`);
    }

    const newTimeString = parts.join(" ").trim();
    onChange(newTimeString);
  };

  // Get display value for each selector
  const getDisplayValue = (type: "days" | "hours" | "minutes", value: number, hasValue: boolean) => {
    if (!hasValue) {
      return type === "days" ? "d" : type === "hours" ? "h" : "m";
    }
    return `${value}${type === "days" ? "d" : type === "hours" ? "h" : "m"}`;
  };

  // Get select value for each selector
  const getSelectValue = (type: "days" | "hours" | "minutes", value: number, hasValue: boolean) => {
    if (!hasValue) {
      return type === "days" ? "d" : type === "hours" ? "h" : "m";
    }
    return value.toString();
  };

  return (
    <div className="flex flex-col space-y-3">
      <div className="flex gap-2 justify-between">
        {/* Days Selector */}
        <div className="flex-1">
          <label className="text-xs text-gray-400 block mb-1">Days</label>
          <Select
            value={getSelectValue("days", days, hasDays)}
            onValueChange={(value) => {
              console.log("day:", value);
              handleTimeChange("days", value);
            }}
          >
            <SelectTrigger
              className={cn(
                "w-full text-white",
                hasError && "border-rose-500 focus-visible:ring-rose-500"
              )}
            >
              <SelectValue>
                <span className="text-white">
                  {getDisplayValue("days", days, hasDays)}
                </span>
              </SelectValue>
            </SelectTrigger>
            <SelectContent className="bg-neutral-800 border-0">
              <SelectItem value="d" className="text-white">
                d
              </SelectItem>
              <SelectItem value="0" className="text-white">
                0d
              </SelectItem>
              {Array.from({ length: 31 }, (_, i) => (
                <SelectItem
                  key={i + 1}
                  value={(i + 1).toString()}
                  className="text-white"
                >
                  {i + 1}d
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Hours Selector */}
        <div className="flex-1">
          <label className="text-xs text-gray-400 block mb-1">Hours</label>
          <Select
            value={getSelectValue("hours", hours, hasHours)}
            onValueChange={(value) => {
              console.log("hour:", value);
              handleTimeChange("hours", value);
            }}
          >
            <SelectTrigger
              className={cn(
                "w-full text-white",
                hasError && "border-rose-500 focus-visible:ring-rose-500"
              )}
            >
              <SelectValue>
                <span className="text-white">
                  {getDisplayValue("hours", hours, hasHours)}
                </span>
              </SelectValue>
            </SelectTrigger>
            <SelectContent className="bg-neutral-800 border-0">
              <SelectItem value="h" className="text-white">
                h
              </SelectItem>
              <SelectItem value="0" className="text-white">
                0h
              </SelectItem>
              {Array.from({ length: 24 }, (_, i) => (
                <SelectItem
                  key={i + 1}
                  value={(i + 1).toString()}
                  className="text-white"
                >
                  {i + 1}h
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Minutes Selector */}
        <div className="flex-1">
          <label className="text-xs text-gray-400 block mb-1">Minutes</label>
          <Select
            value={getSelectValue("minutes", minutes, hasMinutes)}
            onValueChange={(value) => {
              console.log("minute:", value);
              handleTimeChange("minutes", value);
            }}
          >
            <SelectTrigger
              className={cn(
                "w-full text-white",
                hasError && "border-rose-500 focus-visible:ring-rose-500"
              )}
            >
              <SelectValue>
                <span className="text-white">
                  {getDisplayValue("minutes", minutes, hasMinutes)}
                </span>
              </SelectValue>
            </SelectTrigger>
            <SelectContent className="bg-neutral-800 border-0">
              <SelectItem value="m" className="text-white ">
                m
              </SelectItem>
              <SelectItem value="0" className="text-white">
                0m
              </SelectItem>
              {[15, 30, 45].map((minute) => (
                <SelectItem
                  key={minute}
                  value={minute.toString()}
                  className="text-white"
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
        <span className="text-sm text-white font-medium">
          {value || ""}
        </span>
      </div>
    </div>
  );
}

interface WorkStatusFormProps {
  workStatus?: any;
  isEdit?: boolean;
  ticketNumber?: string;
}

export default function WorkStatusForm({ 
  workStatus, 
  isEdit = false, 
  ticketNumber 
}: WorkStatusFormProps) {
  const router = useRouter();
  const { user, isLoading } = useUser();
  const [isPending, startTransition] = useTransition();
  const [duplicateError, setDuplicateError] = useState("");
  
  // Create a wrapper action for useActionState that includes the user ID
  const [state, formAction] = useActionState(
    async (prevState: ActionState, formData: FormData): Promise<ActionState> => {
      if (!user) {
        return { error: 'User not authenticated' };
      }
      
      const formDataWithUser = new FormData();
      formDataWithUser.append('date', formData.get('date') as string);
      formDataWithUser.append('ticketNumber', formData.get('ticketNumber') as string);
      formDataWithUser.append('title', formData.get('title') as string);
      formDataWithUser.append('status', formData.get('status') as string);
      formDataWithUser.append('effortToday', formData.get('effortToday') as string);
      formDataWithUser.append('totalEffort', formData.get('totalEffort') as string);
      formDataWithUser.append('estimatedEffort', formData.get('estimatedEffort') as string);
      formDataWithUser.append('userId', user.id);

      if (isEdit && workStatus?.id) {
        formDataWithUser.append('id', workStatus.id);
        return await updateWorkStatus(workStatus.id, formDataWithUser, user.id);
      } else {

        console.log("formDataWithUser",FormData)
        return await createWorkStatus(formDataWithUser);
      }
    },
    null
  );

  // Initialize form with default values
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      date: workStatus?.date ? new Date(workStatus.date) : new Date(),
      ticketNumber: workStatus?.ticketNumber || "DCV2-",
      title: workStatus?.title || "",
      status: workStatus?.status || "BACKLOG",
      effortToday: workStatus?.effortTodayFormatted || "",
      totalEffort: workStatus?.totalEffortFormatted || "",
      estimatedEffort: workStatus?.estimatedEffortFormatted || "",
    },
  });

  // Check for duplicate ticket number when ticketNumber field changes
  const watchTicketNumber = form.watch("ticketNumber");
  
  useEffect(() => {
    const checkDuplicate = async () => {
      if (!user || !watchTicketNumber || watchTicketNumber === "DCV2-" || watchTicketNumber === workStatus?.ticketNumber) {
        setDuplicateError("");
        return;
      }

      try {
        const result = await checkDuplicateTicketNumber(
          watchTicketNumber, 
          user.id, 
          isEdit ? workStatus?.id : undefined
        );
        
        if (result.exists) {
          setDuplicateError("A work status with this ticket number already exists");
        } else {
          setDuplicateError("");
        }
      } catch (error) {
        console.error("Error checking duplicate:", error);
        setDuplicateError("");
      }
    };

    const timeoutId = setTimeout(checkDuplicate, 500);
    return () => clearTimeout(timeoutId);
  }, [watchTicketNumber, user, isEdit, workStatus]);

  // Handle form submission
  async function onSubmit(values: FormValues) {
    if (!user) {
      alert("Please log in first");
      return;
    }

    if (duplicateError) {
      form.setError("ticketNumber", { message: duplicateError });
      return;
    }

    console.log("values:", values);
    
    const formData = new FormData();
    formData.append("date", values.date.toISOString());
    formData.append("ticketNumber", values.ticketNumber);
    formData.append("title", values.title);
    formData.append("status", values.status);
    formData.append("effortToday", values.effortToday);
    formData.append("totalEffort", values.totalEffort);
    formData.append("estimatedEffort", values.estimatedEffort);

    startTransition(() => {
      formAction(formData);
    });
  }

  // Reset form on successful submission
  useEffect(() => {
    if (state && 'success' in state && state.success) {
      form.reset();
      router.refresh();
      router.push("/");
    }
  }, [state, form, router]);

  // Update page title and button text based on mode
  const pageTitle = isEdit ? `Edit Work Status - ${ticketNumber}` : "Create Work Status";
  const submitButtonText = isPending 
    ? (isEdit ? "Updating..." : "Submitting...") 
    : (isEdit ? "Update Work Status" : "Submit Work Status");

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="text-center text-white">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="text-center">
          <p className="text-white">Please log in to {isEdit ? 'edit' : 'submit'} work status</p>
          <Button onClick={() => router.push("/login")} className="mt-4">
            Go to Login
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold text-white">{pageTitle}</h1>
        <p className="text-gray-600">
          {isEdit ? "Update your work status" : "Track your daily work progress and ticket status"}
        </p>
      </div>

      {/* Safe state checking */}
      {state && 'error' in state && state.error && (
        <div className="bg-destructive/15 text-destructive p-3 rounded-md">
          {state.error}
        </div>
      )}

      {state && 'success' in state && state.success && (
        <div className="bg-green-100 text-green-800 p-3 rounded-md">
          Work status {isEdit ? 'updated' : 'submitted'} successfully!
        </div>
      )}

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
                    disabled={isEdit} // Disable ticket number in edit mode
                  />
                </FormControl>
                {duplicateError && (
                  <FormMessage className="text-rose-500">
                    {duplicateError}
                  </FormMessage>
                )}
                <FormMessage className="text-rose-500" />
                {isEdit && (
                  <FormDescription className="text-gray-400">
                    Ticket number cannot be changed in edit mode
                  </FormDescription>
                )}
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
                    <SelectItem value="BACKLOG" className="text-white">
                      BACKLOG
                    </SelectItem>
                    <SelectItem value="TO DO" className="text-white">
                      TO DO
                    </SelectItem>
                    <SelectItem value="IN PROGRESS" className="text-white">
                      IN PROGRESS
                    </SelectItem>
                    <SelectItem value="DEVELOPER TESTING" className="text-white">
                      DEVELOPER TESTING
                    </SelectItem>
                    <SelectItem value="PR APPROVAL PENDING" className="text-white">
                      PR APPROVAL PENDING
                    </SelectItem>
                    <SelectItem value="DQA" className="text-white">
                      DQA
                    </SelectItem>                
                    <SelectItem value="Done" className="text-white">
                      Done
                    </SelectItem>
                    <SelectItem value="BLOCKED" className="text-white">
                      BLOCKED
                    </SelectItem>
                    <SelectItem value="REOPENED" className="text-white">
                      REOPENED
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

          {/* Action Buttons */}
          <div className="flex gap-4">
            <Button 
              type="button"
              variant="outline"
              onClick={() => router.push("/")}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              className="flex-1" 
              variant="outline"
              disabled={isPending || !!duplicateError}
            >
              {submitButtonText}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
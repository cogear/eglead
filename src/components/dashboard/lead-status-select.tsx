"use client";

import { useTransition } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { updateLeadStatus } from "@/actions/leads";
import { LeadStatus } from "@prisma/client";
import { toast } from "sonner";

const statuses = [
  { value: "NEW", label: "New" },
  { value: "CONTACTED", label: "Contacted" },
  { value: "QUALIFIED", label: "Qualified" },
  { value: "DEMO_SCHEDULED", label: "Demo Scheduled" },
  { value: "DEMO_COMPLETED", label: "Demo Completed" },
  { value: "PROPOSAL_SENT", label: "Proposal Sent" },
  { value: "NEGOTIATING", label: "Negotiating" },
  { value: "CLOSED_WON", label: "Closed Won" },
  { value: "CLOSED_LOST", label: "Closed Lost" },
];

type Props = {
  id: string;
  currentStatus: LeadStatus;
};

export function LeadStatusSelect({ id, currentStatus }: Props) {
  const [isPending, startTransition] = useTransition();

  const handleChange = (value: string) => {
    startTransition(async () => {
      try {
        await updateLeadStatus(id, value as LeadStatus);
        toast.success("Status updated");
      } catch {
        toast.error("Failed to update status");
      }
    });
  };

  return (
    <Select
      value={currentStatus}
      onValueChange={handleChange}
      disabled={isPending}
    >
      <SelectTrigger className="w-44">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {statuses.map((status) => (
          <SelectItem key={status.value} value={status.value}>
            {status.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

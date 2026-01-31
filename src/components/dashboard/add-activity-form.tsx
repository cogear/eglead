"use client";

import { useTransition, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { addActivity } from "@/actions/leads";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

const activityTypes = [
  { value: "CALL", label: "Call" },
  { value: "EMAIL", label: "Email" },
  { value: "SMS", label: "SMS" },
  { value: "NOTE", label: "Note" },
];

type Props = {
  leadId: string;
};

export function AddActivityForm({ leadId }: Props) {
  const [isPending, startTransition] = useTransition();
  const [type, setType] = useState("NOTE");
  const [subject, setSubject] = useState("");
  const [content, setContent] = useState("");
  const [outcome, setOutcome] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!subject.trim()) {
      toast.error("Subject is required");
      return;
    }

    startTransition(async () => {
      try {
        await addActivity(
          leadId,
          type,
          subject,
          content || undefined,
          outcome || undefined
        );
        toast.success("Activity added");
        setSubject("");
        setContent("");
        setOutcome("");
      } catch {
        toast.error("Failed to add activity");
      }
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-sm font-medium">Type</label>
          <Select value={type} onValueChange={setType}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {activityTypes.map((t) => (
                <SelectItem key={t.value} value={t.value}>
                  {t.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <label className="text-sm font-medium">Outcome</label>
          <Input
            value={outcome}
            onChange={(e) => setOutcome(e.target.value)}
            placeholder="e.g., Left voicemail"
          />
        </div>
      </div>
      <div>
        <label className="text-sm font-medium">Subject *</label>
        <Input
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          placeholder="Brief description"
          required
        />
      </div>
      <div>
        <label className="text-sm font-medium">Details</label>
        <Textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Additional notes..."
          rows={3}
        />
      </div>
      <Button type="submit" disabled={isPending}>
        {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        Add Activity
      </Button>
    </form>
  );
}

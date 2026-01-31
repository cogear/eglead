"use client";

import { useTransition } from "react";
import { Button } from "@/components/ui/button";
import { deleteLead } from "@/actions/leads";
import { Trash2, Loader2 } from "lucide-react";
import { toast } from "sonner";

type Props = {
  id: string;
};

export function DeleteLeadButton({ id }: Props) {
  const [isPending, startTransition] = useTransition();

  const handleDelete = () => {
    if (!confirm("Are you sure you want to delete this lead? This action cannot be undone.")) {
      return;
    }

    startTransition(async () => {
      try {
        await deleteLead(id);
        toast.success("Lead deleted");
      } catch {
        toast.error("Failed to delete lead");
      }
    });
  };

  return (
    <Button
      variant="outline"
      onClick={handleDelete}
      disabled={isPending}
      className="text-red-600 hover:text-red-700 hover:bg-red-50"
    >
      {isPending ? (
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
      ) : (
        <Trash2 className="mr-2 h-4 w-4" />
      )}
      Delete
    </Button>
  );
}

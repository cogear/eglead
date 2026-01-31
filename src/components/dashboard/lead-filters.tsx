"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";

const statuses = [
  { value: "all", label: "All Statuses" },
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

const tiers = [
  { value: "all", label: "All Tiers" },
  { value: "TIER_1", label: "Tier 1 (Prime)" },
  { value: "TIER_2", label: "Tier 2 (Good)" },
  { value: "TIER_3", label: "Tier 3 (Potential)" },
  { value: "TIER_4", label: "Tier 4 (Low)" },
];

const verticals = [
  { value: "all", label: "All Verticals" },
  { value: "PLUMBING", label: "Plumbing" },
  { value: "HVAC", label: "HVAC" },
  { value: "ROOFING", label: "Roofing" },
  { value: "ELECTRICAL", label: "Electrical" },
  { value: "LANDSCAPING", label: "Landscaping" },
  { value: "CLEANING", label: "Cleaning" },
  { value: "AUTO_REPAIR", label: "Auto Repair" },
  { value: "SALON_SPA", label: "Salon/Spa" },
  { value: "DENTAL", label: "Dental" },
  { value: "MEDICAL", label: "Medical" },
  { value: "LEGAL", label: "Legal" },
  { value: "ACCOUNTING", label: "Accounting" },
  { value: "REAL_ESTATE", label: "Real Estate" },
  { value: "RESTAURANT", label: "Restaurant" },
  { value: "OTHER", label: "Other" },
];

export function LeadFilters() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const currentStatus = searchParams.get("status") || "all";
  const currentTier = searchParams.get("tier") || "all";
  const currentVertical = searchParams.get("vertical") || "all";
  const currentSearch = searchParams.get("search") || "";

  const updateFilter = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value === "all" || value === "") {
      params.delete(key);
    } else {
      params.set(key, value);
    }
    router.push(`/leads?${params.toString()}`);
  };

  const clearFilters = () => {
    router.push("/leads");
  };

  const hasFilters =
    currentStatus !== "all" ||
    currentTier !== "all" ||
    currentVertical !== "all" ||
    currentSearch !== "";

  return (
    <div className="flex flex-wrap items-center gap-4">
      <Input
        placeholder="Search businesses..."
        className="w-64"
        value={currentSearch}
        onChange={(e) => updateFilter("search", e.target.value)}
      />
      <Select
        value={currentStatus}
        onValueChange={(value) => updateFilter("status", value)}
      >
        <SelectTrigger className="w-40">
          <SelectValue placeholder="Status" />
        </SelectTrigger>
        <SelectContent>
          {statuses.map((status) => (
            <SelectItem key={status.value} value={status.value}>
              {status.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Select
        value={currentTier}
        onValueChange={(value) => updateFilter("tier", value)}
      >
        <SelectTrigger className="w-40">
          <SelectValue placeholder="Tier" />
        </SelectTrigger>
        <SelectContent>
          {tiers.map((tier) => (
            <SelectItem key={tier.value} value={tier.value}>
              {tier.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Select
        value={currentVertical}
        onValueChange={(value) => updateFilter("vertical", value)}
      >
        <SelectTrigger className="w-40">
          <SelectValue placeholder="Vertical" />
        </SelectTrigger>
        <SelectContent>
          {verticals.map((vertical) => (
            <SelectItem key={vertical.value} value={vertical.value}>
              {vertical.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {hasFilters && (
        <Button variant="ghost" size="sm" onClick={clearFilters}>
          <X className="mr-2 h-4 w-4" />
          Clear filters
        </Button>
      )}
    </div>
  );
}

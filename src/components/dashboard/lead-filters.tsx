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
  { value: "ACCOUNTING", label: "Accounting Firms" },
  { value: "ART_TEACHERS", label: "Art Teachers" },
  { value: "AUTO_DETAILING", label: "Auto Detailing" },
  { value: "AUTO_REPAIR", label: "Auto Repair Shops" },
  { value: "CHIROPRACTIC", label: "Chiropractic Offices" },
  { value: "DANCE_STUDIOS", label: "Dance Studios" },
  { value: "DAY_SPA_MASSAGE", label: "Day Spas & Massage" },
  { value: "DENTAL", label: "Dental Offices" },
  { value: "ELECTRICAL", label: "Electricians" },
  { value: "ESTHETICIAN_SKINCARE", label: "Estheticians & Skincare" },
  { value: "EVENT_PLANNERS", label: "Event Planners" },
  { value: "EYEBROW_LASH", label: "Eyebrow & Lash Services" },
  { value: "HAIR_SALON_BARBERSHOP", label: "Hair Salons & Barbershops" },
  { value: "HOUSE_CLEANING", label: "House Cleaning" },
  { value: "HVAC", label: "HVAC Technicians" },
  { value: "INSURANCE", label: "Insurance Agents" },
  { value: "LANDSCAPING_LAWN", label: "Landscapers & Lawn Care" },
  { value: "LANGUAGE_TEACHERS", label: "Language Teachers" },
  { value: "LEGAL", label: "Legal Offices" },
  { value: "MARTIAL_ARTS", label: "Martial Arts Schools" },
  { value: "MEDSPA", label: "MedSpas" },
  { value: "MENTAL_HEALTH", label: "Mental Health Counselors" },
  { value: "MUSIC_TEACHERS", label: "Music Teachers" },
  { value: "NAIL_SALON", label: "Nail Salons" },
  { value: "PERSONAL_TRAINERS", label: "Personal Trainers" },
  { value: "PET_GROOMING", label: "Pet Grooming" },
  { value: "PET_SITTING_WALKING", label: "Pet Sitting & Walking" },
  { value: "PET_TRAINING", label: "Pet Training" },
  { value: "PHOTOGRAPHY", label: "Photography Studios" },
  { value: "PHYSICAL_THERAPY", label: "Physical Therapy Clinics" },
  { value: "PLUMBING", label: "Plumbers" },
  { value: "REAL_ESTATE", label: "Real Estate Agents" },
  { value: "RESTAURANT", label: "Restaurants" },
  { value: "TATTOO_PIERCING", label: "Tattoo & Piercing Studios" },
  { value: "TIRE_SHOPS", label: "Tire Shops" },
  { value: "TUTORING", label: "Tutoring Services" },
  { value: "VETERINARIAN", label: "Veterinarians" },
  { value: "YOGA", label: "Yoga Instructors" },
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

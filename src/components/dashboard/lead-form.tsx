"use client";

import { useTransition } from "react";
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
import { createLead, updateLead } from "@/actions/leads";
import { Lead } from "@prisma/client";
import { Loader2 } from "lucide-react";

const verticals = [
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
  lead?: Lead;
};

export function LeadForm({ lead }: Props) {
  const [isPending, startTransition] = useTransition();

  const handleSubmit = (formData: FormData) => {
    startTransition(async () => {
      if (lead) {
        await updateLead(lead.id, formData);
      } else {
        await createLead(formData);
      }
    });
  };

  return (
    <form action={handleSubmit} className="space-y-6">
      {/* Business Information */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium">Business Information</h3>
        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2">
            <label className="text-sm font-medium">Business Name *</label>
            <Input
              name="businessName"
              defaultValue={lead?.businessName}
              required
              placeholder="Acme Plumbing"
            />
          </div>
          <div>
            <label className="text-sm font-medium">Contact Name</label>
            <Input
              name="contactName"
              defaultValue={lead?.contactName || ""}
              placeholder="John Smith"
            />
          </div>
          <div>
            <label className="text-sm font-medium">Vertical</label>
            <Select name="vertical" defaultValue={lead?.vertical || "OTHER"}>
              <SelectTrigger>
                <SelectValue placeholder="Select vertical" />
              </SelectTrigger>
              <SelectContent>
                {verticals.map((v) => (
                  <SelectItem key={v.value} value={v.value}>
                    {v.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Contact Information */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium">Contact Information</h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium">Phone</label>
            <Input
              name="phone"
              type="tel"
              defaultValue={lead?.phone || ""}
              placeholder="(555) 123-4567"
            />
          </div>
          <div>
            <label className="text-sm font-medium">Email</label>
            <Input
              name="email"
              type="email"
              defaultValue={lead?.email || ""}
              placeholder="contact@acmeplumbing.com"
            />
          </div>
          <div className="col-span-2">
            <label className="text-sm font-medium">Website</label>
            <Input
              name="website"
              type="url"
              defaultValue={lead?.website || ""}
              placeholder="https://acmeplumbing.com"
            />
          </div>
        </div>
      </div>

      {/* Location */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium">Location</h3>
        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2">
            <label className="text-sm font-medium">Address</label>
            <Input
              name="address"
              defaultValue={lead?.address || ""}
              placeholder="123 Main St"
            />
          </div>
          <div>
            <label className="text-sm font-medium">City</label>
            <Input
              name="city"
              defaultValue={lead?.city || ""}
              placeholder="Melbourne"
            />
          </div>
          <div>
            <label className="text-sm font-medium">State</label>
            <Input
              name="state"
              defaultValue={lead?.state || ""}
              placeholder="FL"
            />
          </div>
          <div>
            <label className="text-sm font-medium">ZIP Code</label>
            <Input
              name="zipCode"
              defaultValue={lead?.zipCode || ""}
              placeholder="32901"
            />
          </div>
        </div>
      </div>

      {/* Business Metrics */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium">Business Metrics</h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium">Years in Business</label>
            <Input
              name="yearsInBusiness"
              type="number"
              min="0"
              defaultValue={lead?.yearsInBusiness || ""}
              placeholder="8"
            />
          </div>
          <div>
            <label className="text-sm font-medium">Review Count</label>
            <Input
              name="reviewCount"
              type="number"
              min="0"
              defaultValue={lead?.reviewCount || ""}
              placeholder="12"
            />
          </div>
          <div>
            <label className="text-sm font-medium">Google Rating</label>
            <Input
              name="googleRating"
              type="number"
              min="0"
              max="5"
              step="0.1"
              defaultValue={lead?.googleRating || ""}
              placeholder="4.5"
            />
          </div>
          <div>
            <label className="text-sm font-medium">Has Booking Software?</label>
            <Select
              name="hasBookingSoftware"
              defaultValue={lead?.hasBookingSoftware ? "true" : "false"}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="false">No</SelectItem>
                <SelectItem value="true">Yes</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="col-span-2">
            <label className="text-sm font-medium">
              Current Booking Tool (if any)
            </label>
            <Input
              name="currentBookingTool"
              defaultValue={lead?.currentBookingTool || ""}
              placeholder="ServiceTitan, Housecall Pro, etc."
            />
          </div>
        </div>
      </div>

      {/* Status (only for editing) */}
      {lead && (
        <div className="space-y-4">
          <h3 className="text-lg font-medium">Status</h3>
          <Select name="status" defaultValue={lead.status}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {statuses.map((s) => (
                <SelectItem key={s.value} value={s.value}>
                  {s.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Notes */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium">Notes</h3>
        <Textarea
          name="notes"
          defaultValue={lead?.notes || ""}
          placeholder="Any additional notes about this lead..."
          rows={4}
        />
      </div>

      <div className="flex gap-4">
        <Button type="submit" disabled={isPending}>
          {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {lead ? "Update Lead" : "Create Lead"}
        </Button>
      </div>
    </form>
  );
}

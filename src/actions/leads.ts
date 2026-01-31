"use server";

import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { LeadStatus, LeadTier, BusinessVertical } from "@prisma/client";

export type LeadFormData = {
  businessName: string;
  contactName?: string;
  email?: string;
  phone?: string;
  website?: string;
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  vertical: BusinessVertical;
  yearsInBusiness?: number;
  reviewCount?: number;
  googleRating?: number;
  hasBookingSoftware: boolean;
  currentBookingTool?: string;
  tier: LeadTier;
  status: LeadStatus;
  notes?: string;
};

function calculateScore(data: LeadFormData): number {
  let score = 50; // Base score

  // Years in business (established = higher score)
  if (data.yearsInBusiness) {
    if (data.yearsInBusiness >= 10) score += 15;
    else if (data.yearsInBusiness >= 5) score += 10;
    else if (data.yearsInBusiness >= 2) score += 5;
  }

  // Review count (lower = higher score for this use case)
  if (data.reviewCount !== undefined) {
    if (data.reviewCount < 10) score += 20;
    else if (data.reviewCount < 25) score += 15;
    else if (data.reviewCount < 50) score += 10;
    else if (data.reviewCount >= 100) score -= 10;
  }

  // No booking software = higher score
  if (!data.hasBookingSoftware) {
    score += 15;
  }

  // High-value verticals (appointment-heavy businesses)
  const highValueVerticals: BusinessVertical[] = [
    "DENTAL",
    "CHIROPRACTIC",
    "PHYSICAL_THERAPY",
    "DAY_SPA_MASSAGE",
    "MEDSPA",
    "HAIR_SALON_BARBERSHOP",
    "NAIL_SALON",
    "ESTHETICIAN_SKINCARE",
    "VETERINARIAN",
    "MENTAL_HEALTH",
    "PERSONAL_TRAINERS",
    "YOGA",
    "MARTIAL_ARTS",
    "DANCE_STUDIOS",
    "PLUMBING",
    "HVAC",
    "ELECTRICAL",
  ];
  if (highValueVerticals.includes(data.vertical)) {
    score += 10;
  }

  return Math.min(100, Math.max(0, score));
}

function determineTier(data: LeadFormData): LeadTier {
  const criteria = {
    established: (data.yearsInBusiness ?? 0) >= 3,
    lowReviews: (data.reviewCount ?? 0) < 25,
    noBooking: !data.hasBookingSoftware,
  };

  const criteriaCount = Object.values(criteria).filter(Boolean).length;

  if (criteriaCount === 3) return "TIER_1";
  if (criteriaCount === 2) return "TIER_2";
  if (criteriaCount === 1) return "TIER_3";
  return "TIER_4";
}

export async function createLead(formData: FormData) {
  const data: LeadFormData = {
    businessName: formData.get("businessName") as string,
    contactName: (formData.get("contactName") as string) || undefined,
    email: (formData.get("email") as string) || undefined,
    phone: (formData.get("phone") as string) || undefined,
    website: (formData.get("website") as string) || undefined,
    address: (formData.get("address") as string) || undefined,
    city: (formData.get("city") as string) || undefined,
    state: (formData.get("state") as string) || undefined,
    zipCode: (formData.get("zipCode") as string) || undefined,
    vertical: (formData.get("vertical") as BusinessVertical) || "OTHER",
    yearsInBusiness: formData.get("yearsInBusiness")
      ? parseInt(formData.get("yearsInBusiness") as string)
      : undefined,
    reviewCount: formData.get("reviewCount")
      ? parseInt(formData.get("reviewCount") as string)
      : undefined,
    googleRating: formData.get("googleRating")
      ? parseFloat(formData.get("googleRating") as string)
      : undefined,
    hasBookingSoftware: formData.get("hasBookingSoftware") === "true",
    currentBookingTool: (formData.get("currentBookingTool") as string) || undefined,
    tier: "TIER_4",
    status: "NEW",
    notes: (formData.get("notes") as string) || undefined,
  };

  // Auto-calculate tier and score
  data.tier = determineTier(data);
  const score = calculateScore(data);

  const lead = await db.lead.create({
    data: {
      ...data,
      score,
    },
  });

  revalidatePath("/");
  revalidatePath("/leads");
  redirect(`/leads/${lead.id}`);
}

export async function updateLead(id: string, formData: FormData) {
  const data: LeadFormData = {
    businessName: formData.get("businessName") as string,
    contactName: (formData.get("contactName") as string) || undefined,
    email: (formData.get("email") as string) || undefined,
    phone: (formData.get("phone") as string) || undefined,
    website: (formData.get("website") as string) || undefined,
    address: (formData.get("address") as string) || undefined,
    city: (formData.get("city") as string) || undefined,
    state: (formData.get("state") as string) || undefined,
    zipCode: (formData.get("zipCode") as string) || undefined,
    vertical: (formData.get("vertical") as BusinessVertical) || "OTHER",
    yearsInBusiness: formData.get("yearsInBusiness")
      ? parseInt(formData.get("yearsInBusiness") as string)
      : undefined,
    reviewCount: formData.get("reviewCount")
      ? parseInt(formData.get("reviewCount") as string)
      : undefined,
    googleRating: formData.get("googleRating")
      ? parseFloat(formData.get("googleRating") as string)
      : undefined,
    hasBookingSoftware: formData.get("hasBookingSoftware") === "true",
    currentBookingTool: (formData.get("currentBookingTool") as string) || undefined,
    tier: (formData.get("tier") as LeadTier) || "TIER_4",
    status: (formData.get("status") as LeadStatus) || "NEW",
    notes: (formData.get("notes") as string) || undefined,
  };

  // Recalculate tier and score
  data.tier = determineTier(data);
  const score = calculateScore(data);

  await db.lead.update({
    where: { id },
    data: {
      ...data,
      score,
    },
  });

  revalidatePath("/");
  revalidatePath("/leads");
  revalidatePath(`/leads/${id}`);
  redirect(`/leads/${id}`);
}

export async function updateLeadStatus(id: string, status: LeadStatus) {
  const updateData: { status: LeadStatus; lastContactDate?: Date } = { status };

  // Update lastContactDate when status changes to CONTACTED or beyond
  if (status !== "NEW") {
    updateData.lastContactDate = new Date();
  }

  await db.lead.update({
    where: { id },
    data: updateData,
  });

  revalidatePath("/");
  revalidatePath("/leads");
  revalidatePath(`/leads/${id}`);
}

export async function deleteLead(id: string) {
  await db.lead.delete({
    where: { id },
  });

  revalidatePath("/");
  revalidatePath("/leads");
  redirect("/leads");
}

export async function addActivity(
  leadId: string,
  type: string,
  subject: string,
  content?: string,
  outcome?: string
) {
  await db.activity.create({
    data: {
      leadId,
      type,
      subject,
      content,
      outcome,
    },
  });

  revalidatePath(`/leads/${leadId}`);
}

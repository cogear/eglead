"use server";

import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { BusinessVertical } from "@prisma/client";

export type PlaceResult = {
  placeId: string;
  name: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  phone: string | null;
  website: string | null;
  rating: number | null;
  reviewCount: number;
  types: string[];
  alreadyImported: boolean;
};

export type SearchParams = {
  query: string;
  location: string;
  radius: number; // in miles
  vertical: string;
};

// Map Google place types to our verticals
function mapToVertical(types: string[]): BusinessVertical {
  const typeMap: Record<string, BusinessVertical> = {
    plumber: "PLUMBING",
    hvac_contractor: "HVAC",
    roofing_contractor: "ROOFING",
    electrician: "ELECTRICAL",
    landscaper: "LANDSCAPING",
    cleaning_service: "CLEANING",
    car_repair: "AUTO_REPAIR",
    hair_salon: "SALON_SPA",
    beauty_salon: "SALON_SPA",
    spa: "SALON_SPA",
    dentist: "DENTAL",
    doctor: "MEDICAL",
    lawyer: "LEGAL",
    accountant: "ACCOUNTING",
    real_estate_agency: "REAL_ESTATE",
    restaurant: "RESTAURANT",
  };

  for (const type of types) {
    if (typeMap[type]) {
      return typeMap[type];
    }
  }
  return "OTHER";
}

// Calculate tier based on business metrics
function calculateTier(reviewCount: number, yearsInBusiness?: number): string {
  // For prospecting, we estimate tier based on available data
  // Lower reviews = higher priority (more opportunity)
  if (reviewCount < 15) return "TIER_1";
  if (reviewCount < 30) return "TIER_2";
  if (reviewCount < 75) return "TIER_3";
  return "TIER_4";
}

// Calculate score based on metrics
function calculateScore(reviewCount: number, rating: number | null): number {
  let score = 50;

  // Lower reviews = higher score (more opportunity)
  if (reviewCount < 10) score += 25;
  else if (reviewCount < 25) score += 20;
  else if (reviewCount < 50) score += 10;
  else if (reviewCount >= 100) score -= 10;

  // Good rating but few reviews = prime target
  if (rating && rating >= 4.0 && reviewCount < 25) {
    score += 10;
  }

  return Math.min(100, Math.max(0, score));
}

export async function searchPlaces(params: SearchParams): Promise<{
  results: PlaceResult[];
  error?: string;
}> {
  const apiKey = process.env.GOOGLE_PLACES_API_KEY;

  if (!apiKey) {
    return {
      results: [],
      error: "Google Places API key not configured. Add GOOGLE_PLACES_API_KEY to your environment variables.",
    };
  }

  try {
    // Build the search query
    const searchQuery = params.vertical !== "all"
      ? `${params.vertical} in ${params.location}`
      : params.query || `businesses in ${params.location}`;

    // First, get coordinates for the location using Geocoding API
    const geocodeUrl = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(params.location)}&key=${apiKey}`;
    const geocodeRes = await fetch(geocodeUrl);
    const geocodeData = await geocodeRes.json();

    if (geocodeData.status !== "OK" || !geocodeData.results?.[0]) {
      return { results: [], error: "Could not find location. Try a more specific address." };
    }

    const { lat, lng } = geocodeData.results[0].geometry.location;

    // Search for places using Text Search API
    const radiusMeters = params.radius * 1609.34; // Convert miles to meters
    const searchUrl = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(searchQuery)}&location=${lat},${lng}&radius=${radiusMeters}&key=${apiKey}`;

    const searchRes = await fetch(searchUrl);
    const searchData = await searchRes.json();

    if (searchData.status !== "OK" && searchData.status !== "ZERO_RESULTS") {
      return { results: [], error: `Google API error: ${searchData.status}` };
    }

    const places = searchData.results || [];

    // Get existing place IDs to mark already imported
    const existingPlaceIds = await db.lead.findMany({
      where: {
        googlePlaceId: { in: places.map((p: { place_id: string }) => p.place_id) },
      },
      select: { googlePlaceId: true },
    });
    const importedIds = new Set(existingPlaceIds.map((l) => l.googlePlaceId));

    // Get details for each place (for phone numbers and websites)
    const results: PlaceResult[] = await Promise.all(
      places.slice(0, 20).map(async (place: {
        place_id: string;
        name: string;
        formatted_address: string;
        rating?: number;
        user_ratings_total?: number;
        types?: string[];
      }) => {
        // Get place details for phone and website
        const detailsUrl = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${place.place_id}&fields=formatted_phone_number,website&key=${apiKey}`;
        const detailsRes = await fetch(detailsUrl);
        const detailsData = await detailsRes.json();
        const details = detailsData.result || {};

        // Parse address components
        const addressParts = place.formatted_address?.split(", ") || [];
        const cityStateZip = addressParts[1]?.match(/^(.+?)\s+([A-Z]{2})\s+(\d{5})?/) || [];

        return {
          placeId: place.place_id,
          name: place.name,
          address: addressParts[0] || "",
          city: cityStateZip[1] || addressParts[1] || "",
          state: cityStateZip[2] || "",
          zipCode: cityStateZip[3] || "",
          phone: details.formatted_phone_number || null,
          website: details.website || null,
          rating: place.rating || null,
          reviewCount: place.user_ratings_total || 0,
          types: place.types || [],
          alreadyImported: importedIds.has(place.place_id),
        };
      })
    );

    // Sort by review count (lowest first - best opportunities)
    results.sort((a, b) => a.reviewCount - b.reviewCount);

    return { results };
  } catch (error) {
    console.error("Search error:", error);
    return { results: [], error: "Failed to search. Please try again." };
  }
}

export async function importAsLead(place: PlaceResult, vertical: BusinessVertical) {
  // Check if already imported
  const existing = await db.lead.findUnique({
    where: { googlePlaceId: place.placeId },
  });

  if (existing) {
    return { success: false, error: "This business has already been imported." };
  }

  const tier = calculateTier(place.reviewCount);
  const score = calculateScore(place.reviewCount, place.rating);

  const lead = await db.lead.create({
    data: {
      businessName: place.name,
      address: place.address,
      city: place.city,
      state: place.state,
      zipCode: place.zipCode,
      phone: place.phone,
      website: place.website,
      googlePlaceId: place.placeId,
      googleRating: place.rating,
      reviewCount: place.reviewCount,
      vertical: vertical,
      tier: tier as "TIER_1" | "TIER_2" | "TIER_3" | "TIER_4",
      score,
      status: "NEW",
      hasBookingSoftware: false, // Unknown at import time
    },
  });

  revalidatePath("/");
  revalidatePath("/leads");
  revalidatePath("/prospecting");

  return { success: true, leadId: lead.id };
}

export async function bulkImportLeads(
  places: PlaceResult[],
  vertical: BusinessVertical
) {
  const results = {
    imported: 0,
    skipped: 0,
    errors: 0,
  };

  for (const place of places) {
    if (place.alreadyImported) {
      results.skipped++;
      continue;
    }

    try {
      const result = await importAsLead(place, vertical);
      if (result.success) {
        results.imported++;
      } else {
        results.skipped++;
      }
    } catch {
      results.errors++;
    }
  }

  revalidatePath("/");
  revalidatePath("/leads");
  revalidatePath("/prospecting");

  return results;
}

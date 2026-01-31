"use server";

import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";

export type EnrichmentResult = {
  success: boolean;
  error?: string;
  data?: {
    hasBookingSoftware: boolean;
    bookingSoftwareDetected: string | null;
    logo: string | null;
    description: string | null;
    socialLinks: {
      facebook?: string;
      instagram?: string;
      twitter?: string;
      linkedin?: string;
      youtube?: string;
      yelp?: string;
    };
    services: string[];
    techStack: string[];
  };
};

// Common booking software patterns to detect
const BOOKING_SOFTWARE_PATTERNS: { name: string; patterns: RegExp[] }[] = [
  {
    name: "Calendly",
    patterns: [/calendly\.com/i, /calendly-inline-widget/i],
  },
  {
    name: "Acuity Scheduling",
    patterns: [/acuityscheduling\.com/i, /squareup\.com\/appointments/i],
  },
  {
    name: "Square Appointments",
    patterns: [/squareup\.com/i, /square\.site/i, /square-appointments/i],
  },
  {
    name: "ServiceTitan",
    patterns: [/servicetitan\.com/i, /servicetitan/i],
  },
  {
    name: "Housecall Pro",
    patterns: [/housecallpro\.com/i, /housecall/i],
  },
  {
    name: "Jobber",
    patterns: [/getjobber\.com/i, /jobber/i],
  },
  {
    name: "Mindbody",
    patterns: [/mindbodyonline\.com/i, /mindbody/i, /healcode\.com/i],
  },
  {
    name: "Vagaro",
    patterns: [/vagaro\.com/i],
  },
  {
    name: "Fresha",
    patterns: [/fresha\.com/i],
  },
  {
    name: "Booksy",
    patterns: [/booksy\.com/i],
  },
  {
    name: "StyleSeat",
    patterns: [/styleseat\.com/i],
  },
  {
    name: "SimplyBook",
    patterns: [/simplybook\.me/i],
  },
  {
    name: "Setmore",
    patterns: [/setmore\.com/i],
  },
  {
    name: "Book Like A Boss",
    patterns: [/booklikeaboss\.com/i],
  },
  {
    name: "Jane App",
    patterns: [/jane\.app/i, /janeapp\.com/i],
  },
  {
    name: "Practice Better",
    patterns: [/practicebetter\.io/i],
  },
  {
    name: "Schedulicity",
    patterns: [/schedulicity\.com/i],
  },
  {
    name: "GlossGenius",
    patterns: [/glossgenius\.com/i],
  },
  {
    name: "Boulevard",
    patterns: [/joinblvd\.com/i, /boulevard/i],
  },
  {
    name: "Zenoti",
    patterns: [/zenoti\.com/i],
  },
  {
    name: "Phorest",
    patterns: [/phorest\.com/i],
  },
  {
    name: "WellnessLiving",
    patterns: [/wellnessliving\.com/i],
  },
  {
    name: "Generic Online Booking",
    patterns: [
      /book\s*(now|online|appointment)/i,
      /schedule\s*(now|online|appointment)/i,
      /online\s*booking/i,
      /book-online/i,
      /appointment.*booking/i,
    ],
  },
];

// Social media patterns
const SOCIAL_PATTERNS = {
  facebook: /(?:facebook\.com|fb\.com)\/([^\/\?\s"']+)/i,
  instagram: /instagram\.com\/([^\/\?\s"']+)/i,
  twitter: /(?:twitter\.com|x\.com)\/([^\/\?\s"']+)/i,
  linkedin: /linkedin\.com\/(?:company|in)\/([^\/\?\s"']+)/i,
  youtube: /youtube\.com\/(?:channel|c|user|@)\/([^\/\?\s"']+)/i,
  yelp: /yelp\.com\/biz\/([^\/\?\s"']+)/i,
};

function extractMetaContent(html: string, property: string): string | null {
  // Try og: tags
  const ogMatch = html.match(
    new RegExp(`<meta[^>]*property=["']og:${property}["'][^>]*content=["']([^"']+)["']`, "i")
  ) || html.match(
    new RegExp(`<meta[^>]*content=["']([^"']+)["'][^>]*property=["']og:${property}["']`, "i")
  );
  if (ogMatch) return ogMatch[1];

  // Try name tags
  const nameMatch = html.match(
    new RegExp(`<meta[^>]*name=["']${property}["'][^>]*content=["']([^"']+)["']`, "i")
  ) || html.match(
    new RegExp(`<meta[^>]*content=["']([^"']+)["'][^>]*name=["']${property}["']`, "i")
  );
  if (nameMatch) return nameMatch[1];

  return null;
}

function detectBookingSoftware(html: string): { detected: boolean; name: string | null } {
  for (const software of BOOKING_SOFTWARE_PATTERNS) {
    for (const pattern of software.patterns) {
      if (pattern.test(html)) {
        // Skip generic patterns if they're just text mentions
        if (software.name === "Generic Online Booking") {
          // Check if it's actually a booking widget/link, not just text
          const hasBookingLink = /<a[^>]*href[^>]*book/i.test(html) ||
            /class=["'][^"']*book/i.test(html) ||
            /id=["'][^"']*book/i.test(html);
          if (hasBookingLink) {
            return { detected: true, name: "Online Booking (Unknown Provider)" };
          }
        } else {
          return { detected: true, name: software.name };
        }
      }
    }
  }
  return { detected: false, name: null };
}

function extractSocialLinks(html: string): Record<string, string> {
  const links: Record<string, string> = {};

  for (const [platform, pattern] of Object.entries(SOCIAL_PATTERNS)) {
    const match = html.match(pattern);
    if (match) {
      // Reconstruct the full URL
      const handle = match[1];
      switch (platform) {
        case "facebook":
          links[platform] = `https://facebook.com/${handle}`;
          break;
        case "instagram":
          links[platform] = `https://instagram.com/${handle}`;
          break;
        case "twitter":
          links[platform] = `https://x.com/${handle}`;
          break;
        case "linkedin":
          links[platform] = `https://linkedin.com/company/${handle}`;
          break;
        case "youtube":
          links[platform] = `https://youtube.com/${match[0].includes("@") ? "@" : "channel/"}${handle}`;
          break;
        case "yelp":
          links[platform] = `https://yelp.com/biz/${handle}`;
          break;
      }
    }
  }

  return links;
}

function extractServices(html: string): string[] {
  const services: Set<string> = new Set();

  // Look for common service-related patterns
  const servicePatterns = [
    /<li[^>]*class=["'][^"']*service[^"']*["'][^>]*>([^<]+)</gi,
    /<h[2-4][^>]*>([^<]*service[^<]*)</gi,
    /<a[^>]*href=["'][^"']*service[^"']*["'][^>]*>([^<]+)</gi,
  ];

  for (const pattern of servicePatterns) {
    let match;
    while ((match = pattern.exec(html)) !== null) {
      const service = match[1].trim();
      if (service.length > 2 && service.length < 100) {
        services.add(service);
      }
    }
  }

  return Array.from(services).slice(0, 10); // Limit to 10 services
}

function detectTechStack(html: string): string[] {
  const tech: Set<string> = new Set();

  const techPatterns: { name: string; pattern: RegExp }[] = [
    { name: "WordPress", pattern: /wp-content|wordpress/i },
    { name: "Wix", pattern: /wix\.com|wixsite/i },
    { name: "Squarespace", pattern: /squarespace\.com|sqsp\.com/i },
    { name: "Shopify", pattern: /shopify\.com|cdn\.shopify/i },
    { name: "Webflow", pattern: /webflow\.com/i },
    { name: "GoDaddy", pattern: /godaddy\.com|secureserver\.net/i },
    { name: "Google Analytics", pattern: /google-analytics|gtag|googletagmanager/i },
    { name: "Facebook Pixel", pattern: /facebook\.net.*fbevents|fbq\(/i },
    { name: "Hotjar", pattern: /hotjar\.com/i },
    { name: "Intercom", pattern: /intercom\.io|intercomcdn/i },
    { name: "Drift", pattern: /drift\.com|driftt\.com/i },
    { name: "HubSpot", pattern: /hubspot\.com|hs-scripts/i },
    { name: "Mailchimp", pattern: /mailchimp\.com|list-manage\.com/i },
  ];

  for (const { name, pattern } of techPatterns) {
    if (pattern.test(html)) {
      tech.add(name);
    }
  }

  return Array.from(tech);
}

export async function enrichLead(leadId: string): Promise<EnrichmentResult> {
  try {
    // Get the lead
    const lead = await db.lead.findUnique({
      where: { id: leadId },
    });

    if (!lead) {
      return { success: false, error: "Lead not found" };
    }

    if (!lead.website) {
      return { success: false, error: "No website URL for this lead" };
    }

    // Normalize the URL
    let url = lead.website;
    if (!url.startsWith("http")) {
      url = `https://${url}`;
    }

    // Fetch the website
    let html: string;
    try {
      const response = await fetch(url, {
        headers: {
          "User-Agent": "Mozilla/5.0 (compatible; EGLeadsBot/1.0; +https://egleads.com)",
        },
        redirect: "follow",
      });

      if (!response.ok) {
        return { success: false, error: `Failed to fetch website: ${response.status}` };
      }

      html = await response.text();
    } catch (fetchError) {
      // Try with www prefix if it failed
      try {
        const wwwUrl = url.replace("https://", "https://www.");
        const response = await fetch(wwwUrl, {
          headers: {
            "User-Agent": "Mozilla/5.0 (compatible; EGLeadsBot/1.0; +https://egleads.com)",
          },
          redirect: "follow",
        });
        html = await response.text();
      } catch {
        return { success: false, error: "Could not connect to website" };
      }
    }

    // Extract data
    const bookingResult = detectBookingSoftware(html);
    const logo = extractMetaContent(html, "image") || extractMetaContent(html, "logo");
    const description = extractMetaContent(html, "description");
    const socialLinks = extractSocialLinks(html);
    const services = extractServices(html);
    const techStack = detectTechStack(html);

    // Update the lead
    const updateData: {
      hasBookingSoftware: boolean;
      currentBookingTool?: string;
      notes?: string;
      tier?: "TIER_1" | "TIER_2" | "TIER_3" | "TIER_4";
      score?: number;
    } = {
      hasBookingSoftware: bookingResult.detected,
    };

    if (bookingResult.name) {
      updateData.currentBookingTool = bookingResult.name;
    }

    // Recalculate tier if booking software status changed
    if (bookingResult.detected !== lead.hasBookingSoftware) {
      // If they have booking software, they're lower priority
      if (bookingResult.detected) {
        // Decrease tier priority
        const tierOrder = ["TIER_1", "TIER_2", "TIER_3", "TIER_4"] as const;
        const currentIndex = tierOrder.indexOf(lead.tier);
        if (currentIndex < 3) {
          updateData.tier = tierOrder[currentIndex + 1];
        }
        // Decrease score
        updateData.score = Math.max(0, (lead.score || 50) - 15);
      }
    }

    // Add enrichment notes
    const enrichmentNotes: string[] = [];
    if (bookingResult.detected) {
      enrichmentNotes.push(`Booking Software: ${bookingResult.name}`);
    } else {
      enrichmentNotes.push("No booking software detected - PRIME TARGET");
    }
    if (techStack.length > 0) {
      enrichmentNotes.push(`Tech Stack: ${techStack.join(", ")}`);
    }
    if (Object.keys(socialLinks).length > 0) {
      enrichmentNotes.push(`Social: ${Object.keys(socialLinks).join(", ")}`);
    }
    if (services.length > 0) {
      enrichmentNotes.push(`Services found: ${services.length}`);
    }

    // Append to existing notes
    const existingNotes = lead.notes || "";
    const enrichmentSection = `\n\n--- Enrichment (${new Date().toLocaleDateString()}) ---\n${enrichmentNotes.join("\n")}`;
    updateData.notes = existingNotes + enrichmentSection;

    await db.lead.update({
      where: { id: leadId },
      data: updateData,
    });

    revalidatePath(`/leads/${leadId}`);
    revalidatePath("/leads");
    revalidatePath("/");

    return {
      success: true,
      data: {
        hasBookingSoftware: bookingResult.detected,
        bookingSoftwareDetected: bookingResult.name,
        logo,
        description,
        socialLinks,
        services,
        techStack,
      },
    };
  } catch (error) {
    console.error("Enrichment error:", error);
    return { success: false, error: "Failed to enrich lead" };
  }
}

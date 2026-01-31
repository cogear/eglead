"use server";

import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";
import {
  BedrockRuntimeClient,
  InvokeModelCommand,
} from "@aws-sdk/client-bedrock-runtime";

export type ServiceInfo = {
  name: string;
  description?: string;
  price?: string;
  duration?: string;
};

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
    services: ServiceInfo[];
    pricing: {
      hasPublicPricing: boolean;
      priceRange?: string;
      items: { service: string; price: string }[];
    };
    techStack: string[];
    llmExtracted: boolean;
  };
};

// Common booking software patterns to detect
const BOOKING_SOFTWARE_PATTERNS: { name: string; patterns: RegExp[] }[] = [
  { name: "Calendly", patterns: [/calendly\.com/i, /calendly-inline-widget/i] },
  { name: "Acuity Scheduling", patterns: [/acuityscheduling\.com/i, /squareup\.com\/appointments/i] },
  { name: "Square Appointments", patterns: [/squareup\.com/i, /square\.site/i, /square-appointments/i] },
  { name: "ServiceTitan", patterns: [/servicetitan\.com/i, /servicetitan/i] },
  { name: "Housecall Pro", patterns: [/housecallpro\.com/i, /housecall/i] },
  { name: "Jobber", patterns: [/getjobber\.com/i, /jobber/i] },
  { name: "Mindbody", patterns: [/mindbodyonline\.com/i, /mindbody/i, /healcode\.com/i] },
  { name: "Vagaro", patterns: [/vagaro\.com/i] },
  { name: "Fresha", patterns: [/fresha\.com/i] },
  { name: "Booksy", patterns: [/booksy\.com/i] },
  { name: "StyleSeat", patterns: [/styleseat\.com/i] },
  { name: "SimplyBook", patterns: [/simplybook\.me/i] },
  { name: "Setmore", patterns: [/setmore\.com/i] },
  { name: "Jane App", patterns: [/jane\.app/i, /janeapp\.com/i] },
  { name: "Practice Better", patterns: [/practicebetter\.io/i] },
  { name: "Schedulicity", patterns: [/schedulicity\.com/i] },
  { name: "GlossGenius", patterns: [/glossgenius\.com/i] },
  { name: "Boulevard", patterns: [/joinblvd\.com/i, /boulevard/i] },
  { name: "Zenoti", patterns: [/zenoti\.com/i] },
  { name: "Phorest", patterns: [/phorest\.com/i] },
  { name: "WellnessLiving", patterns: [/wellnessliving\.com/i] },
  {
    name: "Generic Online Booking",
    patterns: [/book\s*(now|online|appointment)/i, /schedule\s*(now|online|appointment)/i, /online\s*booking/i],
  },
];

const SOCIAL_PATTERNS = {
  facebook: /(?:facebook\.com|fb\.com)\/([^\/\?\s"']+)/i,
  instagram: /instagram\.com\/([^\/\?\s"']+)/i,
  twitter: /(?:twitter\.com|x\.com)\/([^\/\?\s"']+)/i,
  linkedin: /linkedin\.com\/(?:company|in)\/([^\/\?\s"']+)/i,
  youtube: /youtube\.com\/(?:channel|c|user|@)\/([^\/\?\s"']+)/i,
  yelp: /yelp\.com\/biz\/([^\/\?\s"']+)/i,
};

function extractMetaContent(html: string, property: string): string | null {
  const ogMatch = html.match(
    new RegExp(`<meta[^>]*property=["']og:${property}["'][^>]*content=["']([^"']+)["']`, "i")
  ) || html.match(
    new RegExp(`<meta[^>]*content=["']([^"']+)["'][^>]*property=["']og:${property}["']`, "i")
  );
  if (ogMatch) return ogMatch[1];

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
        if (software.name === "Generic Online Booking") {
          const hasBookingLink = /<a[^>]*href[^>]*book/i.test(html) ||
            /class=["'][^"']*book/i.test(html);
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
      const handle = match[1];
      const urls: Record<string, string> = {
        facebook: `https://facebook.com/${handle}`,
        instagram: `https://instagram.com/${handle}`,
        twitter: `https://x.com/${handle}`,
        linkedin: `https://linkedin.com/company/${handle}`,
        youtube: `https://youtube.com/@${handle}`,
        yelp: `https://yelp.com/biz/${handle}`,
      };
      links[platform] = urls[platform];
    }
  }
  return links;
}

function detectTechStack(html: string): string[] {
  const tech: Set<string> = new Set();
  const patterns: { name: string; pattern: RegExp }[] = [
    { name: "WordPress", pattern: /wp-content|wordpress/i },
    { name: "Wix", pattern: /wix\.com|wixsite/i },
    { name: "Squarespace", pattern: /squarespace\.com|sqsp\.com/i },
    { name: "Shopify", pattern: /shopify\.com|cdn\.shopify/i },
    { name: "Webflow", pattern: /webflow\.com/i },
    { name: "GoDaddy", pattern: /godaddy\.com|secureserver\.net/i },
    { name: "Google Analytics", pattern: /google-analytics|gtag|googletagmanager/i },
    { name: "Facebook Pixel", pattern: /facebook\.net.*fbevents|fbq\(/i },
    { name: "HubSpot", pattern: /hubspot\.com|hs-scripts/i },
  ];
  for (const { name, pattern } of patterns) {
    if (pattern.test(html)) tech.add(name);
  }
  return Array.from(tech);
}

function stripHtml(html: string): string {
  // Remove script and style tags and their content
  let text = html.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, " ");
  text = text.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, " ");
  // Remove HTML tags
  text = text.replace(/<[^>]+>/g, " ");
  // Decode HTML entities
  text = text.replace(/&nbsp;/g, " ");
  text = text.replace(/&amp;/g, "&");
  text = text.replace(/&lt;/g, "<");
  text = text.replace(/&gt;/g, ">");
  text = text.replace(/&quot;/g, '"');
  text = text.replace(/&#39;/g, "'");
  // Normalize whitespace
  text = text.replace(/\s+/g, " ").trim();
  return text;
}

async function extractWithLLM(
  websiteText: string,
  businessName: string
): Promise<{
  services: ServiceInfo[];
  pricing: { hasPublicPricing: boolean; priceRange?: string; items: { service: string; price: string }[] };
  description: string;
} | null> {
  const accessKeyId = process.env.AWS_ACCESS_KEY_ID;
  const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;
  const region = process.env.AWS_REGION || "us-east-1";

  if (!accessKeyId || !secretAccessKey) {
    console.log("AWS credentials not configured, skipping LLM extraction");
    return null;
  }

  const client = new BedrockRuntimeClient({
    region,
    credentials: {
      accessKeyId,
      secretAccessKey,
    },
  });

  // Truncate text to avoid token limits
  const truncatedText = websiteText.slice(0, 15000);

  const prompt = `Analyze this website content for a business called "${businessName}" and extract services and pricing information.

Website content:
${truncatedText}

Return a JSON object with this exact structure (no markdown, just JSON):
{
  "description": "A 1-2 sentence description of what this business does",
  "services": [
    {
      "name": "Service name",
      "description": "Brief description if available",
      "price": "$XX or price range if found",
      "duration": "Duration if mentioned (e.g., 30 min, 1 hour)"
    }
  ],
  "pricing": {
    "hasPublicPricing": true/false,
    "priceRange": "e.g., $50-$200 or 'Contact for pricing'",
    "items": [
      {"service": "Service name", "price": "$XX"}
    ]
  }
}

If no services or pricing found, use empty arrays. Only include services and prices you actually find in the content.`;

  try {
    const command = new InvokeModelCommand({
      modelId: "anthropic.claude-3-haiku-20240307-v1:0",
      contentType: "application/json",
      accept: "application/json",
      body: JSON.stringify({
        anthropic_version: "bedrock-2023-05-31",
        max_tokens: 2000,
        messages: [
          {
            role: "user",
            content: prompt,
          },
        ],
      }),
    });

    const response = await client.send(command);
    const responseBody = JSON.parse(new TextDecoder().decode(response.body));
    const content = responseBody.content?.[0]?.text || "";

    // Extract JSON from response
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      return {
        services: parsed.services || [],
        pricing: parsed.pricing || { hasPublicPricing: false, items: [] },
        description: parsed.description || "",
      };
    }
  } catch (error) {
    console.error("LLM extraction error:", error);
  }

  return null;
}

export async function enrichLead(leadId: string): Promise<EnrichmentResult> {
  try {
    const lead = await db.lead.findUnique({ where: { id: leadId } });

    if (!lead) {
      return { success: false, error: "Lead not found" };
    }

    if (!lead.website) {
      return { success: false, error: "No website URL for this lead" };
    }

    let url = lead.website;
    if (!url.startsWith("http")) {
      url = `https://${url}`;
    }

    // Fetch the website
    let html: string;
    try {
      const response = await fetch(url, {
        headers: {
          "User-Agent": "Mozilla/5.0 (compatible; EGLeadsBot/1.0)",
        },
        redirect: "follow",
      });

      if (!response.ok) {
        return { success: false, error: `Failed to fetch website: ${response.status}` };
      }

      html = await response.text();
    } catch {
      try {
        const wwwUrl = url.replace("https://", "https://www.");
        const response = await fetch(wwwUrl, {
          headers: { "User-Agent": "Mozilla/5.0 (compatible; EGLeadsBot/1.0)" },
          redirect: "follow",
        });
        html = await response.text();
      } catch {
        return { success: false, error: "Could not connect to website" };
      }
    }

    // Basic extraction
    const bookingResult = detectBookingSoftware(html);
    const logo = extractMetaContent(html, "image");
    const metaDescription = extractMetaContent(html, "description");
    const socialLinks = extractSocialLinks(html);
    const techStack = detectTechStack(html);

    // LLM extraction for services and pricing
    const websiteText = stripHtml(html);
    const llmResult = await extractWithLLM(websiteText, lead.businessName);

    const services: ServiceInfo[] = llmResult?.services || [];
    const pricing = llmResult?.pricing || { hasPublicPricing: false, items: [] };
    const description = llmResult?.description || metaDescription;

    // Update the lead
    const updateData: Record<string, unknown> = {
      hasBookingSoftware: bookingResult.detected,
      currentBookingTool: bookingResult.name,
      socialLinks: JSON.stringify(socialLinks),
      servicesOffered: JSON.stringify(services),
      pricingInfo: JSON.stringify(pricing),
      businessDescription: description,
    };

    // Recalculate tier if booking software status changed
    if (bookingResult.detected && !lead.hasBookingSoftware) {
      const tierOrder = ["TIER_1", "TIER_2", "TIER_3", "TIER_4"] as const;
      const currentIndex = tierOrder.indexOf(lead.tier);
      if (currentIndex < 3) {
        updateData.tier = tierOrder[currentIndex + 1];
      }
      updateData.score = Math.max(0, (lead.score || 50) - 15);
    }

    // Build enrichment notes
    const enrichmentNotes: string[] = [];
    if (bookingResult.detected) {
      enrichmentNotes.push(`Booking Software: ${bookingResult.name}`);
    } else {
      enrichmentNotes.push("No booking software detected - PRIME TARGET");
    }
    if (services.length > 0) {
      enrichmentNotes.push(`Services: ${services.map((s) => s.name).join(", ")}`);
    }
    if (pricing.hasPublicPricing && pricing.items.length > 0) {
      enrichmentNotes.push(`Pricing: ${pricing.items.map((p) => `${p.service}: ${p.price}`).join(", ")}`);
    }
    if (techStack.length > 0) {
      enrichmentNotes.push(`Tech: ${techStack.join(", ")}`);
    }
    if (Object.keys(socialLinks).length > 0) {
      enrichmentNotes.push(`Social: ${Object.keys(socialLinks).join(", ")}`);
    }

    const existingNotes = lead.notes || "";
    updateData.notes = existingNotes + `\n\n--- Enrichment (${new Date().toLocaleDateString()}) ---\n${enrichmentNotes.join("\n")}`;

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
        pricing,
        techStack,
        llmExtracted: !!llmResult,
      },
    };
  } catch (error) {
    console.error("Enrichment error:", error);
    return { success: false, error: "Failed to enrich lead" };
  }
}

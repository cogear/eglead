import { db } from "@/lib/db";
import { notFound } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Phone,
  Mail,
  ExternalLink,
  MapPin,
  Star,
  Calendar,
  Building,
  Edit,
  Briefcase,
  DollarSign,
} from "lucide-react";
import Link from "next/link";
import { LeadStatusSelect } from "@/components/dashboard/lead-status-select";
import { DeleteLeadButton } from "@/components/dashboard/delete-lead-button";
import { ActivityList } from "@/components/dashboard/activity-list";
import { AddActivityForm } from "@/components/dashboard/add-activity-form";
import { EnrichButton } from "@/components/dashboard/enrich-button";

const statusColors: Record<string, string> = {
  NEW: "bg-blue-100 text-blue-800",
  CONTACTED: "bg-yellow-100 text-yellow-800",
  QUALIFIED: "bg-purple-100 text-purple-800",
  DEMO_SCHEDULED: "bg-indigo-100 text-indigo-800",
  DEMO_COMPLETED: "bg-cyan-100 text-cyan-800",
  PROPOSAL_SENT: "bg-orange-100 text-orange-800",
  NEGOTIATING: "bg-pink-100 text-pink-800",
  CLOSED_WON: "bg-green-100 text-green-800",
  CLOSED_LOST: "bg-red-100 text-red-800",
};

const tierColors: Record<string, string> = {
  TIER_1: "bg-green-100 text-green-800",
  TIER_2: "bg-blue-100 text-blue-800",
  TIER_3: "bg-yellow-100 text-yellow-800",
  TIER_4: "bg-gray-100 text-gray-800",
};

const tierDescriptions: Record<string, string> = {
  TIER_1: "Prime Target - Established, low reviews, no booking tool",
  TIER_2: "Good Prospect - Meets 2 of 3 criteria",
  TIER_3: "Potential - Meets 1 criterion",
  TIER_4: "Low Priority",
};

type Props = {
  params: Promise<{ id: string }>;
};

async function getLead(id: string) {
  const lead = await db.lead.findUnique({
    where: { id },
    include: {
      activities: {
        orderBy: { createdAt: "desc" },
        take: 10,
      },
      calls: {
        orderBy: { createdAt: "desc" },
        take: 5,
      },
    },
  });
  return lead;
}

export default async function LeadDetailPage({ params }: Props) {
  const { id } = await params;
  const lead = await getLead(id);

  if (!lead) {
    notFound();
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-4">
            <h1 className="text-3xl font-bold tracking-tight">
              {lead.businessName}
            </h1>
            <Badge className={tierColors[lead.tier]}>
              {lead.tier.replace("_", " ")}
            </Badge>
            <Badge className={statusColors[lead.status]}>
              {lead.status.replace(/_/g, " ")}
            </Badge>
          </div>
          <p className="text-muted-foreground mt-1">
            {tierDescriptions[lead.tier]}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" asChild>
            <Link href={`/leads/${id}/edit`}>
              <Edit className="mr-2 h-4 w-4" />
              Edit
            </Link>
          </Button>
          <DeleteLeadButton id={lead.id} />
        </div>
      </div>

      {/* Quick Actions */}
      <div className="flex items-center gap-4">
        {lead.phone && (
          <Button asChild>
            <a href={`tel:${lead.phone}`}>
              <Phone className="mr-2 h-4 w-4" />
              Call {lead.phone}
            </a>
          </Button>
        )}
        {lead.email && (
          <Button variant="outline" asChild>
            <a href={`mailto:${lead.email}`}>
              <Mail className="mr-2 h-4 w-4" />
              Email
            </a>
          </Button>
        )}
        {lead.website && (
          <Button variant="outline" asChild>
            <a href={lead.website} target="_blank" rel="noopener noreferrer">
              <ExternalLink className="mr-2 h-4 w-4" />
              Website
            </a>
          </Button>
        )}
        <EnrichButton leadId={lead.id} hasWebsite={!!lead.website} />
        <div className="ml-auto">
          <LeadStatusSelect id={lead.id} currentStatus={lead.status} />
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Main Content */}
        <div className="md:col-span-2 space-y-6">
          <Tabs defaultValue="overview">
            <TabsList>
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="activity">Activity</TabsTrigger>
              <TabsTrigger value="value-gap">Value Gap</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-4">
              {/* Contact Info */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Contact Information</CardTitle>
                </CardHeader>
                <CardContent className="grid gap-4">
                  {lead.contactName && (
                    <div className="flex items-center gap-2">
                      <Building className="h-4 w-4 text-muted-foreground" />
                      <span>{lead.contactName}</span>
                    </div>
                  )}
                  {lead.phone && (
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <a href={`tel:${lead.phone}`} className="hover:underline">
                        {lead.phone}
                      </a>
                    </div>
                  )}
                  {lead.email && (
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <a
                        href={`mailto:${lead.email}`}
                        className="hover:underline"
                      >
                        {lead.email}
                      </a>
                    </div>
                  )}
                  {(lead.address || lead.city || lead.state) && (
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      <span>
                        {[lead.address, lead.city, lead.state, lead.zipCode]
                          .filter(Boolean)
                          .join(", ")}
                      </span>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Business Metrics */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Business Metrics</CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Vertical</p>
                    <p className="font-medium">
                      {lead.vertical.replace(/_/g, " ")}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">
                      Years in Business
                    </p>
                    <p className="font-medium">
                      {lead.yearsInBusiness ?? "Unknown"}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">
                      Google Reviews
                    </p>
                    <p className="font-medium flex items-center gap-1">
                      {lead.reviewCount ?? "Unknown"}
                      {lead.googleRating && (
                        <>
                          <Star className="h-4 w-4 text-yellow-500 fill-yellow-500 ml-2" />
                          {lead.googleRating}
                        </>
                      )}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">
                      Booking Software
                    </p>
                    <p className="font-medium">
                      {lead.hasBookingSoftware
                        ? lead.currentBookingTool || "Yes"
                        : "None"}
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Services & Pricing */}
              {(lead.servicesOffered || lead.pricingInfo) && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Briefcase className="h-5 w-5" />
                      Services & Pricing
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {lead.servicesOffered && (() => {
                      try {
                        const services = JSON.parse(lead.servicesOffered);
                        if (services.length > 0) {
                          return (
                            <div>
                              <p className="text-sm font-medium mb-2">Services Offered</p>
                              <div className="space-y-2">
                                {services.map((service: { name: string; description?: string; price?: string; duration?: string }, i: number) => (
                                  <div key={i} className="flex justify-between items-start p-2 bg-gray-50 rounded">
                                    <div>
                                      <span className="font-medium">{service.name}</span>
                                      {service.description && (
                                        <p className="text-sm text-muted-foreground">{service.description}</p>
                                      )}
                                      {service.duration && (
                                        <span className="text-xs text-muted-foreground">({service.duration})</span>
                                      )}
                                    </div>
                                    {service.price && (
                                      <span className="text-green-600 font-medium">{service.price}</span>
                                    )}
                                  </div>
                                ))}
                              </div>
                            </div>
                          );
                        }
                      } catch { return null; }
                      return null;
                    })()}
                    {lead.pricingInfo && (() => {
                      try {
                        const pricing = JSON.parse(lead.pricingInfo);
                        if (pricing.hasPublicPricing && pricing.items?.length > 0) {
                          return (
                            <div>
                              <p className="text-sm font-medium mb-2 flex items-center gap-2">
                                <DollarSign className="h-4 w-4" />
                                Pricing
                                {pricing.priceRange && (
                                  <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded">
                                    {pricing.priceRange}
                                  </span>
                                )}
                              </p>
                              <div className="space-y-1">
                                {pricing.items.map((item: { service: string; price: string }, i: number) => (
                                  <div key={i} className="flex justify-between text-sm p-2 bg-gray-50 rounded">
                                    <span>{item.service}</span>
                                    <span className="text-green-600 font-medium">{item.price}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          );
                        }
                      } catch { return null; }
                      return null;
                    })()}
                  </CardContent>
                </Card>
              )}

              {/* Notes */}
              {lead.notes && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Notes</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="whitespace-pre-wrap">{lead.notes}</p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="activity" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Add Activity</CardTitle>
                </CardHeader>
                <CardContent>
                  <AddActivityForm leadId={lead.id} />
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Activity History</CardTitle>
                </CardHeader>
                <CardContent>
                  <ActivityList activities={lead.activities} />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="value-gap" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Value Gap Analysis</CardTitle>
                </CardHeader>
                <CardContent>
                  {lead.valueGapReport ? (
                    <div className="whitespace-pre-wrap">
                      {lead.valueGapReport}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      <p>No value gap report generated yet.</p>
                      <p className="text-sm mt-2">
                        AI-powered analysis will be available when connected to
                        Amazon Bedrock.
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Score Card */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Lead Score</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center">
                <div className="text-5xl font-bold">{lead.score}</div>
                <p className="text-sm text-muted-foreground mt-1">out of 100</p>
                <div className="mt-4 w-full bg-gray-200 rounded-full h-3">
                  <div
                    className="bg-primary h-3 rounded-full"
                    style={{ width: `${lead.score}%` }}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Timeline */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Timeline</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Created</p>
                  <p className="text-sm font-medium">
                    {lead.createdAt.toLocaleDateString()}
                  </p>
                </div>
              </div>
              {lead.lastContactDate && (
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">
                      Last Contact
                    </p>
                    <p className="text-sm font-medium">
                      {lead.lastContactDate.toLocaleDateString()}
                    </p>
                  </div>
                </div>
              )}
              {lead.nextFollowUp && (
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">
                      Next Follow-up
                    </p>
                    <p className="text-sm font-medium">
                      {lead.nextFollowUp.toLocaleDateString()}
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Competitor Info */}
          {(lead.competitorReviewAvg || lead.competitorCount) && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Competitor Analysis</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {lead.competitorCount && (
                  <div>
                    <p className="text-sm text-muted-foreground">
                      Competitors Found
                    </p>
                    <p className="font-medium">{lead.competitorCount}</p>
                  </div>
                )}
                {lead.competitorReviewAvg && (
                  <div>
                    <p className="text-sm text-muted-foreground">
                      Avg Competitor Reviews
                    </p>
                    <p className="font-medium">
                      {lead.competitorReviewAvg.toFixed(0)}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

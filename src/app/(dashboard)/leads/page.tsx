import { db } from "@/lib/db";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Plus, Phone, Mail, ExternalLink } from "lucide-react";
import Link from "next/link";
import { LeadFilters } from "@/components/dashboard/lead-filters";
import { LeadStatus, LeadTier, BusinessVertical } from "@prisma/client";

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

type SearchParams = Promise<{
  status?: string;
  tier?: string;
  vertical?: string;
  search?: string;
}>;

async function getLeads(searchParams: Awaited<SearchParams>) {
  try {
    const where: {
      status?: LeadStatus;
      tier?: LeadTier;
      vertical?: BusinessVertical;
      OR?: { businessName: { contains: string; mode: "insensitive" } }[];
    } = {};

    if (searchParams.status && searchParams.status !== "all") {
      where.status = searchParams.status as LeadStatus;
    }
    if (searchParams.tier && searchParams.tier !== "all") {
      where.tier = searchParams.tier as LeadTier;
    }
    if (searchParams.vertical && searchParams.vertical !== "all") {
      where.vertical = searchParams.vertical as BusinessVertical;
    }
    if (searchParams.search) {
      where.OR = [
        { businessName: { contains: searchParams.search, mode: "insensitive" } },
      ];
    }

    return await db.lead.findMany({
      where,
      orderBy: [{ tier: "asc" }, { score: "desc" }, { createdAt: "desc" }],
    });
  } catch {
    return [];
  }
}

export default async function LeadsPage(props: { searchParams: SearchParams }) {
  const searchParams = await props.searchParams;
  const leads = await getLeads(searchParams);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Leads</h1>
          <p className="text-muted-foreground">
            Manage and prioritize your sales prospects
          </p>
        </div>
        <Button asChild>
          <Link href="/leads/new">
            <Plus className="mr-2 h-4 w-4" />
            Add Lead
          </Link>
        </Button>
      </div>

      <LeadFilters />

      <Card>
        <CardHeader>
          <CardTitle>Lead Pipeline ({leads.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {leads.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <p>No leads found. Add your first lead to get started.</p>
              <Button asChild className="mt-4">
                <Link href="/leads/new">
                  <Plus className="mr-2 h-4 w-4" />
                  Add Lead
                </Link>
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Business</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Vertical</TableHead>
                  <TableHead>Reviews</TableHead>
                  <TableHead>Tier</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Score</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {leads.map((lead) => (
                  <TableRow key={lead.id}>
                    <TableCell>
                      <Link
                        href={`/leads/${lead.id}`}
                        className="font-medium hover:underline"
                      >
                        {lead.businessName}
                      </Link>
                      {lead.contactName && (
                        <p className="text-sm text-muted-foreground">
                          {lead.contactName}
                        </p>
                      )}
                    </TableCell>
                    <TableCell>
                      {lead.city && lead.state
                        ? `${lead.city}, ${lead.state}`
                        : "-"}
                    </TableCell>
                    <TableCell>
                      {lead.vertical.replace(/_/g, " ")}
                    </TableCell>
                    <TableCell>
                      {lead.reviewCount !== null ? (
                        <span
                          className={
                            lead.reviewCount < 25
                              ? "text-green-600 font-medium"
                              : ""
                          }
                        >
                          {lead.reviewCount}
                        </span>
                      ) : (
                        "-"
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge className={tierColors[lead.tier]}>
                        {lead.tier.replace("_", " ")}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge className={statusColors[lead.status]}>
                        {lead.status.replace(/_/g, " ")}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="w-12 bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-primary h-2 rounded-full"
                            style={{ width: `${lead.score}%` }}
                          />
                        </div>
                        <span className="text-sm">{lead.score}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        {lead.phone && (
                          <Button variant="ghost" size="icon" asChild>
                            <a href={`tel:${lead.phone}`}>
                              <Phone className="h-4 w-4" />
                            </a>
                          </Button>
                        )}
                        {lead.email && (
                          <Button variant="ghost" size="icon" asChild>
                            <a href={`mailto:${lead.email}`}>
                              <Mail className="h-4 w-4" />
                            </a>
                          </Button>
                        )}
                        {lead.website && (
                          <Button variant="ghost" size="icon" asChild>
                            <a
                              href={lead.website}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              <ExternalLink className="h-4 w-4" />
                            </a>
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

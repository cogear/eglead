import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Users, Phone, Target, TrendingUp, Plus } from "lucide-react";
import Link from "next/link";
import { db } from "@/lib/db";

async function getStats() {
  try {
    const [totalLeads, newLeads, tier1Leads, contactedToday] = await Promise.all([
      db.lead.count(),
      db.lead.count({ where: { status: "NEW" } }),
      db.lead.count({ where: { tier: "TIER_1" } }),
      db.lead.count({
        where: {
          lastContactDate: {
            gte: new Date(new Date().setHours(0, 0, 0, 0)),
          },
        },
      }),
    ]);
    return { totalLeads, newLeads, tier1Leads, contactedToday };
  } catch {
    // Database not connected yet
    return { totalLeads: 0, newLeads: 0, tier1Leads: 0, contactedToday: 0 };
  }
}

async function getRecentLeads() {
  try {
    return await db.lead.findMany({
      take: 5,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        businessName: true,
        status: true,
        tier: true,
        city: true,
        state: true,
        vertical: true,
        reviewCount: true,
      },
    });
  } catch {
    return [];
  }
}

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

export default async function DashboardPage() {
  const stats = await getStats();
  const recentLeads = await getRecentLeads();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">War Room</h1>
          <p className="text-muted-foreground">
            Your command center for lead acquisition
          </p>
        </div>
        <Button asChild>
          <Link href="/leads/new">
            <Plus className="mr-2 h-4 w-4" />
            Add Lead
          </Link>
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Leads</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalLeads}</div>
            <p className="text-xs text-muted-foreground">In your pipeline</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">New Leads</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.newLeads}</div>
            <p className="text-xs text-muted-foreground">Awaiting contact</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tier 1 Leads</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.tier1Leads}</div>
            <p className="text-xs text-muted-foreground">Prime targets</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Contacted Today</CardTitle>
            <Phone className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.contactedToday}</div>
            <p className="text-xs text-muted-foreground">Calls made today</p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Leads */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Recent Leads</CardTitle>
          <Button variant="outline" size="sm" asChild>
            <Link href="/leads">View all</Link>
          </Button>
        </CardHeader>
        <CardContent>
          {recentLeads.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Users className="mx-auto h-12 w-12 mb-4 opacity-50" />
              <p>No leads yet. Add your first lead to get started.</p>
              <Button asChild className="mt-4">
                <Link href="/leads/new">
                  <Plus className="mr-2 h-4 w-4" />
                  Add Lead
                </Link>
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {recentLeads.map((lead) => (
                <Link
                  key={lead.id}
                  href={`/leads/${lead.id}`}
                  className="flex items-center justify-between p-4 rounded-lg border hover:bg-muted/50 transition-colors"
                >
                  <div className="space-y-1">
                    <p className="font-medium">{lead.businessName}</p>
                    <p className="text-sm text-muted-foreground">
                      {lead.city && lead.state
                        ? `${lead.city}, ${lead.state}`
                        : lead.vertical?.replace(/_/g, " ")}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {lead.reviewCount !== null && (
                      <span className="text-sm text-muted-foreground">
                        {lead.reviewCount} reviews
                      </span>
                    )}
                    <Badge className={tierColors[lead.tier]}>
                      {lead.tier.replace("_", " ")}
                    </Badge>
                    <Badge className={statusColors[lead.status]}>
                      {lead.status.replace(/_/g, " ")}
                    </Badge>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

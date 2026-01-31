import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ProspectingSearch } from "@/components/dashboard/prospecting-search";
import { Search } from "lucide-react";

export default function ProspectingPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Prospecting</h1>
        <p className="text-muted-foreground">
          Search Google Maps for businesses and import them as leads
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Find Prospects
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ProspectingSearch />
        </CardContent>
      </Card>
    </div>
  );
}

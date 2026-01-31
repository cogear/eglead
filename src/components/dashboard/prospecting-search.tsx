"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  searchPlaces,
  importAsLead,
  bulkImportLeads,
  PlaceResult,
} from "@/actions/prospecting";
import { BusinessVertical } from "@prisma/client";
import { toast } from "sonner";
import {
  Loader2,
  Search,
  Star,
  Phone,
  Globe,
  Check,
  Plus,
  Download,
} from "lucide-react";
import Link from "next/link";

const verticals = [
  { value: "all", label: "All Business Types" },
  { value: "plumber", label: "Plumbing" },
  { value: "hvac", label: "HVAC" },
  { value: "roofing", label: "Roofing" },
  { value: "electrician", label: "Electrical" },
  { value: "landscaper", label: "Landscaping" },
  { value: "cleaning service", label: "Cleaning" },
  { value: "auto repair", label: "Auto Repair" },
  { value: "hair salon", label: "Salon/Spa" },
  { value: "dentist", label: "Dental" },
  { value: "doctor", label: "Medical" },
  { value: "lawyer", label: "Legal" },
  { value: "accountant", label: "Accounting" },
  { value: "real estate", label: "Real Estate" },
  { value: "restaurant", label: "Restaurant" },
];

const verticalMap: Record<string, BusinessVertical> = {
  all: "OTHER",
  plumber: "PLUMBING",
  hvac: "HVAC",
  roofing: "ROOFING",
  electrician: "ELECTRICAL",
  landscaper: "LANDSCAPING",
  "cleaning service": "CLEANING",
  "auto repair": "AUTO_REPAIR",
  "hair salon": "SALON_SPA",
  dentist: "DENTAL",
  doctor: "MEDICAL",
  lawyer: "LEGAL",
  accountant: "ACCOUNTING",
  "real estate": "REAL_ESTATE",
  restaurant: "RESTAURANT",
};

const tierColors: Record<string, string> = {
  TIER_1: "bg-green-100 text-green-800",
  TIER_2: "bg-blue-100 text-blue-800",
  TIER_3: "bg-yellow-100 text-yellow-800",
  TIER_4: "bg-gray-100 text-gray-800",
};

function getTier(reviewCount: number): string {
  if (reviewCount < 15) return "TIER_1";
  if (reviewCount < 30) return "TIER_2";
  if (reviewCount < 75) return "TIER_3";
  return "TIER_4";
}

export function ProspectingSearch() {
  const [location, setLocation] = useState("");
  const [vertical, setVertical] = useState("plumber");
  const [radius, setRadius] = useState("10");
  const [results, setResults] = useState<PlaceResult[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isSearching, startSearch] = useTransition();
  const [importingIds, setImportingIds] = useState<Set<string>>(new Set());
  const [importedIds, setImportedIds] = useState<Set<string>>(new Set());
  const [isBulkImporting, startBulkImport] = useTransition();

  const handleSearch = () => {
    if (!location.trim()) {
      toast.error("Please enter a location");
      return;
    }

    startSearch(async () => {
      setError(null);
      const response = await searchPlaces({
        query: "",
        location: location.trim(),
        radius: parseInt(radius),
        vertical,
      });

      if (response.error) {
        setError(response.error);
        setResults([]);
      } else {
        setResults(response.results);
        if (response.results.length === 0) {
          toast.info("No businesses found. Try a different location or category.");
        } else {
          toast.success(`Found ${response.results.length} businesses`);
        }
      }
    });
  };

  const handleImport = (place: PlaceResult) => {
    setImportingIds((prev) => new Set(prev).add(place.placeId));

    const businessVertical = verticalMap[vertical] || "OTHER";

    importAsLead(place, businessVertical).then((result) => {
      setImportingIds((prev) => {
        const next = new Set(prev);
        next.delete(place.placeId);
        return next;
      });

      if (result.success) {
        setImportedIds((prev) => new Set(prev).add(place.placeId));
        toast.success(`Imported ${place.name}`);
      } else {
        toast.error(result.error || "Failed to import");
      }
    });
  };

  const handleBulkImport = () => {
    const toImport = results.filter(
      (r) => !r.alreadyImported && !importedIds.has(r.placeId)
    );

    if (toImport.length === 0) {
      toast.info("All businesses have already been imported");
      return;
    }

    startBulkImport(async () => {
      const businessVertical = verticalMap[vertical] || "OTHER";
      const result = await bulkImportLeads(toImport, businessVertical);

      toast.success(
        `Imported ${result.imported} leads, ${result.skipped} skipped`
      );

      // Mark all as imported
      setImportedIds((prev) => {
        const next = new Set(prev);
        toImport.forEach((p) => next.add(p.placeId));
        return next;
      });
    });
  };

  const availableToImport = results.filter(
    (r) => !r.alreadyImported && !importedIds.has(r.placeId)
  ).length;

  return (
    <div className="space-y-6">
      {/* Search Form */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="md:col-span-1">
          <label className="text-sm font-medium mb-1 block">Business Type</label>
          <Select value={vertical} onValueChange={setVertical}>
            <SelectTrigger>
              <SelectValue />
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
        <div className="md:col-span-2">
          <label className="text-sm font-medium mb-1 block">Location</label>
          <Input
            placeholder="e.g., Melbourne FL, Austin TX, Chicago IL"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
          />
        </div>
        <div>
          <label className="text-sm font-medium mb-1 block">Radius (miles)</label>
          <Select value={radius} onValueChange={setRadius}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="5">5 miles</SelectItem>
              <SelectItem value="10">10 miles</SelectItem>
              <SelectItem value="25">25 miles</SelectItem>
              <SelectItem value="50">50 miles</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <Button onClick={handleSearch} disabled={isSearching}>
          {isSearching ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Search className="mr-2 h-4 w-4" />
          )}
          Search Google Maps
        </Button>

        {results.length > 0 && availableToImport > 0 && (
          <Button
            variant="outline"
            onClick={handleBulkImport}
            disabled={isBulkImporting}
          >
            {isBulkImporting ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Download className="mr-2 h-4 w-4" />
            )}
            Import All ({availableToImport})
          </Button>
        )}
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      {/* Results */}
      {results.length > 0 && (
        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Business</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Reviews</TableHead>
                <TableHead>Rating</TableHead>
                <TableHead>Tier</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {results.map((place) => {
                const isImported =
                  place.alreadyImported || importedIds.has(place.placeId);
                const isImporting = importingIds.has(place.placeId);
                const tier = getTier(place.reviewCount);

                return (
                  <TableRow
                    key={place.placeId}
                    className={isImported ? "opacity-60" : ""}
                  >
                    <TableCell>
                      <div className="font-medium">{place.name}</div>
                      <div className="text-sm text-muted-foreground">
                        {place.address}
                      </div>
                    </TableCell>
                    <TableCell>
                      {place.city}
                      {place.state && `, ${place.state}`}
                    </TableCell>
                    <TableCell>
                      <span
                        className={
                          place.reviewCount < 25
                            ? "text-green-600 font-medium"
                            : ""
                        }
                      >
                        {place.reviewCount}
                      </span>
                    </TableCell>
                    <TableCell>
                      {place.rating && (
                        <span className="flex items-center gap-1">
                          <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                          {place.rating.toFixed(1)}
                        </span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge className={tierColors[tier]}>
                        {tier.replace("_", " ")}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {place.phone && (
                          <a
                            href={`tel:${place.phone}`}
                            className="text-muted-foreground hover:text-foreground"
                          >
                            <Phone className="h-4 w-4" />
                          </a>
                        )}
                        {place.website && (
                          <a
                            href={place.website}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-muted-foreground hover:text-foreground"
                          >
                            <Globe className="h-4 w-4" />
                          </a>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      {isImported ? (
                        <Button variant="ghost" size="sm" disabled>
                          <Check className="mr-2 h-4 w-4" />
                          Imported
                        </Button>
                      ) : (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleImport(place)}
                          disabled={isImporting}
                        >
                          {isImporting ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          ) : (
                            <Plus className="mr-2 h-4 w-4" />
                          )}
                          Import
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Empty State */}
      {!isSearching && results.length === 0 && !error && (
        <div className="text-center py-12 text-muted-foreground">
          <Search className="mx-auto h-12 w-12 mb-4 opacity-50" />
          <p>Search for businesses to find new leads</p>
          <p className="text-sm mt-2">
            Try searching for &quot;Plumbers in Melbourne FL&quot;
          </p>
        </div>
      )}
    </div>
  );
}

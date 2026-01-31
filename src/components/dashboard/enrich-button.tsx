"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { enrichLead, EnrichmentResult } from "@/actions/enrich";
import { toast } from "sonner";
import { Loader2, Sparkles, Check, AlertCircle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type Props = {
  leadId: string;
  hasWebsite: boolean;
};

export function EnrichButton({ leadId, hasWebsite }: Props) {
  const [isPending, startTransition] = useTransition();
  const [result, setResult] = useState<EnrichmentResult | null>(null);
  const [showDialog, setShowDialog] = useState(false);

  const handleEnrich = () => {
    if (!hasWebsite) {
      toast.error("This lead has no website to analyze");
      return;
    }

    startTransition(async () => {
      const enrichResult = await enrichLead(leadId);
      setResult(enrichResult);

      if (enrichResult.success) {
        setShowDialog(true);
        if (enrichResult.data?.hasBookingSoftware) {
          toast.info(`Booking software detected: ${enrichResult.data.bookingSoftwareDetected}`);
        } else {
          toast.success("No booking software found - PRIME TARGET!");
        }
      } else {
        toast.error(enrichResult.error || "Failed to enrich lead");
      }
    });
  };

  return (
    <>
      <Button
        variant="outline"
        onClick={handleEnrich}
        disabled={isPending || !hasWebsite}
      >
        {isPending ? (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        ) : (
          <Sparkles className="mr-2 h-4 w-4" />
        )}
        Enrich Data
      </Button>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Enrichment Results</DialogTitle>
          </DialogHeader>

          {result?.success && result.data && (
            <div className="space-y-4">
              {/* Booking Software Status */}
              <div className={`p-4 rounded-lg ${
                result.data.hasBookingSoftware
                  ? "bg-yellow-50 border border-yellow-200"
                  : "bg-green-50 border border-green-200"
              }`}>
                <div className="flex items-center gap-2">
                  {result.data.hasBookingSoftware ? (
                    <AlertCircle className="h-5 w-5 text-yellow-600" />
                  ) : (
                    <Check className="h-5 w-5 text-green-600" />
                  )}
                  <span className="font-medium">
                    {result.data.hasBookingSoftware
                      ? `Has Booking Software: ${result.data.bookingSoftwareDetected}`
                      : "No Booking Software Detected - PRIME TARGET"}
                  </span>
                </div>
              </div>

              {/* Description */}
              {result.data.description && (
                <div>
                  <h4 className="text-sm font-medium mb-1">Description</h4>
                  <p className="text-sm text-muted-foreground">
                    {result.data.description}
                  </p>
                </div>
              )}

              {/* Tech Stack */}
              {result.data.techStack.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium mb-1">Tech Stack</h4>
                  <div className="flex flex-wrap gap-1">
                    {result.data.techStack.map((tech) => (
                      <span
                        key={tech}
                        className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded"
                      >
                        {tech}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Social Links */}
              {Object.keys(result.data.socialLinks).length > 0 && (
                <div>
                  <h4 className="text-sm font-medium mb-1">Social Media</h4>
                  <div className="flex flex-wrap gap-2">
                    {Object.entries(result.data.socialLinks).map(([platform, url]) => (
                      <a
                        key={platform}
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded hover:bg-blue-200"
                      >
                        {platform}
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {/* Services */}
              {result.data.services.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium mb-1">Services Found</h4>
                  <ul className="text-sm text-muted-foreground list-disc list-inside">
                    {result.data.services.map((service, i) => (
                      <li key={i}>{service}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Logo */}
              {result.data.logo && (
                <div>
                  <h4 className="text-sm font-medium mb-1">Logo</h4>
                  <img
                    src={result.data.logo}
                    alt="Business logo"
                    className="max-h-20 object-contain"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = "none";
                    }}
                  />
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}

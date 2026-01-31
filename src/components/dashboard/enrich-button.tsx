"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { enrichLead, EnrichmentResult } from "@/actions/enrich";
import { toast } from "sonner";
import { Loader2, Sparkles, Check, AlertCircle, DollarSign, Briefcase } from "lucide-react";
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
        {isPending ? "Analyzing..." : "Enrich Data"}
      </Button>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              Enrichment Results
              {result?.data?.llmExtracted && (
                <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded">
                  AI Enhanced
                </span>
              )}
            </DialogTitle>
          </DialogHeader>

          {result?.success && result.data && (
            <div className="space-y-6">
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
                  <h4 className="text-sm font-medium mb-2">Business Description</h4>
                  <p className="text-sm text-muted-foreground bg-gray-50 p-3 rounded">
                    {result.data.description}
                  </p>
                </div>
              )}

              {/* Services */}
              {result.data.services.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
                    <Briefcase className="h-4 w-4" />
                    Services Offered ({result.data.services.length})
                  </h4>
                  <div className="bg-gray-50 rounded-lg p-3">
                    <div className="grid gap-2">
                      {result.data.services.map((service, i) => (
                        <div key={i} className="flex justify-between items-start border-b border-gray-200 last:border-0 pb-2 last:pb-0">
                          <div>
                            <span className="font-medium text-sm">{service.name}</span>
                            {service.description && (
                              <p className="text-xs text-muted-foreground">{service.description}</p>
                            )}
                            {service.duration && (
                              <span className="text-xs text-muted-foreground">({service.duration})</span>
                            )}
                          </div>
                          {service.price && (
                            <span className="text-sm font-medium text-green-600">{service.price}</span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Pricing */}
              {result.data.pricing.hasPublicPricing && result.data.pricing.items.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
                    <DollarSign className="h-4 w-4" />
                    Pricing Information
                    {result.data.pricing.priceRange && (
                      <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded">
                        {result.data.pricing.priceRange}
                      </span>
                    )}
                  </h4>
                  <div className="bg-gray-50 rounded-lg p-3">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left py-1 font-medium">Service</th>
                          <th className="text-right py-1 font-medium">Price</th>
                        </tr>
                      </thead>
                      <tbody>
                        {result.data.pricing.items.map((item, i) => (
                          <tr key={i} className="border-b last:border-0">
                            <td className="py-1">{item.service}</td>
                            <td className="py-1 text-right text-green-600 font-medium">{item.price}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Tech Stack */}
              {result.data.techStack.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium mb-2">Tech Stack</h4>
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
                  <h4 className="text-sm font-medium mb-2">Social Media</h4>
                  <div className="flex flex-wrap gap-2">
                    {Object.entries(result.data.socialLinks).map(([platform, url]) => (
                      <a
                        key={platform}
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded hover:bg-blue-200 capitalize"
                      >
                        {platform}
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {/* Logo */}
              {result.data.logo && (
                <div>
                  <h4 className="text-sm font-medium mb-2">Logo</h4>
                  <img
                    src={result.data.logo}
                    alt="Business logo"
                    className="max-h-16 object-contain"
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

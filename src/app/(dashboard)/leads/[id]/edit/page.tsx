import { db } from "@/lib/db";
import { notFound } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LeadForm } from "@/components/dashboard/lead-form";

type Props = {
  params: Promise<{ id: string }>;
};

async function getLead(id: string) {
  return await db.lead.findUnique({
    where: { id },
  });
}

export default async function EditLeadPage({ params }: Props) {
  const { id } = await params;
  const lead = await getLead(id);

  if (!lead) {
    notFound();
  }

  return (
    <div className="max-w-2xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle>Edit Lead: {lead.businessName}</CardTitle>
        </CardHeader>
        <CardContent>
          <LeadForm lead={lead} />
        </CardContent>
      </Card>
    </div>
  );
}

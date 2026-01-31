import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LeadForm } from "@/components/dashboard/lead-form";

export default function NewLeadPage() {
  return (
    <div className="max-w-2xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle>Add New Lead</CardTitle>
        </CardHeader>
        <CardContent>
          <LeadForm />
        </CardContent>
      </Card>
    </div>
  );
}

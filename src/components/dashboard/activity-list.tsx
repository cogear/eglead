"use client";

import { Activity } from "@prisma/client";
import { Phone, Mail, MessageSquare, FileText, RefreshCw } from "lucide-react";

const activityIcons: Record<string, React.ElementType> = {
  CALL: Phone,
  EMAIL: Mail,
  SMS: MessageSquare,
  NOTE: FileText,
  STATUS_CHANGE: RefreshCw,
};

const activityColors: Record<string, string> = {
  CALL: "bg-blue-100 text-blue-600",
  EMAIL: "bg-green-100 text-green-600",
  SMS: "bg-purple-100 text-purple-600",
  NOTE: "bg-yellow-100 text-yellow-600",
  STATUS_CHANGE: "bg-gray-100 text-gray-600",
};

type Props = {
  activities: Activity[];
};

export function ActivityList({ activities }: Props) {
  if (activities.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <p>No activity recorded yet.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {activities.map((activity) => {
        const Icon = activityIcons[activity.type] || FileText;
        const colorClass = activityColors[activity.type] || "bg-gray-100 text-gray-600";

        return (
          <div key={activity.id} className="flex gap-4">
            <div
              className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${colorClass}`}
            >
              <Icon className="h-5 w-5" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <p className="font-medium">{activity.subject}</p>
                <time className="text-sm text-muted-foreground">
                  {activity.createdAt.toLocaleDateString()}{" "}
                  {activity.createdAt.toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </time>
              </div>
              {activity.content && (
                <p className="text-sm text-muted-foreground mt-1">
                  {activity.content}
                </p>
              )}
              {activity.outcome && (
                <p className="text-sm mt-1">
                  <span className="text-muted-foreground">Outcome:</span>{" "}
                  {activity.outcome}
                </p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

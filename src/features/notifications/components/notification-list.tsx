"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  markAllNotificationsReadAction,
  markNotificationReadAction,
} from "@/features/notifications/actions";
import { cn } from "@/lib/utils";

type NotificationItem = {
  id: string;
  title: string;
  body: string;
  isRead: boolean;
  createdAt: Date;
  metadata: unknown;
};

type NotificationListProps = {
  notifications: NotificationItem[];
  unreadCount: number;
  emailEnabled: boolean;
};

function hrefFromMetadata(metadata: unknown): string | null {
  if (
    metadata &&
    typeof metadata === "object" &&
    "href" in metadata &&
    typeof (metadata as { href: unknown }).href === "string"
  ) {
    return (metadata as { href: string }).href;
  }
  return null;
}

function formatWhen(date: Date) {
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

export function NotificationList({
  notifications,
  unreadCount,
  emailEnabled,
}: NotificationListProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const markOne = (notificationId: string) => {
    startTransition(async () => {
      const result = await markNotificationReadAction({ notificationId });
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      router.refresh();
    });
  };

  const markAll = () => {
    startTransition(async () => {
      const result = await markAllNotificationsReadAction();
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      toast.success("All notifications marked read");
      router.refresh();
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">
            Notifications
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            In-app alerts for appointments, billing, prescriptions, and video.
            {emailEnabled
              ? " Email delivery is enabled for this environment."
              : " Email is optional — set RESEND_API_KEY to enable."}
          </p>
        </div>
        {unreadCount > 0 ? (
          <Button
            type="button"
            variant="outline"
            disabled={isPending}
            onClick={markAll}
          >
            Mark all read ({unreadCount})
          </Button>
        ) : null}
      </div>

      {notifications.length === 0 ? (
        <p className="rounded-lg border border-dashed border-border/80 px-4 py-10 text-center text-sm text-muted-foreground">
          No notifications yet. Book an appointment or issue an invoice to see
          alerts appear here.
        </p>
      ) : (
        <ul className="divide-y divide-border/70 rounded-lg border border-border/70">
          {notifications.map((item) => {
            const href = hrefFromMetadata(item.metadata);
            return (
              <li
                key={item.id}
                className={cn(
                  "flex flex-col gap-3 px-4 py-4 sm:flex-row sm:items-start sm:justify-between",
                  !item.isRead && "bg-teal-50/40",
                )}
              >
                <div className="min-w-0 space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-medium text-foreground">{item.title}</p>
                    {!item.isRead ? (
                      <Badge variant="default">Unread</Badge>
                    ) : (
                      <Badge variant="outline">Read</Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">{item.body}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatWhen(new Date(item.createdAt))}
                  </p>
                </div>
                <div className="flex shrink-0 flex-wrap gap-2">
                  {href ? (
                    <Link
                      href={href}
                      className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
                      onClick={() => {
                        if (!item.isRead) markOne(item.id);
                      }}
                    >
                      Open
                    </Link>
                  ) : null}
                  {!item.isRead ? (
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      disabled={isPending}
                      onClick={() => markOne(item.id)}
                    >
                      Mark read
                    </Button>
                  ) : null}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

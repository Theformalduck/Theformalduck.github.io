"use client";

import { useState } from "react";
import { Sidebar } from "@/components/dashboard/sidebar";
import { Topbar } from "@/components/dashboard/topbar";
import { VerifyEmailBanner } from "@/components/dashboard/verify-email-banner";
import { FeedbackButton } from "@/components/dashboard/feedback-button";
import { NotificationAlerts } from "@/components/dashboard/notification-alerts";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#f0f4f8] flex">
      <Sidebar mobileOpen={mobileOpen} onMobileClose={() => setMobileOpen(false)} />
      <div className="flex-1 flex flex-col min-w-0">
        <Topbar onMenuOpen={() => setMobileOpen(true)} />
        <VerifyEmailBanner />
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
      <FeedbackButton />
      <NotificationAlerts />
    </div>
  );
}

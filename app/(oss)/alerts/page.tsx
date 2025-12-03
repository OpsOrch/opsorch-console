"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { AppShell } from "@/app/components/AppShell";
import { AlertsPanel } from "@/app/components/AlertsPanel";
import { decodeAlertQuery } from "@/app/lib/utils";

function AlertsContent() {
    const searchParams = useSearchParams();
    const alertQuery = decodeAlertQuery(searchParams);
    return <AlertsPanel initialQuery={alertQuery} />;
}

export default function AlertsPage() {
    return (
        <AppShell
            title="Alerts"
            description="View and manage active alerts across your services."
        >
            <Suspense fallback={<AlertsPanel />}>
                <AlertsContent />
            </Suspense>
        </AppShell>
    );
}

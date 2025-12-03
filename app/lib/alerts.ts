import { requestJSON } from "@/app/lib/api";
import { Alert, AlertQuery } from "@/app/lib/types";

export async function queryAlerts(alertQuery?: Partial<AlertQuery>) {
    const body: AlertQuery = {
        query: alertQuery?.query,
        statuses: alertQuery?.statuses,
        severities: alertQuery?.severities,
        scope: alertQuery?.scope,
        limit: alertQuery?.limit,
        metadata: alertQuery?.metadata,
    };

    // Remove undefined fields
    Object.keys(body).forEach(key => {
        if (body[key as keyof AlertQuery] === undefined) {
            delete body[key as keyof AlertQuery];
        }
    });

    return requestJSON<Alert[]>("/alerts/query", {
        method: "POST",
        body: JSON.stringify(body),
    });
}

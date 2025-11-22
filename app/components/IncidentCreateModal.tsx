import { useState } from "react";
import { Field, Modal, Pill, Select, TextInput } from "@/app/lib/ui";

type IncidentCreateModalProps = {
    isOpen: boolean;
    onClose: () => void;
    onCreate: (incident: { title: string; status: string; severity: string; service: string }) => Promise<void>;
    loading?: boolean;
    error?: string | null;
};

const incidentStatusOptions = [
    { value: "open", label: "Open" },
    { value: "acknowledged", label: "Acknowledged" },
    { value: "mitigated", label: "Mitigated" },
    { value: "resolved", label: "Resolved" },
    { value: "closed", label: "Closed" },
];

const incidentSeverityOptions = [
    { value: "sev1", label: "Sev1 - Critical" },
    { value: "sev2", label: "Sev2 - High" },
    { value: "sev3", label: "Sev3 - Medium" },
    { value: "sev4", label: "Sev4 - Low" },
];

export function IncidentCreateModal({ isOpen, onClose, onCreate, loading, error }: IncidentCreateModalProps) {
    const [form, setForm] = useState({ title: "", status: "open", severity: "sev3", service: "" });

    const handleSubmit = async () => {
        await onCreate(form);
        setForm({ title: "", status: "open", severity: "sev3", service: "" });
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Create Incident">
            <div className="grid gap-3">
                <Field
                    label="Title"
                    input={
                        <TextInput
                            value={form.title}
                            onChange={(v) => setForm((f) => ({ ...f, title: v }))}
                            placeholder="Paging latency spike"
                        />
                    }
                />
                <Field
                    label="Service"
                    input={
                        <TextInput
                            value={form.service}
                            onChange={(v) => setForm((f) => ({ ...f, service: v }))}
                            placeholder="payments-svc"
                        />
                    }
                />
                <div className="grid grid-cols-2 gap-3">
                    <Field
                        label="Status"
                        input={
                            <Select
                                value={form.status}
                                onChange={(v) => setForm((f) => ({ ...f, status: v }))}
                                options={incidentStatusOptions}
                            />
                        }
                    />
                    <Field
                        label="Severity"
                        input={
                            <Select
                                value={form.severity}
                                onChange={(v) => setForm((f) => ({ ...f, severity: v }))}
                                options={incidentSeverityOptions}
                            />
                        }
                    />
                </div>
                <div className="flex flex-wrap items-center gap-3 justify-end mt-2">
                    <button
                        type="button"
                        onClick={onClose}
                        className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50"
                    >
                        Cancel
                    </button>
                    <button
                        type="button"
                        onClick={handleSubmit}
                        disabled={!form.title || loading}
                        className="rounded-lg bg-[#55cfd0] px-4 py-2 text-xs font-semibold text-[#0b1517] shadow-sm transition hover:bg-[#3fb8b8] disabled:cursor-not-allowed disabled:bg-[#b7eded]"
                    >
                        {loading ? "Saving..." : "Create incident"}
                    </button>
                </div>
                {error ? <Pill label={error} tone="error" /> : null}
            </div>
        </Modal>
    );
}

import { useState } from "react";
import { Field, Modal, Pill, TextArea, TextInput } from "@/app/lib/ui";

type TicketCreateModalProps = {
    isOpen: boolean;
    onClose: () => void;
    onCreate: (ticket: { title: string; description: string; assignees: string; reporter: string }) => Promise<void>;
    loading?: boolean;
    error?: string | null;
};

export function TicketCreateModal({ isOpen, onClose, onCreate, loading, error }: TicketCreateModalProps) {
    const [form, setForm] = useState({ title: "", description: "", assignees: "", reporter: "" });

    const handleSubmit = async () => {
        await onCreate(form);
        setForm({ title: "", description: "", assignees: "", reporter: "" });
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Create Ticket">
            <div className="grid gap-3">
                <Field
                    label="Title"
                    input={
                        <TextInput
                            value={form.title}
                            onChange={(v) => setForm((f) => ({ ...f, title: v }))}
                            placeholder="Customer-facing issue"
                        />
                    }
                />
                <Field
                    label="Description"
                    input={
                        <TextArea
                            value={form.description}
                            onChange={(v) => setForm((f) => ({ ...f, description: v }))}
                            placeholder="What is happening and what should be done"
                        />
                    }
                />
                <div className="grid grid-cols-2 gap-3">
                    <Field
                        label="Assignees (comma separated)"
                        input={
                            <TextInput
                                value={form.assignees}
                                onChange={(v) => setForm((f) => ({ ...f, assignees: v }))}
                                placeholder="alice, bob"
                            />
                        }
                    />
                    <Field
                        label="Reporter"
                        input={
                            <TextInput
                                value={form.reporter}
                                onChange={(v) => setForm((f) => ({ ...f, reporter: v }))}
                                placeholder="charlie"
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
                        {loading ? "Saving..." : "Create ticket"}
                    </button>
                </div>
                {error ? <Pill label={error} tone="error" /> : null}
            </div>
        </Modal>
    );
}

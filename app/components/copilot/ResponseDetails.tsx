import { Accordion, Badge } from "@/app/lib/ui";
import { ReferenceLinks } from "./ReferenceLinks";
import { ActionLinks } from "./ActionLinks";
import { ToolExecutionsView } from "./ToolExecutionsView";
import { CopilotAnswer } from "@/app/lib/types";
import { stringifyData } from "@/app/lib/utils";
import { CollapsibleCodeBlock } from "./CollapsibleCodeBlock";

export function ResponseDetailsContent({ answer }: { answer: CopilotAnswer }) {
    if (!answer) return null;

    return (
        <div className="space-y-3 px-3 text-sm">
            {/* Recommended Actions */}
            <ActionLinks actions={answer.actions} />

            {/* References */}
            <ReferenceLinks references={answer.references} />

            {/* Missing Data */}
            {answer.missing?.length ? (
                <div>
                    <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-slate-500">Missing Data</p>
                    <div className="flex flex-wrap gap-1.5">
                        {answer.missing.map((item, idx) => (
                            <Badge key={idx} label={item} variant="warning" size="xs" />
                        ))}
                    </div>
                </div>
            ) : null}

            {/* Tool Executions */}
            {answer.executionTrace && (
                <ToolExecutionsView trace={answer.executionTrace} />
            )}

            {/* Full Response */}
            <CollapsibleCodeBlock
                code={stringifyData(answer)}
                language="json"
                title="Full Response"
                defaultOpen={false}
            />
        </div>
    );
}

export function ResponseDetails({ answer }: { answer: CopilotAnswer }) {
    if (!answer) return null;

    const hasDetails =
        answer.missing?.length ||
        answer.references ||
        answer.actions?.length ||
        answer.executionTrace;

    if (!hasDetails) return null;

    return (
        <Accordion title="Details" defaultOpen={true}>
            <ResponseDetailsContent answer={answer} />
        </Accordion>
    );
}

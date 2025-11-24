import { QueryScope } from "@/app/lib/types";
import { Field, TextInput } from "@/app/lib/ui";

type ScopeInputsProps = {
  scope?: QueryScope;
  onChange: (scope: QueryScope) => void;
};

export function ScopeInputs({ scope, onChange }: ScopeInputsProps) {
  const handleChange = (field: keyof QueryScope, value: string) => {
    const newScope = { ...scope };
    if (value) {
      newScope[field] = value;
    } else {
      delete newScope[field];
    }
    onChange(newScope);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 mb-2">
        <svg className="h-4 w-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
        </svg>
        <span className="text-xs font-semibold uppercase tracking-wide text-slate-600">Query Scope</span>
      </div>
      
      <Field
        label="Service"
        input={
          <TextInput
            value={scope?.service || ""}
            onChange={(v) => handleChange("service", v)}
            placeholder="svc-notifications"
          />
        }
      />
      
      <Field
        label="Environment"
        input={
          <TextInput
            value={scope?.environment || ""}
            onChange={(v) => handleChange("environment", v)}
            placeholder="prod"
          />
        }
      />
      
      <Field
        label="Team"
        input={
          <TextInput
            value={scope?.team || ""}
            onChange={(v) => handleChange("team", v)}
            placeholder="platform"
          />
        }
      />
    </div>
  );
}

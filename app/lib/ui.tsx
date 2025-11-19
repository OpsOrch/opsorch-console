import React from "react";

export function Section({
  title,
  description,
  children,
  action,
  id,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
  action?: React.ReactNode;
  id?: string;
}) {
  return (
    <section id={id} className="rounded-2xl border border-zinc-200 bg-white/70 p-6 shadow-sm backdrop-blur">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-zinc-900">{title}</h2>
          {description ? <p className="text-sm text-zinc-600">{description}</p> : null}
        </div>
        {action}
      </div>
      <div className="grid gap-4 text-sm text-zinc-900">{children}</div>
    </section>
  );
}

export function Pill({
  label,
  tone = "default",
}: {
  label: string;
  tone?: "default" | "success" | "warn" | "error";
}) {
  const palette = {
    default: "bg-zinc-100 text-zinc-700 border-zinc-200",
    success: "bg-emerald-50 text-emerald-800 border-emerald-100",
    warn: "bg-amber-50 text-amber-800 border-amber-100",
    error: "bg-rose-50 text-rose-800 border-rose-100",
  } as const;
  return (
    <span className={`inline-flex items-center rounded-full border px-2 py-1 text-xs font-medium ${palette[tone]}`}>
      {label}
    </span>
  );
}

export function Field({ label, input }: { label: string; input: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1 text-sm text-zinc-800">
      <span className="text-xs font-medium uppercase tracking-wide text-zinc-500">{label}</span>
      {input}
    </label>
  );
}

export function TextInput({
  value,
  onChange,
  placeholder,
  type = "text",
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
}) {
  return (
    <input
      className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm shadow-inner focus:border-[#55cfd0] focus:outline-none"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      type={type}
    />
  );
}

export function TextArea({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <textarea
      className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm shadow-inner focus:border-[#55cfd0] focus:outline-none"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      rows={3}
    />
  );
}

export function Select({
  value,
  onChange,
  options,
}: {
  value: string;
  onChange: (v: string) => void;
  options: { label?: string; value: string }[];
}) {
  return (
    <select
      className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm shadow-inner focus:border-[#55cfd0] focus:outline-none"
      value={value}
      onChange={(e) => onChange(e.target.value)}
    >
      {options.map((opt) => (
        <option key={opt.value} value={opt.value}>
          {opt.label || opt.value}
        </option>
      ))}
    </select>
  );
}

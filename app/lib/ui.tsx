import React, { useState } from "react";

export function Section({
  title,
  description,
  children,
  action,
  id,
}: {
  title?: string;
  description?: string;
  children: React.ReactNode;
  action?: React.ReactNode;
  id?: string;
}) {
  return (
    <section id={id} className="rounded-2xl border border-zinc-200 bg-white/70 p-6 shadow-sm backdrop-blur">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          {title ? <h2 className="text-lg font-semibold text-zinc-900">{title}</h2> : null}
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

export function Badge({
  label,
  variant = "default",
  size = "md",
}: {
  label: string;
  variant?: "default" | "success" | "warning" | "error" | "info";
  size?: "xs" | "sm" | "md";
}) {
  const variants = {
    default: "bg-slate-100 text-slate-700 border-slate-200",
    success: "bg-emerald-100 text-emerald-700 border-emerald-200",
    warning: "bg-amber-100 text-amber-700 border-amber-200",
    error: "bg-rose-100 text-rose-700 border-rose-200",
    info: "bg-sky-100 text-sky-700 border-sky-200",
  };
  const sizes = {
    xs: "px-1.5 py-0.5 text-[10px]",
    sm: "px-2 py-0.5 text-xs",
    md: "px-2.5 py-1 text-xs",
  };
  return (
    <span className={`inline-flex items-center rounded-full border font-medium ${variants[variant]} ${sizes[size]}`}>
      {label}
    </span>
  );
}

export function CopyButton({ textToCopy }: { textToCopy: string }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = () => {
    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <button
      onClick={handleCopy}
      className="rounded-lg border border-slate-300 bg-white px-2 py-1 text-xs font-medium text-slate-700 transition hover:bg-slate-50"
      type="button"
    >
      {copied ? "✓ Copied" : "Copy"}
    </button>
  );
}

export function CodeBlock({
  code,
  language = "text",
}: {
  code: string;
  language?: string;
}) {
  return (
    <div className="relative rounded-lg border border-slate-200 bg-slate-900">
      <div className="flex items-center justify-between border-b border-slate-700 bg-slate-800 px-4 py-2">
        <span className="text-xs font-medium text-slate-400">{language}</span>
        <CopyButton textToCopy={code} />
      </div>
      <div className="overflow-x-auto">
        <pre className="p-4 text-xs text-slate-100">
          <code>{code}</code>
        </pre>
      </div>
    </div>
  );
}

export function Accordion({
  title,
  children,
  defaultOpen = false,
  isOpen: controlledIsOpen,
  onToggle,
}: {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
  isOpen?: boolean;
  onToggle?: (isOpen: boolean) => void;
}) {
  const [internalIsOpen, setInternalIsOpen] = useState(defaultOpen);

  // Use controlled state if provided, otherwise use internal state
  const isOpen = controlledIsOpen !== undefined ? controlledIsOpen : internalIsOpen;

  const handleToggle = () => {
    const newState = !isOpen;
    if (onToggle) {
      onToggle(newState);
    } else {
      setInternalIsOpen(newState);
    }
  };

  return (
    <div className="rounded-lg border border-slate-200 bg-white">
      <button
        onClick={handleToggle}
        className="flex w-full items-center justify-between px-4 py-3 text-left transition hover:bg-slate-50"
        type="button"
      >
        <span className="text-sm font-semibold text-slate-900">{title}</span>
        <svg
          className={`h-5 w-5 text-slate-600 transition-transform ${isOpen ? "rotate-180" : ""}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {isOpen && (
        <div className="animate-slide-down border-t border-slate-200 px-4 py-3">
          {children}
        </div>
      )}
    </div>
  );
}

export function Field({
  label,
  input,
}: {
  label: string;
  input: React.ReactNode;
}) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-xs font-semibold uppercase tracking-wide text-zinc-500">{label}</span>
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
  onChange: (value: string) => void;
  placeholder?: string;
  type?: string;
}) {
  return (
    <input
      type={type}
      className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 placeholder-zinc-400 shadow-sm transition focus:border-zinc-500 focus:outline-none focus:ring-2 focus:ring-zinc-500/50"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
    />
  );
}

export function TextArea({
  value,
  onChange,
  placeholder,
  rows = 3,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  rows?: number;
}) {
  return (
    <textarea
      className="resize-none rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 placeholder-zinc-400 shadow-sm transition focus:border-zinc-500 focus:outline-none focus:ring-2 focus:ring-zinc-500/50"
      rows={rows}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
    />
  );
}

export function Select({
  value,
  onChange,
  options,
}: {
  value: string;
  onChange: (value: string) => void;
  options: Array<{ value: string; label: string }>;
}) {
  return (
    <select
      className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 shadow-sm transition focus:border-zinc-500 focus:outline-none focus:ring-2 focus:ring-zinc-500/50"
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

// Modal Component
export function Modal({
  isOpen,
  onClose,
  title,
  children,
}: {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="w-full max-w-lg rounded-2xl border border-zinc-200 bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-zinc-100 px-6 py-4">
          <h3 className="text-lg font-semibold text-zinc-900">{title}</h3>
          <button
            onClick={onClose}
            className="rounded-full p-1 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600"
            type="button"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
}

// TimeSeriesChart Component
export function TimeSeriesChart({
  points,
  name,
  color = "#14b8a6",
}: {
  points: Array<{ timestamp: string; value: number }>;
  name: string;
  color?: string;
}) {
  const [hoveredPoint, setHoveredPoint] = useState<number | null>(null);

  if (!points || points.length === 0) {
    return (
      <div className="flex h-48 items-center justify-center rounded-lg bg-slate-50 text-xs text-slate-500">
        No data points available
      </div>
    );
  }

  const width = 800;
  const height = 200;
  const padding = { top: 20, right: 20, bottom: 30, left: 50 };
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;

  const values = points.map((p) => p.value);
  const minValue = Math.min(...values);
  const maxValue = Math.max(...values);
  const valueRange = maxValue - minValue || 1;

  const xStep = chartWidth / Math.max(points.length - 1, 1);
  const chartPoints = points.map((point, i) => {
    const x = padding.left + i * xStep;
    const y = padding.top + chartHeight - ((point.value - minValue) / valueRange) * chartHeight;
    return { x, y, ...point };
  });

  const linePath = chartPoints.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ");
  const areaPath = `${linePath} L ${chartPoints[chartPoints.length - 1].x} ${padding.top + chartHeight} L ${padding.left} ${padding.top + chartHeight} Z`;

  const formatValue = (val: number) => {
    if (Math.abs(val) >= 1000) return `${(val / 1000).toFixed(1)}k`;
    return val.toFixed(2);
  };

  const formatTimestamp = (ts: string) => {
    const d = new Date(ts);
    return d.toLocaleString(undefined, {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="relative">
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full" style={{ maxHeight: "200px" }}>
        {[0, 0.25, 0.5, 0.75, 1].map((ratio) => {
          const y = padding.top + chartHeight * (1 - ratio);
          const value = minValue + valueRange * ratio;
          return (
            <g key={ratio}>
              <line x1={padding.left} y1={y} x2={width - padding.right} y2={y} stroke="#e2e8f0" strokeWidth="1" strokeDasharray="4 4" />
              <text x={padding.left - 8} y={y} textAnchor="end" alignmentBaseline="middle" fontSize="10" fill="#64748b">
                {formatValue(value)}
              </text>
            </g>
          );
        })}
        <defs>
          <linearGradient id={`gradient-${name}`} x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor={color} stopOpacity="0.3" />
            <stop offset="100%" stopColor={color} stopOpacity="0.05" />
          </linearGradient>
        </defs>
        <path d={areaPath} fill={`url(#gradient-${name})`} />
        <path d={linePath} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        {chartPoints.map((point, i) => (
          <circle
            key={i}
            cx={point.x}
            cy={point.y}
            r={hoveredPoint === i ? 5 : 3}
            fill={color}
            stroke="white"
            strokeWidth="2"
            className="cursor-pointer transition-all"
            onMouseEnter={() => setHoveredPoint(i)}
            onMouseLeave={() => setHoveredPoint(null)}
          />
        ))}
        <line x1={padding.left} y1={padding.top + chartHeight} x2={width - padding.right} y2={padding.top + chartHeight} stroke="#cbd5e1" strokeWidth="2" />
        {[0, Math.floor(points.length / 2), points.length - 1].map((idx) => {
          if (idx >= chartPoints.length) return null;
          const point = chartPoints[idx];
          return (
            <text key={idx} x={point.x} y={padding.top + chartHeight + 18} textAnchor="middle" fontSize="9" fill="#64748b">
              {new Date(point.timestamp).toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" })}
            </text>
          );
        })}
      </svg>
      {hoveredPoint !== null && (
        <div
          className="pointer-events-none absolute rounded-lg border border-slate-200 bg-white px-3 py-2 shadow-lg"
          style={{
            left: `${(chartPoints[hoveredPoint].x / width) * 100}%`,
            top: `${(chartPoints[hoveredPoint].y / height) * 100 - 10}%`,
            transform: "translate(-50%, -100%)",
          }}
        >
          <p className="text-xs font-semibold text-slate-900">{points[hoveredPoint].value.toFixed(2)}</p>
          <p className="text-xs text-slate-600">{formatTimestamp(points[hoveredPoint].timestamp)}</p>
        </div>
      )}
    </div>
  );
}

// Gauge Component
export function Gauge({
  value,
  min = 0,
  max = 100,
  label,
  units,
  size = "md",
}: {
  value: number;
  min?: number;
  max?: number;
  label?: string;
  units?: string;
  size?: "sm" | "md" | "lg";
}) {
  const normalizedValue = Math.min(Math.max(value, min), max);
  const percentage = (normalizedValue - min) / (max - min);
  const angle = percentage * 180;

  const sizes = {
    sm: { width: 120, height: 80, fontSize: "text-xl", labelSize: "text-xs" },
    md: { width: 200, height: 120, fontSize: "text-3xl", labelSize: "text-sm" },
    lg: { width: 300, height: 180, fontSize: "text-5xl", labelSize: "text-base" },
  };

  const { width, height, fontSize, labelSize } = sizes[size];
  const radius = width / 2 - 10;
  const cx = width / 2;
  const cy = height - 10;

  // Calculate path for the arc
  const startAngle = -180;
  const endAngle = -180 + angle;

  const startRad = (startAngle * Math.PI) / 180;
  const endRad = (endAngle * Math.PI) / 180;

  const x1 = cx + radius * Math.cos(startRad);
  const y1 = cy + radius * Math.sin(startRad);
  const x2 = cx + radius * Math.cos(endRad);
  const y2 = cy + radius * Math.sin(endRad);

  const largeArcFlag = angle > 180 ? 1 : 0;

  const pathData = [
    `M ${x1} ${y1}`,
    `A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2}`,
  ].join(" ");

  return (
    <div className="flex flex-col items-center justify-center">
      <div className="relative" style={{ width, height }}>
        <svg width={width} height={height} className="overflow-visible">
          {/* Background Arc */}
          <path
            d={`M ${cx - radius} ${cy} A ${radius} ${radius} 0 0 1 ${cx + radius} ${cy}`}
            fill="none"
            stroke="#e2e8f0"
            strokeWidth="12"
            strokeLinecap="round"
          />
          {/* Value Arc */}
          <path
            d={pathData}
            fill="none"
            stroke="#14b8a6"
            strokeWidth="12"
            strokeLinecap="round"
            className="transition-all duration-1000 ease-out"
          />
        </svg>
        <div className="absolute inset-x-0 bottom-0 text-center">
          <div className={`font-bold text-slate-900 ${fontSize}`}>
            {value.toFixed(1)}
            {units && <span className="ml-1 text-sm font-medium text-slate-500">{units}</span>}
          </div>
          {label && <div className={`text-slate-500 ${labelSize}`}>{label}</div>}
        </div>
      </div>
    </div>
  );
}

// Histogram Component
export function Histogram({
  values,
  bins = 10,
  height = 200,
  color = "#14b8a6",
}: {
  values: number[];
  bins?: number;
  height?: number;
  color?: string;
}) {
  if (!values.length) {
    return (
      <div className="flex items-center justify-center rounded-lg bg-slate-50 text-xs text-slate-500" style={{ height }}>
        No data available
      </div>
    );
  }

  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const binWidth = range / bins;

  const histogramData = Array(bins).fill(0);
  values.forEach((v) => {
    const binIndex = Math.min(Math.floor((v - min) / binWidth), bins - 1);
    histogramData[binIndex]++;
  });

  const maxCount = Math.max(...histogramData);

  return (
    <div className="flex items-end gap-1" style={{ height }}>
      {histogramData.map((count, i) => {
        const percentage = maxCount ? (count / maxCount) * 100 : 0;
        const binStart = min + i * binWidth;
        const binEnd = binStart + binWidth;

        return (
          <div key={i} className="group relative flex-1 bg-slate-100 hover:bg-slate-200 rounded-t-sm transition-colors h-full flex items-end">
            <div
              className="w-full rounded-t-sm transition-all duration-500"
              style={{
                height: `${percentage}%`,
                backgroundColor: color,
                opacity: 0.7 + (percentage / 100) * 0.3,
              }}
            />
            {/* Tooltip */}
            <div className="absolute bottom-full left-1/2 mb-2 hidden -translate-x-1/2 rounded bg-slate-900 px-2 py-1 text-xs text-white shadow-lg group-hover:block z-10 whitespace-nowrap">
              <div className="font-semibold">{count} items</div>
              <div className="text-slate-300">
                {binStart.toFixed(1)} - {binEnd.toFixed(1)}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

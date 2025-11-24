import { useEffect, useState } from "react";
import { MetricDescriptor } from "@/app/lib/types";
import { describeMetrics } from "@/app/lib/metrics";
import { Badge } from "@/app/lib/ui";

type MetricAutocompleteProps = {
    value: string;
    onChange: (value: string) => void;
    onMetricSelect?: (metric: MetricDescriptor) => void;
    placeholder?: string;
};

// Simple fuzzy matching - checks if all characters appear in order
function fuzzyMatch(search: string, target: string): boolean {
    const searchLower = search.toLowerCase();
    const targetLower = target.toLowerCase();
    let searchIndex = 0;

    for (let i = 0; i < targetLower.length && searchIndex < searchLower.length; i++) {
        if (targetLower[i] === searchLower[searchIndex]) {
            searchIndex++;
        }
    }

    return searchIndex === searchLower.length;
}

export function MetricAutocomplete({ value, onChange, onMetricSelect, placeholder }: MetricAutocompleteProps) {
    const [metrics, setMetrics] = useState<MetricDescriptor[]>([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadMetrics = async () => {
            try {
                const result = await describeMetrics();
                setMetrics(result);
            } catch (err) {
                console.error("Failed to load metrics:", err);
            } finally {
                setLoading(false);
            }
        };
        loadMetrics();
    }, []);

    const filteredMetrics = value
        ? metrics.filter((m) => fuzzyMatch(value, m.name)).slice(0, 10)
        : metrics.slice(0, 10); // Show first 10 metrics when empty

    return (
        <div className="relative">
            <input
                type="text"
                className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 placeholder-zinc-400 shadow-sm transition focus:border-zinc-500 focus:outline-none focus:ring-2 focus:ring-zinc-500/50"
                value={value}
                onChange={(e) => {
                    onChange(e.target.value);
                    setShowSuggestions(true);
                }}
                onFocus={() => setShowSuggestions(true)}
                onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                placeholder={placeholder || "Start typing to see available metrics..."}
            />
            {showSuggestions && filteredMetrics.length > 0 && (
                <div className="absolute z-10 mt-1 w-full max-h-60 overflow-y-auto rounded-lg border border-slate-200 bg-white shadow-lg">
                    {filteredMetrics.map((metric) => (
                        <button
                            key={metric.name}
                            type="button"
                            onClick={() => {
                                onChange(metric.name);
                                onMetricSelect?.(metric);
                                setShowSuggestions(false);
                            }}
                            className="w-full px-3 py-2 text-left transition hover:bg-slate-100 border-b border-slate-100 last:border-b-0"
                        >
                            <div className="flex items-center justify-between gap-2">
                                <span className="text-sm font-semibold text-slate-900">{metric.name}</span>
                                <Badge label={metric.type} variant="info" size="sm" />
                            </div>
                            {metric.description && (
                                <p className="mt-1 text-xs text-slate-600">{metric.description}</p>
                            )}
                        </button>
                    ))}
                </div>
            )}
            {loading && (
                <p className="mt-1 text-xs text-slate-500">Loading metrics...</p>
            )}
            {!loading && metrics.length === 0 && (
                <p className="mt-1 text-xs text-red-600">Failed to load metrics</p>
            )}
        </div>
    );
}

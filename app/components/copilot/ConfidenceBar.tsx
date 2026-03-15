// ConfidenceBar component for displaying copilot confidence scores
export function ConfidenceBar({ confidence }: { confidence: number }) {
    const percentage = Math.round(confidence * 100);
    const getColor = () => {
        if (percentage >= 80) return "bg-emerald-500";
        if (percentage >= 60) return "bg-amber-500";
        return "bg-rose-500";
    };
    const getTextColor = () => {
        if (percentage >= 80) return "text-emerald-700";
        if (percentage >= 60) return "text-amber-700";
        return "text-rose-700";
    };

    return (
        <div className="flex items-center gap-2">
            <div className="h-1.5 w-16 overflow-hidden rounded-full bg-slate-200">
                <div className={`h-full transition-all duration-500 ${getColor()}`} style={{ width: `${percentage}%` }} />
            </div>
            <span className={`text-[10px] font-semibold ${getTextColor()}`}>{percentage}%</span>
        </div>
    );
}

import { ReactNode } from "react";

type EmptyStateProps = {
  title: string;
  description: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  icon?: ReactNode;
  variant?: "default" | "no-data" | "no-integration" | "error";
};

export function EmptyState({ title, description, action, icon, variant = "default" }: EmptyStateProps) {
  const getIcon = () => {
    if (icon) return icon;

    switch (variant) {
      case "no-integration":
        return (
          <svg className="h-8 w-8 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
        );
      case "error":
        return (
          <svg className="h-8 w-8 text-rose-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        );
      case "no-data":
      default:
        return (
          <svg className="h-8 w-8 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
          </svg>
        );
    }
  };

  const getBgColor = () => {
    switch (variant) {
      case "no-integration":
        return "bg-amber-50 border-amber-200";
      case "error":
        return "bg-rose-50 border-rose-200";
      default:
        return "bg-slate-50 border-slate-200 border-dashed";
    }
  };

  return (
    <div className={`flex flex-col items-center justify-center rounded-xl border p-8 text-center ${getBgColor()}`}>
      <div className={`mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-white shadow-sm`}>
        {getIcon()}
      </div>
      <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
      <p className="mt-1 max-w-sm text-sm text-slate-500">{description}</p>
      {action && (
        <button
          onClick={action.onClick}
          className="mt-4 rounded-lg bg-white border border-slate-300 px-4 py-2 text-xs font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 hover:text-slate-900"
        >
          {action.label}
        </button>
      )}
    </div>
  );
}

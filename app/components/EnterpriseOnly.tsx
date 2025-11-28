export function EnterpriseOnly({ featureName }: { featureName?: string }) {
    return (
        <div className="flex flex-col items-center justify-center h-full p-8 text-center">
            <h2 className="text-2xl font-bold text-slate-900">Enterprise Edition Only</h2>
            <p className="mt-2 text-slate-600">
                {featureName ? `${featureName} is` : "This feature is"} available in the OpsOrch Enterprise Edition.
            </p>
        </div>
    );
}

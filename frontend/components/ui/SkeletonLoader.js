export const DashboardSkeleton = () => {
    return (
        <div className="w-full flex flex-col space-y-4 px-6 pt-8">
            {/* Header Skeleton */}
            <div className="flex justify-between items-center mb-4">
                <div className="flex gap-3 items-center">
                    <div className="w-10 h-10 rounded-full bg-slate-800 animate-pulse"></div>
                    <div className="space-y-2">
                        <div className="w-24 h-3 bg-slate-800 rounded animate-pulse"></div>
                        <div className="w-16 h-2 bg-slate-800 rounded animate-pulse"></div>
                    </div>
                </div>
                <div className="w-24 h-8 bg-slate-800 rounded-lg animate-pulse"></div>
            </div>

            {/* Slider Skeleton */}
            <div className="w-full h-40 bg-slate-800 rounded-2xl animate-pulse"></div>

            {/* Action Buttons Skeleton */}
            <div className="grid grid-cols-2 gap-3 mt-4">
                <div className="h-14 bg-slate-800 rounded-xl animate-pulse"></div>
                <div className="h-14 bg-slate-800 rounded-xl animate-pulse"></div>
            </div>

            {/* Grid Skeleton */}
            <div className="grid grid-cols-3 gap-3 mt-8">
                {[1, 2, 3, 4, 5, 6].map(i => (
                    <div key={i} className="aspect-square bg-slate-800 rounded-2xl animate-pulse"></div>
                ))}
            </div>
        </div>
    );
};

export const P2PSkeleton = () => {
    return (
        <div className="w-full space-y-3">
            {[1, 2, 3].map(i => (
                <div key={i} className="bg-[#111927] border border-white/5 p-4 rounded-xl flex justify-between items-center opacity-80 animate-pulse h-28">
                    <div className="space-y-3 w-1/2">
                        <div className="flex gap-2 items-center">
                            <div className="w-6 h-6 rounded-full bg-slate-800"></div>
                            <div className="w-20 h-3 bg-slate-800 rounded"></div>
                        </div>
                        <div className="w-32 h-6 bg-slate-800 rounded"></div>
                        <div className="w-16 h-4 bg-slate-800 rounded mt-2"></div>
                    </div>
                    <div className="w-20 h-10 bg-slate-800 rounded-lg"></div>
                </div>
            ))}
        </div>
    );
};

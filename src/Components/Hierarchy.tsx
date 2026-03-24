import React from "react";
import { ArrowLeftIcon } from "@heroicons/react/24/solid";

interface Mark_Hier {
    State: string,
    Region: string,
    Zone: string,
    Sector: string,
    Area: string,
    InfluencerCount: number,
    BalanceAmount: number,
    RedeemedAmount: number,
    ScannedAmount: number
}

interface Props {
    row: Mark_Hier;
    showBack?: boolean;        // control visibility
    onBack?: () => void;       // callback
    level?: "STATE" | "REGION" | "ZONE" | "SECTOR" | "AREA" | "CATEGORY_SUMMARY";
}

const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency: "INR",
        maximumFractionDigits: 0,
    }).format(value || 0);
};

const HierarchyCard: React.FC<Props> = ({ row, showBack = true, onBack, level }) => {

    const redemptionPercent = row.ScannedAmount
        ? (row.RedeemedAmount / row.ScannedAmount) * 100
        : 0;

    return (
        <div className="bg-white dark:bg-gray-800/50 
                    backdrop-blur-sm
                    rounded-3xl shadow-sm hover:shadow-xl
                    p-5 sm:p-6 
                    border border-gray-100 dark:border-gray-700/50 
                    transition-all duration-300 group
                    hover:-translate-y-1">

            {/* Header Section */}
            <div className="flex justify-between items-start gap-4 mb-6">
                <div className="min-w-0">
                    <h2 className="text-lg font-bold text-gray-900 dark:text-white truncate group-hover:text-blue-600 transition-colors">
                        {level === "STATE" && row.State}
                        {level === "REGION" && row.Region}
                        {level === "ZONE" && row.Zone}
                        {level === "SECTOR" && row.Sector}
                        {level === "AREA" && row.Area}
                        {(!level || level === "CATEGORY_SUMMARY") && (row.State || row.Area || "Overview")}
                    </h2>
                    <p className="text-xs font-medium text-gray-400 dark:text-gray-500 mt-1 uppercase tracking-wider">
                        {level === "STATE" && "State"}
                        {level === "REGION" && row.State}
                        {level === "ZONE" && `${row.State} • ${row.Region}`}
                        {level === "SECTOR" && `${row.State} • ${row.Region} • ${row.Zone}`}
                        {level === "AREA" && `${row.State} • ${row.Region} • ${row.Zone} • ${row.Sector}`}
                        {(!level || level === "CATEGORY_SUMMARY") && ([row.Region, row.Zone, row.Sector].filter(Boolean).join(" • ") || "Hierarchy View")}
                    </p>
                </div>

                <div className="bg-blue-50 dark:bg-blue-900/20 p-2 rounded-2xl text-right shrink-0">
                    <p className="text-[10px] font-bold uppercase text-blue-600 dark:text-blue-400 tracking-tighter">
                        Influencers
                    </p>
                    <p className="text-xl font-black text-blue-700 dark:text-blue-300">
                        {row.InfluencerCount || 0}
                    </p>
                </div>
            </div>

            {/* KPI Section */}
            <div className="grid grid-cols-3 gap-2 sm:gap-4 mb-6">
                <div className="flex flex-col">
                    <span className="text-[10px] uppercase font-bold text-gray-400 tracking-widest mb-1">Scanned</span>
                    <span className="text-[11px] sm:text-sm font-bold text-emerald-600 dark:text-emerald-400 truncate">
                        {formatCurrency(row.ScannedAmount)}
                    </span>
                </div>
                <div className="flex flex-col border-x border-gray-100 dark:border-gray-700/50 px-2 sm:px-4">
                    <span className="text-[10px] uppercase font-bold text-gray-400 tracking-widest mb-1">Redeemed</span>
                    <span className="text-[11px] sm:text-sm font-bold text-amber-500 dark:text-amber-400 truncate">
                        {formatCurrency(row.RedeemedAmount)}
                    </span>
                </div>
                <div className="flex flex-col items-end">
                    <span className="text-[10px] uppercase font-bold text-gray-400 tracking-widest mb-1 text-right">Balance</span>
                    <span className="text-[11px] sm:text-sm font-bold text-rose-500 dark:text-rose-400 truncate">
                        {formatCurrency(row.BalanceAmount)}
                    </span>
                </div>
            </div>

            {/* Performance Indicator */}
            <div className="space-y-2">
                <div className="flex justify-between items-end">
                    <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-tight">Redemption Rate</span>
                    <span className={`text-xs font-bold ${redemptionPercent > 70 ? 'text-emerald-500' : redemptionPercent > 40 ? 'text-amber-500' : 'text-rose-500'}`}>
                        {redemptionPercent.toFixed(1)}%
                    </span>
                </div>

                <div className="w-full bg-gray-100 dark:bg-gray-700/50 rounded-full h-2.5 overflow-hidden p-[1px]">
                    <div
                        className={`h-full rounded-full transition-all duration-700 ease-out shadow-sm
                                  ${redemptionPercent > 70 ? 'bg-emerald-500' : redemptionPercent > 40 ? 'bg-amber-500' : 'bg-rose-500'}`}
                        style={{ width: `${redemptionPercent}%` }}
                    />
                </div>
            </div>

            {/* Interactive Footer */}
            <div className="mt-5 pt-4 border-t border-gray-50 dark:border-gray-700/30 flex justify-between items-center opacity-0 group-hover:opacity-100 transition-opacity">
                <span className="text-[10px] font-medium text-gray-400 italic">Click to drill down</span>
                <div className="h-6 w-6 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-3.5 h-3.5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                    </svg>
                </div>
            </div>
        </div>
    );
};

export default HierarchyCard;

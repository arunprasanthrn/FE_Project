import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { HomeIcon } from "@heroicons/react/24/solid";
import Darkmode from "../../Components/Darkmode";
import { Button } from "../../Components/Button";
import Grid, { ColumnType, GridRow } from '../../Components/grid';
import Loader from "../../Components/Loading";
import apiClient from "../../api/apiClient";
import SuccessPopup from '../../Components/SuccessPopup';
import ErrorPopup from '../../Components/ErrorMsgpopup';
import HierarchyComponent from "../../Components/Hierarchy";



interface GridColumn {
    key: string;
    label: string;
    type: "label" | "text" | "combo" | "date" | "number";
    width: string;
    editable?: boolean;
    options?: Array<{ label: string; value: string }>;
    ismandatory?: boolean;
    popupedit?: boolean;
    popuptype?: ColumnType;
}

const col = (
    key: string,
    label: string,
    type: GridColumn["type"],
    width: string,
    editable?: boolean,
    options?: Array<{ label: string; value: string }>,
    ismandatory?: boolean,
    popupedit?: boolean,
    popuptype?: GridColumn["type"]
): GridColumn => ({
    key, label, type, width, editable, options, ismandatory, popupedit, popuptype
});


const CouponDetails: React.FC = () => {
    const navigate = useNavigate();


    /* MAIN DROPDOWNS */

    const [successMsg, setSuccessMsg] = useState(false);
    const [errMsg, setErrMsg] = useState(false);
    const [errorMessage, seterrorMessage] = useState("");


    const [financialYear, setFinancialYear] = useState<string>("");
    const [financialPeriod, setFinancialPeriod] = useState<string>("");

    const [financialYearOpts, setFinancialYearOpts] = useState<Array<{ label: string, value: string }>>([]);
    const [financialPeriodOpts, setFinancialPeriodOpts] = useState<Array<{ label: string, value: string, yearid: string, Sno: number }>>([]);

    const [rows, setRows] = useState<any[]>([]);
    const [columns, setColumns] = useState<Array<any>>([]);
    const [loading, setLoading] = useState(false);
    const [staticData, setStaticData] = useState<Array<any>>([]);
    const [InfluencerDetails, setInfluencerDetails] = useState<any[]>([]);
    const [PreviousDrillHierarchy, setPreviousDrillHierarchy] = useState<any[]>([]);
    const [filteredPeriodOpts, setFilteredPeriodOpts] = useState<
        Array<{ label: string; value: string; yearid: string, Sno: number }>
    >([]);

    const [selectedHierarchy, setSelectedHierarchy] = useState({
        State: "",
        Region: "",
        Zone: "",
        Sector: "",
        Area: ""
    });

    const [viewMode, setViewMode] = useState<"GEOGRAPHIC" | "CATEGORY">("GEOGRAPHIC");
    const [inflCategory, setInflCategory] = useState<string>("");
    const [categoryOpts, setCategoryOpts] = useState<Array<{ label: string, value: string }>>([]);

    const [level, setLevel] = useState<
        "STATE" | "REGION" | "ZONE" | "SECTOR" | "AREA" | "INFLUENCER" | "CATEGORY_SUMMARY"
    >("STATE");

    const hierarchyDisplay = [
        financialYear && `Year: ${financialYear}`,
        financialPeriod && `Period: ${financialPeriod}`,
        inflCategory && `Category: ${inflCategory}`,
        selectedHierarchy.State && `State: ${selectedHierarchy.State}`,
        selectedHierarchy.Region && `Region: ${selectedHierarchy.Region}`,
        selectedHierarchy.Zone && `Zone: ${selectedHierarchy.Zone}`,
        selectedHierarchy.Sector && `Sector: ${selectedHierarchy.Sector}`,
        selectedHierarchy.Area && `Area: ${selectedHierarchy.Area}`,
    ]
        .filter(Boolean)
        .join("  |  ");

    useEffect(() => {
        if (!financialYear) {
            setFilteredPeriodOpts([]);
            setFinancialPeriod("");
            return;
        }

        const filtered = financialPeriodOpts
            .filter((period) => period.yearid === financialYear)
            .sort((a, b) => a.Sno - b.Sno);   // 🔥 ORDER BY Sno ASC

        setFilteredPeriodOpts(filtered);
        setFinancialPeriod("");

    }, [financialYear, financialPeriodOpts]);

    const handleGetDetails = async () => {


        // /Please select Financial Year or Financial Period 
        if (!financialYear) {
            setErrMsg(true);
            seterrorMessage("Please select Financial Year");
            return;
        }

        const payload = {
            Usercontext: JSON.parse(localStorage.getItem("activeUserInfo") || "{}"),
            servicename: "CouponSearch",   // or your backend service name
            JsonValue: {
                FinancialYear: financialYear,
                FinancialPeriod: financialPeriod || ""
            }
        }

        console.log("Request Payload:", payload);

        try {
            setLoading(true);

            const res = await apiClient.post("/common", payload);

            if (res.data.success) {
                setStaticData(res.data.data[0] || []);
                setLevel("STATE"); // Reset drill level
            }

        } catch (err: any) {

            setErrMsg(true);

            let message = "An unknown error occurred";

            if (err?.response?.data?.message) {
                message = err.response.data.message;
            } else if (err?.message) {
                message = err.message;
            }

            seterrorMessage(message);

        } finally {
            setLoading(false);
        }
    };


    /* INIT LOAD */
    const fetchInit = async () => {
        setLoading(true);

        setColumns([
            col("id", "S.No", "label", "70px", false, undefined, false, false, "label"),
            col("InfluencerMobile", "InfluencerMobile", "label", "70px", false, undefined, false, false, "label"),
            col("Name", "Name", "label", "150px", false, undefined, false, false, "label"),
            col("ScannedAmount", "Scanned Amount", "number", "100px", false, undefined, false, false, "number"),
            col("RedeemedAmount", "Redeemed Amount", "number", "100px", false, undefined, false, false, "number"),
            col("BalanceAmount", "Balance Amount", "number", "100px", false, undefined, false, false, "number"),
        ]);

        try {
            const res = await apiClient.post("/common", {
                Usercontext: JSON.parse(localStorage.getItem("activeUserInfo") || "{}"),
                servicename: "CouponInit",
                JsonValue: {},
            });

            console.log("Init API response:", res);

            if (res.data.success) {
                setStaticData(res.data.data[0] || []);

                setFinancialYearOpts(res.data.data[1] || []);
                setFinancialPeriodOpts(res.data.data[2] || []);
                setFinancialYear(res.data.data[3] || "");

                // Extract unique categories from static data if not provided explicitly
                const categories = Array.from(new Set((res.data.data[0] || []).map((item: any) => item.Category))).filter(Boolean);
                setCategoryOpts(categories.map(c => ({ label: String(c), value: String(c) })));
            }


        }
        catch (err: any) {


            setErrMsg(true);

            let message = "An unknown error occurred";

            if (err?.response?.data) {
                const backendData = err.response.data;

                if (typeof backendData.message === "string") {
                    message = backendData.message;
                } else if (typeof backendData.error === "string") {
                    message = backendData.error;
                } else {
                    message = JSON.stringify(backendData);
                }
            } else if (err?.message) {
                message = err.message;
            }

            seterrorMessage(message);
        }
        finally {
            setLoading(false);
        }
    };

    useEffect(() => {

        fetchInit();
    }, []);


    useEffect(() => {
        if (!staticData.length) return;

        console.log("staticDate", staticData);

        let filteredData = staticData;

        // Apply Category Filter if in Geographic Mode or if a category is pre-selected
        if (inflCategory) {
            filteredData = staticData.filter(item => item.club === inflCategory);
        }

        // Apply Geographic Filters if any
        if (selectedHierarchy.State) filteredData = filteredData.filter(item => item.State === selectedHierarchy.State);
        if (selectedHierarchy.Region) filteredData = filteredData.filter(item => item.Region === selectedHierarchy.Region);
        if (selectedHierarchy.Zone) filteredData = filteredData.filter(item => item.Zone === selectedHierarchy.Zone);
        if (selectedHierarchy.Sector) filteredData = filteredData.filter(item => item.Sector === selectedHierarchy.Sector);
        if (selectedHierarchy.Area) filteredData = filteredData.filter(item => item.Area === selectedHierarchy.Area);


        if (level === "INFLUENCER") {
            // Do not overwrite rows set by fetchAreaDetails
            return;
        }

        if (viewMode === "CATEGORY" && level === "STATE") {
            // Group by Category
            const catWise = Object.values(
                filteredData.reduce((acc: any, item: any) => {
                    const cat = item.club || "Others";
                    console.log("Processing item for category grouping:", { cat, item });
                    if (!acc[cat]) {
                        acc[cat] = {
                            State: cat, // HierarchyComponent uses row.State as title
                            Region: "Category View",
                            InfluencerCount: 0,
                            ScannedAmount: 0,
                            RedeemedAmount: 0,
                            BalanceAmount: 0,
                            isCategory: true
                        };
                    }
                    acc[cat].InfluencerCount += item.InfluencerCount;
                    acc[cat].ScannedAmount += item.ScannedAmount;
                    acc[cat].RedeemedAmount += item.RedeemedAmount;
                    acc[cat].BalanceAmount += item.BalanceAmount;
                    return acc;
                }, {})
            );
            setRows(catWise);
        } else {
            // Geographic Grouping based on current level
            let groupingField = "State";
            if (level === "REGION") groupingField = "Region";
            else if (level === "ZONE") groupingField = "Zone";
            else if (level === "SECTOR") groupingField = "Sector";
            else if (level === "AREA") groupingField = "Area";

            const grouped = Object.values(
                filteredData.reduce((acc: any, item: any) => {
                    const key = item[groupingField];
                    if (!acc[key]) {
                        acc[key] = {
                            State: item.State,
                            Region: item.Region,
                            Zone: item.Zone,
                            Sector: item.Sector,
                            Area: item.Area,
                            [groupingField]: key,
                            InfluencerCount: 0,
                            ScannedAmount: 0,
                            RedeemedAmount: 0,
                            BalanceAmount: 0,
                        };
                    }
                    acc[key].InfluencerCount += item.InfluencerCount;
                    acc[key].ScannedAmount += item.ScannedAmount;
                    acc[key].RedeemedAmount += item.RedeemedAmount;
                    acc[key].BalanceAmount += item.BalanceAmount;
                    return acc;
                }, {})
            );
            setRows(grouped);
        }
    }, [staticData, viewMode, inflCategory, level, selectedHierarchy]);

    const handleClearFilters = () => {
        setInflCategory("");
        setSelectedHierarchy({
            State: "",
            Region: "",
            Zone: "",
            Sector: "",
            Area: ""
        });
        setLevel("STATE");
    };

    const handleDrill = (row: any) => {
        if (viewMode === "CATEGORY" && level === "STATE") {
            setInflCategory(row.State); // row.State contains the Category name in this mode
            setViewMode("GEOGRAPHIC");
            setLevel("STATE");
            return;
        }

        if (level === "STATE") {
            setSelectedHierarchy({ ...selectedHierarchy, State: row.State });
            setLevel("REGION");
            loadRegionWise(row.State);
        }
        else if (level === "REGION") {
            setSelectedHierarchy({ ...selectedHierarchy, Region: row.Region });
            setLevel("ZONE");
            loadZoneWise(selectedHierarchy.State, row.Region);
        }
        else if (level === "ZONE") {
            setSelectedHierarchy({ ...selectedHierarchy, Zone: row.Zone });
            setLevel("SECTOR");
            loadSectorWise(selectedHierarchy.State, selectedHierarchy.Region, row.Zone);
        }
        else if (level === "SECTOR") {
            setSelectedHierarchy({ ...selectedHierarchy, Sector: row.Sector });
            setLevel("AREA");
            loadAreaWise(
                selectedHierarchy.State,
                selectedHierarchy.Region,
                selectedHierarchy.Zone,
                row.Sector
            );
        }
        else if (level === "AREA") {

            const selectedArea = row.Area;

            setSelectedHierarchy(prev => ({
                ...prev,
                Area: selectedArea
            }));

            // 🔥 TRIGGER API HERE
            fetchAreaDetails(
                selectedHierarchy.State,
                selectedHierarchy.Region,
                selectedHierarchy.Zone,
                selectedHierarchy.Sector,
                selectedArea
            );
        }
    };


    const loadRegionWise = (state: string) => {
        const regionWise = Object.values(
            staticData
                .filter(x => x.State === state)
                .reduce((acc: any, item: any) => {
                    if (!acc[item.Region]) {
                        acc[item.Region] = {
                            State: state,
                            Region: item.Region,
                            InfluencerCount: 0,
                            ScannedAmount: 0,
                            RedeemedAmount: 0,
                            BalanceAmount: 0,
                        };
                    }

                    acc[item.Region].InfluencerCount += item.InfluencerCount;
                    acc[item.Region].ScannedAmount += item.ScannedAmount;
                    acc[item.Region].RedeemedAmount += item.RedeemedAmount;
                    acc[item.Region].BalanceAmount += item.BalanceAmount;

                    return acc;
                }, {})
        );

        setRows(regionWise);
    };
    const loadZoneWise = (state: string, region: string) => {
        const zoneWise = Object.values(
            staticData
                .filter(
                    x =>
                        x.State === state &&
                        x.Region === region
                )
                .reduce((acc: any, item: any) => {
                    if (!acc[item.Zone]) {
                        acc[item.Zone] = {
                            State: state,
                            Region: region,
                            Zone: item.Zone,
                            InfluencerCount: 0,
                            ScannedAmount: 0,
                            RedeemedAmount: 0,
                            BalanceAmount: 0,
                        };
                    }

                    acc[item.Zone].InfluencerCount += item.InfluencerCount;
                    acc[item.Zone].ScannedAmount += item.ScannedAmount;
                    acc[item.Zone].RedeemedAmount += item.RedeemedAmount;
                    acc[item.Zone].BalanceAmount += item.BalanceAmount;

                    return acc;
                }, {})
        );

        setRows(zoneWise);
    };
    const loadSectorWise = (
        state: string,
        region: string,
        zone: string
    ) => {
        const sectorWise = Object.values(
            staticData
                .filter(
                    x =>
                        x.State === state &&
                        x.Region === region &&
                        x.Zone === zone
                )
                .reduce((acc: any, item: any) => {
                    if (!acc[item.Sector]) {
                        acc[item.Sector] = {
                            State: state,
                            Region: region,
                            Zone: zone,
                            Sector: item.Sector,
                            InfluencerCount: 0,
                            ScannedAmount: 0,
                            RedeemedAmount: 0,
                            BalanceAmount: 0,
                        };
                    }

                    acc[item.Sector].InfluencerCount += item.InfluencerCount;
                    acc[item.Sector].ScannedAmount += item.ScannedAmount;
                    acc[item.Sector].RedeemedAmount += item.RedeemedAmount;
                    acc[item.Sector].BalanceAmount += item.BalanceAmount;

                    return acc;
                }, {})
        );

        setRows(sectorWise);
    };
    const loadAreaWise = (
        state: string,
        region: string,
        zone: string,
        sector: string
    ) => {
        const areaWise = Object.values(
            staticData
                .filter(
                    x =>
                        x.State === state &&
                        x.Region === region &&
                        x.Zone === zone &&
                        x.Sector === sector
                )
                .reduce((acc: any, item: any) => {
                    if (!acc[item.Area]) {
                        acc[item.Area] = {
                            State: state,
                            Region: region,
                            Zone: zone,
                            Sector: sector,
                            Area: item.Area,
                            InfluencerCount: 0,
                            ScannedAmount: 0,
                            RedeemedAmount: 0,
                            BalanceAmount: 0,
                        };
                    }

                    acc[item.Area].InfluencerCount += item.InfluencerCount;
                    acc[item.Area].ScannedAmount += item.ScannedAmount;
                    acc[item.Area].RedeemedAmount += item.RedeemedAmount;
                    acc[item.Area].BalanceAmount += item.BalanceAmount;

                    return acc;
                }, {})
        );

        setRows(areaWise);
    };

    const handleBack = () => {
        if (level === "INFLUENCER") {
            setLevel("AREA");
            loadAreaWise(
                selectedHierarchy.State,
                selectedHierarchy.Region,
                selectedHierarchy.Zone,
                selectedHierarchy.Sector
            );
            setSelectedHierarchy(prev => ({
                ...prev,
                Area: ""
            }));
        }
        if (level === "AREA") {
            setLevel("SECTOR");
            loadSectorWise(
                selectedHierarchy.State,
                selectedHierarchy.Region,
                selectedHierarchy.Zone
            );
            setSelectedHierarchy(prev => ({
                ...prev,
                Sector: ""
            }));
        }
        else if (level === "SECTOR") {
            setLevel("ZONE");
            loadZoneWise(
                selectedHierarchy.State,
                selectedHierarchy.Region
            );
            setSelectedHierarchy(prev => ({
                ...prev,
                Zone: ""
            }));
        }
        else if (level === "ZONE") {
            setLevel("REGION");
            loadRegionWise(selectedHierarchy.State);
            setSelectedHierarchy(prev => ({
                ...prev,
                Region: ""
            }));
        }
        else if (level === "REGION") {
            setLevel("STATE");

            // Reload state level summary
            const stateWise = Object.values(
                staticData.reduce((acc: any, item: any) => {
                    if (!acc[item.State]) {
                        acc[item.State] = {
                            State: item.State,
                            InfluencerCount: 0,
                            ScannedAmount: 0,
                            RedeemedAmount: 0,
                            BalanceAmount: 0,
                        };
                    }

                    acc[item.State].InfluencerCount += item.InfluencerCount;
                    acc[item.State].ScannedAmount += item.ScannedAmount;
                    acc[item.State].RedeemedAmount += item.RedeemedAmount;
                    acc[item.State].BalanceAmount += item.BalanceAmount;

                    return acc;
                }, {})
            );

            setRows(stateWise);
            setSelectedHierarchy({
                State: "",
                Region: "",
                Zone: "",
                Sector: "",
                Area: ""
            });
        }
    };


    const fetchAreaDetails = async (
        state: string,
        region: string,
        zone: string,
        sector: string,
        area: string
    ) => {


        // 🔥 API CALL TO FETCH INFLUENCER LEVEL Only If InfluencerDetails length is 0 or previous hier is differ from current seledted hierarchy
        if (InfluencerDetails.length === 0 || !PreviousDrillHierarchy.some(h =>
            h.state === state && h.region === region && h.zone === zone && h.sector === sector && h.area === area
        )) {
            try {
                setLoading(true);

                const res = await apiClient.post("/common", {
                    Usercontext: JSON.parse(localStorage.getItem("activeUserInfo") || "{}"),
                    servicename: "CouponAreaDetails",  // create backend service
                    JsonValue: {
                        State: state,
                        Region: region,
                        Zone: zone,
                        Sector: sector,
                        Area: area
                    }
                });

                if (res.data.success) {
                    setRows(res.data.data[0]);   // influencer level data
                    setInfluencerDetails(res.data.data[0]); // additional details if needed
                    setLevel("INFLUENCER");     // new level
                    setPreviousDrillHierarchy([]); // clear drill history on new drill 
                    setPreviousDrillHierarchy((prev) => [...prev, { state, region, zone, sector, area }]); // store drill path
                }

            } catch (err: any) {

                setErrMsg(true);

                let message = "An unknown error occurred";

                if (err?.response?.data) {
                    const backendData = err.response.data;

                    if (typeof backendData.message === "string") {
                        message = backendData.message;
                    } else if (typeof backendData.error === "string") {
                        message = backendData.error;
                    } else {
                        message = JSON.stringify(backendData);
                    }
                } else if (err?.message) {
                    message = err.message;
                }

                seterrorMessage(message);
            } finally {
                setLoading(false);
            }
        }
        else {

            console.log("Using cached influencer details for:", { state, region, zone, sector, area }, PreviousDrillHierarchy);
            if (InfluencerDetails.length > 0) {
                setLevel("INFLUENCER");
                setRows(InfluencerDetails);
            }
            else {
                setErrMsg(true);
                seterrorMessage("No influencer details available kindly refresh the screen");
            }
        }
    };

    return (
        <div className="min-h-screen dark:bg-gray-900 p-4 
                    text-sm sm:text-base 
                    text-gray-900 dark:text-white">

            <div className="flex justify-between items-center mb-4">
                <h1 className="text-lg sm:text-xl md:text-2xl font-bold">
                    Coupon Details
                </h1>

                <div className="flex gap-3">
                    <Darkmode />
                    <Button
                        onClick={() => navigate("/Mainpage")}
                        className="px-3 py-1 sm:px-4 sm:py-2"
                    >
                        <HomeIcon className="h-4 w-4 sm:h-5 sm:w-5" />
                    </Button>
                </div>
            </div>
            {/* Financial Filt            {/* Executive Financial Filter Bar */}
            <div className="bg-white/80 dark:bg-gray-800/80 
                backdrop-blur-md
                p-6 rounded-[2rem]
                shadow-xl border border-white/20 dark:border-gray-700/30
                mb-6">

                <div className="flex flex-col gap-6">
                    {/* Top Row: View Toggle and Actions */}
                    <div className="flex flex-col sm:flex-row justify-between items-center gap-4 border-b border-gray-100 dark:border-gray-700/50 pb-6">
                        <div className="flex bg-gray-100 dark:bg-gray-900/50 p-1.5 rounded-2xl w-full sm:w-auto">
                            <button
                                onClick={() => { setViewMode("GEOGRAPHIC"); handleClearFilters(); }}
                                className={`flex-1 sm:flex-none px-6 py-2.5 rounded-xl text-sm font-bold transition-all duration-300 ${viewMode === "GEOGRAPHIC" ? 'bg-white dark:bg-gray-800 shadow-md text-blue-600' : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}
                            >
                                Geographic View
                            </button>
                            <button
                                onClick={() => { setViewMode("CATEGORY"); handleClearFilters(); }}
                                className={`flex-1 sm:flex-none px-6 py-2.5 rounded-xl text-sm font-bold transition-all duration-300 ${viewMode === "CATEGORY" ? 'bg-white dark:bg-gray-800 shadow-md text-blue-600' : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}
                            >
                                Category View
                            </button>
                        </div>

                        <div className="flex gap-3 w-full sm:w-auto">
                            <Button
                                onClick={handleClearFilters}
                                className="flex-1 sm:flex-none h-11 px-6 rounded-xl bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-600 !text-sm font-bold shadow-sm"
                            >
                                Clear Filters
                            </Button>
                            <Button
                                onClick={handleGetDetails}
                                className="flex-1 sm:flex-none h-11 px-8 rounded-xl bg-blue-600 hover:bg-blue-700 text-white !text-sm font-bold shadow-lg shadow-blue-500/30 transition-all active:scale-95"
                            >
                                Get Details
                            </Button>
                        </div>
                    </div>

                    {/* Bottom Row: Selectors */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                        <div className="flex flex-col gap-2">
                            <label className="text-[11px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest px-1">Financial Year</label>
                            <select
                                value={financialYear}
                                onChange={(e) => setFinancialYear(e.target.value)}
                                className="h-12 px-4 rounded-2xl border-0 bg-gray-50 dark:bg-gray-900/50 focus:ring-2 focus:ring-blue-500 outline-none text-sm font-bold dark:text-white"
                            >
                                <option value="">Select Year</option>
                                {financialYearOpts.map((opt) => (
                                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                                ))}
                            </select>
                        </div>

                        <div className="flex flex-col gap-2">
                            <label className="text-[11px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest px-1">Financial Period</label>
                            <select
                                value={financialPeriod}
                                onChange={(e) => setFinancialPeriod(e.target.value)}
                                className="h-12 px-4 rounded-2xl border-0 bg-gray-50 dark:bg-gray-900/50 focus:ring-2 focus:ring-blue-500 outline-none text-sm font-bold dark:text-white"
                            >
                                <option value="">Select Period</option>
                                {filteredPeriodOpts.map((opt) => (
                                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                                ))}
                            </select>
                        </div>

                        {/* <div className="flex flex-col gap-2">
                            <label className="text-[11px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest px-1">Influencer Category</label>
                            <select
                                value={inflCategory}
                                onChange={(e) => {
                                    setInflCategory(e.target.value);
                                    if (viewMode === "CATEGORY") setLevel("STATE");
                                }}
                                className="h-12 px-4 rounded-2xl border-0 bg-gray-50 dark:bg-gray-900/50 focus:ring-2 focus:ring-blue-500 outline-none text-sm font-bold dark:text-white"
                            >
                                <option value="">All Categories</option>
                                {categoryOpts.map((opt) => (
                                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                                ))}
                            </select>
                        </div> */}

                        <div className="flex flex-col justify-end min-w-0">
                            {hierarchyDisplay && (
                                <div className="h-12 flex items-center px-4 bg-blue-50/50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-300 rounded-2xl text-[11px] font-bold border border-blue-100 dark:border-blue-800/30 overflow-x-auto whitespace-nowrap scrollbar-hide">
                                    <span>{hierarchyDisplay}</span>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
            {loading && <Loader loading />}

            {level !== "STATE" && (
                <div className="mb-4">
                    <Button
                        onClick={handleBack}
                        className="px-3 py-1 sm:px-4 sm:py-2 text-xs sm:text-sm"
                    >
                        ← Back
                    </Button>
                </div>
            )}

            {level === "INFLUENCER" ? (
                <div className="grid 
                           
                            gap-4 mt-4 
                            text-xs sm:text-sm md:text-base">


                    <Grid data={rows}
                        columns={columns}
                        buttonvisible={true}
                        disableEdit={true} filename={"View Coupon Details.xlsx"}
                        isdelete={false}
                        isedit={false}
                    />

                </div>
            ) : (
                <div className="grid 
                            grid-cols-1 
                            sm:grid-cols-1 
                            md:grid-cols-2 
                            lg:grid-cols-3 
                            gap-4 mt-4 
                            text-xs sm:text-sm md:text-base">
                    {rows.map((row, i) => (
                        <div
                            key={i}
                            onClick={() => handleDrill(row)}
                            className="cursor-pointer"
                        >
                            <HierarchyComponent 
                                row={row} 
                                level={viewMode === "CATEGORY" && level === "STATE" ? "CATEGORY_SUMMARY" : level} 
                            />
                        </div>
                    ))}
                </div>
            )}

            {successMsg && (
                <SuccessPopup
                    message={"Data Saved successfully!"}
                    isopen={true}
                    onClose={() => setSuccessMsg(false)}
                />
            )}

            {errMsg && (
                <ErrorPopup
                    message={errorMessage}
                    isopen={true}
                    onClose={() => setErrMsg(false)}
                />
            )}
        </div>
    );
};

export default CouponDetails;

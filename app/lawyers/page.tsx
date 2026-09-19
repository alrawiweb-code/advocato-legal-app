"use client";

import { useState, useEffect, Suspense, useCallback } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { Scale, ArrowRight, ShieldCheck, FileText, X } from "lucide-react";

import { useUserRole } from "@/lib/context/RoleContext";
import { MarketplaceFilters, DEFAULT_FILTERS, PaginatedLawyers, PracticeArea, IntakeAssessment } from "@/types";

import SearchBar from "@/components/marketplace/SearchBar";
import FilterPanel from "@/components/marketplace/FilterPanel";
import LawyerCard from "@/components/marketplace/LawyerCard";

function LawyersDirectoryContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { role } = useUserRole();

  // State
  const [filters, setFilters] = useState<MarketplaceFilters>({
    ...DEFAULT_FILTERS,
    search: searchParams.get("search") || "",
    practiceArea: searchParams.get("practiceArea") || "all",
  });
  const [practiceAreas, setPracticeAreas] = useState<PracticeArea[]>([]);
  const [data, setData] = useState<PaginatedLawyers | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  // Intake Context (Preserved from Phase 1)
  const [intakeData, setIntakeData] = useState<IntakeAssessment | null>(null);

  // 1. Fetch Taxonomy (Once)
  useEffect(() => {
    const fetchTaxonomy = async () => {
      try {
        const res = await fetch("/api/practice-areas");
        if (res.ok) {
          const areas = await res.json();
          setPracticeAreas(areas);
        }
      } catch (e) {
        console.error("Failed to load practice areas", e);
      }
    };
    fetchTaxonomy();

    // Load intake data if present
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("advocato_latest_intake");
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          setIntakeData(parsed);
          
          // Auto-apply intake filters if this is our first load and we don't have explicit URL filters
          if (!searchParams.has("practiceArea")) {
             // We do a loose match of the intake category to our practice area ID
             // This logic would be improved in Phase 3 with an LLM taxonomy mapping step
          }
        } catch (e) {}
      }
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // 2. Fetch Lawyers (When filters change)
  const fetchLawyers = useCallback(async (currentFilters: MarketplaceFilters) => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      Object.entries(currentFilters).forEach(([key, value]) => {
        params.append(key, value.toString());
      });

      const res = await fetch(`/api/lawyers?${params.toString()}`);
      if (res.ok) {
        const result = await res.json();
        setData(result);
      } else {
        // Check if unauthorized
        if (res.status === 401) {
           router.push("/login?redirect=/lawyers");
        }
      }
    } catch (e) {
      console.error("Failed to load lawyers", e);
    } finally {
      setIsLoading(false);
    }
  }, [router]);

  useEffect(() => {
    fetchLawyers(filters);
  }, [filters, fetchLawyers]);

  const handleClearCaseReview = () => {
    if (typeof window !== "undefined") {
      localStorage.removeItem("advocato_latest_intake");
      localStorage.removeItem("advocato_intake_data");
    }
    setIntakeData(null);
  };

  const handleClearFilters = () => {
    setFilters(DEFAULT_FILTERS);
  };

  const handleSearch = (search: string) => {
    setFilters(prev => ({ ...prev, search, page: 1 }));
  };

  const matchMap = new Map(
    intakeData?.matchedLawyers?.map((m) => [m.lawyerId, m]) || []
  );

  return (
    <div className="flex-1 flex flex-col bg-background">
      <div className="max-w-[1360px] w-full mx-auto px-4 sm:px-6 md:px-8 pt-8 pb-32 md:pb-16">
        
        {/* Header Section */}
        <div className="pb-5 mb-6">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
            <div>
              <div className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-brass mb-2 px-2.5 py-1 rounded-md bg-surface-container-low border border-hairline">
                <Scale className="w-3.5 h-3.5 text-brass" />
                <span>{role === "lawyer" ? "Lawyer Network Directory" : "Lawyer Marketplace"}</span>
              </div>
              <h1 className="font-headline text-2xl sm:text-3xl md:text-4xl text-primary font-semibold tracking-tight">
                {role === "lawyer"
                  ? "Attorney Network"
                  : (intakeData
                      ? "Matched Legal Counsel"
                      : "Find Your Legal Advocate")}
              </h1>
              <p className="text-on-surface-variant text-xs sm:text-sm mt-1.5 max-w-2xl leading-relaxed">
                {role === "lawyer"
                  ? "Attorney roster & peer network — visible in Lawyer View."
                  : (intakeData
                      ? `Verified counsel licensed in ${intakeData.jurisdiction} specializing in your issue.`
                      : "Browse verified, state-bar licensed attorneys ready to assist you. Book a secure consultation instantly.")}
              </p>
            </div>
          </div>

          <SearchBar 
            initialValue={filters.search}
            onSearch={handleSearch}
            className="mb-8" 
          />

          <FilterPanel 
            filters={filters}
            practiceAreas={practiceAreas}
            onChange={setFilters}
            onClear={handleClearFilters}
          />

          {/* Sort & Pagination Header */}
          <div className="flex flex-wrap items-center justify-between gap-4 py-4 border-b border-hairline">
            <div className="text-sm font-medium text-primary">
              {isLoading ? (
                <span className="text-outline">Searching...</span>
              ) : (
                <span>
                  Showing {data?.lawyers.length || 0} of {data?.total || 0} lawyers
                </span>
              )}
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs uppercase tracking-wider font-semibold text-on-surface-variant">Sort:</span>
              <select
                value={filters.sort}
                onChange={(e) => setFilters({ ...filters, sort: e.target.value as any, page: 1 })}
                className="editorial-select bg-surface-container-lowest border border-hairline rounded-lg px-3 py-1.5 text-xs text-primary font-medium focus:ring-1 focus:ring-brass focus:border-brass"
              >
                <option value="recommended">Best Match / Recommended</option>
                <option value="highest_rated">Highest Rated</option>
                <option value="most_experienced">Most Experienced</option>
                <option value="available_now">Available Now</option>
              </select>
            </div>
          </div>
        </div>

        {/* Case Assessment Summary Banner (Preserved from Phase 1) */}
        {intakeData && (
          <div className="mb-8 p-5 rounded-2xl bg-surface-container-lowest border border-brass/30 shadow-xs flex flex-col md:flex-row md:items-start justify-between gap-5 animate-in fade-in duration-300">
            <div className="space-y-2 min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-0.5 rounded-md bg-brass/10 border border-brass/20 text-brass uppercase tracking-wider">
                  <ShieldCheck className="w-3.5 h-3.5 text-brass" /> Case Brief
                </span>
                {intakeData.caseTitle && (
                  <span className="text-sm font-bold text-primary">
                    {intakeData.caseTitle}
                  </span>
                )}
                <span className="text-xs text-on-surface-variant font-medium">
                  • {intakeData.category} • {intakeData.jurisdiction}
                </span>
              </div>

              <p className="text-xs sm:text-sm text-on-surface leading-relaxed italic font-serif">
                "{intakeData.summary}"
              </p>

              {intakeData.documents && intakeData.documents.length > 0 && (
                <div className="flex flex-wrap items-center gap-2 pt-1.5">
                  <span className="text-[11px] uppercase font-semibold text-on-surface-variant tracking-wider">
                    Attached Files:
                  </span>
                  {intakeData.documents.map((d, dIdx) => (
                    <span
                      key={dIdx}
                      className="inline-flex items-center gap-1.5 bg-surface-container-low border border-hairline px-2.5 py-1 rounded-md text-xs font-medium text-primary shadow-2xs"
                    >
                      <FileText className="w-3.5 h-3.5 text-brass" />
                      <span>{d.name}</span>
                      <span className="text-[10px] text-on-surface-variant">({d.size})</span>
                    </span>
                  ))}
                </div>
              )}
            </div>

            <div className="flex items-center gap-2 shrink-0 self-start md:self-center">
              <Link
                href="/intake"
                className="text-xs font-semibold text-brass hover:text-brass-hover inline-flex items-center gap-1.5 bg-surface-container-low border border-hairline px-3.5 py-2 rounded-lg shadow-2xs hover:shadow-xs transition-all min-h-[38px]"
              >
                <span>Edit Case</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
              <button
                type="button"
                onClick={handleClearCaseReview}
                className="text-xs font-medium text-on-surface-variant hover:text-red-700 inline-flex items-center gap-1 bg-surface-container-low border border-hairline px-3.5 py-2 rounded-lg transition-colors min-h-[38px]"
              >
                <X className="w-3.5 h-3.5" />
                <span>Clear</span>
              </button>
            </div>
          </div>
        )}

        {/* Loading State */}
        {isLoading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="animate-pulse bg-surface-container-low rounded-xl h-[400px] w-full border border-hairline"></div>
            ))}
          </div>
        )}

        {/* Lawyer Cards Grid */}
        {!isLoading && data && data.lawyers.length > 0 && (
          <div className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {data.lawyers.map((lawyer) => {
                const matchInfo = matchMap.get(lawyer.id);
                return (
                  <LawyerCard 
                    key={lawyer.id} 
                    lawyer={lawyer} 
                    matchScore={matchInfo?.matchScore} 
                  />
                );
              })}
            </div>

            {/* Pagination Controls */}
            {data.totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 pt-8 border-t border-hairline">
                <button
                  onClick={() => setFilters({ ...filters, page: Math.max(1, filters.page - 1) })}
                  disabled={filters.page === 1}
                  className="px-4 py-2 border border-hairline rounded-lg text-sm font-medium text-primary hover:bg-surface-container disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Previous
                </button>
                <div className="text-sm font-medium text-on-surface-variant">
                  Page {data.page} of {data.totalPages}
                </div>
                <button
                  onClick={() => setFilters({ ...filters, page: Math.min(data.totalPages, filters.page + 1) })}
                  disabled={filters.page === data.totalPages}
                  className="px-4 py-2 border border-hairline rounded-lg text-sm font-medium text-primary hover:bg-surface-container disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Next
                </button>
              </div>
            )}
          </div>
        )}

        {/* Empty State */}
        {!isLoading && data && data.lawyers.length === 0 && (
          <div className="bg-surface-container-lowest rounded-2xl border border-hairline p-8 sm:p-12 text-center shadow-xs flex flex-col items-center justify-center max-w-xl mx-auto my-6 sm:my-10">
            <div className="w-14 h-14 rounded-2xl bg-surface-container-low border border-hairline flex items-center justify-center text-brass mb-4 shadow-2xs">
              <Scale className="w-7 h-7" />
            </div>
            <h2 className="font-headline text-lg sm:text-xl font-semibold text-primary mb-2">
              No Lawyers Found
            </h2>
            <p className="text-xs sm:text-sm text-on-surface-variant leading-relaxed mb-6 max-w-md">
              No lawyers match your current filters. Try adjusting your search, expanding your required experience, or clearing all filters.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
              <button
                onClick={handleClearFilters}
                className="bg-primary hover:bg-slate-dark text-white font-semibold text-xs px-6 py-3 rounded-lg flex items-center justify-center gap-2 shadow-sm hover:shadow-md btn-editorial min-h-[44px]"
              >
                Clear All Filters
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function LawyersDirectoryPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-sm font-medium text-primary">Loading Marketplace...</div>}>
      <LawyersDirectoryContent />
    </Suspense>
  );
}

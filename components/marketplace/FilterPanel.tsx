"use client";

import { useState } from "react";
import { MarketplaceFilters, PracticeArea } from "@/types";
import { INDIAN_STATES } from "@/lib/data/lawyers";
import { SUPPORTED_LANGUAGES, getServicesForPracticeArea } from "@/lib/data/practice-areas";
import { ChevronDown, SlidersHorizontal, X } from "lucide-react";

interface FilterPanelProps {
  filters: MarketplaceFilters;
  practiceAreas: PracticeArea[];
  onChange: (newFilters: MarketplaceFilters) => void;
  onClear: () => void;
}

export default function FilterPanel({ filters, practiceAreas, onChange, onClear }: FilterPanelProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const availableServices = filters.practiceArea !== "all" 
    ? getServicesForPracticeArea(filters.practiceArea)
    : [];

  const updateFilter = (key: keyof MarketplaceFilters, value: any) => {
    // If practice area changes, reset service
    if (key === "practiceArea") {
      onChange({ ...filters, [key]: value, serviceId: "all", page: 1 });
    } else {
      onChange({ ...filters, [key]: value, page: 1 });
    }
  };

  const hasActiveFilters = 
    filters.practiceArea !== "all" || 
    filters.serviceId !== "all" ||
    filters.state !== "all" ||
    filters.language !== "all" ||
    filters.availability !== "all" ||
    filters.verifiedOnly ||
    filters.minExperience > 0 ||
    filters.maxExperience < 40;

  return (
    <div className="bg-surface rounded-xl border border-hairline shadow-sm mb-6">
      {/* Mobile Toggle & Active Summary */}
      <div 
        className="p-4 flex items-center justify-between cursor-pointer lg:hidden"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-2 text-primary font-medium">
          <SlidersHorizontal className="w-5 h-5" />
          <span>Filters {hasActiveFilters && "(Active)"}</span>
        </div>
        <ChevronDown className={`w-5 h-5 text-outline transition-transform ${isExpanded ? "rotate-180" : ""}`} />
      </div>

      {/* Filter Content */}
      <div className={`p-4 pt-0 lg:p-6 lg:block ${isExpanded ? "block" : "hidden"}`}>
        
        {/* Top Header (Desktop) */}
        <div className="hidden lg:flex items-center justify-between mb-6 pb-4 border-b border-hairline">
          <h3 className="font-headline-md text-lg text-primary flex items-center gap-2">
            <SlidersHorizontal className="w-5 h-5" />
            Filter Lawyers
          </h3>
          {hasActiveFilters && (
            <button 
              onClick={onClear}
              className="text-sm font-medium text-brass hover:text-brass-hover transition-colors"
            >
              Clear all filters
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          
          {/* 1. Practice Area */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-primary">Practice Area</label>
            <select 
              value={filters.practiceArea}
              onChange={(e) => updateFilter("practiceArea", e.target.value)}
              className="w-full bg-surface-container border border-hairline rounded-lg px-3 py-2 text-sm text-primary editorial-select focus:ring-1 focus:ring-brass focus:border-brass"
            >
              <option value="all">All Practice Areas</option>
              {practiceAreas.map(pa => (
                <option key={pa.id} value={pa.id}>{pa.name}</option>
              ))}
            </select>
          </div>

          {/* 2. Specific Service */}
          <div className="space-y-2">
            <label className={`text-sm font-medium ${filters.practiceArea === "all" ? "text-outline" : "text-primary"}`}>
              Specific Service
            </label>
            <select 
              value={filters.serviceId}
              onChange={(e) => updateFilter("serviceId", e.target.value)}
              disabled={filters.practiceArea === "all"}
              className="w-full bg-surface-container border border-hairline rounded-lg px-3 py-2 text-sm text-primary editorial-select focus:ring-1 focus:ring-brass focus:border-brass disabled:opacity-50"
            >
              <option value="all">All Services</option>
              {availableServices.map(s => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </div>

          {/* 3. Jurisdiction / State */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-primary">Jurisdiction (State)</label>
            <select 
              value={filters.state}
              onChange={(e) => updateFilter("state", e.target.value)}
              className="w-full bg-surface-container border border-hairline rounded-lg px-3 py-2 text-sm text-primary editorial-select focus:ring-1 focus:ring-brass focus:border-brass"
            >
              <option value="all">All India</option>
              {INDIAN_STATES.map(s => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>

          {/* 4. Language */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-primary">Language Spoken</label>
            <select 
              value={filters.language}
              onChange={(e) => updateFilter("language", e.target.value)}
              className="w-full bg-surface-container border border-hairline rounded-lg px-3 py-2 text-sm text-primary editorial-select focus:ring-1 focus:ring-brass focus:border-brass"
            >
              <option value="all">Any Language</option>
              {SUPPORTED_LANGUAGES.map(lang => (
                <option key={lang} value={lang}>{lang}</option>
              ))}
            </select>
          </div>
          
          {/* 5. Experience Range */}
          <div className="space-y-4 col-span-1 md:col-span-2">
            <label className="text-sm font-medium text-primary flex justify-between">
              <span>Experience Level</span>
              <span className="text-outline">
                {filters.minExperience === 0 && filters.maxExperience >= 40 
                  ? "Any experience" 
                  : `${filters.minExperience} - ${filters.maxExperience}${filters.maxExperience >= 40 ? '+' : ''} years`}
              </span>
            </label>
            <div className="flex items-center gap-4">
              <input 
                type="range" 
                min="0" max="40" step="1"
                value={filters.minExperience}
                onChange={(e) => {
                  const val = parseInt(e.target.value);
                  if (val <= filters.maxExperience) updateFilter("minExperience", val);
                }}
                className="w-full accent-brass"
              />
              <input 
                type="range" 
                min="0" max="40" step="1"
                value={filters.maxExperience}
                onChange={(e) => {
                  const val = parseInt(e.target.value);
                  if (val >= filters.minExperience) updateFilter("maxExperience", val);
                }}
                className="w-full accent-brass"
              />
            </div>
          </div>

          {/* 6. Availability & Verification */}
          <div className="space-y-4 col-span-1 md:col-span-2 flex flex-col justify-end pb-1">
            <div className="flex flex-wrap gap-4">
              <label className="flex items-center gap-2 cursor-pointer group">
                <input 
                  type="checkbox" 
                  checked={filters.availability === "today"}
                  onChange={(e) => updateFilter("availability", e.target.checked ? "today" : "all")}
                  className="w-4 h-4 rounded border-hairline text-brass focus:ring-brass"
                />
                <span className="text-sm text-primary group-hover:text-brass transition-colors">Available Today</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer group">
                <input 
                  type="checkbox" 
                  checked={filters.verifiedOnly}
                  onChange={(e) => updateFilter("verifiedOnly", e.target.checked)}
                  className="w-4 h-4 rounded border-hairline text-brass focus:ring-brass"
                />
                <span className="text-sm text-primary group-hover:text-brass transition-colors">Verified Only</span>
              </label>
            </div>
          </div>

        </div>

        {/* Mobile Clear Button */}
        {hasActiveFilters && (
          <div className="mt-6 pt-4 border-t border-hairline lg:hidden">
            <button 
              onClick={onClear}
              className="w-full btn-editorial-secondary py-2 border border-outline-variant rounded text-sm font-medium bg-surface"
            >
              Clear all filters
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

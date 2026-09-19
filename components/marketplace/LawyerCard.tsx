"use client";

import Image from "next/image";
import Link from "next/link";
import { MarketplaceLawyerCard } from "@/types";
import { ShieldCheck, MapPin, Briefcase, Globe, ChevronRight } from "lucide-react";
import StarRating from "./StarRating";
import { getServiceById } from "@/lib/data/practice-areas";

interface LawyerCardProps {
  lawyer: MarketplaceLawyerCard;
  matchScore?: number;
}

export default function LawyerCard({ lawyer, matchScore }: LawyerCardProps) {
  return (
    <div className="bg-surface-lowest rounded-xl shadow-dossier hover:shadow-dossier-hover transition-all duration-300 flex flex-col h-full border border-hairline overflow-hidden group">
      
      {/* Optional AI Match Ribbon */}
      {matchScore && (
        <div className="bg-primary/5 border-b border-primary/10 px-4 py-2 flex items-center justify-between text-xs">
          <span className="font-semibold text-primary uppercase tracking-wider">AI Recommended</span>
          <span className="font-bold text-brass bg-brass/10 px-2 py-0.5 rounded-full">{matchScore}% Match</span>
        </div>
      )}

      <div className="p-6 flex-grow flex flex-col">
        {/* Header Section */}
        <div className="flex items-start gap-4 mb-4">
          <div className="relative w-16 h-16 rounded-full overflow-hidden flex-shrink-0 border-2 border-surface-container">
            <Image
              src={lawyer.avatar}
              alt={lawyer.name}
              fill
              className="object-cover"
              sizes="64px"
            />
          </div>
          <div>
            <div className="flex items-center gap-1.5 flex-wrap">
              <h3 className="font-headline-md text-primary text-xl leading-tight group-hover:text-brass transition-colors">
                {lawyer.name}
              </h3>
              {lawyer.isVerified && (
                <span title="Verified by Advocato">
                  <ShieldCheck className="w-4 h-4 text-brass" />
                </span>
              )}
            </div>
            <p className="text-sm text-outline mt-0.5 font-medium">{lawyer.title}</p>
            {lawyer.headline && (
              <p className="text-sm text-outline-variant mt-1 line-clamp-2 leading-relaxed">
                {lawyer.headline}
              </p>
            )}
          </div>
        </div>

        {/* Rating and Availability */}
        <div className="flex items-center justify-between py-3 border-y border-hairline mb-4">
          <StarRating ratingSummary={lawyer.ratingSummary} />
          <div className="flex items-center gap-1.5 text-xs font-medium">
            <span className={`w-2 h-2 rounded-full ${lawyer.availability === 'Available today' ? 'bg-green-500' : lawyer.availability === 'This week' ? 'bg-amber-500' : 'bg-outline'}`}></span>
            <span className="text-outline">{lawyer.availability}</span>
          </div>
        </div>

        {/* Key Info Points */}
        <div className="space-y-2 mb-4 flex-grow">
          <div className="flex items-start gap-2 text-sm text-outline">
            <Briefcase className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <span>{lawyer.yearsExperience} years experience</span>
          </div>
          
          <div className="flex items-start gap-2 text-sm text-outline">
            <MapPin className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <span className="line-clamp-1">{lawyer.city ? `${lawyer.city}, ${lawyer.state}` : lawyer.jurisdiction}</span>
          </div>

          {lawyer.languages && lawyer.languages.length > 0 && (
            <div className="flex items-start gap-2 text-sm text-outline">
              <Globe className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <span className="line-clamp-1">{lawyer.languages.join(", ")}</span>
            </div>
          )}
        </div>

        {/* Services Tags (Max 2) */}
        {lawyer.primaryServices && lawyer.primaryServices.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-5">
            {lawyer.primaryServices.slice(0, 2).map((serviceId) => {
              const service = getServiceById(serviceId);
              return service ? (
                <span key={service.id} className="bg-surface-container px-2.5 py-1 rounded text-xs font-medium text-primary">
                  {service.name}
                </span>
              ) : null;
            })}
            {lawyer.primaryServices.length > 2 && (
              <span className="bg-surface-container px-2.5 py-1 rounded text-xs font-medium text-outline">
                +{lawyer.primaryServices.length - 2} more
              </span>
            )}
          </div>
        )}

        {/* Actions */}
        <div className="mt-auto grid grid-cols-2 gap-3 pt-4 border-t border-hairline">
          <Link 
            href={`/lawyers/${lawyer.id}`} 
            className="btn-editorial-secondary bg-surface py-2 rounded text-sm font-medium border border-outline-variant hover:bg-surface-container"
          >
            View Profile
          </Link>
          <Link 
            href={`/lawyers/${lawyer.id}?action=book`} 
            className="btn-editorial bg-primary text-white py-2 rounded text-sm font-medium hover:bg-primary-fixed-variant"
          >
            Contact
          </Link>
        </div>
      </div>
    </div>
  );
}

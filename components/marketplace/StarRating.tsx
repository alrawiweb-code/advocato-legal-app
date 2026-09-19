"use client";

import { Star, StarHalf } from "lucide-react";
import { RatingSummary } from "@/types";

interface StarRatingProps {
  ratingSummary: RatingSummary;
  size?: "sm" | "md" | "lg";
  showCount?: boolean;
  className?: string;
}

export default function StarRating({
  ratingSummary,
  size = "md",
  showCount = true,
  className = "",
}: StarRatingProps) {
  const { averageRating, reviewCount, verifiedReviewCount } = ratingSummary;

  const sizeClass = {
    sm: "w-3 h-3",
    md: "w-4 h-4",
    lg: "w-5 h-5",
  }[size];

  const textClass = {
    sm: "text-xs",
    md: "text-sm",
    lg: "text-base",
  }[size];

  if (averageRating === null || reviewCount === 0) {
    return (
      <div className={`flex items-center gap-1.5 text-outline ${className}`}>
        <Star className={`${sizeClass} text-outline-variant`} />
        <span className={`${textClass} font-medium`}>New</span>
        {showCount && <span className="text-xs text-outline-variant">(No reviews yet)</span>}
      </div>
    );
  }

  const fullStars = Math.floor(averageRating);
  const hasHalfStar = averageRating - fullStars >= 0.5;

  return (
    <div className={`flex items-center gap-1.5 ${className}`}>
      <div className="flex">
        {[...Array(5)].map((_, i) => {
          if (i < fullStars) {
            return <Star key={i} className={`${sizeClass} text-brass fill-brass`} />;
          }
          if (i === fullStars && hasHalfStar) {
            return (
              <div key={i} className="relative">
                <Star className={`${sizeClass} text-brass`} />
                <div className="absolute inset-0 overflow-hidden w-[50%]">
                  <Star className={`${sizeClass} text-brass fill-brass`} />
                </div>
              </div>
            );
          }
          return <Star key={i} className={`${sizeClass} text-outline-variant`} />;
        })}
      </div>
      <span className={`${textClass} font-medium text-primary`}>
        {averageRating.toFixed(1)}
      </span>
      {showCount && (
        <span className={`text-xs text-outline ${textClass === "text-base" ? "ml-1" : ""}`}>
          ({reviewCount} {reviewCount === 1 ? "review" : "reviews"})
        </span>
      )}
    </div>
  );
}

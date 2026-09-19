"use client";

import { LawyerReview } from "@/types";
import { formatDistanceToNow } from "date-fns";
import { Star, ShieldCheck, MessageSquare } from "lucide-react";

interface ReviewsListProps {
  reviews: LawyerReview[];
  isLoading?: boolean;
}

export default function ReviewsList({ reviews, isLoading = false }: ReviewsListProps) {
  if (isLoading) {
    return (
      <div className="space-y-6">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="animate-pulse bg-surface-container rounded-xl h-32 w-full"></div>
        ))}
      </div>
    );
  }

  if (reviews.length === 0) {
    return (
      <div className="text-center py-12 px-4 border border-dashed border-hairline rounded-xl bg-surface">
        <div className="w-12 h-12 bg-surface-container rounded-full flex items-center justify-center mx-auto mb-4">
          <MessageSquare className="w-5 h-5 text-outline" />
        </div>
        <h4 className="font-headline-md text-primary text-lg mb-1">No Reviews Yet</h4>
        <p className="text-sm text-outline max-w-md mx-auto">
          This lawyer is new to the Advocato marketplace or hasn't received any verified client reviews yet.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {reviews.map((review) => (
        <div key={review.id} className="pb-6 border-b border-hairline last:border-0 last:pb-0">
          <div className="flex items-start justify-between mb-3">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <h4 className="font-medium text-primary">{review.reviewerName}</h4>
                {review.verificationStatus === "VERIFIED" && (
                  <span className="flex items-center gap-1 text-[10px] font-bold tracking-wider uppercase text-brass bg-brass/10 px-1.5 py-0.5 rounded">
                    <ShieldCheck className="w-3 h-3" />
                    Verified Client
                  </span>
                )}
              </div>
              <p className="text-xs text-outline">
                {formatDistanceToNow(new Date(review.createdAt), { addSuffix: true })}
              </p>
            </div>
            
            <div className="flex">
              {[...Array(5)].map((_, i) => (
                <Star 
                  key={i} 
                  className={`w-4 h-4 ${i < review.rating ? "text-brass fill-brass" : "text-outline-variant"}`} 
                />
              ))}
            </div>
          </div>
          
          {review.reviewText && (
            <p className="text-sm text-on-surface-variant leading-relaxed">
              "{review.reviewText}"
            </p>
          )}
        </div>
      ))}
    </div>
  );
}

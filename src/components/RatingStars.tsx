"use client";

import { useState } from "react";
import { Star } from "lucide-react";

interface RatingStarsProps {
  rating: number;
  onChange?: (rating: number) => void;
  editable?: boolean;
  size?: number;
}

export default function RatingStars({
  rating,
  onChange,
  editable = false,
  size = 16,
}: RatingStarsProps) {
  const [hoverRating, setHoverRating] = useState<number | null>(null);
  const currentRating = hoverRating !== null ? hoverRating : rating;

  return (
    <div style={{ display: "inline-flex", alignItems: "center", gap: "0.15rem" }}>
      {[1, 2, 3, 4, 5].map((starIdx) => {
        const leftVal = starIdx - 0.5;
        const rightVal = starIdx;

        return (
          <div
            key={starIdx}
            style={{
              position: "relative",
              display: "inline-block",
              width: `${size}px`,
              height: `${size}px`,
            }}
          >
            {/* Empty Background Star */}
            <Star
              size={size}
              color="#cbd5e1"
              fill="#cbd5e1"
              style={{ position: "absolute", top: 0, left: 0 }}
            />

            {/* Filled Gold Star Overlay */}
            {currentRating >= leftVal && (
              <div
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  width: currentRating >= rightVal ? "100%" : "50%",
                  overflow: "hidden",
                }}
              >
                <Star size={size} color="#fbbf24" fill="#fbbf24" />
              </div>
            )}

            {/* Clickable Overlay splits for Half Stars */}
            {editable && onChange && (
              <div
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  width: "100%",
                  height: "100%",
                  display: "flex",
                  zIndex: 10,
                }}
              >
                <div
                  onClick={() => onChange(leftVal)}
                  onMouseEnter={() => setHoverRating(leftVal)}
                  onMouseLeave={() => setHoverRating(null)}
                  style={{ width: "50%", height: "100%", cursor: "pointer" }}
                  title={`${leftVal} ดาว`}
                />
                <div
                  onClick={() => onChange(rightVal)}
                  onMouseEnter={() => setHoverRating(rightVal)}
                  onMouseLeave={() => setHoverRating(null)}
                  style={{ width: "50%", height: "100%", cursor: "pointer" }}
                  title={`${rightVal} ดาว`}
                />
              </div>
            )}
          </div>
        );
      })}
      {editable && (
        <span style={{ marginLeft: "0.5rem", fontSize: "0.875rem", fontWeight: 700, color: "#475569" }}>
          {rating.toFixed(1)} / 5.0
        </span>
      )}
    </div>
  );
}

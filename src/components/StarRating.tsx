import React from 'react'
import { Star } from 'lucide-react'

interface StarRatingProps {
  rating: number
  onRatingChange?: (rating: number) => void
  readonly?: boolean
  size?: number
}

export const StarRating = ({ rating, onRatingChange, readonly = false, size = 20 }: StarRatingProps) => {
  const stars = Array.from({ length: 5 }, (_, index) => index + 1)

  return (
    <div className="flex items-center space-x-1">
      {stars.map((star) => (
        <button
          key={star}
          type="button"
          onClick={() => !readonly && onRatingChange?.(star)}
          disabled={readonly}
          className={`transition-colors duration-200 ${
            readonly ? 'cursor-default' : 'cursor-pointer hover:scale-110'
          }`}
        >
          <Star
            size={size}
            className={`${
              star <= rating
                ? 'text-yellow-400 fill-current'
                : 'text-gray-300'
            } transition-all duration-200`}
          />
        </button>
      ))}
    </div>
  )
}
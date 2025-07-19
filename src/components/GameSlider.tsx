import React, { useRef, useEffect, useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { GameCard } from './GameCard'
import type { Database } from '../lib/supabase'

type Game = Database['public']['Tables']['games']['Row'] & {
  averageRating?: number
  reviewCount?: number
  isFavorite?: boolean
}

interface GameSliderProps {
  title: string
  games: Game[]
  onGameClick?: (game: Game) => void
  onFavoriteToggle?: (gameId: string) => void
}

export const GameSlider = ({ title, games, onGameClick, onFavoriteToggle }: GameSliderProps) => {
  const sliderRef = useRef<HTMLDivElement>(null)
  const [canScrollLeft, setCanScrollLeft] = useState(false)
  const [canScrollRight, setCanScrollRight] = useState(true)

  const scroll = (direction: 'left' | 'right') => {
    if (sliderRef.current) {
      const scrollAmount = 320 // Width of one card + gap
      const newScrollLeft = direction === 'left' 
        ? sliderRef.current.scrollLeft - scrollAmount
        : sliderRef.current.scrollLeft + scrollAmount
      
      sliderRef.current.scrollTo({
        left: newScrollLeft,
        behavior: 'smooth'
      })
    }
  }

  const updateScrollButtons = () => {
    if (sliderRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = sliderRef.current
      setCanScrollLeft(scrollLeft > 0)
      setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10)
    }
  }

  useEffect(() => {
    updateScrollButtons()
    const slider = sliderRef.current
    if (slider) {
      slider.addEventListener('scroll', updateScrollButtons)
      return () => slider.removeEventListener('scroll', updateScrollButtons)
    }
  }, [games])

  if (games.length === 0) return null

  return (
    <div className="mb-12">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{title}</h2>
        <div className="flex space-x-2">
          <button
            onClick={() => scroll('left')}
            disabled={!canScrollLeft}
            className={`p-2 rounded-full transition-all duration-200 ${
              canScrollLeft
                ? 'bg-white/80 dark:bg-gray-700/80 backdrop-blur-sm text-gray-700 dark:text-gray-200 hover:bg-purple-100 dark:hover:bg-purple-800'
                : 'bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-600 cursor-not-allowed'
            }`}
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            onClick={() => scroll('right')}
            disabled={!canScrollRight}
            className={`p-2 rounded-full transition-all duration-200 ${
              canScrollRight
                ? 'bg-white/80 dark:bg-gray-700/80 backdrop-blur-sm text-gray-700 dark:text-gray-200 hover:bg-purple-100 dark:hover:bg-purple-800'
                : 'bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-600 cursor-not-allowed'
            }`}
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>
      
      <div
        ref={sliderRef}
        className="flex space-x-6 overflow-x-auto scrollbar-hide pb-4"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {games.map((game) => (
          <div key={game.id} className="flex-shrink-0 w-80">
            <GameCard
              game={game}
              onClick={() => onGameClick?.(game)}
              onFavoriteToggle={onFavoriteToggle}
            />
          </div>
        ))}
      </div>
    </div>
  )
}
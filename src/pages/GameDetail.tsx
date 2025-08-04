import React, { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { ArrowLeft, Download, Heart, Monitor, Smartphone, Trash2, Reply, ChevronDown, ChevronUp, Ban, ThumbsUp, ThumbsDown } from 'lucide-react'
import { StarRating } from '../components/StarRating'
import { ImageViewer } from '../components/ImageViewer'
import { UserProfileModal } from '../components/UserProfileModal'
import { useAuth } from '../hooks/useAuth'
import { useNotifications } from '../hooks/useNotifications'
import { supabase } from '../lib/supabase'
import type { Database } from '../lib/database'

type Game = Database['public']['Tables']['games']['Row']
type Review = Database['public']['Tables']['reviews']['Row'] & {
  user: Database['public']['Tables']['users']['Row']
  replies?: ReviewReply[]
  likesCount?: number
  dislikesCount?: number
  userReaction?: 'like' | 'dislike' | null
}
type ReviewReply = Database['public']['Tables']['review_replies']['Row'] & {
  user: Database['public']['Tables']['users']['Row']
}

interface GameDetailProps {
  game: Game
  onBack: () => void
}

export const GameDetail = ({ game, onBack }: GameDetailProps) => {
  const { t, i18n } = useTranslation()
  const { user, isAdmin, isRestricted } = useAuth()
  const { addNotification } = useNotifications(user)
  const [screenshots, setScreenshots] = useState<string[]>([])
  const [reviews, setReviews] = useState<Review[]>([])
  const [userReview, setUserReview] = useState<Review | null>(null)
  const [isFavorite, setIsFavorite] = useState(false)
  const [showReviewForm, setShowReviewForm] = useState(false)
  const [reviewRating, setReviewRating] = useState(5)
  const [reviewComment, setReviewComment] = useState('')
  const [loading, setLoading] = useState(true)
  const [deletingReviewId, setDeletingReviewId] = useState<string | null>(null)
  const [deletingReplyId, setDeletingReplyId] = useState<string | null>(null)
  const [imageViewerOpen, setImageViewerOpen] = useState(false)
  const [selectedImageIndex, setSelectedImageIndex] = useState(0)
  
  // User profile modal states
  const [selectedUser, setSelectedUser] = useState<Database['public']['Tables']['users']['Row'] | null>(null)
  const [showUserProfile, setShowUserProfile] = useState(false)
  
  // Reply states
  const [replyingToReview, setReplyingToReview] = useState<string | null>(null)
  const [replyComment, setReplyComment] = useState('')
  const [expandedReplies, setExpandedReplies] = useState<Set<string>>(new Set())

  useEffect(() => {
    fetchGameData()
  }, [game.id, user?.id])

  const fetchGameData = async () => {
    try {
      // Fetch screenshots
      const { data: screenshotData } = await supabase
        .from('screenshots')
        .select('image_url')
        .eq('game_id', game.id)
        .order('order_index')

      if (screenshotData) {
        setScreenshots(screenshotData.map(s => s.image_url))
      }

      // Fetch reviews with replies and reactions
      const { data: reviewData } = await supabase
        .from('reviews')
        .select(`
          *,
          user:users(*)
        `)
        .eq('game_id', game.id)
        .order('created_at', { ascending: false })

      if (reviewData) {
        // Fetch replies and reactions for each review
        const reviewsWithExtras = await Promise.all(
          reviewData.map(async (review) => {
            // Fetch replies
            const { data: repliesData } = await supabase
              .from('review_replies')
              .select(`
                *,
                user:users(*)
              `)
              .eq('review_id', review.id)
              .order('created_at', { ascending: true })

            // Fetch reaction counts
            const { data: reactionsData } = await supabase
              .from('review_reactions')
              .select('reaction_type')
              .eq('review_id', review.id)

            const likesCount = reactionsData?.filter(r => r.reaction_type === 'like').length || 0
            const dislikesCount = reactionsData?.filter(r => r.reaction_type === 'dislike').length || 0

            // Fetch user's reaction if logged in
            let userReaction = null
            if (user) {
              const { data: userReactionData } = await supabase
                .from('review_reactions')
                .select('reaction_type')
                .eq('review_id', review.id)
                .eq('user_id', user.id)
                .maybeSingle()
              
              userReaction = userReactionData?.reaction_type || null
            }

            return {
              ...review,
              replies: repliesData || [],
              likesCount,
              dislikesCount,
              userReaction
            } as Review
          })
        )

        setReviews(reviewsWithExtras)
        if (user) {
          const currentUserReview = reviewsWithExtras.find(r => r.user_id === user.id)
          if (currentUserReview) {
            setUserReview(currentUserReview)
            setReviewRating(currentUserReview.rating)
            setReviewComment(currentUserReview.comment || '')
          }
        }
      }

      // Check if favorite
      if (user) {
        const { data: favoriteData } = await supabase
          .from('favorites')
          .select('id')
          .eq('user_id', user.id)
          .eq('game_id', game.id)
          .maybeSingle()

        setIsFavorite(!!favoriteData)
      }
    } catch (error) {
      console.error('Error fetching game data:', error)
    } finally {
      setLoading(false)
    }
  }

  const toggleFavorite = async () => {
    if (!user || isRestricted) return

    try {
      if (isFavorite) {
        await supabase
          .from('favorites')
          .delete()
          .eq('user_id', user.id)
          .eq('game_id', game.id)
      } else {
        await supabase
          .from('favorites')
          .insert({
            user_id: user.id,
            game_id: game.id
          })
      }
      setIsFavorite(!isFavorite)
    } catch (error) {
      console.error('Error toggling favorite:', error)
    }
  }

  const handleReaction = async (reviewId: string, reactionType: 'like' | 'dislike') => {
    if (!user || isRestricted) return

    try {
      const review = reviews.find(r => r.id === reviewId)
      if (!review) return

      // If user already has this reaction, remove it
      if (review.userReaction === reactionType) {
        await supabase
          .from('review_reactions')
          .delete()
          .eq('review_id', reviewId)
          .eq('user_id', user.id)
      } else {
        // Insert or update reaction
        await supabase
          .from('review_reactions')
          .upsert({
            review_id: reviewId,
            user_id: user.id,
            reaction_type: reactionType
          })
      }

      // Refresh reviews to update counts and user reaction
      fetchGameData()
    } catch (error) {
      console.error('Error handling reaction:', error)
    }
  }

  const handleDownload = () => {
    // Use the specific download link for this game, or fallback to default
    const downloadUrl = game.download_link || 'https://t.me/hentgamefile/'
    // Open the URL directly without any domain prefix
    window.open(downloadUrl, '_blank')
  }

  const handleImageClick = (index: number) => {
    setSelectedImageIndex(index)
    setImageViewerOpen(true)
  }

  const handleUserClick = (clickedUser: Database['public']['Tables']['users']['Row']) => {
    setSelectedUser(clickedUser)
    setShowUserProfile(true)
  }

  const submitReview = async () => {
    if (!user || isRestricted) return

    try {
      if (userReview) {
        // Update existing review
        await supabase
          .from('reviews')
          .update({
            rating: reviewRating,
            comment: reviewComment
          })
          .eq('id', userReview.id)
      } else {
        // Create new review
        await supabase
          .from('reviews')
          .insert({
            user_id: user.id,
            game_id: game.id,
            rating: reviewRating,
            comment: reviewComment
          })

        // Add notification for review submission
        addNotification({
          type: 'review_submitted',
          title: t('notifications.reviewSubmitted'),
          message: t('notifications.reviewSubmittedMessage', { gameTitle: game.title }),
          gameTitle: game.title
        })
      }
      
      setShowReviewForm(false)
      fetchGameData() // Refresh reviews
    } catch (error) {
      console.error('Error submitting review:', error)
    }
  }

  const deleteReview = async () => {
    if (!userReview) return

    try {
      await supabase
        .from('reviews')
        .delete()
        .eq('id', userReview.id)
      
      setUserReview(null)
      setReviewRating(5)
      setReviewComment('')
      fetchGameData() // Refresh reviews
    } catch (error) {
      console.error('Error deleting review:', error)
    }
  }

  const deleteAnyReview = async (reviewId: string) => {
    if (!isAdmin) return

    const confirmed = confirm('Are you sure you want to delete this review? This action cannot be undone.')
    if (!confirmed) return

    try {
      setDeletingReviewId(reviewId)
      await supabase
        .from('reviews')
        .delete()
        .eq('id', reviewId)
      
      // If the deleted review was the current user's review, reset the form
      if (userReview && userReview.id === reviewId) {
        setUserReview(null)
        setReviewRating(5)
        setReviewComment('')
      }
      
      fetchGameData() // Refresh reviews
    } catch (error) {
      console.error('Error deleting review:', error)
    } finally {
      setDeletingReviewId(null)
    }
  }

  const submitReply = async (reviewId: string) => {
    if (!user || !replyComment.trim() || isRestricted) return

    try {
      // Get the review to find the original reviewer
      const review = reviews.find(r => r.id === reviewId)
      
      await supabase
        .from('review_replies')
        .insert({
          review_id: reviewId,
          user_id: user.id,
          comment: replyComment.trim()
        })

      // Add notification for the original reviewer if it's not the same user
      if (review && review.user_id !== user.id) {
        // Create notification for the original reviewer
        await supabase
          .from('notifications')
          .insert({
            user_id: review.user_id,
            type: 'reply_received',
            title: t('notifications.replyReceived'),
            message: t('notifications.replyReceivedMessage', { 
              fromUser: user.first_name,
              gameTitle: game.title 
            }),
            game_title: game.title,
            from_user: user.first_name
          })
      }

      setReplyComment('')
      setReplyingToReview(null)
      fetchGameData() // Refresh reviews with replies
    } catch (error) {
      console.error('Error submitting reply:', error)
    }
  }

  const deleteReply = async (replyId: string) => {
    if (!user) return

    const confirmed = confirm(t('games.deleteReply') + '?')
    if (!confirmed) return

    try {
      setDeletingReplyId(replyId)
      await supabase
        .from('review_replies')
        .delete()
        .eq('id', replyId)
        .eq('user_id', user.id) // Ensure user can only delete their own replies
      
      fetchGameData() // Refresh reviews with replies
    } catch (error) {
      console.error('Error deleting reply:', error)
    } finally {
      setDeletingReplyId(null)
    }
  }

  const deleteAnyReply = async (replyId: string) => {
    if (!isAdmin) return

    const confirmed = confirm('Are you sure you want to delete this reply? This action cannot be undone.')
    if (!confirmed) return

    try {
      setDeletingReplyId(replyId)
      await supabase
        .from('review_replies')
        .delete()
        .eq('id', replyId)
      
      fetchGameData() // Refresh reviews with replies
    } catch (error) {
      console.error('Error deleting reply:', error)
    } finally {
      setDeletingReplyId(null)
    }
  }

  const toggleReplies = (reviewId: string) => {
    const newExpanded = new Set(expandedReplies)
    if (newExpanded.has(reviewId)) {
      newExpanded.delete(reviewId)
    } else {
      newExpanded.add(reviewId)
    }
    setExpandedReplies(newExpanded)
  }

  const averageRating = reviews.length > 0 
    ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length
    : 0

  const allImages = [game.cover_url, ...screenshots].filter(Boolean)

  const getDescription = () => {
    return i18n.language === 'ru' ? game.description_ru : game.description_en
  }

  const getPlatforms = () => {
    return game.platforms?.length > 0 ? game.platforms : [game.platform]
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500"></div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <button
          onClick={onBack}
          className="flex items-center space-x-2 text-gray-600 dark:text-gray-400 hover:text-purple-700 dark:hover:text-purple-300 transition-colors duration-200"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>{t('common.back')}</span>
        </button>
        
        <div className="flex items-center space-x-4">
          <button
            onClick={toggleFavorite}
            disabled={isRestricted}
            className={`p-2 rounded-full transition-all duration-200 ${
              isRestricted
                ? 'text-gray-400 cursor-not-allowed opacity-50'
                : isFavorite
                ? 'text-pink-500 bg-pink-50 dark:bg-pink-900/20'
                : 'text-gray-500 hover:text-pink-500 hover:bg-pink-50 dark:hover:bg-pink-900/20'
            }`}
            title={isRestricted ? t('common.restrictedAction') : undefined}
          >
            <Heart className={`w-6 h-6 ${isFavorite ? 'fill-current' : ''}`} />
          </button>
        </div>
      </div>

      {/* Restriction Notice */}
      {isRestricted && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4 mb-8">
          <div className="flex items-center space-x-2">
            <Ban className="w-5 h-5 text-red-600 dark:text-red-400" />
            <p className="text-red-800 dark:text-red-200 font-medium">
              Your account has restricted access. You cannot add favorites, write reviews, or reply to comments.
            </p>
          </div>
        </div>
      )}

      {/* Game Info */}
      <div className="grid md:grid-cols-3 gap-8 mb-12">
        <div className="md:col-span-1">
          <img
            src={game.cover_url || 'https://images.pexels.com/photos/442576/pexels-photo-442576.jpeg?auto=compress&cs=tinysrgb&w=400&h=600&fit=crop'}
            alt={game.title}
            className="w-full rounded-2xl shadow-lg cursor-pointer hover:shadow-xl transition-shadow duration-200"
            onClick={() => handleImageClick(0)}
          />
        </div>
        
        <div className="md:col-span-2">
          <div className="flex items-center space-x-3 mb-4 flex-wrap gap-2">
            {getPlatforms().map((platform, index) => (
              <div key={index} className="flex items-center space-x-2">
                {platform === 'Android' ? (
                  <Smartphone className="w-6 h-6 text-green-500" />
                ) : (
                  <Monitor className="w-6 h-6 text-blue-500" />
                )}
                <span className="text-lg font-medium text-gray-700 dark:text-gray-300">{platform}</span>
              </div>
            ))}
          </div>
          
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">{game.title}</h1>
          
          <div className="flex items-center space-x-6 mb-6">
            <div className="flex items-center space-x-2">
              <StarRating rating={Math.round(averageRating)} readonly />
              <span className="text-lg font-medium text-gray-700 dark:text-gray-300">
                {averageRating.toFixed(1)}
              </span>
              <span className="text-gray-500 dark:text-gray-400">({reviews.length} reviews)</span>
            </div>
          </div>
          
          <div className="flex flex-wrap gap-2 mb-6">
            {game.genres.map((genre, index) => (
              <span
                key={index}
                className="px-3 py-1 bg-purple-100 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300 rounded-full text-sm font-medium"
              >
                {genre}
              </span>
            ))}
          </div>
          
          <button
            onClick={handleDownload}
            className="inline-flex items-center space-x-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white px-8 py-3 rounded-xl font-semibold hover:shadow-lg transition-all duration-200 hover:scale-105"
          >
            <Download className="w-5 h-5" />
            <span>{t('games.download')}</span>
          </button>
        </div>
      </div>

      {/* Screenshots */}
      {screenshots.length > 0 && (
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">{t('games.screenshots')}</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {screenshots.map((image, index) => (
              <img
                key={index}
                src={image}
                alt={`Screenshot ${index + 1}`}
                className="w-full h-48 object-cover rounded-xl shadow-md hover:shadow-lg transition-all duration-200 cursor-pointer hover:scale-105"
                onClick={() => handleImageClick(index + 1)} // +1 because cover is at index 0
              />
            ))}
          </div>
        </div>
      )}

      {/* Description */}
      <div className="mb-12">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">{t('games.description')}</h2>
        <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl border border-purple-100 dark:border-gray-700 p-6">
          <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
            {getDescription() || 'No description available for this game.'}
          </p>
        </div>
      </div>

      {/* Reviews */}
      <div>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{t('games.reviews')}</h2>
          {user && !isRestricted && (
            <button
              onClick={() => setShowReviewForm(!showReviewForm)}
              className="px-4 py-2 bg-purple-500 text-white rounded-xl hover:bg-purple-600 transition-colors duration-200"
            >
              {userReview ? t('games.editReview') : t('games.writeReview')}
            </button>
          )}
        </div>

        {/* Review Form */}
        {showReviewForm && user && !isRestricted && (
          <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl border border-purple-100 dark:border-gray-700 p-6 mb-6">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {t('games.rating')}
                </label>
                <StarRating
                  rating={reviewRating}
                  onRatingChange={setReviewRating}
                  size={24}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {t('games.comment')}
                </label>
                <textarea
                  value={reviewComment}
                  onChange={(e) => setReviewComment(e.target.value)}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                  placeholder="Share your thoughts about this game..."
                />
              </div>
              
              <div className="flex space-x-3">
                <button
                  onClick={submitReview}
                  className="px-6 py-2 bg-purple-500 text-white rounded-xl hover:bg-purple-600 transition-colors duration-200"
                >
                  {t('games.submitReview')}
                </button>
                <button
                  onClick={() => setShowReviewForm(false)}
                  className="px-6 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200"
                >
                  {t('admin.cancel')}
                </button>
                {userReview && (
                  <button
                    onClick={deleteReview}
                    className="px-6 py-2 bg-red-500 text-white rounded-xl hover:bg-red-600 transition-colors duration-200"
                  >
                    {t('games.deleteReview')}
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Reviews List */}
        <div className="space-y-6">
          {reviews.map((review) => (
            <div key={review.id} className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl border border-purple-100 dark:border-gray-700 p-6">
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-4 flex-1">
                  <button
                    onClick={() => handleUserClick(review.user)}
                    className="flex-shrink-0 hover:opacity-80 transition-opacity duration-200"
                  >
                    <img
                      src={review.user.avatar_url || `https://ui-avatars.com/api/?name=${review.user.first_name}&background=8B5CF6&color=fff`}
                      alt={review.user.first_name}
                      className="w-12 h-12 rounded-full border-2 border-purple-200 dark:border-purple-600"
                    />
                  </button>
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <button
                        onClick={() => handleUserClick(review.user)}
                        className="font-semibold text-gray-900 dark:text-white hover:text-purple-600 dark:hover:text-purple-400 transition-colors duration-200"
                      >
                        {review.user.first_name} {review.user.last_name}
                      </button>
                      <StarRating rating={review.rating} readonly size={16} />
                      <span className="text-sm text-gray-500 dark:text-gray-400">
                        {new Date(review.created_at).toLocaleDateString()}
                      </span>
                    </div>
                    {review.comment && (
                      <p className="text-gray-700 dark:text-gray-300 mb-3">{review.comment}</p>
                    )}
                    
                    {/* Action buttons row */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        {/* Reply button */}
                        {user && user.id !== review.user_id && !isRestricted && (
                          <button
                            onClick={() => setReplyingToReview(replyingToReview === review.id ? null : review.id)}
                            className="flex items-center space-x-1 text-sm text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 transition-colors duration-200"
                          >
                            <Reply className="w-4 h-4" />
                            <span>{t('games.reply')}</span>
                          </button>
                        )}
                      </div>

                      {/* Like/Dislike buttons */}
                      {user && !isRestricted && (
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => handleReaction(review.id, 'like')}
                            className={`flex items-center space-x-1 px-3 py-1 rounded-lg text-sm transition-all duration-200 ${
                              review.userReaction === 'like'
                                ? 'bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-300'
                                : 'text-gray-500 dark:text-gray-400 hover:bg-green-50 dark:hover:bg-green-900/10 hover:text-green-600 dark:hover:text-green-400'
                            }`}
                          >
                            <ThumbsUp className="w-4 h-4" />
                            <span>{review.likesCount || 0}</span>
                          </button>
                          <button
                            onClick={() => handleReaction(review.id, 'dislike')}
                            className={`flex items-center space-x-1 px-3 py-1 rounded-lg text-sm transition-all duration-200 ${
                              review.userReaction === 'dislike'
                                ? 'bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-300'
                                : 'text-gray-500 dark:text-gray-400 hover:bg-red-50 dark:hover:bg-red-900/10 hover:text-red-600 dark:hover:text-red-400'
                            }`}
                          >
                            <ThumbsDown className="w-4 h-4" />
                            <span>{review.dislikesCount || 0}</span>
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Reply form */}
                    {replyingToReview === review.id && !isRestricted && (
                      <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
                        <div className="flex items-center space-x-2 mb-2">
                          <Reply className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                            {t('games.replyTo')} {review.user.first_name}
                          </span>
                        </div>
                        <textarea
                          value={replyComment}
                          onChange={(e) => setReplyComment(e.target.value)}
                          rows={3}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm placeholder-gray-500 dark:placeholder-gray-400"
                          placeholder={t('games.writeReply')}
                        />
                        <div className="flex space-x-2 mt-3">
                          <button
                            onClick={() => submitReply(review.id)}
                            disabled={!replyComment.trim()}
                            className="px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors duration-200 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {t('games.submitReply')}
                          </button>
                          <button
                            onClick={() => {
                              setReplyingToReview(null)
                              setReplyComment('')
                            }}
                            className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200 text-sm"
                          >
                            {t('admin.cancel')}
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Replies */}
                    {review.replies && review.replies.length > 0 && (
                      <div className="mt-4">
                        <button
                          onClick={() => toggleReplies(review.id)}
                          className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors duration-200"
                        >
                          {expandedReplies.has(review.id) ? (
                            <ChevronUp className="w-4 h-4" />
                          ) : (
                            <ChevronDown className="w-4 h-4" />
                          )}
                          <span>
                            {expandedReplies.has(review.id) 
                              ? t('games.hideReplies') 
                              : `${t('games.showReplies')} (${review.replies.length})`
                            }
                          </span>
                        </button>

                        {expandedReplies.has(review.id) && (
                          <div className="mt-3 space-y-3 pl-4 border-l-2 border-purple-200 dark:border-purple-700">
                            {review.replies.map((reply) => (
                              <div key={reply.id} className="flex items-start space-x-3">
                                <button
                                  onClick={() => handleUserClick(reply.user)}
                                  className="flex-shrink-0 hover:opacity-80 transition-opacity duration-200"
                                >
                                  <img
                                    src={reply.user.avatar_url || `https://ui-avatars.com/api/?name=${reply.user.first_name}&background=8B5CF6&color=fff`}
                                    alt={reply.user.first_name}
                                    className="w-8 h-8 rounded-full border border-purple-200 dark:border-purple-600"
                                  />
                                </button>
                                <div className="flex-1">
                                  <div className="flex items-center space-x-2 mb-1">
                                    <button
                                      onClick={() => handleUserClick(reply.user)}
                                      className="font-medium text-sm text-gray-900 dark:text-white hover:text-purple-600 dark:hover:text-purple-400 transition-colors duration-200"
                                    >
                                      {reply.user.first_name} {reply.user.last_name}
                                    </button>
                                    <span className="text-xs text-gray-500 dark:text-gray-400">
                                      {new Date(reply.created_at).toLocaleDateString()}
                                    </span>
                                  </div>
                                  <p className="text-sm text-gray-700 dark:text-gray-300">{reply.comment}</p>
                                </div>
                                
                                {/* Delete reply button for own replies or admin */}
                                {user && (user.id === reply.user_id || isAdmin) && (
                                  <button
                                    onClick={() => user.id === reply.user_id ? deleteReply(reply.id) : deleteAnyReply(reply.id)}
                                    disabled={deletingReplyId === reply.id}
                                    className="p-1 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed group"
                                    title={user.id === reply.user_id ? t('games.deleteReply') : 'Delete reply (Admin only)'}
                                  >
                                    {deletingReplyId === reply.id ? (
                                      <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-red-500"></div>
                                    ) : (
                                      <Trash2 className="w-3 h-3 group-hover:scale-110 transition-transform duration-200" />
                                    )}
                                  </button>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
                
                {/* Admin Delete Button */}
                {isAdmin && (
                  <button
                    onClick={() => deleteAnyReview(review.id)}
                    disabled={deletingReviewId === review.id}
                    className="ml-4 p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed group"
                    title="Delete review (Admin only)"
                  >
                    {deletingReviewId === review.id ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-500"></div>
                    ) : (
                      <Trash2 className="w-4 h-4 group-hover:scale-110 transition-transform duration-200" />
                    )}
                  </button>
                )}
              </div>
            </div>
          ))}
          
          {reviews.length === 0 && (
            <div className="text-center py-12 text-gray-500 dark:text-gray-400">
              No reviews yet. Be the first to review this game!
            </div>
          )}
        </div>
      </div>

      {/* Image Viewer */}
      <ImageViewer
        images={allImages}
        initialIndex={selectedImageIndex}
        isOpen={imageViewerOpen}
        onClose={() => setImageViewerOpen(false)}
      />

      {/* User Profile Modal */}
      <UserProfileModal
        user={selectedUser}
        isOpen={showUserProfile}
        onClose={() => {
          setShowUserProfile(false)
          setSelectedUser(null)
        }}
      />
    </div>
  )
}
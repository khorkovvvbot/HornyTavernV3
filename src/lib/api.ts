const API_BASE_URL = 'http://localhost:3001/api'

class APIClient {
  private async request(endpoint: string, options: RequestInit = {}) {
    const url = `${API_BASE_URL}${endpoint}`
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'API request failed')
    }

    return response.json()
  }

  // Users
  async getUser(telegramId: number) {
    return this.request(`/users?telegram_id=${telegramId}`)
  }

  async createUser(userData: any) {
    return this.request('/users', {
      method: 'POST',
      body: JSON.stringify(userData),
    })
  }

  async updateUser(id: string, userData: any) {
    return this.request(`/users/${id}`, {
      method: 'PUT',
      body: JSON.stringify(userData),
    })
  }

  // Games
  async getGames() {
    return this.request('/games')
  }

  async createGame(gameData: any) {
    return this.request('/games', {
      method: 'POST',
      body: JSON.stringify(gameData),
    })
  }

  async updateGame(id: string, gameData: any) {
    return this.request(`/games/${id}`, {
      method: 'PUT',
      body: JSON.stringify(gameData),
    })
  }

  async deleteGame(id: string) {
    return this.request(`/games/${id}`, {
      method: 'DELETE',
    })
  }

  // Reviews
  async getReviews(gameId: string) {
    return this.request(`/reviews?game_id=${gameId}`)
  }

  async createReview(reviewData: any) {
    return this.request('/reviews', {
      method: 'POST',
      body: JSON.stringify(reviewData),
    })
  }

  async updateReview(id: string, reviewData: any) {
    return this.request(`/reviews/${id}`, {
      method: 'PUT',
      body: JSON.stringify(reviewData),
    })
  }

  async deleteReview(id: string) {
    return this.request(`/reviews/${id}`, {
      method: 'DELETE',
    })
  }

  // Favorites
  async getFavorites(userId: string) {
    return this.request(`/favorites?user_id=${userId}`)
  }

  async addFavorite(userId: string, gameId: string) {
    return this.request('/favorites', {
      method: 'POST',
      body: JSON.stringify({ user_id: userId, game_id: gameId }),
    })
  }

  async removeFavorite(userId: string, gameId: string) {
    return this.request(`/favorites?user_id=${userId}&game_id=${gameId}`, {
      method: 'DELETE',
    })
  }

  // Genres
  async getGenres() {
    return this.request('/genres')
  }

  async createGenre(name: string) {
    return this.request('/genres', {
      method: 'POST',
      body: JSON.stringify({ name }),
    })
  }

  async deleteGenre(id: string) {
    return this.request(`/genres/${id}`, {
      method: 'DELETE',
    })
  }

  // Screenshots
  async getScreenshots(gameId: string) {
    return this.request(`/screenshots?game_id=${gameId}`)
  }

  // Notifications
  async getNotifications(userId: string) {
    return this.request(`/notifications?user_id=${userId}`)
  }

  async createNotification(notificationData: any) {
    return this.request('/notifications', {
      method: 'POST',
      body: JSON.stringify(notificationData),
    })
  }

  async markNotificationAsRead(id: string) {
    return this.request(`/notifications/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ read: true }),
    })
  }

  async clearNotifications(userId: string) {
    return this.request(`/notifications?user_id=${userId}`, {
      method: 'DELETE',
    })
  }

  // Game suggestions
  async getGameSuggestions(userId?: string) {
    const query = userId ? `?user_id=${userId}` : ''
    return this.request(`/game-suggestions${query}`)
  }

  async createGameSuggestion(suggestionData: any) {
    return this.request('/game-suggestions', {
      method: 'POST',
      body: JSON.stringify(suggestionData),
    })
  }

  async updateGameSuggestion(id: string, status: string, reviewedBy: string) {
    return this.request(`/game-suggestions/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ status, reviewed_by: reviewedBy }),
    })
  }

  // Review replies
  async getReviewReplies(reviewId: string) {
    return this.request(`/review-replies?review_id=${reviewId}`)
  }

  async createReviewReply(replyData: any) {
    return this.request('/review-replies', {
      method: 'POST',
      body: JSON.stringify(replyData),
    })
  }

  async deleteReviewReply(id: string) {
    return this.request(`/review-replies/${id}`, {
      method: 'DELETE',
    })
  }

  // Review reactions
  async getReviewReactions(reviewId: string) {
    return this.request(`/review-reactions?review_id=${reviewId}`)
  }

  async addReviewReaction(reviewId: string, userId: string, reactionType: string) {
    return this.request('/review-reactions', {
      method: 'POST',
      body: JSON.stringify({ review_id: reviewId, user_id: userId, reaction_type: reactionType }),
    })
  }

  async removeReviewReaction(reviewId: string, userId: string) {
    return this.request(`/review-reactions?review_id=${reviewId}&user_id=${userId}`, {
      method: 'DELETE',
    })
  }
}

export const apiClient = new APIClient()
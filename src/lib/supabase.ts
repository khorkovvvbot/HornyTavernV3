import { apiClient } from './api'
import type { Database } from './database'

// Create a Supabase-like interface that uses our API
export const supabase = {
  from: (table: string) => ({
    select: (columns = '*') => ({
      eq: (column: string, value: any) => ({
        single: async () => {
          try {
            if (table === 'users' && column === 'telegram_id') {
              const data = await apiClient.getUser(value)
              return { data, error: null }
            }
            return { data: null, error: { message: 'Not implemented' } }
          } catch (error) {
            return { data: null, error: { message: error.message } }
          }
        },
        maybeSingle: async () => {
          try {
            if (table === 'users' && column === 'telegram_id') {
              const data = await apiClient.getUser(value)
              return { data, error: null }
            }
            return { data: null, error: null }
          } catch (error) {
            return { data: null, error: null }
          }
        }
      }),
      order: (column: string, options?: { ascending?: boolean }) => ({
        limit: (count: number) => ({
          async then(resolve: any) {
            try {
              let data = []
              if (table === 'games') {
                data = await apiClient.getGames()
              } else if (table === 'genres') {
                data = await apiClient.getGenres()
              }
              resolve({ data, error: null })
            } catch (error) {
              resolve({ data: null, error: { message: error.message } })
            }
          }
        }),
        async then(resolve: any) {
          try {
            let data = []
            if (table === 'games') {
              data = await apiClient.getGames()
            } else if (table === 'genres') {
              data = await apiClient.getGenres()
            }
            resolve({ data, error: null })
          } catch (error) {
            resolve({ data: null, error: { message: error.message } })
          }
        }
      }),
      async then(resolve: any) {
        try {
          let data = []
          if (table === 'games') {
            data = await apiClient.getGames()
          } else if (table === 'genres') {
            data = await apiClient.getGenres()
          } else if (table === 'notifications') {
            // This will be handled by specific methods
            data = []
          }
          resolve({ data, error: null })
        } catch (error) {
          resolve({ data: null, error: { message: error.message } })
        }
      }
    }),
    insert: (data: any) => ({
      select: () => ({
        single: async () => {
          try {
            let result
            if (table === 'users') {
              result = await apiClient.createUser(data)
            } else if (table === 'games') {
              result = await apiClient.createGame(data)
            } else if (table === 'reviews') {
              result = await apiClient.createReview(data)
            } else if (table === 'favorites') {
              result = await apiClient.addFavorite(data.user_id, data.game_id)
            } else if (table === 'genres') {
              result = await apiClient.createGenre(data.name)
            } else if (table === 'notifications') {
              result = await apiClient.createNotification(data)
            } else if (table === 'game_suggestions') {
              result = await apiClient.createGameSuggestion(data)
            } else if (table === 'review_replies') {
              result = await apiClient.createReviewReply(data)
            }
            return { data: result, error: null }
          } catch (error) {
            return { data: null, error: { message: error.message } }
          }
        }
      }),
      async then(resolve: any) {
        try {
          let result
          if (table === 'users') {
            result = await apiClient.createUser(data)
          } else if (table === 'games') {
            result = await apiClient.createGame(data)
          } else if (table === 'reviews') {
            result = await apiClient.createReview(data)
          } else if (table === 'favorites') {
            result = await apiClient.addFavorite(data.user_id, data.game_id)
          } else if (table === 'genres') {
            result = await apiClient.createGenre(data.name)
          } else if (table === 'notifications') {
            result = await apiClient.createNotification(data)
          } else if (table === 'game_suggestions') {
            result = await apiClient.createGameSuggestion(data)
          } else if (table === 'review_replies') {
            result = await apiClient.createReviewReply(data)
          }
          resolve({ data: result, error: null })
        } catch (error) {
          resolve({ data: null, error: { message: error.message } })
        }
      }
    }),
    update: (data: any) => ({
      eq: (column: string, value: any) => ({
        select: () => ({
          single: async () => {
            try {
              let result
              if (table === 'users') {
                result = await apiClient.updateUser(value, data)
              } else if (table === 'games') {
                result = await apiClient.updateGame(value, data)
              } else if (table === 'reviews') {
                result = await apiClient.updateReview(value, data)
              } else if (table === 'notifications') {
                result = await apiClient.markNotificationAsRead(value)
              } else if (table === 'game_suggestions') {
                result = await apiClient.updateGameSuggestion(value, data.status, data.reviewed_by)
              }
              return { data: result, error: null }
            } catch (error) {
              return { data: null, error: { message: error.message } }
            }
          }
        }),
        async then(resolve: any) {
          try {
            let result
            if (table === 'users') {
              result = await apiClient.updateUser(value, data)
            } else if (table === 'games') {
              result = await apiClient.updateGame(value, data)
            } else if (table === 'reviews') {
              result = await apiClient.updateReview(value, data)
            } else if (table === 'notifications') {
              result = await apiClient.markNotificationAsRead(value)
            } else if (table === 'game_suggestions') {
              result = await apiClient.updateGameSuggestion(value, data.status, data.reviewed_by)
            }
            resolve({ data: result, error: null })
          } catch (error) {
            resolve({ data: null, error: { message: error.message } })
          }
        }
      })
    }),
    delete: () => ({
      eq: (column: string, value: any) => ({
        async then(resolve: any) {
          try {
            if (table === 'games') {
              await apiClient.deleteGame(value)
            } else if (table === 'reviews') {
              await apiClient.deleteReview(value)
            } else if (table === 'favorites') {
              // This needs special handling
            } else if (table === 'genres') {
              await apiClient.deleteGenre(value)
            } else if (table === 'review_replies') {
              await apiClient.deleteReviewReply(value)
            }
            resolve({ error: null })
          } catch (error) {
            resolve({ error: { message: error.message } })
          }
        }
      })
    })
  })
}

// Export types
export type { Database }
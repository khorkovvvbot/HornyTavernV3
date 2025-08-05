// Database types for TypeScript
export type Database = {
  public: {
    Tables: {
      games: {
        Row: {
          id: string
          title: string
          description_en: string
          description_ru: string
          cover_url: string
          download_link: string
          platform: 'Android' | 'Windows'
          platforms: string[]
          genres: string[]
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          title: string
          description_en?: string
          description_ru?: string
          cover_url?: string
          download_link?: string
          platform: 'Android' | 'Windows'
          platforms?: string[]
          genres?: string[]
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          title?: string
          description_en?: string
          description_ru?: string
          cover_url?: string
          download_link?: string
          platform?: 'Android' | 'Windows'
          platforms?: string[]
          genres?: string[]
          updated_at?: string
        }
      }
      screenshots: {
        Row: {
          id: string
          game_id: string
          image_url: string
          order_index: number
          created_at: string
        }
        Insert: {
          id?: string
          game_id: string
          image_url: string
          order_index?: number
          created_at?: string
        }
        Update: {
          id?: string
          game_id?: string
          image_url?: string
          order_index?: number
        }
      }
      users: {
        Row: {
          id: string
          telegram_id: number
          username: string
          first_name: string
          last_name: string
          avatar_url: string
          language: string
          created_at: string
        }
        Insert: {
          id?: string
          telegram_id: number
          username?: string
          first_name?: string
          last_name?: string
          avatar_url?: string
          language?: string
          created_at?: string
        }
        Update: {
          id?: string
          telegram_id?: number
          username?: string
          first_name?: string
          last_name?: string
          avatar_url?: string
          language?: string
        }
      }
      reviews: {
        Row: {
          id: string
          user_id: string
          game_id: string
          rating: number
          comment: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          game_id: string
          rating: number
          comment?: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          game_id?: string
          rating?: number
          comment?: string
        }
      }
      review_replies: {
        Row: {
          id: string
          review_id: string
          user_id: string
          comment: string
          created_at: string
        }
        Insert: {
          id?: string
          review_id: string
          user_id: string
          comment: string
          created_at?: string
        }
        Update: {
          id?: string
          review_id?: string
          user_id?: string
          comment?: string
        }
      }
      review_reactions: {
        Row: {
          id: string
          review_id: string
          user_id: string
          reaction_type: 'like' | 'dislike'
          created_at: string
        }
        Insert: {
          id?: string
          review_id: string
          user_id: string
          reaction_type: 'like' | 'dislike'
          created_at?: string
        }
        Update: {
          id?: string
          review_id?: string
          user_id?: string
          reaction_type?: 'like' | 'dislike'
        }
      }
      favorites: {
        Row: {
          id: string
          user_id: string
          game_id: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          game_id: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          game_id?: string
        }
      }
      genres: {
        Row: {
          id: string
          name: string
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
        }
      }
      notifications: {
        Row: {
          id: string
          user_id: string
          type: string
          title: string
          message: string
          game_title: string | null
          from_user: string | null
          read: boolean
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          type: string
          title: string
          message: string
          game_title?: string | null
          from_user?: string | null
          read?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          type?: string
          title?: string
          message?: string
          game_title?: string | null
          from_user?: string | null
          read?: boolean
        }
      }
      game_suggestions: {
        Row: {
          id: string
          user_id: string
          game_title: string
          description: string
          status: 'pending' | 'approved' | 'rejected'
          created_at: string
          reviewed_at: string | null
          reviewed_by: string | null
        }
        Insert: {
          id?: string
          user_id: string
          game_title: string
          description?: string
          status?: 'pending' | 'approved' | 'rejected'
          created_at?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          game_title?: string
          description?: string
          status?: 'pending' | 'approved' | 'rejected'
          reviewed_at?: string | null
          reviewed_by?: string | null
        }
      }
    }
  }
}
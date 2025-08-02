import { Pool } from 'pg'

// Database connection configuration
const pool = new Pool({
  host: import.meta.env.VITE_POSTGRESQL_HOST || '185.207.66.18',
  port: parseInt(import.meta.env.VITE_POSTGRESQL_PORT || '5432'),
  user: import.meta.env.VITE_POSTGRESQL_USER || 'gen_user',
  password: import.meta.env.VITE_POSTGRESQL_PASSWORD || '9IQJ\\lY;Aue95.',
  database: import.meta.env.VITE_POSTGRESQL_DBNAME || 'default_db',
  ssl: {
    rejectUnauthorized: false // For cloud databases
  },
  max: 20, // Maximum number of clients in the pool
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
})

// Test database connection
export const testConnection = async () => {
  try {
    console.log('Testing PostgreSQL connection...')
    const client = await pool.connect()
    await client.query('SELECT NOW()')
    client.release()
    console.log('PostgreSQL connection successful')
    return { success: true, error: null }
  } catch (error) {
    console.error('PostgreSQL connection test failed:', error)
    
    let errorMessage = 'Unknown connection error'
    let suggestions: string[] = []
    
    if (error instanceof Error) {
      if (error.message.includes('ECONNREFUSED')) {
        errorMessage = 'Connection refused - server not reachable'
        suggestions = [
          'Check if the database server is running',
          'Verify the host and port are correct',
          'Check firewall settings'
        ]
      } else if (error.message.includes('authentication failed')) {
        errorMessage = 'Authentication failed - invalid credentials'
        suggestions = [
          'Check username and password',
          'Verify database name is correct',
          'Check if user has access to the database'
        ]
      } else if (error.message.includes('timeout')) {
        errorMessage = 'Connection timeout'
        suggestions = [
          'Check network connectivity',
          'Verify server is responding',
          'Try increasing connection timeout'
        ]
      } else {
        errorMessage = error.message
        suggestions = [
          'Check all connection parameters',
          'Verify database server is accessible',
          'Check network connectivity'
        ]
      }
    }
    
    return { 
      success: false, 
      error: errorMessage,
      suggestions 
    }
  }
}

// Helper function to execute queries
export const query = async (text: string, params?: any[]) => {
  const client = await pool.connect()
  try {
    const result = await client.query(text, params)
    return result
  } finally {
    client.release()
  }
}

// Helper function for transactions
export const transaction = async (callback: (client: any) => Promise<any>) => {
  const client = await pool.connect()
  try {
    await client.query('BEGIN')
    const result = await callback(client)
    await client.query('COMMIT')
    return result
  } catch (error) {
    await client.query('ROLLBACK')
    throw error
  } finally {
    client.release()
  }
}

export { pool }

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
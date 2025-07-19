import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || ''
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || ''

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase environment variables:', {
    url: !!supabaseUrl,
    key: !!supabaseAnonKey
  })
  throw new Error('Missing Supabase environment variables')
}

// Проверяем корректность URL
try {
  new URL(supabaseUrl)
} catch (error) {
  console.error('Invalid Supabase URL:', supabaseUrl)
  throw new Error('Invalid Supabase URL format')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
    detectSessionInUrl: false
  },
  global: {
    headers: {
      'apikey': supabaseAnonKey
    }
  },
  realtime: {
    params: {
      eventsPerSecond: 10
    }
  }
})

// Функция для проверки подключения с детальной диагностикой
export const testConnection = async () => {
  try {
    console.log('Testing Supabase connection...')
    console.log('Supabase URL:', supabaseUrl)
    console.log('Using anon key:', supabaseAnonKey ? 'Yes' : 'No')
    
    // Проверяем доступность URL
    const response = await fetch(supabaseUrl + '/rest/v1/', {
      method: 'HEAD',
      headers: {
        'apikey': supabaseAnonKey,
        'Authorization': `Bearer ${supabaseAnonKey}`
      }
    })
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }
    
    console.log('Supabase connection successful')
    return { success: true, error: null }
  } catch (error) {
    console.error('Supabase connection test failed:', error)
    
    let errorMessage = 'Неизвестная ошибка подключения'
    let suggestions: string[] = []
    
    if (error instanceof TypeError && error.message.includes('fetch')) {
      errorMessage = 'Не удается подключиться к серверу базы данных'
      suggestions = [
        'Проверьте подключение к интернету',
        'Если используете VPN или прокси - попробуйте отключить их',
        'Если не используете VPN - попробуйте включить',
        'Попробуйте переключиться на мобильный интернет',
        'Попробуйте переключиться на Wi-Fi (если используете мобильный)',
        'Проверьте настройки файрвола или антивируса',
        'Убедитесь, что URL Supabase правильный в файле .env'
      ]
    } else if (error instanceof Error) {
      if (error.message.includes('404')) {
        errorMessage = 'Проект Supabase не найден'
        suggestions = [
          'Проверьте правильность URL проекта в файле .env',
          'Убедитесь, что проект не был удален',
          'Проверьте настройки в Supabase Dashboard'
        ]
      } else if (error.message.includes('401') || error.message.includes('403')) {
        errorMessage = 'Неверный API ключ Supabase'
        suggestions = [
          'Проверьте правильность anon key в файле .env',
          'Убедитесь, что ключ скопирован полностью',
          'Проверьте настройки API в Supabase Dashboard',
          'Перезапустите сервер разработки после изменения .env'
        ]
      } else if (error.message.includes('timeout') || error.message.includes('TIMEOUT')) {
        errorMessage = 'Превышено время ожидания подключения'
        suggestions = [
          'Проверьте скорость интернет-соединения',
          'Попробуйте отключить VPN или прокси',
          'Переключитесь на другую сеть (Wi-Fi ↔ мобильный интернет)',
          'Проверьте настройки файрвола'
        ]
      } else {
        errorMessage = error.message
        suggestions = [
          'Проверьте подключение к интернету',
          'Попробуйте отключить/включить VPN или прокси',
          'Переключитесь между Wi-Fi и мобильным интернетом'
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
    }
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
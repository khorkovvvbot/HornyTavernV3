import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { testConnection } from '../lib/database'
import { getTelegramUser, mockTelegramUser } from '../lib/telegram'
import type { Database } from '../lib/database'

type User = Database['public']['Tables']['users']['Row']

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [connectionError, setConnectionError] = useState<string | null>(null)
  const [isAdmin, setIsAdmin] = useState(false)
  const [isRestricted, setIsRestricted] = useState(false)

  useEffect(() => {
    const initAuth = async () => {
      try {
        console.log('Initializing auth...')
        
        // Get Telegram user data
        const telegramUser = getTelegramUser() || mockTelegramUser()
        
        if (!telegramUser) {
          console.log('No Telegram user found')
          setLoading(false)
          return
        }

        console.log('Telegram user:', telegramUser)

        // Check if user exists in database
        const { data: existingUser, error: fetchError } = await supabase
          .from('users')
          .select('*')
          .eq('telegram_id', telegramUser.id)
          .single()

        if (fetchError && fetchError.code !== 'PGRST116') {
          console.error('Error fetching user:', fetchError)
          setLoading(false)
          return
        }

        let userData: User

        if (existingUser) {
          console.log('Existing user found, updating...')
          // Update existing user
          const { data: updatedUser, error: updateError } = await supabase
            .from('users')
            .update({
              username: telegramUser.username || '',
              first_name: telegramUser.first_name || '',
              last_name: telegramUser.last_name || '',
              avatar_url: telegramUser.photo_url || ''
            })
            .eq('telegram_id', telegramUser.id)
            .select()
            .single()

          if (updateError) {
            console.error('Error updating user:', updateError)
            userData = existingUser
          } else {
            userData = updatedUser
          }
        } else {
          console.log('Creating new user...')
          // Create new user
          const { data: newUser, error: insertError } = await supabase
            .from('users')
            .insert({
              telegram_id: telegramUser.id,
              username: telegramUser.username || '',
              first_name: telegramUser.first_name || '',
              last_name: telegramUser.last_name || '',
              avatar_url: telegramUser.photo_url || '',
              language: telegramUser.language_code || 'en'
            })
            .select()
            .single()

          if (insertError) {
            console.error('Error creating user:', insertError)
            setLoading(false)
            return
          }

          userData = newUser
        }

        console.log('User data:', userData)
        setUser(userData)
        setIsAdmin(userData.telegram_id === 7727946466)
        
        // Check if user is restricted (@testuser)
        setIsRestricted(userData.username === 'testuser')
      } catch (error) {
        console.error('Auth initialization error:', error)
        setConnectionError(error instanceof Error ? error.message : 'Unknown error occurred')
      } finally {
        setLoading(false)
      }
    }

    initAuth()
  }, [])

  return { user, loading, isAdmin, isRestricted, connectionError }
}
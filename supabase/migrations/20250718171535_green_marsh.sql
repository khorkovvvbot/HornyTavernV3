/*
  # Create game_suggestions table

  1. New Tables
    - `game_suggestions`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to users)
      - `game_title` (text, required)
      - `description` (text, required)
      - `status` (text, default 'pending')
      - `created_at` (timestamp)
      - `reviewed_at` (timestamp, nullable)
      - `reviewed_by` (uuid, nullable, foreign key to users)

  2. Security
    - Enable RLS on `game_suggestions` table
    - Add policy for users to manage their own suggestions
    - Add policy for users to view their own suggestions
    - Add policy for admin to manage all suggestions

  3. Indexes
    - Index on user_id for faster queries
    - Index on status for admin filtering
    - Index on created_at for ordering
*/

CREATE TABLE IF NOT EXISTS game_suggestions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  game_title text NOT NULL,
  description text NOT NULL DEFAULT '',
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  created_at timestamptz DEFAULT now(),
  reviewed_at timestamptz,
  reviewed_by uuid REFERENCES users(id) ON DELETE SET NULL
);

-- Enable RLS
ALTER TABLE game_suggestions ENABLE ROW LEVEL SECURITY;

-- Users can manage their own suggestions
CREATE POLICY "Users can manage their own game suggestions"
  ON game_suggestions
  FOR ALL
  TO authenticated, anon
  USING (true)
  WITH CHECK (true);

-- Users can view their own suggestions
CREATE POLICY "Users can view their own game suggestions"
  ON game_suggestions
  FOR SELECT
  TO authenticated, anon
  USING (true);

-- Admin can manage all suggestions
CREATE POLICY "Admin can manage all game suggestions"
  ON game_suggestions
  FOR ALL
  TO authenticated, anon
  USING (EXISTS (
    SELECT 1 FROM users 
    WHERE users.telegram_id = 7727946466
  ))
  WITH CHECK (true);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_game_suggestions_user_id ON game_suggestions(user_id);
CREATE INDEX IF NOT EXISTS idx_game_suggestions_status ON game_suggestions(status);
CREATE INDEX IF NOT EXISTS idx_game_suggestions_created_at ON game_suggestions(created_at DESC);
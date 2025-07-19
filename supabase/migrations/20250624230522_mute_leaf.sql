/*
  # Create Games WebApp Database Schema

  1. New Tables
    - `games`
      - `id` (uuid, primary key)
      - `title` (text)
      - `description` (text)
      - `cover_url` (text)
      - `download_link` (text)
      - `platform` (text)
      - `genres` (text array)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
    
    - `screenshots`
      - `id` (uuid, primary key)
      - `game_id` (uuid, foreign key)
      - `image_url` (text)
      - `order_index` (integer)
    
    - `users`
      - `id` (uuid, primary key)
      - `telegram_id` (bigint, unique)
      - `username` (text)
      - `first_name` (text)
      - `last_name` (text)
      - `avatar_url` (text)
      - `language` (text, default 'en')
      - `created_at` (timestamp)
    
    - `reviews`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key)
      - `game_id` (uuid, foreign key)
      - `rating` (integer, 1-5)
      - `comment` (text, optional)
      - `created_at` (timestamp)
    
    - `favorites`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key)
      - `game_id` (uuid, foreign key)
      - `created_at` (timestamp)
    
    - `genres`
      - `id` (uuid, primary key)
      - `name` (text, unique)
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users
    - Admin access for specific user ID
*/

-- Create tables
CREATE TABLE IF NOT EXISTS genres (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text UNIQUE NOT NULL,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS games (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text DEFAULT '',
  cover_url text DEFAULT '',
  download_link text DEFAULT '',
  platform text NOT NULL CHECK (platform IN ('Android', 'Windows')),
  genres text[] DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS screenshots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  game_id uuid REFERENCES games(id) ON DELETE CASCADE,
  image_url text NOT NULL,
  order_index integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  telegram_id bigint UNIQUE NOT NULL,
  username text DEFAULT '',
  first_name text DEFAULT '',
  last_name text DEFAULT '',
  avatar_url text DEFAULT '',
  language text DEFAULT 'en',
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  game_id uuid REFERENCES games(id) ON DELETE CASCADE,
  rating integer NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment text DEFAULT '',
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, game_id)
);

CREATE TABLE IF NOT EXISTS favorites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  game_id uuid REFERENCES games(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, game_id)
);

-- Enable RLS
ALTER TABLE games ENABLE ROW LEVEL SECURITY;
ALTER TABLE screenshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE genres ENABLE ROW LEVEL SECURITY;

-- Policies for games (readable by all, writable by admin)
CREATE POLICY "Games are viewable by everyone"
  ON games FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Admin can manage games"
  ON games FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.telegram_id = 7727946466
    )
  );

-- Policies for screenshots (readable by all, writable by admin)
CREATE POLICY "Screenshots are viewable by everyone"
  ON screenshots FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Admin can manage screenshots"
  ON screenshots FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.telegram_id = 7727946466
    )
  );

-- Policies for users
CREATE POLICY "Users can view their own data"
  ON users FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own data"
  ON users FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can insert their own data"
  ON users FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- Policies for reviews (users can manage their own)
CREATE POLICY "Reviews are viewable by everyone"
  ON reviews FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Users can manage their own reviews"
  ON reviews FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Policies for favorites (users can manage their own)
CREATE POLICY "Users can view their own favorites"
  ON favorites FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own favorites"
  ON favorites FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Policies for genres (readable by all, writable by admin)
CREATE POLICY "Genres are viewable by everyone"
  ON genres FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Admin can manage genres"
  ON genres FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.telegram_id = 7727946466
    )
  );

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_games_platform ON games(platform);
CREATE INDEX IF NOT EXISTS idx_games_created_at ON games(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_screenshots_game_id ON screenshots(game_id);
CREATE INDEX IF NOT EXISTS idx_users_telegram_id ON users(telegram_id);
CREATE INDEX IF NOT EXISTS idx_reviews_game_id ON reviews(game_id);
CREATE INDEX IF NOT EXISTS idx_reviews_user_id ON reviews(user_id);
CREATE INDEX IF NOT EXISTS idx_favorites_user_id ON favorites(user_id);
CREATE INDEX IF NOT EXISTS idx_favorites_game_id ON favorites(game_id);

-- Insert some sample genres
INSERT INTO genres (name) VALUES 
  ('Action'),
  ('Adventure'),
  ('RPG'),
  ('Strategy'),
  ('Puzzle'),
  ('Racing'),
  ('Sports'),
  ('Simulation'),
  ('Arcade'),
  ('Horror')
ON CONFLICT (name) DO NOTHING;
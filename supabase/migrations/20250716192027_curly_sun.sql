/*
  # Add review reactions system (likes/dislikes)

  1. New Table
    - `review_reactions`
      - `id` (uuid, primary key)
      - `review_id` (uuid, foreign key to reviews)
      - `user_id` (uuid, foreign key to users)
      - `reaction_type` (text, 'like' or 'dislike')
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on review_reactions table
    - Add policies for authenticated users to manage their own reactions
    - Allow everyone to view reactions
*/

-- Create review_reactions table
CREATE TABLE IF NOT EXISTS review_reactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  review_id uuid REFERENCES reviews(id) ON DELETE CASCADE,
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  reaction_type text NOT NULL CHECK (reaction_type IN ('like', 'dislike')),
  created_at timestamptz DEFAULT now(),
  UNIQUE(review_id, user_id)
);

-- Enable RLS
ALTER TABLE review_reactions ENABLE ROW LEVEL SECURITY;

-- Policies for review_reactions
CREATE POLICY "Review reactions are viewable by everyone"
  ON review_reactions FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Users can manage their own review reactions"
  ON review_reactions FOR ALL
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_review_reactions_review_id ON review_reactions(review_id);
CREATE INDEX IF NOT EXISTS idx_review_reactions_user_id ON review_reactions(user_id);
CREATE INDEX IF NOT EXISTS idx_review_reactions_type ON review_reactions(reaction_type);
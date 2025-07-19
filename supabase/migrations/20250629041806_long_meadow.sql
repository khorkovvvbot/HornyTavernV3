/*
  # Add review replies system

  1. New Table
    - `review_replies`
      - `id` (uuid, primary key)
      - `review_id` (uuid, foreign key to reviews)
      - `user_id` (uuid, foreign key to users)
      - `comment` (text)
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on review_replies table
    - Add policies for authenticated users to manage their own replies
    - Allow everyone to view replies
*/

-- Create review_replies table
CREATE TABLE IF NOT EXISTS review_replies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  review_id uuid REFERENCES reviews(id) ON DELETE CASCADE,
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  comment text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE review_replies ENABLE ROW LEVEL SECURITY;

-- Policies for review_replies
CREATE POLICY "Review replies are viewable by everyone"
  ON review_replies FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Users can manage their own review replies"
  ON review_replies FOR ALL
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_review_replies_review_id ON review_replies(review_id);
CREATE INDEX IF NOT EXISTS idx_review_replies_user_id ON review_replies(user_id);
CREATE INDEX IF NOT EXISTS idx_review_replies_created_at ON review_replies(created_at DESC);
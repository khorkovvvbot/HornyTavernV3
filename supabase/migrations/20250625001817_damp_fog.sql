/*
  # Add multi-platform support to games table

  1. Changes
    - Add new column `platforms` as text array to support multiple platforms
    - Keep existing `platform` column for backward compatibility
    - Add check constraint to ensure at least one platform is specified

  2. Security
    - No changes to RLS policies needed
*/

-- Add platforms column to support multiple platforms
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'games' AND column_name = 'platforms'
  ) THEN
    ALTER TABLE games ADD COLUMN platforms text[] DEFAULT '{}';
  END IF;
END $$;

-- Add check constraint to ensure platforms array is not empty when specified
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE table_name = 'games' AND constraint_name = 'games_platforms_not_empty'
  ) THEN
    ALTER TABLE games ADD CONSTRAINT games_platforms_not_empty 
    CHECK (array_length(platforms, 1) IS NULL OR array_length(platforms, 1) > 0);
  END IF;
END $$;

-- Update existing games to populate platforms array from platform column
UPDATE games 
SET platforms = ARRAY[platform] 
WHERE platforms = '{}' OR platforms IS NULL;
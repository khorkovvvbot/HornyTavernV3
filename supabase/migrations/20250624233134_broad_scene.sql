/*
  # Add multilingual support for game descriptions

  1. Changes
    - Add description_en and description_ru columns to games table
    - Remove old description column
    - Update existing data if any

  2. Security
    - Maintain existing RLS policies
*/

-- Add new multilingual description columns
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'games' AND column_name = 'description_en'
  ) THEN
    ALTER TABLE games ADD COLUMN description_en text DEFAULT '';
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'games' AND column_name = 'description_ru'
  ) THEN
    ALTER TABLE games ADD COLUMN description_ru text DEFAULT '';
  END IF;
END $$;

-- Migrate existing description data to English if exists
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'games' AND column_name = 'description'
  ) THEN
    UPDATE games SET description_en = description WHERE description_en = '';
    ALTER TABLE games DROP COLUMN description;
  END IF;
END $$;
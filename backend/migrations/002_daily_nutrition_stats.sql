-- Migration: Create daily nutrition statistics table
-- This table stores pre-aggregated daily nutrition data for faster querying

-- Create daily_nutrition_stats table
CREATE TABLE IF NOT EXISTS daily_nutrition_stats (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    total_calories DECIMAL(10, 2) DEFAULT 0,
    total_protein_g DECIMAL(10, 2) DEFAULT 0,
    total_carbs_g DECIMAL(10, 2) DEFAULT 0,
    total_fat_g DECIMAL(10, 2) DEFAULT 0,
    total_fiber_g DECIMAL(10, 2) DEFAULT 0,
    total_sugar_g DECIMAL(10, 2) DEFAULT 0,
    total_sodium_mg DECIMAL(10, 2) DEFAULT 0,
    meal_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, date)
);

-- Create index for faster queries
CREATE INDEX idx_daily_nutrition_stats_user_date ON daily_nutrition_stats(user_id, date DESC);
CREATE INDEX idx_daily_nutrition_stats_user_id ON daily_nutrition_stats(user_id);

-- Create function to update daily stats
CREATE OR REPLACE FUNCTION update_daily_nutrition_stats()
RETURNS TRIGGER AS $$
BEGIN
    -- Insert or update daily stats when a meal is scanned
    INSERT INTO daily_nutrition_stats (
        user_id,
        date,
        total_calories,
        total_protein_g,
        total_carbs_g,
        total_fat_g,
        total_fiber_g,
        total_sugar_g,
        total_sodium_mg,
        meal_count,
        updated_at
    )
    SELECT 
        user_id,
        DATE(scanned_at) as date,
        COALESCE(SUM((nutrition->>'calories')::DECIMAL), 0) as total_calories,
        COALESCE(SUM((nutrition->>'protein_g')::DECIMAL), 0) as total_protein_g,
        COALESCE(SUM((nutrition->>'carbs_g')::DECIMAL), 0) as total_carbs_g,
        COALESCE(SUM((nutrition->>'fat_g')::DECIMAL), 0) as total_fat_g,
        COALESCE(SUM((nutrition->>'fiber_g')::DECIMAL), 0) as total_fiber_g,
        COALESCE(SUM((nutrition->>'sugar_g')::DECIMAL), 0) as total_sugar_g,
        COALESCE(SUM((nutrition->>'sodium_mg')::DECIMAL), 0) as total_sodium_mg,
        COUNT(*) as meal_count,
        CURRENT_TIMESTAMP
    FROM scanned_dishes
    WHERE user_id = NEW.user_id 
        AND DATE(scanned_at) = DATE(NEW.scanned_at)
    GROUP BY user_id, DATE(scanned_at)
    ON CONFLICT (user_id, date) 
    DO UPDATE SET
        total_calories = EXCLUDED.total_calories,
        total_protein_g = EXCLUDED.total_protein_g,
        total_carbs_g = EXCLUDED.total_carbs_g,
        total_fat_g = EXCLUDED.total_fat_g,
        total_fiber_g = EXCLUDED.total_fiber_g,
        total_sugar_g = EXCLUDED.total_sugar_g,
        total_sodium_mg = EXCLUDED.total_sodium_mg,
        meal_count = EXCLUDED.meal_count,
        updated_at = CURRENT_TIMESTAMP;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update daily stats
DROP TRIGGER IF EXISTS trigger_update_daily_nutrition_stats ON scanned_dishes;
CREATE TRIGGER trigger_update_daily_nutrition_stats
    AFTER INSERT OR UPDATE ON scanned_dishes
    FOR EACH ROW
    EXECUTE FUNCTION update_daily_nutrition_stats();

-- Backfill existing data into daily_nutrition_stats
INSERT INTO daily_nutrition_stats (
    user_id,
    date,
    total_calories,
    total_protein_g,
    total_carbs_g,
    total_fat_g,
    total_fiber_g,
    total_sugar_g,
    total_sodium_mg,
    meal_count,
    created_at,
    updated_at
)
SELECT 
    user_id,
    DATE(scanned_at) as date,
    COALESCE(SUM((nutrition->>'calories')::DECIMAL), 0) as total_calories,
    COALESCE(SUM((nutrition->>'protein_g')::DECIMAL), 0) as total_protein_g,
    COALESCE(SUM((nutrition->>'carbs_g')::DECIMAL), 0) as total_carbs_g,
    COALESCE(SUM((nutrition->>'fat_g')::DECIMAL), 0) as total_fat_g,
    COALESCE(SUM((nutrition->>'fiber_g')::DECIMAL), 0) as total_fiber_g,
    COALESCE(SUM((nutrition->>'sugar_g')::DECIMAL), 0) as total_sugar_g,
    COALESCE(SUM((nutrition->>'sodium_mg')::DECIMAL), 0) as total_sodium_mg,
    COUNT(*) as meal_count,
    MIN(scanned_at) as created_at,
    MAX(scanned_at) as updated_at
FROM scanned_dishes
GROUP BY user_id, DATE(scanned_at)
ON CONFLICT (user_id, date) DO NOTHING;

-- Grant permissions
GRANT SELECT, INSERT, UPDATE ON daily_nutrition_stats TO authenticated;
GRANT SELECT, INSERT, UPDATE ON daily_nutrition_stats TO anon;

-- Enable RLS
ALTER TABLE daily_nutrition_stats ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own daily stats"
    ON daily_nutrition_stats FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own daily stats"
    ON daily_nutrition_stats FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own daily stats"
    ON daily_nutrition_stats FOR UPDATE
    USING (auth.uid() = user_id);

-- Supabase Database Schema for Nutrition App
-- Run this in your Supabase SQL editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Enable Vector extension for embeddings (for future search functionality)
CREATE EXTENSION IF NOT EXISTS vector;

-- Recipes table
CREATE TABLE IF NOT EXISTS recipes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    ingredients TEXT[] NOT NULL,
    steps JSONB NOT NULL,
    nutrition_info JSONB NOT NULL,
    dietary_restrictions TEXT[] DEFAULT '{}',
    prep_time_minutes INTEGER NOT NULL,
    cook_time_minutes INTEGER NOT NULL,
    servings INTEGER NOT NULL DEFAULT 1,
    difficulty TEXT NOT NULL DEFAULT 'medium',
    image_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    user_id UUID REFERENCES auth.users(id),
    embedding vector(1536)  -- For vector search
);

-- Dish analyses table
CREATE TABLE IF NOT EXISTS dish_analyses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    dish_name TEXT NOT NULL,
    nutrition_info JSONB NOT NULL,
    ingredients_detected TEXT[] DEFAULT '{}',
    confidence_score REAL NOT NULL,
    warnings TEXT[] DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    user_id UUID REFERENCES auth.users(id)
);

-- Event logs table (for Observer pattern)
CREATE TABLE IF NOT EXISTS event_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_type TEXT NOT NULL,
    data JSONB NOT NULL,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    user_id UUID REFERENCES auth.users(id)
);

-- User preferences table
CREATE TABLE IF NOT EXISTS user_preferences (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) UNIQUE NOT NULL,
    dietary_restrictions TEXT[] DEFAULT '{}',
    allergies TEXT[] DEFAULT '{}',
    disliked_ingredients TEXT[] DEFAULT '{}',
    preferred_cuisines TEXT[] DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Saved recipes table (user's favorite recipes)
CREATE TABLE IF NOT EXISTS saved_recipes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) NOT NULL,
    recipe_id UUID REFERENCES recipes(id) NOT NULL,
    notes TEXT,
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, recipe_id)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_recipes_created_at ON recipes(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_recipes_user_id ON recipes(user_id);
CREATE INDEX IF NOT EXISTS idx_recipes_dietary_restrictions ON recipes USING GIN(dietary_restrictions);
CREATE INDEX IF NOT EXISTS idx_dish_analyses_created_at ON dish_analyses(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_dish_analyses_user_id ON dish_analyses(user_id);
CREATE INDEX IF NOT EXISTS idx_event_logs_event_type ON event_logs(event_type);
CREATE INDEX IF NOT EXISTS idx_event_logs_timestamp ON event_logs(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_saved_recipes_user_id ON saved_recipes(user_id);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
CREATE TRIGGER update_recipes_updated_at
    BEFORE UPDATE ON recipes
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_preferences_updated_at
    BEFORE UPDATE ON user_preferences
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Row Level Security (RLS) policies
ALTER TABLE recipes ENABLE ROW LEVEL SECURITY;
ALTER TABLE dish_analyses ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE saved_recipes ENABLE ROW LEVEL SECURITY;

-- Recipes policies
CREATE POLICY "Public recipes are viewable by everyone"
    ON recipes FOR SELECT
    USING (true);

CREATE POLICY "Users can insert their own recipes"
    ON recipes FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own recipes"
    ON recipes FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own recipes"
    ON recipes FOR DELETE
    USING (auth.uid() = user_id);

-- Dish analyses policies
CREATE POLICY "Users can view their own dish analyses"
    ON dish_analyses FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own dish analyses"
    ON dish_analyses FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- User preferences policies
CREATE POLICY "Users can view their own preferences"
    ON user_preferences FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own preferences"
    ON user_preferences FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own preferences"
    ON user_preferences FOR UPDATE
    USING (auth.uid() = user_id);

-- Saved recipes policies
CREATE POLICY "Users can view their own saved recipes"
    ON saved_recipes FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own saved recipes"
    ON saved_recipes FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own saved recipes"
    ON saved_recipes FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own saved recipes"
    ON saved_recipes FOR DELETE
    USING (auth.uid() = user_id);

-- Event logs policies (admin only)
CREATE POLICY "Event logs are viewable by authenticated users"
    ON event_logs FOR SELECT
    USING (auth.role() = 'authenticated');

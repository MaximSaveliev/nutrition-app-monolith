-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users profile table (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    nickname VARCHAR(50) NOT NULL UNIQUE,
    dietary_restrictions TEXT[] DEFAULT '{}',
    preferred_cuisines TEXT[] DEFAULT '{}',
    daily_calorie_goal INTEGER DEFAULT 2000,
    daily_protein_goal INTEGER DEFAULT 150,
    daily_carbs_goal INTEGER DEFAULT 250,
    daily_fat_goal INTEGER DEFAULT 65,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_users_id ON users(id);
CREATE INDEX idx_users_nickname ON users(nickname);

-- Recipes table
CREATE TABLE IF NOT EXISTS recipes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    author_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    ingredients JSONB NOT NULL,
    steps JSONB NOT NULL,
    cuisine_type TEXT,
    dietary_restrictions TEXT[] DEFAULT '{}',
    spice_level TEXT,
    difficulty VARCHAR(20) NOT NULL,
    prep_time_minutes INTEGER NOT NULL,
    cook_time_minutes INTEGER NOT NULL,
    servings INTEGER NOT NULL,
    nutrition JSONB NOT NULL,
    is_public BOOLEAN DEFAULT false,
    image_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_recipes_author ON recipes(author_id);
CREATE INDEX idx_recipes_public ON recipes(is_public) WHERE is_public = true;
CREATE INDEX idx_recipes_cuisine ON recipes(cuisine_type);
CREATE INDEX idx_recipes_dietary ON recipes USING GIN(dietary_restrictions);

-- Scanned dishes history (what user photographed and analyzed)
CREATE TABLE IF NOT EXISTS scanned_dishes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    dish_name VARCHAR(200) NOT NULL,
    nutrition JSONB NOT NULL,
    meal_type VARCHAR(50),
    image_url TEXT,
    confidence_score DECIMAL(3,2),
    scanned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_scanned_dishes_user ON scanned_dishes(user_id);
CREATE INDEX idx_scanned_dishes_date ON scanned_dishes(scanned_at);
CREATE INDEX idx_scanned_dishes_meal_type ON scanned_dishes(meal_type);

-- Row Level Security policies
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE recipes ENABLE ROW LEVEL SECURITY;
ALTER TABLE scanned_dishes ENABLE ROW LEVEL SECURITY;

-- Users policies
CREATE POLICY "Users can view their own profile"
    ON users FOR SELECT
    USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
    ON users FOR UPDATE
    USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile"
    ON users FOR INSERT
    WITH CHECK (auth.uid() = id);

-- Recipes policies
CREATE POLICY "Public recipes are viewable by everyone"
    ON recipes FOR SELECT
    USING (is_public = true);

CREATE POLICY "Users can view their own recipes"
    ON recipes FOR SELECT
    USING (auth.uid() = author_id);

CREATE POLICY "Users can create their own recipes"
    ON recipes FOR INSERT
    WITH CHECK (auth.uid() = author_id);

CREATE POLICY "Users can update their own recipes"
    ON recipes FOR UPDATE
    USING (auth.uid() = author_id);

CREATE POLICY "Users can delete their own recipes"
    ON recipes FOR DELETE
    USING (auth.uid() = author_id);

-- Scanned dishes policies
CREATE POLICY "Users can view their own scanned dishes"
    ON scanned_dishes FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own scanned dishes"
    ON scanned_dishes FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own scanned dishes"
    ON scanned_dishes FOR DELETE
    USING (auth.uid() = user_id);

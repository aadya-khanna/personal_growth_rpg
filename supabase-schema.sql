-- Run this in your new Supabase project: SQL Editor → New Query → paste & Run
-- Creates the tables and RLS policies needed for Personal Growth RPG

-- Enable UUID extension (usually already enabled)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Profiles table (extends auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT,
  character_name TEXT,
  class_title TEXT,
  gender TEXT,
  skin_tone TEXT,
  hair_style TEXT,
  hair_color TEXT,
  clothing TEXT,
  weapon TEXT,
  level INTEGER DEFAULT 1,
  xp INTEGER DEFAULT 0,
  hp INTEGER DEFAULT 100,
  mp INTEGER DEFAULT 50,
  str INTEGER DEFAULT 5,
  int INTEGER DEFAULT 5,
  agi INTEGER DEFAULT 5,
  wis INTEGER DEFAULT 5,
  streak INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Friends table
CREATE TABLE IF NOT EXISTS public.friends (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  friend_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, friend_id)
);

-- RLS: Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.friends ENABLE ROW LEVEL SECURITY;

-- Profiles: Users can read all profiles (for leaderboard), update only their own
CREATE POLICY "Profiles are viewable by everyone" ON public.profiles
  FOR SELECT USING (true);

CREATE POLICY "Users can insert own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

-- Friends: Users can manage their own friend relationships
CREATE POLICY "Users can view friends" ON public.friends
  FOR SELECT USING (auth.uid() = user_id OR auth.uid() = friend_id);

CREATE POLICY "Users can add friends" ON public.friends
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can remove friends" ON public.friends
  FOR DELETE USING (auth.uid() = user_id);

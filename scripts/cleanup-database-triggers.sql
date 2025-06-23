-- Cleanup Database Triggers Script
-- This removes the problematic subscription check trigger that references non-existent user_subscriptions table
-- Run this in your Supabase SQL editor

-- 1. Remove the trigger first (if it exists)
DROP TRIGGER IF EXISTS recipe_limit_trigger ON recipes;

-- 2. Remove the function (if it exists)
DROP FUNCTION IF EXISTS check_recipe_limit();

-- 3. Verify cleanup (these should return 0 rows)
SELECT 
  trigger_name, 
  event_object_table 
FROM information_schema.triggers 
WHERE trigger_name = 'recipe_limit_trigger';

SELECT 
  routine_name, 
  routine_type 
FROM information_schema.routines 
WHERE routine_name = 'check_recipe_limit';

-- Success message
SELECT 'Database cleanup completed - RevenueCat will handle subscription logic' as status; 
/**
 * Debug script to troubleshoot recipe loading issues
 * Run this in the console to diagnose problems
 */

import { supabase } from "@/lib/supabase";
import { getUserRecipes } from "@/services/recipeService";

export async function debugRecipeLoading(userId: string) {
  console.log("🔍 Starting recipe loading debug...");
  console.log("User ID:", userId);

  try {
    // 1. Test basic Supabase connection
    console.log("\n1. Testing Supabase connection...");
    const { data: testData, error: testError } = await supabase
      .from("recipes")
      .select("count")
      .limit(1);

    if (testError) {
      console.error("❌ Supabase connection failed:", testError);
      return;
    }
    console.log("✅ Supabase connection successful");

    // 2. Check if user exists and has recipes
    console.log("\n2. Checking user's recipes in database...");
    const { data: userRecipes, error: userError } = await supabase
      .from("recipes")
      .select("id, title, created_at, user_id")
      .eq("user_id", userId);

    if (userError) {
      console.error("❌ Error fetching user recipes:", userError);
      return;
    }

    console.log(
      `📊 Found ${userRecipes?.length || 0} recipes for user ${userId}`
    );

    if (userRecipes && userRecipes.length > 0) {
      console.log("Recipe details:");
      userRecipes.forEach((recipe, index) => {
        console.log(`  ${index + 1}. "${recipe.title}" (ID: ${recipe.id})`);
        console.log(`     Created: ${recipe.created_at}`);
        console.log(`     User ID: ${recipe.user_id}`);
      });
    } else {
      console.log("🤔 No recipes found for this user");
    }

    // 3. Test the getUserRecipes service function
    console.log("\n3. Testing getUserRecipes service function...");
    const serviceRecipes = await getUserRecipes(userId);
    console.log(`📱 Service returned ${serviceRecipes.length} recipes`);

    if (serviceRecipes.length > 0) {
      console.log("Service recipe details:");
      serviceRecipes.forEach((recipe, index) => {
        console.log(`  ${index + 1}. "${recipe.title}"`);
        console.log(`     ID: ${recipe.id}`);
        console.log(`     Author: ${recipe.author || "N/A"}`);
        console.log(`     Source: ${recipe.sourceUrl || "N/A"}`);
        console.log(`     Tags: [${recipe.tags?.join(", ") || "none"}]`);
      });
    }

    // 4. Compare database vs service results
    console.log("\n4. Comparing results...");
    const dbCount = userRecipes?.length || 0;
    const serviceCount = serviceRecipes.length;

    if (dbCount === serviceCount) {
      console.log("✅ Database and service counts match");
    } else {
      console.log(
        `⚠️ Mismatch: DB has ${dbCount} recipes, service returns ${serviceCount}`
      );
    }

    console.log("\n🎯 Debug complete!");

    return {
      connection: true,
      userRecipes: userRecipes || [],
      serviceRecipes,
      counts: { database: dbCount, service: serviceCount },
    };
  } catch (error) {
    console.error("💥 Debug failed:", error);
    return {
      connection: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

// Usage:
// import { debugRecipeLoading } from '@/scripts/debug-recipes';
// await debugRecipeLoading('your-user-id-here');

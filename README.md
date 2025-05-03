# Umami Recipe App

A mobile app for managing recipes, built with Expo and Supabase.

## Features

- Authentication with email & password
- User profiles with avatars
- Recipe management

## Database Schema

To set up the database schema for user profiles, run the following SQL in your Supabase SQL editor:

```sql
-- Create a table for public profiles
CREATE TABLE profiles (
  id UUID REFERENCES auth.users NOT NULL PRIMARY KEY,
  updated_at TIMESTAMP WITH TIME ZONE,
  username TEXT UNIQUE,
  avatar_url TEXT,
  website TEXT
);

-- Create a function to handle new user signup
CREATE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, username, avatar_url, website, updated_at)
  VALUES (new.id, new.raw_user_meta_data->>'username', new.raw_user_meta_data->>'avatar_url', new.raw_user_meta_data->>'website', now());
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a trigger to automatically create a profile entry when a user signs up
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- Set up Storage for profile photos
INSERT INTO storage.buckets (id, name) VALUES ('avatars', 'avatars');
CREATE POLICY "Avatar images are publicly accessible." ON storage.objects FOR SELECT USING (bucket_id = 'avatars');
CREATE POLICY "Anyone can upload an avatar." ON storage.objects FOR INSERT USING (bucket_id = 'avatars');
CREATE POLICY "Users can update their own avatar." ON storage.objects FOR UPDATE USING (bucket_id = 'avatars' AND auth.uid() = owner);
CREATE POLICY "Users can delete their own avatar." ON storage.objects FOR DELETE USING (bucket_id = 'avatars' AND auth.uid() = owner);
```

## Setup

1. Create a Supabase project and run the SQL above
2. Set up environment variables in `.env.local`:
   ```
   EXPO_PUBLIC_SUPABASE_URL=your-supabase-url
   EXPO_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
   ```
3. Run `npm install`
4. Run `npx expo start`

## Technologies Used

- React Native & Expo
- Supabase (auth, database, storage)
- Typescript

# Welcome to your Expo app 👋

This is an [Expo](https://expo.dev) project created with [`create-expo-app`](https://www.npmjs.com/package/create-expo-app).

## Get started

1. Install dependencies

   ```bash
   npm install
   ```

2. Start the app

   ```bash
    npx expo start
   ```

In the output, you'll find options to open the app in a

- [development build](https://docs.expo.dev/develop/development-builds/introduction/)
- [Android emulator](https://docs.expo.dev/workflow/android-studio-emulator/)
- [iOS simulator](https://docs.expo.dev/workflow/ios-simulator/)
- [Expo Go](https://expo.dev/go), a limited sandbox for trying out app development with Expo

You can start developing by editing the files inside the **app** directory. This project uses [file-based routing](https://docs.expo.dev/router/introduction).

## Get a fresh project

When you're ready, run:

```bash
npm run reset-project
```

This command will move the starter code to the **app-example** directory and create a blank **app** directory where you can start developing.

## Learn more

To learn more about developing your project with Expo, look at the following resources:

- [Expo documentation](https://docs.expo.dev/): Learn fundamentals, or go into advanced topics with our [guides](https://docs.expo.dev/guides).
- [Learn Expo tutorial](https://docs.expo.dev/tutorial/introduction/): Follow a step-by-step tutorial where you'll create a project that runs on Android, iOS, and the web.

## Join the community

Join our community of developers creating universal apps.

- [Expo on GitHub](https://github.com/expo/expo): View our open source platform and contribute.
- [Discord community](https://chat.expo.dev): Chat with Expo users and ask questions.

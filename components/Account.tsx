import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import { StyleSheet, View, Alert, Text, TextInput } from "react-native";
import { Button } from "react-native";
import { Session } from "@supabase/supabase-js";
import Avatar from "./Avatar";

export default function Account({ session }: { session: Session }) {
  const [loading, setLoading] = useState(true);
  const [username, setUsername] = useState("");
  const [website, setWebsite] = useState("");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

  useEffect(() => {
    if (session) getProfile();
  }, [session]);

  async function getProfile() {
    try {
      setLoading(true);
      if (!session?.user) throw new Error("No user on the session!");

      const { data, error, status } = await supabase
        .from("profiles")
        .select(`username, website, avatar_url`)
        .eq("id", session?.user.id)
        .single();

      if (error && status !== 406) {
        throw error;
      }

      if (data) {
        setUsername(data.username);
        setWebsite(data.website);
        setAvatarUrl(data.avatar_url);
      }
    } catch (error) {
      if (error instanceof Error) {
        Alert.alert(error.message);
      }
    } finally {
      setLoading(false);
    }
  }

  async function updateProfile({
    username,
    website,
    avatar_url,
  }: {
    username: string;
    website: string;
    avatar_url: string | null;
  }) {
    try {
      setLoading(true);
      if (!session?.user) throw new Error("No user on the session!");

      const updates = {
        id: session?.user.id,
        username,
        website,
        avatar_url,
        updated_at: new Date(),
      };

      const { error } = await supabase.from("profiles").upsert(updates);

      if (error) {
        throw error;
      }
      Alert.alert("Profile updated!");
    } catch (error) {
      if (error instanceof Error) {
        Alert.alert(error.message);
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Your Profile</Text>

      <View style={styles.avatarContainer}>
        <Avatar
          size={200}
          url={avatarUrl}
          onUpload={(url: string) => {
            setAvatarUrl(url);
            updateProfile({ username, website, avatar_url: url });
          }}
        />
      </View>

      <View style={styles.formGroup}>
        <Text style={styles.label}>Email</Text>
        <Text style={styles.value}>{session?.user?.email}</Text>
      </View>

      <View style={styles.formGroup}>
        <Text style={styles.label}>Username</Text>
        <TextInput
          style={styles.input}
          value={username || ""}
          onChangeText={(text) => setUsername(text)}
          placeholder="Enter a username"
        />
      </View>

      <View style={styles.formGroup}>
        <Text style={styles.label}>Website</Text>
        <TextInput
          style={styles.input}
          value={website || ""}
          onChangeText={(text) => setWebsite(text)}
          placeholder="Enter your website"
        />
      </View>

      <View style={styles.buttonContainer}>
        <Button
          title={loading ? "Loading..." : "Update Profile"}
          onPress={() =>
            updateProfile({ username, website, avatar_url: avatarUrl })
          }
          disabled={loading}
        />
      </View>

      <View style={[styles.buttonContainer, styles.signOutButton]}>
        <Button
          title="Sign Out"
          onPress={() => supabase.auth.signOut()}
          color="#ff3b30"
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: "#fff",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 20,
    textAlign: "center",
  },
  avatarContainer: {
    alignItems: "center",
    marginBottom: 30,
  },
  formGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: "600",
    color: "#555",
    marginBottom: 8,
  },
  value: {
    fontSize: 16,
    color: "#333",
    paddingVertical: 10,
  },
  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
  },
  buttonContainer: {
    marginVertical: 10,
  },
  signOutButton: {
    marginTop: 30,
  },
});

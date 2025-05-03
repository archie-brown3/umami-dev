import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Switch,
  ScrollView,
} from "react-native";
import { useState } from "react";
import { Ionicons } from "@expo/vector-icons";

export default function SettingsScreen() {
  const [darkMode, setDarkMode] = useState(false);
  const [notifications, setNotifications] = useState(true);

  return (
    <ScrollView style={styles.container}>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>App Preferences</Text>

        <View style={styles.settingItem}>
          <View style={styles.settingInfo}>
            <Ionicons name="moon-outline" size={22} color="#333" />
            <Text style={styles.settingText}>Dark Mode</Text>
          </View>
          <Switch
            value={darkMode}
            onValueChange={setDarkMode}
            trackColor={{ false: "#ccc", true: "#8AB39F" }}
            thumbColor="#fff"
          />
        </View>

        <View style={styles.settingItem}>
          <View style={styles.settingInfo}>
            <Ionicons name="notifications-outline" size={22} color="#333" />
            <Text style={styles.settingText}>Notifications</Text>
          </View>
          <Switch
            value={notifications}
            onValueChange={setNotifications}
            trackColor={{ false: "#ccc", true: "#8AB39F" }}
            thumbColor="#fff"
          />
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Account</Text>

        <TouchableOpacity style={styles.settingButton}>
          <View style={styles.settingInfo}>
            <Ionicons name="person-outline" size={22} color="#333" />
            <Text style={styles.settingText}>Profile Information</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#999" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.settingButton}>
          <View style={styles.settingInfo}>
            <Ionicons name="key-outline" size={22} color="#333" />
            <Text style={styles.settingText}>Change Password</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#999" />
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Support</Text>

        <TouchableOpacity style={styles.settingButton}>
          <View style={styles.settingInfo}>
            <Ionicons name="help-circle-outline" size={22} color="#333" />
            <Text style={styles.settingText}>FAQ</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#999" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.settingButton}>
          <View style={styles.settingInfo}>
            <Ionicons name="mail-outline" size={22} color="#333" />
            <Text style={styles.settingText}>Contact Support</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#999" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.settingButton}>
          <View style={styles.settingInfo}>
            <Ionicons name="document-text-outline" size={22} color="#333" />
            <Text style={styles.settingText}>Terms and Conditions</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#999" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.settingButton}>
          <View style={styles.settingInfo}>
            <Ionicons name="lock-closed-outline" size={22} color="#333" />
            <Text style={styles.settingText}>Privacy Policy</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#999" />
        </TouchableOpacity>
      </View>

      <TouchableOpacity style={styles.logoutButton}>
        <Text style={styles.logoutText}>Log Out</Text>
      </TouchableOpacity>

      <Text style={styles.versionText}>Version 1.0.0</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    padding: 16,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 16,
  },
  settingItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  settingButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  settingInfo: {
    flexDirection: "row",
    alignItems: "center",
  },
  settingText: {
    fontSize: 16,
    marginLeft: 12,
    color: "#333",
  },
  logoutButton: {
    backgroundColor: "#f9f9f9",
    padding: 16,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 8,
    marginBottom: 20,
  },
  logoutText: {
    color: "#E57373",
    fontSize: 16,
    fontWeight: "600",
  },
  versionText: {
    textAlign: "center",
    color: "#999",
    marginBottom: 30,
  },
});

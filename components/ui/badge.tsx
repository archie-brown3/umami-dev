import React from "react";
import { View, Text, StyleSheet, ViewProps, TextProps } from "react-native";

interface BadgeProps extends ViewProps {
  children: React.ReactNode;
}

export const Badge: React.FC<BadgeProps> = ({ children, style, ...props }) => {
  return (
    <View
      style={[
        {
          backgroundColor: "#f3f4f6",
          paddingHorizontal: 8,
          paddingVertical: 4,
          borderRadius: 4,
        },
        style,
      ]}
      {...props}
    >
      <Text
        style={{
          fontSize: 12,
          color: "#374151",
        }}
      >
        {children}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    alignSelf: "flex-start",
    borderRadius: 12,
    paddingVertical: 2,
    paddingHorizontal: 8,
    backgroundColor: "#E0E7FF",
    marginRight: 4,
    marginBottom: 4,
  },
  text: {
    fontSize: 12,
    fontWeight: "600",
    color: "#3730A3",
  },
});

export default Badge;

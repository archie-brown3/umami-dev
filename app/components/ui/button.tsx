import React from "react";
import { TouchableOpacity, Text, ViewProps, TextProps } from "react-native";

interface ButtonProps extends ViewProps {
  children: React.ReactNode;
  onPress?: () => void;
  variant?: "primary" | "secondary" | "ghost";
}

export const Button: React.FC<ButtonProps> = ({
  children,
  onPress,
  variant = "primary",
  style,
  ...props
}) => {
  const getButtonStyle = () => {
    switch (variant) {
      case "secondary":
        return {
          backgroundColor: "#f3f4f6",
          borderWidth: 1,
          borderColor: "#d1d5db",
        };
      case "ghost":
        return {
          backgroundColor: "transparent",
        };
      default:
        return {
          backgroundColor: "#3b82f6",
        };
    }
  };

  const getTextStyle = () => {
    switch (variant) {
      case "secondary":
        return {
          color: "#374151",
        };
      case "ghost":
        return {
          color: "#3b82f6",
        };
      default:
        return {
          color: "white",
        };
    }
  };

  return (
    <TouchableOpacity
      onPress={onPress}
      style={[
        {
          paddingHorizontal: 16,
          paddingVertical: 8,
          borderRadius: 6,
          alignItems: "center",
          justifyContent: "center",
        },
        getButtonStyle(),
        style,
      ]}
      {...props}
    >
      <Text
        style={[
          {
            fontSize: 14,
            fontWeight: "500",
          },
          getTextStyle(),
        ]}
      >
        {children}
      </Text>
    </TouchableOpacity>
  );
};

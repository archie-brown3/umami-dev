import React from "react";
import { View, Text, StyleSheet, ViewProps, TextProps } from "react-native";

interface CardProps extends ViewProps {
  children: React.ReactNode;
}

interface CardTitleProps extends TextProps {
  children: React.ReactNode;
}

export const Card: React.FC<CardProps> = ({ children, style, ...props }) => {
  return (
    <View
      style={[
        {
          backgroundColor: "white",
          borderRadius: 8,
          padding: 16,
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.1,
          shadowRadius: 4,
          elevation: 2,
        },
        style,
      ]}
      {...props}
    >
      {children}
    </View>
  );
};

export const CardHeader: React.FC<CardProps> = ({
  children,
  style,
  ...props
}) => {
  return (
    <View
      style={[
        {
          paddingBottom: 16,
        },
        style,
      ]}
      {...props}
    >
      {children}
    </View>
  );
};

export const CardContent: React.FC<CardProps> = ({
  children,
  style,
  ...props
}) => {
  return (
    <View
      style={[
        {
          paddingTop: 16,
        },
        style,
      ]}
      {...props}
    >
      {children}
    </View>
  );
};

export const CardTitle: React.FC<CardTitleProps> = ({
  children,
  style,
  ...props
}) => {
  return (
    <Text
      style={[
        {
          fontSize: 18,
          fontWeight: "600",
        },
        style,
      ]}
      {...props}
    >
      {children}
    </Text>
  );
};

export const CardFooter: React.FC<ViewProps> = ({
  style,
  children,
  ...props
}) => (
  <View style={[styles.footer, style]} {...props}>
    {children}
  </View>
);

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#fff",
    borderRadius: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
    marginVertical: 8,
    marginHorizontal: 4,
    padding: 0,
  },
  header: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  content: {
    padding: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1F2937",
  },
  footer: {
    padding: 12,
    borderTopWidth: 1,
    borderTopColor: "#F3F4F6",
    flexDirection: "row",
    justifyContent: "flex-end",
    alignItems: "center",
  },
});

export default Card;

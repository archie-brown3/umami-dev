import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { Svg, Path, Circle, Line } from "react-native-svg";

interface IconProps {
  size?: number;
  color?: string;
  className?: string;
  style?: any;
}

// Basic icon component that renders SVG paths
const IconBase = ({
  children,
  size = 24,
  color = "currentColor",
  style,
}: IconProps & { children: React.ReactNode }) => {
  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      style={style}
    >
      {children}
    </Svg>
  );
};

// Icon components
export const LogOut = (props: IconProps) => (
  <IconBase {...props}>
    <Path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
    <Path d="M16 17l5-5-5-5" />
    <Line x1={21} y1={12} x2={9} y2={12} />
  </IconBase>
);

export const Settings = (props: IconProps) => (
  <IconBase {...props}>
    <Path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
    <Circle cx={12} cy={12} r={3} />
  </IconBase>
);

export const User = (props: IconProps) => (
  <IconBase {...props}>
    <Path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
    <Circle cx={12} cy={7} r={4} />
  </IconBase>
);

export const Crown = (props: IconProps) => (
  <IconBase {...props}>
    <Path d="m2 4 3 12h14l3-12-6 7-4-7-4 7-6-7z" />
    <Path d="M3 4c0 0 2.4 6.6 3 8h12c.6-1.4 3-8 3-8" />
  </IconBase>
);

export const Check = (props: IconProps) => (
  <IconBase {...props}>
    <Path d="M20 6 9 17l-5-5" />
  </IconBase>
);

export const ChevronsUpDown = (props: IconProps) => (
  <IconBase {...props}>
    <Path d="m7 15 5 5 5-5" />
    <Path d="m7 9 5-5 5 5" />
  </IconBase>
);

export const Plus = (props: IconProps) => (
  <IconBase {...props}>
    <Line x1={12} y1={5} x2={12} y2={19} />
    <Line x1={5} y1={12} x2={19} y2={12} />
  </IconBase>
);

export const Search = (props: IconProps) => (
  <IconBase {...props}>
    <Circle cx={11} cy={11} r={8} />
    <Path d="m21 21-4.3-4.3" />
  </IconBase>
);

export const Trash = (props: IconProps) => (
  <IconBase {...props}>
    <Path d="M3 6h18" />
    <Path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
    <Path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
  </IconBase>
);

export const Sparkles = (props: IconProps) => (
  <IconBase {...props}>
    <Path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z" />
  </IconBase>
);

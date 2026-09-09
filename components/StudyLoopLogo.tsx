import React from "react";
import { View } from "react-native";
import Svg, { Path, Defs, LinearGradient, Stop, Rect } from "react-native-svg";

interface StudyLoopLogoProps {
  size?: number;
  variant?: "badge" | "iconOnly";
}

export function StudyLoopLogo({ size = 36, variant = "badge" }: StudyLoopLogoProps) {
  if (variant === "iconOnly") {
    return (
      <View style={{ width: size, height: size, alignItems: "center", justifyContent: "center" }}>
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
          <Path
            d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"
            stroke="#0284c7"
            strokeWidth="2.3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <Path
            d="M12 5 9.04 7.96a2.17 2.17 0 0 0 0 3.08c.82.82 2.13.85 3 .07l2.07-1.9a2.82 2.82 0 0 1 3.79 0l2.96 2.66"
            stroke="#0284c7"
            strokeWidth="2.3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <Path d="m18 15-2-2" stroke="#0284c7" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round" />
          <Path d="m15 18-2-2" stroke="#0284c7" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round" />
        </Svg>
      </View>
    );
  }

  return (
    <View style={{ width: size, height: size, alignItems: "center", justifyContent: "center" }}>
      <Svg width={size} height={size} viewBox="0 0 44 44" fill="none">
        <Defs>
          <LinearGradient id="m_heart_grad" x1="0" y1="44" x2="44" y2="0" gradientUnits="userSpaceOnUse">
            <Stop offset="0%" stopColor="#0284c7" />
            <Stop offset="45%" stopColor="#0ea5e9" />
            <Stop offset="100%" stopColor="#14b8a6" />
          </LinearGradient>
        </Defs>
        <Rect width="44" height="44" rx={12} fill="url(#m_heart_grad)" />
        <Path
          d="M29 23c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 26.5 12c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 12 17.5c0 2.3 1.5 4.05 3 5.5l7 7Z"
          stroke="#ffffff"
          strokeWidth="2.4"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <Path
          d="M22 14 19.04 16.96a2.17 2.17 0 0 0 0 3.08c.82.82 2.13.85 3 .07l2.07-1.9a2.82 2.82 0 0 1 3.79 0l2.96 2.66"
          stroke="#ffffff"
          strokeWidth="2.4"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <Path d="m28 24-2-2" stroke="#ffffff" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
        <Path d="m25 27-2-2" stroke="#ffffff" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
      </Svg>
    </View>
  );
}

export default StudyLoopLogo;

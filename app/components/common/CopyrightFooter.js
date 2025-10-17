import React from "react";
import { View, Text, Image } from "react-native";

// Reusable footer with an image on the left and copyright text on the right.
// Provide the image at app/assets/images/copyright_footer.png (or override via props).
// Usage: <CopyrightFooter />
// Props:
//   imageSource (optional) - custom image require()/uri
//   style (optional) - container style override
//   textStyle (optional) - text style override
//   imageStyle (optional) - image style override

const CopyrightFooter = ({
  imageSource = require("../../assets/images/FM_512.webp"), // fallback to existing logo if custom image not added
  style,
  textStyle,
  imageStyle,
}) => {
  return (
    <View
      className="flex flex-row items-center justify-center bg-white border-t border-gray-200 pb-4 px-2 gap-4"
      style={style}
    >
      <Image
        source={imageSource}
        resizeMode="contain"
        className="rounded-md opacity-95"
        style={[{ width: 38, height: 38 }, imageStyle]}
      />
      <View>
        <Text className="text-xs text-gray-700" style={textStyle}>
          Copyright © 2025 Redd Cherry.
        </Text>
        <Text className=" text-xs text-gray-700" style={textStyle}>
          All Rights Reserved.
        </Text>
      </View>
    </View>
  );
};

export default CopyrightFooter;

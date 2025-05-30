import React, { useState } from "react";
import { TouchableOpacity, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Icon } from "react-native-paper";

const FavoriteButton = () => {
  const [isLiked, setIsLiked] = useState(false);

  const handlePress = () => {
    setIsLiked(!isLiked);
  };

  return (
    <TouchableOpacity onPress={handlePress}>
      <Ionicons
        name={isLiked ? "heart" : "heart-outline"}
        size={30}
        color={isLiked ? "red" : "gray"}
      />
    </TouchableOpacity>
  );
};

export default FavoriteButton;

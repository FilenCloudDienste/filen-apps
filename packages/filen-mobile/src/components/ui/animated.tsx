import Animated from "react-native-reanimated"
import { withUniwind } from "uniwind"
import { memo } from "@/lib/memo"

export const AnimatedView = memo(withUniwind(Animated.View))

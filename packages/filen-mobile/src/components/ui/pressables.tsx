import { memo } from "react"
import { withUniwind } from "uniwind"
import {
	PressableOpacity as PresstoPressableOpacity,
	PressableScale as PresstoPressableScale,
	PressableWithoutFeedback as PresstoPressableWithoutFeedback,
	PressablesGroup as PresstoPressablesGroup
} from "pressto"

export const PressableOpacity = withUniwind(memo(PresstoPressableOpacity))

export const PressableScale = withUniwind(memo(PresstoPressableScale))

export const PressableWithoutFeedback = withUniwind(memo(PresstoPressableWithoutFeedback))

export const PressablesGroup = withUniwind(memo(PresstoPressablesGroup))

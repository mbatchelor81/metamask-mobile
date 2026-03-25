import React, { useRef, useEffect, useState, useCallback, ReactNode } from 'react';
import { Animated, ViewStyle, StyleProp } from 'react-native';

const TIME = 3900; // 3900/6 = 650 for each

interface FadeAnimationViewProps {
  children?: ReactNode;
  style?: StyleProp<ViewStyle>;
  animationTime?: number;
  valueToWatch?: string | number;
  onAnimationStart?: () => void;
  onAnimationEnd?: () => void;
  animateOnChange?: boolean;
}

const FadeAnimationView = ({
  children,
  style,
  animationTime = TIME,
  valueToWatch,
  onAnimationStart,
  onAnimationEnd,
  animateOnChange,
}: FadeAnimationViewProps): React.JSX.Element => {
  const fadeAnim = useRef(new Animated.Value(1)).current; // Initial value for opacity: 1
  const [value, setValue] = useState(valueToWatch);
  const [lastChildren, setLastChildren] = useState(children);
  const [isAnimating, setIsAnimating] = useState(false);

  const animationEnded = useCallback(() => {
    onAnimationEnd?.();
    setValue(valueToWatch);
    setLastChildren(children);
    setIsAnimating(false);
  }, [children, onAnimationEnd, valueToWatch]);

  const animationStarted = useCallback(() => {
    onAnimationStart?.();
  }, [onAnimationStart]);

  const animate = useCallback(() => {
    animationStarted();

    const animationParams = {
      time: animationTime / 6,
      useNativeDriver: true,
    };
    const animationValueZero = 0;
    const animationValueAlmost = 0.8;
    const animationValueFinal = 1;

    Animated.sequence([
      Animated.timing(fadeAnim, {
        toValue: animationValueZero,
        ...animationParams,
      }),
      Animated.timing(fadeAnim, {
        toValue: animationValueAlmost,
        ...animationParams,
      }),
      Animated.timing(fadeAnim, {
        toValue: animationValueZero,
        ...animationParams,
      }),
      Animated.timing(fadeAnim, {
        toValue: animationValueAlmost,
        ...animationParams,
      }),
      Animated.timing(fadeAnim, {
        toValue: animationValueZero,
        ...animationParams,
      }),
      Animated.timing(fadeAnim, {
        toValue: animationValueFinal,
        ...animationParams,
      }),
    ]).start(() => {
      animationEnded();
    });
  }, [animationEnded, animationStarted, animationTime, fadeAnim]);

  useEffect(() => {
    if (!value) {
      setValue(valueToWatch);
      return;
    }
    if (!isAnimating) {
      if (animateOnChange && valueToWatch && value && value !== valueToWatch) {
        animate();
        setIsAnimating(true);
        setValue(valueToWatch);
        return;
      }
      setLastChildren(children);
    }
  }, [animate, animateOnChange, children, isAnimating, value, valueToWatch]);

  return (
    <Animated.View // Special animatable View
      style={{
        ...(style as object),
        opacity: fadeAnim, // Bind opacity to animated value
      }}
      pointerEvents={isAnimating ? 'none' : undefined}
    >
      {isAnimating ? lastChildren : children}
    </Animated.View>
  );
};

export default FadeAnimationView;

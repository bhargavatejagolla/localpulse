import React, { useEffect, useRef } from 'react';
import { StyleSheet, Animated, Dimensions, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';

const { width, height } = Dimensions.get('window');

interface AnimatedBackgroundProps {
  colors: string[];
  style?: 'lightfall' | 'gridscan';
}

export const AnimatedBackground: React.FC<AnimatedBackgroundProps> = ({
  colors,
  style = 'lightfall',
}) => {
  const anim1 = useRef(new Animated.Value(0)).current;
  const anim2 = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const createAnimation = (anim: Animated.Value, duration: number, toValue: number = 1) => {
      return Animated.loop(
        Animated.sequence([
          Animated.timing(anim, {
            toValue,
            duration,
            useNativeDriver: true,
          }),
          Animated.timing(anim, {
            toValue: 0,
            duration,
            useNativeDriver: true,
          }),
        ])
      );
    };

    Animated.parallel([
      createAnimation(anim1, 30000), // Very slow
      createAnimation(anim2, 45000), // Very slow
    ]).start();
  }, [anim1, anim2]);

  const translateY1 = anim1.interpolate({
    inputRange: [0, 1],
    outputRange: [-height * 0.2, height * 0.2],
  });

  const translateX2 = anim2.interpolate({
    inputRange: [0, 1],
    outputRange: [-width * 0.5, width * 0.5],
  });

  const scale = anim1.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.3],
  });

  return (
    <View style={[styles.container, { opacity: 0.15 }]}>
      {style === 'lightfall' ? (
        // Lightfall Effect: Flowing colorful waves
        <View style={StyleSheet.absoluteFill}>
          <LinearGradient
            colors={['#0B1120', '#111827']}
            style={StyleSheet.absoluteFill}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          />
          <Animated.View
            style={[
              styles.orb,
              {
                backgroundColor: colors[0] || '#166534', // Emerald
                transform: [{ translateY: translateY1 }, { scale }],
                opacity: 0.3,
                top: -height * 0.2,
                left: -width * 0.2,
              },
            ]}
          />
          <Animated.View
            style={[
              styles.orb,
              {
                backgroundColor: colors[1] || '#22C55E', // Neon green
                transform: [{ translateX: translateX2 }, { scale }],
                opacity: 0.2,
                bottom: -height * 0.2,
                right: -width * 0.2,
              },
            ]}
          />
        </View>
      ) : (
        // GridScan Effect: Darker, cyber aesthetic
        <View style={StyleSheet.absoluteFill}>
          <LinearGradient
            colors={['#0f0c29', '#302b63', '#24243e']}
            style={StyleSheet.absoluteFill}
          />
          <Animated.View
            style={[
              styles.orb,
              {
                backgroundColor: colors[1] || '#FF9FFC', 
                transform: [{ translateY: translateY1 }],
                opacity: 0.3,
                width: width * 2,
                height: 100,
                borderRadius: 0,
                top: '40%',
                left: -width / 2,
              },
            ]}
          />
          <Animated.View
            style={[
              styles.orb,
              {
                backgroundColor: colors[0] || '#2F293A',
                transform: [{ translateX: translateX2 }],
                opacity: 0.4,
                width: 100,
                height: height * 2,
                borderRadius: 0,
                top: -height / 2,
                left: '60%',
              },
            ]}
          />
        </View>
      )}
      
      {/* Melt the orbs together to create fluid gradients, max blur */}
      <BlurView intensity={100} tint="dark" style={StyleSheet.absoluteFill} />

      {/* Heavy vignette overlay to make it look premium */}
      <LinearGradient
        colors={['transparent', 'rgba(0,0,0,0.6)']}
        style={StyleSheet.absoluteFill}
        pointerEvents="none"
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#000',
    overflow: 'hidden',
  },
  orb: {
    position: 'absolute',
    width: width * 1.5,
    height: width * 1.5,
    borderRadius: width,
  },
});

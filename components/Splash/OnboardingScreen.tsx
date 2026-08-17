import React, { useState, useRef } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  Dimensions,
  TouchableOpacity,
} from 'react-native';
import { ChevronRight } from 'lucide-react-native';
import Animated, {
  useSharedValue,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  interpolate,
} from 'react-native-reanimated';
import Colors from '@/constants/Colors';
import Layout from '@/constants/Layout';

const slides = [
  {
    id: '1',
    title: 'Booking a ride',
    description:
      'Book your ride with ease. Select your destination and find the nearest driver.',
  },
  {
    id: '2',
    title: 'Made easy',
    description:
      'Our app makes ride-hailing simple and efficient. Just a few taps to get on your way.',
  },
  {
    id: '3',
    title: 'In three steps',
    description:
      'Book, pay, and ride - that\'s all it takes to get where you need to go safely and comfortably.',
  },
];

interface OnboardingScreenProps {
  onFinish: () => void;
}

export default function OnboardingScreen({ onFinish }: OnboardingScreenProps) {
  const { width } = Dimensions.get('window');
  const scrollRef = useRef<Animated.ScrollView>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const translateX = useSharedValue(0);

  // Create animated styles for each dot outside the render loop
  const dotStyles = slides.map((_, index) => {
    return useAnimatedStyle(() => {
      const opacity = interpolate(
        translateX.value,
        [(index - 1) * width, index * width, (index + 1) * width],
        [0.5, 1, 0.5]
      );
      const scale = interpolate(
        translateX.value,
        [(index - 1) * width, index * width, (index + 1) * width],
        [1, 1.25, 1]
      );
      const dotWidth = interpolate(
        translateX.value,
        [(index - 1) * width, index * width, (index + 1) * width],
        [8, 20, 8]
      );

      return {
        opacity,
        transform: [{ scale }],
        width: dotWidth,
      };
    });
  });

  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      translateX.value = event.contentOffset.x;
    },
  });

  const handleNext = () => {
    if (activeIndex < slides.length - 1) {
      const nextIndex = activeIndex + 1;
      setActiveIndex(nextIndex);
      scrollRef.current?.scrollTo({ x: nextIndex * width, animated: true });
    } else {
      onFinish();
    }
  };

  return (
    <View style={styles.container}>
      <Animated.ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={scrollHandler}
        scrollEventThrottle={16}
        decelerationRate="fast"
        snapToInterval={width}
        snapToAlignment="center"
        onMomentumScrollEnd={(e) => {
          const newIndex = Math.round(e.nativeEvent.contentOffset.x / width);
          setActiveIndex(newIndex);
        }}
      >
        {slides.map((slide, index) => {
          const isEvenSlide = index % 2 === 0;

          return (
            <View key={slide.id} style={[styles.slide, { width }]}>
              <View
                style={[
                  styles.imageContainer,
                  isEvenSlide ? styles.waveTop : styles.waveBottom,
                ]}
              >
                <View style={styles.imagePlaceholder} />
              </View>

              <View style={styles.content}>
                <Text style={styles.title}>{slide.title}</Text>
                <Text style={styles.description}>{slide.description}</Text>
              </View>
            </View>
          );
        })}
      </Animated.ScrollView>

      <View style={styles.footer}>
        <View style={styles.pagination}>
          {slides.map((_, index) => (
            <Animated.View
              key={index}
              style={[
                styles.dot,
                index === activeIndex && styles.activeDot,
                dotStyles[index],
              ]}
            />
          ))}
        </View>

        <TouchableOpacity
          style={styles.nextButton}
          onPress={handleNext}
          activeOpacity={0.8}
        >
          <ChevronRight size={24} color={Colors.secondary.default} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.secondary.default,
  },
  slide: {
    flex: 1,
  },
  imageContainer: {
    height: '60%',
    backgroundColor: Colors.primary.default,
    position: 'relative',
    overflow: 'hidden',
  },
  waveTop: {
    borderBottomLeftRadius: 100,
  },
  waveBottom: {
    borderTopRightRadius: 100,
  },
  imagePlaceholder: {
    width: '80%',
    height: '60%',
    alignSelf: 'center',
    marginTop: '15%',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: Layout.borderRadius.m,
  },
  content: {
    padding: Layout.spacing.xl,
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.neutral.white,
    marginBottom: Layout.spacing.m,
    textAlign: 'center',
  },
  description: {
    fontSize: 16,
    color: Colors.neutral.light,
    textAlign: 'center',
    lineHeight: 24,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Layout.spacing.xl,
    paddingBottom: Layout.spacing.xl,
  },
  pagination: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dot: {
    height: 8,
    width: 8,
    borderRadius: 4,
    backgroundColor: Colors.neutral.light,
    marginRight: Layout.spacing.s,
  },
  activeDot: {
    backgroundColor: Colors.primary.default,
  },
  nextButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: Colors.primary.default,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
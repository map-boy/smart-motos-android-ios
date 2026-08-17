"use client"

import React, { useEffect } from "react"
import { StyleSheet, View, Text, TouchableOpacity, Animated, SafeAreaView, StatusBar, Platform } from "react-native"
import Colors from "@/constants/Colors"
import Layout from "@/constants/Layout"
import Button from "@/components/UI/Button"
import { Bike, Car } from "lucide-react-native"
import { LinearGradient } from "expo-linear-gradient"

interface SplashScreenProps {
  onPassengerPress: () => void
  onDriverPress: () => void
}

export default function SplashScreen({ onPassengerPress, onDriverPress }: SplashScreenProps) {
  // Animation values
  const fadeAnim = React.useRef(new Animated.Value(0)).current
  const slideAnim = React.useRef(new Animated.Value(50)).current
  const scaleAnim = React.useRef(new Animated.Value(0.9)).current

  useEffect(() => {
    // Run animations when component mounts
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
    ]).start()
  }, [])

  return (
    <>
      <StatusBar barStyle="light-content" backgroundColor={Colors.primary.dark} />
      <SafeAreaView style={styles.safeArea}>
        <LinearGradient colors={[Colors.primary.dark, Colors.primary.default]} style={styles.container}>
          <View style={styles.content}>
            <Animated.View
              style={[
                styles.logoContainer,
                {
                  opacity: fadeAnim,
                  transform: [{ translateY: slideAnim }, { scale: scaleAnim }],
                },
              ]}
            >
              <View style={styles.logoBox}>
                <Text style={styles.logoIcon}>🚗</Text>
              </View>
              <Text style={styles.appName}>Smart Motos</Text>
              <Text style={styles.tagline}>Your ride, your way</Text>
            </Animated.View>

            <View style={styles.decorationCircle} />
            <View style={styles.decorationCircleSmall} />

            <Animated.View
              style={[
                styles.buttonsContainer,
                {
                  opacity: fadeAnim,
                  transform: [{ translateY: slideAnim }],
                },
              ]}
            >
              <Button
                title="Ride as Passenger"
                onPress={onPassengerPress}
                variant="primary"
                size="large"
                style={styles.button}
                icon={<Car size={20} color={Colors.neutral.white} />}
              />
              <Button
                title="Ride as a Driver"
                onPress={onDriverPress}
                variant="primary"
                size="large"
                style={styles.button}
                icon={<Bike size={20} color={Colors.neutral.white} />}
              />
              <TouchableOpacity style={styles.driverLink} onPress={onDriverPress} activeOpacity={0.7}>
                <Text style={styles.driverLinkText}>
                  Want to earn money driving? <Text style={styles.driverLinkHighlight}>Join as driver</Text>
                </Text>
              </TouchableOpacity>
            </Animated.View>
          </View>
        </LinearGradient>
      </SafeAreaView>
    </>
  )
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.primary.dark,
  },
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    padding: Layout.spacing.xl,
    justifyContent: "space-between",
    paddingTop: Platform.OS === "android" ? (StatusBar.currentHeight ?? 0) + 40 : "15%",
    paddingBottom: "10%",
    position: "relative",
    overflow: "hidden",
  },
  logoContainer: {
    alignItems: "center",
    justifyContent: "center",
    marginBottom: "10%",
  },
  logoBox: {
    width: 90,
    height: 90,
    backgroundColor: Colors.neutral.white,
    borderRadius: Layout.borderRadius.xl,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: Layout.spacing.m,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  logoIcon: {
    fontSize: 46,
  },
  appName: {
    fontSize: 36,
    fontWeight: "800",
    color: Colors.neutral.white,
    textAlign: "center",
    letterSpacing: 0.5,
    textShadowColor: "rgba(0, 0, 0, 0.2)",
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  tagline: {
    fontSize: 16,
    color: Colors.neutral.white,
    opacity: 0.8,
    marginTop: Layout.spacing.xs,
    fontWeight: "400",
  },
  buttonsContainer: {
    width: "100%",
    alignItems: "center",
    marginTop: "auto",
  },
  button: {
    marginVertical: Layout.spacing.s,
    width: "100%",
    borderRadius: Layout.borderRadius.m,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  driverLink: {
    marginTop: Layout.spacing.l,
    padding: Layout.spacing.s,
  },
  driverLinkText: {
    color: Colors.neutral.white,
    fontSize: 15,
    textAlign: "center",
  },
  driverLinkHighlight: {
    color: Colors.neutral.white,
    fontWeight: "700",
    textDecorationLine: "underline",
  },
  decorationCircle: {
    position: "absolute",
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    top: -100,
    right: -100,
  },
  decorationCircleSmall: {
    position: "absolute",
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: "rgba(255, 255, 255, 0.07)",
    bottom: -30,
    left: -50,
  },
})

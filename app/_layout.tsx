import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useEffect, useRef, useState } from "react";
import { Animated, Easing, StyleSheet, Text, View } from "react-native";

SplashScreen.preventAutoHideAsync();

// ─── Particule animée (feuille/bulle)
function Particle({ delay, startX, size, color }: { delay: number; startX: number; size: number; color: string }) {
  const translateY = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const rotate = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(0.4)).current;

  useEffect(() => {
    const anim = Animated.loop(
      Animated.sequence([
        Animated.delay(delay),
        Animated.parallel([
          Animated.timing(opacity, { toValue: 0.85, duration: 400, useNativeDriver: true }),
          Animated.timing(scale, { toValue: 1, duration: 400, useNativeDriver: true }),
        ]),
        Animated.parallel([
          Animated.timing(translateY, {
            toValue: -680,
            duration: 3200,
            easing: Easing.out(Easing.quad),
            useNativeDriver: true,
          }),
          Animated.timing(rotate, {
            toValue: 1,
            duration: 3200,
            useNativeDriver: true,
          }),
          Animated.sequence([
            Animated.delay(2000),
            Animated.timing(opacity, { toValue: 0, duration: 1000, useNativeDriver: true }),
          ]),
        ]),
      ])
    );
    anim.start();
    return () => anim.stop();
  }, []);

  const rotateDeg = rotate.interpolate({ inputRange: [0, 1], outputRange: ["0deg", "360deg"] });

  return (
    <Animated.View
      style={{
        position: "absolute",
        bottom: 60,
        left: startX,
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: color,
        opacity,
        transform: [{ translateY }, { rotate: rotateDeg }, { scale }],
      }}
    />
  );
}

// ─── Barre de progression animée
function ProgressBar({ progress }: { progress: Animated.Value }) {
  const width = progress.interpolate({ inputRange: [0, 1], outputRange: ["0%", "100%"] });
  return (
    <View style={styles.progressTrack}>
      <Animated.View style={[styles.progressFill, { width }]} />
    </View>
  );
}

// ─── Splash Screen custom
function SplashScreenView({ onDone }: { onDone: () => void }) {
  // Animations logo
  const logoScale = useRef(new Animated.Value(0.3)).current;
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const logoGlow = useRef(new Animated.Value(0)).current;

  // Animation titre
  const titleOpacity = useRef(new Animated.Value(0)).current;
  const titleTranslateY = useRef(new Animated.Value(24)).current;

  // Animation sous-titre
  const subtitleOpacity = useRef(new Animated.Value(0)).current;

  // Animation tagline
  const tagOpacity = useRef(new Animated.Value(0)).current;
  const tagScale = useRef(new Animated.Value(0.8)).current;

  // Progression
  const progress = useRef(new Animated.Value(0)).current;

  // Fond
  const bgAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Séquence principale
    Animated.sequence([
      // 1. Fond apparaît
      Animated.timing(bgAnim, { toValue: 1, duration: 300, useNativeDriver: false }),

      // 2. Logo bounce + glow
      Animated.spring(logoScale, { toValue: 1, tension: 60, friction: 6, useNativeDriver: true }),

      // 3. Titre glisse
      Animated.parallel([
        Animated.timing(logoOpacity, { toValue: 1, duration: 200, useNativeDriver: true }),
        Animated.timing(titleOpacity, { toValue: 1, duration: 500, useNativeDriver: true }),
        Animated.timing(titleTranslateY, { toValue: 0, duration: 500, easing: Easing.out(Easing.back(1.5)), useNativeDriver: true }),
      ]),

      // 4. Sous-titre
      Animated.timing(subtitleOpacity, { toValue: 1, duration: 400, useNativeDriver: true }),

      // 5. Tagline + progress
      Animated.parallel([
        Animated.timing(tagOpacity, { toValue: 1, duration: 400, useNativeDriver: true }),
        Animated.spring(tagScale, { toValue: 1, tension: 80, friction: 7, useNativeDriver: true }),
        Animated.timing(progress, { toValue: 1, duration: 1600, easing: Easing.inOut(Easing.ease), useNativeDriver: false }),
      ]),

      // 6. Glow pulse du logo
      Animated.loop(
        Animated.sequence([
          Animated.timing(logoGlow, { toValue: 1, duration: 700, useNativeDriver: false }),
          Animated.timing(logoGlow, { toValue: 0, duration: 700, useNativeDriver: false }),
        ]),
        { iterations: 2 }
      ),
    ]).start(() => {
      setTimeout(onDone, 200);
    });
  }, []);

  const bgColor = bgAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["#000000", "#065f46"],
  });

  const glowColor = logoGlow.interpolate({
    inputRange: [0, 1],
    outputRange: ["rgba(16,185,129,0.3)", "rgba(16,185,129,0.9)"],
  });

  const particles = [
    { delay: 200, startX: 30, size: 10, color: "rgba(167,243,208,0.7)" },
    { delay: 500, startX: 80, size: 7, color: "rgba(52,211,153,0.6)" },
    { delay: 0, startX: 150, size: 12, color: "rgba(110,231,183,0.5)" },
    { delay: 800, startX: 220, size: 8, color: "rgba(167,243,208,0.8)" },
    { delay: 300, startX: 280, size: 6, color: "rgba(16,185,129,0.6)" },
    { delay: 1000, startX: 340, size: 11, color: "rgba(52,211,153,0.5)" },
    { delay: 600, startX: 50, size: 9, color: "rgba(110,231,183,0.7)" },
    { delay: 400, startX: 310, size: 7, color: "rgba(167,243,208,0.6)" },
  ];

  return (
    <Animated.View style={[styles.splashContainer, { backgroundColor: bgColor }]}>
      {/* Particules montantes */}
      {particles.map((p, i) => (
        <Particle key={i} {...p} />
      ))}

      {/* Cercle lumineux derrière le logo */}
      <Animated.View
        style={{
          position: "absolute",
          width: 180,
          height: 180,
          borderRadius: 90,
          backgroundColor: glowColor,
          alignSelf: "center",
          top: "28%",
          marginTop: -20,
        }}
      />

      {/* Logo GBA-ÉCO */}
      <Animated.View
        style={[
          styles.logoContainer,
          { opacity: logoOpacity, transform: [{ scale: logoScale }] },
        ]}>
        {/* Maison SVG stylisée via View */}
        <View style={styles.logoHouse}>
          {/* Toit */}
          <View style={styles.roofLeft} />
          <View style={styles.roofRight} />
          {/* Corps */}
          <View style={styles.houseBody}>
            {/* Fenêtre gauche */}
            <View style={styles.window} />
            {/* Porte */}
            <View style={styles.door} />
            {/* Feuille déco */}
            <Text style={styles.leafEmoji}>🌿</Text>
          </View>
        </View>
      </Animated.View>

      {/* Titre principal */}
      <Animated.Text
        style={[
          styles.splashTitle,
          {
            opacity: titleOpacity,
            transform: [{ translateY: titleTranslateY }],
          },
        ]}>
        GBA-ÉCO
      </Animated.Text>

      {/* Sous-titre */}
      <Animated.Text style={[styles.splashSubtitle, { opacity: subtitleOpacity }]}>
        HABITAT ÉCOLOGIQUE
      </Animated.Text>

      {/* Tagline */}
      <Animated.View
        style={{
          opacity: tagOpacity,
          transform: [{ scale: tagScale }],
          alignItems: "center",
          marginTop: 18,
        }}>
        <View style={styles.taglineBadge}>
          <Text style={styles.taglineText}>🏡 Trouvez votre maison idéale</Text>
        </View>
      </Animated.View>

      {/* Barre de chargement */}
      <View style={styles.progressContainer}>
        <ProgressBar progress={progress} />
        <Text style={styles.loadingText}>Chargement des logements…</Text>
      </View>

      {/* Footer */}
      <Text style={styles.splashFooter}>Côte d'Ivoire · Logements verts certifiés</Text>
    </Animated.View>
  );
}

// ─── Root Layout
export default function RootLayout() {
  const [appIsReady, setAppIsReady] = useState(false);
  const [splashDone, setSplashDone] = useState(false);

  useEffect(() => {
    // On cache le splash natif immédiatement pour afficher le nôtre
    SplashScreen.hideAsync();
  }, []);

  const handleSplashDone = () => {
    setSplashDone(true);
    setAppIsReady(true);
  };

  if (!splashDone) {
    return <SplashScreenView onDone={handleSplashDone} />;
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(tabs)" />
    </Stack>
  );
}

// ─── Styles
const styles = StyleSheet.create({
  splashContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  logoContainer: {
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 28,
    zIndex: 10,
  },
  logoHouse: {
    width: 110,
    height: 110,
    alignItems: "center",
    justifyContent: "flex-end",
  },
  roofLeft: {
    position: "absolute",
    top: 0,
    left: 12,
    width: 0,
    height: 0,
    borderStyle: "solid",
    borderLeftWidth: 43,
    borderRightWidth: 0,
    borderBottomWidth: 46,
    borderLeftColor: "transparent",
    borderRightColor: "transparent",
    borderBottomColor: "rgba(255,255,255,0.95)",
    zIndex: 2,
  },
  roofRight: {
    position: "absolute",
    top: 0,
    right: 12,
    width: 0,
    height: 0,
    borderStyle: "solid",
    borderRightWidth: 43,
    borderLeftWidth: 0,
    borderBottomWidth: 46,
    borderRightColor: "transparent",
    borderLeftColor: "transparent",
    borderBottomColor: "rgba(255,255,255,0.95)",
    zIndex: 2,
  },
  houseBody: {
    width: 80,
    height: 60,
    backgroundColor: "rgba(255,255,255,0.92)",
    borderRadius: 4,
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-around",
    paddingHorizontal: 8,
    paddingBottom: 0,
    overflow: "hidden",
  },
  window: {
    width: 18,
    height: 18,
    backgroundColor: "#34d399",
    borderRadius: 3,
    marginBottom: 18,
    borderWidth: 2,
    borderColor: "#065f46",
  },
  door: {
    width: 18,
    height: 26,
    backgroundColor: "#065f46",
    borderTopLeftRadius: 9,
    borderTopRightRadius: 9,
    marginBottom: 0,
  },
  leafEmoji: {
    position: "absolute",
    top: 4,
    right: 4,
    fontSize: 14,
  },
  splashTitle: {
    fontSize: 46,
    fontWeight: "900",
    color: "#ffffff",
    letterSpacing: 6,
    textAlign: "center",
    textShadowColor: "rgba(0,0,0,0.3)",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 8,
  },
  splashSubtitle: {
    fontSize: 13,
    color: "rgba(167,243,208,0.9)",
    letterSpacing: 4,
    fontWeight: "600",
    textAlign: "center",
    marginTop: 6,
  },
  taglineBadge: {
    backgroundColor: "rgba(255,255,255,0.18)",
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 30,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.3)",
  },
  taglineText: {
    color: "#ffffff",
    fontSize: 15,
    fontWeight: "600",
    letterSpacing: 0.5,
  },
  progressContainer: {
    position: "absolute",
    bottom: 80,
    left: 48,
    right: 48,
    alignItems: "center",
  },
  progressTrack: {
    width: "100%",
    height: 4,
    backgroundColor: "rgba(255,255,255,0.2)",
    borderRadius: 2,
    overflow: "hidden",
    marginBottom: 10,
  },
  progressFill: {
    height: "100%",
    backgroundColor: "#34d399",
    borderRadius: 2,
  },
  loadingText: {
    color: "rgba(255,255,255,0.55)",
    fontSize: 12,
    letterSpacing: 0.5,
  },
  splashFooter: {
    position: "absolute",
    bottom: 36,
    color: "rgba(255,255,255,0.35)",
    fontSize: 11,
    letterSpacing: 1,
  },
});
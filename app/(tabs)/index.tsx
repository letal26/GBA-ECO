import { FontAwesome, Ionicons, MaterialIcons } from "@expo/vector-icons";
import * as Speech from "expo-speech";
import * as Location from "expo-location";
import { useVideoPlayer, VideoView } from "expo-video";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Animated,
  Easing,
  FlatList,
  Image,
  Modal,
  PanResponder,
  Platform,
  ScrollView,
  Share,
  Text,
  TextInput,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

// ─── Types 

interface Proprietaire {
  id: string;
  nom: string;
  photo: string;
  maisons: number;
  verifie: boolean;
  note: number;
  membreDepuis: string;
}

interface Logement {
  id: string;
  quartier: string;
  pieces: string;
  prix: string;        // Prix en FCFA (chiffre sans espace, ex: "35000")
  prixNum: number;     // Prix numérique pour filtrage budget
  surface: string;
  badge: string;
  videoPexelsId: string;
  audioDescription: string;
  caracteristiques: string[];
  proprietaire: Proprietaire;
  latitude?: number;
  longitude?: number;
  likes: number;
  commentaires: number;
}

interface Reservation {
  id: string;
  logementId: string;
  nom: string;
  telephone: string;
  revenu: string;
  date: string;
  statut: "active" | "annulee";
}

// ─── Thème & Langue Context

type ThemeMode = "light" | "dark" | "green";
type AppLanguage = "fr" | "en" | "dioula";

interface AppSettings {
  theme: ThemeMode;
  language: AppLanguage;
}

const THEMES: Record<ThemeMode, { primary: string; bg: string; card: string; text: string; subtext: string; border: string; label: string; labelIcon: string }> = {
  light: {
    primary: "#065f46",
    bg: "#F9FAFB",
    card: "#ffffff",
    text: "#111827",
    subtext: "#6B7280",
    border: "#E5E7EB",
    label: "Clair",
    labelIcon: "sunny",
  },
  dark: {
    primary: "#059669",
    bg: "#111827",
    card: "#1F2937",
    text: "#F9FAFB",
    subtext: "#9CA3AF",
    border: "#374151",
    label: "Sombre",
    labelIcon: "moon",
  },
  green: {
    primary: "#065f46",
    bg: "#F0FDF4",
    card: "#ECFDF5",
    text: "#064e3b",
    subtext: "#047857",
    border: "#A7F3D0",
    label: "Éco",
    labelIcon: "leaf",
  },
};

const TRANSLATIONS: Record<AppLanguage, Record<string, string>> = {
  fr: {
    appSubtitle: "HABITAT ÉCOLOGIQUE",
    searchPlaceholder: "Quartier, type de maison…",
    listenAudio: "Écouter la description vocale",
    stopAudio: "Lecture en cours — Appuyer pour stopper",
    reserveBtn: "JE VEUX CETTE MAISON →",
    seeEquip: "▼ Voir les équipements",
    lessDetails: "▲ Moins de détails",
    noResult: "Aucun logement trouvé",
    reserve: "Réserver ce logement",
    pay: "PAYER 2 000 FCFA →",
    name: "1 · Nom et Prénom",
    phone: "2 · Numéro Mobile Money",
    income: "3 · Tranche de revenu mensuel",
    settings: "Paramètres",
    theme: "Thème d'affichage",
    language: "Langue",
    verified: "Vérifié",
    notVerified: "Non vérifié",
    okTrust: "OK, je fais confiance",
    bePrudent: "Compris, je suis prudent",
    memberSince: "Membre depuis",
    publishedHomes: "Maisons publiées",
    status: "Statut",
    verifyOwner: "VÉRIF.\nPROPRIO",
    dossierFees: "Réserver pour :",
    viaMMoney: "via Mobile Money",
    cancelResa: "Annuler ma réservation",
    backHome: "Retour à l'accueil",
    resaConfirmed: "Réservation confirmée !",
    resaCancelled: "Réservation annulée",
    refund48h: "Remboursement sous 48h",
    resaDetails: "Détails de la réservation",
    dossierNumber: "NUMÉRO DE DOSSIER",
    keepNumber: "Conservez ce numéro",
  },
  en: {
    appSubtitle: "ECO HOUSING",
    searchPlaceholder: "District, house type…",
    listenAudio: "Listen to audio description",
    stopAudio: "Playing — Tap to stop",
    reserveBtn: "I WANT THIS HOUSE →",
    seeEquip: "▼ View amenities",
    lessDetails: "▲ Less details",
    noResult: "No housing found",
    reserve: "Reserve this housing",
    pay: "PAY 2,000 FCFA →",
    name: "1 · Full Name",
    phone: "2 · Mobile Money Number",
    income: "3 · Monthly income range",
    settings: "Settings",
    theme: "Display Theme",
    language: "Language",
    verified: "Verified",
    notVerified: "Not verified",
    okTrust: "OK, I trust",
    bePrudent: "Understood, I'm careful",
    memberSince: "Member since",
    publishedHomes: "Published homes",
    status: "Status",
    verifyOwner: "VERIFY\nOWNER",
    dossierFees: "Application fee:",
    viaMMoney: "via Mobile Money",
    cancelResa: "Cancel my reservation",
    backHome: "Back to home",
    resaConfirmed: "Reservation confirmed!",
    resaCancelled: "Reservation cancelled",
    refund48h: "Refund within 48h",
    resaDetails: "Reservation details",
    dossierNumber: "DOSSIER NUMBER",
    keepNumber: "Keep this number",
  },
  dioula: {
    appSubtitle: "SO KƐLƐN",
    searchPlaceholder: "Kɔrɔbɔ, so suguya…",
    listenAudio: "Ka kumakan mɛn",
    stopAudio: "A bɛ kalan — A digi ka segin",
    reserveBtn: "NE BÉ SO IN FÉ →",
    seeEquip: "▼ Ka cogoya sɔrɔ",
    lessDetails: "▲ Kabo dɔɔni",
    noResult: "So tɛ sɔrɔ",
    reserve: "Ka so in sɔrɔ",
    pay: "KA 2 000 FCFA SANIYA →",
    name: "1 · Tɔgɔ",
    phone: "2 · Mobile Money nimɔrɔ",
    income: "3 · Warigwɛ",
    settings: "Labɛnni",
    theme: "Kibaro jateminɛ",
    language: "Kan",
    verified: "Sɛbɛnnen",
    notVerified: "Tɛ sɛbɛnnen",
    okTrust: "A ɲɛsin, ne latigɛla",
    bePrudent: "Ne faamu, ne bɛ hɛrɛ kɛ",
    memberSince: "Tun bɛ bɔ",
    publishedHomes: "Sow bɛ yɛlɛ",
    status: "Cogoya",
    verifyOwner: "SƐBƐN\nDAɲɛGɛLEW",
    dossierFees: "Dosiye warigwɛ:",
    viaMMoney: "Mobile Money fɛ",
    cancelResa: "Ka jateminɛ bali",
    backHome: "Ka segin kɔrɔfɔla la",
    resaConfirmed: "Jateminɛ dafalen!",
    resaCancelled: "Jateminɛ balinan",
    refund48h: "Warigwɛ segin 48h kɔnɔ",
    resaDetails: "Jateminɛ kunnafoniw",
    dossierNumber: "DOSIYE NIMƆRƆ",
    keepNumber: "Nimɔrɔ in mara",
  },
};

const AppSettingsContext = React.createContext<{
  settings: AppSettings;
  setSettings: (s: AppSettings) => void;
  t: (key: string) => string;
  theme: typeof THEMES["light"];
}>({
  settings: { theme: "light", language: "fr" },
  setSettings: () => {},
  t: (k) => k,
  theme: THEMES.light,
});

const useAppSettings = () => React.useContext(AppSettingsContext);

// ─── Propriétaires

const PROPRIETAIRES: Record<string, Proprietaire> = {
  p1: {
    id: "p1",
    nom: "Kouamé Arsène",
    photo: "https://api.dicebear.com/7.x/adventurer/png?seed=Arsene&skinColor=brown,darkBrown&backgroundColor=b6e3f4",
    maisons: 4,
    verifie: true,
    note: 4.8,
    membreDepuis: "2021",
  },
  p2: {
    id: "p2",
    nom: "Adjoua Bénédicte",
    photo: "https://api.dicebear.com/7.x/adventurer/png?seed=Benedicte&skinColor=brown,darkBrown&backgroundColor=ffd5dc",
    maisons: 2,
    verifie: true,
    note: 4.6,
    membreDepuis: "2022",
  },
  p3: {
    id: "p3",
    nom: "Inconnu Suspect",
    photo: "https://api.dicebear.com/7.x/adventurer/png?seed=Suspect99&skinColor=brown&backgroundColor=c0aede",
    maisons: 1,
    verifie: false,
    note: 1.9,
    membreDepuis: "2024",
  },
  p4: {
    id: "p4",
    nom: "Diabaté Moussa",
    photo: "https://api.dicebear.com/7.x/adventurer/png?seed=Moussa&skinColor=darkBrown&backgroundColor=d1d4f9",
    maisons: 7,
    verifie: true,
    note: 4.9,
    membreDepuis: "2020",
  },
};
const PEXELS_API_KEY = "A14nEcZVNI47YWKxjBmPoZAD6ysfvX3ZyhsWzsCO5k13gaptUhqKxY6D";

async function fetchDirectVideoUrl(videoId: string): Promise<string | null> {
  try {
    const response = await fetch(`https://api.pexels.com/v1/videos/videos/${videoId}`, {
      headers: {
        Authorization: PEXELS_API_KEY,
      },
    });

    if (!response.ok) {
      throw new Error(`Erreur API Pexels: ${response.status}`);
    }

    const data = await response.json();

    const mobileVideo = data.video_files.find(
      (file: any) => file.quality === "sd" || file.quality === "mobile"
    );
    
    const fallbackVideo = data.video_files[0];
    return mobileVideo ? mobileVideo.link : fallbackVideo?.link || null;
  } catch (error) {
    console.error(`Impossible de récupérer la vidéo ${videoId} :`, error);
    return null;
  }
}


// ─── Logements

const LOGEMENTS_DATA: Logement[] = [
  {
    id: "1",
    quartier: "Bouaké, Air France (Éco-Quartier)",
    pieces: "3 Pièces en Briques de Terre Comprimée",
    prix: "35 000",
    prixNum: 35000,
    surface: "65 m²",
    badge: " BTC Certifié",
    videoPexelsId: "17224631",
    latitude: 7.6939,
    longitude: -5.0308,
    likes: 142,
    commentaires: 23,
    audioDescription:
      "Bienvenue dans cette maison de trois pièces à Bouaké, dans l'Éco-Quartier Air France. " +
      "Construite entièrement en Briques de Terre Comprimée, elle offre une fraîcheur naturelle toute l'année, sans climatisation. " +
      "Surface de soixante-cinq mètres carrés, avec une cuisine équipée, un salon lumineux, deux chambres et une terrasse ombragée. " +
      "Les murs en BTC régulent l'humidité et maintiennent une température intérieure agréable même en saison chaude. " +
      "Loyer mensuel : trente-cinq mille francs CFA.",
    caracteristiques: [
      "Ventilation traversante",
      "Toiture isolante",
      "Eau pluviale récupérée",
      "Jardin 20m²",
    ],
    proprietaire: PROPRIETAIRES.p1,
  },
  {
    id: "2",
    quartier: "Bouaké, Nimbo (Bioclimatique)",
    pieces: "2 Pièces — Zéro climatisation",
    prix: "28 000",
    prixNum: 28000,
    surface: "45 m²",
    badge: " Bioclimatique",
    videoPexelsId: "7578541",
    latitude: 7.6780,
    longitude: -5.0220,
    likes: 98,
    commentaires: 11,
    audioDescription:
      "Découvrez cet appartement deux pièces à Nimbo, Bouaké, conçu selon les principes bioclimatiques. " +
      "Zéro climatisation nécessaire grâce à un système de ventilation naturelle traversante. " +
      "Quarante-cinq mètres carrés optimisés avec un salon ouvert sur terrasse orientée nord. " +
      "Les fenêtres hautes créent un effet cheminée qui évacue l'air chaud automatiquement. " +
      "Loyer mensuel : vingt-huit mille francs CFA.",
    caracteristiques: [
      "Effet cheminée naturel",
      "Fenêtres haute performance",
      "Matériaux locaux 100%",
      "Certification verte",
    ],
    proprietaire: PROPRIETAIRES.p2,
  },
  {
    id: "3",
    quartier: "Yamoussoukro, Habitat Social",
    pieces: "Studio Moderne — Toiture végétale",
    prix: "20 000",
    prixNum: 20000,
    surface: "32 m²",
    badge: " Toiture végétale",
    videoPexelsId: "29459385",
    latitude: 6.8206,
    longitude: -5.2767,
    likes: 207,
    commentaires: 38,
    audioDescription:
      "Studio moderne à Yamoussoukro dans le programme d'habitat social écologique. " +
      "Trente-deux mètres carrés avec une toiture végétale qui réduit la chaleur de dix degrés. " +
      "Construit avec des matériaux locaux : bois de palmier, banco amélioré et fibres naturelles. " +
      "La toiture végétale absorbe les eaux de pluie et crée une isolation thermique exceptionnelle. " +
      "Loyer mensuel : vingt mille francs CFA, accessible aux ménages à revenus modestes.",
    caracteristiques: [
      "Toiture végétale",
      "Banco amélioré",
      "Proche transports",
      "Loyer accessible",
    ],
    proprietaire: PROPRIETAIRES.p3,
  },
  {
    id: "4",
    quartier: "Abidjan, Cocody (Villa Solaire)",
    pieces: "4 Pièces — Panneaux solaires & piscine naturelle",
    prix: "75 000",
    prixNum: 75000,
    surface: "110 m²",
    badge: " Énergie Solaire",
    videoPexelsId: "15046674",
    latitude: 5.3600,
    longitude: -4.0083,
    likes: 511,
    commentaires: 74,
    audioDescription:
      "Magnifique villa quatre pièces à Cocody, Abidjan. Architecture passive avec douze panneaux solaires couvrant cent pour cent des besoins énergétiques. " +
      "Cent dix mètres carrés sur deux niveaux avec grand jardin arboré. " +
      "Piscine naturelle à filtration végétale, double vitrage, et système de récupération des eaux grises. " +
      "Cette maison produit plus d'énergie qu'elle n'en consomme. " +
      "Loyer mensuel : soixante-quinze mille francs CFA.",
    caracteristiques: [
      "Panneaux solaires 5kWc",
      "Piscine naturelle",
      "Double vitrage",
      "Récupération eaux grises",
    ],
    proprietaire: PROPRIETAIRES.p4,
  },
];

const SUGGESTIONS_POOL = [
  "Bouaké",
  "Yamoussoukro",
  "Abidjan",
  "Cocody",
  "Studio",
  "2 pièces",
  "3 pièces",
  "4 pièces",
  "Terre comprimée",
  "Ventilation naturelle",
  "Toiture végétale",
  "Logement social",
  "Éco-Quartier",
  "Bioclimatique",
  "Solaire",
  "Nimbo",
];




// ─── Budget Slider Component
const BudgetSlider: React.FC<{
  value: number;
  max: number;
  onValueChange: (v: number) => void;
}> = ({ value, max, onValueChange }) => {
  const sliderWidth = useRef(0);
  const position = useRef(new Animated.Value(value / max)).current;
  const positionRef = useRef(value / max);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {},
      onPanResponderMove: (_, gs) => {
        if (sliderWidth.current === 0) return;
        const rawRatio = (gs.moveX - 16) / sliderWidth.current;
        const ratio = Math.min(Math.max(rawRatio, 0), 1);
        positionRef.current = ratio;
        position.setValue(ratio);
        const snappedValue = Math.round((ratio * max) / 5000) * 5000;
        onValueChange(Math.min(Math.max(snappedValue, 15000), max));
      },
      onPanResponderRelease: () => {},
    })
  ).current;

  const thumbLeft = position.interpolate({
    inputRange: [0, 1],
    outputRange: ["0%", "96%"],
  });

  const trackFill = position.interpolate({
    inputRange: [0, 1],
    outputRange: ["0%", "100%"],
  });

  return (
    <View
      style={{ paddingHorizontal: 0, paddingVertical: 4 }}
      onLayout={(e) => {
        sliderWidth.current = e.nativeEvent.layout.width;
      }}
      {...panResponder.panHandlers}>
      {/* Track */}
      <View style={{ height: 6, backgroundColor: "rgba(255,255,255,0.25)", borderRadius: 3, overflow: "hidden" }}>
        <Animated.View style={{ height: "100%", width: trackFill, backgroundColor: "#34d399", borderRadius: 3 }} />
      </View>
      {/* Thumb */}
      <Animated.View
        style={{
          position: "absolute",
          top: -7,
          left: thumbLeft,
          width: 20,
          height: 20,
          borderRadius: 10,
          backgroundColor: "#fff",
          shadowColor: "#000",
          shadowOpacity: 0.3,
          shadowRadius: 4,
          elevation: 4,
          borderWidth: 3,
          borderColor: "#34d399",
        }}
      />
    </View>
  );
};

// ─── Barre de recherche améliorée avec budget + géolocalisation
const SearchBar: React.FC<{
  onSearch: (q: string) => void;
  onBudgetChange: (budget: number) => void;
  onGeoSearch: () => void;
  isGeoLoading: boolean;
  budget: number;
  budgetActive: boolean;
}> = ({ onSearch, onBudgetChange, onGeoSearch, isGeoLoading, budget, budgetActive }) => {
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [focused, setFocused] = useState(false);
  const [budgetOpen, setBudgetOpen] = useState(false);
  const budgetAnim = useRef(new Animated.Value(0)).current;
  const MAX_BUDGET = 100000;

  const toggleBudget = () => {
    const toVal = budgetOpen ? 0 : 1;
    setBudgetOpen(!budgetOpen);
    Animated.spring(budgetAnim, { toValue: toVal, tension: 80, friction: 10, useNativeDriver: false }).start();
  };

  const budgetHeight = budgetAnim.interpolate({ inputRange: [0, 1], outputRange: [0, 88] });

  const handleChange = useCallback(
    (text: string) => {
      setQuery(text);
      onSearch(text);
      if (!text.trim()) { setSuggestions([]); return; }
      setSuggestions(
        SUGGESTIONS_POOL.filter((s) => s.toLowerCase().includes(text.toLowerCase())).slice(0, 5)
      );
    },
    [onSearch]
  );

  const formatBudget = (val: number) =>
    val >= MAX_BUDGET ? "Tout budget" : `${val.toLocaleString("fr-FR")} FCFA`;

  const geoPulse = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    if (isGeoLoading) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(geoPulse, { toValue: 1.2, duration: 500, useNativeDriver: true }),
          Animated.timing(geoPulse, { toValue: 1, duration: 500, useNativeDriver: true }),
        ])
      ).start();
    } else {
      geoPulse.stopAnimation();
      geoPulse.setValue(1);
    }
  }, [isGeoLoading]);

  return (
    <View style={{ zIndex: 20, backgroundColor: "#065f46", paddingHorizontal: 12, paddingVertical: 10 }}>
      {/* Ligne 1 : Recherche texte */}
      <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
        <View style={{
          flex: 1, flexDirection: "row", alignItems: "center",
          backgroundColor: "rgba(255,255,255,0.15)", borderRadius: 14,
          paddingHorizontal: 12, paddingVertical: 9,
          borderWidth: 1, borderColor: "rgba(255,255,255,0.2)",
        }}>
          <Ionicons name="search-outline" size={16} color="rgba(255,255,255,0.7)" />
          <TextInput
            style={{ flex: 1, color: "#fff", fontSize: 14, marginLeft: 8 }}
            placeholder="Quartier, type de maison…"
            placeholderTextColor="rgba(255,255,255,0.5)"
            value={query}
            onChangeText={handleChange}
            onFocus={() => setFocused(true)}
            onBlur={() => setTimeout(() => setFocused(false), 150)}
          />
          {query.length > 0 && (
            <TouchableOpacity onPress={() => { setQuery(""); setSuggestions([]); onSearch(""); }}>
              <Ionicons name="close-circle" size={17} color="rgba(255,255,255,0.6)" />
            </TouchableOpacity>
          )}
        </View>

        {/* Bouton Budget */}
        <TouchableOpacity
          onPress={toggleBudget}
          style={{
            flexDirection: "row", alignItems: "center",
            backgroundColor: budgetActive ? "#34d399" : "rgba(255,255,255,0.18)",
            paddingHorizontal: 10, paddingVertical: 9, borderRadius: 14,
            borderWidth: 1, borderColor: budgetActive ? "#34d399" : "rgba(255,255,255,0.25)",
            gap: 4,
          }}>
          <Ionicons name="wallet-outline" size={15} color={budgetActive ? "#065f46" : "#fff"} />
          <Text style={{ color: budgetActive ? "#065f46" : "#fff", fontSize: 11, fontWeight: "700" }}>Budget</Text>
        </TouchableOpacity>

        {/* Bouton Géolocalisation */}
        <Animated.View style={{ transform: [{ scale: geoPulse }] }}>
          <TouchableOpacity
            onPress={onGeoSearch}
            disabled={isGeoLoading}
            style={{
              width: 40, height: 40, borderRadius: 20,
              backgroundColor: isGeoLoading ? "#34d399" : "#fff",
              alignItems: "center", justifyContent: "center",
              shadowColor: "#000", shadowOpacity: 0.25, shadowRadius: 6, elevation: 5,
            }}>
            {isGeoLoading
              ? <ActivityIndicator size="small" color="#065f46" />
              : <Ionicons name="navigate" size={18} color="#065f46" />}
          </TouchableOpacity>
        </Animated.View>
      </View>

      {/* Budget slider panel */}
      <Animated.View style={{ height: budgetHeight, overflow: "hidden" }}>
        <View style={{ paddingTop: 12, paddingHorizontal: 4 }}>
          <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 10 }}>
            <Text style={{ color: "rgba(255,255,255,0.7)", fontSize: 11, fontWeight: "600" }}>BUDGET MAX / MOIS</Text>
            <View style={{ backgroundColor: "rgba(52,211,153,0.25)", paddingHorizontal: 10, paddingVertical: 3, borderRadius: 10 }}>
              <Text style={{ color: "#34d399", fontSize: 12, fontWeight: "800" }}>{formatBudget(budget)}</Text>
            </View>
          </View>
          <BudgetSlider value={budget} max={MAX_BUDGET} onValueChange={onBudgetChange} />
          <View style={{ flexDirection: "row", justifyContent: "space-between", marginTop: 6 }}>
            <Text style={{ color: "rgba(255,255,255,0.4)", fontSize: 10 }}>15 000 F</Text>
            <Text style={{ color: "rgba(255,255,255,0.4)", fontSize: 10 }}>100 000 F+</Text>
          </View>
        </View>
      </Animated.View>

      {/* Suggestions dropdown */}
      {focused && suggestions.length > 0 && (
        <View style={{
          position: "absolute", top: 58, left: 12, right: 12, zIndex: 30,
          backgroundColor: "#fff", borderRadius: 14, overflow: "hidden",
          shadowColor: "#000", shadowOpacity: 0.12, shadowRadius: 8, elevation: 6,
        }}>
          {suggestions.map((s, i) => (
            <TouchableOpacity key={i}
              style={{
                flexDirection: "row", alignItems: "center",
                paddingHorizontal: 16, paddingVertical: 13,
                borderBottomWidth: i < suggestions.length - 1 ? 1 : 0,
                borderBottomColor: "#F3F4F6",
              }}
              onPress={() => { setQuery(s); setSuggestions([]); onSearch(s); }}>
              <Ionicons name="leaf-outline" size={14} color="#059669" />
              <Text style={{ color: "#374151", fontSize: 14, marginLeft: 8 }}>{s}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
  );
};

// ─── Bouton VÉRIFIER animé (côté droit)

const VerifyButton: React.FC<{ onPress: () => void }> = ({ onPress }) => {
  const pulse = useRef(new Animated.Value(1)).current;
  const glow = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.parallel([
          Animated.timing(pulse, {
            toValue: 1.12,
            duration: 600,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(glow, {
            toValue: 1,
            duration: 600,
            useNativeDriver: false,
          }),
        ]),
        Animated.parallel([
          Animated.timing(pulse, {
            toValue: 1,
            duration: 600,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(glow, {
            toValue: 0,
            duration: 600,
            useNativeDriver: false,
          }),
        ]),
      ]),
    ).start();
  }, []);

  const bgColor = glow.interpolate({
    inputRange: [0, 1],
    outputRange: ["rgba(6,95,70,0.92)", "rgba(5,150,105,0.98)"],
  });

  return (
    <Animated.View
      style={{
        position: "absolute",
        right: -10,
        top: "38%",
        transform: [{ scale: pulse }],
        zIndex: 50,
      }}>
      <TouchableOpacity onPress={onPress} activeOpacity={0.8}>
        <Animated.View
          style={{
            backgroundColor: bgColor,
            borderRadius: 16,
            paddingVertical: 10,
            paddingHorizontal: 10,
            alignItems: "center",
            shadowColor: "#059669",
            shadowOpacity: 0.6,
            shadowRadius: 10,
            elevation: 8,
            borderTopRightRadius: 0,
            borderBottomRightRadius: 0,
            borderTopLeftRadius: 14,
            borderBottomLeftRadius: 14,
          }}>
          <Ionicons name="shield-checkmark" size={22} color="#fff" />
          <Text
            style={{
              color: "#fff",
              fontSize: 8,
              fontWeight: "900",
              marginTop: 3,
              letterSpacing: 0.3,
              textAlign: "center",
            }}>
            {"VÉRIF.\nPROPRIO"}
          </Text>
        </Animated.View>
      </TouchableOpacity>
    </Animated.View>
  );
};

// ─── Modal identité propriétaire 

const ProprietaireModal: React.FC<{
  proprietaire: Proprietaire;
  visible: boolean;
  onClose: () => void;
}> = ({ proprietaire, visible, onClose }) => {
  const slideAnim = useRef(new Animated.Value(400)).current;
  const alarmPlayed = useRef(false);

  useEffect(() => {
    if (visible) {
      alarmPlayed.current = false;
      Animated.spring(slideAnim, {
        toValue: 0,
        tension: 65,
        friction: 9,
        useNativeDriver: true,
      }).start();

      // Jouer l'alerte si non vérifié
      if (!proprietaire.verifie && !alarmPlayed.current) {
        alarmPlayed.current = true;
        setTimeout(() => {
          Speech.speak(
            "Attention ! Ce propriétaire n'est pas vérifié. Sa fiabilité est faible. Procédez avec prudence avant tout engagement.",
            { language: "fr-CI", pitch: 0.85, rate: 0.8 },
          );
        }, 600);
      }
    } else {
      Animated.timing(slideAnim, {
        toValue: 400,
        duration: 250,
        useNativeDriver: true,
      }).start();
      Speech.stop();
    }
  }, [visible]);

  const stars = Array.from(
    { length: 5 },
    (_, i) => i < Math.round(proprietaire.note),
  );
  const isVerifie = proprietaire.verifie;

  return (
    <Modal
      transparent
      animationType="none"
      visible={visible}
      onRequestClose={onClose}>
      <TouchableOpacity
        style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.55)" }}
        activeOpacity={1}
        onPress={onClose}>
        <Animated.View
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            transform: [{ translateY: slideAnim }],
          }}>
          <TouchableOpacity activeOpacity={1}>
            <View
              style={{
                backgroundColor: "#fff",
                borderTopLeftRadius: 28,
                borderTopRightRadius: 28,
                paddingHorizontal: 24,
                paddingTop: 20,
                paddingBottom: 36,
              }}>
              {/* Handle bar */}
              <View
                style={{
                  width: 40,
                  height: 4,
                  backgroundColor: "#E5E7EB",
                  borderRadius: 2,
                  alignSelf: "center",
                  marginBottom: 20,
                }}
              />

              {/* Bandeau alerte si non vérifié */}
              {!isVerifie && (
                <View
                  style={{
                    backgroundColor: "#FEF2F2",
                    borderWidth: 1.5,
                    borderColor: "#FECACA",
                    borderRadius: 14,
                    padding: 12,
                    flexDirection: "row",
                    alignItems: "center",
                    marginBottom: 18,
                  }}>
                  <MaterialIcons name="gpp-bad" size={26} color="#DC2626" style={{ marginRight: 10 }} />
                  <View style={{ flex: 1 }}>
                    <Text
                      style={{
                        fontSize: 13,
                        fontWeight: "800",
                        color: "#DC2626",
                      }}>
                      Propriétaire NON VÉRIFIÉ
                    </Text>
                    <Text
                      style={{ fontSize: 11, color: "#EF4444", marginTop: 2 }}>
                      Identité non confirmée — procédez avec prudence
                    </Text>
                  </View>
                </View>
              )}

              {/* Photo + infos */}
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  marginBottom: 20,
                }}>
                <View
                  style={{
                    position: "relative",
                    marginRight: 16,
                  }}>
                  <Image
                    source={{ uri: proprietaire.photo }}
                    style={{
                      width: 78,
                      height: 78,
                      borderRadius: 39,
                      borderWidth: 3,
                      borderColor: isVerifie ? "#059669" : "#EF4444",
                    }}
                  />
                  <View
                    style={{
                      position: "absolute",
                      bottom: 0,
                      right: 0,
                      width: 24,
                      height: 24,
                      borderRadius: 12,
                      backgroundColor: isVerifie ? "#059669" : "#EF4444",
                      alignItems: "center",
                      justifyContent: "center",
                      borderWidth: 2,
                      borderColor: "#fff",
                    }}>
                    <Ionicons
                      name={isVerifie ? "checkmark" : "close"}
                      size={13}
                      color="#fff"
                    />
                  </View>
                </View>

                <View style={{ flex: 1 }}>
                  <Text
                    style={{
                      fontSize: 18,
                      fontWeight: "900",
                      color: "#111827",
                    }}>
                    {proprietaire.nom}
                  </Text>

                  {/* Étoiles */}
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      marginTop: 4,
                    }}>
                    {stars.map((filled, i) => (
                      <Ionicons
                        key={i}
                        name={filled ? "star" : "star-outline"}
                        size={14}
                        color={filled ? "#F59E0B" : "#D1D5DB"}
                      />
                    ))}
                    <Text
                      style={{ fontSize: 12, color: "#6B7280", marginLeft: 5 }}>
                      {proprietaire.note}/5
                    </Text>
                  </View>

                  <Text
                    style={{ fontSize: 11, color: "#9CA3AF", marginTop: 4 }}>
                    Membre depuis {proprietaire.membreDepuis}
                  </Text>
                </View>
              </View>

              {/* Stats */}
              <View style={{ flexDirection: "row", gap: 12, marginBottom: 20 }}>
                {[
                  {
                    icon: "home" as const,
                    label: "Maisons publiées",
                    value: `${proprietaire.maisons}`,
                    color: "#065f46",
                    bg: "#F0FDF4",
                  },
                  {
                    icon: isVerifie
                      ? ("verified-user" as const)
                      : ("gpp-bad" as const),
                    label: "Statut",
                    value: isVerifie ? "Vérifié" : "Non vérifié",
                    color: isVerifie ? "#059669" : "#DC2626",
                    bg: isVerifie ? "#ECFDF5" : "#FEF2F2",
                  },
                ].map((stat, i) => (
                  <View
                    key={i}
                    style={{
                      flex: 1,
                      backgroundColor: stat.bg,
                      borderRadius: 14,
                      padding: 14,
                      alignItems: "center",
                    }}>
                    <MaterialIcons
                      name={stat.icon}
                      size={22}
                      color={stat.color}
                    />
                    <Text
                      style={{
                        fontSize: 16,
                        fontWeight: "900",
                        color: stat.color,
                        marginTop: 4,
                      }}>
                      {stat.value}
                    </Text>
                    <Text
                      style={{
                        fontSize: 10,
                        color: "#9CA3AF",
                        marginTop: 2,
                        textAlign: "center",
                      }}>
                      {stat.label}
                    </Text>
                  </View>
                ))}
              </View>

              {/* Message de confiance */}
              <View
                style={{
                  backgroundColor: isVerifie ? "#F0FDF4" : "#FFF7ED",
                  borderRadius: 14,
                  padding: 14,
                  borderWidth: 1,
                  borderColor: isVerifie ? "#A7F3D0" : "#FED7AA",
                  marginBottom: 20,
                  flexDirection: "row",
                  alignItems: "flex-start",
                }}>
                <Ionicons
                  name={isVerifie ? "shield-checkmark" : "warning"}
                  size={22}
                  color={isVerifie ? "#059669" : "#D97706"}
                  style={{ marginRight: 10, marginTop: 1 }}
                />
                <Text
                  style={{
                    flex: 1,
                    fontSize: 12,
                    color: isVerifie ? "#065f46" : "#92400E",
                    lineHeight: 18,
                  }}>
                  {isVerifie
                    ? `${proprietaire.nom} a été vérifié par notre équipe. Ses documents d'identité et de propriété ont été validés. Vous pouvez vous engager en toute confiance.`
                    : `Ce propriétaire n'a pas encore soumis ses documents pour vérification. Évitez tout paiement en dehors de la plateforme et signalez tout comportement suspect.`}
                </Text>
              </View>

              {/* Bouton fermer */}
              <TouchableOpacity
                onPress={onClose}
                style={{
                  backgroundColor: isVerifie ? "#065f46" : "#1F2937",
                  borderRadius: 14,
                  paddingVertical: 14,
                  alignItems: "center",
                }}>
                <Text
                  style={{ color: "#fff", fontWeight: "800", fontSize: 14 }}>
                  {isVerifie
                    ? "OK, je fais confiance"
                    : "Compris, je suis prudent"}
                </Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </Animated.View>
      </TouchableOpacity>
    </Modal>
  );
};

// ─── Barre Sociale
const SocialBar: React.FC<{ item: Logement }> = ({ item }) => {
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(item.likes);
  const likeScale = useRef(new Animated.Value(1)).current;

  const handleLike = () => {
    const newLiked = !liked;
    setLiked(newLiked);
    setLikeCount(newLiked ? likeCount + 1 : likeCount - 1);
    Animated.sequence([
      Animated.timing(likeScale, { toValue: 1.4, duration: 120, useNativeDriver: true }),
      Animated.spring(likeScale, { toValue: 1, tension: 200, friction: 6, useNativeDriver: true }),
    ]).start();
  };

  const handleShare = async () => {
    try {
      await Share.share({
        message: `[Logement] *${item.pieces}* à *${item.quartier}*\n${item.prix} FCFA/mois · ${item.surface}\n\nVia GBA-ECO — Habitat Ecologique en Cote d'Ivoire`,
        title: "GBA-ÉCO — Logement à partager",
      });
    } catch {}
  };

  return (
    <View style={{
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      marginTop: 12,
      paddingTop: 10,
      borderTopWidth: 1,
      borderTopColor: "#F3F4F6",
    }}>
      {/* Like */}
      <TouchableOpacity onPress={handleLike} style={{ flexDirection: "row", alignItems: "center", gap: 5 }}>
        <Animated.View style={{ transform: [{ scale: likeScale }] }}>
          <Ionicons name={liked ? "heart" : "heart-outline"} size={20} color={liked ? "#EF4444" : "#9CA3AF"} />
        </Animated.View>
        <Text style={{ color: liked ? "#EF4444" : "#9CA3AF", fontSize: 12, fontWeight: "700" }}>
          {likeCount.toLocaleString("fr-FR")}
        </Text>
      </TouchableOpacity>

      {/* Commentaires (indicatif) */}
      <TouchableOpacity style={{ flexDirection: "row", alignItems: "center", gap: 5 }}>
        <Ionicons name="chatbubble-outline" size={18} color="#9CA3AF" />
        <Text style={{ color: "#9CA3AF", fontSize: 12, fontWeight: "600" }}>{item.commentaires}</Text>
      </TouchableOpacity>

      {/* Propriétaire mini avatar */}
      <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
        <Image
          source={{ uri: item.proprietaire.photo }}
          style={{ width: 22, height: 22, borderRadius: 11, borderWidth: 1.5, borderColor: item.proprietaire.verifie ? "#059669" : "#D1D5DB" }}
        />
        <Text style={{ color: "#6B7280", fontSize: 11, fontWeight: "600", maxWidth: 80 }} numberOfLines={1}>
          {item.proprietaire.nom.split(" ")[0]}
        </Text>
        {item.proprietaire.verifie && <Ionicons name="checkmark-circle" size={13} color="#059669" />}
      </View>

      {/* Partager */}
      <TouchableOpacity
        onPress={handleShare}
        style={{
          flexDirection: "row", alignItems: "center", gap: 4,
          backgroundColor: "#F0FDF4", paddingHorizontal: 10, paddingVertical: 5, borderRadius: 10,
        }}>
        <Ionicons name="share-social-outline" size={15} color="#059669" />
        <Text style={{ color: "#059669", fontSize: 11, fontWeight: "700" }}>Partager</Text>
      </TouchableOpacity>
    </View>
  );
};

// ─── Carte vidéo

interface VideoCardProps {
  item: Logement;
  onSelect: (logement: Logement) => void;
  containerHeight: number;
  isActive: boolean;
}

const VideoCard: React.FC<VideoCardProps> = ({
  item,
  onSelect,
  containerHeight,
  isActive,
}) => {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [ficheVisible, setFicheVisible] = useState(true);
  const [proprietaireModal, setProprietaireModal] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [videoLoading, setVideoLoading] = useState(true);
  const ficheAnim = useRef(new Animated.Value(1)).current;

  // Chargement de l'URL vidéo depuis l'API Pexels
  useEffect(() => {
    let cancelled = false;
    setVideoLoading(true);
    setVideoUrl(null);
    fetchDirectVideoUrl(item.videoPexelsId).then((url) => {
      if (!cancelled) {
        setVideoUrl(url);
        setVideoLoading(false);
      }
    });
    return () => { cancelled = true; };
  }, [item.videoPexelsId]);

  const player = useVideoPlayer(videoUrl ?? "", (p) => {
    p.loop = true;
    p.muted = false;
    p.volume = 0.35;
    // Autoplay dès que l'URL est disponible et que la carte est active
    if (videoUrl && isActive) {
      p.play();
    }
  });

  useEffect(() => {
    if (!player || !videoUrl) return;
    if (isActive) {
      player.play();
    } else {
      player.pause();
      Speech.stop();
      setIsSpeaking(false);
    }
  }, [isActive, videoUrl, player]);

  const toggleFiche = () => {
    const toVal = ficheVisible ? 0 : 1;
    setFicheVisible(!ficheVisible);
    Animated.spring(ficheAnim, {
      toValue: toVal,
      tension: 70,
      friction: 10,
      useNativeDriver: true,
    }).start();
  };

  const handleAudio = async () => {
    if (isSpeaking) {
      await Speech.stop();
      setIsSpeaking(false);
      return;
    }
    setIsSpeaking(true);
    Speech.speak(item.audioDescription, {
      language: "fr-CI",
      pitch: 1.05,
      rate: 0.82,
      onDone: () => setIsSpeaking(false),
      onStopped: () => setIsSpeaking(false),
      onError: () => setIsSpeaking(false),
    });
  };

  const ficheTranslate = ficheAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [350, 0],
  });

  return (
    <View
      style={{
        height: containerHeight,
        backgroundColor: "#000",
        overflow: "hidden",
      }}>
      {/* Vidéo panoramique plein écran */}
      {videoLoading ? (
        <View
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "#111827",
            alignItems: "center",
            justifyContent: "center",
          }}>
          <ActivityIndicator size="large" color="#065f46" />
          <Text style={{ color: "#6B7280", marginTop: 12, fontSize: 13 }}>
            Chargement de la vidéo…
          </Text>
        </View>
      ) : videoUrl ? (
        <VideoView
          style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0 }}
          player={player}
          nativeControls={false}
          contentFit="cover"
        />
      ) : (
        <View
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "#374151",
            alignItems: "center",
            justifyContent: "center",
          }}>
          <MaterialIcons name="error-outline" size={40} color="#9CA3AF" />
          <Text style={{ color: "#9CA3AF", marginTop: 10, fontSize: 14 }}>
            Vidéo indisponible
          </Text>
        </View>
      )}

      {/* Overlay dégradé bas */}
      <View
        pointerEvents="none"
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          height: "55%",
          backgroundColor: "transparent",
        }}
      />

      {/* Badge */}
      <View
        style={{
          position: "absolute",
          top: 16,
          left: 14,
          zIndex: 10,
          backgroundColor: "rgba(6,95,70,0.9)",
          paddingHorizontal: 12,
          paddingVertical: 6,
          borderRadius: 20,
        }}>
        <Text style={{ color: "#fff", fontSize: 12, fontWeight: "700" }}>
          {item.badge}
        </Text>
      </View>

      {/* Surface */}
      <View
        style={{
          position: "absolute",
          top: 16,
          zIndex: 10,
          backgroundColor: "rgba(0,0,0,0.5)",
          paddingHorizontal: 10,
          paddingVertical: 5,
          borderRadius: 12,
          alignSelf: "center",
          left: "40%",
        }}>
        <Text style={{ color: "#fff", fontSize: 12, fontWeight: "600" }}>
          {item.surface}
        </Text>
      </View>

      {/* Bouton toggle fiche (flèche) */}
    
<TouchableOpacity
  onPress={toggleFiche}
  style={{
    position: "absolute",
    bottom: ficheVisible ? 215 : 70,
    alignSelf: "center",
    left: "44%",
    zIndex: 20,
    backgroundColor: "rgba(6,95,70,0.85)",
    borderRadius: 20,
    padding: 8,
    shadowColor: "#000",
    shadowOpacity: 0.3,
    shadowRadius: 6,
  }}>
  <Ionicons
    name={ficheVisible ? "chevron-down" : "chevron-up"}
    size={20}
    color="#fff"
  />
</TouchableOpacity>


      {/* Bouton VÉRIFIER animé (droite) */}
      <VerifyButton onPress={() => setProprietaireModal(true)} />

      {/* Fiche info rétractable */}
      <Animated.View
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          transform: [{ translateY: ficheTranslate }],
          zIndex: 15,
        }}>
        <View
          style={{
            backgroundColor: "rgba(255,255,255,0.97)",
            marginHorizontal: 10,
            marginBottom: 50,
            borderRadius: 22,
            padding: 14,
            shadowColor: "#000",
            shadowOpacity: 0.15,
            shadowRadius: 14,
            elevation: 8,
          }}>
          {/* Bouton audio */}
          <TouchableOpacity
            onPress={handleAudio}
            style={{
              flexDirection: "row",
              alignItems: "center",
              backgroundColor: isSpeaking ? "#FEF3C7" : "#FFF7ED",
              borderWidth: 1,
              borderColor: isSpeaking ? "#F59E0B" : "#FED7AA",
              borderRadius: 12,
              padding: 10,
              marginBottom: 10,
            }}>
            <View
              style={{
                width: 30,
                height: 30,
                borderRadius: 15,
                backgroundColor: isSpeaking ? "#F59E0B" : "#FFEDD5",
                alignItems: "center",
                justifyContent: "center",
                marginRight: 10,
              }}>
              <Ionicons
                name={isSpeaking ? "stop" : "volume-high"}
                size={15}
                color={isSpeaking ? "#fff" : "#C2410C"}
              />
            </View>
            <Text
              style={{
                color: "#92400E",
                fontSize: 12,
                fontWeight: "700",
                flex: 1,
              }}>
              {isSpeaking
                ? "Lecture en cours — Appuyer pour stopper"
                : "Écouter la description vocale"}
            </Text>
          </TouchableOpacity>

          {/* Lieu */}
          <View
            style={{
              flexDirection: "row",
              alignItems: "flex-start",
              marginBottom: 4,
            }}>
            <MaterialIcons
              name="location-on"
              size={16}
              color="#059669"
              style={{ marginTop: 1 }}
            />
            <Text
              style={{
                fontSize: 14,
                fontWeight: "800",
                color: "#111827",
                flex: 1,
                marginLeft: 4,
              }}>
              {item.quartier}
            </Text>
          </View>

          {/* Type */}
          <View
            style={{
              flexDirection: "row",
              alignItems: "flex-start",
              marginBottom: 10,
            }}>
            <FontAwesome
              name="home"
              size={13}
              color="#6B7280"
              style={{ marginTop: 1 }}
            />
            <Text
              style={{ fontSize: 12, color: "#4B5563", flex: 1, marginLeft: 6 }}
              numberOfLines={2}>
              {item.pieces}
            </Text>
          </View>

             {/* Caractéristiques (expandable) */}
        {isExpanded && (
          <View style={{ marginBottom: 10 }}>
            {item.caracteristiques.map((c, i) => (
              <View key={i} style={{ flexDirection: "row", alignItems: "center", marginBottom: 4 }}>
                <Ionicons name="checkmark-circle" size={14} color="#059669" />
                <Text style={{ fontSize: 11, color: "#374151", marginLeft: 6 }}>{c}</Text>
              </View>
            ))}
          </View>
        )}

        <TouchableOpacity onPress={() => setIsExpanded(!isExpanded)} style={{ marginBottom: 10, flexDirection: "row", alignItems: "center" }}>
          <Ionicons name={isExpanded ? "chevron-up-circle-outline" : "chevron-down-circle-outline"} size={16} color="#059669" style={{ marginRight: 4 }} />
          <Text style={{ fontSize: 11, color: "#059669", fontWeight: "600" }}>
            {isExpanded ? "Moins de détails" : "Voir les équipements"}
          </Text>
        </TouchableOpacity>

          {/* Prix */}
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              backgroundColor: "#F0FDF4",
              paddingHorizontal: 10,
              paddingVertical: 6,
              borderRadius: 10,
              alignSelf: "flex-start",
              marginBottom: 12,
            }}>
            <FontAwesome name="money" size={13} color="#15803D" />
            <Text
              style={{
                color: "#15803D",
                fontSize: 13,
                fontWeight: "800",
                marginLeft: 7,
              }}>
              {item.prix} FCFA / mois
            </Text>
          </View>

          {/* CTA */}
          <TouchableOpacity
            style={{
              backgroundColor: "#065f46",
              paddingVertical: 13,
              borderRadius: 14,
              alignItems: "center",
            }}
            onPress={() => onSelect(item)}
            activeOpacity={0.85}>
            <Text
              style={{
                color: "#fff",
                fontSize: 14,
                fontWeight: "800",
                letterSpacing: 0.5,
              }}>
              JE VEUX CETTE MAISON →
            </Text>
          </TouchableOpacity>

          {/* ─── Barre sociale ─── */}
          <SocialBar item={item} />
        </View>
      </Animated.View>

      {/* Modal identité propriétaire */}
      <ProprietaireModal
        proprietaire={item.proprietaire}
        visible={proprietaireModal}
        onClose={() => setProprietaireModal(false)}
      />
    </View>
  );
};

// ─── Confirmation + Annulation ────────────────────────────────────────────────

const ConfirmationScreen: React.FC<{
  reservation: Reservation;
  logement: Logement;
  onAnnuler: (id: string) => void;
  onClose: () => void;
}> = ({ reservation, logement, onAnnuler, onClose }) => {
  const [loading, setLoading] = useState(false);
  const isAnnulee = reservation.statut === "annulee";

  const handleAnnuler = () => {
    Alert.alert(
      "Annuler la réservation ?",
      `Logement : ${logement.pieces} à ${logement.quartier}\n\nLe remboursement de 2 000 FCFA sera traité sous 48h.`,
      [
        { text: "Non, garder", style: "cancel" },
        {
          text: "Oui, annuler",
          style: "destructive",
          onPress: () => {
            setLoading(true);
            setTimeout(() => {
              setLoading(false);
              onAnnuler(reservation.id);
              Alert.alert(
                "Annulation confirmée",
                "Votre demande a été enregistrée. Le remboursement de 2 000 FCFA sera effectué sous 48h sur votre Mobile Money.",
                [{ text: "OK", onPress: onClose }],
              );
            }, 1500);
          },
        },
      ],
    );
  };

  return (
    <ScrollView contentContainerStyle={{ padding: 20 }}>
      <View style={{ alignItems: "center", marginTop: 20, marginBottom: 24 }}>
        <View
          style={{
            width: 80,
            height: 80,
            borderRadius: 40,
            backgroundColor: isAnnulee ? "#FEE2E2" : "#D1FAE5",
            alignItems: "center",
            justifyContent: "center",
          }}>
          <Ionicons
            name={isAnnulee ? "close-circle" : "checkmark-circle"}
            size={50}
            color={isAnnulee ? "#DC2626" : "#059669"}
          />
        </View>
        <Text
          style={{
            fontSize: 20,
            fontWeight: "900",
            color: "#111827",
            marginTop: 14,
          }}>
          {isAnnulee ? "Réservation annulée" : "Réservation confirmée !"}
        </Text>
        <Text
          style={{
            fontSize: 13,
            color: "#6B7280",
            marginTop: 6,
            textAlign: "center",
          }}>
          {isAnnulee
            ? "Remboursement sous 48h"
            : `Notification envoyée au ${reservation.telephone}`}
        </Text>
      </View>

      <View
        style={{
          backgroundColor: "#fff",
          borderRadius: 18,
          padding: 18,
          shadowColor: "#000",
          shadowOpacity: 0.06,
          shadowRadius: 10,
          elevation: 3,
          marginBottom: 16,
          borderWidth: 1,
          borderColor: "#F3F4F6",
        }}>
        <Text
          style={{
            fontSize: 11,
            fontWeight: "700",
            color: "#9CA3AF",
            textTransform: "uppercase",
            letterSpacing: 1,
            marginBottom: 14,
          }}>
          Détails de la réservation
        </Text>
        {[
          { label: "Logement", value: logement.pieces },
          { label: "Quartier", value: logement.quartier },
          { label: "Nom", value: reservation.nom },
          { label: "Mobile Money", value: reservation.telephone },
          { label: "Loyer", value: `${logement.prix} FCFA / mois` },
          { label: "Date", value: reservation.date },
        ].map((row, i) => (
          <View
            key={i}
            style={{
              flexDirection: "row",
              paddingVertical: 9,
              borderBottomWidth: i < 5 ? 1 : 0,
              borderBottomColor: "#F9FAFB",
            }}>
            <Text style={{ fontSize: 12, color: "#9CA3AF", width: 110 }}>
              {row.label}
            </Text>
            <Text
              style={{
                fontSize: 13,
                color: "#111827",
                fontWeight: "600",
                flex: 1,
              }}>
              {row.value}
            </Text>
          </View>
        ))}
      </View>

      {/* N° dossier */}
      <View
        style={{
          backgroundColor: "#F0FDF4",
          borderRadius: 14,
          padding: 14,
          borderWidth: 1,
          borderColor: "#A7F3D0",
          marginBottom: 20,
          alignItems: "center",
        }}>
        <Text style={{ fontSize: 11, color: "#065f46", fontWeight: "700" }}>
          NUMÉRO DE DOSSIER
        </Text>
        <Text
          style={{
            fontSize: 20,
            fontWeight: "900",
            color: "#065f46",
            marginTop: 4,
            letterSpacing: 2,
          }}>
          #{reservation.id.toUpperCase()}
        </Text>
        <Text style={{ fontSize: 11, color: "#6B7280", marginTop: 4 }}>
          Conservez ce numéro
        </Text>
      </View>

      {!isAnnulee && (
        <TouchableOpacity
          disabled={loading}
          onPress={handleAnnuler}
          style={{
            borderWidth: 1.5,
            borderColor: "#DC2626",
            borderRadius: 14,
            paddingVertical: 14,
            alignItems: "center",
            marginBottom: 12,
            opacity: loading ? 0.6 : 1,
          }}>
          {loading ? (
            <ActivityIndicator size="small" color="#DC2626" />
          ) : (
            <Text style={{ color: "#DC2626", fontWeight: "700", fontSize: 14 }}>
              Annuler ma réservation
            </Text>
          )}
        </TouchableOpacity>
      )}

      <TouchableOpacity
        onPress={onClose}
        style={{
          backgroundColor: "#065f46",
          borderRadius: 14,
          paddingVertical: 14,
          alignItems: "center",
        }}>
        <Text style={{ color: "#fff", fontWeight: "800", fontSize: 14 }}>
          Retour à l'accueil
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

// ─── Modal Paramètres ─────────────────────────────────────────────────────────

const SettingsModal: React.FC<{ visible: boolean; onClose: () => void }> = ({ visible, onClose }) => {
  const { settings, setSettings } = useAppSettings();
  const slideAnim = useRef(new Animated.Value(600)).current;

  useEffect(() => {
    if (visible) {
      Animated.spring(slideAnim, { toValue: 0, tension: 65, friction: 9, useNativeDriver: true }).start();
    } else {
      Animated.timing(slideAnim, { toValue: 600, duration: 250, useNativeDriver: true }).start();
    }
  }, [visible]);

  const themeOptions: ThemeMode[] = ["light", "dark", "green"];
  const langOptions: { code: AppLanguage; label: string; iconName: string; iconLib: "Ionicons" | "MaterialIcons" | "FontAwesome" }[] = [
    { code: "fr", label: "Français", iconName: "flag", iconLib: "Ionicons" },
    { code: "en", label: "English", iconName: "language", iconLib: "MaterialIcons" },
    { code: "dioula", label: "Dioula", iconName: "earth", iconLib: "Ionicons" },
  ];

  const currentTheme = THEMES[settings.theme];

  return (
    <Modal transparent animationType="none" visible={visible} onRequestClose={onClose}>
      <TouchableOpacity style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.55)" }} activeOpacity={1} onPress={onClose}>
        <Animated.View style={{ position: "absolute", bottom: 0, left: 0, right: 0, transform: [{ translateY: slideAnim }] }}>
          <TouchableOpacity activeOpacity={1}>
            <View style={{
              backgroundColor: currentTheme.card,
              borderTopLeftRadius: 28,
              borderTopRightRadius: 28,
              paddingHorizontal: 24,
              paddingTop: 20,
              paddingBottom: 40,
            }}>
              {/* Handle */}
              <View style={{ width: 40, height: 4, backgroundColor: currentTheme.border, borderRadius: 2, alignSelf: "center", marginBottom: 20 }} />

              {/* Title */}
              <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 24 }}>
                <View style={{ width: 38, height: 38, borderRadius: 19, backgroundColor: currentTheme.primary + "22", alignItems: "center", justifyContent: "center", marginRight: 12 }}>
                  <Ionicons name="settings" size={20} color={currentTheme.primary} />
                </View>
                <Text style={{ fontSize: 18, fontWeight: "900", color: currentTheme.text }}>Paramètres</Text>
              </View>

              {/* Thème */}
              <Text style={{ fontSize: 11, fontWeight: "700", color: currentTheme.subtext, textTransform: "uppercase", letterSpacing: 1, marginBottom: 12 }}>
                Thème d'affichage
              </Text>
              <View style={{ flexDirection: "row", gap: 10, marginBottom: 24 }}>
                {themeOptions.map((mode) => {
                  const th = THEMES[mode];
                  const selected = settings.theme === mode;
                  return (
                    <TouchableOpacity
                      key={mode}
                      onPress={() => setSettings({ ...settings, theme: mode })}
                      style={{
                        flex: 1,
                        borderRadius: 14,
                        padding: 12,
                        alignItems: "center",
                        borderWidth: selected ? 2 : 1.5,
                        borderColor: selected ? th.primary : currentTheme.border,
                        backgroundColor: selected ? th.primary + "18" : currentTheme.bg,
                      }}>
                      <View style={{
                        width: 30, height: 30, borderRadius: 15,
                        backgroundColor: th.primary, marginBottom: 6,
                        alignItems: "center", justifyContent: "center",
                      }}>
                        <Ionicons name={th.labelIcon as any} size={16} color="#fff" />
                      </View>
                      <Text style={{ fontSize: 11, fontWeight: selected ? "800" : "500", color: selected ? th.primary : currentTheme.subtext }}>{th.label}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* Langue */}
              <Text style={{ fontSize: 11, fontWeight: "700", color: currentTheme.subtext, textTransform: "uppercase", letterSpacing: 1, marginBottom: 12 }}>
                Langue
              </Text>
              {langOptions.map(({ code, label, iconName, iconLib }) => {
                const selected = settings.language === code;
                const IconComp = iconLib === "MaterialIcons" ? MaterialIcons : Ionicons;
                return (
                  <TouchableOpacity
                    key={code}
                    onPress={() => setSettings({ ...settings, language: code })}
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      padding: 14,
                      borderRadius: 14,
                      marginBottom: 10,
                      borderWidth: 1.5,
                      borderColor: selected ? currentTheme.primary : currentTheme.border,
                      backgroundColor: selected ? currentTheme.primary + "12" : currentTheme.card,
                    }}>
                    <View style={{
                      width: 34, height: 34, borderRadius: 17, marginRight: 12,
                      backgroundColor: selected ? currentTheme.primary + "22" : currentTheme.border + "55",
                      alignItems: "center", justifyContent: "center",
                    }}>
                      <IconComp name={iconName as any} size={18} color={selected ? currentTheme.primary : currentTheme.subtext} />
                    </View>
                    <Text style={{ fontSize: 14, fontWeight: selected ? "800" : "400", color: selected ? currentTheme.primary : currentTheme.text, flex: 1 }}>{label}</Text>
                    {selected && <Ionicons name="checkmark-circle" size={20} color={currentTheme.primary} />}
                  </TouchableOpacity>
                );
              })}

              <TouchableOpacity
                onPress={onClose}
                style={{ backgroundColor: currentTheme.primary, borderRadius: 14, paddingVertical: 14, alignItems: "center", marginTop: 6 }}>
                <Text style={{ color: "#fff", fontWeight: "800", fontSize: 14 }}>Enregistrer et fermer</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </Animated.View>
      </TouchableOpacity>
    </Modal>
  );
};

// ─── App principale ───────────────────────────────────────────────────────────

export default function App() {
  const [modalVisible, setModalVisible] = useState(false);
  const [logementSelectionne, setLogementSelectionne] =
    useState<Logement | null>(null);
  const [nom, setNom] = useState("");
  const [telephone, setTelephone] = useState("");
  const [revenu, setRevenu] = useState("");
  const [chargement, setChargement] = useState(false);

  const [confirmationVisible, setConfirmationVisible] = useState(false);
  const [reservationActive, setReservationActive] =
    useState<Reservation | null>(null);

  const [searchQuery, setSearchQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  const [settingsVisible, setSettingsVisible] = useState(false);

  // Budget filter
  const [budget, setBudget] = useState(100000);
  const budgetActive = budget < 100000;

  // Géolocalisation
  const [isGeoLoading, setIsGeoLoading] = useState(false);
  const [geoVille, setGeoVille] = useState<string | null>(null);

  const [appSettings, setAppSettings] = useState<AppSettings>({ theme: "light", language: "fr" });
  const currentTheme = THEMES[appSettings.theme];
  const t = (key: string) => TRANSLATIONS[appSettings.language][key] ?? TRANSLATIONS["fr"][key] ?? key;

  const { height: windowHeight } = useWindowDimensions();
  const listContainerHeight = windowHeight - 160;

  // ─── Géolocalisation : trouver les logements proches
  const handleGeoSearch = async () => {
    setIsGeoLoading(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(
          "Localisation refusée",
          "Activez la localisation pour trouver des logements près de vous.",
          [{ text: "OK" }]
        );
        setIsGeoLoading(false);
        return;
      }
      const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      const { latitude, longitude } = loc.coords;

      // Trouver le logement le plus proche
      const avecDistance = LOGEMENTS_DATA.map((l) => {
        if (!l.latitude || !l.longitude) return { ...l, dist: Infinity };
        const dLat = (l.latitude - latitude) * (Math.PI / 180);
        const dLon = (l.longitude - longitude) * (Math.PI / 180);
        const a = Math.sin(dLat / 2) ** 2 +
          Math.cos(latitude * (Math.PI / 180)) * Math.cos(l.latitude * (Math.PI / 180)) * Math.sin(dLon / 2) ** 2;
        const dist = 6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)); // km
        return { ...l, dist };
      });

      const plusProche = avecDistance.sort((a, b) => a.dist - b.dist)[0];
      const ville = plusProche.quartier.split(",")[0];
      setGeoVille(ville);
      setSearchQuery(ville);

      Alert.alert(
        "Logements proches",
        `Logement le plus proche : ${plusProche.quartier} (${Math.round(plusProche.dist)} km)`,
        [{ text: "Voir" }]
      );
    } catch (e) {
      Alert.alert("Erreur", "Impossible d'obtenir votre position.");
    } finally {
      setIsGeoLoading(false);
    }
  };

  const logementsFiltres = LOGEMENTS_DATA.filter((l) => {
    const matchQuery = searchQuery.trim()
      ? (l.quartier.toLowerCase().includes(searchQuery.toLowerCase()) ||
         l.pieces.toLowerCase().includes(searchQuery.toLowerCase()))
      : true;
    const matchBudget = budgetActive ? l.prixNum <= budget : true;
    return matchQuery && matchBudget;
  });

  const onViewableItemsChanged = useRef(({ viewableItems }: any) => {
    if (viewableItems.length > 0 && viewableItems[0].index !== null) {
      setActiveIndex(viewableItems[0].index);
    }
  }).current;

  const viewabilityConfig = useRef({ itemVisiblePercentThreshold: 60 }).current;

  const gererPaiement = () => {
    if (!nom || !telephone || !revenu) {
      Alert.alert("Champs manquants", "Merci de remplir tous les champs.");
      return;
    }
    setChargement(true);
    setTimeout(() => {
      const reservation: Reservation = {
        id: Math.random().toString(36).substring(2, 8).toUpperCase(),
        logementId: logementSelectionne!.id,
        nom,
        telephone,
        revenu,
        date: new Date().toLocaleDateString("fr-FR", {
          day: "2-digit",
          month: "long",
          year: "numeric",
        }),
        statut: "active",
      };
      setChargement(false);
      setModalVisible(false);
      setReservationActive(reservation);
      setConfirmationVisible(true);
      setNom("");
      setTelephone("");
      setRevenu("");
    }, 2000);
  };

  return (
    <AppSettingsContext.Provider value={{ settings: appSettings, setSettings: setAppSettings, t, theme: currentTheme }}>
    <SafeAreaView
      style={{ flex: 1, backgroundColor: currentTheme.primary }}
      edges={["top"]}>
      <View style={{ flex: 1, backgroundColor: "#000" }}>
        {/* EN-TÊTE */}
        <View
          style={{
            height: 60,
            backgroundColor: currentTheme.primary,
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            paddingHorizontal: 18,
          }}>
          <View>
            <Text
              style={{
                color: "#fff",
                fontSize: 20,
                fontWeight: "900",
                letterSpacing: 3,
              }}>
              GBA-ÉCO
            </Text>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
              <Text style={{ color: "rgba(255,255,255,0.5)", fontSize: 9, letterSpacing: 1 }}>
                {t("appSubtitle")}
              </Text>
              {geoVille && (
                <View style={{
                  flexDirection: "row", alignItems: "center", gap: 2,
                  backgroundColor: "rgba(52,211,153,0.25)", paddingHorizontal: 6,
                  paddingVertical: 2, borderRadius: 8,
                }}>
                  <Ionicons name="navigate" size={8} color="#34d399" />
                  <Text style={{ color: "#34d399", fontSize: 8, fontWeight: "700" }}>{geoVille}</Text>
                </View>
              )}
              {budgetActive && (
                <View style={{
                  flexDirection: "row", alignItems: "center", gap: 2,
                  backgroundColor: "rgba(251,191,36,0.25)", paddingHorizontal: 6,
                  paddingVertical: 2, borderRadius: 8,
                }}>
                  <Ionicons name="wallet" size={8} color="#FBBF24" />
                  <Text style={{ color: "#FBBF24", fontSize: 8, fontWeight: "700" }}>
                    ≤{(budget / 1000).toFixed(0)}k F
                  </Text>
                </View>
              )}
            </View>
          </View>
          {/* Paramètres */}
          <TouchableOpacity style={{ padding: 6 }} onPress={() => setSettingsVisible(true)}>
            <Ionicons name="settings-outline" size={23} color="#fff" />
          </TouchableOpacity>
         {/* Fin Paramètres */}
        </View>

        <SearchBar
          onSearch={setSearchQuery}
          onBudgetChange={setBudget}
          onGeoSearch={handleGeoSearch}
          isGeoLoading={isGeoLoading}
          budget={budget}
          budgetActive={budgetActive}
        />

        {logementsFiltres.length > 0 ? (
          <FlatList
            data={logementsFiltres}
            renderItem={({ item, index }) => (
              <VideoCard
                item={item}
                onSelect={(l) => {
                  setLogementSelectionne(l);
                  setModalVisible(true);
                }}
                containerHeight={listContainerHeight}
                isActive={index === activeIndex}
              />
            )}
            keyExtractor={(item) => item.id}
            snapToAlignment="start"
            decelerationRate="fast"
            snapToInterval={listContainerHeight}
            pagingEnabled
            showsVerticalScrollIndicator={false}
            removeClippedSubviews={false}
            onViewableItemsChanged={onViewableItemsChanged}
            viewabilityConfig={viewabilityConfig}
          />
        ) : (
          <View
            style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
            <Ionicons name="home-outline" size={52} color="#374151" />
            <Text
              style={{
                color: "#9CA3AF",
                fontSize: 16,
                fontWeight: "600",
                marginTop: 12,
              }}>
              Aucun logement trouvé
            </Text>
            {budgetActive && (
              <Text style={{ color: "#6B7280", fontSize: 13, marginTop: 6, textAlign: "center", paddingHorizontal: 32 }}>
                Budget : max {budget.toLocaleString("fr-FR")} FCFA/mois{"\n"}Essayez d'augmenter votre budget
              </Text>
            )}
          </View>
        )}

        {/* MODALE RÉSERVATION */}
        <Modal
          animationType="slide"
          transparent={false}
          visible={modalVisible}
          onRequestClose={() => {
            if (!chargement) setModalVisible(false);
          }}>
          <SafeAreaView style={{ flex: 1, backgroundColor: "#F9FAFB" }}>
            <ScrollView
              style={{ flex: 1, paddingHorizontal: 20 }}
              showsVerticalScrollIndicator={false}>
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  marginTop: 14,
                  marginBottom: 20,
                }}>
                <TouchableOpacity
                  disabled={chargement}
                  onPress={() => setModalVisible(false)}
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 20,
                    backgroundColor: "#fff",
                    alignItems: "center",
                    justifyContent: "center",
                    shadowColor: "#000",
                    shadowOpacity: 0.07,
                    shadowRadius: 6,
                    elevation: 2,
                    opacity: chargement ? 0.4 : 1,
                  }}>
                  <Ionicons name="arrow-back" size={22} color="#065f46" />
                </TouchableOpacity>
                <Text
                  style={{
                    fontSize: 18,
                    fontWeight: "900",
                    color: "#111827",
                    marginLeft: 14,
                  }}>
                  Réserver ce logement
                </Text>
              </View>

              {logementSelectionne && (
                <View
                  style={{
                    backgroundColor: "#F0FDF4",
                    borderRadius: 14,
                    padding: 14,
                    borderWidth: 1,
                    borderColor: "#A7F3D0",
                    marginBottom: 20,
                  }}>
                  <Text
                    style={{
                      fontSize: 11,
                      color: "#065f46",
                      fontWeight: "700",
                      textTransform: "uppercase",
                      letterSpacing: 1,
                    }}>
                    Logement sélectionné
                  </Text>
                  <Text
                    style={{
                      fontSize: 14,
                      fontWeight: "700",
                      color: "#111827",
                      marginTop: 4,
                    }}>
                    {logementSelectionne.pieces}
                  </Text>
                  <View style={{ flexDirection: "row", alignItems: "center", marginTop: 2 }}>
                    <MaterialIcons name="location-on" size={13} color="#6B7280" />
                    <Text
                      style={{ fontSize: 12, color: "#6B7280", marginTop: 2, marginLeft: 2 }}>
                      {logementSelectionne.quartier}
                    </Text>
                  </View>
                  <Text
                    style={{
                      fontSize: 13,
                      fontWeight: "800",
                      color: "#15803D",
                      marginTop: 6,
                    }}>
                    {logementSelectionne.prix} FCFA / mois
                  </Text>
                </View>
              )}

              <View
                style={{
                  backgroundColor: "#fff",
                  borderRadius: 20,
                  padding: 20,
                  shadowColor: "#000",
                  shadowOpacity: 0.06,
                  shadowRadius: 10,
                  elevation: 3,
                  marginBottom: 30,
                  borderWidth: 1,
                  borderColor: "#F3F4F6",
                }}>
                {/* Champs */}
                {[
                  {
                    label: "1 · Nom et Prénom",
                    placeholder: "Ex : Kouadio Yao",
                    value: nom,
                    onChangeText: setNom,
                    keyboard: "default",
                  },
                  {
                    label: "2 · Numéro Mobile Money",
                    placeholder: "Ex : 0707 07 07 07",
                    value: telephone,
                    onChangeText: setTelephone,
                    keyboard: "phone-pad",
                  },
                ].map((field, i) => (
                  <View key={i}>
                    <Text
                      style={{
                        fontSize: 11,
                        fontWeight: "700",
                        color: "#6B7280",
                        textTransform: "uppercase",
                        letterSpacing: 0.8,
                        marginBottom: 8,
                      }}>
                      {field.label}
                    </Text>
                    <TextInput
                      editable={!chargement}
                      style={{
                        backgroundColor: "#F9FAFB",
                        borderWidth: 1.5,
                        borderColor: "#E5E7EB",
                        borderRadius: 12,
                        padding: 14,
                        fontSize: 15,
                        color: "#111827",
                        marginBottom: 20,
                      }}
                      placeholder={field.placeholder}
                      placeholderTextColor="#9CA3AF"
                      keyboardType={field.keyboard as any}
                      value={field.value}
                      onChangeText={field.onChangeText}
                    />
                  </View>
                ))}

                <Text
                  style={{
                    fontSize: 11,
                    fontWeight: "700",
                    color: "#6B7280",
                    textTransform: "uppercase",
                    letterSpacing: 0.8,
                    marginBottom: 8,
                  }}>
                  3 · Tranche de revenu mensuel
                </Text>
                {[
                  "Moins de 75 000 F",
                  "75 000 à 150 000 F",
                  "Plus de 150 000 F",
                ].map((option) => {
                  const selected = revenu === option;
                  return (
                    <TouchableOpacity
                      key={option}
                      onPress={() => setRevenu(option)}
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        padding: 14,
                        borderRadius: 12,
                        marginBottom: 8,
                        borderWidth: 1.5,
                        borderColor: selected ? "#059669" : "#E5E7EB",
                        backgroundColor: selected ? "#F0FDF4" : "#fff",
                      }}>
                      <View
                        style={{
                          width: 18,
                          height: 18,
                          borderRadius: 9,
                          borderWidth: 2,
                          borderColor: selected ? "#059669" : "#D1D5DB",
                          backgroundColor: selected ? "#059669" : "transparent",
                          alignItems: "center",
                          justifyContent: "center",
                          marginRight: 12,
                        }}>
                        {selected && (
                          <View
                            style={{
                              width: 6,
                              height: 6,
                              borderRadius: 3,
                              backgroundColor: "#fff",
                            }}
                          />
                        )}
                      </View>
                      <Text
                        style={{
                          fontSize: 14,
                          color: selected ? "#065f46" : "#374151",
                          fontWeight: selected ? "700" : "400",
                        }}>
                        {option}
                      </Text>
                    </TouchableOpacity>
                  );
                })}

                <View
                  style={{
                    backgroundColor: "#FFFBEB",
                    borderRadius: 12,
                    padding: 12,
                    borderWidth: 1,
                    borderColor: "#FDE68A",
                    marginTop: 8,
                    marginBottom: 16,
                    flexDirection: "row",
                    alignItems: "center",
                  }}>
                  <Ionicons
                    name="information-circle-outline"
                    size={18}
                    color="#D97706"
                  />
                  <Text
                    style={{
                      fontSize: 12,
                      color: "#92400E",
                      flex: 1,
                      marginLeft: 8,
                    }}>
                    Réserver pour :{" "}
                    <Text style={{ fontWeight: "800" }}>2 000 FCFA</Text> via
                    Mobile Money pendant 24h
                  </Text>
                </View>

                <TouchableOpacity
                  disabled={chargement}
                  onPress={gererPaiement}
                  style={{
                    backgroundColor: "#065f46",
                    paddingVertical: 16,
                    borderRadius: 14,
                    alignItems: "center",
                    opacity: chargement ? 0.6 : 1,
                  }}>
                  {chargement ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <Text
                      style={{
                        color: "#fff",
                        fontSize: 15,
                        fontWeight: "800",
                        letterSpacing: 0.5,
                      }}>
                      PAYER 2 000 FCFA →
                    </Text>
                  )}
                </TouchableOpacity>
              </View>
            </ScrollView>
          </SafeAreaView>
        </Modal>

        {/* MODALE CONFIRMATION */}
        <Modal
          animationType="slide"
          transparent={false}
          visible={confirmationVisible}
          onRequestClose={() => setConfirmationVisible(false)}>
          <SafeAreaView style={{ flex: 1, backgroundColor: "#F9FAFB" }}>
            {reservationActive && logementSelectionne && (
              <ConfirmationScreen
                reservation={reservationActive}
                logement={logementSelectionne}
                onAnnuler={(id) =>
                  setReservationActive({
                    ...reservationActive,
                    statut: "annulee",
                  })
                }
                onClose={() => setConfirmationVisible(false)}
              />
            )}
          </SafeAreaView>
        </Modal>

        {/* MODALE PARAMÈTRES */}
        <SettingsModal visible={settingsVisible} onClose={() => setSettingsVisible(false)} />
      </View>
    </SafeAreaView>
    </AppSettingsContext.Provider>
  );
}
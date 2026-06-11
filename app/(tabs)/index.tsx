import React, { useEffect, useState, useRef, useCallback } from "react";
import {
  Alert,
  FlatList,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Modal,
  useWindowDimensions,
  ActivityIndicator,
  ViewToken,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useVideoPlayer, VideoView } from "expo-video";
import { FontAwesome, MaterialIcons, Ionicons } from "@expo/vector-icons";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Logement {
  id: string;
  quartier: string;
  pieces: string;
  prix: string;
  videoUrl: string;
}

// ─── Données ──────────────────────────────────────────────────────────────────

const LOGEMENTS_DATA: Logement[] = [
  {
    id: "1",
    quartier: "Bouaké, Air France (Eco-Quartier)",
    pieces: "3 Pièces en Briques de Terre Comprimée (BTC)",
    prix: "35 000",
    videoUrl: "https://vt.tiktok.com/ZSQUrjHQo/",
  },
  {
    id: "2",
    quartier: "Bouaké, Nimbo (Concept Bioclimatique)",
    pieces: "2 Pièces (Zéro climatisation, ventilation naturelle)",
    prix: "28 000",
    videoUrl: "https://mixkit.co",
  },
  {
    id: "3",
    quartier: "Yamoussoukro, Habitat Social",
    pieces: "Studio Moderne (Toiture végétale & matériaux locaux)",
    prix: "20 000",
    videoUrl: "https://googleapis.com",
  },
];

// Termes pour les suggestions de recherche
const SUGGESTIONS_POOL = [
  "Bouaké",
  "Yamoussoukro",
  "Abidjan",
  "Studio",
  "2 pièces",
  "3 pièces",
  "Terre comprimée",
  "Ventilation naturelle",
  "Toiture végétale",
  "Logement social",
  "Eco-Quartier",
  "Bioclimatique",
];

// ─── Barre de recherche dynamique ────────────────────────────────────────────

interface SearchBarProps {
  onSearch: (query: string) => void;
}

const SearchBar: React.FC<SearchBarProps> = ({ onSearch }) => {
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [focused, setFocused] = useState(false);

  const handleChange = useCallback(
    (text: string) => {
      setQuery(text);
      onSearch(text);

      if (!text.trim()) {
        setSuggestions([]);
        return;
      }
      const lower = text.toLowerCase();
      const matches = SUGGESTIONS_POOL.filter((s) =>
        s.toLowerCase().includes(lower)
      ).slice(0, 5);
      setSuggestions(matches);
    },
    [onSearch]
  );

  const handleSelect = (val: string) => {
    setQuery(val);
    setSuggestions([]);
    onSearch(val);
  };

  const handleClear = () => {
    setQuery("");
    setSuggestions([]);
    onSearch("");
  };

  return (
    <View className="px-4 py-2 bg-emerald-700" style={{ zIndex: 20 }}>
      {/* Champ de saisie */}
      <View className="flex-row items-center bg-white/15 rounded-2xl px-3 py-2 border border-white/20">
        <Ionicons name="search-outline" size={18} color="rgba(255,255,255,0.7)" />
        <TextInput
          className="flex-1 text-white text-sm ml-2"
          placeholder="Rechercher par quartier, type…"
          placeholderTextColor="rgba(255,255,255,0.5)"
          value={query}
          onChangeText={handleChange}
          onFocus={() => setFocused(true)}
          onBlur={() => setTimeout(() => setFocused(false), 150)}
          returnKeyType="search"
        />
        {query.length > 0 && (
          <TouchableOpacity onPress={handleClear} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Ionicons name="close-circle" size={18} color="rgba(255,255,255,0.6)" />
          </TouchableOpacity>
        )}
      </View>

      {/* Suggestions déroulantes */}
      {focused && suggestions.length > 0 && (
        <View
          className="bg-white rounded-2xl mt-1 overflow-hidden border border-gray-100"
          style={{ position: "absolute", top: 52, left: 16, right: 16, zIndex: 30 }}
        >
          {suggestions.map((s, i) => (
            <TouchableOpacity
              key={i}
              className={`flex-row items-center px-4 py-3 ${
                i < suggestions.length - 1 ? "border-b border-gray-100" : ""
              }`}
              onPress={() => handleSelect(s)}
            >
              <Ionicons name="leaf-outline" size={15} color="#3B7A57" />
              <Text className="text-gray-700 text-sm ml-2">{s}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
  );
};

// ─── Carte vidéo (lecture auto selon visibilité) ──────────────────────────────

interface LogementVideoItemProps {
  item: Logement;
  onSelect: (logement: Logement) => void;
  containerHeight: number;
  isActive: boolean; // ← nouveau prop : contrôle lecture/pause
}

const LogementVideoItem: React.FC<LogementVideoItemProps> = ({
  item,
  onSelect,
  containerHeight,
  isActive,
}) => {
  const player = useVideoPlayer(item.videoUrl, (p) => {
    p.loop = true;
    p.muted = true;
  });

  // Lecture auto/pause selon visibilité (style TikTok)
  useEffect(() => {
    if (!player) return;

    if (isActive) {
      if (player.status === "readyToPlay") {
        player.play();
      } else {
        // Attendre que la vidéo soit prête
        const sub = player.addListener("statusChange", (status) => {
          if (status === "readyToPlay") {
            player.play();
          }
        });
        return () => sub.remove();
      }
    } else {
      player.pause();
    }
  }, [isActive, player]);

  return (
    <View
      style={{ height: containerHeight }}
      className="bg-black justify-end relative"
    >
      {/* Vidéo plein écran */}
      <VideoView
        className="absolute inset-0 w-full h-full bg-black"
        player={player}
        nativeControls={false}
        contentFit="cover"
      />

      {/* Badge matériaux */}
      <Text className="absolute top-12 left-4 bg-emerald-700/90 text-white py-1.5 px-3 rounded-full text-xs font-bold z-10 overflow-hidden">
        Matériaux Locaux (BTC)
      </Text>

      {/* Indicateur de lecture */}
      {!isActive && (
        <View className="absolute inset-0 items-center justify-center z-10">
          <View className="bg-black/40 rounded-full p-4">
            <Ionicons name="play" size={32} color="white" />
          </View>
        </View>
      )}

      {/* Carte infos */}
      <View className="bg-white/95 mx-4 mt-4 mb-16 rounded-2xl p-4 shadow-xl border border-gray-100">
        {/* Bouton audio */}
        <TouchableOpacity className="flex-row items-center bg-orange-50 border border-orange-200 p-2.5 rounded-xl mb-3">
          <Ionicons name="volume-high" size={18} color="#C35237" />
          <Text className="text-orange-800 text-xs font-semibold flex-1 ml-2">
            Écouter les détails de cette maison
          </Text>
        </TouchableOpacity>

        {/* Localisation */}
        <View className="flex-row items-center mb-1.5">
          <MaterialIcons name="location-on" size={18} color="#3B7A57" />
          <Text className="text-sm font-bold text-gray-800 flex-1 ml-1">
            {item.quartier}
          </Text>
        </View>

        {/* Type de logement */}
        <View className="flex-row items-center mb-2">
          <FontAwesome name="home" size={16} color="#555" />
          <Text className="text-xs text-gray-600 flex-1 ml-2" numberOfLines={2}>
            {item.pieces}
          </Text>
        </View>

        {/* Prix */}
        <View className="flex-row items-center bg-green-50 py-1.5 px-2.5 rounded-lg self-start mb-3">
          <FontAwesome name="money" size={14} color="#2E7D32" />
          <Text className="text-green-700 text-xs font-bold ml-2">
            Loyer : {item.prix} FCFA / mois
          </Text>
        </View>

        {/* CTA */}
        <TouchableOpacity
          className="bg-emerald-700 py-3.5 rounded-xl items-center shadow-md active:bg-emerald-800"
          onPress={() => onSelect(item)}
        >
          <Text className="text-white text-sm font-bold tracking-wide">
            JE VEUX CETTE MAISON
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

// ─── Écran principal ──────────────────────────────────────────────────────────

export default function App() {
  const [modalVisible, setModalVisible] = useState(false);
  const [logementSelectionne, setLogementSelectionne] = useState<Logement | null>(null);
  const [nom, setNom] = useState("");
  const [telephone, setTelephone] = useState("");
  const [revenu, setRevenu] = useState("");
  const [chargement, setChargement] = useState(false);

  // Recherche
  const [searchQuery, setSearchQuery] = useState("");

  // Index de la vidéo active (lecture auto)
  const [activeIndex, setActiveIndex] = useState(0);

  const { height: windowHeight } = useWindowDimensions();
  // On réserve : header (64px) + searchbar (~52px) + safe area (~44px)
  const listContainerHeight = windowHeight - 160;

  // Filtrage dynamique des logements
  const logementsFiltres = searchQuery.trim()
    ? LOGEMENTS_DATA.filter((l) => {
        const q = searchQuery.toLowerCase();
        return (
          l.quartier.toLowerCase().includes(q) ||
          l.pieces.toLowerCase().includes(q) ||
          l.prix.includes(q)
        );
      })
    : LOGEMENTS_DATA;

  // Détection de la vidéo visible (TikTok scroll)
  const onViewableItemsChanged = useRef(
    ({ viewableItems }: { viewableItems: ViewToken[] }) => {
      if (viewableItems.length > 0 && viewableItems[0].index !== null) {
        setActiveIndex(viewableItems[0].index);
      }
    }
  ).current;

  const viewabilityConfig = useRef({
    itemVisiblePercentThreshold: 60,
  }).current;

  const initierReservation = (logement: Logement) => {
    setLogementSelectionne(logement);
    setModalVisible(true);
  };

  const gererPaiement = () => {
    if (!nom || !telephone || !revenu) {
      Alert.alert("Erreur", "S'il vous plaît, remplissez toutes les cases.");
      return;
    }
    setChargement(true);
    setTimeout(() => {
      setChargement(false);
      Alert.alert(
        "Demande envoyée",
        `Une notification de paiement de 2 000 FCFA a été envoyée sur le numéro ${telephone}.`,
        [
          {
            text: "OK",
            onPress: () => {
              setNom("");
              setTelephone("");
              setRevenu("");
              setModalVisible(false);
            },
          },
        ]
      );
    }, 2000);
  };

  return (
    <SafeAreaView className="flex-1 bg-emerald-700" edges={["top"]}>
      <View className="flex-1 bg-gray-50">

        {/* EN-TÊTE */}
        <View className="h-16 bg-emerald-700 flex-row items-center justify-between px-4">
          <Text className="text-white text-xl font-bold tracking-widest">GBA-ÉCO</Text>
          <TouchableOpacity className="p-1">
            <Ionicons name="settings-outline" size={24} color="#FFF" />
          </TouchableOpacity>
        </View>

        {/* BARRE DE RECHERCHE DYNAMIQUE */}
        <SearchBar onSearch={setSearchQuery} />

        {/* FEED VIDÉO */}
        {logementsFiltres.length > 0 ? (
          <FlatList
            data={logementsFiltres}
            renderItem={({ item, index }) => (
              <LogementVideoItem
                item={item}
                onSelect={initierReservation}
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
          // État vide si aucun résultat
          <View className="flex-1 items-center justify-center gap-3">
            <Ionicons name="home-outline" size={56} color="#9CA3AF" />
            <Text className="text-gray-500 text-base font-medium">
              Aucun logement trouvé
            </Text>
            <Text className="text-gray-400 text-sm text-center px-8">
              Essayez "Bouaké", "Studio" ou "Terre comprimée"
            </Text>
          </View>
        )}

        {/* MODALE RÉSERVATION (inchangée) */}
        <Modal
          animationType="slide"
          transparent={false}
          visible={modalVisible}
          onRequestClose={() => {
            if (!chargement) setModalVisible(false);
          }}
        >
          <SafeAreaView className="flex-1 bg-gray-50/50">
            <ScrollView className="flex-1 px-5" showsVerticalScrollIndicator={false}>

              <TouchableOpacity
                disabled={chargement}
                className={`mt-4 p-2 bg-white rounded-full w-10 h-10 items-center justify-center shadow-sm border border-gray-100 ${chargement ? "opacity-40" : ""}`}
                onPress={() => setModalVisible(false)}
              >
                <Ionicons name="arrow-back" size={22} color="#3B7A57" />
              </TouchableOpacity>

              <View className="pb-12 mt-4">
                <View className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 mb-6">
                  <Text className="text-xl font-black text-emerald-800 mb-1 text-center tracking-wide">
                    RÉSERVATION
                  </Text>

                  {logementSelectionne && (
                    <Text className="text-xs text-gray-400 text-center mb-5 uppercase tracking-wider">
                      Logement :{" "}
                      <Text className="font-semibold text-gray-700 normal-case">
                        {logementSelectionne.pieces} à {logementSelectionne.quartier}
                      </Text>
                    </Text>
                  )}

                  {/* Bouton audio */}
                  <TouchableOpacity className="flex-row items-center bg-orange-50/60 border border-orange-100 p-3 rounded-xl mb-6">
                    <View className="w-8 h-8 bg-orange-100 rounded-full items-center justify-center mr-3">
                      <Ionicons name="volume-high" size={16} color="#C35237" />
                    </View>
                    <Text className="text-orange-900 text-xs font-medium flex-1">
                      Écouter les instructions de paiement
                    </Text>
                  </TouchableOpacity>

                  {/* Nom */}
                  <Text className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                    1. Votre Nom et Prénom
                  </Text>
                  <TextInput
                    editable={!chargement}
                    className="bg-white border border-gray-200 focus:border-emerald-600 rounded-xl p-3.5 text-base text-gray-800 mb-5"
                    placeholder="Ex: Kouadio Yao"
                    placeholderTextColor="#9CA3AF"
                    value={nom}
                    onChangeText={setNom}
                  />

                  {/* Téléphone */}
                  <Text className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                    2. Votre Numéro Mobile Money
                  </Text>
                  <TextInput
                    editable={!chargement}
                    className="bg-white border border-gray-200 focus:border-emerald-600 rounded-xl p-3.5 text-base text-gray-800 mb-5"
                    placeholder="Ex: 0707070707"
                    placeholderTextColor="#9CA3AF"
                    keyboardType="phone-pad"
                    value={telephone}
                    onChangeText={setTelephone}
                  />

                  {/* Revenu */}
                  <Text className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                    3. Votre tranche de revenu mensuel
                  </Text>
                  <View className="mb-5">
                    {["Moins de 75 000 F", "75 000 à 150 000 F", "Plus de 150 000 F"].map(
                      (option) => {
                        const isSelected = revenu === option;
                        return (
                          <TouchableOpacity
                            key={option}
                            className={`flex-row items-center bg-white p-4 rounded-xl border mb-2.5 ${
                              isSelected
                                ? "border-emerald-600 bg-emerald-50/20"
                                : "border-gray-200"
                            }`}
                            onPress={() => setRevenu(option)}
                          >
                            <View
                              className={`w-4 h-4 rounded-full border items-center justify-center mr-3 ${
                                isSelected
                                  ? "border-emerald-600 bg-emerald-600"
                                  : "border-gray-300"
                              }`}
                            >
                              {isSelected && (
                                <View className="w-1.5 h-1.5 bg-white rounded-full" />
                              )}
                            </View>
                            <Text
                              className={`text-sm ${
                                isSelected
                                  ? "text-emerald-900 font-semibold"
                                  : "text-gray-600"
                              }`}
                            >
                              {option}
                            </Text>
                          </TouchableOpacity>
                        );
                      }
                    )}
                  </View>

                  {/* Bouton paiement */}
                  <TouchableOpacity
                    disabled={chargement}
                    className={`bg-emerald-700 py-4 rounded-xl items-center shadow-md active:bg-emerald-800 ${
                      chargement ? "opacity-50" : ""
                    }`}
                    onPress={gererPaiement}
                  >
                    {chargement ? (
                      <ActivityIndicator size="small" color="#FFF" />
                    ) : (
                      <Text className="text-white text-sm font-bold tracking-wide">
                        PAYER 2 000 FCFA
                      </Text>
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            </ScrollView>
          </SafeAreaView>
        </Modal>
      </View>
    </SafeAreaView>
  );
}
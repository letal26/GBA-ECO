import React, { useEffect, useState } from "react";
import {
  Alert,
  Dimensions,
  FlatList,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from 'react-native-safe-area-context';

import { useVideoPlayer, VideoView } from "expo-video";
import { FontAwesome, MaterialIcons, Ionicons } from "@expo/vector-icons";

const { width, height } = Dimensions.get("window");

interface Logement {
  id: string;
  quartier: string;
  pieces: string;
  prix: string;
  videoUrl: string;
}

const LOGEMENTS_DATA: Logement[] = [
  {
    id: "1",
    quartier: "Bouaké, Air France (Eco-Quartier)",
    pieces: "3 Pièces en Briques de Terre Comprimée (BTC)",
    prix: "35 000",
    videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
  },
  {
    id: "2",
    quartier: "Bouaké, Nimbo (Concept Bioclimatique)",
    pieces: "2 Pièces (Zéro climatisation, ventilation naturelle)",
    prix: "28 000",
    videoUrl: "https://googleapis.com",
  },
  {
    id: "3",
    quartier: "Yamoussoukro, Habitat Social",
    pieces: "Studio Moderne (Toiture végétale & matériaux locaux)",
    prix: "20 000",
    videoUrl: "https://googleapis.com",
  },
];

const LogementVideoItem = ({
  item,
  onSelect,
}: {
  item: Logement;
  onSelect: (logement: Logement) => void;
}) => {
  const player = useVideoPlayer(item.videoUrl, (playerInstance) => {
    playerInstance.loop = true;  
    playerInstance.muted = true; 
  });

  useEffect(() => {
    if (!player) return;

    if (player.status === "readyToPlay") {
      player.play();
    }

    const subscription = player.addListener("statusChange", (status) => {
      if (status === "readyToPlay") {
        player.play();
      }
    });

    return () => {
      subscription.remove();
    };
  }, [player]);

  return (
    <View style={styles.logementItemPage}>
      <VideoView
        style={styles.videoPlayerStyle}
        player={player}
        nativeControls={false}
        contentFit="cover"
      />

      <Text style={styles.materialTag}>Matériaux Locaux (BTC)</Text>

      <View style={styles.infoZone}>
        <TouchableOpacity style={styles.audioButton}>
          <Ionicons name="volume-high" size={20} color="#C35237" style={styles.iconMargin} />
          <Text style={styles.audioText}>Écouter les détails de cette maison</Text>
        </TouchableOpacity>

        <View style={styles.rowInfo}>
          <MaterialIcons name="location-on" size={22} color="#3B7A57" style={styles.iconMargin} />
          <Text style={styles.textLocalisation}>{item.quartier}</Text>
        </View>

        <View style={styles.rowInfo}>
          <FontAwesome name="home" size={20} color="#555" style={styles.iconMargin} />
          <Text style={styles.textDetails}>{item.pieces}</Text>
        </View>

        <View style={styles.badgePrix}>
          <FontAwesome name="money" size={18} color="#2E7D32" style={styles.iconMargin} />
          <Text style={styles.textPrix}>Loyer : {item.prix} FCFA / mois</Text>
        </View>

        <TouchableOpacity
          style={styles.boutonPrincipal}
          onPress={() => onSelect(item)}
        >
          <Text style={styles.boutonPrincipalText}>JE VEUX CETTE MAISON</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default function App() {
  const [ecranActuel, setEcranActuel] = useState("catalogue");
  const [logementSelectionne, setLogementSelectionne] = useState<Logement | null>(null);

  const [nom, setNom] = useState("");
  const [telephone, setTelephone] = useState("");
  const [revenu, setRevenu] = useState("");

  const initierReservation = (Logement: Logement) => {
    setLogementSelectionne(Logement);
    setEcranActuel("reservation");
  };

  const gererPaiement = () => {
    if (!nom || !telephone || !revenu) {
      Alert.alert("Erreur", "S'il vous plaît, remplissez toutes les cases.");
      return;
    }

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
            setEcranActuel("catalogue");
          },
        },
      ],
    );
  };

  // --- ÉCRAN CATALOGUE ---
  if (ecranActuel === "catalogue") {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.logoText}>GBA-ÉCO</Text>
          <TouchableOpacity style={styles.iconButton}>
            <Ionicons name="settings-outline" size={24} color="#FFF" />
          </TouchableOpacity>
        </View>

        <FlatList
          data={LOGEMENTS_DATA}
          renderItem={({ item }) => (
            <LogementVideoItem item={item} onSelect={initierReservation} />
          )}
          keyExtractor={(item) => item.id}
          snapToAlignment="start"
          decelerationRate="fast"
          snapToInterval={height}
          pagingEnabled={true}
          showsVerticalScrollIndicator={false}
          removeClippedSubviews={false}
        />
      </View>
    );
  }

  // --- ÉCRAN FORMULAIRE (CORRIGÉ AVEC SAFEAREAVIEW) ---
  // --- ÉCRAN FORMULAIRE (AVEC L'ICÔNE EN PLACE DU TEXTE) ---
  return (
    <SafeAreaView style={styles.safeContainer}>
      <ScrollView style={styles.formScrollContainer}>
        
        {/* ✅ BOUTON RETOUR : Uniquement l'icône flèche, sans texte */}
        <TouchableOpacity
          style={styles.boutonRetour}
          onPress={() => setEcranActuel("catalogue")}
        >
          <Ionicons name="arrow-back" size={26} color="#3B7A57" />
        </TouchableOpacity>

        <View style={styles.formContainer}>
          <Text style={styles.titreForm}>RÉSERVATION</Text>
          {logementSelectionne && (
            <Text style={styles.SoustitreForm}>
              Logement :{" "}
              <Text style={styles.textHighlight}>
                {logementSelectionne.pieces} à {logementSelectionne.quartier}
              </Text>
            </Text>
          )}

          <TouchableOpacity style={styles.audioButtonForm}>
            <Ionicons name="volume-high" size={20} color="#C35237" style={styles.iconMargin} />
            <Text style={styles.audioText}>
              Écouter les instructions de paiement
            </Text>
          </TouchableOpacity>

          <Text style={styles.labelInput}>1. Votre Nom et Prénom</Text>
          <TextInput
            style={styles.input}
            placeholder="Ex: Kouadio Yao"
            value={nom}
            onChangeText={setNom}
          />

          <Text style={styles.labelInput}>2. Votre Numéro Mobile Money</Text>
          <TextInput
            style={styles.input}
            placeholder="Ex: 0707070707"
            keyboardType="phone-pad"
            value={telephone}
            onChangeText={setTelephone}
          />

          <Text style={styles.labelInput}>
            3. Votre revenu mensuel approximatif
          </Text>
          <View style={styles.radioGroup}>
            {["Moins de 75 000 F", "75 000 à 150 000 F", "Plus de 150 000 F"].map(
              (option) => (
                <TouchableOpacity
                  key={option}
                  style={[
                    styles.radioOption,
                    revenu === option && styles.radioOptionSelected,
                  ]}
                  onPress={() => setRevenu(option)}
                >
                  <Text
                    style={[
                      styles.radioText,
                      revenu === option && styles.radioTextSelected,
                    ]}
                  >
                    {option}
                  </Text>
                </TouchableOpacity>
              ),
            )}
          </View>

          <View style={styles.zonePaiementBox}>
            <Text style={styles.textGarantie}>
              Dépôt de garantie : 2 000 FCFA
            </Text>
            <Text style={styles.textGarantieInfo}>
              {"(Somme remboursable si vous changez d'avis)"}
            </Text>
            <TouchableOpacity style={styles.boutonPayer} onPress={gererPaiement}>
              <Ionicons name="checkmark-circle" size={20} color="#FFF" style={styles.iconMargin} />
              <Text style={styles.boutonPayerText}>
                PAYER 2 000 FCFA ET BLOQUER
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}


// --- DESIGN DE L'APPLICATION ---
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#000" },
  safeContainer: { flex: 1, backgroundColor: "#F5EFE6" }, 
  formScrollContainer: { flex: 1 },
  logementItemPage: { width: width, height: height, justifyContent: "flex-end" },
  videoPlayerStyle: { ...StyleSheet.absoluteFillObject },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingTop: 55, paddingHorizontal: 20, position: "absolute", top: 0, left: 0, right: 0, zIndex: 10 },
  iconButton: { padding: 8, backgroundColor: "transparent", borderRadius: 8 },
  logoText: { fontSize: 24, fontWeight: "bold", color: "#FFF", textShadowColor: "rgba(0,0,0,0.6)", textShadowOffset: { width: 1, height: 1 }, textShadowRadius: 5 },
  materialTag: { position: "absolute", top: 110, right: 20, backgroundColor: "#3B7A57", color: "#FFF", paddingHorizontal: 10, paddingVertical: 5, borderRadius: 15, fontSize: 11, fontWeight: "bold", zIndex: 10 },
  infoZone: { padding: 20, backgroundColor: "rgba(255, 255, 255, 0.95)", borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingBottom: 50, zIndex: 10 },
  
  audioButton: { flexDirection: "row", alignItems: "center", backgroundColor: "#C35237", padding: 10, borderRadius: 8, marginBottom: 15 },
  audioText: { color: "#FFF", fontWeight: "bold", fontSize: 14 },
  
  rowInfo: { flexDirection: "row", alignItems: "center", marginBottom: 10 },
  iconMargin: { marginRight: 8 },
  textLocalisation: { fontSize: 16, fontWeight: "600", color: "#3B7A57" },
  textDetails: { fontSize: 14, color: "#555" },
  
  badgePrix: { flexDirection: "row", alignItems: "center", backgroundColor: "#E8F5E9", paddingHorizontal: 10, paddingVertical: 5, borderRadius: 15, alignSelf: "flex-start", marginBottom: 20 },
  textPrix: { fontSize: 13, color: "#2E7D32", fontWeight: "600" },
  
  boutonPrincipal: { backgroundColor: "#3B7A57", padding: 15, borderRadius: 8, alignItems: "center" },
  boutonPrincipalText: { color: "#FFF", fontSize: 16, fontWeight: "bold" },
  

  textRetour: { color: "#3B7A57", fontSize: 14 },
  
  formContainer: { backgroundColor: "#FFF", borderRadius: 12, padding: 20, marginHorizontal: 20, shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 5 },
  titreForm: { fontSize: 22, fontWeight: "bold", color: "#3B7A57", marginBottom: 10 },
  SoustitreForm: { fontSize: 14, color: "#555", marginBottom: 20 },
  textHighlight: { color: "#C35237", fontWeight: "600" },
  
  audioButtonForm: { flexDirection: "row", alignItems: "center", backgroundColor: "#C35237", padding: 10, borderRadius: 8, marginBottom: 20 },
  
  labelInput: { fontSize: 14, color: "#333", marginBottom: 5 },
  input: { borderWidth: 1, borderColor: "#CCC", borderRadius: 8, paddingHorizontal: 10, paddingVertical: 8, marginBottom: 15 },
  
  radioGroup: { flexDirection: "column", marginBottom: 20 },
  radioOption: { paddingVertical: 10, paddingHorizontal: 15, borderWidth: 1, borderColor: "#CCC", borderRadius: 8, marginBottom: 10 },
  radioOptionSelected: { backgroundColor: "#3B7A57", borderColor: "#3B7A57" },
  radioTextSelected: { color: "#FFF", fontWeight: "600" },
  
  zonePaiementBox: { backgroundColor: "#E8F5E9", padding: 15, borderRadius: 12, alignItems: "center" },
  textGarantie: { fontSize: 14, color: "#2E7D32", fontWeight: "600" },
  textGarantieInfo: { fontSize: 12, color: "#555", marginBottom: 15 },
  
  boutonPayer: { flexDirection: "row", alignItems: "center", backgroundColor: "#2E7D32", paddingVertical: 12, paddingHorizontal: 20, borderRadius: 8 },
  boutonPayerText: { color: "#FFF", fontSize: 16, fontWeight: "bold" },
    boutonRetour: { 
    paddingTop: 15, 
    paddingBottom: 10, 
    paddingHorizontal: 20, 
    alignItems: "flex-start"
  },

}); 
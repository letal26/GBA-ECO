import { Tabs } from 'expo-router';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        // ✅ CETTE LIGNE MASQUE LA BARRE DU BAS SUR TOUS LES ÉCRANS DU GROUPE
        tabBarStyle: { display: 'none' }, 
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
        }}
      />
      <Tabs.Screen
        name="explore"
        options={{
          title: 'Explore',
        }}
      />
    </Tabs>
  );
}

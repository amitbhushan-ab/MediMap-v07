import React, { useState, useEffect } from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ActivityIndicator, View } from 'react-native';

import LoginScreen from '../screens/LoginScreen';
import CustomerHomeScreen from '../screens/CustomerHomeScreen';
import PharmacistDashboardScreen from '../screens/PharmacistDashboardScreen';

const Stack = createNativeStackNavigator();

export default function AppNavigator() {
  const [initialRoute, setInitialRoute] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const userStr = await AsyncStorage.getItem('medimap_user');
        if (userStr) {
          const user = JSON.parse(userStr);
          if (user.type === 'pharmacist') setInitialRoute('PharmacistDashboard');
          else setInitialRoute('CustomerHome');
        } else {
          setInitialRoute('Login');
        }
      } catch {
        setInitialRoute('Login');
      }
    })();
  }, []);

  if (!initialRoute) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#1B6EF3" />
      </View>
    );
  }

  return (
    <Stack.Navigator initialRouteName={initialRoute} screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="CustomerHome" component={CustomerHomeScreen} />
      <Stack.Screen name="PharmacistDashboard" component={PharmacistDashboardScreen} />
    </Stack.Navigator>
  );
}

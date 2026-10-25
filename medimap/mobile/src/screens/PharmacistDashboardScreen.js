import React, { useEffect, useState } from 'react';
import { View, Text, SafeAreaView, TouchableOpacity } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function PharmacistDashboardScreen({ navigation }) {
  const [user, setUser] = useState(null);

  useEffect(() => {
    (async () => {
      const u = await AsyncStorage.getItem('medimap_user');
      if (u) setUser(JSON.parse(u));
    })();
  }, []);

  const handleLogout = async () => {
    await AsyncStorage.removeItem('medimap_user');
    navigation.replace('Login');
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <View className="p-6 flex-1">
        <View className="flex-row justify-between items-center mb-8 mt-4">
          <View>
            <Text className="text-gray-500 text-base">Pharmacy Dashboard,</Text>
            <Text className="text-2xl font-bold text-gray-900">{user?.pharmacyName || 'Pharmacist'}</Text>
          </View>
          <TouchableOpacity onPress={handleLogout} className="bg-red-100 px-4 py-2 rounded-full">
            <Text className="text-red-600 font-semibold">Logout</Text>
          </TouchableOpacity>
        </View>

        <View className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 mb-4">
          <Text className="text-xl font-bold text-gray-900 mb-2">Patient Requirements</Text>
          <Text className="text-gray-500 mb-4">View and respond to medicine requests from nearby customers.</Text>
          <TouchableOpacity className="bg-[#10b981] py-4 rounded-xl items-center shadow-sm">
            <Text className="text-white font-bold text-lg">View Requests</Text>
          </TouchableOpacity>
        </View>

        <View className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
          <Text className="text-xl font-bold text-gray-900 mb-2">Inventory Management</Text>
          <Text className="text-gray-500 mb-4">Update your stock and prices to rank higher in customer searches.</Text>
          <TouchableOpacity className="bg-[#3b82f6] py-4 rounded-xl items-center shadow-sm">
            <Text className="text-white font-bold text-lg">Manage Stock</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

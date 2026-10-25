import React, { useEffect, useState } from 'react';
import { View, Text, SafeAreaView, TouchableOpacity } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function CustomerHomeScreen({ navigation }) {
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
      <View className="p-6">
        <View className="flex-row justify-between items-center mb-8 mt-4">
          <View>
            <Text className="text-gray-500 text-base">Welcome back,</Text>
            <Text className="text-3xl font-bold text-gray-900">{user?.name || 'Customer'}</Text>
          </View>
          <TouchableOpacity onPress={handleLogout} className="bg-red-100 px-4 py-2 rounded-full">
            <Text className="text-red-600 font-semibold">Logout</Text>
          </TouchableOpacity>
        </View>

        <View className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 mb-4">
          <Text className="text-2xl font-bold text-gray-900 mb-2">Find Medicines</Text>
          <Text className="text-gray-500 mb-6 leading-5">Compare prices instantly across all nearby pharmacies and save up to 60%.</Text>
          <TouchableOpacity className="bg-[#1B6EF3] py-4 rounded-xl items-center shadow-sm">
            <Text className="text-white font-bold text-lg">Search Now</Text>
          </TouchableOpacity>
        </View>

        <View className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
          <Text className="text-2xl font-bold text-gray-900 mb-2">Scan Prescription</Text>
          <Text className="text-gray-500 mb-6 leading-5">Upload your prescription and let our AI extract all the medicines for you.</Text>
          <TouchableOpacity className="bg-[#00C2A8] py-4 rounded-xl items-center shadow-sm">
            <Text className="text-white font-bold text-lg">Scan Image</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

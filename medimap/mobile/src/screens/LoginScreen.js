import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, SafeAreaView, ActivityIndicator, Image } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';

const API_BASE = 'https://medimap-backend-production.up.railway.app/api';

export default function LoginScreen({ navigation }) {
  const [tab, setTab] = useState('customer');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async () => {
    if (!email || !password) {
      setError('Please fill in all fields');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const endpoint = tab === 'customer' ? '/users/login' : '/pharmacist/login';
      const res = await axios.post(`${API_BASE}${endpoint}`, { email, password });
      
      const { token, user, pharmacist } = res.data;
      const userData = tab === 'customer' ? user : pharmacist;
      
      await AsyncStorage.setItem('medimap_user', JSON.stringify({ ...userData, type: tab, token }));
      
      if (tab === 'customer') {
        navigation.replace('CustomerHome');
      } else {
        navigation.replace('PharmacistDashboard');
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to connect to server');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      <View className="flex-1 px-6 justify-center">
        <View className="items-center mb-10">
          <Text className="text-4xl font-bold text-gray-900 mb-2">Medi<Text className="text-[#00C2A8]">Map</Text></Text>
          <Text className="text-gray-500 text-base">Sign in to continue</Text>
        </View>

        <View className="flex-row bg-gray-100 rounded-xl p-1 mb-8">
          <TouchableOpacity 
            className={`flex-1 py-3 rounded-lg items-center ${tab === 'customer' ? 'bg-white shadow-sm' : ''}`}
            onPress={() => { setTab('customer'); setError(''); }}
          >
            <Text className={`font-semibold ${tab === 'customer' ? 'text-[#1B6EF3]' : 'text-gray-500'}`}>Customer</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            className={`flex-1 py-3 rounded-lg items-center ${tab === 'pharmacist' ? 'bg-white shadow-sm' : ''}`}
            onPress={() => { setTab('pharmacist'); setError(''); }}
          >
            <Text className={`font-semibold ${tab === 'pharmacist' ? 'text-[#1B6EF3]' : 'text-gray-500'}`}>Pharmacist</Text>
          </TouchableOpacity>
        </View>

        <View className="space-y-4">
          <TextInput
            className="w-full bg-gray-50 px-4 py-4 rounded-xl border border-gray-200 text-base mb-4"
            placeholder="Email Address"
            keyboardType="email-address"
            autoCapitalize="none"
            value={email}
            onChangeText={setEmail}
          />
          <TextInput
            className="w-full bg-gray-50 px-4 py-4 rounded-xl border border-gray-200 text-base mb-4"
            placeholder="Password"
            secureTextEntry
            value={password}
            onChangeText={setPassword}
          />

          {error ? <Text className="text-red-500 text-center mb-4">{error}</Text> : null}

          <TouchableOpacity 
            className="w-full bg-[#1B6EF3] rounded-xl py-4 items-center justify-center flex-row"
            onPress={handleLogin}
            disabled={loading}
          >
            {loading ? <ActivityIndicator color="white" /> : <Text className="text-white font-bold text-lg">Sign In</Text>}
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

import axios from 'axios';
import { API_BASE } from '../lib/api';

const API = axios.create({
  baseURL: API_BASE,
  timeout: 10000,
});

export const searchMedicine = async (query, lat = 12.9716, lng = 77.6101) => {
  const { data } = await API.get(`/medicines/search?q=${encodeURIComponent(query)}&lat=${lat}&lng=${lng}`);
  return data;
};

export const getMedicines = async () => {
  const { data } = await API.get('/medicines');
  return data;
};

export const getPharmacies = async () => {
  const { data } = await API.get('/pharmacies');
  return data;
};

export const getPharmacy = async (id) => {
  const { data } = await API.get(`/pharmacies/${id}`);
  return data;
};

export const submitPrice = async (payload) => {
  const { data } = await API.post('/prices/submit', payload);
  return data;
};

export const getGenericRecommendation = async (medicineName) => {
  const { data } = await API.post('/ai/recommend', { medicineName });
  return data;
};
export const getPharmacyById = async (id) => {
  try {
    const res = await fetch(`${API_BASE}/pharmacies/${id}`);
    return await res.json();
  } catch {
    return null;
  }
};

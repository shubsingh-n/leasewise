import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api',
});

export const getApiBaseUrl = () => api.defaults.baseURL || 'http://localhost:5000/api';

// Mock data for demo if backend is not running
const MOCK_PROPERTIES = [
  {
    _id: "1",
    title: "Luxury 3BHK in Indiranagar",
    description: "Centrally located with modern amenities and a beautiful terrace garden. This property offers a perfect blend of luxury and comfort.",
    price: 75000,
    deposit: 300000,
    maintenance: 5000,
    bhk: 3,
    size: 1800,
    location: { type: "Point", coordinates: [77.6387, 12.9716] },
    amenities: ["Gym", "Power Backup", "Lift", "Security", "Parking"],
    furnishing: "semi-furnished",
    availability: "2026-05-01",
    contact: { name: "Rahul Sharma", phone: "+91 9876543210", email: "rahul@test.com" },
    images: ["https://images.unsplash.com/photo-1522708323590-d24dbb6b0267"]
  },
  {
    _id: "2",
    title: "Cosy 1BHK near Koramangala",
    description: "Perfect for working professionals. Close to Sony World Signal and many cafes.",
    price: 25000,
    deposit: 100000,
    maintenance: 2000,
    bhk: 1,
    size: 650,
    location: { type: "Point", coordinates: [77.6245, 12.9352] },
    amenities: ["Security", "Parking"],
    furnishing: "fully-furnished",
    availability: "2026-04-25",
    contact: { name: "Priya Das", phone: "+91 9876543211", email: "priya@test.com" },
    images: ["https://images.unsplash.com/photo-1502672260266-1c1ef2d93688"]
  },
  {
    _id: "3",
    title: "Premium 2BHK in Whitefield",
    description: "Spacious apartment with high-end finishes and close to IT parks.",
    price: 45000,
    deposit: 200000,
    maintenance: 3500,
    bhk: 2,
    size: 1200,
    location: { type: "Point", coordinates: [77.7500, 12.9698] },
    amenities: ["Swimming Pool", "Gym", "Clubhouse", "Security"],
    furnishing: "semi-furnished",
    availability: "2026-04-20",
    contact: { name: "Anil Kumar", phone: "+91 9876543212", email: "anil@test.com" },
    images: ["https://images.unsplash.com/photo-1493809842364-78817add7ffb"]
  }
];

export const getProperties = async (params: any) => {
  try {
    const response = await api.get('/properties', { params });
    return response.data;
  } catch (error) {
    console.warn('Backend connection failed, using mock data for demo.');
    return MOCK_PROPERTIES;
  }
};

export const getPropertyDetails = async (id: string) => {
  try {
    const response = await api.get(`/properties/${id}`);
    return response.data;
  } catch (error) {
    return MOCK_PROPERTIES.find(p => p._id === id);
  }
};

export const createProperty = async (payload: any) => {
  const response = await api.post('/properties', payload);
  return response.data;
};

export const createFlatmateRequirement = async (payload: any) => {
  const response = await api.post('/flatmates', payload);
  return response.data;
};

// Contact Request Endpoints
export const requestContact = async (payload: {
  requesterName: string;
  requesterPhone: string;
  listingId: string;
  listingType: 'Property' | 'Flatmate';
}) => {
  const response = await api.post('/contact/request', payload);
  return response.data;
};

export const getContactLogs = async () => {
  const token = sessionStorage.getItem('admin_token');
  const response = await api.get('/admin/contact/logs', {
    headers: { Authorization: `Bearer ${token}` }
  });
  return response.data;
};

export const retriggerNotification = async (id: string) => {
  const token = sessionStorage.getItem('admin_token');
  const response = await api.post(`/admin/contact/retrigger/${id}`, {}, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return response.data;
};

export const testTelegramSetup = async () => {
  const token = sessionStorage.getItem('admin_token');
  const response = await api.post('/admin/contact/test-telegram', {}, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return response.data;
};

export default api;

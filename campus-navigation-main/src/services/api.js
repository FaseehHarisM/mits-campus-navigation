import axios from 'axios';

// Use the Vite proxy to avoid Mixed Content errors on mobile devices
const API_URL = '/api';

export const getNodes = async () => {
  const response = await axios.get(`${API_URL}/nodes`);
  return response.data;
};

export const getEdges = async () => {
  const response = await axios.get(`${API_URL}/edges`);
  return response.data;
};

export const getFaculty = async () => {
  const response = await axios.get(`${API_URL}/faculty`);
  return response.data;
};

export const getEvents = async () => {
  const response = await axios.get(`${API_URL}/events`);
  return response.data;
};

export const getQRNode = async (qrId) => {
  const response = await axios.get(`${API_URL}/qr/scan/${qrId}`);
  return response.data;
};

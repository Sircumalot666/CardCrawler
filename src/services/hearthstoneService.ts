import axios from 'axios';
import { Card, CardResponse, MetadataResponse } from '../types';

export const hearthstoneService = {
  async getCards(page: number = 1, locale: string = 'de_DE'): Promise<CardResponse> {
    const response = await axios.get('/api/cards', {
      params: { page, locale }
    });
    return response.data;
  },

  async getAllCards(locale: string = 'de_DE'): Promise<{ cards: Card[], count: number }> {
    const response = await axios.get('/api/cards/all', {
      params: { locale }
    });
    return response.data;
  },

  async getMetadata(locale: string = 'de_DE'): Promise<MetadataResponse> {
    const response = await axios.get('/api/metadata', {
      params: { locale }
    });
    return response.data;
  }
};

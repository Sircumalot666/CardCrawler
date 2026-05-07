import axios from 'axios';
import { Card, CardResponse, MetadataResponse } from '../types';

export const hearthstoneService = {
  async getCards(page: number = 1, locale: string = 'de_DE'): Promise<CardResponse> {
    const response = await axios.get('/api/cards', {
      params: { page, locale }
    });
    return response.data;
  },

  async getAllCards(locale: string = 'de_DE', playerClass?: string, formatSet?: string): Promise<{ cards: Card[], count: number }> {
    const params: any = { locale };
    if (playerClass) params.playerClass = playerClass;
    if (formatSet) params.formatSet = formatSet;
    
    const response = await axios.get('/api/cards/all', {
      params
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

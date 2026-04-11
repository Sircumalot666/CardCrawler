/**
 * Hearthstone Card Data Models
 */

export interface Card {
  id: number;
  collectible: number;
  slug: string;
  classId: number;
  multiClassIds: number[];
  cardTypeId: number;
  cardSetId: number;
  rarityId: number;
  artistName: string;
  health?: number;
  attack?: number;
  manaCost: number;
  name: string;
  text: string;
  image: string;
  imageGold: string;
  flavorText: string;
  cropImage: string;
  keywordIds?: number[];
  spellSchoolId?: number;
  minionTypeId?: number;
  multiTypeIds?: number[];
  armor?: number;
  durability?: number;
  runeCost?: {
    blood: number;
    frost: number;
    unholy: number;
  };
  copyOfCardId?: number;
}

export interface CardResponse {
  cards: Card[];
  cardCount: number;
  pageCount: number;
  page: number;
}

export interface MetadataResponse {
  sets: SetMetadata[];
  setGroups: SetGroupMetadata[];
  types: IdNameMetadata[];
  rarities: IdNameMetadata[];
  classes: IdNameMetadata[];
  minionTypes: IdNameMetadata[];
  spellSchools: IdNameMetadata[];
  keywords: KeywordMetadata[];
}

export interface IdNameMetadata {
  id: number;
  slug: string;
  name: string;
}

export interface SetMetadata extends IdNameMetadata {
  type: string;
  collectibleCount: number;
  selectable: boolean;
}

export interface SetGroupMetadata extends IdNameMetadata {
  cardSets: string[];
}

export interface KeywordMetadata extends IdNameMetadata {
  text: string;
}

export interface Product {
  id: string;
  name: string;
  price: number;
  category: string;
  isBestSeller?: boolean;
  rank?: number;
}

export interface AssociationRule {
  if_buy: string[];
  recommend: string[];
  confidence: number;
  lift: number;
  support: number;
}

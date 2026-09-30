export type PageType =
  | 'home'
  | 'shop'
  | 'product'
  | 'builder'
  | 'checkout'
  | 'about'
  | 'lookbook'
  | 'faqs';

export type CategoryType = 'Shells' | 'Tropical' | 'Waves' | 'Sea Life' | 'Anklets' | 'Letters' | 'Symbols' | 'All';
export type MaterialType = 'Gold' | 'Silver' | 'Mixed Metal';
export type PriceRangeType = 'all' | 'under-25' | '25-50' | '50-100' | 'over-100';

export interface Charm {
  id: string;
  slug?: string;
  name: string;
  price: number;
  originalPrice?: number;
  category: CategoryType;
  material: MaterialType;
  image: string;
  gallery?: string[];
  shortDescription?: string;
  description?: string;
  sku?: string;
  stock?: number;
  badge?: string;
  isFeatured?: boolean;
  color?: string;
}

export interface CustomBraceletLink {
  position: number;
  charm: Charm | null;
}

export interface CustomBracelet {
  id: string;
  linkCount: number;
  sizeLabel: string;
  basePrice: number;
  links: CustomBraceletLink[];
}

export interface CartItem {
  id: string;
  type: 'charm' | 'custom-bracelet';
  charm?: Charm;
  customBracelet?: CustomBracelet;
  quantity: number;
  unitPrice: number;
}

export interface Testimonial {
  id: string;
  name: string;
  location?: string;
  quote: string;
  rating: number;
  avatar: string;
}

export interface LookbookArticle {
  id: string;
  title: string;
  category: string;
  summary: string;
  content: string;
  image: string;
  readTime: string;
}

export interface FAQItem {
  id: string;
  question: string;
  answer: string;
  hasDiagram?: boolean;
}

export interface OrderDetails {
  orderNumber: string;
  status: string;
  estimatedDelivery: string;
  shippingAddress: {
    firstName: string;
    lastName: string;
    address: string;
    city: string;
    state: string;
    zip: string;
    country: string;
  };
  deliveryMethod: 'standard' | 'express';
  totalAmount: number;
}

import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { PageType, Charm, CartItem, CustomBracelet, CategoryType, MaterialType, PriceRangeType } from '../types';
import { CHARM_PRODUCTS } from '../data/mockData';
import { useCurrency } from './CurrencyContext';
import { useLanguage } from '../i18n/LanguageContext';

interface ShopContextType {
  activePage: PageType;
  setActivePage: (page: PageType) => void;
  selectedProductId: string;
  setSelectedProductId: (id: string) => void;
  navigateTo: (page: PageType, productId?: string) => void;
  cart: CartItem[];
  addToCart: (charm: Charm, quantity?: number) => void;
  addCustomBraceletToCart: (bracelet: CustomBracelet) => void;
  removeFromCart: (cartItemId: string) => void;
  updateQuantity: (cartItemId: string, quantity: number) => void;
  clearCart: () => void;
  cartCount: number;
  cartSubtotal: number;
  isCartOpen: boolean;
  setIsCartOpen: (open: boolean) => void;
  builderBracelet: CustomBracelet;
  setBuilderLinkCount: (count: number) => void;
  setBuilderCharmAt: (position: number, charm: Charm | null) => void;
  resetBuilder: () => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  selectedCategory: CategoryType;
  setSelectedCategory: (category: CategoryType) => void;
  priceFilter: PriceRangeType;
  setPriceFilter: (price: PriceRangeType) => void;
  materialFilter: MaterialType | 'All';
  setMaterialFilter: (material: MaterialType | 'All') => void;
  notification: string | null;
  showNotification: (msg: string) => void;
}

const ShopContext = createContext<ShopContextType | undefined>(undefined);

const INITIAL_BUILDER: CustomBracelet = {
  id: 'custom-bracelet-default',
  linkCount: 18,
  sizeLabel: '18 links · Standard size',
  basePrice: 390000,
  links: Array.from({ length: 18 }, (_, index) => ({
    position: index,
    charm: index === 3 ? CHARM_PRODUCTS[2] : index === 7 ? CHARM_PRODUCTS[1] : index === 11 ? CHARM_PRODUCTS[3] : null,
  })),
};

const routeFor = (page: PageType, product?: Charm) => {
  switch (page) {
    case 'home': return '/';
    case 'shop': return '/products';
    case 'product': return `/products/${product?.slug || product?.id || 'beach-memory-italian-charm'}/`;
    case 'checkout': return '/checkout';
    case 'about': return '/about';
    case 'faqs': return '/support';
    case 'lookbook': return '/journal';
    case 'builder': return '/custom-bracelet';
    default: return '/';
  }
};

const resolveRoute = (pathname: string) => {
  const clean = pathname.replace(/\/+$/, '') || '/';
  if (clean === '/') return { page: 'home' as PageType };
  if (clean === '/products' || clean === '/san-pham') return { page: 'shop' as PageType };
  if (clean.startsWith('/products/') || clean.startsWith('/san-pham/')) {
    const slug = clean.split('/').filter(Boolean)[1];
    const product = CHARM_PRODUCTS.find((item) => item.slug === slug || item.id === slug);
    return { page: 'product' as PageType, productId: product?.id || CHARM_PRODUCTS[0].id };
  }
  if (clean === '/checkout' || clean === '/thanh-toan') return { page: 'checkout' as PageType };
  if (clean === '/about' || clean === '/ve-chung-minh') return { page: 'about' as PageType };
  if (clean === '/support' || clean === '/cham-soc-khach-hang') return { page: 'faqs' as PageType };
  if (clean === '/journal') return { page: 'lookbook' as PageType };
  if (clean === '/custom-bracelet' || clean === '/tao-vong-tay') return { page: 'builder' as PageType };
  return { page: 'home' as PageType };
};

export const ShopProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { t } = useLanguage();
  const { formatPrice } = useCurrency();
  const initialRoute = useMemo(() => resolveRoute(window.location.pathname), []);
  const [activePage, setActivePage] = useState<PageType>(initialRoute.page);
  const [selectedProductId, setSelectedProductId] = useState(initialRoute.productId || CHARM_PRODUCTS[0].id);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<CategoryType>('All');
  const [priceFilter, setPriceFilter] = useState<PriceRangeType>('all');
  const [materialFilter, setMaterialFilter] = useState<MaterialType | 'All'>('All');
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [notification, setNotification] = useState<string | null>(null);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [builderBracelet, setBuilderBracelet] = useState<CustomBracelet>(INITIAL_BUILDER);

  useEffect(() => {
    const handlePopState = () => {
      const route = resolveRoute(window.location.pathname);
      setActivePage(route.page);
      if (route.productId) setSelectedProductId(route.productId);
      window.scrollTo({ top: 0 });
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const showNotification = (msg: string) => {
    setNotification(msg);
    window.setTimeout(() => setNotification(null), 2800);
  };

  const navigateTo = (page: PageType, productId?: string) => {
    const product = productId ? CHARM_PRODUCTS.find((item) => item.id === productId) : undefined;
    setActivePage(page);
    if (productId) setSelectedProductId(productId);
    const nextPath = routeFor(page, product);
    if (window.location.pathname !== nextPath) window.history.pushState({}, '', nextPath);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const addToCart = (charm: Charm, quantity = 1) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.type === 'charm' && item.charm?.id === charm.id);
      if (existing) {
        return prev.map((item) => item.id === existing.id ? { ...item, quantity: item.quantity + quantity } : item);
      }
      return [...prev, { id: `cart-${Date.now()}-${Math.random()}`, type: 'charm', charm, quantity, unitPrice: charm.price }];
    });
    showNotification(`${charm.name} · ${t('shop.add')}`);
    setIsCartOpen(true);
  };

  const addCustomBraceletToCart = (bracelet: CustomBracelet) => {
    const charmsCost = bracelet.links.reduce((sum, link) => sum + (link.charm?.price || 0), 0);
    const unitPrice = bracelet.basePrice + charmsCost;
    setCart((prev) => [...prev, { id: `cart-bracelet-${Date.now()}`, type: 'custom-bracelet', customBracelet: { ...bracelet }, quantity: 1, unitPrice }]);
    showNotification(`${t('builder.addCart')} · ${formatPrice(unitPrice)}`);
    setIsCartOpen(true);
  };

  const removeFromCart = (cartItemId: string) => setCart((prev) => prev.filter((item) => item.id !== cartItemId));
  const updateQuantity = (cartItemId: string, quantity: number) => {
    if (quantity <= 0) return removeFromCart(cartItemId);
    setCart((prev) => prev.map((item) => item.id === cartItemId ? { ...item, quantity } : item));
  };
  const clearCart = () => setCart([]);
  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);
  const cartSubtotal = cart.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);

  const setBuilderLinkCount = (count: number) => {
    setBuilderBracelet((prev) => ({
      ...prev,
      linkCount: count,
      sizeLabel: `${count} ${t('builder.links')}`,
      links: Array.from({ length: count }, (_, index) => prev.links[index] || { position: index, charm: null }),
    }));
  };
  const setBuilderCharmAt = (position: number, charm: Charm | null) => {
    setBuilderBracelet((prev) => ({ ...prev, links: prev.links.map((link) => link.position === position ? { ...link, charm } : link) }));
  };
  const resetBuilder = () => setBuilderBracelet(INITIAL_BUILDER);

  return (
    <ShopContext.Provider value={{
      activePage, setActivePage, selectedProductId, setSelectedProductId, navigateTo,
      cart, addToCart, addCustomBraceletToCart, removeFromCart, updateQuantity, clearCart,
      cartCount, cartSubtotal, isCartOpen, setIsCartOpen,
      builderBracelet, setBuilderLinkCount, setBuilderCharmAt, resetBuilder,
      searchQuery, setSearchQuery, selectedCategory, setSelectedCategory,
      priceFilter, setPriceFilter, materialFilter, setMaterialFilter,
      notification, showNotification,
    }}>
      {children}
    </ShopContext.Provider>
  );
};

export const useShop = () => {
  const context = useContext(ShopContext);
  if (!context) throw new Error('useShop must be used within ShopProvider');
  return context;
};

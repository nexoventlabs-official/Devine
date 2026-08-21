import React, { createContext, useContext, useState, useEffect } from 'react';
import { API_BASE_URL } from '../config';

const CartContext = createContext();

export function CartProvider({ children }) {
  // Cart items
  const [cart, setCart] = useState(() => {
    try {
      const saved = localStorage.getItem('devine_cart');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Wishlist items (array of key IDs)
  const [wishlist, setWishlist] = useState(() => {
    try {
      const saved = localStorage.getItem('devine_wishlist');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Saved Addresses (array of address objects)
  const [savedAddresses, setSavedAddresses] = useState(() => {
    try {
      const saved = localStorage.getItem('devine_saved_addresses');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // User Auth State
  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem('devine_user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [token, setToken] = useState(() => {
    return localStorage.getItem('devine_token') || null;
  });

  // Modal Controls
  const [cartOpen, setCartOpen] = useState(false);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);
  const [authMode, setAuthMode] = useState('login'); // 'login' | 'signup'

  // Sync state to localStorage
  useEffect(() => {
    localStorage.setItem('devine_cart', JSON.stringify(cart));
  }, [cart]);

  useEffect(() => {
    localStorage.setItem('devine_wishlist', JSON.stringify(wishlist));
  }, [wishlist]);

  useEffect(() => {
    localStorage.setItem('devine_saved_addresses', JSON.stringify(savedAddresses));
  }, [savedAddresses]);

  useEffect(() => {
    if (user) localStorage.setItem('devine_user', JSON.stringify(user));
    else localStorage.removeItem('devine_user');
  }, [user]);

  useEffect(() => {
    if (token) localStorage.setItem('devine_token', token);
    else localStorage.removeItem('devine_token');
  }, [token]);

  // Sync profile when token exists
  useEffect(() => {
    if (token && !user) {
      fetch(`${API_BASE_URL}/user/profile`, {
        headers: { Authorization: `Bearer ${token}` }
      })
        .then((res) => res.json())
        .then((data) => {
          if (data.success && data.user) {
            setUser(data.user);
            if (data.user.addresses && data.user.addresses.length) {
              setSavedAddresses(data.user.addresses);
            }
          }
        })
        .catch(() => {});
    }
  }, [token, user]);

  // Cart operations
  const addToCart = (rawItem) => {
    if (!rawItem) return;
    const itemKey = String(rawItem.key || rawItem.productId || rawItem._id || Date.now());
    const cleanItem = {
      key: itemKey,
      productId: String(rawItem.productId || rawItem._id || itemKey),
      variantIndex: rawItem.variantIndex != null ? rawItem.variantIndex : null,
      name: String(rawItem.name || 'Devine Product'),
      sizeLabel: String(rawItem.sizeLabel || ''),
      image: String(rawItem.image || rawItem.imageUrl || ''),
      price: Number(rawItem.price) || 0,
      quantity: Math.max(1, Number(rawItem.quantity) || 1)
    };

    setCart((prev) => {
      const idx = prev.findIndex((i) => i.key === cleanItem.key);
      if (idx >= 0) {
        const updated = [...prev];
        const currentQty = Number(updated[idx].quantity) || 1;
        updated[idx] = { ...updated[idx], quantity: currentQty + 1 };
        return updated;
      }
      return [...prev, cleanItem];
    });
    setCartOpen(true);
  };

  const removeFromCart = (key) => {
    setCart((prev) => prev.filter((i) => i.key !== key));
  };

  const updateQuantity = (key, delta) => {
    setCart((prev) => {
      return prev
        .map((i) => {
          if (i.key === key) {
            const currentQty = Number(i.quantity) || 1;
            const newQty = currentQty + delta;
            return newQty > 0 ? { ...i, quantity: newQty } : null;
          }
          return i;
        })
        .filter(Boolean);
    });
  };

  const clearCart = () => setCart([]);

  // Wishlist operations
  const toggleWishlist = (key) => {
    setWishlist((prev) => {
      if (prev.includes(key)) return prev.filter((k) => k !== key);
      return [...prev, key];
    });
  };

  const isInWishlist = (key) => wishlist.includes(key);

  // Address operations
  const addSavedAddress = (addr) => {
    setSavedAddresses((prev) => {
      const exists = prev.some((a) => a.address.trim() === addr.address.trim());
      if (exists) return prev;
      return [addr, ...prev];
    });
  };

  // Auth operations
  const loginUser = (userData, userToken) => {
    setUser(userData);
    setToken(userToken);
    if (userData.addresses && userData.addresses.length) {
      setSavedAddresses(userData.addresses);
    }
    setAuthOpen(false);
  };

  const logoutUser = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('devine_user');
    localStorage.removeItem('devine_token');
  };

  const openAuth = (mode = 'login') => {
    setAuthMode(mode);
    setCartOpen(false);
    setCheckoutOpen(false);
    setAuthOpen(true);
  };

  return (
    <CartContext.Provider
      value={{
        cart,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        cartOpen,
        setCartOpen,
        checkoutOpen,
        setCheckoutOpen,
        wishlist,
        toggleWishlist,
        isInWishlist,
        savedAddresses,
        addSavedAddress,
        user,
        token,
        loginUser,
        logoutUser,
        authOpen,
        setAuthOpen,
        authMode,
        openAuth
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  return useContext(CartContext);
}

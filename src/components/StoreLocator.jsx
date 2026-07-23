import React, { useState } from 'react';

const storeList = [
  { id: 1, name: "Reliance Fresh Supermarket", city: "Mumbai", area: "Bandra West", type: "Supermarket", status: "In Stock - Cold Case", distance: "0.8 km" },
  { id: 2, name: "Nature's Basket Organic", city: "Mumbai", area: "Juhu", type: "Supermarket", status: "In Stock", distance: "1.4 km" },
  { id: 3, name: "Blinkit Dark Store #14", city: "Mumbai", area: "Andheri East", type: "Quick Commerce", status: "10-Min Delivery Available", distance: "0.5 km" },
  { id: 4, name: "Gold's Gym Fitness Lounge", city: "Mumbai", area: "Worli", type: "Gym & Sports", status: "In Stock - Chilled", distance: "2.1 km" },
  { id: 5, name: "Zepto Express Hub", city: "Delhi NCR", area: "Connaught Place", type: "Quick Commerce", status: "10-Min Delivery Available", distance: "0.4 km" },
  { id: 6, name: "Le Marche Gourmet", city: "Delhi NCR", area: "Gurugram Cyber Hub", type: "Supermarket", status: "In Stock", distance: "1.1 km" },
  { id: 7, name: "Cult.Fit Sports Arena", city: "Bengaluru", area: "Indiranagar", type: "Gym & Sports", status: "In Stock - Cold Case", distance: "0.6 km" },
  { id: 8, name: "Instamart Rapid Store", city: "Bengaluru", area: "Koramangala", type: "Quick Commerce", status: "10-Min Delivery Available", distance: "0.3 km" },
  { id: 9, name: "Shell Select Convenience", city: "Pune", area: "Viman Nagar", type: "Convenience", status: "In Stock 24/7", distance: "1.2 km" },
  { id: 10, name: "Golf Club Pro Shop", city: "Chandigarh", area: "Sector 6", type: "Gym & Sports", status: "In Stock", distance: "0.9 km" }
];

export default function StoreLocator() {
  const [query, setQuery] = useState('');
  const [filterType, setFilterType] = useState('all');

  const filteredStores = storeList.filter(store => {
    const matchesQuery = store.name.toLowerCase().includes(query.toLowerCase()) || 
                         store.city.toLowerCase().includes(query.toLowerCase()) || 
                         store.area.toLowerCase().includes(query.toLowerCase());
    const matchesFilter = filterType === 'all' || store.type === filterType;
    return matchesQuery && matchesFilter;
  });

  return (
    <section className="locator-section" id="store-locator">
      <div className="locator-container">
        <div className="section-header">
          <span className="section-tag">RETAIL & QUICK COMMERCE</span>
          <h2 className="section-title">FIND BLITZ NEAR YOU</h2>
        </div>

        <div className="locator-controls">
          <div className="search-input-wrap">
            <span className="search-icon">🔍</span>
            <input 
              type="text" 
              className="search-input" 
              placeholder="Search city or area (e.g. Mumbai, Delhi, Bandra, Indiranagar)..." 
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
          <select 
            className="filter-select"
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
          >
            <option value="all">All Retailers</option>
            <option value="Quick Commerce">Quick Commerce (Blinkit / Zepto / Instamart)</option>
            <option value="Supermarket">Supermarkets & Malls</option>
            <option value="Gym & Sports">Gyms & Sports Clubs</option>
            <option value="Convenience">Convenience & Gas Stations</option>
          </select>
        </div>

        <div className="store-grid">
          {filteredStores.length === 0 ? (
            <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '3rem', color: '#a0a0a0' }}>
              <h4>No stores found in this area.</h4>
              <p>Order online via Blinkit, Zepto, or Instamart for instant delivery to your doorstep!</p>
            </div>
          ) : (
            filteredStores.map(store => (
              <div className="store-card" key={store.id}>
                <div>
                  <div className="store-header">
                    <span className="store-type-badge">{store.type}</span>
                    <span style={{ fontSize: '0.8rem', color: '#76f013', fontWeight: '700' }}>{store.distance} away</span>
                  </div>
                  <h4 className="store-name">{store.name}</h4>
                  <p className="store-address">📍 {store.area}, {store.city}</p>
                </div>
                <div className="store-footer">
                  <span className="stock-status">{store.status}</span>
                  <button 
                    className="btn-pill btn-pill-outline" 
                    style={{ padding: '0.4rem 1rem', fontSize: '0.75rem' }}
                    onClick={() => alert(`Navigating to ${store.name}...`)}
                  >
                    Directions
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </section>
  );
}

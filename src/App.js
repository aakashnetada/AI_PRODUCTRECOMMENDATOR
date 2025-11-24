import './App.css';
import React, { useState } from 'react';


function App() {
  const products = [
  { id: 1, name: "iPhone 13", category: "phone", price: 529 },
  { id: 2, name: "Samsung Galaxy S21 FE", category: "phone", price: 449 },
  { id: 3, name: "Google Pixel 7", category: "phone", price: 599 },
  { id: 4, name: "OnePlus 11R", category: "phone", price: 399 },
  { id: 5, name: "Realme 11 Pro", category: "phone", price: 259 },
  { id: 6, name: "iPad 9th Gen", category: "tablet", price: 300 },
  { id: 7, name: "Samsung Galaxy Tab A8", category: "tablet", price: 179 },
  { id: 8, name: "Lenovo Tab M10", category: "tablet", price: 129 },
  { id: 9, name: "MacBook Air M1", category: "laptop", price: 740 }
];

  const [input, setInput] = useState("");
  const [recommendations, setRecommendations] = useState([]);
  const [statusMessage, setStatusMessage] = useState("");


  const localFilter = (query, items) => {
    const q = (query || "").toLowerCase();
    const underMatch = q.match(/under\s*\$?\s*(\d+)/);
    if (underMatch) {
      const price = parseInt(underMatch[1], 10);
      return items.filter(p => p.price <= price);
    }
    const priceOnly = q.match(/\$?\s*(\d{2,6})/);
    if (priceOnly && q.includes("$") ) {
      const price = parseInt(priceOnly[1], 10);
      return items.filter(p => p.price <= price);
    }
    if (q.includes("phone") || q.includes("mobile")) return items.filter(p => p.category === 'phone');
    if (q.includes("tablet")) return items.filter(p => p.category === 'tablet');
    return items.filter(p => p.name.toLowerCase().includes(q));
  };

  const handleRecommend = async () => {
    setStatusMessage('');
    try {
      setStatusMessage('Requesting recommendations...');
      const resp = await fetch('/api/recommend', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ input, products })
      });

      if (!resp.ok) {
        console.warn('Backend /api/recommend failed, falling back to local filter');
        setStatusMessage('Backend unavailable — using local recommendations');
        return setRecommendations(localFilter(input, products));
      }

      const body = await resp.json();
      if (body && body.recommendations) {
        setRecommendations(body.recommendations);
      } else {
        setRecommendations(localFilter(input, products));
      }
      setStatusMessage('');
    } catch (error) {
      console.error("Error calling Gemini API:", error);
      setStatusMessage('Error requesting recommendations — using local fallback');
      setRecommendations(localFilter(input, products));
    }
  };

  return (
    <div className="App">
      <section className="App-section">
        <h2>Products</h2>
        <ul>
          {products.map(product => (
            <li key={product.id}>
              {product.name} ({product.category} - {product.price})
            </li>
          ))}
        </ul>
        <h2>Recommendations</h2>
        {statusMessage && <p style={{ color: 'darkorange' }}>{statusMessage}</p>}
        <ul>
          {recommendations.map(product => (
            <li key={product.id}>
              {product.name} - ${product.price}
            </li>
          ))}
        </ul>
        {recommendations.length === 0 && !statusMessage && (
          <p style={{ color: '#666' }}>No recommendations yet. Try: "phone under $700" or "phone"</p>
        )}
        <input
          type="text"
          value={input}
          onChange={e => setInput(e.target.value)}
          placeholder="Enter your preference (e.g., phone under $500)"
        />
        <button onClick={handleRecommend}>Get Recommendations</button>
      </section>
    </div>
  );
}

export default App;

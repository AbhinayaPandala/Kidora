import { useEffect, useState } from "react";
import {
  Search,
  ShoppingBag,
  Heart,
  Package,
  ArrowRight,
  Sparkles,
  ShieldCheck,
  Truck,
  Headphones,
  Image as ImageIcon,
} from "lucide-react";
import Admin from "./Admin";
import CartDrawer from "./components/CartDrawer";
import Checkout from "./components/Checkout";
import OrderSuccess from "./components/OrderSuccess";
import "./App.css";

const API_URL = "http://localhost:5000/api/products";
const CART_STORAGE_KEY = "kidora_cart";

function App() {
  const [showAdmin] = useState(
    window.location.pathname === "/admin"
  );

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("All");
  const [wishlist, setWishlist] = useState([]);

  // Cart state persisted in localStorage
  const [cart, setCart] = useState(() => {
    try {
      const saved = localStorage.getItem(CART_STORAGE_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [isCartOpen, setIsCartOpen] = useState(false);
  const [view, setView] = useState("shop"); // "shop" | "checkout" | "order-success"
  const [completedOrder, setCompletedOrder] = useState(null);

  // Sync cart to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
    } catch (err) {
      console.error("Failed to save cart to localStorage:", err);
    }
  }, [cart]);

  // Load products from API
  useEffect(() => {
    if (showAdmin) return;

    async function loadProducts() {
      try {
        setLoading(true);
        setError("");

        const response = await fetch(API_URL);

        if (!response.ok) {
          throw new Error("Unable to load products.");
        }

        const data = await response.json();
        setProducts(Array.isArray(data) ? data : []);
      } catch (err) {
        setError(
          "Could not connect to the server. Please make sure the backend is running."
        );
      } finally {
        setLoading(false);
      }
    }

    loadProducts();
  }, [showAdmin]);

  if (showAdmin) {
    return <Admin />;
  }

  const categories = [
    { name: "All", emoji: "✨", color: "#fff0e8" },
    { name: "Clothing", emoji: "👕", color: "#fce8ed" },
    { name: "Toys", emoji: "🧸", color: "#fff0cf" },
    { name: "Feeding", emoji: "🍼", color: "#e6f2ff" },
    { name: "Nursery", emoji: "🛏️", color: "#e7f5e8" },
  ];

  const filteredProducts = products.filter((product) => {
    const matchesCategory =
      activeCategory === "All" ||
      product.category?.toLowerCase() === activeCategory.toLowerCase();

    const searchText =
      `${product.name || ""} ${product.description || ""} ${product.brand || ""} ${product.category || ""}`.toLowerCase();

    const matchesSearch = searchText.includes(search.toLowerCase().trim());

    return matchesCategory && matchesSearch;
  });

  function toggleWishlist(productId) {
    setWishlist((current) =>
      current.includes(productId)
        ? current.filter((id) => id !== productId)
        : [...current, productId]
    );
  }

  function addToCart(product) {
    if (!product || product.stock <= 0) return;

    setCart((prevCart) => {
      const existingIndex = prevCart.findIndex(
        (item) => item._id === product._id
      );

      if (existingIndex > -1) {
        const currentItem = prevCart[existingIndex];
        const maxStock = typeof product.stock === "number" ? product.stock : 99;

        if (currentItem.quantity >= maxStock) {
          return prevCart;
        }

        const updated = [...prevCart];
        updated[existingIndex] = {
          ...currentItem,
          quantity: currentItem.quantity + 1,
        };
        return updated;
      } else {
        return [
          ...prevCart,
          {
            _id: product._id,
            name: product.name,
            price: Number(product.price),
            image: product.image || "",
            category: product.category || "General",
            brand: product.brand || "KIDORA",
            stock: product.stock,
            quantity: 1,
          },
        ];
      }
    });

    setIsCartOpen(true);
  }

  function updateCartQuantity(productId, newQty) {
    if (newQty < 1) return;

    setCart((prevCart) =>
      prevCart.map((item) => {
        if (item._id === productId) {
          const maxStock = typeof item.stock === "number" ? item.stock : 99;
          const validQty = Math.min(newQty, maxStock);
          return { ...item, quantity: validQty };
        }
        return item;
      })
    );
  }

  function removeFromCart(productId) {
    setCart((prevCart) => prevCart.filter((item) => item._id !== productId));
  }

  function clearCart() {
    setCart([]);
    try {
      localStorage.removeItem(CART_STORAGE_KEY);
    } catch {}
  }

  function handleProceedToCheckout() {
    setIsCartOpen(false);
    setView("checkout");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function handleOrderSuccess(order) {
    setCompletedOrder(order);
    clearCart();
    setIsCartOpen(false);
    setView("order-success");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function handleContinueShopping() {
    setCompletedOrder(null);
    setView("shop");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <div className="app">
      <div className="announcement-bar">
        <Sparkles size={14} />
        Little joys, lovely prices — welcome to KIDORA!
        <Sparkles size={14} />
      </div>

      <header className="main-header">
        <button
          className="logo"
          style={{ background: "none", border: "none", padding: 0 }}
          onClick={() => {
            setView("shop");
            window.scrollTo({ top: 0, behavior: "smooth" });
          }}
          aria-label="KIDORA home"
        >
          <span className="logo-icon">k</span>
          <span>
            KIDORA<span className="logo-dot">.</span>
          </span>
        </button>

        <div className="search-box">
          <Search size={19} />
          <input
            type="search"
            placeholder="Search little things you love..."
            value={search}
            onChange={(event) => {
              setSearch(event.target.value);
              if (view !== "shop") setView("shop");
            }}
            aria-label="Search products"
          />
        </div>

        <div className="header-actions">
          <button
            className="header-action"
            type="button"
            onClick={() => {
              if (view !== "shop") setView("shop");
              setTimeout(() => {
                document
                  .getElementById("products")
                  ?.scrollIntoView({ behavior: "smooth" });
              }, 50);
            }}
          >
            <Heart size={21} />
            <span>Wishlist</span>
            {wishlist.length > 0 && (
              <span className="count-badge">{wishlist.length}</span>
            )}
          </button>

          <button
            className="header-action"
            type="button"
            onClick={() => setIsCartOpen(true)}
            aria-label={`Open shopping cart with ${cartCount} items`}
          >
            <ShoppingBag size={21} />
            <span>Cart</span>
            {cartCount > 0 && (
              <span className="count-badge">{cartCount}</span>
            )}
          </button>
        </div>
      </header>

      <nav className="category-nav" aria-label="Main categories">
        <a
          href="#categories"
          onClick={() => {
            if (view !== "shop") setView("shop");
          }}
        >
          Shop by category
        </a>
        <a
          href="#products"
          onClick={() => {
            if (view !== "shop") setView("shop");
          }}
        >
          All products
        </a>
        <a
          href="#why-kidora"
          onClick={() => {
            if (view !== "shop") setView("shop");
          }}
        >
          Why KIDORA?
        </a>
        <a href="/admin">Admin</a>
      </nav>

      <main>
        {view === "checkout" ? (
          <Checkout
            cart={cart}
            onBack={() => {
              setView("shop");
              setIsCartOpen(true);
            }}
            onOrderSuccess={handleOrderSuccess}
          />
        ) : view === "order-success" ? (
          <OrderSuccess
            order={completedOrder}
            onContinueShopping={handleContinueShopping}
          />
        ) : (
          <>
            <section className="hero-section">
              <div className="hero-content">
                <span className="hero-label">
                  <Sparkles size={15} /> MADE FOR LITTLE MOMENTS
                </span>

                <h1>
                  Big love for
                  <br />
                  <span>little people.</span>
                </h1>

                <p>
                  Discover adorable essentials, playful toys, and everyday
                  favourites for your little one's happiest moments.
                </p>

                <a className="primary-button" href="#products">
                  Explore the collection <ArrowRight size={18} />
                </a>

                <div className="hero-trust">
                  <span>
                    <ShieldCheck size={17} /> Quality picks
                  </span>
                  <span>
                    <Heart size={17} /> Made with love
                  </span>
                </div>
              </div>

              <div className="hero-visual">
                <div className="hero-circle">
                  <span className="hero-emoji">🧸</span>
                  <span className="floating-emoji emoji-one">🌼</span>
                  <span className="floating-emoji emoji-two">🍼</span>
                  <span className="floating-emoji emoji-three">⭐</span>
                </div>
                <div className="hero-note">
                  <span>♡</span>
                  Little things, big smiles
                </div>
              </div>
            </section>

            <section className="categories-section" id="categories">
              <div className="section-heading">
                <div>
                  <span className="eyebrow">A LITTLE SOMETHING FOR EVERYONE</span>
                  <h2>Shop by category</h2>
                </div>
                <p>Find their new favourite</p>
              </div>

              <div className="category-grid">
                {categories.map((category) => (
                  <button
                    key={category.name}
                    type="button"
                    className={`category-card ${
                      activeCategory === category.name ? "active" : ""
                    }`}
                    style={{ backgroundColor: category.color }}
                    onClick={() => setActiveCategory(category.name)}
                  >
                    <span className="category-emoji">{category.emoji}</span>
                    <span>
                      {category.name === "All" ? "Everything" : category.name}
                    </span>
                    <ArrowRight size={16} />
                  </button>
                ))}
              </div>
            </section>

            <section className="products-section" id="products">
              <div className="section-heading">
                <div>
                  <span className="eyebrow">HANDPICKED WITH LOVE</span>
                  <h2>
                    {activeCategory === "All"
                      ? "Little favourites"
                      : activeCategory + " favourites"}
                  </h2>
                </div>

                <span className="product-count">
                  {filteredProducts.length} product
                  {filteredProducts.length !== 1 ? "s" : ""}
                </span>
              </div>

              {loading ? (
                <div className="empty-state">
                  <span className="empty-emoji">🧸</span>
                  <h3>Finding little favourites...</h3>
                  <p>Just a moment while we load the collection.</p>
                </div>
              ) : error ? (
                <div className="empty-state">
                  <span className="empty-emoji">🌷</span>
                  <h3>We'll be back in a moment</h3>
                  <p>{error}</p>
                  <button
                    className="primary-button"
                    type="button"
                    onClick={() => window.location.reload()}
                  >
                    Try again
                  </button>
                </div>
              ) : filteredProducts.length === 0 ? (
                <div className="empty-state">
                  <span className="empty-emoji">🔎</span>
                  <h3>No little favourites found</h3>
                  <p>Try another search or choose a different category.</p>
                  <button
                    className="secondary-button"
                    type="button"
                    onClick={() => {
                      setSearch("");
                      setActiveCategory("All");
                    }}
                  >
                    Show all products
                  </button>
                </div>
              ) : (
                <div className="product-grid">
                  {filteredProducts.map((product) => (
                    <article className="product-card" key={product._id}>
                      <div className="product-image-wrap">
                        {product.image ? (
                          <img
                            className="product-image"
                            src={product.image}
                            alt={product.name}
                            loading="lazy"
                            onError={(event) => {
                              event.currentTarget.style.display = "none";
                              if (event.currentTarget.nextElementSibling) {
                                event.currentTarget.nextElementSibling.style.display =
                                  "flex";
                              }
                            }}
                          />
                        ) : null}

                        <div
                          className="product-placeholder"
                          style={{
                            display: product.image ? "none" : "flex",
                          }}
                        >
                          <ImageIcon size={32} strokeWidth={1.5} className="placeholder-icon" />
                          <span className="placeholder-label">Photo coming soon</span>
                        </div>

                        {product.featured && (
                          <span className="product-tag">Little favourite</span>
                        )}

                        <button
                          type="button"
                          className={`wishlist-button ${
                            wishlist.includes(product._id) ? "wishlisted" : ""
                          }`}
                          aria-label={
                            wishlist.includes(product._id)
                              ? "Remove from wishlist"
                              : "Add to wishlist"
                          }
                          onClick={() => toggleWishlist(product._id)}
                        >
                          <Heart
                            size={19}
                            fill={
                              wishlist.includes(product._id)
                                ? "currentColor"
                                : "none"
                            }
                          />
                        </button>
                      </div>

                      <div className="product-info">
                        <span className="product-category">
                          {product.category}
                        </span>
                        <h3>{product.name}</h3>
                        {product.description && (
                          <p className="product-description">
                            {product.description}
                          </p>
                        )}

                        <div className="product-bottom">
                          <div>
                            <span className="product-price">
                              ₹{Number(product.price).toLocaleString("en-IN")}
                            </span>
                            <span className="product-stock">
                              {product.stock > 0
                                ? `${product.stock} in stock`
                                : "Out of stock"}
                            </span>
                          </div>

                          <button
                            className="add-cart-button"
                            type="button"
                            disabled={product.stock <= 0}
                            onClick={() => addToCart(product)}
                            aria-label={`Add ${product.name} to cart`}
                            title={
                              product.stock <= 0
                                ? "Out of stock"
                                : "Add to shopping cart"
                            }
                          >
                            <ShoppingBag size={18} />
                          </button>
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </section>

            <section className="benefits-section" id="why-kidora">
              <div className="benefit">
                <div className="benefit-icon">
                  <Truck size={23} />
                </div>
                <div>
                  <h3>Carefully delivered</h3>
                  <p>Little essentials, right to your door.</p>
                </div>
              </div>

              <div className="benefit">
                <div className="benefit-icon">
                  <ShieldCheck size={23} />
                </div>
                <div>
                  <h3>Quality you can trust</h3>
                  <p>Selected with little ones in mind.</p>
                </div>
              </div>

              <div className="benefit">
                <div className="benefit-icon">
                  <Headphones size={23} />
                </div>
                <div>
                  <h3>Here to help</h3>
                  <p>A little help whenever you need it.</p>
                </div>
              </div>
            </section>
          </>
        )}
      </main>

      {/* Cart Drawer */}
      <CartDrawer
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        cart={cart}
        onUpdateQuantity={updateCartQuantity}
        onRemoveItem={removeFromCart}
        onProceedToCheckout={handleProceedToCheckout}
      />

      <footer className="main-footer">
        <a className="logo footer-logo" href="/">
          <span className="logo-icon">k</span>
          <span>
            KIDORA<span className="logo-dot">.</span>
          </span>
        </a>

        <p>Made with ♡ for little people and the people who love them.</p>

        <a href="/admin" className="footer-admin-link">
          Store management
        </a>

        <span className="footer-copy">
          © {new Date().getFullYear()} KIDORA
        </span>
      </footer>
    </div>
  );
}

export default App;

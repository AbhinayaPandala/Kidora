
import { useEffect, useState } from "react";
import {
  PackagePlus,
  ArrowLeft,
  CheckCircle,
  AlertCircle,
  Trash2,
  LogOut,
  ShieldCheck,
  RefreshCw,
  Pencil,
  X,
  Image,
  UserPlus,
  ShoppingBag,
  Truck,
  MapPin,
  Phone,
  Clock,
  Filter,
} from "lucide-react";
import "./Admin.css";

const API_URL = "http://localhost:5000/api";
const TOKEN_KEY = "kidora_admin_token";

const initialForm = {
  name: "",
  description: "",
  category: "Clothing",
  price: "",
  image: "",
  brand: "KIDORA",
  ageGroup: "0-12 months",
  stock: "",
  featured: false,
};

function Admin() {
  const [token, setToken] = useState(
    () => sessionStorage.getItem(TOKEN_KEY) || ""
  );

  const [authMode, setAuthMode] = useState("login");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [setupKey, setSetupKey] = useState("");

  const [form, setForm] = useState(initialForm);
  const [editingId, setEditingId] = useState("");
  const [products, setProducts] = useState([]);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [authLoading, setAuthLoading] = useState(false);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [activeTab, setActiveTab] = useState("products");
  const [orders, setOrders] = useState([]);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [orderFilter, setOrderFilter] = useState("All");
  const [updatingOrderId, setUpdatingOrderId] = useState("");

  function logout() {
    sessionStorage.removeItem(TOKEN_KEY);
    setToken("");
    setPassword("");
    setProducts([]);
    setOrders([]);
    cancelEdit();
    setMessage("");
    setError("");
  }

  function cancelEdit() {
    setEditingId("");
    setForm({ ...initialForm });
  }

  function switchAuthMode(mode) {
    setAuthMode(mode);
    setError("");
    setMessage("");
    setPassword("");
  }

  async function handleAuth(event) {
    event.preventDefault();
    setError("");
    setMessage("");
    setAuthLoading(true);

    try {
      const isRegistering = authMode === "register";

      const endpoint = isRegistering
        ? "/admin/register"
        : "/admin/login";

      const body = isRegistering
        ? { username, email, password, setupKey }
        : { username, password };

      const response = await fetch(`${API_URL}${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Authentication failed.");
      }

      if (isRegistering) {
        setMessage(
          "Admin account created! You can now sign in with your new account."
        );
        setAuthMode("login");
        setPassword("");
        setSetupKey("");
      } else {
        sessionStorage.setItem(TOKEN_KEY, data.token);
        setToken(data.token);
        setPassword("");
        setMessage("Welcome to KIDORA Admin!");
      }
    } catch (err) {
      setError(
        err.message || "Could not connect to the backend. Check the server."
      );
    } finally {
      setAuthLoading(false);
    }
  }

  async function loadProducts() {
    if (!token) return;

    setLoadingProducts(true);
    setError("");

    try {
      const response = await fetch(`${API_URL}/products`);

      if (!response.ok) {
        throw new Error("Could not load products.");
      }

      const data = await response.json();
      setProducts(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message || "Could not load products.");
    } finally {
      setLoadingProducts(false);
    }
  }

  async function loadOrders() {
    if (!token) return;

    setLoadingOrders(true);
    try {
      const response = await fetch(`${API_URL}/admin/orders`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error("Could not load customer orders.");
      }

      const data = await response.json();
      setOrders(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message || "Failed to load customer orders.");
    } finally {
      setLoadingOrders(false);
    }
  }

  async function handleUpdateOrderStatus(orderId, newStatus) {
    setUpdatingOrderId(orderId);
    setError("");
    setMessage("");

    try {
      const response = await fetch(`${API_URL}/admin/orders/${orderId}/status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ orderStatus: newStatus }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to update order status.");
      }

      setMessage(`Order status updated to "${newStatus}".`);
      setOrders((prev) =>
        prev.map((ord) => (ord._id === orderId ? data.order : ord))
      );
      // Reload products to reflect any restocked quantities if cancelled/uncancelled
      loadProducts();
    } catch (err) {
      setError(err.message || "Failed to update order status.");
    } finally {
      setUpdatingOrderId("");
    }
  }

  useEffect(() => {
    if (token) {
      loadProducts();
      loadOrders();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  function handleChange(event) {
    const { name, value, type, checked } = event.target;

    setForm((current) => ({
      ...current,
      [name]: type === "checkbox" ? checked : value,
    }));
  }

  function startEdit(product) {
    setEditingId(product._id);

    setForm({
      name: product.name || "",
      description: product.description || "",
      category: product.category || "Clothing",
      price: String(product.price ?? ""),
      image: product.image || "",
      brand: product.brand || "KIDORA",
      ageGroup: product.ageGroup || "0-12 months",
      stock: String(product.stock ?? ""),
      featured: Boolean(product.featured),
    });

    setMessage("");
    setError("");

    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setMessage("");
    setError("");

    if (
      form.price === "" ||
      form.stock === "" ||
      !Number.isFinite(Number(form.price)) ||
      !Number.isFinite(Number(form.stock)) ||
      Number(form.price) < 0 ||
      Number(form.stock) < 0 ||
      !Number.isInteger(Number(form.stock))
    ) {
      setError("Enter a valid non-negative price and whole-number stock quantity.");
      return;
    }

    if (form.image.trim()) {
      const imgVal = form.image.trim();
      const isRelative = imgVal.startsWith("/") || imgVal.startsWith("./");
      const isData = imgVal.startsWith("data:image/");
      let isWebUrl = false;
      if (!isRelative && !isData) {
        try {
          const parsed = new URL(imgVal);
          isWebUrl = parsed.protocol === "http:" || parsed.protocol === "https:";
        } catch {
          isWebUrl = false;
        }
      }

      if (!isRelative && !isData && !isWebUrl) {
        setError(
          "Enter a valid image path (e.g. /products/floral-baby-dress.jpg) or web URL starting with https:// or http://."
        );
        return;
      }
    }

    try {
      setSaving(true);

      const isEditing = Boolean(editingId);
      const endpoint = isEditing
        ? `${API_URL}/products/${editingId}`
        : `${API_URL}/products`;

      const response = await fetch(endpoint, {
        method: isEditing ? "PUT" : "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          ...form,
          name: form.name.trim(),
          image: form.image.trim(),
          price: Number(form.price),
          stock: Number(form.stock),
        }),
      });

      const data = await response.json();

      if (response.status === 401) {
        logout();
        setError("Your admin session expired. Please log in again.");
        return;
      }

      if (!response.ok) {
        throw new Error(
          data.message ||
            (isEditing ? "Could not update product." : "Could not add product.")
        );
      }

      setMessage(
        isEditing
          ? `${data.product?.name || form.name} was updated successfully!`
          : `${data.name || form.name} was added successfully!`
      );

      cancelEdit();
      await loadProducts();
    } catch (err) {
      setError(err.message || "Could not connect to the server.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(product) {
    const confirmed = window.confirm(
      `Delete "${product.name}"? This cannot be undone.`
    );

    if (!confirmed) return;

    setMessage("");
    setError("");

    try {
      const response = await fetch(
        `${API_URL}/products/${product._id}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (response.status === 401) {
        logout();
        setError("Your admin session expired. Please log in again.");
        return;
      }

      if (!response.ok) {
        throw new Error(data.message || "Could not delete the product.");
      }

      setProducts((current) =>
        current.filter((item) => item._id !== product._id)
      );

      if (editingId === product._id) {
        cancelEdit();
      }

      setMessage(`${product.name} was deleted successfully.`);
    } catch (err) {
      setError(err.message || "Could not delete the product.");
    }
  }

  return (
    <div className="admin-page">
      <header className="admin-header">
        <a className="admin-logo" href="/">
          <span className="admin-logo-mark">k</span>
          KIDORA<span className="admin-logo-dot">.</span>
        </a>

        <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
          <a className="admin-back-link" href="/">
            <ArrowLeft size={17} />
            Back to shop
          </a>

          {token && (
            <button
              className="admin-back-link"
              type="button"
              onClick={logout}
              style={{
                border: 0,
                background: "transparent",
                cursor: "pointer",
              }}
            >
              <LogOut size={17} />
              Logout
            </button>
          )}
        </div>
      </header>

      <main className="admin-main">
        {!token ? (
          <>
            <div className="admin-heading">
              <span className="admin-eyebrow">SECURE STORE MANAGEMENT</span>
              <h1>
                {authMode === "register"
                  ? "Create your admin account"
                  : "Welcome back"}
              </h1>
              <p>
                {authMode === "register"
                  ? "Set up your KIDORA administrator account."
                  : "Sign in to manage the KIDORA collection."}
              </p>
            </div>

            <form className="admin-form" onSubmit={handleAuth}>
              <div className="admin-form-title">
                {authMode === "register" ? (
                  <UserPlus size={23} />
                ) : (
                  <ShieldCheck size={23} />
                )}
                <h2>
                  {authMode === "register"
                    ? "Admin registration"
                    : "Administrator sign in"}
                </h2>
              </div>

              <label>
                Username *
                <input
                  autoComplete="username"
                  value={username}
                  onChange={(event) => setUsername(event.target.value)}
                  minLength={3}
                  maxLength={30}
                  required
                />
              </label>

              {authMode === "register" && (
                <>
                  <label>
                    Email address *
                    <input
                      type="email"
                      autoComplete="email"
                      value={email}
                      onChange={(event) => setEmail(event.target.value)}
                      required
                    />
                  </label>
                </>
              )}

              <label>
                Password *
                <input
                  type="password"
                  autoComplete={
                    authMode === "register"
                      ? "new-password"
                      : "current-password"
                  }
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  minLength={authMode === "register" ? 12 : undefined}
                  maxLength={72}
                  required
                />
                {authMode === "register" && (
                  <small>Use 12–72 characters. Choose a strong password.</small>
                )}
              </label>

              {authMode === "register" && (
                <label>
                  One-time setup key *
                  <input
                    type="password"
                    autoComplete="off"
                    value={setupKey}
                    onChange={(event) => setSetupKey(event.target.value)}
                    required
                  />
                  <small>
                    Use the ADMIN_SETUP_KEY value configured in your server
                    .env file. Never share it.
                  </small>
                </label>
              )}

              {message && (
                <div className="admin-message success" role="status">
                  <CheckCircle size={19} />
                  {message}
                </div>
              )}

              {error && (
                <div className="admin-message error" role="alert">
                  <AlertCircle size={19} />
                  {error}
                </div>
              )}

              <button
                className="admin-submit"
                type="submit"
                disabled={authLoading}
              >
                {authMode === "register" ? (
                  <UserPlus size={19} />
                ) : (
                  <ShieldCheck size={19} />
                )}
                {authLoading
                  ? "Please wait..."
                  : authMode === "register"
                    ? "Create admin account"
                    : "Sign in securely"}
              </button>

              <p style={{ textAlign: "center", marginTop: 18 }}>
                {authMode === "login"
                  ? "Setting up your first admin account?"
                  : "Already created your admin account?"}
                {" "}
                <button
                  type="button"
                  onClick={() =>
                    switchAuthMode(
                      authMode === "login" ? "register" : "login"
                    )
                  }
                  style={{
                    border: 0,
                    background: "transparent",
                    color: "#8b5e83",
                    fontWeight: 700,
                    cursor: "pointer",
                  }}
                >
                  {authMode === "login" ? "Create account" : "Back to login"}
                </button>
              </p>
            </form>
          </>
        ) : (
          <>
            <div className="admin-heading">
              <span className="admin-eyebrow">SECURE STORE MANAGEMENT</span>
              <h1>
                {activeTab === "products"
                  ? "Manage KIDORA products"
                  : "Customer orders"}
              </h1>
              <p>
                {activeTab === "products"
                  ? "Add new products or edit existing details and images."
                  : "Review placed orders, customer delivery addresses, and update fulfillment statuses."}
              </p>
            </div>

            <div className="admin-tabs">
              <button
                type="button"
                className={`admin-tab-btn ${
                  activeTab === "products" ? "active" : ""
                }`}
                onClick={() => {
                  setActiveTab("products");
                  setMessage("");
                  setError("");
                }}
              >
                <PackagePlus size={18} />
                Products{" "}
                <span className="admin-tab-badge">{products.length}</span>
              </button>

              <button
                type="button"
                className={`admin-tab-btn ${
                  activeTab === "orders" ? "active" : ""
                }`}
                onClick={() => {
                  setActiveTab("orders");
                  setMessage("");
                  setError("");
                  loadOrders();
                }}
              >
                <ShoppingBag size={18} />
                Customer Orders{" "}
                <span className="admin-tab-badge">{orders.length}</span>
              </button>
            </div>

            {message && (
              <div className="admin-message success" role="status">
                <CheckCircle size={19} />
                {message}
              </div>
            )}

            {error && (
              <div className="admin-message error" role="alert">
                <AlertCircle size={19} />
                {error}
              </div>
            )}

            {activeTab === "products" && (
              <>
                <form className="admin-form" onSubmit={handleSubmit}>
                  <div className="admin-form-title">
                    {editingId ? <Pencil size={23} /> : <PackagePlus size={23} />}
                    <h2>
                      {editingId ? "Edit product" : "Add a new product"}
                </h2>

                {editingId && (
                  <button
                    type="button"
                    onClick={cancelEdit}
                    title="Cancel editing"
                    style={{ marginLeft: "auto", cursor: "pointer" }}
                  >
                    <X size={19} />
                  </button>
                )}
              </div>

              <label>
                Product name *
                <input
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  placeholder="e.g. Soft Cotton Baby Romper"
                  required
                  maxLength={120}
                />
              </label>

              <label>
                Description
                <textarea
                  name="description"
                  value={form.description}
                  onChange={handleChange}
                  placeholder="Describe this product..."
                  rows={3}
                />
              </label>

              <div className="admin-form-row">
                <label>
                  Category *
                  <select
                    name="category"
                    value={form.category}
                    onChange={handleChange}
                    required
                  >
                    <option value="Clothing">Clothing</option>
                    <option value="Toys">Toys</option>
                    <option value="Feeding">Feeding</option>
                    <option value="Nursery">Nursery</option>
                  </select>
                </label>

                <label>
                  Price (₹) *
                  <input
                    name="price"
                    type="number"
                    value={form.price}
                    onChange={handleChange}
                    min="0"
                    step="0.01"
                    required
                  />
                </label>
              </div>

              <label>
                Product image path or URL
                <input
                  name="image"
                  type="text"
                  value={form.image}
                  onChange={handleChange}
                  placeholder="/products/floral-baby-dress.jpg or https://..."
                />
                <small>
                  Use a local path like <code>/products/floral-baby-dress.jpg</code> or a direct web URL (https://...).
                </small>
              </label>

              <div style={{ marginBottom: 14 }}>
                <span
                  style={{
                    fontSize: 12,
                    color: "#88776e",
                    display: "block",
                    marginBottom: 6,
                    fontWeight: 600,
                  }}
                >
                  Quick select verified local product images:
                </span>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                  {[
                    { label: "Floral Baby Dress", path: "/products/floral-baby-dress.jpg" },
                    { label: "Baby Jeans", path: "/products/baby-jeans.jpg" },
                    { label: "Soft Romper", path: "/products/soft-cotton-baby-romper.jpg" },
                    { label: "Baby Gift Set", path: "/products/baby-gift-set.jpg" },
                    { label: "Teddy Bear", path: "/products/teddy-bear.jpg" },
                    { label: "Toy Car", path: "/products/centy-ambassador-toy-car.jpg" },
                    { label: "Feeding Bottle", path: "/products/baby-feeding-bottle.jpg" },
                    { label: "Baby Blanket", path: "/products/baby-blanket.jpg" },
                  ].map((img) => (
                    <button
                      key={img.path}
                      type="button"
                      onClick={() => setForm((prev) => ({ ...prev, image: img.path }))}
                      style={{
                        fontSize: 11,
                        padding: "5px 10px",
                        borderRadius: 6,
                        border: "1px solid #e2d4dc",
                        background: form.image === img.path ? "#eedbe5" : "#faf3f7",
                        color: "#6c4c64",
                        cursor: "pointer",
                        fontWeight: form.image === img.path ? 700 : 500,
                        transition: "all 0.15s ease",
                      }}
                    >
                      {img.label}
                    </button>
                  ))}
                </div>
              </div>

              {form.image.trim() && (
                <div style={{ marginBottom: 16 }}>
                  <p
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      marginBottom: 8,
                      fontWeight: 600,
                      color: "#5a473e",
                      fontSize: 13,
                    }}
                  >
                    <Image size={17} />
                    Live image preview
                  </p>
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    <img
                      key={form.image}
                      src={form.image}
                      alt="Product preview"
                      onError={(event) => {
                        event.currentTarget.style.display = "none";
                        const errBox = document.getElementById("admin-preview-error");
                        if (errBox) errBox.style.display = "flex";
                        const okBox = document.getElementById("admin-preview-success");
                        if (okBox) okBox.style.display = "none";
                      }}
                      onLoad={(event) => {
                        event.currentTarget.style.display = "block";
                        const errBox = document.getElementById("admin-preview-error");
                        if (errBox) errBox.style.display = "none";
                        const okBox = document.getElementById("admin-preview-success");
                        if (okBox) okBox.style.display = "inline-flex";
                      }}
                      style={{
                        width: 150,
                        height: 150,
                        objectFit: "cover",
                        borderRadius: 12,
                        border: "1.5px solid #eadfe6",
                        background: "#faf3f0",
                      }}
                    />
                    <div
                      id="admin-preview-error"
                      style={{
                        display: "none",
                        alignItems: "center",
                        gap: 8,
                        color: "#a33c37",
                        background: "#fff0ee",
                        border: "1px solid #f3d0cb",
                        borderRadius: 8,
                        padding: "8px 12px",
                        fontSize: 13,
                      }}
                    >
                      <AlertCircle size={16} flexShrink={0} />
                      <span>
                        Could not load image from this URL or path. Check that the image file exists in <code>client/public/products/</code> or the URL is valid.
                      </span>
                    </div>
                    <div
                      id="admin-preview-success"
                      style={{
                        display: "none",
                        alignItems: "center",
                        gap: 6,
                        color: "#286c4b",
                        background: "#edf8f0",
                        border: "1px solid #ccebd5",
                        borderRadius: 6,
                        padding: "5px 10px",
                        fontSize: 12,
                        fontWeight: 600,
                        width: "fit-content",
                      }}
                    >
                      <CheckCircle size={15} />
                      <span>Image loaded successfully</span>
                    </div>
                  </div>
                </div>
              )}

              <div className="admin-form-row">
                <label>
                  Brand
                  <input
                    name="brand"
                    value={form.brand}
                    onChange={handleChange}
                    required
                  />
                </label>

                <label>
                  Age group
                  <select
                    name="ageGroup"
                    value={form.ageGroup}
                    onChange={handleChange}
                  >
                    <option value="0-12 months">0-12 months</option>
                    <option value="1-3 years">1-3 years</option>
                    <option value="3-6 years">3-6 years</option>
                    <option value="6+ years">6+ years</option>
                    <option value="All ages">All ages</option>
                  </select>
                </label>
              </div>

              <label>
                Stock quantity *
                <input
                  name="stock"
                  type="number"
                  value={form.stock}
                  onChange={handleChange}
                  min="0"
                  step="1"
                  required
                />
              </label>

              <label className="admin-checkbox">
                <input
                  name="featured"
                  type="checkbox"
                  checked={form.featured}
                  onChange={handleChange}
                />
                Feature this product in the store
              </label>

              <button
                className="admin-submit"
                type="submit"
                disabled={saving}
              >
                {editingId ? <Pencil size={19} /> : <PackagePlus size={19} />}
                {saving
                  ? "Saving..."
                  : editingId
                    ? "Save product changes"
                    : "Save new product"}
              </button>
            </form>

            <section className="admin-form" style={{ marginTop: 28 }}>
              <div className="admin-form-title">
                <PackagePlus size={23} />
                <h2>Existing products ({products.length})</h2>
                <button
                  type="button"
                  onClick={loadProducts}
                  title="Refresh products"
                  style={{ marginLeft: "auto", cursor: "pointer" }}
                >
                  <RefreshCw size={17} />
                </button>
              </div>

              {loadingProducts ? (
                <p>Loading products...</p>
              ) : products.length === 0 ? (
                <p>No products found.</p>
              ) : (
                <div style={{ display: "grid", gap: 12 }}>
                  {products.map((product) => (
                    <div
                      key={product._id}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 12,
                        padding: 14,
                        border: "1px solid #eadfe6",
                        borderRadius: 12,
                      }}
                    >
                      {product.image ? (
                        <img
                          src={product.image}
                          alt={product.name}
                          onError={(event) => {
                            event.currentTarget.style.display = "none";
                            if (event.currentTarget.nextElementSibling) {
                              event.currentTarget.nextElementSibling.style.display = "flex";
                            }
                          }}
                          style={{
                            width: 64,
                            height: 64,
                            objectFit: "cover",
                            borderRadius: 8,
                            flexShrink: 0,
                            border: "1px solid #eadfe6",
                            background: "#faf3f0",
                          }}
                        />
                      ) : null}

                      <div
                        style={{
                          display: product.image ? "none" : "flex",
                          width: 64,
                          height: 64,
                          alignItems: "center",
                          justifyContent: "center",
                          borderRadius: 8,
                          flexShrink: 0,
                          background: "#faf3f0",
                          border: "1px solid #eadfe6",
                          color: "#9c8896",
                        }}
                      >
                        <Image size={24} strokeWidth={1.5} />
                      </div>

                      <div style={{ minWidth: 0, flex: 1 }}>
                        <strong>{product.name}</strong>
                        <p style={{ margin: "5px 0", color: "#777" }}>
                          ₹{Number(product.price).toLocaleString("en-IN")}
                          {" · "}
                          {product.category}
                          {" · Stock: "}
                          {product.stock}
                        </p>
                      </div>

                      <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
                        <button
                          type="button"
                          onClick={() => startEdit(product)}
                          aria-label={`Edit ${product.name}`}
                          title="Edit product"
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 6,
                            padding: "10px 12px",
                            border: 0,
                            borderRadius: 8,
                            background: "#f0e8f5",
                            color: "#704b80",
                            cursor: "pointer",
                          }}
                        >
                          <Pencil size={17} />
                          Edit
                        </button>

                        <button
                          type="button"
                          onClick={() => handleDelete(product)}
                          aria-label={`Delete ${product.name}`}
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 6,
                            padding: "10px 12px",
                            border: 0,
                            borderRadius: 8,
                            background: "#fbe8ec",
                            color: "#a83250",
                            cursor: "pointer",
                          }}
                        >
                          <Trash2 size={17} />
                          Delete
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </>
        )}

            {activeTab === "orders" && (
              <section className="admin-form">
                <div className="admin-orders-controls">
                  <div className="admin-form-title" style={{ margin: 0 }}>
                    <ShoppingBag size={22} />
                    <h2>
                      Customer orders (
                      {
                        orders.filter(
                          (o) =>
                            orderFilter === "All" ||
                            o.orderStatus?.toLowerCase() ===
                              orderFilter.toLowerCase()
                        ).length
                      }
                      )
                    </h2>
                  </div>

                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <div className="admin-filter-group">
                      <Filter size={15} />
                      <label htmlFor="order-status-filter" style={{ display: "none" }}>Filter orders</label>
                      <select
                        id="order-status-filter"
                        value={orderFilter}
                        onChange={(e) => setOrderFilter(e.target.value)}
                      >
                        <option value="All">All Statuses</option>
                        <option value="Pending">Pending</option>
                        <option value="Confirmed">Confirmed</option>
                        <option value="Shipped">Shipped</option>
                        <option value="Delivered">Delivered</option>
                        <option value="Cancelled">Cancelled</option>
                      </select>
                    </div>

                    <button
                      type="button"
                      onClick={loadOrders}
                      title="Refresh orders"
                      style={{
                        padding: "8px 12px",
                        borderRadius: 8,
                        border: "1px solid #f0e5de",
                        background: "#fff",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        gap: 6,
                        fontSize: 13,
                        color: "#765b50",
                      }}
                    >
                      <RefreshCw size={15} /> Refresh
                    </button>
                  </div>
                </div>

                {loadingOrders ? (
                  <p>Loading orders from database...</p>
                ) : orders.length === 0 ? (
                  <div style={{ textAlign: "center", padding: "40px 10px", color: "#88776e" }}>
                    <ShoppingBag size={48} style={{ margin: "0 auto 12px", opacity: 0.35 }} />
                    <h3 style={{ margin: "0 0 6px", color: "#44352f" }}>No customer orders placed yet</h3>
                    <p style={{ margin: 0, fontSize: 14 }}>When customers place orders, they will appear right here.</p>
                  </div>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                    {orders
                      .filter(
                        (order) =>
                          orderFilter === "All" ||
                          order.orderStatus?.toLowerCase() ===
                            orderFilter.toLowerCase()
                      )
                      .map((order) => {
                        const statusClass = (order.orderStatus || "Pending").toLowerCase();

                        return (
                          <div key={order._id} className="admin-order-card">
                            <div className="admin-order-header">
                              <div className="admin-order-id">
                                <strong>{order.orderNumber}</strong>
                                <span className="admin-order-date">
                                  {new Date(order.createdAt).toLocaleDateString("en-IN", {
                                    day: "numeric",
                                    month: "short",
                                    year: "numeric",
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  })}
                                </span>
                              </div>

                              <div className="admin-status-control">
                                <label style={{ fontSize: 12, fontWeight: 700, color: "#765b50" }}>
                                  Status:
                                </label>
                                <select
                                  className={`admin-status-select ${statusClass}`}
                                  value={order.orderStatus || "Pending"}
                                  disabled={updatingOrderId === order._id}
                                  onChange={(e) =>
                                    handleUpdateOrderStatus(order._id, e.target.value)
                                  }
                                >
                                  <option value="Pending">Pending</option>
                                  <option value="Confirmed">Confirmed</option>
                                  <option value="Shipped">Shipped</option>
                                  <option value="Delivered">Delivered</option>
                                  <option value="Cancelled">Cancelled</option>
                                </select>
                              </div>
                            </div>

                            <div className="admin-order-grid">
                              {/* Customer and Delivery Information */}
                              <div className="admin-order-section">
                                <h4>Customer & Delivery</h4>
                                <div className="admin-order-customer-info">
                                  <strong>{order.customer?.name}</strong>
                                  <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
                                    <Phone size={13} /> {order.customer?.phone}
                                  </span>
                                  {order.customer?.email && (
                                    <span>{order.customer.email}</span>
                                  )}
                                  <span style={{ display: "flex", alignItems: "start", gap: 6, marginTop: 4 }}>
                                    <MapPin size={13} style={{ flexShrink: 0, marginTop: 2 }} />
                                    {order.shippingAddress?.address},{" "}
                                    {order.shippingAddress?.city},{" "}
                                    {order.shippingAddress?.state} -{" "}
                                    {order.shippingAddress?.postalCode}
                                  </span>
                                  {order.notes && (
                                    <span style={{ marginTop: 4, fontStyle: "italic", color: "#8e5848" }}>
                                      Note: {order.notes}
                                    </span>
                                  )}
                                </div>
                              </div>

                              {/* Items Breakdown */}
                              <div className="admin-order-section">
                                <h4>
                                  Items ({order.items?.reduce((s, i) => s + i.quantity, 0) || 0})
                                </h4>
                                <div className="admin-order-items-list">
                                  {order.items?.map((item, idx) => (
                                    <div key={idx} className="admin-order-item-row">
                                      {item.image ? (
                                        <img
                                          src={item.image}
                                          alt={item.name}
                                          className="admin-order-item-img"
                                          onError={(e) => {
                                            e.currentTarget.style.display = "none";
                                            if (e.currentTarget.nextElementSibling) {
                                              e.currentTarget.nextElementSibling.style.display = "grid";
                                            }
                                          }}
                                        />
                                      ) : null}
                                      <div
                                        className="admin-order-item-placeholder"
                                        style={{ display: item.image ? "none" : "grid" }}
                                      >
                                        <Image size={16} strokeWidth={1.5} color="#9a8693" />
                                      </div>

                                      <div style={{ flex: 1, minWidth: 0 }}>
                                        <div style={{ fontWeight: 600, color: "#44352f" }}>
                                          {item.name}
                                        </div>
                                        <small style={{ color: "#88776e" }}>
                                          Qty: {item.quantity} × ₹{Number(item.price).toLocaleString("en-IN")}
                                        </small>
                                      </div>

                                      <div style={{ fontWeight: 700, color: "#44352f" }}>
                                        ₹{Number(item.lineTotal || item.price * item.quantity).toLocaleString("en-IN")}
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            </div>

                            <div className="admin-order-footer">
                              <span className="admin-order-payment-pill">
                                Payment: {order.paymentMethod || "Cash on Delivery"} ({order.paymentStatus || "Pending"})
                              </span>

                              <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                                <span style={{ fontSize: 13, color: "#88776e" }}>
                                  Subtotal: ₹{Number(order.subtotal || 0).toLocaleString("en-IN")} + Delivery: ₹{Number(order.deliveryFee || 0).toLocaleString("en-IN")}
                                </span>
                                <span className="admin-order-total-amount">
                                  Total: ₹{Number(order.totalAmount || 0).toLocaleString("en-IN")}
                                </span>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                  </div>
                )}
              </section>
            )}
          </>
        )}
      </main>
    </div>
  );
}

export default Admin;

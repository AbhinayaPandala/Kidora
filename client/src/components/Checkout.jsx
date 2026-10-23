import React, { useState } from "react";
import {
  ArrowLeft,
  ShieldCheck,
  Truck,
  CheckCircle,
  AlertCircle,
  CreditCard,
  Banknote,
  Lock,
  Image as ImageIcon,
} from "lucide-react";

const API_ORDERS_URL = "http://localhost:5000/api/orders";

export default function Checkout({ cart, onBack, onOrderSuccess }) {
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    email: "",
    address: "",
    city: "",
    state: "",
    postalCode: "",
    notes: "",
  });

  const [paymentMethod, setPaymentMethod] = useState("Cash on Delivery");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const subtotal = cart.reduce(
    (sum, item) => sum + Number(item.price) * item.quantity,
    0
  );
  const deliveryFee = subtotal >= 500 ? 0 : 50;
  const grandTotal = subtotal + deliveryFee;

  function handleChange(e) {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (error) setError("");
  }

  function validate() {
    if (!formData.name.trim()) {
      return "Please enter your full name.";
    }
    const cleanPhone = formData.phone.trim();
    if (!cleanPhone || !/^[\d+\-\s()]{7,15}$/.test(cleanPhone)) {
      return "Please enter a valid phone number (at least 7 to 15 digits).";
    }
    if (
      formData.email.trim() &&
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())
    ) {
      return "Please enter a valid email address, or leave it blank.";
    }
    if (formData.address.trim().length < 5) {
      return "Please enter your complete delivery street address (at least 5 characters).";
    }
    if (!formData.city.trim()) {
      return "Please enter your city.";
    }
    if (!formData.state.trim()) {
      return "Please enter your state.";
    }
    if (formData.postalCode.trim().length < 3) {
      return "Please enter a valid postal / PIN code.";
    }
    if (cart.length === 0) {
      return "Your shopping bag is empty. Please add items before checking out.";
    }
    return null;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");

    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }

    setSubmitting(true);

    try {
      const payload = {
        customer: {
          name: formData.name.trim(),
          phone: formData.phone.trim(),
          email: formData.email.trim(),
        },
        shippingAddress: {
          address: formData.address.trim(),
          city: formData.city.trim(),
          state: formData.state.trim(),
          postalCode: formData.postalCode.trim(),
        },
        items: cart.map((item) => ({
          productId: item._id,
          quantity: item.quantity,
        })),
        paymentMethod: paymentMethod,
        notes: formData.notes.trim(),
      };

      const response = await fetch(API_ORDERS_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to place your order. Please try again.");
      }

      // Success! Pass order info to parent
      onOrderSuccess(data.order);
    } catch (err) {
      setError(err.message || "An unexpected error occurred while placing your order.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="checkout-page">
      <div className="checkout-top-nav">
        <button
          type="button"
          className="checkout-back-btn"
          onClick={onBack}
        >
          <ArrowLeft size={18} />
          <span>Back to Shopping</span>
        </button>
      </div>

      <div className="checkout-header-title">
        <span className="checkout-eyebrow">FAST & SECURE CHECKOUT</span>
        <h1>Complete your order</h1>
        <p>Your little one's package will be on its way soon.</p>
      </div>

      {error && (
        <div className="checkout-alert error" role="alert">
          <AlertCircle size={20} />
          <span>{error}</span>
        </div>
      )}

      <form className="checkout-layout" onSubmit={handleSubmit}>
        {/* Left Column: Delivery & Payment Details */}
        <div className="checkout-form-column">
          <section className="checkout-section-card">
            <div className="checkout-section-header">
              <Truck size={20} />
              <h2>1. Delivery Address</h2>
            </div>

            <div className="checkout-fields">
              <label className="checkout-label">
                Full Name *
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="e.g. Priya Sharma"
                  required
                  autoComplete="name"
                />
              </label>

              <div className="checkout-row">
                <label className="checkout-label">
                  Contact Phone Number *
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    placeholder="e.g. 9876543210"
                    required
                    autoComplete="tel"
                  />
                </label>

                <label className="checkout-label">
                  Email Address (optional)
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="e.g. priya@example.com"
                    autoComplete="email"
                  />
                </label>
              </div>

              <label className="checkout-label">
                Complete Street Address *
                <textarea
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  placeholder="House / Flat / Block No., Street name, Landmark"
                  rows={2}
                  required
                  autoComplete="street-address"
                />
              </label>

              <div className="checkout-row-three">
                <label className="checkout-label">
                  City *
                  <input
                    type="text"
                    name="city"
                    value={formData.city}
                    onChange={handleChange}
                    placeholder="e.g. Mumbai"
                    required
                    autoComplete="address-level2"
                  />
                </label>

                <label className="checkout-label">
                  State *
                  <input
                    type="text"
                    name="state"
                    value={formData.state}
                    onChange={handleChange}
                    placeholder="e.g. Maharashtra"
                    required
                    autoComplete="address-level1"
                  />
                </label>

                <label className="checkout-label">
                  PIN / Postal Code *
                  <input
                    type="text"
                    name="postalCode"
                    value={formData.postalCode}
                    onChange={handleChange}
                    placeholder="e.g. 400001"
                    required
                    autoComplete="postal-code"
                  />
                </label>
              </div>

              <label className="checkout-label">
                Order Notes / Delivery instructions (optional)
                <input
                  type="text"
                  name="notes"
                  value={formData.notes}
                  onChange={handleChange}
                  placeholder="e.g. Leave with security guard, or call before arrival"
                />
              </label>
            </div>
          </section>

          <section className="checkout-section-card">
            <div className="checkout-section-header">
              <Banknote size={20} />
              <h2>2. Payment Method</h2>
            </div>

            <div className="payment-options">
              {/* Working Cash on Delivery Option */}
              <label
                className={`payment-option ${
                  paymentMethod === "Cash on Delivery" ? "selected" : ""
                }`}
              >
                <div className="payment-option-header">
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="Cash on Delivery"
                    checked={paymentMethod === "Cash on Delivery"}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                  />
                  <div className="payment-option-info">
                    <span className="payment-title">Cash on Delivery (COD)</span>
                    <span className="payment-badge-active">Available</span>
                  </div>
                </div>
                <p className="payment-desc">
                  Pay securely with cash or UPI directly to the courier partner upon delivery at your doorstep.
                </p>
              </label>

              {/* Online Payment Option marked Coming Soon */}
              <div className="payment-option disabled">
                <div className="payment-option-header">
                  <input type="radio" disabled name="paymentMethod" />
                  <div className="payment-option-info">
                    <span className="payment-title">Online Payment (Cards, UPI, NetBanking)</span>
                    <span className="payment-badge-soon">Coming Soon</span>
                  </div>
                </div>
                <p className="payment-desc">
                  Online payment gateway integration will be active soon. Please select Cash on Delivery for instant ordering.
                </p>
              </div>
            </div>
          </section>
        </div>

        {/* Right Column: Order Summary & Confirmation */}
        <div className="checkout-summary-column">
          <div className="checkout-summary-card">
            <h3>Order Summary ({cart.reduce((s, i) => s + i.quantity, 0)} items)</h3>

            <div className="checkout-items-preview">
              {cart.map((item) => (
                <div key={item._id} className="checkout-item-row">
                  <div className="checkout-item-img-wrap">
                    {item.image ? (
                      <img
                        src={item.image}
                        alt={item.name}
                        onError={(e) => {
                          e.currentTarget.style.display = "none";
                          if (e.currentTarget.nextElementSibling) {
                            e.currentTarget.nextElementSibling.style.display = "flex";
                          }
                        }}
                      />
                    ) : null}
                    <div
                      className="checkout-item-placeholder"
                      style={{ display: item.image ? "none" : "flex" }}
                    >
                      <ImageIcon size={18} strokeWidth={1.5} color="#a894a0" />
                    </div>
                  </div>

                  <div className="checkout-item-meta">
                    <span className="checkout-item-name">{item.name}</span>
                    <span className="checkout-item-qty">
                      Qty: {item.quantity} × ₹{Number(item.price).toLocaleString("en-IN")}
                    </span>
                  </div>

                  <span className="checkout-item-price">
                    ₹{(Number(item.price) * item.quantity).toLocaleString("en-IN")}
                  </span>
                </div>
              ))}
            </div>

            <div className="checkout-totals">
              <div className="checkout-total-row">
                <span>Subtotal</span>
                <span>₹{subtotal.toLocaleString("en-IN")}</span>
              </div>
              <div className="checkout-total-row">
                <span>Delivery Charges</span>
                <span>
                  {deliveryFee === 0 ? (
                    <span className="free-badge">FREE</span>
                  ) : (
                    `₹${deliveryFee}`
                  )}
                </span>
              </div>
              <div className="checkout-total-row grand-total">
                <span>Grand Total</span>
                <span>₹{grandTotal.toLocaleString("en-IN")}</span>
              </div>
            </div>

            <div className="checkout-security-box">
              <ShieldCheck size={18} />
              <span>100% Safe & Genuine KIDORA products</span>
            </div>

            <button
              type="submit"
              className="primary-button checkout-submit-btn"
              disabled={submitting || cart.length === 0}
            >
              {submitting ? (
                <>
                  <span className="spinner" /> Placing your order...
                </>
              ) : (
                <>
                  <Lock size={18} /> Confirm Cash on Delivery Order (₹
                  {grandTotal.toLocaleString("en-IN")})
                </>
              )}
            </button>

            <p className="checkout-terms-note">
              By confirming your order, you agree to receive order notifications and delivery updates from KIDORA.
            </p>
          </div>
        </div>
      </form>
    </div>
  );
}

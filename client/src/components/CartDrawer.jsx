import React, { useEffect } from "react";
import {
  X,
  ShoppingBag,
  Plus,
  Minus,
  Trash2,
  ArrowRight,
  Truck,
  Sparkles,
  Image as ImageIcon,
} from "lucide-react";

export default function CartDrawer({
  isOpen,
  onClose,
  cart,
  onUpdateQuantity,
  onRemoveItem,
  onProceedToCheckout,
}) {
  // Close drawer on Escape key
  useEffect(() => {
    function handleKeyDown(event) {
      if (event.key === "Escape" && isOpen) {
        onClose();
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  // Lock body scroll when drawer is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const totalQuantity = cart.reduce((sum, item) => sum + item.quantity, 0);
  const subtotal = cart.reduce(
    (sum, item) => sum + Number(item.price) * item.quantity,
    0
  );
  const freeShippingThreshold = 500;
  const isFreeDelivery = subtotal >= freeShippingThreshold;
  const deliveryFee = isFreeDelivery ? 0 : 50;
  const grandTotal = subtotal + deliveryFee;
  const progressToFreeShipping = Math.min(
    100,
    Math.round((subtotal / freeShippingThreshold) * 100)
  );

  return (
    <div className="cart-drawer-overlay" onClick={onClose} role="dialog" aria-modal="true" aria-label="Shopping Cart">
      <div
        className="cart-drawer"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="cart-drawer-header">
          <div className="cart-drawer-title">
            <ShoppingBag size={22} />
            <h2>Your Shopping Bag</h2>
            {totalQuantity > 0 && (
              <span className="cart-count-pill">{totalQuantity}</span>
            )}
          </div>
          <button
            type="button"
            className="cart-close-btn"
            onClick={onClose}
            aria-label="Close cart drawer"
          >
            <X size={20} />
          </button>
        </header>

        {/* Free delivery tracker */}
        {cart.length > 0 && (
          <div className="free-shipping-bar">
            <div className="free-shipping-text">
              <Truck size={16} />
              {isFreeDelivery ? (
                <span><strong>Congratulations!</strong> You get FREE delivery! 🎉</span>
              ) : (
                <span>
                  Add <strong>₹{(freeShippingThreshold - subtotal).toLocaleString("en-IN")}</strong> more for <strong>FREE delivery</strong>
                </span>
              )}
            </div>
            <div className="free-shipping-progress">
              <div
                className="free-shipping-fill"
                style={{ width: `${progressToFreeShipping}%` }}
              />
            </div>
          </div>
        )}

        <div className="cart-drawer-body">
          {cart.length === 0 ? (
            <div className="cart-empty-state">
              <span className="cart-empty-emoji">🧸</span>
              <h3>Your bag is empty</h3>
              <p>Looks like you haven't added any little favourites yet.</p>
              <button
                type="button"
                className="primary-button"
                onClick={onClose}
              >
                Start Shopping <ArrowRight size={17} />
              </button>
            </div>
          ) : (
            <ul className="cart-items-list">
              {cart.map((item) => {
                const maxStock = typeof item.stock === "number" ? item.stock : 99;
                const isMax = item.quantity >= maxStock;

                return (
                  <li key={item._id} className="cart-item">
                    <div className="cart-item-image-wrap">
                      {item.image ? (
                        <img
                          src={item.image}
                          alt={item.name}
                          className="cart-item-image"
                          onError={(e) => {
                            e.currentTarget.style.display = "none";
                            if (e.currentTarget.nextElementSibling) {
                              e.currentTarget.nextElementSibling.style.display = "flex";
                            }
                          }}
                        />
                      ) : null}
                      <div
                        className="cart-item-placeholder"
                        style={{ display: item.image ? "none" : "flex" }}
                      >
                        <ImageIcon size={22} strokeWidth={1.5} color="#a894a0" />
                      </div>
                    </div>

                    <div className="cart-item-details">
                      <div className="cart-item-top">
                        <span className="cart-item-category">{item.category}</span>
                        <button
                          type="button"
                          className="cart-item-remove"
                          onClick={() => onRemoveItem(item._id)}
                          aria-label={`Remove ${item.name} from cart`}
                          title="Remove item"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>

                      <h4 className="cart-item-name">{item.name}</h4>
                      <div className="cart-item-price-unit">
                        ₹{Number(item.price).toLocaleString("en-IN")} each
                      </div>

                      <div className="cart-item-bottom">
                        <div className="cart-qty-selector">
                          <button
                            type="button"
                            className="cart-qty-btn"
                            disabled={item.quantity <= 1}
                            onClick={() => onUpdateQuantity(item._id, item.quantity - 1)}
                            aria-label="Decrease quantity"
                          >
                            <Minus size={14} />
                          </button>
                          <span className="cart-qty-value">{item.quantity}</span>
                          <button
                            type="button"
                            className="cart-qty-btn"
                            disabled={isMax}
                            onClick={() => onUpdateQuantity(item._id, item.quantity + 1)}
                            aria-label="Increase quantity"
                          >
                            <Plus size={14} />
                          </button>
                        </div>

                        <div className="cart-item-total">
                          ₹{(Number(item.price) * item.quantity).toLocaleString("en-IN")}
                        </div>
                      </div>

                      {isMax && (
                        <span className="cart-stock-notice">
                          Only {maxStock} in stock
                        </span>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {cart.length > 0 && (
          <footer className="cart-drawer-footer">
            <div className="cart-summary-breakdown">
              <div className="cart-summary-row">
                <span>Subtotal</span>
                <span>₹{subtotal.toLocaleString("en-IN")}</span>
              </div>
              <div className="cart-summary-row">
                <span>Delivery Fee</span>
                <span>
                  {isFreeDelivery ? (
                    <span className="free-badge">FREE</span>
                  ) : (
                    `₹${deliveryFee}`
                  )}
                </span>
              </div>
              <div className="cart-summary-row cart-total-row">
                <span>Total Amount</span>
                <span>₹{grandTotal.toLocaleString("en-IN")}</span>
              </div>
            </div>

            <button
              type="button"
              className="primary-button cart-checkout-btn"
              onClick={onProceedToCheckout}
            >
              Proceed to Checkout <ArrowRight size={18} />
            </button>

            <button
              type="button"
              className="cart-continue-btn"
              onClick={onClose}
            >
              Continue Shopping
            </button>
          </footer>
        )}
      </div>
    </div>
  );
}

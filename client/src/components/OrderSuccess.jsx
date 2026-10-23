import React from "react";
import {
  CheckCircle2,
  Package,
  Truck,
  MapPin,
  Calendar,
  CreditCard,
  Phone,
  ArrowRight,
  Printer,
  Sparkles,
} from "lucide-react";

export default function OrderSuccess({ order, onContinueShopping }) {
  if (!order) return null;

  const {
    orderNumber,
    customer,
    shippingAddress,
    items = [],
    subtotal,
    deliveryFee,
    totalAmount,
    paymentMethod,
    createdAt,
  } = order;

  const formattedDate = createdAt
    ? new Date(createdAt).toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : new Date().toLocaleDateString("en-IN");

  return (
    <div className="order-success-page">
      <div className="order-success-card">
        <div className="order-success-banner">
          <div className="success-icon-wrap">
            <CheckCircle2 size={56} className="success-icon" />
          </div>
          <span className="order-success-eyebrow">
            <Sparkles size={16} /> ORDER CONFIRMED
          </span>
          <h1>Thank you for your order!</h1>
          <p className="order-success-subtitle">
            We've received your order and are lovingly packing it for your little one.
          </p>
          <div className="order-number-badge">
            <span>Order Number:</span>
            <strong>{orderNumber}</strong>
          </div>
        </div>

        <div className="order-details-grid">
          {/* Order Details / Shipping Details */}
          <div className="order-info-block">
            <h3>
              <MapPin size={18} /> Delivery Information
            </h3>
            <div className="order-info-content">
              <p className="customer-name">{customer?.name}</p>
              <p className="customer-phone">
                <Phone size={14} /> {customer?.phone}
              </p>
              {customer?.email && <p className="customer-email">{customer.email}</p>}
              <p className="customer-address">
                {shippingAddress?.address}, {shippingAddress?.city},{" "}
                {shippingAddress?.state} - {shippingAddress?.postalCode}
              </p>
              {order.notes && (
                <p className="order-note-display">
                  <strong>Delivery Note:</strong> {order.notes}
                </p>
              )}
            </div>
          </div>

          {/* Payment & Status Info */}
          <div className="order-info-block">
            <h3>
              <CreditCard size={18} /> Payment & Status
            </h3>
            <div className="order-info-content">
              <div className="status-row">
                <span>Payment Method:</span>
                <strong>{paymentMethod || "Cash on Delivery"}</strong>
              </div>
              <div className="status-row">
                <span>Payment Status:</span>
                <span className="badge-pending">Due on Delivery</span>
              </div>
              <div className="status-row">
                <span>Order Status:</span>
                <span className="badge-confirmed">Confirmed</span>
              </div>
              <div className="status-row">
                <span>Placed On:</span>
                <span>{formattedDate}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Ordered Items Summary */}
        <div className="order-items-summary">
          <h3>
            <Package size={18} /> Ordered Items ({items.reduce((s, i) => s + i.quantity, 0)})
          </h3>

          <div className="order-items-table">
            {items.map((item, idx) => (
              <div key={item.product || idx} className="order-item-receipt-row">
                <div className="order-item-receipt-image">
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
                    className="order-item-placeholder"
                    style={{ display: item.image ? "none" : "flex" }}
                  >
                    🧸
                  </div>
                </div>

                <div className="order-item-receipt-details">
                  <h4>{item.name}</h4>
                  <span>
                    Qty: {item.quantity} × ₹{Number(item.price).toLocaleString("en-IN")}
                  </span>
                </div>

                <div className="order-item-receipt-price">
                  ₹{Number(item.lineTotal || item.price * item.quantity).toLocaleString("en-IN")}
                </div>
              </div>
            ))}
          </div>

          <div className="order-cost-breakdown">
            <div className="cost-row">
              <span>Subtotal</span>
              <span>₹{Number(subtotal).toLocaleString("en-IN")}</span>
            </div>
            <div className="cost-row">
              <span>Delivery Fee</span>
              <span>
                {deliveryFee === 0 ? "FREE" : `₹${Number(deliveryFee).toLocaleString("en-IN")}`}
              </span>
            </div>
            <div className="cost-row grand-total">
              <span>Total Payable upon Delivery</span>
              <span>₹{Number(totalAmount).toLocaleString("en-IN")}</span>
            </div>
          </div>
        </div>

        <div className="order-success-actions">
          <button
            type="button"
            className="primary-button"
            onClick={onContinueShopping}
          >
            Continue Shopping <ArrowRight size={18} />
          </button>

          <button
            type="button"
            className="secondary-button print-btn"
            onClick={() => window.print()}
          >
            <Printer size={17} /> Print Receipt
          </button>
        </div>
      </div>
    </div>
  );
}

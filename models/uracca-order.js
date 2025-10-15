import mongoose, { Schema } from "mongoose";
import {
  OrderReturnStatusEnum,
  OrderStatusEnum,
  PaymentMethodEnum,
} from "../utils/enum.js";

const addressSchema = new mongoose.Schema({
  userName: { type: String },
  userMobile: { type: String },
  street: { type: String, required: true },
  city: { type: String, required: true },
  buildingNo: { type: String, required: true },
  landmark: { type: String, required: true },
  state: { type: String, required: true },
  country: { type: String, required: true },
  postalCode: { type: String, required: true },
  postOffice: { type: String },
  isDefault: { type: Boolean, default: false },
});

const appliedDiscount = new mongoose.Schema({
  promocode: String,
  promoCodeOffer: {
    type: Schema.Types.ObjectId,
    ref: "promocodes",
  },
  cartCheckoutOffer: {
    type: Schema.Types.ObjectId,
    ref: "Offers",
  },
  paymentMethodOffer: {
    type: Schema.Types.ObjectId,
    ref: "Offers",
  },
  mobileAppOffer: {
    type: Schema.Types.ObjectId,
    ref: "Offers",
  },
});

const priceSchema = new mongoose.Schema({
  gstRate: {
    type: Number,
  },
  cessRate: {
    type: Number,
  },
  mrp: {
    type: Number,
    default: 0,
    required: true,
  },

  discount: {
    type: Number,
    default: 0,
  },
  
  unitPrice: {
    type: Number,
    default: 0,
    required: true,
  },
  quantity: {
    type: Number,
    default: 1,
    required: true,
  },

  cartCheckoutDiscount: {
    type: Number,
    default: 0,
  },
  mobileAppDiscount: {
    type: Number,
    default: 0,
  },
  paymentMethodDiscount: {
    type: Number,
    default: 0,
  },
  promoDiscount: {
    type: Number,
    default: 0,
  },
  totalDiscount: {
    type: Number,
    default: 0,
  },
  subTotal: {
    type: Number,
    default: 0,
    required: true,
  },
  taxableAmount: {
    type: Number,
    default: 0,
  },
  gstAmount: {
    type: Number,
    default: 0,
  },
  cessAmount: {
    type: Number,
    default: 0,
  },

  deliveryCharge: { type: Number },
  total: {
    type: Number,
    default: 0,
    required: true,
  },
});
const variationSchema = new mongoose.Schema({
  variationName: { type: String },
  colorName: { type: String, required: true },
  colorCode: { type: String, required: true },
  label: { type: String },
  size: { type: String, required: true },
  sku: { type: String },
  discountType: {
    type: String,
    enum: ["percentage", "amount"],
  },
  photos: { type: [String], default: [] },
});

const orderProductSchema = new mongoose.Schema({
  productId: { type: String },
  productName: { type: String },
  slug: { type: String },
  brand: { type: String },
  categoryId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Category",
    required: true,
  },
  bankDetails: {
    accountHolderName: { type: String },
    bankName: { type: String },
    branch: { type: String },
    ifscCode: { type: String },
    accountNumber: { type: String },
  },
  description: { type: String },
  productFeatures: { type: String },
  specialFeatures: { type: String },
  careGuide: { type: String },
  minimumQuantity: { type: Number },
  keyWords: { type: [String] },
  cashOnDelivery: { type: Boolean },
  refundable: { type: Boolean },
  returnable: { type: Boolean },
  published: { type: Boolean },
  featured: { type: Boolean },
  freeShipping: { type: Boolean },
  todaysDeal: { type: Boolean },
  thumbnail: [{ type: String }],
  gstRate: {
    type: Number,
    default: 0,
  },
  cessRate: {
    type: Number,
    default: 0,
  },
  hsn: {
    type: String,
    default: 0,
  },
  variations: variationSchema,
  pricing: priceSchema,
  OrderStatus: {
    type: String,
    enum: OrderStatusEnum,
    default: OrderStatusEnum.PENDING,
  },
  PaymentStatus: {
    type: String,
    enum: ["pending", "confirmed", "refunded", "cancelled"],
    default: "pending",
  },
  orderCollectionStatus: { type: String, enum: ["pending", "completed",], default: "pending", },
  ReturnStatus: {
    type: String,
    enum: OrderReturnStatusEnum,
    default: OrderReturnStatusEnum.NILL,
  },
  cancelledBy: {
    type: String,
    enum: ["user", "admin"],
    default: null,
  },
  returnMode: {
    type: String,
    enum: ["replace", "refund"],
  },
  returnReason: { type: String },
  returnDocs: {
    video: { type: String },
    images: [{ type: String }],
  },
  reasonDescription: { type: String },
  adminRejectReason: { type: String },
  orderStatusChangedAt: { type: Date, default: Date.now },
  confirmedAt: { type: Date, default: Date.now },
  shippedAt: { type: Date },
  deliveredAt: { type: Date },
  cancelledAt: { type: Date },
  refundedAt: { type: Date },
  replacedAt: { type: Date },
  returnRequestedAt: { type: Date },
  returnAcceptedAt: { type: Date },
  returnRejectedAt: { type: Date },
  returnCancelledAt: { type: Date },
  returnRefundedAt: { type: Date },
  returnedAt: { type: Date },
  paymentStatusChangedAt: { type: Date },
  returnStatusChangedAt: { type: Date },
});

orderProductSchema.pre("save", function (next) {
  if (this.isModified("OrderStatus")) {
    this.orderStatusChangedAt = Date.now();
    if (this.OrderStatus === OrderStatusEnum.CONFIRMED) {
      this.confirmedAt = Date.now();
    }
    if (this.OrderStatus === OrderStatusEnum.SHIPPED) {
      this.shippedAt = Date.now();
    }
    if (this.OrderStatus === OrderStatusEnum.DELIVERED) {
      this.deliveredAt = Date.now();
    }
    if (this.OrderStatus === OrderStatusEnum.CANCELLED) {
      this.cancelledAt = Date.now();
    }
    if (this.OrderStatus === OrderStatusEnum.REPLACED) {
      this.replacedAt = Date.now();
    }
    if (this.OrderStatus === OrderStatusEnum.REFUNDED) {
      this.refundedAt = Date.now();
    }
  }
  if (this.isModified("PaymentStatus")) {
    this.paymentStatusChangedAt = Date.now();
  }
  if (this.isModified("ReturnStatus")) {
    this.returnStatusChangedAt = Date.now();
    if (this.OrderStatus === OrderReturnStatusEnum.REQUESTED) {
      this.returnRequestedAt = Date.now();
    }
    if (this.OrderStatus === OrderReturnStatusEnum.ACCEPTED) {
      this.returnAcceptedAt = Date.now();
    }
    if (this.OrderStatus === OrderReturnStatusEnum.REJECTED) {
      this.returnRejectedAt = Date.now();
    }
    if (this.OrderStatus === OrderReturnStatusEnum.CANCELLED) {
      this.returnCancelledAt = Date.now();
    }
    if (this.OrderStatus === OrderReturnStatusEnum.REFUNDED) {
      this.returnRefundedAt = Date.now();
    }
    if (this.OrderStatus === OrderReturnStatusEnum.RETURNED) {
      this.returnedAt = Date.now();
    }
  }
  next();
});

const orderSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  cartId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Cart",
    required: true,
  },
  products: [orderProductSchema],
  pricing: priceSchema,
  appliedDiscount: appliedDiscount,
  shippingAddress: addressSchema,
  paymentMethod: {
    type: String,
    enum: PaymentMethodEnum,
    required: true,
  },
  orderIdRazorPay: {
    type: String,
    required: function () {
      return this.paymentMethod === PaymentMethodEnum.RAZORPAY;
    },
  },
  paymentId: { type: String },
  moreInfo: { type: String },
  Message: String,
  createdAt: { type: Date, default: Date.now },
  orderId: { type: String, unique: true },
  invoiceId: { type: String, unique: true },
  invoiceDate: Date,
  returnPolicyVerified: { type: Boolean, default: false },
  replacementOrderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Order",
  },
  date: {
    type: String,
    default: () => new Date().toISOString().split("T")[0],
  },
});

orderSchema.pre("save", function (next) {
  this.products.forEach((product) => {
    if (!product.productId) {
      const randomProductId = Math.floor(Math.random() * 10 ** 10)
        .toString()
        .padStart(10, "0");
      product.productId = `PRD${randomProductId}`;
    }
  });
  if (this.isModified("invoiceId")) {
    this.invoiceDate = Date.now();
  }
  if (!this.orderId) {
    const randomOrderId = Math.floor(Math.random() * 10 ** 16)
      .toString()
      .padStart(16, "0");
    this.orderId = `OD${randomOrderId}`;
  }

  if (!this.invoiceId) {
    const randomInvoiceId = Math.floor(Math.random() * 10 ** 16)
      .toString()
      .padStart(16, "0");
    this.invoiceId = `INV${randomInvoiceId}`;
  }

  next();
});

const Order = mongoose.model("Order", orderSchema);
export default Order;

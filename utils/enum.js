export const BannerTypeEnum = {
  CATEGORY_COVER_IMAGE: "category-cover-image",
  HOME_SLIDER_IMAGE: "home-slider-image",
  FLASH_BANNERS: "flash_banners",
  V3_HOME_BANNER: "v3_home_banner",
  REELS: "reels",
  CONTEST: "contest",
};
export const PaymentMethodEnum = {
  RAZORPAY: "razorpay",
  COD: "cod",
};
export const ProductTypeEnum = {
  PRODUCT: "product",
  ACCESSORIES: "accessories",
};

export const ConditionTypeEnum = {
  ALL: "all",
  PRODUCT: "product",
  CATEGORY: "category",
  PRODUCT_TYPE: "product_type",
};

export const OrderStatusEnum = {
  PENDING: "pending",
  CONFIRMED: "confirmed",
  SHIPPED: "shipped",
  DELIVERED: "delivered",
  CANCELLED: "cancelled",
  REFUNDED: "refunded",
  REPLACED: "replaced",
};
export const OrderReturnStatusEnum = {
  NILL: "nill",
  REQUESTED: "requested",
  ACCEPTED: "accepted",
  REJECTED: "rejected",
  CANCELLED: "cancelled",
  REFUNDED: "refunded",
  RETURNED: "returned",
};

export const DiscountTypeEnum = {
  PERCENTAGE: "percentage",
  AMOUNT: "flat",
};

export const OfferConditionTypeEnum = {
  MINIMUM_QUANTITY: "MINIMUM_QUANTITY",
  MINIMUM_CART_VALUE: "MINIMUM_CART_VALUE",
};
export const OfferTypeEnum = {
  PAYMENT_METHOD: "PAYMENT_METHOD",
  CART_CONDITIONAL: "CART_CONDITIONAL",
  MOBILE_APP: "MOBILE_APP",
};

export const OrderChannelEnum = {
  WEB: "WEB",
  MOBILE_APP: "MOBILE_APP",
};

export const AffiliationStatusEnum = {
  NONE: "none",
  PENDING: "pending",
  APPROVED: "approved",
  REJECTED: "rejected",
  PAID: "paid",
  RESING: "resign",
};

export const PaymentStatusEnum = {
  REQUESTED: "requested",
  PROCESSING: "processing",
  PAID: "paid",
  REJECTED: "rejected",
};

export const AnalyticsEventEnum = {
  CLICK: "click",
  VIEW: "view",
  CONVERSION: "conversion",
};

export const AffiliationTierEnum = {
  DEFAULT: "default",
  DIAMOND: "diamond",
  GOLD: "gold",
  SILVER: "silver",
};

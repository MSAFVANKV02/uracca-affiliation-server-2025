export interface OrderCampaignProps {
    referralId: string;
    campaignAccessKey: string;
    orderId: string;
    productDetails?: any[];
  }
  
  export function OrderCampaign(props: OrderCampaignProps): Promise<any>;
  
  export function CancelCommission(orderId: string): Promise<any>;
  
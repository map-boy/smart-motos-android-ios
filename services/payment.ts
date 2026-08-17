import { getDriverEarnings, requestWithdrawal } from './ride';

class PaymentService {
  private static instance: PaymentService;
  private MIN_WITHDRAWAL = 50;

  private constructor() {}

  public static getInstance(): PaymentService {
    if (!PaymentService.instance) {
      PaymentService.instance = new PaymentService();
    }
    return PaymentService.instance;
  }

  public async getDriverEarnings(driverId: string): Promise<{
    total: number;
    available: number;
    withdrawn: number;
  }> {
    return getDriverEarnings(driverId);
  }

  public async requestWithdrawal(
    driverId: string,
    amount: number
  ): Promise<{ success: boolean; message: string }> {
    if (amount < this.MIN_WITHDRAWAL) {
      return {
        success: false,
        message: `Minimum withdrawal amount is ${this.MIN_WITHDRAWAL}`,
      };
    }
    try {
      await requestWithdrawal(driverId, amount, 'mobile_money');
      return {
        success: true,
        message: 'Withdrawal requested successfully',
      };
    } catch (error: any) {
      return {
        success: false,
        message: error?.message || 'Failed to process withdrawal',
      };
    }
  }
}

export const paymentService = PaymentService.getInstance();

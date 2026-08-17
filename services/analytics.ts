import firestore from '@react-native-firebase/firestore';

const ridesRef = firestore().collection('rides');
const COMMISSION_RATE = 0.15;

export type Period = 'day' | 'week' | 'month' | 'year';

export interface EarningsAnalytics {
  earnings_by_date: {
    date: string;
    total_amount: number;
    total_commission: number;
    total_rides: number;
    net_earnings: number;
  }[];
  summary: {
    total_earnings: number;
    total_commission: number;
    total_rides: number;
    avg_earning_per_ride: number;
    period: Period;
  };
}

export interface DemandAnalytics {
  demand_zones: {
    latitude: number;
    longitude: number;
    demand_level: number;
    booking_count: number;
  }[];
  hourly_demand: {
    hour: number;
    booking_count: number;
  }[];
  period: Period;
}

const getPeriodStartDate = (period: Period): Date => {
  const now = new Date();
  switch (period) {
    case 'day':
      return new Date(now.getFullYear(), now.getMonth(), now.getDate());
    case 'week':
      return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    case 'month':
      return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    case 'year':
      return new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
  }
};

class AnalyticsService {
  private static instance: AnalyticsService;

  private constructor() {}

  public static getInstance(): AnalyticsService {
    if (!AnalyticsService.instance) {
      AnalyticsService.instance = new AnalyticsService();
    }
    return AnalyticsService.instance;
  }

  public async getEarningsAnalytics(
    period: Period = 'week',
    driverId?: string
  ): Promise<EarningsAnalytics> {
    const startDate = getPeriodStartDate(period);

    let query = ridesRef
      .where('status', '==', 'completed')
      .where('completedAt', '>=', startDate);

    if (driverId) {
      query = query.where('driverId', '==', driverId);
    }

    const snapshot = await query.get();

    const byDate = new Map<string, { total_amount: number; total_rides: number }>();

    snapshot.forEach((doc) => {
      const data = doc.data();
      const completedAt = data.completedAt?.toDate?.() || new Date();
      const dateKey = completedAt.toISOString().split('T')[0];
      const fare = data.fare || 0;

      const existing = byDate.get(dateKey) || { total_amount: 0, total_rides: 0 };
      existing.total_amount += fare;
      existing.total_rides += 1;
      byDate.set(dateKey, existing);
    });

    const earnings_by_date = Array.from(byDate.entries())
      .map(([date, { total_amount, total_rides }]) => {
        const total_commission = total_amount * COMMISSION_RATE;
        return {
          date,
          total_amount,
          total_commission,
          total_rides,
          net_earnings: total_amount - total_commission,
        };
      })
      .sort((a, b) => a.date.localeCompare(b.date));

    const total_earnings = earnings_by_date.reduce((sum, d) => sum + d.net_earnings, 0);
    const total_commission = earnings_by_date.reduce((sum, d) => sum + d.total_commission, 0);
    const total_rides = earnings_by_date.reduce((sum, d) => sum + d.total_rides, 0);

    return {
      earnings_by_date,
      summary: {
        total_earnings,
        total_commission,
        total_rides,
        avg_earning_per_ride: total_rides > 0 ? total_earnings / total_rides : 0,
        period,
      },
    };
  }

  public async getDemandAnalytics(period: Period = 'day'): Promise<DemandAnalytics> {
    const startDate = getPeriodStartDate(period);

    const snapshot = await ridesRef.where('createdAt', '>=', startDate).get();

    const zoneMap = new Map<string, { latitude: number; longitude: number; count: number }>();
    const hourMap = new Map<number, number>();

    snapshot.forEach((doc) => {
      const data = doc.data();
      const pickup = data.pickup;
      const createdAt = data.createdAt?.toDate?.() || new Date();

      if (pickup?.latitude !== undefined && pickup?.longitude !== undefined) {
        const zoneKey = pickup.latitude.toFixed(2) + ',' + pickup.longitude.toFixed(2);
        const existing = zoneMap.get(zoneKey) || {
          latitude: pickup.latitude,
          longitude: pickup.longitude,
          count: 0,
        };
        existing.count += 1;
        zoneMap.set(zoneKey, existing);
      }

      const hour = createdAt.getHours();
      hourMap.set(hour, (hourMap.get(hour) || 0) + 1);
    });

    const maxCount = Math.max(1, ...Array.from(zoneMap.values()).map((z) => z.count));

    const demand_zones = Array.from(zoneMap.values()).map((zone) => ({
      latitude: zone.latitude,
      longitude: zone.longitude,
      demand_level: zone.count / maxCount,
      booking_count: zone.count,
    }));

    const hourly_demand = Array.from({ length: 24 }, (_, hour) => ({
      hour,
      booking_count: hourMap.get(hour) || 0,
    }));

    return { demand_zones, hourly_demand, period };
  }

  public getEarningsTrend(data: EarningsAnalytics['earnings_by_date']) {
    return data.map((day) => ({
      date: new Date(day.date).toLocaleDateString(),
      earnings: day.net_earnings,
      rides: day.total_rides,
    }));
  }

  public getHourlyDemandData(data: DemandAnalytics['hourly_demand']) {
    return data.map((hour) => ({
      hour: hour.hour + ':00',
      bookings: hour.booking_count,
    }));
  }

  public getDemandHeatmapData(data: DemandAnalytics['demand_zones']) {
    return data.map((zone) => ({
      lat: zone.latitude,
      lng: zone.longitude,
      weight: zone.demand_level,
    }));
  }
}

export const analyticsService = AnalyticsService.getInstance();

import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { LineChart } from 'react-native-chart-kit';
import { useWindowDimensions } from 'react-native';
import {
  analyticsService,
  EarningsAnalytics,
  Period,
} from '@/services/analytics';
import { useAuth } from '@/hooks/AuthContext';
import Colors from '@/constants/Colors';
import Layout from '@/constants/Layout';
import Button from '@/components/UI/Button';
import { formatCurrency } from '@/utils/currency';

export default function EarningsDashboard() {
  const { width } = useWindowDimensions();
  const { user } = useAuth();
  const [period, setPeriod] = useState<Period>('week');
  const [analytics, setAnalytics] = useState<EarningsAnalytics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAnalytics();
  }, [period]);

  const loadAnalytics = async () => {
    try {
      setLoading(true);
      const data = await analyticsService.getEarningsAnalytics(
        period,
        user?.id
      );
      setAnalytics(data);
    } catch (error) {
      console.error('Error loading analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!analytics || loading) {
    return (
      <View style={styles.container}>
        <Text>Loading...</Text>
      </View>
    );
  }

  const chartData = {
    labels: analyticsService
      .getEarningsTrend(analytics.earnings_by_date)
      .map((d) => d.date),
    datasets: [
      {
        data: analyticsService
          .getEarningsTrend(analytics.earnings_by_date)
          .map((d) => d.earnings),
        color: () => Colors.primary.default,
        strokeWidth: 2,
      },
    ],
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Earnings Dashboard</Text>
        <View style={styles.periodSelector}>
          <Button
            title="Week"
            variant={period === 'week' ? 'solid' : 'outline'}
            onPress={() => setPeriod('week')}
            style={styles.periodButton}
          />
          <Button
            title="Month"
            variant={period === 'month' ? 'solid' : 'outline'}
            onPress={() => setPeriod('month')}
            style={styles.periodButton}
          />
          <Button
            title="Year"
            variant={period === 'year' ? 'solid' : 'outline'}
            onPress={() => setPeriod('year')}
            style={styles.periodButton}
          />
        </View>
      </View>

      <View style={styles.summaryContainer}>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryLabel}>Total Earnings</Text>
          <Text style={styles.summaryValue}>
            {formatCurrency(analytics.summary.total_earnings)}
          </Text>
        </View>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryLabel}>Total Rides</Text>
          <Text style={styles.summaryValue}>
            {analytics.summary.total_rides}
          </Text>
        </View>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryLabel}>Avg. per Ride</Text>
          <Text style={styles.summaryValue}>
            {formatCurrency(analytics.summary.avg_earning_per_ride)}
          </Text>
        </View>
      </View>

      <View style={styles.chartContainer}>
        <Text style={styles.chartTitle}>Earnings Trend</Text>
        <LineChart
          data={chartData}
          width={width - 32}
          height={220}
          chartConfig={{
            backgroundColor: Colors.neutral.white,
            backgroundGradientFrom: Colors.neutral.white,
            backgroundGradientTo: Colors.neutral.white,
            decimalPlaces: 0,
            color: () => Colors.primary.default,
            labelColor: () => Colors.neutral.medium,
            style: {
              borderRadius: 16,
            },
            propsForDots: {
              r: '6',
              strokeWidth: '2',
              stroke: Colors.primary.default,
            },
          }}
          bezier
          style={styles.chart}
        />
      </View>

      <View style={styles.detailsContainer}>
        <Text style={styles.sectionTitle}>Recent Earnings</Text>
        {analytics.earnings_by_date.map((day) => (
          <View key={day.date} style={styles.dayRow}>
            <View>
              <Text style={styles.dayDate}>
                {new Date(day.date).toLocaleDateString()}
              </Text>
              <Text style={styles.dayRides}>{day.total_rides} rides</Text>
            </View>
            <View>
              <Text style={styles.dayEarnings}>
                {formatCurrency(day.net_earnings)}
              </Text>
              <Text style={styles.dayCommission}>
                Commission: {formatCurrency(day.total_commission)}
              </Text>
            </View>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.neutral.white,
  },
  header: {
    padding: Layout.spacing.l,
    borderBottomWidth: 1,
    borderBottomColor: Colors.neutral.light,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.neutral.black,
    marginBottom: Layout.spacing.m,
  },
  periodSelector: {
    flexDirection: 'row',
    gap: Layout.spacing.s,
  },
  periodButton: {
    flex: 1,
  },
  summaryContainer: {
    flexDirection: 'row',
    padding: Layout.spacing.l,
    gap: Layout.spacing.m,
  },
  summaryCard: {
    flex: 1,
    backgroundColor: Colors.primary.light,
    padding: Layout.spacing.m,
    borderRadius: Layout.borderRadius.m,
    alignItems: 'center',
  },
  summaryLabel: {
    fontSize: 12,
    color: Colors.primary.dark,
    marginBottom: Layout.spacing.xs,
  },
  summaryValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.primary.default,
  },
  chartContainer: {
    padding: Layout.spacing.l,
  },
  chartTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.neutral.black,
    marginBottom: Layout.spacing.m,
  },
  chart: {
    marginVertical: Layout.spacing.m,
    borderRadius: Layout.borderRadius.m,
  },
  detailsContainer: {
    padding: Layout.spacing.l,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.neutral.black,
    marginBottom: Layout.spacing.m,
  },
  dayRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Layout.spacing.m,
    borderBottomWidth: 1,
    borderBottomColor: Colors.neutral.light,
  },
  dayDate: {
    fontSize: 16,
    color: Colors.neutral.black,
    marginBottom: Layout.spacing.xs,
  },
  dayRides: {
    fontSize: 14,
    color: Colors.neutral.medium,
  },
  dayEarnings: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.neutral.black,
    textAlign: 'right',
    marginBottom: Layout.spacing.xs,
  },
  dayCommission: {
    fontSize: 14,
    color: Colors.neutral.medium,
    textAlign: 'right',
  },
});

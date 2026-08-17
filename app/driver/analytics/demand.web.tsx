import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { BarChart } from 'react-native-chart-kit';
import { useWindowDimensions } from 'react-native';
// MapView and Heatmap are removed for web
import {
  analyticsService,
  type DemandAnalytics,
  Period,
} from '@/services/analytics';
import Colors from '@/constants/Colors';
import Layout from '@/constants/Layout';
import Button from '@/components/UI/Button';
import { DEFAULT_LOCATION } from '@/config';

export default function DemandAnalytics() {
  const { width } = useWindowDimensions();
  const [period, setPeriod] = useState<Period>('day');
  const [analytics, setAnalytics] = useState<DemandAnalytics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAnalytics();
  }, [period]);

  const loadAnalytics = async () => {
    try {
      setLoading(true);
      const data = await analyticsService.getDemandAnalytics(period);
      setAnalytics(data);
    } catch (error) {
      console.error('Error loading demand analytics:', error);
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

  const hourlyData = {
    labels: analyticsService
      .getHourlyDemandData(analytics.hourly_demand)
      .map((h) => h.hour),
    datasets: [
      {
        data: analyticsService
          .getHourlyDemandData(analytics.hourly_demand)
          .map((h) => h.bookings),
      },
    ],
  };

  // heatmapData is not used on web

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Demand Analytics</Text>
        <View style={styles.periodSelector}>
          <Button
            title="Today"
            variant={period === 'day' ? 'solid' : 'outline'}
            onPress={() => setPeriod('day')}
            style={styles.periodButton}
          />
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
        </View>
      </View>

      <View style={styles.mapContainer}>
        <Text style={styles.sectionTitle}>Demand Heatmap</Text>
        <View style={[styles.map, styles.webMapPlaceholder]}>
          <Text>Heatmap is not available on the web.</Text>
        </View>
      </View>

      <View style={styles.chartContainer}>
        <Text style={styles.sectionTitle}>Hourly Demand</Text>
        <BarChart
          data={hourlyData}
          width={width - 32}
          height={220}
          yAxisLabel=""
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
            barPercentage: 0.7,
          }}
          style={styles.chart}
          showValuesOnTopOfBars
        />
      </View>

      <View style={styles.hotspotContainer}>
        <Text style={styles.sectionTitle}>Popular Pickup Points</Text>
        {analytics.demand_zones
          .sort((a, b) => b.booking_count - a.booking_count)
          .slice(0, 5)
          .map((zone, index) => (
            <View key={index} style={styles.hotspotRow}>
              <View style={styles.hotspotInfo}>
                <Text style={styles.hotspotRank}>#{index + 1}</Text>
                <View>
                  <Text style={styles.hotspotLocation}>
                    {`${zone.latitude.toFixed(4)}, ${zone.longitude.toFixed(
                      4
                    )}`}
                  </Text>
                  <Text style={styles.hotspotDemand}>
                    Demand Level: {zone.demand_level}
                  </Text>
                </View>
              </View>
              <Text style={styles.hotspotBookings}>
                {zone.booking_count} bookings
              </Text>
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
  mapContainer: {
    padding: Layout.spacing.l,
  },
  map: {
    height: 300,
    borderRadius: Layout.borderRadius.m,
    marginTop: Layout.spacing.m,
  },
  webMapPlaceholder: {
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  chartContainer: {
    padding: Layout.spacing.l,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.neutral.black,
    marginBottom: Layout.spacing.m,
  },
  chart: {
    marginVertical: Layout.spacing.m,
    borderRadius: Layout.borderRadius.m,
  },
  hotspotContainer: {
    padding: Layout.spacing.l,
  },
  hotspotRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Layout.spacing.m,
    borderBottomWidth: 1,
    borderBottomColor: Colors.neutral.light,
  },
  hotspotInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  hotspotRank: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.primary.default,
    marginRight: Layout.spacing.m,
  },
  hotspotLocation: {
    fontSize: 16,
    color: Colors.neutral.black,
    marginBottom: Layout.spacing.xs,
  },
  hotspotDemand: {
    fontSize: 14,
    color: Colors.neutral.medium,
  },
  hotspotBookings: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.primary.default,
  },
});

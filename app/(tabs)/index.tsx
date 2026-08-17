import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ScrollView,
  SafeAreaView,
} from 'react-native';
import { router } from 'expo-router';
import { Bike } from 'lucide-react-native';
import Colors from '@/constants/Colors';
import Layout from '@/constants/Layout';
import WalletCard from '@/components/Home/WalletCard';
import TripHistoryList from '@/components/Home/TripHistoryList';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useContext } from 'react';
import AuthContext from '@/app/Auth/context';

export default function HomeScreen() {
  const { user } = useContext(AuthContext);
  const navigateToProfile = () => {
    router.push('/profile');
  };
  const insets = useSafeAreaInsets();

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Colors.primary.default }}>
      <View style={styles.container}>
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={{ paddingBottom: insets.bottom + 80 }}
        >
          <View style={styles.headerRow}>
            <View>
              <Text style={styles.greeting}>Welcome back,</Text>
              <Text style={styles.username}>{user?.name}</Text>
            </View>
            <TouchableOpacity
              onPress={navigateToProfile}
              style={styles.avatarWrap}
            >
              <Image
                source={{
                  uri: 'https://images.pexels.com/photos/1933873/pexels-photo-1933873.jpeg?auto=compress&cs=tinysrgb&w=100',
                }}
                style={styles.avatar}
              />
            </TouchableOpacity>
          </View>

          <WalletCard />

          <Text style={styles.sectionTitle}>All transport</Text>

          <TouchableOpacity style={styles.transportCard} activeOpacity={0.85}>
            <View style={styles.transportIconContainer}>
              <Bike size={32} color={Colors.primary.default} />
            </View>
            <View>
              <Text style={styles.transportTitle}>Motorbike Hailing</Text>
            </View>
          </TouchableOpacity>

          <Text style={styles.sectionTitle}>Trip History</Text>
          <TripHistoryList />
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.primary.default,
  },
  scrollView: {
    flex: 1,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Layout.spacing.l,
    paddingTop: Layout.spacing.xl + 20,
    marginBottom: 8,
  },
  greeting: {
    color: Colors.secondary.default,
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 2,
  },
  username: {
    color: Colors.secondary.default,
    fontSize: 22,
    fontWeight: '700',
  },
  avatarWrap: {
    borderWidth: 2,
    borderColor: Colors.primary.default,
    borderRadius: 24,
    padding: 2,
    backgroundColor: Colors.secondary.default,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.secondary.default,
    marginHorizontal: Layout.spacing.l,
    marginTop: Layout.spacing.l,
    marginBottom: Layout.spacing.m,
  },
  transportCard: {
    backgroundColor: Colors.secondary.default,
    marginHorizontal: Layout.spacing.l,
    borderRadius: Layout.borderRadius.l,
    padding: Layout.spacing.l,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  transportIconContainer: {
    backgroundColor: Colors.secondary.light,
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Layout.spacing.m,
  },
  transportTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.neutral.white,
  },
  transportDesc: {
    color: Colors.neutral.light,
    fontSize: 13,
    marginTop: 2,
  },
});

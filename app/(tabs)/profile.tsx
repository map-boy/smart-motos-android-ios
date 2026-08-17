import React, { useContext, useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  ScrollView,
  Modal,
  TextInput,
  Pressable,
  SafeAreaView,
} from 'react-native';
import Colors from '@/constants/Colors';
import Layout from '@/constants/Layout';
import {
  LogOut,
  Lock,
  User,
  Users,
  CreditCard,
  HelpCircle,
  ChevronRight,
  Edit,
  Check,
  Minus,
  Instagram,
  Facebook,
  MessageCircle,
  MoreHorizontal,
  MessageSquareText,
} from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '@/hooks/AuthContext';

const USER = {
  name: 'Gisele A.',
  email: 'gisele@gmail.com',
  avatar: 'https://randomuser.me/api/portraits/women/44.jpg',
  wallet: 24000,
  currency: 'Rwf',
  currencyCode: 'NGN',
};

const SETTINGS = [
  { label: 'Account settings', icon: User },
  { label: 'Refer a friend', icon: Users },
  { label: 'Card and bank settings', icon: CreditCard },
  { label: 'Customer support', icon: HelpCircle },
];

export default function ProfileScreen() {
  const { user, signOut } = useAuth();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [showTopUp, setShowTopUp] = useState(false);
  const [showAddCard, setShowAddCard] = useState(false);
  const [showRefer, setShowRefer] = useState(false);
  const [showManageCards, setShowManageCards] = useState(false);
  const [topupAmount, setTopupAmount] = useState('');
  const [selectedCard, setSelectedCard] = useState('existing');

  // Add Card form state
  const [cardNumber, setCardNumber] = useState('');
  const [accountName, setAccountName] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvv, setCvv] = useState('');

  // Mock cards
  const [cards, setCards] = useState([
    {
      number: '**** **** **** 657',
      label: 'MASTERCARD MAR/2020',
    },
  ]);

  // Add useEffect to redirect if no user
  useEffect(() => {
    if (!user) {
      router.replace('/Auth/Login');
    }
  }, [user]);

  // If no user, don't render the profile content
  if (!user) {
    return null;
  }

  const handleSignOut = () => {
    signOut();
    router.replace('/Auth/Login');
  };

  // Remove card handler
  const removeCard = (idx: number) => {
    setCards(cards.filter((_, i) => i !== idx));
  };

  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: Colors.secondary.default }}
    >
      <View style={styles.container}>
        {/* Curved yellow header */}
        <View style={styles.headerBg}>
          <View style={styles.walletRow}>
            <View style={styles.walletInfo}>
              <Text style={styles.walletLabel}>Wallet Balance</Text>
              <View style={styles.walletAmountRow}>
                <View style={styles.currencyTag}>
                  <Text style={styles.currencyText}>{USER.currencyCode}</Text>
                </View>
                <Text style={styles.walletAmount}>
                  {USER.wallet}
                  {USER.currency}
                </Text>
              </View>
            </View>
            <View style={styles.walletButtons}>
              <TouchableOpacity
                style={styles.topUpBtn}
                onPress={() => setShowTopUp(true)}
              >
                <Text style={styles.topUpText}>Top up +</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.dedicatedBtn}>
                <Text style={styles.dedicatedText}>Dedicated</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
        {/* Avatar and edit */}
        <View style={styles.avatarWrap}>
          <Image source={{ uri: USER.avatar }} style={styles.avatar} />
          <TouchableOpacity style={styles.editBtn}>
            <Edit color={Colors.secondary.default} size={20} />
          </TouchableOpacity>
        </View>
        {/* Name and email */}
        <Text style={styles.name}>{user?.name || 'User'}</Text>
        <Text style={styles.email}>{user?.email || ''}</Text>
        {/* Settings list */}
        <ScrollView
          style={styles.settingsList}
          contentContainerStyle={{ paddingBottom: 32 + insets.bottom + 80 }}
          showsVerticalScrollIndicator={false}
        >
          {SETTINGS.map((item, idx: number) => (
            <View key={item.label}>
              <TouchableOpacity
                style={styles.settingsRow}
                onPress={() => {
                  if (idx === 0) router.push('/Account/details');
                  if (idx === 1) setShowRefer(true);
                  if (idx === 2) setShowManageCards(true);
                  if (idx === 3) router.push('/Support');
                }}
              >
                <item.icon color={Colors.primary.default} size={22} />
                <Text style={styles.settingsLabel}>{item.label}</Text>
                <ChevronRight
                  color={Colors.primary.default}
                  size={22}
                  style={styles.chevron}
                />
              </TouchableOpacity>
              <View style={styles.divider} />
            </View>
          ))}
          {/* Sign out */}
          <TouchableOpacity style={styles.signOutRow} onPress={handleSignOut}>
            <LogOut color={Colors.primary.default} size={22} />
            <Text style={styles.signOutText}>Sign out</Text>
          </TouchableOpacity>
        </ScrollView>

        {/* Top Up Modal */}
        <Modal visible={showTopUp} animationType="slide" transparent>
          <View style={styles.modalOverlay}>
            <View style={styles.modalSheet}>
              <Text style={styles.modalTitle}>Top up</Text>
              <Text style={styles.modalLabel}>Enter amount</Text>
              <TextInput
                style={styles.modalInput}
                value={topupAmount}
                onChangeText={setTopupAmount}
                placeholder=""
                keyboardType="numeric"
              />
              <TouchableOpacity
                style={[
                  styles.cardOption,
                  selectedCard === 'existing' && styles.cardOptionSelected,
                ]}
                onPress={() => setSelectedCard('existing')}
              >
                <Text style={styles.cardOptionText}>
                  Use bank card ***** **** **** 657
                </Text>
                {selectedCard === 'existing' && (
                  <Check color={Colors.primary.default} size={22} />
                )}
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.cardOption,
                  selectedCard === 'new' && styles.cardOptionSelected,
                ]}
                onPress={() => setSelectedCard('new')}
              >
                <Text style={styles.cardOptionText}>Use a new card</Text>
                {selectedCard === 'new' && (
                  <Check color={Colors.primary.default} size={22} />
                )}
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalProceedBtn}
                onPress={() =>
                  selectedCard === 'new'
                    ? (setShowTopUp(false), setShowAddCard(true))
                    : setShowTopUp(false)
                }
              >
                <Text style={styles.modalProceedText}>Proceed</Text>
              </TouchableOpacity>
              <Pressable
                style={styles.modalCancelBtn}
                onPress={() => setShowTopUp(false)}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </Pressable>
            </View>
          </View>
        </Modal>

        {/* Manage Debit Cards Modal */}
        <Modal visible={showManageCards} animationType="slide" transparent>
          <View style={styles.modalOverlay}>
            <View style={styles.modalSheet}>
              <Text style={styles.modalTitle}>Manage debit cards</Text>
              {cards.map((card, idx) => (
                <View key={idx} style={styles.manageCardBox}>
                  <View>
                    <Text style={styles.manageCardNumber}>{card.number}</Text>
                    <Text style={styles.manageCardLabel}>{card.label}</Text>
                  </View>
                  <TouchableOpacity onPress={() => removeCard(idx)}>
                    <Minus color={Colors.secondary.default} size={28} />
                  </TouchableOpacity>
                </View>
              ))}
              {/* Dots for pagination, static for now */}
              <View style={styles.manageDotsRow}>
                <View style={styles.manageDotActive} />
                <View style={styles.manageDot} />
                <View style={styles.manageDot} />
              </View>
              <TouchableOpacity
                style={styles.modalProceedBtn}
                onPress={() => {
                  setShowManageCards(false);
                  setShowAddCard(true);
                }}
              >
                <Text style={styles.modalProceedText}>Add new card</Text>
              </TouchableOpacity>
              <Pressable
                style={styles.modalCancelBtn}
                onPress={() => setShowManageCards(false)}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </Pressable>
            </View>
          </View>
        </Modal>

        {/* Add Card Modal (editable) */}
        <Modal visible={showAddCard} animationType="slide" transparent>
          <View style={styles.modalOverlay}>
            <View style={styles.modalSheet}>
              <Text style={styles.modalTitle}>Add card details</Text>
              <Text style={styles.modalLabel}>Card number</Text>
              <TextInput
                style={styles.modalInput}
                value={cardNumber}
                onChangeText={setCardNumber}
                placeholder="**** **** **** ****"
                placeholderTextColor={Colors.neutral.light}
                keyboardType="numeric"
              />
              <Text style={styles.modalLabel}>Account name</Text>
              <TextInput
                style={styles.modalInput}
                value={accountName}
                onChangeText={setAccountName}
                placeholder="Account name"
                placeholderTextColor={Colors.neutral.light}
              />
              <View style={{ flexDirection: 'row', gap: 12 }}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.modalLabel}>Expiry</Text>
                  <TextInput
                    style={styles.modalInput}
                    value={expiry}
                    onChangeText={setExpiry}
                    placeholder="MM/YY"
                    placeholderTextColor={Colors.neutral.light}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.modalLabel}>CVV</Text>
                  <TextInput
                    style={styles.modalInput}
                    value={cvv}
                    onChangeText={setCvv}
                    placeholder="***"
                    placeholderTextColor={Colors.neutral.light}
                    secureTextEntry
                  />
                </View>
              </View>
              <TouchableOpacity
                style={styles.modalProceedBtn}
                onPress={() => setShowAddCard(false)}
              >
                <Text style={styles.modalProceedText}>Save</Text>
              </TouchableOpacity>
              <Pressable
                style={styles.modalCancelBtn}
                onPress={() => setShowAddCard(false)}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </Pressable>
            </View>
          </View>
        </Modal>

        {/* Refer a Friend Modal */}
        <Modal visible={showRefer} animationType="slide" transparent>
          <View style={styles.modalOverlay}>
            <View style={styles.referSheet}>
              <Text style={styles.referTitle}>Refer a friend via</Text>
              <View style={styles.referOptionsRow}>
                <View style={styles.referOption}>
                  <Text style={styles.referIcon}>
                    <MessageSquareText />
                  </Text>
                  <Text style={styles.referLabel}>Whatsapp</Text>
                </View>
                <View style={styles.referOption}>
                  <Text style={styles.referIcon}>
                    <Facebook />
                  </Text>
                  <Text style={styles.referLabel}>Facebook</Text>
                </View>
                <View style={styles.referOption}>
                  <Text style={styles.referIcon}>
                    <MessageCircle />
                  </Text>
                  <Text style={styles.referLabel}>SMS</Text>
                </View>
                <View style={styles.referOption}>
                  <Text style={styles.referIcon}>
                    <MoreHorizontal />
                  </Text>
                  <Text style={styles.referLabel}>Others</Text>
                </View>
              </View>
              <Pressable
                style={styles.modalCancelBtn}
                onPress={() => setShowRefer(false)}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </Pressable>
            </View>
          </View>
        </Modal>
      </View>
    </SafeAreaView>
  );
}

const HEADER_HEIGHT = 180;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.secondary.default,
  },
  headerBg: {
    height: HEADER_HEIGHT,
    backgroundColor: Colors.primary.default,
    borderBottomLeftRadius: 60,
    borderBottomRightRadius: 60,
    paddingTop: 40,
    paddingHorizontal: Layout.spacing.xl,
    justifyContent: 'center',
  },
  walletRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  walletInfo: {
    flex: 1,
  },
  walletLabel: {
    color: Colors.secondary.default,
    fontWeight: '600',
    fontSize: 15,
    marginBottom: 4,
  },
  walletAmountRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  currencyTag: {
    backgroundColor: Colors.secondary.default,
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginRight: 8,
  },
  currencyText: {
    color: Colors.primary.default,
    fontWeight: '700',
    fontSize: 13,
  },
  walletAmount: {
    color: Colors.secondary.default,
    fontWeight: 'bold',
    fontSize: 24,
  },
  walletButtons: {
    alignItems: 'flex-end',
    gap: 8,
  },
  topUpBtn: {
    backgroundColor: Colors.secondary.default,
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 6,
    marginBottom: 8,
  },
  topUpText: {
    color: Colors.primary.default,
    fontWeight: '700',
    fontSize: 15,
  },
  dedicatedBtn: {
    backgroundColor: Colors.primary.light,
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 6,
  },
  dedicatedText: {
    color: Colors.secondary.default,
    fontWeight: '700',
    fontSize: 15,
    opacity: 0.7,
  },
  avatarWrap: {
    alignItems: 'center',
    marginTop: -60,
    marginBottom: 8,
  },
  avatar: {
    width: 110,
    height: 110,
    borderRadius: 55,
    borderWidth: 4,
    borderColor: Colors.neutral.white,
  },
  editBtn: {
    position: 'absolute',
    right: '32%',
    bottom: 0,
    backgroundColor: Colors.primary.default,
    borderRadius: 20,
    padding: 6,
    borderWidth: 2,
    borderColor: Colors.neutral.white,
  },
  name: {
    color: Colors.neutral.white,
    fontWeight: '700',
    fontSize: 22,
    textAlign: 'center',
    marginTop: 4,
  },
  email: {
    color: Colors.neutral.white,
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 16,
    opacity: 0.8,
  },
  settingsList: {
    flex: 1,
    marginTop: 8,
    paddingHorizontal: Layout.spacing.xl,
  },
  settingsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 18,
  },
  settingsLabel: {
    color: Colors.neutral.white,
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
    marginLeft: 16,
  },
  chevron: {
    marginLeft: 8,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.primary.default,
    opacity: 0.7,
  },
  signOutRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 32,
    gap: 8,
  },
  signOutText: {
    color: Colors.primary.default,
    fontWeight: '700',
    fontSize: 17,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: Colors.neutral.white,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    padding: 24,
    paddingBottom: 40,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: Colors.secondary.default,
    marginBottom: 18,
  },
  modalLabel: {
    color: Colors.secondary.default,
    fontSize: 15,
    fontWeight: '500',
    marginTop: 12,
    marginBottom: 6,
  },
  modalInput: {
    backgroundColor: Colors.neutral.light,
    borderRadius: 6,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    color: Colors.secondary.default,
    fontWeight: '500',
    marginBottom: 4,
  },
  modalInputDisabled: {
    backgroundColor: Colors.neutral.light,
    borderRadius: 6,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    color: Colors.secondary.default,
    fontWeight: '500',
    marginBottom: 4,
  },
  cardOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.neutral.white,
    borderWidth: 1,
    borderColor: Colors.neutral.light,
    borderRadius: 8,
    padding: 14,
    marginTop: 16,
  },
  cardOptionSelected: {
    borderColor: Colors.primary.default,
    backgroundColor: '#FFFBEA',
  },
  cardOptionText: {
    color: Colors.secondary.default,
    fontSize: 15,
    fontWeight: '600',
  },
  modalProceedBtn: {
    backgroundColor: Colors.primary.default,
    borderRadius: 8,
    marginTop: 28,
    paddingVertical: 14,
    alignItems: 'center',
  },
  modalProceedText: {
    color: Colors.secondary.default,
    fontWeight: '700',
    fontSize: 18,
  },
  modalCancelBtn: {
    borderWidth: 1,
    borderColor: Colors.primary.default,
    borderRadius: 8,
    marginTop: 16,
    paddingVertical: 14,
    alignItems: 'center',
    backgroundColor: Colors.neutral.white,
  },
  modalCancelText: {
    color: Colors.secondary.default,
    fontWeight: '700',
    fontSize: 18,
    marginTop: 12,
    marginBottom: 12,
    marginHorizontal: 12,
    textAlign: 'center',
  },
  referSheet: {
    backgroundColor: Colors.neutral.white,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    padding: 24,
    paddingBottom: 32,
    alignItems: 'center',
  },
  referTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.secondary.default,
    marginBottom: 24,
  },
  referOptionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 24,
  },
  referOption: {
    alignItems: 'center',
    flex: 1,
  },
  referIcon: {
    fontSize: 32,
    marginBottom: 6,
  },
  referLabel: {
    color: Colors.secondary.default,
    fontWeight: '600',
    fontSize: 14,
  },
  manageCardBox: {
    backgroundColor: Colors.primary.default,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    marginTop: 18,
    marginBottom: 18,
  },
  manageCardNumber: {
    color: Colors.neutral.white,
    fontWeight: '700',
    fontSize: 18,
    marginBottom: 4,
  },
  manageCardLabel: {
    color: Colors.neutral.white,
    fontSize: 13,
    fontWeight: '500',
  },
  manageDotsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 18,
  },
  manageDot: {
    width: 16,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.neutral.light,
    marginHorizontal: 2,
  },
  manageDotActive: {
    width: 16,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.primary.default,
    marginHorizontal: 2,
  },
});

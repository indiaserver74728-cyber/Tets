declare global {
  interface Window {
    lucide?: {
      createIcons: () => void;
    };
  }
}

export type AdminView = 
    'dashboard' 
  | 'notifications' 
  | 'user_notifications' 
  | 'categories' 
  | 'tournaments' 
  | 'results' 
  | 'withdrawals' 
  | 'transactions' 
  | 'users' 
  | 'settings' 
  | 'promo_codes'
  | 'promotions'
  | 'advertising'
  | 'leaderboard_control'
  | 'user_history'
  | 'referrals'
  | 'profile_mng'
  | 'withdrawal_settings'
  | 'wallet_control'
  | 'image_settings'
  | 'staff'
  | 'text_content';

export interface StaffPermissions {
    dashboard?: boolean;
    notifications?: boolean;
    user_notifications?: boolean;
    categories?: boolean;
    tournaments?: boolean;
    results?: boolean;
    withdrawals?: boolean;
    transactions?: boolean;
    users?: boolean;
    settings?: boolean;
    promo_codes?: boolean;
    promotions?: boolean;
    advertising?: boolean;
    leaderboard_control?: boolean;
    user_history?: boolean;
    referrals?: boolean;
    profile_mng?: boolean;
    withdrawal_settings?: boolean;
    wallet_control?: boolean;
    image_settings?: boolean;
    staff?: boolean;
    text_content?: boolean;
}

export interface Notification {
  id: number;
  icon: string;
  title: string;
  message: string;
  time: string;
  read: boolean;
  iconColor: string;
  matchId?: number;
  firestoreId?: string;
}

export enum View {
  Home = 'HOME',
  Wallet = 'WALLET',
  Leaderboard = 'LEADERBOARD',
  Refer = 'REFER',
  Profile = 'PROFILE',
}

export type ToastType = 'success' | 'error' | 'info';

export interface ToastMessage {
  id: number;
  type: ToastType;
  message: string;
}

export interface Transaction {
  id: number;
  type: 'Deposit' | 'Withdrawal' | 'Conversion' | 'Entry Fee' | 'Share' | 'Winnings' | 'Admin Adjustment' | 'Promo Code' | 'Referral Bonus';
  amount: number;
  date: string;
  status: 'Completed' | 'Pending' | 'Failed' | 'Rejected';
  reason?: string;
  matchId?: number;
  withdrawalDetails?: {
    method: string;
    accNum: string;
    accName: string;
  };
}

export interface JoinedMatchInfo {
  matchId: number;
  ign: string;
  uid: string;
  whatsapp: string;
  slotNumber: number;
  joinTimestamp: string;
}

export interface PromoCodeClaim {
    email: string;
    name: string;
    avatar: string;
    phone: string;
    timestamp: string;
}

export interface PromoCode {
    id: number;
    code: string;
    amount: number;
    expiryDate: string;
    maxUses: number;
    maxUsesPerUser: number;
    uses: number;
    depositType: 'Deposit' | 'Winnings';
    createdBy: string;
    claimedBy: PromoCodeClaim[];
}

export interface User {
  name: string;
  email: string;
  phone: string;
  avatar: string;
  password?: string; // Mock
  role: 'user' | 'admin' | 'staff';
  status: 'Active' | 'Banned';
  banReason?: string;
  banImageUrl?: string;
  deposit: number;
  winnings: number;
  totalWinnings: number; // For historical tracking
  kills: number;
  matches: number;
  referralCode: string;
  referredBy?: string;
  creationDate: string;
  referralRewardClaimed?: boolean;
  transactions: Transaction[];
  joinedMatchDetails: JoinedMatchInfo[];
  notifications: Notification[];
  permissions?: StaffPermissions;
}

export interface Category {
  id: number;
  name: string;
  imageUrl: string;
  position?: number;
}

export interface MatchResult {
  rank: number;
  email: string;
  name: string; // ign
  uid: string;
  kills: number;
  winning: number;
}

export interface Match {
  id: number;
  type: 'Upcoming' | 'Ongoing' | 'Results';
  title?: string;
  category: string;
  prizePool: number;
  perKill: number;
  entryFee: number;
  map: string;
  mode: string;
  time: string;
  registeredPlayers: number;
  maxPlayers: number;
  filledSlots?: number[];
  status?: 'Live' | 'Starting Soon' | 'Ending Soon';
  roomId?: string;
  roomPassword?: string;
  winningsDistributed: boolean;
  imageUrl?: string;
  results?: MatchResult[];
  registrationClosed?: boolean;
  rules?: string[];
}

export interface Promotion {
  id: number;
  imageUrl: string;
  linkUrl?: string;
  title: string;
}

export interface InAppAd {
  id: number;
  imageUrl: string;
  linkUrl: string;
  width: number;
  height: number;
  enabled: boolean;
}

export interface AppSettings {
  appName: string;
  appLogoUrl: string;
  maintenanceMode: boolean;
  maintenanceMessage: string;
  globalAnnouncement: string;
  showGlobalAnnouncement: boolean;
  minWithdrawal: number;
  supportNumber: string;
  websiteUrl: string;
  whatsappChannelUrl: string;
  youtubeUrl: string;
  shareAppUrl: string;
  shareAppText: string;
  aboutUs: string;
  privacyPolicy: string;
  terms: string;
  faq: string;
  sliderSpeed: number;
  withdrawalInstructionText: string;
  sliderHeight: number;
  sliderWidth: number;
  sliderBorderRadius: number;
  sliderAnimation: 'fade' | 'slide';
  showDepositButton: boolean;
  showWithdrawButton: boolean;
  showShareButton: boolean;
  showConvertButton: boolean;
  shareLimit: number;
  upcomingFallbackUrl: string;
  upcomingFallbackWidth?: number;
  upcomingFallbackHeight?: number;
  ongoingFallbackUrl: string;
  ongoingFallbackWidth?: number;
  ongoingFallbackHeight?: number;
  resultsFallbackUrl: string;
  resultsFallbackWidth?: number;
  resultsFallbackHeight?: number;
  noTransactionsImageUrl: string;
  noTransactionsImageWidth?: number;
  noTransactionsImageHeight?: number;
  noReferralsImageUrl: string;
  noReferralsImageWidth?: number;
  noReferralsImageHeight?: number;
  leaderboardMaintenanceMode: boolean;
  leaderboardMaintenanceMessage: string;
  leaderboardMaintenanceImageUrl: string;
  leaderboardMaintenanceImageWidth?: number;
  leaderboardMaintenanceImageHeight?: number;
  welcomeBannerLines: string[];
  welcomeNotificationTitle: string;
  welcomeNotificationMessage: string;
  showInAppAd: boolean;
  inAppAdAnimation: 'fade' | 'slide' | 'none';
  inAppAds: InAppAd[];
  maintenanceImageUrl: string;
  maintenanceImageWidth?: number;
  maintenanceImageHeight?: number;
  brandPrimaryColor: string;
  brandPinkColor: string;
  oneAccountPerDevice: boolean;
  showJoinedMatches: boolean;
  showWhatsAppButton: boolean;
  whatsAppButtonImageUrl?: string;
  defaultAvatarUrl: string;
  banScreenImageUrl: string;
  banScreenImageWidth?: number;
  banScreenImageHeight?: number;
  noInternetTitle: string;
  noInternetMessage: string;
  noInternetImageUrl: string;
  noInternetImageWidth?: number;
  noInternetImageHeight?: number;
  noInternetIcon: string;
}

export interface PaymentMethod {
  id: number;
  name: string;
  enabled: boolean;
  logoUrl: string;
  logoHeight?: number;
  logoWidth?: number;
}

export interface ReferralSettings {
  enabled: boolean;
  newUserReward: number;
  referrerReward: number;
  imageUrl: string;
  text: string;
  shareMessageTemplate: string;
}
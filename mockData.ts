import { User, Match, Notification, Transaction, Promotion, AppSettings, Category, PaymentMethod, ReferralSettings, JoinedMatchInfo, PromoCode } from './types';
import * as assets from './assets';

const now = new Date();
const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
const twoDaysAgo = new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000);

const joinedMatchDetails1: JoinedMatchInfo[] = [
    { matchId: 1, ign: 'Wa♠SAMI✿', uid: '123456', whatsapp: '+923000000001', slotNumber: 1, joinTimestamp: '2025-08-16T10:00:00Z'},
    { matchId: 3, ign: 'SAMI-SQUAD', uid: '123456', whatsapp: '+923000000001', slotNumber: 5, joinTimestamp: '2025-08-16T11:00:00Z'},
    { matchId: 4, ign: 'SAMI-1v1', uid: '123456', whatsapp: '+923000000001', slotNumber: 1, joinTimestamp: '2025-08-17T18:00:00Z'},
];

const joinedMatchDetails2: JoinedMatchInfo[] = [
    { matchId: 4, ign: 'PK SPEEDY !', uid: '654321', whatsapp: '+923000000004', slotNumber: 2, joinTimestamp: '2025-08-17T18:05:00Z'},
    { matchId: 2, ign: 'Moaz FF', uid: '654321', whatsapp: '+923000000004', slotNumber: 10, joinTimestamp: '2025-08-15T14:00:00Z'},
];

const defaultRules = [
    "Teaming is strictly prohibited.",
    "Emulators are not allowed.",
    "No hacks or third-party apps.",
    "Be in the room on time.",
    "Respect all players & staff.",
    "Organizer's decisions are final.",
];


export const initialUsers: User[] = [
    { name: 'Wa♠SAMI✿', email: 'sami@example.com', phone: '+923000000001', avatar: 'https://i.ibb.co/fD2gV2m/3Yv8e06.png', password: 'password123', role: 'user', status: 'Active', deposit: 150, winnings: 10198, totalWinnings: 10198, referralCode: 'SAMI123', kills: 125, matches: 30, creationDate: '2024-07-01T10:00:00Z', referralRewardClaimed: true, transactions: [
        { id: 4, type: 'Withdrawal', amount: -200, date: '2024-07-29', status: 'Pending' }
    ], joinedMatchDetails: joinedMatchDetails1, notifications: [] },
    { name: 'YouTube:OLD FZ FF', email: 'fzff@example.com', phone: '+923000000002', avatar: 'https://i.ibb.co/Qvj1R8k/b09e34j.png', password: 'password123', role: 'user', status: 'Active', deposit: 50, winnings: 6060, totalWinnings: 6060, referralCode: 'FZFF456', kills: 98, matches: 25, creationDate: '2024-07-02T11:00:00Z', referralRewardClaimed: false, transactions: [], joinedMatchDetails: [], notifications: [] },
    { name: '༄ᶦᶰᵈ᭄✿BURKI࿐', email: 'burki@example.com', phone: '+923000000003', avatar: 'https://i.ibb.co/bzgx0P3/uG12d2j.png', password: 'password123', role: 'user', status: 'Banned', deposit: 200, winnings: 4262, totalWinnings: 4262, referralCode: 'BURKI789', kills: 80, matches: 22, creationDate: '2024-07-03T12:00:00Z', referralRewardClaimed: false, transactions: [], joinedMatchDetails: [], notifications: [] },
    { name: 'Moaz Pasha', email: 'moaz@example.com', phone: '+923000000004', avatar: 'https://i.ibb.co/Lg9p8b7/Qh0GHYs.png', password: 'password123', role: 'user', status: 'Active', deposit: 75, winnings: 1869, totalWinnings: 1869, referralCode: 'MOAZ101', referredBy: 'SAMI123', kills: 40, matches: 18, creationDate: '2024-07-04T13:00:00Z', referralRewardClaimed: true, transactions: [
         { id: 5, type: 'Withdrawal', amount: -50, date: '2024-07-28', status: 'Pending' }
    ], joinedMatchDetails: joinedMatchDetails2, notifications: [] },
    { name: 'Roman Umar', email: 'roman@example.com', phone: '+923000000005', avatar: 'https://i.ibb.co/c8t5tYr/O6z3bLC.png', password: 'password123', role: 'user', status: 'Active', deposit: 120, winnings: 1587, totalWinnings: 1587, referralCode: 'ROMAN212', referredBy: 'FZFF456', kills: 35, matches: 0, creationDate: '2024-07-28T14:00:00Z', referralRewardClaimed: false, transactions: [], joinedMatchDetails: [], notifications: [] },
    { name: 'Staff Member', email: 'staff@warhub.com', phone: '+923111111111', avatar: assets.DEFAULT_AVATAR_IMG, password: 'password123', role: 'staff', status: 'Active', permissions: { dashboard: true, tournaments: true, users: false, settings: false, withdrawals: true, results: true }, deposit: 0, winnings: 0, totalWinnings: 0, referralCode: 'STAFF999', creationDate: '2024-07-01T00:00:00Z', kills: 0, matches: 0, transactions: [], joinedMatchDetails: [], notifications: [] },
    {
        name: "Owais",
        email: "owais@example.com",
        phone: "+923561629464",
        avatar: "https://i.ibb.co/c8t5tYr/O6z3bLC.png",
        password: "password123",
        role: 'user',
        status: 'Active',
        deposit: 20,
        winnings: 987,
        totalWinnings: 987,
        referralCode: 'OWAIS313',
        kills: 20,
        matches: 10,
        creationDate: '2024-07-05T15:00:00Z',
        referralRewardClaimed: false,
        transactions: [
            { id: 1, type: 'Deposit', amount: 50, date: '2024-07-28', status: 'Completed' },
            { id: 2, type: 'Entry Fee', amount: -10, date: '2024-07-28', status: 'Completed' },
            { id: 3, type: 'Withdrawal', amount: -20, date: '2024-07-27', status: 'Completed' },
        ],
        joinedMatchDetails: [],
        notifications: [],
    }
];


export const initialMatches: Match[] = [
    { id: 1, type: 'Upcoming', category: 'Battle Royale', prizePool: 50, perKill: 0, entryFee: 0, map: 'Bermuda', mode: 'Solo', title: 'SURVIVAL TOURNAMENT 🙂', time: '2025-12-04T20:00:00', registeredPlayers: 40, maxPlayers: 48, filledSlots: [...Array.from({ length: 38 }, (_, i) => i + 1), 42, 48], roomId: '12345678', roomPassword: 'war', winningsDistributed: false, rules: defaultRules },
    { id: 2, type: 'Upcoming', category: 'Battle Royale', prizePool: 100, perKill: 5, entryFee: 10, map: 'Kalahari', mode: 'Solo', title: 'KILLER KOMBAT', time: '2025-12-05T21:00:00', registeredPlayers: 24, maxPlayers: 48, filledSlots: Array.from({ length: 24 }, (_, i) => i + 1), roomId: '87654321', roomPassword: 'hub', winningsDistributed: false, rules: defaultRules },
    { id: 3, type: 'Ongoing', category: 'CS Ranked', prizePool: 200, perKill: 10, entryFee: 20, map: 'Purgatory', mode: 'Squad', title: 'WEEKLY WARZONE', time: 'Live Now', registeredPlayers: 48, maxPlayers: 48, filledSlots: Array.from({ length: 48 }, (_, i) => i + 1), status: 'Live', winningsDistributed: false, rules: defaultRules },
    { id: 4, type: 'Results', category: 'Lone Wolf', prizePool: 7, perKill: 2, entryFee: 23, map: 'Bermuda', mode: '1v1', title: '1v1 DUEL', time: '2025-08-17T18:31:00', registeredPlayers: 2, maxPlayers: 2, filledSlots: [1, 2], winningsDistributed: false, rules: defaultRules },
    { id: 5, type: 'Results', category: 'Lone Wolf', prizePool: 0, perKill: 15, entryFee: 25, map: 'Bermuda', mode: '2v2', title: '2v2 CLASH', time: '2025-08-19T19:00:00', registeredPlayers: 4, maxPlayers: 4, filledSlots: [1, 2, 3, 4], winningsDistributed: true, rules: defaultRules },
    { id: 6, type: 'Upcoming', category: 'Battle Royale', prizePool: 150, perKill: 8, entryFee: 15, map: 'Purgatory', mode: 'Duo', title: 'DUO THREAT', time: '2025-12-08T22:00:00', registeredPlayers: 12, maxPlayers: 24, filledSlots: Array.from({ length: 12 }, (_, i) => i + 1), roomId: '99887766', roomPassword: 'duo', winningsDistributed: false, rules: defaultRules },
];

export const adminUser: User = {
    name: "Admin",
    email: "admin@warhub.com",
    phone: "+1234567890",
    avatar: "https://i.ibb.co/3s8qN6b/k5s26N3.png",
    password: "password123",
    role: 'admin',
    status: 'Active',
    deposit: 9999,
    winnings: 9999,
    totalWinnings: 9999,
    referralCode: 'ADMIN',
    creationDate: '2024-07-01T00:00:00Z',
    kills: 0,
    matches: 0,
    transactions: [],
    joinedMatchDetails: [],
    notifications: [],
};

export const initialPromotions: Promotion[] = [
  { id: 1, imageUrl: assets.PROMO_SLIDER_1_IMG, title: 'Refer a Friend & Earn!' },
  { id: 2, imageUrl: assets.PROMO_SLIDER_2_IMG, title: 'Weekly Grand Tournament' },
  { id: 3, imageUrl: assets.PROMO_SLIDER_3_IMG, title: 'New Lone Wolf Mode' },
];

export const initialPromoCodes: PromoCode[] = [
    { id: 1, code: 'WELCOME10', amount: 10, expiryDate: '2025-12-31', maxUses: 1000, maxUsesPerUser: 1, uses: 0, depositType: 'Deposit', createdBy: 'Admin', claimedBy: []},
    { id: 2, code: 'BIGWIN50', amount: 50, expiryDate: '2025-08-31', maxUses: 100, maxUsesPerUser: 1, uses: 10, depositType: 'Deposit', createdBy: 'Admin', claimedBy: []},
    { id: 3, code: 'EXPIRED', amount: 5, expiryDate: '2023-01-01', maxUses: 10, maxUsesPerUser: 1, uses: 5, depositType: 'Deposit', createdBy: 'Admin', claimedBy: []},
];

export const initialAppSettings: AppSettings = {
  appName: 'WarHub',
  appLogoUrl: assets.LOGO_IMG,
  maintenanceMode: false,
  maintenanceMessage: 'We are currently undergoing scheduled maintenance. Please check back later.',
  globalAnnouncement: 'Welcome to WarHub! New tournaments added daily.',
  showGlobalAnnouncement: true,
  minWithdrawal: 100,
  supportNumber: '+923438721661',
  websiteUrl: 'https://google.com',
  whatsappChannelUrl: 'https://whatsapp.com/channel/0029VaAffUn5fM5iN25X2r1L',
  youtubeUrl: 'https://youtube.com',
  shareAppUrl: 'https://warhub.app',
  shareAppText: 'Join me on WarHub for exciting Free Fire tournaments!',
  aboutUs: 'WarHub is a premier platform for Free Fire enthusiasts to compete in daily tournaments and win exciting prizes. Our mission is to provide a fair, competitive, and enjoyable gaming experience for everyone.\n\nWe are a team of passionate gamers and developers dedicated to building the best competitive gaming community.',
  privacyPolicy: 'Your privacy is important to us.\nWe collect information such as your in-game name, UID, and contact details solely for the purpose of organizing tournaments and processing payments. We do not share your personal information with third parties without your consent.\nAll data is encrypted and stored on secure servers.',
  terms: '1. Eligibility\nYou must be 18 years or older to participate in paid tournaments.\n\n2. Fair Play\nAny form of cheating, hacking, or use of third-party software will result in an immediate and permanent ban from the platform. All winnings will be forfeited.\n\n3. Payments\nAll deposits and withdrawals are subject to processing fees. We are not responsible for any incorrect payment details provided by the user.',
  faq: 'Q: How do I join a match?\nA: Navigate to the home screen, select a game mode, and pick an upcoming match. If there are spots available and you have enough balance, you can click "Join Now".\n\nQ: How do I withdraw my winnings?\nA: Go to the Wallet screen and tap on the "Withdraw" button. Fill in your payment details and the amount you wish to withdraw. Please note that only your winnings balance is withdrawable.\n\nQ: Is it safe to add money?\nA: Yes, all transactions are handled securely. We work with trusted payment providers to ensure your data is safe.',
  sliderSpeed: 4000,
  withdrawalInstructionText: 'Processing can take up to 24 hours.',
  sliderHeight: 160,
  sliderWidth: 100,
  sliderBorderRadius: 12,
  sliderAnimation: 'fade',
  showDepositButton: true,
  showWithdrawButton: true,
  showShareButton: true,
  showConvertButton: true,
  shareLimit: 500,
  upcomingFallbackUrl: assets.NOT_FOUND_IMG,
  upcomingFallbackWidth: 160,
  upcomingFallbackHeight: 160,
  ongoingFallbackUrl: assets.NOT_FOUND_IMG,
  ongoingFallbackWidth: 160,
  ongoingFallbackHeight: 160,
  resultsFallbackUrl: assets.NOT_FOUND_IMG,
  resultsFallbackWidth: 160,
  resultsFallbackHeight: 160,
  noTransactionsImageUrl: assets.EMPTY_HISTORY_ILLUSTRATION,
  noTransactionsImageWidth: 160,
  noTransactionsImageHeight: 120,
  noReferralsImageUrl: assets.NOT_FOUND_IMG,
  noReferralsImageWidth: 160,
  noReferralsImageHeight: 160,
  leaderboardMaintenanceMode: false,
  leaderboardMaintenanceMessage: 'The leaderboard is currently under maintenance for the new season. Rankings will be back online shortly!',
  leaderboardMaintenanceImageUrl: assets.NOT_FOUND_IMG,
  leaderboardMaintenanceImageWidth: 160,
  leaderboardMaintenanceImageHeight: 160,
  welcomeBannerLines: [
    'WELCOME TO WARHUB 👑',
    'DAILY AND WEEKLY MATCHES 💎',
    'FAIR GAMEPLAY, ZERO HACKS 🎯',
    'INSTANT WITHDRAWALS & SUPPORT',
  ],
  welcomeNotificationTitle: 'Welcome to WarHub!',
  welcomeNotificationMessage: 'Your journey starts now. Join a match and show your skills!',
  showInAppAd: true,
  inAppAdAnimation: 'slide',
  inAppAds: [
    { id: 1, imageUrl: 'https://i.ibb.co/z25c27f/tGkYMMR.png', linkUrl: 'https://google.com', width: 90, height: 450, enabled: true },
    { id: 2, imageUrl: 'https://i.ibb.co/gR3PzL1/8d4k31b.png', linkUrl: 'https://youtube.com', width: 85, height: 400, enabled: true },
    { id: 3, imageUrl: 'https://i.ibb.co/k2Vp9NH/jXnL2Xq.png', linkUrl: '', width: 95, height: 500, enabled: false }
  ],
  maintenanceImageUrl: 'https://i.ibb.co/8gLwTfN/2A7jWJ0.gif',
  maintenanceImageWidth: 160,
  maintenanceImageHeight: 160,
  brandPrimaryColor: '#00F2FF',
  brandPinkColor: '#F000B8',
  oneAccountPerDevice: false,
  showJoinedMatches: true,
  showWhatsAppButton: true,
  whatsAppButtonImageUrl: '',
  banScreenImageUrl: assets.NOT_FOUND_IMG,
  defaultAvatarUrl: assets.DEFAULT_AVATAR_IMG,
  noInternetTitle: 'Connection Lost',
  noInternetMessage: 'Unable to connect to the internet. Please check your network settings and try again.',
  noInternetImageUrl: 'https://i.ibb.co/cy0d0m2/disconnected-2.gif',
  noInternetImageWidth: 180,
  noInternetImageHeight: 180,
  noInternetIcon: '',
};

export const initialCategories: Category[] = [
  { id: 1, name: 'Battle Royale', imageUrl: assets.BR_SQUAD_IMG, position: 1 },
  { id: 2, name: 'CS Ranked', imageUrl: assets.LW_2V2_IMG, position: 2 },
  { id: 3, name: 'Lone Wolf', imageUrl: assets.LW_1V1_IMG, position: 3 },
];

export const initialPaymentMethods: PaymentMethod[] = [
    { id: 1, name: 'EasyPaisa', enabled: true, logoUrl: assets.EASYPAISA_LOGO },
    { id: 2, name: 'JazzCash', enabled: true, logoUrl: assets.JAZZCASH_LOGO },
    { id: 3, name: 'Bank Transfer', enabled: false, logoUrl: '' },
];

export const initialReferralSettings: ReferralSettings = {
    enabled: true,
    newUserReward: 10,
    referrerReward: 15,
    imageUrl: assets.REFER_ILLUSTRATION,
    text: 'Invite friends with your referral code. You both earn bonus coins when they join their first paid match.',
    shareMessageTemplate: 'Hey! [USERNAME] is inviting you to WarHub! 🚀 Join exciting Free Fire tournaments and use the referral code: [REFERRALCODE] to get a bonus on your first paid match. See you in the game!'
};
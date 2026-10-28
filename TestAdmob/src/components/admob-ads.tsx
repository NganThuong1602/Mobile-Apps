import React, { useEffect, useRef, useState } from 'react';
import {
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TurboModuleRegistry,
  View,
} from 'react-native';

import googleServices from '../../google-services.json';

/**
 * ĐỌC MÃ QUẢNG CÁO GOOGLE ADMOB TỪ FILE CẤU HÌNH google-services.json
 */
export const ADMOB_IDS = {
  APP_ID: Platform.select({
    ios: googleServices.admob_config.ios_app_id,
    android: googleServices.admob_config.android_app_id,
    default: googleServices.admob_config.ios_app_id,
  }),
  BANNER: Platform.select({
    ios: googleServices.admob_config.ad_units.ios.banner,
    android: googleServices.admob_config.ad_units.android.banner,
    default: googleServices.admob_config.ad_units.ios.banner,
  }),
  INTERSTITIAL: Platform.select({
    ios: googleServices.admob_config.ad_units.ios.interstitial,
    android: googleServices.admob_config.ad_units.android.interstitial,
    default: googleServices.admob_config.ad_units.ios.interstitial,
  }),
};

/**
 * Kiểm tra xem Native Module của react-native-google-mobile-ads có tồn tại hay không.
 */
export const isNativeAdMobAvailable =
  Platform.OS !== 'web' && TurboModuleRegistry.get('RNGoogleMobileAdsModule') != null;

// Khởi tạo Google Mobile Ads SDK nếu chạy trên môi trường có Native Module
if (isNativeAdMobAvailable) {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const mobileAds = require('react-native-google-mobile-ads').default;
    mobileAds().initialize();
  } catch (e) {
    console.warn('AdMob initialization error:', e);
  }
}

/**
 * 1. COMPONENT QUẢNG CÁO BANNER (AdMob Banner Ad)
 * Hiển thị ở dưới cùng của mỗi trang theo yêu cầu đề bài.
 */
export function BottomBannerAd() {
  if (isNativeAdMobAvailable) {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { BannerAd, BannerAdSize } = require('react-native-google-mobile-ads');

    return (
      <View style={styles.bannerWrapper}>
        <BannerAd
          unitId={ADMOB_IDS.BANNER}
          size={BannerAdSize.ANCHORED_ADAPTIVE_BANNER}
          requestOptions={{
            requestNonPersonalizedAdsOnly: true,
          }}
        />
      </View>
    );
  }

  // Giao diện Banner AdMob khi chạy trên Expo Go
  return (
    <View style={styles.bannerWrapper}>
      <View style={styles.mockBanner}>
        <View style={styles.adBadge}>
          <Text style={styles.adBadgeText}>Ad</Text>
        </View>
        <View style={styles.mockBannerBody}>
          <Text style={styles.mockBannerTitle}>Google AdMob Test Banner</Text>
          <Text style={styles.mockBannerUnitId} numberOfLines={1}>
            unitId: {ADMOB_IDS.BANNER}
          </Text>
        </View>
        <View style={styles.mockBannerCta}>
          <Text style={styles.mockBannerCtaText}>Mở</Text>
        </View>
      </View>
    </View>
  );
}

/**
 * Component Modal độc lập bên ngoài hook để tránh bị mount/unmount gây nháy màn hình
 */
function InterstitialModalView({
  visible,
  onClose,
}: {
  visible: boolean;
  onClose: () => void;
}) {
  return (
    <Modal visible={visible} animationType="none" transparent={false} onRequestClose={onClose}>
      <View style={styles.interstitialContainer}>
        <View style={styles.interstitialTopBar}>
          <View style={styles.adTagLarge}>
            <Text style={styles.adTagLargeText}>Quảng cáo • Google AdMob</Text>
          </View>

          <Pressable style={styles.closeXButton} onPress={onClose}>
            <Text style={styles.closeXButtonText}>✕</Text>
          </Pressable>
        </View>

        <View style={styles.interstitialCard}>
          <Text style={styles.interstitialBadge}>INTERSTITIAL AD</Text>
          <Text style={styles.interstitialHeadline}>Google AdMob Fullscreen Ad</Text>
          <Text style={styles.interstitialDescription}>
            Quảng cáo xen kẽ được cấu hình từ file{' '}
            <Text style={styles.boldText}>google-services.json</Text> và thư viện{' '}
            <Text style={styles.boldText}>react-native-google-mobile-ads</Text>.
          </Text>

          <View style={styles.unitBox}>
            <Text style={styles.unitLabel}>Ad Unit ID (từ google-services.json):</Text>
            <Text style={styles.unitValue}>{ADMOB_IDS.INTERSTITIAL}</Text>
          </View>
        </View>
      </View>
    </Modal>
  );
}

/**
 * 2. HOOK QUẢNG CÁO TOÀN MÀN HÌNH (AdMob Interstitial Ad)
 * Quản lý việc nạp (load) và hiển thị quảng cáo xen kẽ kèm nút X đóng ngay.
 */
export function useAdMobInterstitial() {
  const [loaded, setLoaded] = useState(!isNativeAdMobAvailable);
  const [mockVisible, setMockVisible] = useState(false);
  const onCloseCallbackRef = useRef<(() => void) | null>(null);
  const interstitialRef = useRef<any>(null);

  useEffect(() => {
    if (!isNativeAdMobAvailable) {
      return;
    }

    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { InterstitialAd, AdEventType } = require('react-native-google-mobile-ads');

    // Khởi tạo InterstitialAd với mã ca-app-pub lấy từ google-services.json
    const interstitial = InterstitialAd.createForAdRequest(ADMOB_IDS.INTERSTITIAL, {
      requestNonPersonalizedAdsOnly: true,
    });
    interstitialRef.current = interstitial;

    const unsubscribeLoaded = interstitial.addAdEventListener(AdEventType.LOADED, () => {
      setLoaded(true);
    });

    const unsubscribeClosed = interstitial.addAdEventListener(AdEventType.CLOSED, () => {
      setLoaded(false);
      interstitial.load();
    });

    interstitial.load();

    return () => {
      unsubscribeLoaded();
      unsubscribeClosed();
    };
  }, []);

  const showInterstitial = (onAdClosed?: () => void) => {
    const interstitialInstance = interstitialRef.current;
    if (isNativeAdMobAvailable && interstitialInstance) {
      if (loaded) {
        if (onAdClosed) {
          // eslint-disable-next-line @typescript-eslint/no-require-imports
          const { AdEventType } = require('react-native-google-mobile-ads');
          const unsub = interstitialInstance.addAdEventListener(AdEventType.CLOSED, () => {
            unsub();
            onAdClosed();
          });
        }
        interstitialInstance.show().catch(() => {
          onAdClosed?.();
        });
      } else {
        onAdClosed?.();
      }
    } else {
      onCloseCallbackRef.current = onAdClosed ?? null;
      setMockVisible(true);
    }
  };

  const handleCloseMock = () => {
    setMockVisible(false);
    if (onCloseCallbackRef.current) {
      const cb = onCloseCallbackRef.current;
      onCloseCallbackRef.current = null;
      cb();
    }
  };

  const InterstitialFallbackModal = () => (
    <InterstitialModalView visible={mockVisible} onClose={handleCloseMock} />
  );

  return {
    loaded,
    showInterstitial,
    InterstitialFallbackModal,
  };
}

const styles = StyleSheet.create({
  bannerWrapper: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f1f5f9',
    borderTopWidth: 1,
    borderTopColor: '#cbd5e1',
    paddingVertical: 6,
  },
  mockBanner: {
    width: 320,
    height: 50,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#94a3b8',
    borderRadius: 6,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  adBadge: {
    backgroundColor: '#f59e0b',
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 3,
    marginRight: 8,
  },
  adBadgeText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  mockBannerBody: {
    flex: 1,
    justifyContent: 'center',
  },
  mockBannerTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0f172a',
  },
  mockBannerUnitId: {
    fontSize: 10,
    color: '#64748b',
    marginTop: 1,
  },
  mockBannerCta: {
    backgroundColor: '#2563eb',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
    marginLeft: 8,
  },
  mockBannerCtaText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '600',
  },
  interstitialContainer: {
    flex: 1,
    backgroundColor: '#0f172a',
    paddingTop: 60,
    paddingBottom: 40,
    paddingHorizontal: 24,
    justifyContent: 'space-between',
  },
  interstitialTopBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    minHeight: 44,
  },
  adTagLarge: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  adTagLargeText: {
    color: '#f8fafc',
    fontSize: 12,
    fontWeight: '600',
  },
  closeXButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#ef4444',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#ffffff',
  },
  closeXButtonText: {
    color: '#ffffff',
    fontWeight: 'bold',
    fontSize: 18,
    lineHeight: 20,
  },
  interstitialCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    marginVertical: 'auto',
  },
  interstitialBadge: {
    color: '#2563eb',
    fontWeight: '800',
    fontSize: 12,
    letterSpacing: 1,
    marginBottom: 8,
  },
  interstitialHeadline: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#0f172a',
    textAlign: 'center',
    marginBottom: 12,
  },
  interstitialDescription: {
    fontSize: 14,
    color: '#475569',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 20,
  },
  boldText: {
    fontWeight: '700',
    color: '#0f172a',
  },
  unitBox: {
    width: '100%',
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
  },
  unitLabel: {
    fontSize: 12,
    color: '#64748b',
    marginBottom: 4,
  },
  unitValue: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0f172a',
  },
});

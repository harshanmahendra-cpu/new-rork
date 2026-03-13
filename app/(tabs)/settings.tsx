import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Store, MapPin, FileText, LogOut, Save, Info, Receipt, Globe } from 'lucide-react-native';
import { useApp } from '@/contexts/AppContext';
import { useLanguage } from '@/contexts/LanguageContext';
import Colors from '@/constants/colors';
import { Language } from '@/constants/translations';

export default function SettingsScreen() {
  const { settings, updateSettings, logout, isLoggedIn } = useApp();
  const { t, language, setLanguage } = useLanguage();
  
  const [restaurantName, setRestaurantName] = useState(settings.restaurantName);
  const [address, setAddress] = useState(settings.address);
  const [gstNumber, setGstNumber] = useState(settings.gstNumber);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    setRestaurantName(settings.restaurantName);
    setAddress(settings.address);
    setGstNumber(settings.gstNumber);
  }, [settings]);

  useEffect(() => {
    const changed = 
      restaurantName !== settings.restaurantName ||
      address !== settings.address ||
      gstNumber !== settings.gstNumber;
    setHasChanges(changed);
  }, [restaurantName, address, gstNumber, settings]);

  const handleSave = () => {
    if (!restaurantName.trim()) {
      Alert.alert(t('error'), t('nameRequired'));
      return;
    }

    updateSettings({
      restaurantName: restaurantName.trim(),
      address: address.trim(),
      gstNumber: gstNumber.trim(),
    });

    Alert.alert(t('success'), t('settingsSaved'));
    setHasChanges(false);
  };

  const handleLogout = () => {
    Alert.alert(
      t('logout'),
      t('logoutConfirm'),
      [
        { text: t('cancel'), style: 'cancel' },
        { text: t('logout'), style: 'destructive', onPress: () => logout() },
      ]
    );
  };

  const getCurrentBillInfo = () => {
    const now = new Date();
    const month = (now.getMonth() + 1).toString().padStart(2, '0');
    const year = now.getFullYear().toString().slice(-2);
    const billNum = settings.lastBillNumber || 0;
    return `${month}${year}-${billNum.toString().padStart(4, '0')}`;
  };

  const handleLanguageSwitch = (lang: Language) => {
    setLanguage(lang);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>{t('settings')}</Text>
        {hasChanges && (
          <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
            <Save color={Colors.textWhite} size={18} />
            <Text style={styles.saveButtonText}>{t('save')}</Text>
          </TouchableOpacity>
        )}
      </View>

      <ScrollView style={styles.content} contentContainerStyle={styles.scrollContent}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('language')}</Text>
          <View style={styles.languageContainer}>
            <TouchableOpacity
              style={[styles.languageButton, language === 'en' && styles.languageButtonActive]}
              onPress={() => handleLanguageSwitch('en')}
            >
              <Globe color={language === 'en' ? Colors.textWhite : Colors.primary} size={18} />
              <Text style={[styles.languageButtonText, language === 'en' && styles.languageButtonTextActive]}>
                {t('english')}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.languageButton, language === 'ta' && styles.languageButtonActive]}
              onPress={() => handleLanguageSwitch('ta')}
            >
              <Globe color={language === 'ta' ? Colors.textWhite : Colors.primary} size={18} />
              <Text style={[styles.languageButtonText, language === 'ta' && styles.languageButtonTextActive]}>
                {t('tamil')}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('restaurantDetails')}</Text>
          
          <View style={styles.inputGroup}>
            <View style={styles.inputLabel}>
              <Store color={Colors.primary} size={18} />
              <Text style={styles.labelText}>{t('restaurantName')}</Text>
            </View>
            <TextInput
              style={styles.input}
              value={restaurantName}
              onChangeText={setRestaurantName}
              placeholder={t('enterRestaurantName')}
              placeholderTextColor={Colors.textLight}
            />
          </View>

          <View style={styles.inputGroup}>
            <View style={styles.inputLabel}>
              <MapPin color={Colors.primary} size={18} />
              <Text style={styles.labelText}>{t('address')}</Text>
            </View>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={address}
              onChangeText={setAddress}
              placeholder={t('enterAddress')}
              placeholderTextColor={Colors.textLight}
              multiline
              numberOfLines={3}
            />
          </View>

          <View style={styles.inputGroup}>
            <View style={styles.inputLabel}>
              <FileText color={Colors.primary} size={18} />
              <Text style={styles.labelText}>{t('gstNumber')}</Text>
            </View>
            <TextInput
              style={styles.input}
              value={gstNumber}
              onChangeText={setGstNumber}
              placeholder={t('enterGST')}
              placeholderTextColor={Colors.textLight}
              autoCapitalize="characters"
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('billingInfo')}</Text>
          
          <View style={styles.billInfoCard}>
            <Receipt color={Colors.primary} size={20} />
            <View style={styles.billInfo}>
              <Text style={styles.billInfoLabel}>{t('lastBillNumber')}</Text>
              <Text style={styles.billInfoValue}>{getCurrentBillInfo()}</Text>
              <Text style={styles.billInfoNote}>{t('billResetNote')}</Text>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('about')}</Text>
          
          <View style={styles.aboutCard}>
            <Info color={Colors.primary} size={20} />
            <View style={styles.aboutInfo}>
              <Text style={styles.aboutTitle}>{settings.restaurantName}</Text>
              <Text style={styles.aboutText}>{t('restaurantBillingSystem')}</Text>
              <Text style={styles.aboutVersion}>{t('version')}</Text>
            </View>
          </View>

          <View style={styles.infoBox}>
            <Text style={styles.infoTitle}>{t('dataStorage')}</Text>
            <Text style={styles.infoText}>{t('dataStorageInfo')}</Text>
          </View>

          <View style={styles.infoBox}>
            <Text style={styles.infoTitle}>{t('defaultLogin')}</Text>
            <Text style={styles.infoText}>
              Username: admin{'\n'}Password: admin
            </Text>
          </View>
        </View>

        {isLoggedIn && (
          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <LogOut color={Colors.danger} size={20} />
            <Text style={styles.logoutButtonText}>{t('logout')}</Text>
          </TouchableOpacity>
        )}

        <View style={styles.footer}>
          <Text style={styles.footerText}>
            {t('builtWithLove')} {settings.restaurantName}
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  title: {
    fontSize: 24,
    fontWeight: '700' as const,
    color: Colors.text,
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
    gap: 6,
  },
  saveButtonText: {
    color: Colors.textWhite,
    fontWeight: '600' as const,
    fontSize: 14,
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: Colors.text,
    marginBottom: 12,
  },
  languageContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  languageButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 14,
    borderWidth: 2,
    borderColor: Colors.border,
  },
  languageButtonActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  languageButtonText: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  languageButtonTextActive: {
    color: Colors.textWhite,
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  labelText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  input: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 14,
    fontSize: 15,
    color: Colors.text,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  billInfoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 16,
    gap: 12,
  },
  billInfo: {
    flex: 1,
  },
  billInfoLabel: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  billInfoValue: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: Colors.primary,
    marginTop: 4,
  },
  billInfoNote: {
    fontSize: 12,
    color: Colors.textLight,
    marginTop: 4,
  },
  aboutCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    gap: 12,
  },
  aboutInfo: {
    flex: 1,
  },
  aboutTitle: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: Colors.text,
  },
  aboutText: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  aboutVersion: {
    fontSize: 12,
    color: Colors.textLight,
    marginTop: 4,
  },
  infoBox: {
    backgroundColor: Colors.surfaceAlt,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  infoTitle: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.text,
    marginBottom: 6,
  },
  infoText: {
    fontSize: 13,
    color: Colors.textSecondary,
    lineHeight: 20,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.dangerLight,
    borderRadius: 12,
    padding: 16,
    gap: 8,
    marginBottom: 24,
  },
  logoutButtonText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.danger,
  },
  footer: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  footerText: {
    fontSize: 13,
    color: Colors.textLight,
  },
});

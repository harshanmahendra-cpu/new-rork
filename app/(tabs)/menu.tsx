import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Modal, TextInput, Switch, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Plus, Search, Edit2, Trash2, X, Check, Camera, ImageIcon } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import { useApp } from '@/contexts/AppContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { formatCurrency } from '@/utils/helpers';
import { MenuItem, MENU_CATEGORIES, MenuCategory } from '@/types';
import Colors from '@/constants/colors';

export default function MenuScreen() {
  const { menu, addMenuItem, updateMenuItem, deleteMenuItem } = useApp();
  const { t } = useLanguage();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  
  const [formName, setFormName] = useState('');
  const [formCategory, setFormCategory] = useState<MenuCategory>('Starters');
  const [formPrice, setFormPrice] = useState('');
  const [formAvailable, setFormAvailable] = useState(true);
  const [formImage, setFormImage] = useState<string | undefined>(undefined);

  const filteredMenu = useMemo(() => {
    return menu.filter(item => {
      const matchesCategory = selectedCategory === 'All' || item.category === selectedCategory;
      const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [menu, selectedCategory, searchQuery]);

  const groupedMenu = useMemo(() => {
    const groups: Record<string, MenuItem[]> = {};
    filteredMenu.forEach(item => {
      if (!groups[item.category]) {
        groups[item.category] = [];
      }
      groups[item.category].push(item);
    });
    return groups;
  }, [filteredMenu]);

  const resetForm = () => {
    setFormName('');
    setFormCategory('Starters');
    setFormPrice('');
    setFormAvailable(true);
    setFormImage(undefined);
    setEditingItem(null);
  };

  const handleOpenAdd = () => {
    resetForm();
    setShowAddModal(true);
  };

  const handleOpenEdit = (item: MenuItem) => {
    setEditingItem(item);
    setFormName(item.name);
    setFormCategory(item.category as MenuCategory);
    setFormPrice(item.price.toString());
    setFormAvailable(item.isAvailable);
    setFormImage(item.image);
    setShowAddModal(true);
  };

  const handleCloseModal = () => {
    setShowAddModal(false);
    resetForm();
  };

  const handlePickImage = async () => {
    try {
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (!permissionResult.granted) {
        Alert.alert('Permission Required', 'Please allow access to your photo library to add images.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.6,
        base64: true,
      });

      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0];
        if (asset.base64) {
          const mimeType = asset.mimeType || 'image/jpeg';
          setFormImage(`data:${mimeType};base64,${asset.base64}`);
        } else {
          setFormImage(asset.uri);
        }
        console.log('Image picked successfully');
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to pick image. Please try again.');
    }
  };

  const handleRemoveImage = () => {
    setFormImage(undefined);
  };

  const handleSave = () => {
    if (!formName.trim()) {
      Alert.alert('Error', 'Please enter item name');
      return;
    }
    
    const price = parseFloat(formPrice);
    if (isNaN(price) || price <= 0) {
      Alert.alert('Error', 'Please enter a valid price');
      return;
    }

    if (editingItem) {
      updateMenuItem(editingItem.id, {
        name: formName.trim(),
        category: formCategory,
        price,
        isAvailable: formAvailable,
        image: formImage,
      });
    } else {
      addMenuItem({
        name: formName.trim(),
        category: formCategory,
        price,
        isAvailable: formAvailable,
        image: formImage,
      });
    }

    handleCloseModal();
  };

  const handleDelete = (item: MenuItem) => {
    Alert.alert(
      t('deleteItem'),
      `${t('deleteItemConfirm')}`,
      [
        { text: t('cancel'), style: 'cancel' },
        { 
          text: t('delete'), 
          style: 'destructive', 
          onPress: () => deleteMenuItem(item.id) 
        },
      ]
    );
  };

  const handleToggleAvailable = (item: MenuItem) => {
    updateMenuItem(item.id, { isAvailable: !item.isAvailable });
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>{t('menuManagement')}</Text>
        <TouchableOpacity style={styles.addButton} onPress={handleOpenAdd}>
          <Plus color={Colors.textWhite} size={20} />
          <Text style={styles.addButtonText}>{t('addItem')}</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.searchContainer}>
        <View style={styles.searchBox}>
          <Search color={Colors.textSecondary} size={20} />
          <TextInput
            style={styles.searchInput}
            placeholder={t('searchItems')}
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholderTextColor={Colors.textSecondary}
          />
        </View>
      </View>

      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        style={styles.categoryScroll}
        contentContainerStyle={styles.categoryContainer}
      >
        <TouchableOpacity
          style={[styles.categoryChip, selectedCategory === 'All' && styles.categoryChipActive]}
          onPress={() => setSelectedCategory('All')}
        >
          <Text style={[styles.categoryText, selectedCategory === 'All' && styles.categoryTextActive]}>
            {t('all')} ({menu.length})
          </Text>
        </TouchableOpacity>
        {MENU_CATEGORIES.map((cat) => {
          const count = menu.filter(m => m.category === cat).length;
          return (
            <TouchableOpacity
              key={cat}
              style={[styles.categoryChip, selectedCategory === cat && styles.categoryChipActive]}
              onPress={() => setSelectedCategory(cat)}
            >
              <Text style={[styles.categoryText, selectedCategory === cat && styles.categoryTextActive]}>
                {cat} ({count})
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      <ScrollView style={styles.content} contentContainerStyle={styles.scrollContent}>
        {Object.entries(groupedMenu).map(([category, items]) => (
          <View key={category} style={styles.categorySection}>
            <Text style={styles.categorySectionTitle}>{category}</Text>
            {items.map((item) => (
              <View key={item.id} style={[styles.menuCard, !item.isAvailable && styles.menuCardDisabled]}>
                <View style={styles.menuCardContent}>
                  {item.image ? (
                    <Image source={{ uri: item.image }} style={styles.menuCardImage} />
                  ) : (
                    <View style={styles.menuCardImagePlaceholder}>
                      <ImageIcon color={Colors.textLight} size={28} />
                    </View>
                  )}
                  <View style={styles.menuCardInfo}>
                    <Text style={[styles.menuCardName, !item.isAvailable && styles.menuCardNameDisabled]}>
                      {item.name}
                    </Text>
                    <Text style={styles.menuCardPrice}>{formatCurrency(item.price)}</Text>
                  </View>
                  <View style={styles.menuCardActions}>
                    <TouchableOpacity 
                      style={[styles.statusBadge, item.isAvailable ? styles.statusAvailable : styles.statusUnavailable]}
                      onPress={() => handleToggleAvailable(item)}
                    >
                      <Text style={[styles.statusText, item.isAvailable ? styles.statusTextAvailable : styles.statusTextUnavailable]}>
                        {item.isAvailable ? t('available') : 'N/A'}
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.iconButton} onPress={() => handleOpenEdit(item)}>
                      <Edit2 color={Colors.primary} size={18} />
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.iconButton} onPress={() => handleDelete(item)}>
                      <Trash2 color={Colors.danger} size={18} />
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            ))}
          </View>
        ))}
      </ScrollView>

      <Modal
        visible={showAddModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={handleCloseModal}
      >
        <SafeAreaView style={styles.modalContainer} edges={['top']}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={handleCloseModal} style={styles.modalCloseButton}>
              <X color={Colors.text} size={24} />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>{editingItem ? t('editItem') : t('addItem')}</Text>
            <TouchableOpacity onPress={handleSave} style={styles.modalSaveButton}>
              <Check color={Colors.primary} size={24} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent} contentContainerStyle={styles.modalScrollContent}>
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Item Image</Text>
              <View style={styles.imagePickerContainer}>
                {formImage ? (
                  <View style={styles.imagePreviewWrapper}>
                    <Image source={{ uri: formImage }} style={styles.imagePreview} />
                    <TouchableOpacity style={styles.removeImageButton} onPress={handleRemoveImage}>
                      <X color={Colors.textWhite} size={16} />
                    </TouchableOpacity>
                  </View>
                ) : (
                  <TouchableOpacity style={styles.imagePickerButton} onPress={handlePickImage}>
                    <Camera color={Colors.primary} size={28} />
                    <Text style={styles.imagePickerText}>Add Photo</Text>
                  </TouchableOpacity>
                )}
                {formImage && (
                  <TouchableOpacity style={styles.changeImageButton} onPress={handlePickImage}>
                    <Camera color={Colors.primary} size={18} />
                    <Text style={styles.changeImageText}>Change Photo</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>{t('itemName')}</Text>
              <TextInput
                style={styles.formInput}
                placeholder={t('itemName')}
                value={formName}
                onChangeText={setFormName}
                placeholderTextColor={Colors.textLight}
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>{t('category')}</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View style={styles.categoryOptions}>
                  {MENU_CATEGORIES.map((cat) => (
                    <TouchableOpacity
                      key={cat}
                      style={[styles.categoryOption, formCategory === cat && styles.categoryOptionActive]}
                      onPress={() => setFormCategory(cat)}
                    >
                      <Text style={[styles.categoryOptionText, formCategory === cat && styles.categoryOptionTextActive]}>
                        {cat}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </ScrollView>
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>{t('price')} (₹)</Text>
              <TextInput
                style={styles.formInput}
                placeholder={t('price')}
                value={formPrice}
                onChangeText={setFormPrice}
                keyboardType="decimal-pad"
                placeholderTextColor={Colors.textLight}
              />
            </View>

            <View style={styles.formGroup}>
              <View style={styles.switchRow}>
                <Text style={styles.formLabel}>{t('available')}</Text>
                <Switch
                  value={formAvailable}
                  onValueChange={setFormAvailable}
                  trackColor={{ false: Colors.border, true: Colors.successLight }}
                  thumbColor={formAvailable ? Colors.success : Colors.textLight}
                />
              </View>
            </View>

            <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
              <Text style={styles.saveButtonText}>{editingItem ? t('save') : t('addItem')}</Text>
            </TouchableOpacity>
          </ScrollView>
        </SafeAreaView>
      </Modal>
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
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
    gap: 6,
  },
  addButtonText: {
    color: Colors.textWhite,
    fontWeight: '600' as const,
    fontSize: 14,
  },
  searchContainer: {
    padding: 16,
    backgroundColor: Colors.surface,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surfaceAlt,
    borderRadius: 12,
    paddingHorizontal: 12,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 14,
    color: Colors.text,
  },
  categoryScroll: {
    backgroundColor: Colors.surface,
    maxHeight: 52,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  categoryContainer: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 8,
  },
  categoryChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: Colors.surfaceAlt,
    borderRadius: 20,
  },
  categoryChipActive: {
    backgroundColor: Colors.primary,
  },
  categoryText: {
    fontSize: 13,
    fontWeight: '500' as const,
    color: Colors.textSecondary,
  },
  categoryTextActive: {
    color: Colors.textWhite,
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 32,
  },
  categorySection: {
    marginBottom: 24,
  },
  categorySectionTitle: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: Colors.text,
    marginBottom: 12,
  },
  menuCard: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
  menuCardDisabled: {
    opacity: 0.6,
  },
  menuCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  menuCardImage: {
    width: 72,
    height: 72,
    borderRadius: 14,
    marginRight: 12,
    backgroundColor: Colors.surfaceAlt,
  },
  menuCardImagePlaceholder: {
    width: 72,
    height: 72,
    borderRadius: 14,
    marginRight: 12,
    backgroundColor: Colors.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuCardInfo: {
    flex: 1,
  },
  menuCardName: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  menuCardNameDisabled: {
    textDecorationLine: 'line-through',
  },
  menuCardPrice: {
    fontSize: 14,
    color: Colors.primary,
    fontWeight: '600' as const,
    marginTop: 4,
  },
  menuCardActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusAvailable: {
    backgroundColor: Colors.successLight,
  },
  statusUnavailable: {
    backgroundColor: Colors.dangerLight,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600' as const,
  },
  statusTextAvailable: {
    color: Colors.success,
  },
  statusTextUnavailable: {
    color: Colors.danger,
  },
  iconButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  modalCloseButton: {
    padding: 4,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: Colors.text,
  },
  modalSaveButton: {
    padding: 4,
  },
  modalContent: {
    flex: 1,
  },
  modalScrollContent: {
    padding: 20,
  },
  formGroup: {
    marginBottom: 24,
  },
  formLabel: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.text,
    marginBottom: 8,
  },
  formInput: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
    color: Colors.text,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  imagePickerContainer: {
    alignItems: 'center',
    gap: 12,
  },
  imagePickerButton: {
    width: 120,
    height: 120,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: Colors.border,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.surfaceAlt,
    gap: 8,
  },
  imagePickerText: {
    fontSize: 13,
    fontWeight: '500' as const,
    color: Colors.primary,
  },
  imagePreviewWrapper: {
    position: 'relative',
  },
  imagePreview: {
    width: 120,
    height: 120,
    borderRadius: 16,
    backgroundColor: Colors.surfaceAlt,
  },
  removeImageButton: {
    position: 'absolute',
    top: -8,
    right: -8,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.danger,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  changeImageButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: Colors.surfaceAlt,
  },
  changeImageText: {
    fontSize: 13,
    fontWeight: '500' as const,
    color: Colors.primary,
  },
  categoryOptions: {
    flexDirection: 'row',
    gap: 8,
  },
  categoryOption: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: Colors.surface,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  categoryOptionActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  categoryOptionText: {
    fontSize: 14,
    fontWeight: '500' as const,
    color: Colors.textSecondary,
  },
  categoryOptionTextActive: {
    color: Colors.textWhite,
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  saveButton: {
    backgroundColor: Colors.primary,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 20,
  },
  saveButtonText: {
    color: Colors.textWhite,
    fontSize: 16,
    fontWeight: '700' as const,
  },
});

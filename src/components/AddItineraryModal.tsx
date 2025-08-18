import React, { useState, useEffect } from 'react';
import Modal from './Modal';
import { NotionItineraryItem } from '../types';
import { MODAL_WIDTH_CLASS } from '../config/ui-config';
import ItineraryFormFields from './ItineraryFormFields';
import { Check } from 'lucide-react';

interface AddItineraryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (newItem: Partial<NotionItineraryItem>) => void;
  selectedDay: string | null;
}

const AddItineraryModal: React.FC<AddItineraryModalProps> = ({ isOpen, onClose, onSave, selectedDay }) => {
  const [newItem, setNewItem] = useState<Partial<NotionItineraryItem>>({
    項目: '',
    日期: selectedDay || '',
    時段: [],
    景點介紹: '',
    縮圖網址: '',
    GoogleMaps: '',
    人均價: null,
    幣別: '',
    前往方式: '',
    重要資訊: '',
    待辦: '',
    排序: null,
  });

  useEffect(() => {
    setNewItem(prev => ({
      ...prev,
      日期: selectedDay || '',
    }));
  }, [selectedDay]);

  const handleFieldChange = <T extends keyof Partial<NotionItineraryItem>>(
    field: T,
    value: Partial<NotionItineraryItem>[T]
  ) => {
    setNewItem(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSave = () => {
    onSave(newItem);
    onClose();
    // Reset form after saving
    setNewItem({
      項目: '',
      日期: selectedDay || '',
      時段: [],
      景點介紹: '',
      縮圖網址: '',
      GoogleMaps: '',
      人均價: null,
      幣別: '',
      前往方式: '',
      重要資訊: '',
      待辦: '',
      排序: null,
    });
  };

  const headerActions = (
    <button
      onClick={handleSave}
      className="text-green-500 hover:text-green-600 transition-colors"
      title="儲存"
    >
      <Check size={20} />
    </button>
  );

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="新增行程項目" className={MODAL_WIDTH_CLASS} headerActions={headerActions}>
      <div className="p-4 space-y-4">
        {/* Date - kept separate due to auto-population */}
        <div>
          <label className="block text-sm font-medium text-gray-700">日期</label>
          <input
            type="date"
            value={newItem.日期 || ''}
            onChange={(e) => handleFieldChange('日期', e.target.value)}
            className="mt-1 block w-full p-2 border rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        <ItineraryFormFields item={newItem} handleFieldChange={handleFieldChange} />
      </div>
    </Modal>
  );
};

export default AddItineraryModal;
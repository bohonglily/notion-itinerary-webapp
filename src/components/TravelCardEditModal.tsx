import React, { useState, useEffect } from 'react';
import Modal from './Modal';
import { NotionItineraryItem } from '../types';
import { MODAL_WIDTH_CLASS } from '../config/ui-config';
import ItineraryFormFields from './ItineraryFormFields';
import { Check } from 'lucide-react';

interface TravelCardEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  item: NotionItineraryItem;
  onSave: (updatedItem: NotionItineraryItem) => void;
}

const TravelCardEditModal: React.FC<TravelCardEditModalProps> = ({ isOpen, onClose, item, onSave }) => {
  const [editableItem, setEditableItem] = useState<NotionItineraryItem>(item);

  useEffect(() => {
    setEditableItem(item); // Reset editableItem when item prop changes (e.g., modal opens for a new card)
  }, [item]);

  const handleFieldChange = <T extends keyof Partial<NotionItineraryItem>>(
    field: T,
    value: Partial<NotionItineraryItem>[T]
  ) => {
    setEditableItem(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSave = () => {
    onSave(editableItem);
    onClose();
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
    <Modal isOpen={isOpen} onClose={onClose} title={`編輯：${item.項目}`} className={MODAL_WIDTH_CLASS} headerActions={headerActions}>
      <div className="p-4 space-y-4">
        <ItineraryFormFields item={editableItem} handleFieldChange={handleFieldChange} />
      </div>
    </Modal>
  );
};

export default TravelCardEditModal;
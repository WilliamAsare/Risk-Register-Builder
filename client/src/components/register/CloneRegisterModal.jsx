import { useState } from 'react';
import Modal from '../common/Modal';
import Button from '../common/Button';
import Input from '../common/Input';
import { api } from '../../utils/api';
import toast from 'react-hot-toast';

export default function CloneRegisterModal({ register, isOpen, onClose, onCloned }) {
  const [name, setName] = useState('');
  const [cloning, setCloning] = useState(false);

  const handleClone = async () => {
    setCloning(true);
    try {
      const result = await api.post(`/registers/${register.id}/clone`, {
        name: name.trim() || `${register.name} (Copy)`,
      });
      toast.success('Register cloned successfully');
      onCloned(result.id);
    } catch (err) {
      toast.error(err.message || 'Failed to clone register');
    } finally {
      setCloning(false);
    }
  };

  if (!register) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Clone Register" size="sm">
      <div className="space-y-4">
        <p className="text-sm text-slate-600">
          This will create a complete copy of <strong>{register.name}</strong> including all assets, threats, controls, and risks.
        </p>
        <Input
          label="New Register Name"
          value={name}
          onChange={e => setName(e.target.value)}
          placeholder={`${register.name} (Copy)`}
        />
        <div className="flex justify-end gap-3 pt-2">
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button onClick={handleClone} disabled={cloning}>
            {cloning ? 'Cloning...' : 'Clone Register'}
          </Button>
        </div>
      </div>
    </Modal>
  );
}

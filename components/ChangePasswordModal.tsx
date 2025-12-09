import React, { useState } from 'react';
import { Modal } from './Modal';
import { Button } from './Button';
import { Lock, AlertCircle, Check } from 'lucide-react';
import { api } from '../services/api';

interface ChangePasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
  onSuccess: () => void;
}

export const ChangePasswordModal: React.FC<ChangePasswordModalProps> = ({ isOpen, onClose, userId, onSuccess }) => {
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (newPassword !== confirmPassword) {
      setError('New passwords do not match');
      return;
    }

    if (newPassword.length < 5) {
      setError('Password must be at least 5 characters');
      return;
    }

    setLoading(true);
    try {
      await api.changePassword(userId, oldPassword, newPassword);
      setLoading(false);
      onSuccess();
      onClose();
      // Reset form
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      setLoading(false);
      setError(err.message || 'Failed to change password');
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Change Password">
      <div className="p-6">
        <div className="mb-6 bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-3 flex items-start gap-3">
            <Lock size={18} className="text-yellow-500 shrink-0 mt-0.5" />
            <p className="text-xs text-zinc-300">
                Changing your password will update your credentials immediately. Please ensure you use a strong, unique password for your encrypted vault.
            </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-zinc-400 mb-1">Current Password</label>
            <input 
              type="password"
              value={oldPassword}
              onChange={(e) => setOldPassword(e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              required
            />
          </div>

          <div className="pt-2 border-t border-zinc-800">
             <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1">New Password</label>
                <input 
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                required
                />
            </div>
            <div className="mt-3">
                <label className="block text-xs font-medium text-zinc-400 mb-1">Confirm New Password</label>
                <input 
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                required
                />
            </div>
          </div>

          {error && (
            <div className="flex items-center gap-2 text-red-400 text-xs bg-red-500/10 p-2 rounded">
              <AlertCircle size={14} />
              {error}
            </div>
          )}

          <div className="flex justify-end gap-3 mt-6">
            <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
            <Button type="submit" disabled={loading}>
                {loading ? 'Updating...' : 'Update Password'}
            </Button>
          </div>
        </form>
      </div>
    </Modal>
  );
};
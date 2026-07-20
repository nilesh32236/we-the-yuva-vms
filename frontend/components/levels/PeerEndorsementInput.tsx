'use client';

import { Plus, Trash2, User } from 'lucide-react';
import { useState } from 'react';
import { Button } from '../ui/Button';

interface Endorsement {
  userId: string;
  name: string;
  statement: string;
}

interface PeerEndorsementInputProps {
  endorsements: Endorsement[];
  onChange: (endorsements: Endorsement[]) => void;
}

export function PeerEndorsementInput({ endorsements, onChange }: PeerEndorsementInputProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [newName, setNewName] = useState('');
  const [newStatement, setNewStatement] = useState('');

  function addEndorsement() {
    if (!newName.trim() || !newStatement.trim()) return;
    const endorsement: Endorsement = {
      userId: `peer-${Date.now()}`,
      name: newName.trim(),
      statement: newStatement.trim(),
    };
    onChange([...endorsements, endorsement]);
    setNewName('');
    setNewStatement('');
    setIsAdding(false);
  }

  function removeEndorsement(index: number) {
    onChange(endorsements.filter((_, i) => i !== index));
  }

  return (
    <div className="space-y-3">
      <h4 className="text-sm font-semibold text-brand-text">Peer Endorsements</h4>

      {endorsements.length > 0 && (
        <ul className="space-y-2" aria-label="Added endorsements">
          {endorsements.map((end, index) => (
            <li
              key={end.userId}
              className="flex items-start gap-3 p-3 rounded-xl bg-brand-bg border border-brand-border"
            >
              <div className="w-8 h-8 rounded-full bg-brand-primary/10 flex items-center justify-center flex-shrink-0">
                <User className="w-4 h-4 text-brand-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-brand-text">{end.name}</p>
                <p className="text-xs text-brand-muted mt-0.5 line-clamp-2">{end.statement}</p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => removeEndorsement(index)}
                className="flex-shrink-0 min-w-[44px] min-h-[44px] rounded-lg flex items-center justify-center text-brand-muted hover:text-brand-error hover:bg-brand-error/10 transition-colors cursor-pointer focus-visible:ring-2 focus-visible:ring-brand-primary"
                aria-label={`Remove endorsement from ${end.name}`}
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </li>
          ))}
        </ul>
      )}

      {isAdding ? (
        <div className="space-y-3 p-4 rounded-xl bg-brand-bg border border-brand-border">
          <div className="space-y-1.5">
            <label htmlFor="peer-name" className="block text-xs font-medium text-brand-muted">
              Peer name
            </label>
            <input
              id="peer-name"
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="e.g. Priya Sharma"
              className="w-full rounded-lg border border-brand-border bg-brand-surface px-3 py-2 text-sm text-brand-text placeholder-brand-muted/60 focus:outline-none focus:ring-2 focus:ring-brand-primary/40 focus:border-brand-primary transition-colors"
            />
          </div>
          <div className="space-y-1.5">
            <label htmlFor="peer-statement" className="block text-xs font-medium text-brand-muted">
              Endorsement statement
            </label>
            <textarea
              id="peer-statement"
              rows={2}
              value={newStatement}
              onChange={(e) => setNewStatement(e.target.value)}
              placeholder="Describe how this peer has demonstrated the required qualities..."
              className="w-full rounded-lg border border-brand-border bg-brand-surface px-3 py-2 text-sm text-brand-text placeholder-brand-muted/60 focus:outline-none focus:ring-2 focus:ring-brand-primary/40 focus:border-brand-primary transition-colors resize-none"
            />
          </div>
          <div className="flex items-center justify-end gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setIsAdding(false);
                setNewName('');
                setNewStatement('');
              }}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={addEndorsement}
              disabled={!newName.trim() || !newStatement.trim()}
            >
              Add
            </Button>
          </div>
        </div>
      ) : (
        <Button
          variant="outline"
          fullWidth
          onClick={() => setIsAdding(true)}
          className="border-dashed text-brand-muted hover:text-brand-primary hover:border-brand-primary/50 bg-transparent"
        >
          <Plus className="w-4 h-4" />
          <span className="text-sm font-medium">Add Endorsement</span>
        </Button>
      )}
    </div>
  );
}

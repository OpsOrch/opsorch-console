'use client';

import React, { useState } from 'react';
import { completeStep } from '@/app/lib/orchestration';
import { MarkdownText } from '@/app/components/MarkdownText';
import { OrchestrationStep } from '@/app/lib/types';

interface StepCompletionModalProps {
  runId: string;
  stepId: string;
  step: OrchestrationStep;
  onClose: () => void;
  onCompleted: () => void;
}

export function StepCompletionModal({ 
  runId, 
  stepId, 
  step, 
  onClose, 
  onCompleted 
}: StepCompletionModalProps) {
  const [note, setNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const noteChars = note.trim().length;
  const stepTypeLabel = step.type.charAt(0).toUpperCase() + step.type.slice(1);
  const stepTypeBadge = step.type.charAt(0).toUpperCase();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    setIsSubmitting(true);
    setError(null);
    
    try {
      await completeStep(runId, stepId, note.trim() || undefined);
      onCompleted();
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to complete step');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex min-h-screen items-start justify-center bg-black bg-opacity-50 px-4"
      onClick={handleBackdropClick}
    >
      <div className="mt-16 w-full max-w-lg rounded-lg bg-white shadow-xl">
        <div className="border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Complete Step</h3>
            <p className="text-xs text-gray-500 mt-1">
              Add a completion note for audit history.
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
            aria-label="Close"
          >
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="px-6 py-5">
          <div className="mb-4 rounded-lg border border-gray-200 bg-gray-50 px-4 py-3">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center text-[10px] font-semibold">
                {stepTypeBadge}
              </div>
              <span className="text-[11px] font-medium text-gray-500 uppercase tracking-[0.14em]">
                {stepTypeLabel} Step
              </span>
            </div>
            <h4 className="font-medium text-gray-900 mb-1">{step.title}</h4>
            {step.description && (
              <p className="text-gray-600 text-sm">
                <MarkdownText text={step.description} />
              </p>
            )}
          </div>

          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <div className="flex items-center justify-between mb-2">
                <label htmlFor="note" className="block text-sm font-medium text-gray-700">
                  Completion Note
                </label>
                <span className="text-xs text-gray-400">{noteChars} chars</span>
              </div>
              <textarea
                id="note"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                rows={4}
                disabled={isSubmitting}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="What did you do, and what should the next operator know?"
              />
              <p className="text-xs text-gray-500 mt-2">
                Optional but recommended for traceability.
              </p>
            </div>

            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
                <div className="text-red-800 text-sm">{error}</div>
              </div>
            )}

            <div className="flex gap-3">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md text-sm font-medium hover:bg-gray-50"
                disabled={isSubmitting}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className={`
                  flex-1 px-4 py-2 rounded-md text-sm font-medium text-white
                  ${isSubmitting
                    ? 'bg-gray-400 cursor-not-allowed'
                    : 'bg-green-600 hover:bg-green-700'
                  }
                `}
              >
                {isSubmitting ? 'Completing...' : 'Mark Complete'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

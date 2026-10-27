import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { fetchInfrastructure, reviewInfrastructureItem } from '../api';
import { InfrastructureEvidence } from '../types';
import { StatusBadge } from '../components/StatusBadge';
import { Modal } from '../components/Modal';
import {
  Building2,
  MapPin,
  Calendar,
  AlertTriangle,
  CheckCircle,
  Eye,
  Edit2,
  Compass,
  FileSpreadsheet,
  Check
} from 'lucide-react';

interface InfrastructureReviewPageProps {
  onNavigate: (view: string, id?: string) => void;
}

export const InfrastructureReviewPage: React.FC<InfrastructureReviewPageProps> = ({ onNavigate }) => {
  const { user, role } = useAuth();
  const [items, setItems] = useState<InfrastructureEvidence[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');

  // Modal
  const [reviewModalOpen, setReviewModalOpen] = useState<boolean>(false);
  const [selectedItem, setSelectedItem] = useState<InfrastructureEvidence | null>(null);
  const [reviewStatus, setReviewStatus] = useState<any>('Verified');
  const [reviewerNotes, setReviewerNotes] = useState<string>('');

  const loadItems = async () => {
    try {
      setLoading(true);
      const res = await fetchInfrastructure(selectedCategory !== 'All' ? { category: selectedCategory } : {});
      if (res.success) {
        setItems(res.items || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadItems();
  }, [selectedCategory]);

  const handleOpenReviewModal = (item: InfrastructureEvidence) => {
    setSelectedItem(item);
    setReviewStatus(item.review_status);
    setReviewerNotes(item.reviewer_notes || '');
    setReviewModalOpen(true);
  };

  const handleSubmitReview = async () => {
    if (!selectedItem) return;
    await reviewInfrastructureItem(selectedItem.id, reviewStatus, reviewerNotes, user.name);
    setReviewModalOpen(false);
    loadItems();
  };

  return (
    <div className="space-y-6 pb-16">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-teal-50 text-teal-700 border border-teal-200 uppercase tracking-wider">
              Physical Infrastructure Review
            </span>
            <span className="text-xs text-slate-400">&bull; Photographic Evidence & Geotag Verification</span>
          </div>
          <h1 className="text-2xl font-bold font-heading text-slate-900 tracking-tight mt-1">
            Campus Infrastructure & Equipment Inspection
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Photographic proof of laboratories, workshops, libraries, and building floor plans with cadastral geotag audit.
          </p>
        </div>

        {/* Filter by Category */}
        <div className="self-start sm:self-auto">
          <select
            value={selectedCategory}
            onChange={e => setSelectedCategory(e.target.value)}
            className="px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 shadow-xs focus:outline-none focus:ring-2 focus:ring-teal-500/20"
          >
            <option value="All">All Categories</option>
            <option value="Computer Laboratory">Computer Laboratory</option>
            <option value="Campus Aerial / Front View">Campus Aerial / Front View</option>
            <option value="Engineering Workshop">Engineering Workshop</option>
            <option value="Central Library">Central Library</option>
          </select>
        </div>
      </div>

      {/* Discrepancy Notice */}
      <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-amber-900 text-xs flex items-center gap-2.5">
        <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
        <p className="leading-relaxed">
          <span className="font-bold">Limitation Notice:</span> Visual analysis evaluates uploaded evidence against normative checklists. True structural dimensions and laboratory capacity require physical verification by AICTE Expert Visit Committees (EVC).
        </p>
      </div>

      {/* Infrastructure Items Grid */}
      {loading ? (
        <div className="py-20 text-center">
          <div className="w-8 h-8 border-3 border-teal-600 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs text-slate-500 mt-2 font-medium">Loading infrastructure gallery...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {items.map(item => (
            <div
              key={item.id}
              className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden flex flex-col hover:border-slate-300 transition-all group"
            >
              {/* Photo Preview with Badges */}
              <div className="relative h-48 bg-slate-100 overflow-hidden">
                <img
                  src={item.file_path}
                  alt={item.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <div className="absolute top-2.5 left-2.5">
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-900/80 backdrop-blur-xs text-white">
                    {item.category}
                  </span>
                </div>
                <div className="absolute top-2.5 right-2.5">
                  <StatusBadge status={item.review_status} size="sm" />
                </div>
              </div>

              {/* Body */}
              <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                <div className="space-y-1.5">
                  <h3 className="font-bold text-slate-900 text-sm">{item.title}</h3>
                  <p className="text-[11px] text-teal-700 font-semibold truncate">
                    {item.institution_name}
                  </p>

                  <div className="text-[11px] text-slate-500 space-y-1 pt-1">
                    <div className="flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="truncate">{item.geo_location_name}</span>
                    </div>

                    <div className="flex items-center gap-1.5 font-mono text-[10px] text-slate-400">
                      <Compass className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span>{item.latitude}&deg; N, {item.longitude}&deg; E</span>
                      <span>&bull; {item.capture_date?.slice(0, 10)}</span>
                    </div>
                  </div>

                  {/* Detected Elements Chips */}
                  {item.detected_elements && item.detected_elements.length > 0 && (
                    <div className="pt-2">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                        Detected Facilities:
                      </span>
                      <div className="flex flex-wrap gap-1">
                        {item.detected_elements.map((el, i) => (
                          <span key={i} className="px-1.5 py-0.5 rounded text-[10px] bg-slate-100 text-slate-700 font-medium">
                            {el}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {item.reviewer_notes && (
                    <p className="text-[11px] text-slate-600 bg-slate-50 p-2 rounded border border-slate-100 italic mt-2">
                      &ldquo;{item.reviewer_notes}&rdquo;
                    </p>
                  )}
                </div>

                {/* Footer Action */}
                <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                  <button
                    onClick={() => onNavigate('applications', item.application_id)}
                    className="text-xs font-semibold text-slate-500 hover:text-slate-800"
                  >
                    View Filing &rarr;
                  </button>

                  {role !== 'applicant' && (
                    <button
                      onClick={() => handleOpenReviewModal(item)}
                      className="px-2.5 py-1 rounded bg-teal-50 hover:bg-teal-100 text-teal-800 font-bold text-xs transition-colors"
                    >
                      Record Disposition
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Review Modal */}
      <Modal
        isOpen={reviewModalOpen}
        onClose={() => setReviewModalOpen(false)}
        title="Record Infrastructure Scrutiny Disposition"
        subtitle={`Audit evaluation for: ${selectedItem?.title}`}
      >
        <div className="space-y-4 text-xs">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Scrutiny Status</label>
            <select
              value={reviewStatus}
              onChange={e => setReviewStatus(e.target.value as any)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800"
            >
              <option value="Verified">Verified (Satisfies Handbook Norms)</option>
              <option value="Potential Discrepancy">Potential Discrepancy (Geotag / Equipment Gap)</option>
              <option value="Needs Physical Inspection">Needs Physical Inspection (Schedule EVC)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Reviewer Observations & Notes</label>
            <textarea
              rows={3}
              value={reviewerNotes}
              onChange={e => setReviewerNotes(e.target.value)}
              placeholder="e.g. Geolocation coordinates coincide with campus parcel; normative high-speed computing lab verified."
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
            <button
              onClick={() => setReviewModalOpen(false)}
              className="px-3 py-2 rounded-lg border border-slate-200 text-slate-600 font-semibold"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmitReview}
              className="px-4 py-2 rounded-lg bg-teal-600 hover:bg-teal-700 text-white font-bold"
            >
              Save Scrutiny Review
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { ShieldCheck, CheckCircle2, XCircle } from 'lucide-react';
import { publicApplicationService } from '../services/applicationService';
import { API_BASE_URL } from '../services/api';

const serverOrigin = API_BASE_URL.replace(/\/api$/, '');

const OfferAccept = () => {
  const { token } = useParams();
  const [offer, setOffer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [deciding, setDeciding] = useState(false);
  const [decided, setDecided] = useState(null);

  useEffect(() => {
    publicApplicationService
      .getOffer(token)
      .then((res) => setOffer(res.data.offer))
      .catch((err) => toast.error(err.message))
      .finally(() => setLoading(false));
  }, [token]);

  const decide = async (decision) => {
    setDeciding(true);
    try {
      const res = await publicApplicationService.decideOffer(token, decision);
      setDecided(res.data);
      toast.success(`Offer ${decision.toLowerCase()}`);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setDeciding(false);
    }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center text-gray-400">Loading...</div>;
  if (!offer) return <div className="min-h-screen flex items-center justify-center text-gray-400">Offer link not found</div>;

  const app = offer.application;
  const isDecided = offer.tokenUsed || decided;
  const finalStatus = decided?.offer?.status || offer.status;

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-[#0f1c3f] px-4 py-4 flex items-center gap-2">
        <div className="h-8 w-8 rounded-lg bg-blue-600 flex items-center justify-center">
          <ShieldCheck size={18} className="text-white" />
        </div>
        <p className="text-white font-semibold text-sm">EduSuite Admissions — Offer Letter</p>
      </header>

      <div className="max-w-lg mx-auto p-4 lg:p-6">
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
          <h1 className="text-lg font-bold text-gray-800 mb-1">Offer of Admission</h1>
          <p className="text-sm text-gray-500 mb-4">Application No. {app?.applicationNo}</p>

          <div className="bg-gray-50 rounded-lg p-4 text-sm space-y-1 mb-4">
            <p><span className="text-gray-400">Student:</span> {app?.student?.name}</p>
            <p><span className="text-gray-400">Class:</span> {app?.student?.classAppliedFor}</p>
            <p><span className="text-gray-400">Token Amount:</span> ₹{offer.tokenAmount?.toLocaleString('en-IN')}</p>
            <p><span className="text-gray-400">Valid Till:</span> {new Date(offer.validTill).toLocaleDateString('en-IN')}</p>
          </div>

          {offer.pdfPath && (
            <a
              href={`${serverOrigin}${offer.pdfPath}`}
              target="_blank"
              rel="noreferrer"
              className="text-blue-600 text-sm font-medium underline block mb-4"
            >
              View Offer Letter PDF
            </a>
          )}

          {isDecided ? (
            <div className="flex items-center gap-2 text-sm font-medium">
              {finalStatus === 'Accepted' ? (
                <>
                  <CheckCircle2 size={20} className="text-emerald-500" /> Offer accepted — welcome aboard!
                </>
              ) : finalStatus === 'Rejected' ? (
                <>
                  <XCircle size={20} className="text-red-500" /> Offer rejected. The seat has been released.
                </>
              ) : (
                <p className="text-gray-500">This offer has already been decided ({finalStatus}).</p>
              )}
            </div>
          ) : (
            <div className="flex gap-3">
              <button
                disabled={deciding}
                onClick={() => decide('Accepted')}
                className="flex-1 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-medium py-2.5 rounded-lg text-sm"
              >
                Accept Offer
              </button>
              <button
                disabled={deciding}
                onClick={() => decide('Rejected')}
                className="flex-1 bg-red-100 hover:bg-red-200 disabled:opacity-50 text-red-700 font-medium py-2.5 rounded-lg text-sm"
              >
                Reject Offer
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default OfferAccept;

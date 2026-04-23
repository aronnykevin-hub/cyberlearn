import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "../convex/_generated/api";
import { AlertTriangle, Send, Zap } from "lucide-react";
import { toast } from "sonner";

interface Props {
  onSuccess?: () => void;
}

const threatTypes = [
  { value: "phishing", label: "🎣 Phishing", desc: "Suspicious email or fake website" },
  { value: "malware", label: "🦠 Malware", desc: "Virus, ransomware, or malicious software" },
  { value: "suspicious_email", label: "📧 Suspicious Email", desc: "Unusual or unexpected email" },
  { value: "unauthorized_access", label: "🔓 Unauthorized Access", desc: "Someone accessing systems without permission" },
  { value: "data_breach", label: "💾 Data Breach", desc: "Sensitive data exposed or stolen" },
  { value: "social_engineering", label: "🎭 Social Engineering", desc: "Manipulation to gain information" },
  { value: "other", label: "⚠️ Other", desc: "Other security concern" },
];

const severities = [
  { value: "low", label: "Low", color: "border-green-600 bg-green-900/20 text-green-400", desc: "Minor concern" },
  { value: "medium", label: "Medium", color: "border-yellow-600 bg-yellow-900/20 text-yellow-400", desc: "Moderate risk" },
  { value: "high", label: "High", color: "border-orange-600 bg-orange-900/20 text-orange-400", desc: "Significant threat" },
  { value: "critical", label: "Critical", color: "border-red-600 bg-red-900/20 text-red-400", desc: "Immediate danger" },
];

export function ThreatReportForm({ onSuccess }: Props) {
  const submitReport = useMutation(api.threats.submitReport);
  const [type, setType] = useState<string>("");
  const [severity, setSeverity] = useState<string>("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [affectedSystems, setAffectedSystems] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!type || !severity || !title || !description) {
      toast.error("Please fill in all required fields.");
      return;
    }
    setSubmitting(true);
    try {
      await submitReport({
        type: type as any,
        severity: severity as any,
        title,
        description,
        affectedSystems: affectedSystems || undefined,
      });
      toast.success("Threat report submitted! Security team has been notified.");
      setType(""); setSeverity(""); setTitle(""); setDescription(""); setAffectedSystems("");
      onSuccess?.();
    } catch (err) {
      toast.error("Failed to submit report. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-red-500/20 rounded-xl flex items-center justify-center">
          <Zap size={20} className="text-red-400" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-white">Report a Threat</h2>
          <p className="text-gray-400 text-sm">Fast, secure reporting — your report goes directly to the security team</p>
        </div>
      </div>

      <div className="bg-red-900/20 border border-red-800 rounded-xl p-4 flex items-start gap-3">
        <AlertTriangle size={18} className="text-red-400 flex-shrink-0 mt-0.5" />
        <p className="text-red-300 text-sm">
          <strong>Emergency?</strong> If you believe a breach is actively occurring, report immediately and disconnect from the network.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Threat Type */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-3">Threat Type *</label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {threatTypes.map((t) => (
              <button
                key={t.value}
                type="button"
                onClick={() => setType(t.value)}
                className={`text-left p-3 rounded-xl border transition-all ${
                  type === t.value
                    ? "border-indigo-500 bg-indigo-500/20 text-white"
                    : "border-gray-700 bg-gray-900 text-gray-400 hover:border-gray-600"
                }`}
              >
                <div className="font-medium text-sm">{t.label}</div>
                <div className="text-xs opacity-70 mt-0.5">{t.desc}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Severity */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-3">Severity Level *</label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {severities.map((s) => (
              <button
                key={s.value}
                type="button"
                onClick={() => setSeverity(s.value)}
                className={`p-3 rounded-xl border text-center transition-all ${
                  severity === s.value ? s.color : "border-gray-700 bg-gray-900 text-gray-400 hover:border-gray-600"
                }`}
              >
                <div className="font-semibold text-sm">{s.label}</div>
                <div className="text-xs opacity-70 mt-0.5">{s.desc}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Title */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">Report Title *</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Brief description of the threat..."
            className="w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:border-indigo-500 focus:outline-none transition-colors"
          />
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">Detailed Description *</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Describe what you observed, when it happened, and any relevant details..."
            rows={4}
            className="w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:border-indigo-500 focus:outline-none transition-colors resize-none"
          />
        </div>

        {/* Affected Systems */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">Affected Systems (optional)</label>
          <input
            type="text"
            value={affectedSystems}
            onChange={(e) => setAffectedSystems(e.target.value)}
            placeholder="e.g., Email client, workstation, server name..."
            className="w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:border-indigo-500 focus:outline-none transition-colors"
          />
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="w-full flex items-center justify-center gap-2 py-3 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Send size={18} />
          {submitting ? "Submitting..." : "Submit Threat Report"}
        </button>
      </form>
    </div>
  );
}


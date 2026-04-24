import { useEffect, useMemo, useState } from 'react';
import { Award, BadgeCheck, Copy, ExternalLink, FileText, Loader2, Search, ShieldCheck } from 'lucide-react';
import { toast } from 'sonner';
import { permissionService } from '../services/permissionService';

type NormalizedCertificate = {
  id: string;
  certificateNumber: string;
  employeeName: string;
  moduleTitle: string;
  completionScore: number | null;
  issueDate: string | null;
  expiryDate: string | null;
  status: string;
  isVerified: boolean;
  pdfUrl: string | null;
  verificationCode: string | null;
};

function normalizeCertificate(cert: any): NormalizedCertificate {
  return {
    id: cert.id,
    certificateNumber: cert.certificate_number ?? cert.certificateNumber ?? 'Unknown',
    employeeName: cert.employee_name ?? cert.employeeName ?? 'Employee',
    moduleTitle: cert.module_title ?? cert.moduleTitle ?? 'Training Module',
    completionScore: cert.completion_score ?? cert.completionScore ?? null,
    issueDate: cert.issue_date ?? cert.issueDate ?? null,
    expiryDate: cert.expiry_date ?? cert.expiryDate ?? null,
    status: cert.status ?? 'issued',
    isVerified: cert.is_verified ?? cert.isVerified ?? false,
    pdfUrl: cert.pdf_url ?? cert.pdfUrl ?? null,
    verificationCode: cert.verification_code ?? cert.verificationCode ?? null,
  };
}

export function CertificatesPanel() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [certificates, setCertificates] = useState<NormalizedCertificate[]>([]);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    let mounted = true;

    const loadCertificates = async () => {
      setLoading(true);
      setError(null);

      try {
        const rows = await permissionService.getAccessibleCertificates();
        if (!mounted) return;

        setCertificates((rows || []).map(normalizeCertificate));
      } catch (loadError: any) {
        if (!mounted) return;
        setError(loadError?.message || 'Failed to load certificates.');
        setCertificates([]);
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    void loadCertificates();

    return () => {
      mounted = false;
    };
  }, []);

  const filteredCertificates = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) return certificates;

    return certificates.filter((cert) => {
      const haystack = [
        cert.certificateNumber,
        cert.employeeName,
        cert.moduleTitle,
        cert.status,
        cert.verificationCode ?? '',
      ]
        .join(' ')
        .toLowerCase();

      return haystack.includes(term);
    });
  }, [certificates, searchTerm]);

  const summary = useMemo(() => {
    const verified = certificates.filter((certificate) => certificate.isVerified).length;
    const latestIssueDate = certificates[0]?.issueDate ?? null;

    return {
      total: certificates.length,
      verified,
      latestIssueDate,
    };
  }, [certificates]);

  const handleCopy = async (value: string) => {
    try {
      await navigator.clipboard.writeText(value);
      toast.success('Certificate number copied.');
    } catch {
      toast.error('Could not copy certificate number.');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300">
            <Award size={14} />
            Certificates
          </div>
          <h2 className="mt-3 text-2xl font-bold text-slate-900 dark:text-white">Digital certificate vault</h2>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            View issued training certificates fetched directly from Supabase.
          </p>
        </div>

        <div className="relative w-full md:w-80">
          <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            placeholder="Search certificate, module, or employee"
            className="w-full rounded-xl border border-slate-200 bg-white py-3 pl-10 pr-4 text-sm text-slate-900 placeholder-slate-400 focus:border-indigo-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:placeholder-slate-500"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900">
          <p className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">Total issued</p>
          <p className="mt-2 text-3xl font-bold text-slate-900 dark:text-white">{summary.total}</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900">
          <p className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">Verified</p>
          <p className="mt-2 text-3xl font-bold text-slate-900 dark:text-white">{summary.verified}</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900">
          <p className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">Latest issue</p>
          <p className="mt-2 text-base font-semibold text-slate-900 dark:text-white">
            {summary.latestIssueDate ? new Date(summary.latestIssueDate).toLocaleDateString() : 'No certificates yet'}
          </p>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center rounded-3xl border border-dashed border-slate-300 bg-slate-50 py-16 text-slate-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400">
          <Loader2 className="mr-2 h-5 w-5 animate-spin" />
          Loading certificates...
        </div>
      ) : error ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-800 dark:bg-red-950/30 dark:text-red-200">
          {error}
        </div>
      ) : filteredCertificates.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-slate-300 bg-slate-50 p-10 text-center dark:border-slate-700 dark:bg-slate-900">
          <FileText className="mx-auto mb-3 h-10 w-10 text-slate-400" />
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white">No certificates found</h3>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
            Completed training modules will generate certificates here automatically.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
          {filteredCertificates.map((certificate) => (
            <article
              key={certificate.id}
              className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm transition-shadow hover:shadow-lg dark:border-slate-700 dark:bg-slate-900"
            >
              <div className="bg-gradient-to-br from-indigo-600 via-violet-600 to-slate-900 px-5 py-5 text-white">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-[11px] font-semibold uppercase tracking-wide">
                      <BadgeCheck size={12} />
                      {certificate.status}
                    </div>
                    <h3 className="mt-3 text-xl font-bold">{certificate.moduleTitle}</h3>
                    <p className="text-sm text-white/75">{certificate.employeeName}</p>
                  </div>
                  <div className="rounded-2xl bg-white/15 p-3">
                    <ShieldCheck size={24} />
                  </div>
                </div>
              </div>

              <div className="space-y-4 p-5">
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div className="rounded-2xl bg-slate-50 p-3 dark:bg-slate-800/70">
                    <p className="text-[11px] uppercase tracking-wide text-slate-500 dark:text-slate-400">Certificate #</p>
                    <p className="mt-1 break-all text-sm font-semibold text-slate-900 dark:text-white">
                      {certificate.certificateNumber}
                    </p>
                  </div>
                  <div className="rounded-2xl bg-slate-50 p-3 dark:bg-slate-800/70">
                    <p className="text-[11px] uppercase tracking-wide text-slate-500 dark:text-slate-400">Score</p>
                    <p className="mt-1 text-sm font-semibold text-slate-900 dark:text-white">
                      {certificate.completionScore !== null ? `${certificate.completionScore}%` : 'N/A'}
                    </p>
                  </div>
                  <div className="rounded-2xl bg-slate-50 p-3 dark:bg-slate-800/70">
                    <p className="text-[11px] uppercase tracking-wide text-slate-500 dark:text-slate-400">Issued</p>
                    <p className="mt-1 text-sm font-semibold text-slate-900 dark:text-white">
                      {certificate.issueDate ? new Date(certificate.issueDate).toLocaleString() : '—'}
                    </p>
                  </div>
                  <div className="rounded-2xl bg-slate-50 p-3 dark:bg-slate-800/70">
                    <p className="text-[11px] uppercase tracking-wide text-slate-500 dark:text-slate-400">Verified</p>
                    <p className="mt-1 text-sm font-semibold text-slate-900 dark:text-white">
                      {certificate.isVerified ? 'Yes' : 'No'}
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => void handleCopy(certificate.certificateNumber)}
                    className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                  >
                    <Copy size={14} />
                    Copy number
                  </button>

                  {certificate.pdfUrl ? (
                    <a
                      href={certificate.pdfUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-indigo-700"
                    >
                      <ExternalLink size={14} />
                      Open PDF
                    </a>
                  ) : (
                    <span className="inline-flex items-center gap-2 rounded-xl bg-slate-100 px-4 py-2 text-sm font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-400">
                      <FileText size={14} />
                      No PDF attached
                    </span>
                  )}
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}

export default CertificatesPanel;

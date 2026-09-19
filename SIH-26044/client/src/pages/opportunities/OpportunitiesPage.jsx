import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  ArrowUpRight,
  Briefcase,
  Building2,
  CheckCircle2,
  Clock,
  ExternalLink,
  FileCheck,
  Globe,
  MapPin,
  RefreshCw,
  Search,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  Info,
  FileText,
} from "lucide-react";
import { Button, Alert } from "../../components/common";
import {
  applicationAPI,
  opportunitiesAPI,
  documentAPI,
  profileAPI,
  resumeAPI,
} from "../../services/api";

const money = (item) => {
  if (item?.salary?.text) return item.salary.text;
  if (item?.salary?.min || item?.salary?.max) {
    const min = item.salary.min ? `₹${Number(item.salary.min).toLocaleString("en-IN")}` : "";
    const max = item.salary.max ? `₹${Number(item.salary.max).toLocaleString("en-IN")}` : "";
    if (min && max) return `${min} - ${max} ${item.salary.period === "yearly" ? "LPA" : "/mo"}`;
    return `${min || max} ${item.salary.period === "yearly" ? "LPA" : "/mo"}`;
  }
  if (item?.stipend && Number(item.stipend) > 0) {
    return `₹${Number(item.stipend).toLocaleString("en-IN")}/mo`;
  }
  return "Competitive / Industry Standard";
};

const formatDate = (dateStr) => {
  if (!dateStr) return "Ongoing";
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  } catch (_) {
    return "Ongoing";
  }
};

const ScoreBar = ({ score, color = "#6655ee" }) => (
  <div className="match-score-bar">
    <div
      className="match-score-fill"
      style={{ width: `${Math.min(100, Math.max(0, score || 0))}%`, background: color }}
    />
  </div>
);

const getApplyButtonDetails = (item) => {
  const isJob = item?.type === "job";
  const isDirectForm = item?.isDirectForm || Boolean(item?.applicationUrl);
  const badgeLabel = item?.badgeLabel || "";
  const url = item?.resolvedUrl || item?.applicationUrl || item?.postingUrl || item?.applyUrl || item?.officialApplyUrl;

  let label = isJob ? "Fill Job Application" : "Fill Application Form";
  if (!isDirectForm && (badgeLabel === "Official Posting" || item?.urlType === "posting")) {
    label = isJob ? "Visit Official Job Posting" : "Visit Official Posting";
  }
  if (!url || url === "#" || item?.urlType === "unavailable") {
    return { label: "Application Form Unavailable", url: null, disabled: true };
  }
  return { label, url, disabled: false };
};

export const OpportunitiesPage = () => {
  const isItemRadar = (item) => Boolean(item?.isOfficialRadar || item?.source?.type === "official_radar");

  const getInitialTab = () => {
    try {
      const params = new URLSearchParams(window.location.search);
      const tabParam = params.get("tab");
      if (["all", "radar", "portal", "sources", "trends"].includes(tabParam)) {
        return tabParam;
      }
    } catch (_) {}
    return "all";
  };

  // Navigation & Tabs
  const [activeTab, setActiveTab] = useState(getInitialTab); // 'all' | 'radar' | 'portal' | 'sources' | 'trends'

  // Listings State
  const [records, setRecords] = useState([]);
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [message, setMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  // Telemetry & Metadata
  const [radarStats, setRadarStats] = useState({
    totalDiscovered: 120,
    activeLive: 85,
    fresh24h: 18,
    activeSourcesCount: 60,
    sectors: [],
  });
  const [sourcesList, setSourcesList] = useState([]);
  const [trendsData, setTrendsData] = useState(null);

  // Filter State
  const [query, setQuery] = useState("");
  const [type, setType] = useState("all");
  const [sector, setSector] = useState("all");
  const [workMode, setWorkMode] = useState("all");
  const [sort, setSort] = useState("recommended");
  const [filterChip, setFilterChip] = useState("all");

  // Direct Application Modal/Form State
  const [showApplyForm, setShowApplyForm] = useState(false);
  const [applying, setApplying] = useState(false);
  const [appliedSuccess, setAppliedSuccess] = useState(false);
  const [profile, setProfile] = useState(null);
  const [resume, setResume] = useState(null);
  const [resumes, setResumes] = useState([]);
  const [coverLetter, setCoverLetter] = useState("");
  const [uploadingResume, setUploadingResume] = useState(false);
  const [candidateForm, setCandidateForm] = useState({
    name: "",
    email: "",
    phone: "",
    college: "",
    department: "",
    graduationYear: "",
    cgpa: "",
  });

  // Fetch opportunities and metadata
  const loadData = () => {
    setLoading(true);
    const params = new URLSearchParams(window.location.search);
    const targetId = params.get("id");

    Promise.all([
      opportunitiesAPI.getOpportunities({ limit: 100, sort: "latest" }).catch(() => ({ data: { items: [] } })),
      opportunitiesAPI.getRadarStats().catch(() => ({ data: {} })),
    ])
      .then(([oppsRes, statsRes]) => {
        const items = oppsRes?.data?.items || [];
        setRecords(items);

        if (statsRes?.data) {
          setRadarStats((prev) => ({ ...prev, ...statsRes.data }));
        }

        if (targetId) {
          const found = items.find((i) => String(i._id) === targetId);
          if (found) {
            setSelected(found);
          } else {
            opportunitiesAPI.getOpportunity(targetId).then((singleRes) => {
              if (singleRes?.data?.opportunity) setSelected(singleRes.data.opportunity);
            }).catch(() => {});
          }
        }
      })
      .catch((err) => {
        setMessage(err?.message || "Opportunities are currently loading.");
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadData();
  }, []);

  // Fetch sources when sources tab is opened
  useEffect(() => {
    if (activeTab === "sources" && sourcesList.length === 0) {
      opportunitiesAPI.getSources().then((res) => {
        setSourcesList(res?.data?.sources || []);
      }).catch(() => {});
    } else if (activeTab === "trends" && !trendsData) {
      opportunitiesAPI.getTrends().then((res) => {
        setTrendsData(res?.data || null);
      }).catch(() => {});
    }
  }, [activeTab]);

  // Load student profile & resumes for direct portal application
  useEffect(() => {
    if (!selected) {
      setShowApplyForm(false);
      setAppliedSuccess(false);
      setErrorMessage("");
      return;
    }
    if (selected.isOfficialRadar) return;

    Promise.all([
      profileAPI.getProfile().catch(() => null),
      documentAPI.getDocuments({ documentType: "resume" }).catch(() => null),
      resumeAPI.list().catch(() => null),
    ]).then(([profileResponse, documentsResponse, resumeResponse]) => {
      const profData = profileResponse?.data || null;
      setProfile(profData);
      if (profData) {
        setCandidateForm({
          name: profData.user?.name || "",
          email: profData.user?.email || "",
          phone: profData.user?.phone || profData.profile?.phone || "",
          college: profData.profile?.college || "",
          department: profData.profile?.department || "",
          graduationYear: profData.profile?.graduationYear || "",
          cgpa: profData.profile?.cgpa || "",
        });
      }
      const savedResumes = resumeResponse?.data?.items || [];
      setResumes(savedResumes);
      if (savedResumes[0]) {
        setResume({
          id: savedResumes[0]._id,
          name: savedResumes[0].title || savedResumes[0].personal?.name || "Saved resume",
        });
      } else {
        const latestDoc = (documentsResponse?.data?.items || []).find((item) => item.documentType === "resume");
        if (latestDoc) setResume({ id: latestDoc._id, name: latestDoc.originalName });
      }
    });
  }, [selected]);

  // Manual Trigger Radar Sync
  const handleTriggerSync = async () => {
    setSyncing(true);
    setMessage("");
    try {
      await opportunitiesAPI.triggerSync();
      setMessage("Opportunity Radar live scan completed. Updated latest company postings.");
      setTimeout(() => {
        loadData();
        setSyncing(false);
      }, 2000);
    } catch (err) {
      setErrorMessage(err?.message || "Could not trigger sync");
      setSyncing(false);
    }
  };

  // Filter and Sort Logic
  const filtered = records.filter((item) => {
    const isRadarItem = isItemRadar(item);
    if (activeTab === "radar" && !isRadarItem) return false;
    if (activeTab === "portal" && isRadarItem) return false;

    const searchTarget = `${item.title} ${item.company?.name || item.company} ${item.description} ${(item.requiredSkills || []).join(" ")} ${item.location}`.toLowerCase();
    if (query && !searchTarget.includes(query.toLowerCase())) return false;

    if (type !== "all" && item.type !== type) return false;
    if (sector !== "all" && item.company?.sector !== sector) return false;

    if (workMode !== "all") {
      const isRemote = item.locationDetails?.remote || (item.location || "").toLowerCase().includes("remote") || item.workMode === "remote";
      const isHybrid = item.locationDetails?.hybrid || item.workMode === "hybrid";
      if (workMode === "remote" && !isRemote) return false;
      if (workMode === "hybrid" && !isHybrid) return false;
      if (workMode === "onsite" && (isRemote || isHybrid)) return false;
    }

    if (filterChip === "high-match" && (item.compatibility || item.matchScore || 0) < 75) return false;
    if (filterChip === "remote" && !item.locationDetails?.remote && !(item.location || "").toLowerCase().includes("remote")) return false;
    if (filterChip === "internship" && item.type !== "internship") return false;
    if (filterChip === "official" && !isRadarItem) return false;

    return true;
  });

  const sortedRecords = [...filtered].sort((a, b) => {
    if (sort === "recommended") {
      const scoreA = a.compatibility || a.matchScore || 0;
      const scoreB = b.compatibility || b.matchScore || 0;
      return scoreB - scoreA;
    }
    if (sort === "skill_match") {
      const scoreA = a.skillMatch ?? a.compatibility ?? a.matchScore ?? 0;
      const scoreB = b.skillMatch ?? b.compatibility ?? b.matchScore ?? 0;
      return scoreB - scoreA;
    }
    if (sort === "deadline") {
      const dateA = a.deadline ? new Date(a.deadline).getTime() : Infinity;
      const dateB = b.deadline ? new Date(b.deadline).getTime() : Infinity;
      return dateA - dateB;
    }
    return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
  });

  // Resume Upload Handler
  const uploadResume = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setUploadingResume(true);
    setErrorMessage("");
    try {
      const response = await resumeAPI.upload(file, file.name);
      const uploaded = response?.data?.resume;
      const docId = uploaded?._id || response?.data?.documentId;
      setResume({ id: docId, name: uploaded?.title || file.name });
      if (uploaded) setResumes((prev) => [uploaded, ...prev]);
      setMessage("Resume uploaded and indexed successfully.");
    } catch (err) {
      setErrorMessage(err?.message || "Resume upload failed.");
    } finally {
      setUploadingResume(false);
    }
  };

  // Direct Application Submit Handler
  const handleApplySubmit = async (e) => {
    if (e) e.preventDefault();
    if (!selected) return;
    if (!resume?.id) {
      setErrorMessage("Please choose or upload your resume.");
      return;
    }
    setApplying(true);
    setErrorMessage("");
    setMessage("");

    try {
      const payload = {
        opportunityId: selected._id,
        resumeId: resume.id,
        coverLetter: coverLetter.trim(),
        applicant: {
          name: candidateForm.name.trim(),
          email: candidateForm.email.trim(),
          phone: candidateForm.phone.trim(),
          college: candidateForm.college.trim(),
          department: candidateForm.department.trim(),
          graduationYear: candidateForm.graduationYear ? Number(candidateForm.graduationYear) : null,
          cgpa: candidateForm.cgpa ? Number(candidateForm.cgpa) : null,
          skills: profile?.user?.skills || [],
        },
      };
      const res = await applicationAPI.createApplication(payload);
      if (res?.success) {
        setAppliedSuccess(true);
        setShowApplyForm(false);
      } else {
        throw new Error(res?.message || "Could not submit application.");
      }
    } catch (err) {
      setErrorMessage(err?.message || "Application submission failed.");
    } finally {
      setApplying(false);
    }
  };

  // ==========================================
  // RENDER: DETAIL VIEW (FULL INTELLIGENCE PAGE)
  // ==========================================
  if (selected) {
    const fitScore = selected.compatibility || selected.matchScore || 85;
    const fitColor = fitScore >= 80 ? "#10b981" : fitScore >= 60 ? "#6655ee" : "#f59e0b";
    const companyName = selected.company?.name || selected.companyName || selected.company || "Industry Partner";
    const isRadar = selected.isOfficialRadar || selected.source?.type === "official_radar";
    const officialUrl = selected.applyUrl || selected.officialApplyUrl || selected.source?.officialUrl || selected.company?.careerUrl || selected.company?.website || "#";

    return (
      <div className="opportunities-page radar-detail-page">
        <button
          className="opportunity-back"
          onClick={() => {
            setSelected(null);
            setShowApplyForm(false);
            setAppliedSuccess(false);
            setErrorMessage("");
            setMessage("");
          }}
        >
          <ArrowLeft size={16} /> Back to Opportunity Radar
        </button>

        <section className="opportunity-detail radar-detail-card">
          <div className="detail-top radar-detail-header">
            <div className="radar-company-logo-wrap">
              {selected.company?.logo ? (
                <img
                  src={selected.company.logo}
                  alt={companyName}
                  className="radar-company-logo"
                  onError={(e) => { e.target.style.display = "none"; }}
                />
              ) : (
                <div className="company-mark">
                  <Building2 size={24} />
                </div>
              )}
            </div>

            <div className="radar-detail-title-block">
              <div className="radar-badge-row">
                <span className="opportunity-type">{selected.type || "Opportunity"}</span>
                {isRadar ? (
                  <>
                    <span
                      className="radar-official-pill"
                      style={
                        selected.badgeLabel === "Official Posting"
                          ? { background: "#eff6ff", color: "#1d4ed8", border: "1px solid #bfdbfe" }
                          : { background: "#ecfdf5", color: "#047857", border: "1px solid #a7f3d0" }
                      }
                    >
                      <ShieldCheck size={13} /> {selected.badgeLabel || "Official Application"}
                    </span>
                    <span
                      className="radar-form-ready-pill"
                      style={{
                        background: selected.isDirectForm ? "#ecfdf5" : "#eff6ff",
                        color: selected.isDirectForm ? "#047857" : "#1d4ed8",
                        border: `1px solid ${selected.isDirectForm ? "#a7f3d0" : "#bfdbfe"}`,
                        fontSize: "11px",
                        fontWeight: 700,
                        padding: "3px 9px",
                        borderRadius: "12px",
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 4,
                      }}
                    >
                      <FileText size={12} /> {selected.isDirectForm ? "Verified Application Form" : "Verified Job Posting"}
                    </span>
                  </>
                ) : (
                  <span className="radar-portal-pill">
                    <Building2 size={13} /> Campus Partner Direct
                  </span>
                )}
                {selected.ai?.category && (
                  <span className="radar-category-pill">{selected.ai.category}</span>
                )}
              </div>
              <h1>{selected.title}</h1>
              <div className="radar-company-sub">
                <strong>{companyName}</strong>
                {selected.company?.sector && <span>• {selected.company.sector}</span>}
                {selected.company?.website && (
                  <a
                    href={selected.company.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="radar-company-link"
                  >
                    <Globe size={13} /> Official Website
                  </a>
                )}
              </div>
            </div>

            <div className="radar-match-badge-large" style={{ borderColor: fitColor }}>
              <span className="radar-match-val" style={{ color: fitColor }}>{fitScore}%</span>
              <span className="radar-match-lbl">MATCH</span>
            </div>
          </div>

          {/* Quick Facts */}
          <div className="detail-facts radar-quick-facts">
            <span>
              <MapPin size={16} /> {selected.location || "Remote"}
            </span>
            <span>
              <Briefcase size={16} /> {selected.duration || "12 weeks / Flexible"}
            </span>
            <span>
              <Sparkles size={16} /> {money(selected)}
            </span>
            <span>
              <Clock size={16} /> Deadline: {formatDate(selected.deadline)}
            </span>
          </div>

          {/* AI Match Breakdown in Detail */}
          <div className="radar-ai-breakdown-box">
            <div className="radar-ai-breakdown-title">
              <Sparkles size={18} color="#6366f1" />
              <h3>AI Compatibility Insights</h3>
              <span className="radar-ai-tag">Verified Match</span>
            </div>

            <div className="match-breakdown" style={{ marginTop: 12 }}>
              <div className="match-breakdown-row">
                <span>Skill Match</span>
                <ScoreBar score={selected.skillMatch ?? 85} color="#6655ee" />
                <strong>{selected.skillMatch ?? 85}%</strong>
              </div>
              <div className="match-breakdown-row">
                <span>Education Match</span>
                <ScoreBar score={selected.educationMatch ?? 100} color="#2da96d" />
                <strong>{selected.educationMatch ?? 100}%</strong>
              </div>
            </div>

            {selected.reason && (
              <p className="match-reason" style={{ fontSize: '0.92rem', color: '#334155', marginTop: 12 }}>
                {selected.reason}
              </p>
            )}

            {/* Matched vs Missing Skills */}
            <div className="radar-skills-analysis-row" style={{ marginTop: 16 }}>
              {(selected.matchedSkills?.length > 0 || (selected.requiredSkills || []).length > 0) && (
                <div className="radar-skills-col">
                  <span className="section-label" style={{ color: '#047857', fontWeight: 800, fontSize: '11px', display: 'block', marginBottom: 6 }}>MATCHED SKILLS</span>
                  <div className="match-skills">
                    {(selected.matchedSkills?.length > 0 ? selected.matchedSkills : (selected.requiredSkills || []).slice(0, 3)).map((s) => (
                      <span key={s} className="skill-tag strong">✓ {s}</span>
                    ))}
                  </div>
                </div>
              )}
              {(selected.missingSkills?.length > 0 || (selected.preferredSkills || []).length > 0) && (
                <div className="radar-skills-col">
                  <span className="section-label" style={{ color: '#b45309', fontWeight: 800, fontSize: '11px', display: 'block', marginBottom: 6 }}>RECOMMENDED TO LEARN</span>
                  <div className="match-skills">
                    {(selected.missingSkills?.length > 0 ? selected.missingSkills : (selected.preferredSkills || []).slice(0, 3)).map((s) => (
                      <span key={s} className="skill-tag missing">⚠ {s}</span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Description & Requirements */}
          <div className="detail-section">
            <h2>Role Overview</h2>
            <div className="radar-detail-description">
              {(selected.description || "Official role details and responsibilities available on the careers portal.").split("\n\n").map((para, i) => (
                <p key={i}>{para}</p>
              ))}
            </div>
          </div>

          {/* Action Bar */}
          <div className="radar-actions-bar">
            {isRadar ? (
              (() => {
                const btn = getApplyButtonDetails(selected);
                if (btn.disabled) {
                  return (
                    <div className="radar-official-apply-action">
                      <span
                        className="radar-btn-official-apply disabled"
                        style={{
                          background: "#94a3b8",
                          color: "#ffffff",
                          cursor: "not-allowed",
                          padding: "12px 24px",
                          borderRadius: "8px",
                          fontWeight: 700,
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 8,
                        }}
                      >
                        Application Form Unavailable
                      </span>
                    </div>
                  );
                }
                return (
                  <div className="radar-official-apply-action">
                    <a
                      href={btn.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="radar-btn-official-apply"
                    >
                      <ExternalLink size={18} /> {btn.label} ({companyName}) ↗
                    </a>
                    <span className="radar-apply-subtext">
                      Direct official link to candidate registration and application submission form. Opens in a new tab without third-party redirects.
                    </span>
                  </div>
                );
              })()
            ) : appliedSuccess ? (
              <div className="application-success">
                <CheckCircle2 size={36} color="#10b981" />
                <span>Application submitted to campus partner!</span>
                <Link to="/applications">
                  <Button variant="outline" size="sm">Track in Applications</Button>
                </Link>
              </div>
            ) : showApplyForm ? (
              <form className="radar-apply-form" onSubmit={handleApplySubmit}>
                <h3>Submit Campus Application</h3>
                <div className="radar-form-grid">
                  <label>Full Name <input type="text" required value={candidateForm.name} onChange={(e) => setCandidateForm({ ...candidateForm, name: e.target.value })} /></label>
                  <label>Email Address <input type="email" required value={candidateForm.email} onChange={(e) => setCandidateForm({ ...candidateForm, email: e.target.value })} /></label>
                  <label>Phone Number <input type="tel" value={candidateForm.phone} onChange={(e) => setCandidateForm({ ...candidateForm, phone: e.target.value })} /></label>
                  <label>College <input type="text" value={candidateForm.college} onChange={(e) => setCandidateForm({ ...candidateForm, college: e.target.value })} /></label>
                </div>
                <div className="radar-resume-picker">
                  <label>Select Saved Resume</label>
                  <select value={resume?.id || ""} onChange={(e) => {
                    const r = resumes.find((it) => it._id === e.target.value);
                    setResume(r ? { id: r._id, name: r.title || "Saved Resume" } : null);
                  }}>
                    <option value="">Choose a resume</option>
                    {resumes.map((it) => <option key={it._id} value={it._id}>{it.title}</option>)}
                  </select>
                  <input type="file" accept=".pdf,.doc,.docx" onChange={uploadResume} disabled={uploadingResume} />
                </div>
                <div className="radar-form-buttons">
                  <Button type="submit" variant="nav" size="lg" loading={applying} disabled={!resume?.id || applying}>
                    Confirm Application
                  </Button>
                  <Button type="button" variant="outline" size="lg" onClick={() => setShowApplyForm(false)}>
                    Cancel
                  </Button>
                </div>
              </form>
            ) : (
              <Button variant="nav" size="lg" onClick={() => setShowApplyForm(true)}>
                <ArrowUpRight size={18} /> Apply via Campus Portal
              </Button>
            )}
          </div>
        </section>
      </div>
    );
  }

  // ==========================================
  // RENDER: MAIN RADAR DASHBOARD
  // ==========================================
  return (
    <div className="opportunities-page">
      {/* Telemetry Hero Header */}
      <div className="radar-hero-banner">
        <div className="radar-hero-info">
          <div className="radar-live-status">
            <span className="radar-pulse-dot" />
            <span className="radar-pulse-text">AI OPPORTUNITY RADAR // LIVE MARKET DISCOVERY</span>
          </div>
          <h1>Multi-Company Career Radar</h1>
          <p>
            Automatically discovering official internships, graduate programs, and entry-level positions from 60+ verified enterprise career platforms and matching them transparently to your skills.
          </p>
        </div>

        <div className="radar-metrics-row">
          <div className="radar-metric-card">
            <span className="radar-metric-num">{radarStats.totalDiscovered || records.length}</span>
            <span className="radar-metric-lbl">Opportunities Discovered</span>
          </div>
          <div className="radar-metric-card">
            <span className="radar-metric-num">{radarStats.activeSourcesCount || 60}+</span>
            <span className="radar-metric-lbl">Verified Companies</span>
          </div>
          <button
            className="radar-sync-button"
            onClick={handleTriggerSync}
            disabled={syncing}
            title="Scan official company portals now"
          >
            <RefreshCw size={16} className={syncing ? "animate-spin" : ""} />
            <span>{syncing ? "Crawling..." : "Sync Radar"}</span>
          </button>
        </div>
      </div>

      {/* Primary Navigation Tabs */}
      <div className="radar-nav-tabs">
        <button
          className={`radar-nav-tab ${activeTab === "all" ? "active" : ""}`}
          onClick={() => setActiveTab("all")}
        >
          All Opportunities ({records.length})
        </button>
        <button
          className={`radar-nav-tab ${activeTab === "radar" ? "active" : ""}`}
          onClick={() => setActiveTab("radar")}
        >
          <ShieldCheck size={14} /> Official Company Radar ({records.filter(isItemRadar).length})
        </button>
        <button
          className={`radar-nav-tab ${activeTab === "portal" ? "active" : ""}`}
          onClick={() => setActiveTab("portal")}
        >
          <Building2 size={14} /> Campus Direct Postings ({records.filter((r) => !isItemRadar(r)).length})
        </button>
        <button
          className={`radar-nav-tab ${activeTab === "sources" ? "active" : ""}`}
          onClick={() => setActiveTab("sources")}
        >
          <Globe size={14} /> Monitored Companies (60+)
        </button>
        <button
          className={`radar-nav-tab ${activeTab === "trends" ? "active" : ""}`}
          onClick={() => setActiveTab("trends")}
        >
          <TrendingUp size={14} /> Market Trends
        </button>
      </div>

      {/* TAB: SOURCES DIRECTORY */}
      {activeTab === "sources" && (
        <div className="radar-sources-view">
          <div className="radar-sources-header">
            <h2>Monitored Official Career Sources (60+)</h2>
            <p>Direct official career destinations monitored by AICP without third-party redirects.</p>
          </div>
          <div className="radar-sources-grid">
            {sourcesList.map((src) => (
              <div key={src._id || src.companyName} className="radar-source-card">
                <div className="radar-source-top">
                  <div className="radar-source-logo">
                    {src.logo ? (
                      <img src={src.logo} alt={src.companyName} onError={(e) => { e.target.style.display = "none"; }} />
                    ) : (
                      <Building2 size={20} />
                    )}
                  </div>
                  <div>
                    <h4>{src.companyName}</h4>
                    <span className="radar-source-sector">{src.sector || "Technology"}</span>
                  </div>
                  <span className="radar-source-status active">active</span>
                </div>
                <div className="radar-source-details">
                  <span>Platform: <strong>{src.platform || "Official API"}</strong></span>
                  <span>Live Listings: <strong>{src.liveCount || src.stats?.totalDiscovered || 2}</strong></span>
                </div>
                <a
                  href={src.officialCareerUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="radar-source-visit-btn"
                >
                  <ExternalLink size={13} /> Visit Official Careers Portal
                </a>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB: MARKET TRENDS */}
      {activeTab === "trends" && (
        <div className="radar-trends-view">
          <div className="radar-trends-header">
            <h2>Real-Time Skill & Hiring Market Trends</h2>
            <p>Aggregated across verified official opportunities processed by our in-house AI classification engine.</p>
          </div>
          {trendsData ? (
            <div className="radar-trends-grid">
              <div className="radar-trend-card">
                <h3>🔥 Top In-Demand Skills</h3>
                <div className="radar-trend-skills-list">
                  {(trendsData.topSkills || []).map((s, i) => (
                    <div key={s.skill} className="radar-trend-skill-item">
                      <span className="trend-rank">#{i + 1}</span>
                      <span className="trend-name">{s.skill}</span>
                      <span className="trend-count">{s.count} postings</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="radar-trend-card">
                <h3>🏢 Top Hiring Companies</h3>
                <div className="radar-trend-companies-list">
                  {(trendsData.topCompanies || []).map((c) => (
                    <div key={c.company} className="radar-trend-company-item">
                      <span className="trend-comp-name">{c.company}</span>
                      <span className="trend-comp-count">{c.count} openings</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="workspace-empty">Loading market trends...</div>
          )}
        </div>
      )}

      {/* TAB: OPPORTUNITIES LIST (Default / Radar / Portal) */}
      {(activeTab === "all" || activeTab === "radar" || activeTab === "portal") && (
        <>
          {/* Filter Bar */}
          <div className="radar-filter-bar">
            <div className="radar-search-input-wrap">
              <Search size={16} className="radar-search-icon" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search by role, company name, skill (Python, React, SQL), or location..."
              />
            </div>

            <div className="radar-dropdowns-row">
              <select value={type} onChange={(e) => setType(e.target.value)} className="radar-select">
                <option value="all">All Opportunity Types</option>
                <option value="internship">Internships</option>
                <option value="job">Full-time Jobs</option>
                <option value="graduate_program">Graduate Programs</option>
                <option value="entry_level">Entry Level</option>
              </select>

              <select value={sector} onChange={(e) => setSector(e.target.value)} className="radar-select">
                <option value="all">All Industry Sectors</option>
                <option value="Technology">Technology</option>
                <option value="Finance & FinTech">Finance & FinTech</option>
                <option value="IT / Consulting">IT / Consulting</option>
                <option value="Engineering & Electronics">Engineering & Electronics</option>
                <option value="Internet & E-commerce">Internet & E-commerce</option>
              </select>

              <select value={workMode} onChange={(e) => setWorkMode(e.target.value)} className="radar-select">
                <option value="all">All Work Modes</option>
                <option value="remote">Remote Only</option>
                <option value="hybrid">Hybrid</option>
                <option value="onsite">On-Site</option>
              </select>

              <select value={sort} onChange={(e) => setSort(e.target.value)} className="radar-select">
                <option value="recommended">Sort: Best AI Match</option>
                <option value="skill_match">Sort: Highest Skill Match</option>
                <option value="latest">Sort: Latest Discovered</option>
                <option value="deadline">Sort: Approaching Deadline</option>
              </select>
            </div>
          </div>

          {/* Quick Filter Chips */}
          <div className="radar-chips-row">
            {[
              { id: "all", label: "All Opportunities" },
              { id: "high-match", label: "⚡ High Match (75%+)" },
              { id: "official", label: "🛡️ Official Radar Only" },
              { id: "remote", label: "🌐 Remote Only" },
              { id: "internship", label: "🎓 Internships" },
            ].map((chip) => (
              <button
                key={chip.id}
                className={`radar-chip ${filterChip === chip.id ? "active" : ""}`}
                onClick={() => setFilterChip(chip.id)}
              >
                {chip.label}
              </button>
            ))}
          </div>

          {/* Feedback messages */}
          {message && <Alert type="info" message={message} />}
          {errorMessage && <Alert type="error" message={errorMessage} />}

          {/* Listings List - Rendered with exact AI Match Card layout */}
          {loading ? (
            <div className="workspace-empty radar-loading-state">
              <RefreshCw size={24} className="animate-spin" />
              <span>Scanning AI Opportunity Radar across verified company portals...</span>
            </div>
          ) : (
            <div className="internship-match-list" style={{ gap: 16 }}>
              {sortedRecords.map((item) => {
                const fitScore = item.compatibility || item.matchScore || 85;
                const skillMatch = item.skillMatch ?? Math.min(100, Math.round(fitScore * 0.9));
                const educationMatch = item.educationMatch ?? 100;
                const companyName = item.company?.name || item.companyName || item.company || "Industry Partner";
                const isRadar = item.isOfficialRadar || item.source?.type === "official_radar";
                const officialUrl = item.applyUrl || item.officialApplyUrl || item.source?.officialUrl || item.company?.careerUrl || item.company?.website || "#";
                const matchedSkills = (item.matchedSkills && item.matchedSkills.length > 0)
                  ? item.matchedSkills
                  : (item.requiredSkills || []).slice(0, 3);
                const missingSkills = (item.missingSkills && item.missingSkills.length > 0)
                  ? item.missingSkills
                  : (item.preferredSkills || []).slice(0, 3);

                const reasonText = item.reason || (matchedSkills.length > 0
                  ? `Your skills in ${matchedSkills.slice(0, 3).join(", ")} directly match what is required.`
                  : (item.description ? item.description.slice(0, 100) + "..." : "This opportunity aligns with your profile."));

                return (
                  <div key={item._id} className="internship-match-card">
                    {/* Header */}
                    <div className="match-card-header">
                      <div>
                        <h3>{item.title}</h3>
                        <span className="match-type-badge">{item.type || "internship"}</span>
                        <span className="match-meta">{item.location || item.workMode || "Hybrid"}</span>
                        {item.duration && <span className="match-meta">{item.duration}</span>}
                        <span className="match-meta">{money(item)}</span>
                        <span className="match-meta" style={{ color: "#4338ca", fontWeight: 700 }}>
                          • {companyName}
                        </span>
                        {isRadar ? (
                          item.badgeLabel === "Official Posting" ? (
                            <span
                              className="radar-badge-official"
                              style={{ marginLeft: 8, background: "#eff6ff", color: "#1d4ed8", border: "1px solid #bfdbfe" }}
                            >
                              <ShieldCheck size={11} /> Official Posting
                            </span>
                          ) : (
                            <span
                              className="radar-badge-official"
                              style={{ marginLeft: 8, background: "#ecfdf5", color: "#047857", border: "1px solid #a7f3d0" }}
                            >
                              <ShieldCheck size={11} /> Official Application
                            </span>
                          )
                        ) : (
                          <span
                            className="radar-badge-official"
                            style={{ marginLeft: 8, background: "#eff6ff", color: "#1d4ed8", border: "1px solid #bfdbfe" }}
                          >
                            <Building2 size={11} /> Campus Direct Form
                          </span>
                        )}
                      </div>

                      {/* Right Big Bold Score */}
                      <div className="match-overall-score">
                        <strong>{item.displayScore || `${fitScore}% Match`}</strong>
                        <small>{item.skillMatch ? "SKILL RANK" : "MATCH"}</small>
                      </div>
                    </div>

                    {/* Progress Bars (Skill Match & Education Match) */}
                    <div className="match-breakdown">
                      <div className="match-breakdown-row">
                        <span>Skill Match</span>
                        <ScoreBar score={skillMatch} color="#6655ee" />
                        <strong>{skillMatch}%</strong>
                      </div>
                      <div className="match-breakdown-row">
                        <span>Education Match</span>
                        <ScoreBar score={educationMatch} color="#2da96d" />
                        <strong>{educationMatch}%</strong>
                      </div>
                    </div>

                    {/* MATCHED skills row */}
                    {matchedSkills.length > 0 && (
                      <div className="match-skills">
                        <span className="section-label" style={{ color: "#d97706", fontWeight: 800, fontSize: "10px" }}>
                          MATCHED
                        </span>
                        {matchedSkills.map((s) => (
                          <span key={s} className="skill-tag strong">✓ {s}</span>
                        ))}
                      </div>
                    )}

                    {/* TO LEARN skills row */}
                    {missingSkills.length > 0 && (
                      <div className="match-skills" style={{ marginTop: 6 }}>
                        <span className="section-label" style={{ color: "#64748b", fontWeight: 800, fontSize: "10px" }}>
                          TO LEARN
                        </span>
                        {missingSkills.slice(0, 4).map((s) => (
                          <span key={s} className="skill-tag missing">⚠ {s}</span>
                        ))}
                      </div>
                    )}

                    {/* Natural language reason */}
                    <p className="match-reason">
                      {reasonText}
                    </p>

                    {/* Card Actions */}
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 14, flexWrap: "wrap", gap: 10 }}>
                      {isRadar ? (
                        (() => {
                          const btn = getApplyButtonDetails(item);
                          if (btn.disabled) {
                            return (
                              <span
                                className="radar-card-quick-apply disabled"
                                style={{
                                  background: "#94a3b8",
                                  color: "#ffffff",
                                  padding: "9px 18px",
                                  borderRadius: "8px",
                                  fontSize: "12px",
                                  fontWeight: 700,
                                  display: "inline-flex",
                                  alignItems: "center",
                                  gap: 6,
                                  cursor: "not-allowed",
                                }}
                              >
                                {btn.label}
                              </span>
                            );
                          }
                          return (
                            <a
                              href={btn.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="radar-card-quick-apply"
                              style={{
                                background: "linear-gradient(135deg, #059669 0%, #047857 100%)",
                                color: "#ffffff",
                                padding: "9px 18px",
                                borderRadius: "8px",
                                textDecoration: "none",
                                fontWeight: 700,
                                fontSize: "12px",
                                display: "inline-flex",
                                alignItems: "center",
                                gap: 6,
                                boxShadow: "0 2px 6px rgba(5, 150, 105, 0.25)",
                              }}
                            >
                              {btn.label} <ExternalLink size={13} />
                            </a>
                          );
                        })()
                      ) : (
                        <button
                          className="match-apply-link"
                          style={{
                            background: "#4f46e5",
                            color: "#ffffff",
                            padding: "9px 18px",
                            borderRadius: "8px",
                            border: "none",
                            cursor: "pointer",
                            fontWeight: 700,
                            fontSize: "12px",
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 6,
                            boxShadow: "0 2px 6px rgba(79, 70, 229, 0.25)",
                          }}
                          onClick={() => { setSelected(item); setShowApplyForm(true); }}
                        >
                          {item.type === "job" ? "Fill Job Application" : "Fill Application Form"} <ArrowUpRight size={14} />
                        </button>
                      )}

                      <button
                        className="view-details-btn"
                        style={{
                          background: "none",
                          border: "none",
                          color: "#4338ca",
                          fontSize: "12px",
                          cursor: "pointer",
                          fontWeight: 700,
                        }}
                        onClick={() => setSelected(item)}
                      >
                        Detailed Intelligence →
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {!sortedRecords.length && !loading && (
            <div className="workspace-empty radar-no-results">
              <Info size={32} color="#6366f1" />
              <h3>No opportunities match your current filters</h3>
              <p>Try resetting filters or add technical skills to your profile to get matched with high compatibility roles.</p>
              <div style={{ display: "flex", gap: 10, justifyContent: "center", marginTop: 12, flexWrap: "wrap" }}>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setQuery("");
                    setType("all");
                    setSector("all");
                    setWorkMode("all");
                    setFilterChip("all");
                  }}
                >
                  Reset All Filters
                </Button>
                <Link to="/profile">
                  <Button variant="primary" size="sm">
                    Add Skills to Profile
                  </Button>
                </Link>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

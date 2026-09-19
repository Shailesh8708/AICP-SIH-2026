import React from "react";
import { LoginForm } from "../components/LoginForm";
import { Link } from "react-router-dom";
import {
  ArrowLeft,
  BrainCircuit,
  CheckCircle2,
  LayoutDashboard,
  UserCog,
  BarChart3,
  Briefcase,
  FileSearch,
  FileText,
  Copy,
  Lightbulb,
  Map,
  MessageSquare,
  Github,
  Linkedin,
  GraduationCap,
  Sparkles,
} from "lucide-react";
import { ROUTES } from "../utils/constants";
import { AICPLogo } from "../components/AICPLogo";

const studentFeatures = [
  { name: "Dashboard", icon: LayoutDashboard },
  { name: "AI Interview", icon: BrainCircuit },
  { name: "My Profile", icon: UserCog },
  { name: "Profile Score", icon: BarChart3 },
  { name: "Internship match", icon: Briefcase },
  { name: "JD Analyzer", icon: FileSearch },
  { name: "ATS Resume", icon: FileText },
  { name: "Multi Resume", icon: Copy },
  { name: "Project Ideas", icon: Lightbulb },
  { name: "Roadmap", icon: Map },
  { name: "Mock Interview", icon: MessageSquare },
  { name: "Gain Skills & Certificates", icon: GraduationCap, isNew: true },
  { name: "GitHUB", icon: Github },
  { name: "LinkedIN", icon: Linkedin },
];

export const LoginPage = () => {
  return (
    <div className="auth-page auth-login">
      <div className="auth-brand">
        <Link to={ROUTES.HOME}>
          <ArrowLeft size={17} /> Back to AICP
        </Link>
      </div>
      <div className="auth-layout">
        <div className="auth-intro">
          <AICPLogo />
          <span className="section-label">AICP AI PIPELINE</span>
          <h1>
            Welcome back to your <span>growth system.</span>
          </h1>
          <p>
            Pick up where you left off. Your next signal, connection, or
            opportunity is waiting.
          </p>
          <div className="auth-checks">
            <span>
              <CheckCircle2 size={17} /> One-time password security
            </span>
            <span>
              <CheckCircle2 size={17} /> Personalised workspace
            </span>
            <span>
              <CheckCircle2 size={17} /> Four roles, one ecosystem
            </span>
          </div>

          {/* Student Suite Feature List */}
          <div className="auth-features-showcase">
            <div className="auth-features-label">
              <Sparkles size={13} />
              <span>Integrated Student Features</span>
            </div>
            <div className="auth-features-grid">
              {studentFeatures.map((feat) => {
                const Icon = feat.icon;
                return (
                  <span
                    key={feat.name}
                    className={`auth-feature-chip ${feat.isNew ? "is-new" : ""}`}
                  >
                    <Icon size={12} />
                    <span>{feat.name}</span>
                    {feat.isNew && <span className="feature-new-badge">NEW</span>}
                  </span>
                );
              })}
            </div>
          </div>
        </div>
        <div className="auth-form-shell">
          <LoginForm />
        </div>
      </div>
    </div>
  );
};

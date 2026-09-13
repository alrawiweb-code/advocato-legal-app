"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight, CheckCircle2, ShieldCheck, Scale, FileCheck, IndianRupee, Building2, Gavel } from "lucide-react";
import { registerNewLawyer, INDIAN_STATES } from "@/lib/data/lawyers";
import { Lawyer } from "@/types";
import { useUserRole } from "@/lib/context/RoleContext";

export default function LawyerRegistrationPage() {
  const { setRole, setMyLawyerProfile } = useUserRole();
  const [step, setStep] = useState<number>(0); // 0 = Landing, 1 = Personal, 2 = Bar credentials, 3 = Pricing, 4 = Submitted
  const [registeredLawyer, setRegisteredLawyer] = useState<Lawyer | null>(null);
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    firmName: "",
    barNumber: "",
    stateBar: "Delhi (DL)",
    yearsExperience: "10+",
    primaryPractice: "Employment & Labor Law",
    hourlyRate: "2500",
    bio: "",
  });

  const handleNext = (e: React.FormEvent) => {
    e.preventDefault();
    if (step === 3) {
      const created = registerNewLawyer({
        fullName: formData.fullName,
        firmName: formData.firmName,
        email: formData.email,
        barNumber: formData.barNumber,
        stateBar: formData.stateBar,
        yearsExperience: formData.yearsExperience,
        primaryPractice: formData.primaryPractice,
        hourlyRate: formData.hourlyRate,
        bio: formData.bio,
      });
      setRegisteredLawyer(created);
      setRole("lawyer");
      setMyLawyerProfile(created);
      setStep(4);
    } else {
      setStep((prev) => prev + 1);
    }
  };

  return (
    <div className="flex-1 flex flex-col bg-surface">
      {step === 0 ? (
        /* Gateway Landing */
        <div className="flex-1 flex flex-col justify-between max-w-[1280px] w-full mx-auto px-5 md:px-8 py-8">
          <div className="flex flex-col gap-6 max-w-[650px] mx-auto text-center mt-8 md:mt-16">
            <div className="inline-flex items-center justify-center gap-2 self-center px-3.5 py-1.5 rounded-full bg-surface-container-low border border-hairline text-xs font-semibold text-primary">
              <Gavel className="w-4 h-4 text-brass" />
              <span>Join as a Lawyer</span>
            </div>

            <h1 className="font-headline text-3xl sm:text-4xl md:text-5xl text-on-surface font-semibold tracking-tight leading-tight">
              Connect with clients who need your expertise
            </h1>
            <p className="text-base md:text-lg text-on-surface-variant font-normal leading-relaxed">
              Create your profile in 2 minutes. When clients describe legal situations matching your practice area and state, we connect them directly to you.
            </p>

            <div className="flex flex-col sm:flex-row gap-3.5 mt-6 w-full max-w-[480px] mx-auto">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="bg-brass hover:bg-brass-hover text-white py-3.5 px-6 rounded-lg font-semibold text-sm transition-all shadow-[0_12px_32px_rgba(20,33,61,0.08)] flex-1 text-center hover:translate-y-[-1px] min-h-[44px]"
              >
                Create Lawyer Profile
              </button>
              <Link
                href="/lawyers"
                className="bg-transparent border border-primary text-primary py-3 px-6 rounded-lg font-semibold text-sm hover:bg-surface-container-low transition-colors flex-1 text-center flex items-center justify-center min-h-[44px]"
              >
                Browse Directory
              </Link>
            </div>

            <div className="text-center mt-8">
              <Link
                href="/"
                className="text-slate font-medium text-sm hover:underline inline-flex items-center gap-1.5"
              >
                <span>Looking for legal help instead?</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>

          {/* Benefits Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto my-16 pt-12 border-t border-hairline">
            <div className="p-6 rounded-xl bg-surface-container-lowest border border-hairline flex flex-col gap-2">
              <FileCheck className="w-6 h-6 text-brass mb-1" />
              <h3 className="font-headline text-base font-semibold text-primary">Clear Case Summaries</h3>
              <p className="text-xs text-on-surface-variant leading-relaxed">
                Receive organized summaries of client situations, timelines, and attached documents upfront.
              </p>
            </div>

            <div className="p-6 rounded-xl bg-surface-container-lowest border border-hairline flex flex-col gap-2">
              <IndianRupee className="w-6 h-6 text-brass mb-1" />
              <h3 className="font-headline text-base font-semibold text-primary">No Upfront Fees</h3>
              <p className="text-xs text-on-surface-variant leading-relaxed">
                Set your own hourly rates and consultation availability with upfront transparent pricing.
              </p>
            </div>

            <div className="p-6 rounded-xl bg-surface-container-lowest border border-hairline flex flex-col gap-2">
              <ShieldCheck className="w-6 h-6 text-brass mb-1" />
              <h3 className="font-headline text-base font-semibold text-primary">Verified Credibility</h3>
              <p className="text-xs text-on-surface-variant leading-relaxed">
                Display your verified license, practice areas, and background to earn immediate client trust.
              </p>
            </div>
          </div>

          {/* Footer */}
          <div className="pt-8 border-t border-hairline">
            <div className="flex items-center justify-between py-4">
              <span className="font-headline text-lg font-bold text-on-surface">ADVOCATO</span>
              <div className="flex gap-4">
                <Link href="/" className="text-on-surface-variant hover:text-primary transition-colors text-xs">
                  Home
                </Link>
                <Link href="/intake" className="text-on-surface-variant hover:text-primary transition-colors text-xs">
                  Get Help
                </Link>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-on-surface-variant opacity-70 pb-4">
              <div className="flex gap-4">
                <a href="#terms" className="hover:underline">Terms of Service</a>
                <a href="#privacy" className="hover:underline">Privacy Policy</a>
              </div>
              <p>&copy; 2026 Advocato. All rights reserved.</p>
            </div>
          </div>
        </div>
      ) : step === 4 ? (
        /* Success & Waiting State */
        <div className="flex-1 flex items-center justify-center p-6">
          <div className="bg-surface-container-lowest p-8 sm:p-10 rounded-2xl border border-hairline shadow-editorial max-w-lg w-full text-center space-y-5 animate-in zoom-in-95 duration-200">
            <div className="w-16 h-16 rounded-full bg-brass/10 border border-brass/30 mx-auto flex items-center justify-center text-brass">
              <CheckCircle2 className="w-10 h-10 text-brass" />
            </div>

            <div className="space-y-2">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md bg-surface-container-low border border-hairline text-xs font-semibold text-primary">
                <ShieldCheck className="w-3.5 h-3.5 text-brass" />
                <span>Verified in Lawyer Directory</span>
              </div>
              <h2 className="font-headline text-2xl sm:text-3xl font-semibold text-primary">
                Profile Created!
              </h2>
              <p className="text-xs sm:text-sm text-on-surface-variant leading-relaxed">
                Thank you, <strong>{formData.fullName}</strong>. Your profile is now live in Advocato's directory. When clients submit cases matching <strong>{formData.primaryPractice}</strong> in <strong>{formData.stateBar}</strong>, they will be matched with you.
              </p>
            </div>

            {/* Profile Recap Card */}
            <div className="p-4 bg-surface-container-low rounded-xl border border-hairline text-left text-xs space-y-2.5">
              <div className="flex justify-between pb-1.5 border-b border-hairline text-on-surface-variant">
                <span>Practice Area</span>
                <span className="font-semibold text-primary">{formData.primaryPractice}</span>
              </div>
              <div className="flex justify-between pb-1.5 border-b border-hairline text-on-surface-variant">
                <span>Consultation Rate</span>
                <span className="font-semibold text-primary">₹{Number(formData.hourlyRate || 0).toLocaleString("en-IN")} / hr</span>
              </div>
              <div className="flex justify-between pb-1.5 border-b border-hairline text-on-surface-variant">
                <span>State License</span>
                <span className="font-semibold text-primary">{formData.stateBar} ({formData.barNumber})</span>
              </div>
              <div className="flex justify-between text-on-surface-variant">
                <span>Status</span>
                <span className="font-semibold text-emerald-700 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
                  Active
                </span>
              </div>
            </div>

            <div className="pt-2 flex flex-col sm:flex-row gap-3">
              <Link
                href={registeredLawyer ? `/lawyers/${registeredLawyer.id}` : "/lawyers"}
                className="flex-1 bg-brass hover:bg-brass-hover text-white py-3 px-4 rounded-lg text-xs font-semibold shadow-sm transition-all text-center flex items-center justify-center gap-1.5 min-h-[44px]"
              >
                <span>View Live Profile</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
              <Link
                href="/intake"
                className="flex-1 bg-transparent border border-primary text-primary hover:bg-surface-container-low py-3 px-4 rounded-lg text-xs font-semibold transition-colors text-center flex items-center justify-center min-h-[44px]"
              >
                Test Case Intake
              </Link>
            </div>

            <div className="pt-1">
              <button
                type="button"
                onClick={() => {
                  setFormData({
                    fullName: "",
                    email: "",
                    firmName: "",
                    barNumber: "",
                    stateBar: "Delhi (DL)",
                    yearsExperience: "10+",
                    primaryPractice: "Employment & Labor Law",
                    hourlyRate: "2500",
                    bio: "",
                  });
                  setStep(0);
                }}
                className="text-xs text-slate hover:underline font-medium"
              >
                Register Another Lawyer Profile &rarr;
              </button>
            </div>
          </div>
        </div>
      ) : (
        /* Multi-step Registration Wizard */
        <div className="flex-1 max-w-xl w-full mx-auto px-5 py-8 flex flex-col justify-center">
          <div className="bg-surface-container-lowest p-6 sm:p-8 rounded-2xl border border-hairline shadow-editorial">
            {/* Progress Bar */}
            <div className="flex items-center justify-between text-xs text-on-surface-variant font-semibold mb-6">
              <span>Step {step} of 3</span>
              <span className="text-brass">
                {step === 1 ? "Contact Details" : step === 2 ? "License & State" : "Rates & Bio"}
              </span>
            </div>
            <div className="w-full h-1 bg-surface-container rounded-full mb-6 overflow-hidden">
              <div
                className="h-full bg-brass transition-all duration-300"
                style={{ width: `${(step / 3) * 100}%` }}
              />
            </div>

            <form onSubmit={handleNext} className="space-y-4">
              {step === 1 && (
                <>
                  <h2 className="font-headline text-xl font-semibold text-primary mb-1">Contact Details</h2>
                  <p className="text-xs text-on-surface-variant mb-4">Provide your legal practice contact information.</p>

                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-on-surface mb-1">
                      Full Name
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Jonathan Vance"
                      value={formData.fullName}
                      onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                      className="w-full bg-surface border border-hairline rounded-lg px-3.5 py-2.5 text-sm text-on-surface focus:border-slate focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-on-surface mb-1">
                      Law Firm Name (Optional)
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Vance & Partners"
                      value={formData.firmName}
                      onChange={(e) => setFormData({ ...formData, firmName: e.target.value })}
                      className="w-full bg-surface border border-hairline rounded-lg px-3.5 py-2.5 text-sm text-on-surface focus:border-slate focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-on-surface mb-1">
                      Email Address
                    </label>
                    <input
                      type="email"
                      required
                      placeholder="lawyer@firm.com"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full bg-surface border border-hairline rounded-lg px-3.5 py-2.5 text-sm text-on-surface focus:border-slate focus:outline-none"
                    />
                  </div>
                </>
              )}

              {step === 2 && (
                <>
                  <h2 className="font-headline text-xl font-semibold text-primary mb-1">License &amp; Practice Area</h2>
                  <p className="text-xs text-on-surface-variant mb-4">We verify active licenses with state licensing authorities.</p>

                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-on-surface mb-1">
                      Licensed State / Bar Council
                    </label>
                    <select
                      value={formData.stateBar}
                      onChange={(e) => setFormData({ ...formData, stateBar: e.target.value })}
                      className="editorial-select w-full bg-surface border border-hairline rounded-lg px-3.5 py-2.5 text-sm text-on-surface focus:border-slate focus:outline-none font-medium"
                    >
                      {INDIAN_STATES.map((st) => (
                        <option key={st} value={st}>
                          {st}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-on-surface mb-1">
                      State Bar Council / License Number
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Bar Council #D/5198/2018"
                      value={formData.barNumber}
                      onChange={(e) => setFormData({ ...formData, barNumber: e.target.value })}
                      className="w-full bg-surface border border-hairline rounded-lg px-3.5 py-2.5 text-sm text-on-surface focus:border-slate focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-on-surface mb-1">
                      Primary Practice Area
                    </label>
                    <select
                      value={formData.primaryPractice}
                      onChange={(e) => setFormData({ ...formData, primaryPractice: e.target.value })}
                      className="editorial-select w-full bg-surface border border-hairline rounded-lg px-3.5 py-2.5 text-sm text-on-surface focus:border-slate focus:outline-none font-medium"
                    >
                      <option>Employment & Labor Law</option>
                      <option>Corporate & Commercial Law</option>
                      <option>Intellectual Property & Patents</option>
                      <option>Commercial Litigation</option>
                      <option>Technology Transactions</option>
                    </select>
                  </div>
                </>
              )}

              {step === 3 && (
                <>
                  <h2 className="font-headline text-xl font-semibold text-primary mb-1">Rates &amp; Bio</h2>
                  <p className="text-xs text-on-surface-variant mb-4">Set your hourly fee and a brief description for clients.</p>

                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-on-surface mb-1">
                      Hourly Consultation Rate (₹ INR)
                    </label>
                    <div className="relative">
                      <span className="absolute left-3.5 top-2.5 text-sm text-on-surface-variant font-medium">₹</span>
                      <input
                        type="number"
                        required
                        placeholder="2500"
                        value={formData.hourlyRate}
                        onChange={(e) => setFormData({ ...formData, hourlyRate: e.target.value })}
                        className="w-full bg-surface border border-hairline rounded-lg pl-8 pr-3.5 py-2.5 text-sm text-on-surface focus:border-slate focus:outline-none tabular-nums"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-on-surface mb-1">
                      Short Bio / About You
                    </label>
                    <textarea
                      rows={4}
                      placeholder="Describe your background, years of experience, and types of cases you handle..."
                      value={formData.bio}
                      onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                      className="w-full bg-surface border border-hairline rounded-lg px-3.5 py-2.5 text-sm text-on-surface focus:border-slate focus:outline-none resize-none"
                    />
                  </div>
                </>
              )}

              <div className="pt-4 flex items-center justify-between gap-3">
                {step > 1 && (
                  <button
                    type="button"
                    onClick={() => setStep((prev) => prev - 1)}
                    className="px-5 py-2.5 rounded-lg border border-hairline text-xs font-semibold text-on-surface hover:bg-surface-container-low btn-editorial-secondary min-h-[44px]"
                  >
                    Back
                  </button>
                )}
                <button
                  type="submit"
                  className="flex-1 bg-brass hover:bg-brass-hover text-white text-xs font-semibold py-3 px-6 rounded-lg shadow-sm hover:shadow-md btn-editorial-brass flex items-center justify-center gap-2 ml-auto min-h-[44px]"
                >
                  <span>{step === 3 ? "Complete Registration" : "Continue"}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

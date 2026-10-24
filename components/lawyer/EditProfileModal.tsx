"use client";

import React, { useState, useEffect } from "react";
import { X, Upload, Loader2, AlertCircle, ShieldCheck, Scale, Check, Image as ImageIcon } from "lucide-react";
import { Lawyer } from "@/types";
import { getInitialsAvatar } from "@/lib/context/RoleContext";

interface EditProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  lawyer: Lawyer;
  onProfileUpdated: (updatedLawyer: any) => void;
}

export function EditProfileModal({
  isOpen,
  onClose,
  lawyer,
  onProfileUpdated,
}: EditProfileModalProps) {
  const [name, setName] = useState(lawyer.name || "");
  const [title, setTitle] = useState(lawyer.title || "Advocate");
  const [headline, setHeadline] = useState(lawyer.headline || "");
  const [yearsExperience, setYearsExperience] = useState<number | string>(
    typeof lawyer.yearsExperience === "number" ? lawyer.yearsExperience : 5
  );
  const [jurisdiction, setJurisdiction] = useState(lawyer.jurisdiction || lawyer.state || "Delhi (DL)");
  const [bio, setBio] = useState(lawyer.bio || "");
  
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(lawyer.avatar || null);
  const [removeAvatar, setRemoveAvatar] = useState(false);

  const [isSaving, setIsSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setName(lawyer.name || "");
      setTitle(lawyer.title || "Advocate");
      setHeadline(lawyer.headline || "");
      setYearsExperience(typeof lawyer.yearsExperience === "number" ? lawyer.yearsExperience : 5);
      setJurisdiction(lawyer.jurisdiction || lawyer.state || "Delhi (DL)");
      setBio(lawyer.bio || "");
      setAvatarFile(null);
      setAvatarPreview(lawyer.avatar || null);
      setRemoveAvatar(false);
      setErrorMsg(null);
    }
  }, [isOpen, lawyer]);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setErrorMsg("Image size must be less than 5MB.");
      return;
    }

    const validTypes = ["image/jpeg", "image/png", "image/webp"];
    if (!validTypes.includes(file.type)) {
      setErrorMsg("Please upload a JPEG, PNG, or WebP image.");
      return;
    }

    setErrorMsg(null);
    setAvatarFile(file);
    setRemoveAvatar(false);
    setAvatarPreview(URL.createObjectURL(file));
  };

  const handleRemoveAvatar = () => {
    setAvatarFile(null);
    setAvatarPreview(null);
    setRemoveAvatar(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!name.trim()) {
      setErrorMsg("Full name is required.");
      return;
    }

    const parsedExp = parseInt(String(yearsExperience), 10);
    if (isNaN(parsedExp) || parsedExp < 0 || parsedExp > 65) {
      setErrorMsg("Please enter a valid number of years of experience (0 to 65).");
      return;
    }

    setIsSaving(true);
    try {
      const formData = new FormData();
      formData.append("name", name.trim());
      formData.append("title", title.trim());
      formData.append("headline", headline.trim());
      formData.append("yearsExperience", parsedExp.toString());
      formData.append("jurisdiction", jurisdiction.trim());
      formData.append("bio", bio.trim());

      if (avatarFile) {
        formData.append("avatar", avatarFile);
      } else if (removeAvatar) {
        formData.append("removeAvatar", "true");
      }

      const res = await fetch(`/api/lawyers/${lawyer.id}`, {
        method: "PATCH",
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to update profile.");
      }

      const updated = {
        ...lawyer,
        name: name.trim(),
        title: title.trim(),
        headline: headline.trim(),
        yearsExperience: parsedExp,
        jurisdiction: jurisdiction.trim(),
        bio: bio.trim(),
        avatar: removeAvatar ? null : (data.avatarUrl || avatarPreview || lawyer.avatar),
      };

      onProfileUpdated(updated);
      onClose();
    } catch (err: any) {
      console.error("Profile save error:", err);
      setErrorMsg(err.message || "An error occurred while saving your profile.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-surface rounded-2xl border border-hairline shadow-editorial w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden my-auto">
        {/* Header */}
        <div className="px-6 py-4 border-b border-hairline flex items-center justify-between bg-surface-container-low/40 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-brass/10 border border-brass/30 flex items-center justify-center text-brass">
              <Scale className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-headline font-bold text-primary">
                Edit Professional Profile
              </h2>
              <p className="text-xs text-on-surface-variant">
                Update your identity details, headshot, and practice credentials.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close dialog"
            className="w-8 h-8 rounded-lg border border-hairline flex items-center justify-center text-on-surface-variant hover:text-primary hover:bg-surface-container transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-5 flex-1 text-sm">
          {errorMsg && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-800 font-medium flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Profile Photo Section */}
          <div className="p-4 bg-surface-container-lowest border border-hairline rounded-xl flex flex-col sm:flex-row items-center gap-4">
            <div className="relative w-20 h-20 rounded-full border-2 border-brass/40 bg-surface-container-low overflow-hidden shrink-0 flex items-center justify-center shadow-xs">
              {avatarPreview ? (
                <img
                  src={avatarPreview}
                  alt={name || "Counsel"}
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-2xl font-bold text-brass">
                  {name ? name.charAt(0).toUpperCase() : "A"}
                </span>
              )}
            </div>

            <div className="flex-1 text-center sm:text-left space-y-1.5">
              <div className="text-xs font-bold text-primary">Professional Headshot</div>
              <p className="text-[11px] text-on-surface-variant leading-relaxed">
                Upload a clear portrait photo (JPEG, PNG, or WebP, up to 5MB). This will be shown to clients across the directory and consultation rooms.
              </p>
              <div className="flex items-center justify-center sm:justify-start gap-2 pt-1">
                <label className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-surface-container-low hover:bg-surface-container border border-hairline text-xs font-semibold text-primary transition-colors">
                  <Upload className="w-3.5 h-3.5 text-brass" />
                  <span>Choose Photo</span>
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                </label>
                {(avatarPreview || avatarFile) && (
                  <button
                    type="button"
                    onClick={handleRemoveAvatar}
                    className="px-3 py-1.5 rounded-lg text-xs font-semibold text-rose-600 hover:bg-rose-50 transition-colors"
                  >
                    Remove
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Name & Title */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-primary mb-1">
                Full Name <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Adv. Rajesh Sharma"
                className="w-full px-3 py-2 bg-surface-container-lowest border border-hairline rounded-lg text-xs text-primary font-medium focus:border-brass focus:ring-1 focus:ring-brass outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-primary mb-1">
                Professional Title
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Senior Advocate / High Court Practitioner"
                className="w-full px-3 py-2 bg-surface-container-lowest border border-hairline rounded-lg text-xs text-primary font-medium focus:border-brass focus:ring-1 focus:ring-brass outline-none"
              />
            </div>
          </div>

          {/* Headline / Tagline */}
          <div>
            <label className="block text-xs font-semibold text-primary mb-1">
              Profile Headline / Practice Tagline
            </label>
            <input
              type="text"
              value={headline}
              onChange={(e) => setHeadline(e.target.value)}
              placeholder="e.g. Specializing in Supreme Court appeals & civil litigation"
              className="w-full px-3 py-2 bg-surface-container-lowest border border-hairline rounded-lg text-xs text-primary font-medium focus:border-brass focus:ring-1 focus:ring-brass outline-none"
            />
          </div>

          {/* Years of Experience & Jurisdiction */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-primary mb-1">
                Years of Professional Experience <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="number"
                  min="0"
                  max="65"
                  step="1"
                  required
                  value={yearsExperience}
                  onChange={(e) => setYearsExperience(e.target.value)}
                  placeholder="e.g. 8"
                  className="w-full pl-3 pr-12 py-2 bg-surface-container-lowest border border-hairline rounded-lg text-xs text-primary font-medium focus:border-brass focus:ring-1 focus:ring-brass outline-none"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-xs">
                  years
                </span>
              </div>
              <p className="text-[10px] text-on-surface-variant mt-1">
                Number of completed years enrolled with the Bar Council.
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-primary mb-1">
                Primary Jurisdiction / State Bar
              </label>
              <input
                type="text"
                value={jurisdiction}
                onChange={(e) => setJurisdiction(e.target.value)}
                placeholder="e.g. Delhi (DL)"
                className="w-full px-3 py-2 bg-surface-container-lowest border border-hairline rounded-lg text-xs text-primary font-medium focus:border-brass focus:ring-1 focus:ring-brass outline-none"
              />
              <p className="text-[10px] text-on-surface-variant mt-1">
                Bar Council jurisdiction where you actively practice.
              </p>
            </div>
          </div>

          {/* Full Biography */}
          <div>
            <label className="block text-xs font-semibold text-primary mb-1">
              Full Biography / Professional Background
            </label>
            <textarea
              rows={4}
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Provide a comprehensive summary of your practice experience, courts of practice, notable matters, and academic credentials..."
              className="w-full p-3 bg-surface-container-lowest border border-hairline rounded-lg text-xs text-primary font-medium focus:border-brass focus:ring-1 focus:ring-brass outline-none resize-none leading-relaxed"
            />
          </div>

          {/* Admin Managed Pricing Notice */}
          <div className="p-3.5 bg-surface-container-low rounded-xl border border-hairline text-xs space-y-1">
            <div className="flex items-center justify-between font-semibold text-primary">
              <span className="flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-brass" />
                <span>Official Consultation Rate</span>
              </span>
              <span className="text-brass font-bold">
                {lawyer.hourlyRate && lawyer.hourlyRate > 0
                  ? `₹${lawyer.hourlyRate.toLocaleString("en-IN")} / hr`
                  : "Pending Admin Assignment"}
              </span>
            </div>
            <p className="text-[11px] text-on-surface-variant leading-relaxed">
              Consultation fees are controlled exclusively by Advocato admissions administrators upon verification of Bar Council credentials. Lawyers cannot alter this rate directly.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="pt-2 flex items-center justify-end gap-3 border-t border-hairline shrink-0">
            <button
              type="button"
              onClick={onClose}
              disabled={isSaving}
              className="px-4 py-2 rounded-lg text-xs font-semibold text-on-surface-variant hover:bg-surface-container-low transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="px-5 py-2.5 rounded-lg bg-brass hover:bg-brass-hover disabled:opacity-50 text-white font-semibold text-xs shadow-sm transition-all flex items-center gap-2"
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Saving Profile...</span>
                </>
              ) : (
                <>
                  <Check className="w-3.5 h-3.5" />
                  <span>Save Changes</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

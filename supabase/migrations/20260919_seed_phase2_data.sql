-- ==========================================
-- AUTO-GENERATED SEED DATA
-- ==========================================

-- 1. Practice Areas
INSERT INTO public.practice_area_categories (id, name, icon, description) VALUES ('employment', 'Employment & Labour Law', 'Briefcase', 'Workplace rights, wrongful termination, severance, non-competes, and labour disputes.') ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, icon = EXCLUDED.icon, description = EXCLUDED.description;
INSERT INTO public.practice_area_categories (id, name, icon, description) VALUES ('corporate', 'Corporate & Commercial Law', 'Building2', 'Company formation, contracts, shareholder disputes, compliance, and M&A.') ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, icon = EXCLUDED.icon, description = EXCLUDED.description;
INSERT INTO public.practice_area_categories (id, name, icon, description) VALUES ('ip', 'Intellectual Property', 'Lightbulb', 'Trademarks, patents, copyrights, trade secrets, and technology licensing.') ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, icon = EXCLUDED.icon, description = EXCLUDED.description;
INSERT INTO public.practice_area_categories (id, name, icon, description) VALUES ('property', 'Property & Real Estate Law', 'Home', 'Property purchase, title verification, disputes, registration, and tenant rights.') ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, icon = EXCLUDED.icon, description = EXCLUDED.description;
INSERT INTO public.practice_area_categories (id, name, icon, description) VALUES ('family', 'Family Law', 'Users', 'Divorce, custody, maintenance, adoption, and matrimonial disputes.') ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, icon = EXCLUDED.icon, description = EXCLUDED.description;
INSERT INTO public.practice_area_categories (id, name, icon, description) VALUES ('criminal', 'Criminal Law', 'Shield', 'Bail, FIR, criminal defense, anticipatory bail, and trial representation.') ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, icon = EXCLUDED.icon, description = EXCLUDED.description;
INSERT INTO public.practice_area_categories (id, name, icon, description) VALUES ('tax', 'Tax Law', 'Calculator', 'Income tax, GST, tax disputes, assessments, and appeals.') ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, icon = EXCLUDED.icon, description = EXCLUDED.description;
INSERT INTO public.practice_area_categories (id, name, icon, description) VALUES ('cyber', 'Cyber Law & Technology', 'Monitor', 'Online fraud, data privacy, cybercrime, and digital contracts.') ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, icon = EXCLUDED.icon, description = EXCLUDED.description;
INSERT INTO public.practice_area_categories (id, name, icon, description) VALUES ('banking', 'Banking & Finance Law', 'Landmark', 'Loan recovery, NPA, SARFAESI, financial agreements, and RBI compliance.') ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, icon = EXCLUDED.icon, description = EXCLUDED.description;
INSERT INTO public.practice_area_categories (id, name, icon, description) VALUES ('consumer', 'Consumer Law', 'ShoppingBag', 'Consumer disputes, defective products, service complaints, and NCDRC matters.') ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, icon = EXCLUDED.icon, description = EXCLUDED.description;
INSERT INTO public.practice_area_categories (id, name, icon, description) VALUES ('immigration', 'Immigration Law', 'Globe', 'Visas, work permits, OCI/PIO, and immigration disputes.') ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, icon = EXCLUDED.icon, description = EXCLUDED.description;
INSERT INTO public.practice_area_categories (id, name, icon, description) VALUES ('arbitration', 'Dispute Resolution & Arbitration', 'Scale', 'Arbitration, mediation, and alternative dispute resolution.') ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, icon = EXCLUDED.icon, description = EXCLUDED.description;
INSERT INTO public.practice_area_categories (id, name, icon, description) VALUES ('environmental', 'Environmental Law', 'Leaf', 'NGT matters, pollution disputes, environmental clearance, and compliance.') ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, icon = EXCLUDED.icon, description = EXCLUDED.description;
INSERT INTO public.practice_area_categories (id, name, icon, description) VALUES ('constitutional', 'Constitutional & Administrative Law', 'BookOpen', 'Writ petitions, fundamental rights, PIL, and government/regulatory matters.') ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, icon = EXCLUDED.icon, description = EXCLUDED.description;

-- 2. Legal Services
INSERT INTO public.legal_services (id, practice_area_id, name) VALUES ('emp-severance', 'employment', 'Severance Agreement Review') ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, practice_area_id = EXCLUDED.practice_area_id;
INSERT INTO public.legal_services (id, practice_area_id, name) VALUES ('emp-termination', 'employment', 'Wrongful Termination Claim') ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, practice_area_id = EXCLUDED.practice_area_id;
INSERT INTO public.legal_services (id, practice_area_id, name) VALUES ('emp-noncompete', 'employment', 'Non-Compete / NDA Dispute') ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, practice_area_id = EXCLUDED.practice_area_id;
INSERT INTO public.legal_services (id, practice_area_id, name) VALUES ('emp-wages', 'employment', 'Unpaid Wages & Overtime') ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, practice_area_id = EXCLUDED.practice_area_id;
INSERT INTO public.legal_services (id, practice_area_id, name) VALUES ('emp-discrimination', 'employment', 'Workplace Discrimination') ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, practice_area_id = EXCLUDED.practice_area_id;
INSERT INTO public.legal_services (id, practice_area_id, name) VALUES ('emp-harassment', 'employment', 'Workplace Harassment') ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, practice_area_id = EXCLUDED.practice_area_id;
INSERT INTO public.legal_services (id, practice_area_id, name) VALUES ('emp-contract', 'employment', 'Employment Contract Review') ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, practice_area_id = EXCLUDED.practice_area_id;
INSERT INTO public.legal_services (id, practice_area_id, name) VALUES ('corp-incorporation', 'corporate', 'Company Incorporation') ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, practice_area_id = EXCLUDED.practice_area_id;
INSERT INTO public.legal_services (id, practice_area_id, name) VALUES ('corp-contract', 'corporate', 'Commercial Contract Drafting') ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, practice_area_id = EXCLUDED.practice_area_id;
INSERT INTO public.legal_services (id, practice_area_id, name) VALUES ('corp-review', 'corporate', 'Contract Review') ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, practice_area_id = EXCLUDED.practice_area_id;
INSERT INTO public.legal_services (id, practice_area_id, name) VALUES ('corp-shareholder', 'corporate', 'Shareholder Agreement') ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, practice_area_id = EXCLUDED.practice_area_id;
INSERT INTO public.legal_services (id, practice_area_id, name) VALUES ('corp-compliance', 'corporate', 'Business Compliance') ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, practice_area_id = EXCLUDED.practice_area_id;
INSERT INTO public.legal_services (id, practice_area_id, name) VALUES ('corp-diligence', 'corporate', 'Due Diligence') ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, practice_area_id = EXCLUDED.practice_area_id;
INSERT INTO public.legal_services (id, practice_area_id, name) VALUES ('corp-ma', 'corporate', 'M&A Advisory') ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, practice_area_id = EXCLUDED.practice_area_id;
INSERT INTO public.legal_services (id, practice_area_id, name) VALUES ('corp-startup', 'corporate', 'Startup Legal Advisory') ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, practice_area_id = EXCLUDED.practice_area_id;
INSERT INTO public.legal_services (id, practice_area_id, name) VALUES ('ip-trademark', 'ip', 'Trademark Registration') ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, practice_area_id = EXCLUDED.practice_area_id;
INSERT INTO public.legal_services (id, practice_area_id, name) VALUES ('ip-patent', 'ip', 'Patent Filing Advisory') ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, practice_area_id = EXCLUDED.practice_area_id;
INSERT INTO public.legal_services (id, practice_area_id, name) VALUES ('ip-copyright', 'ip', 'Copyright Protection') ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, practice_area_id = EXCLUDED.practice_area_id;
INSERT INTO public.legal_services (id, practice_area_id, name) VALUES ('ip-licensing', 'ip', 'Technology Licensing') ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, practice_area_id = EXCLUDED.practice_area_id;
INSERT INTO public.legal_services (id, practice_area_id, name) VALUES ('ip-secret', 'ip', 'Trade Secret Protection') ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, practice_area_id = EXCLUDED.practice_area_id;
INSERT INTO public.legal_services (id, practice_area_id, name) VALUES ('ip-infringement', 'ip', 'IP Infringement Dispute') ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, practice_area_id = EXCLUDED.practice_area_id;
INSERT INTO public.legal_services (id, practice_area_id, name) VALUES ('prop-title', 'property', 'Property Title Verification') ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, practice_area_id = EXCLUDED.practice_area_id;
INSERT INTO public.legal_services (id, practice_area_id, name) VALUES ('prop-agreement', 'property', 'Sale Agreement Review') ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, practice_area_id = EXCLUDED.practice_area_id;
INSERT INTO public.legal_services (id, practice_area_id, name) VALUES ('prop-diligence', 'property', 'Property Due Diligence') ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, practice_area_id = EXCLUDED.practice_area_id;
INSERT INTO public.legal_services (id, practice_area_id, name) VALUES ('prop-registration', 'property', 'Registration Assistance') ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, practice_area_id = EXCLUDED.practice_area_id;
INSERT INTO public.legal_services (id, practice_area_id, name) VALUES ('prop-dispute', 'property', 'Property Dispute Consultation') ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, practice_area_id = EXCLUDED.practice_area_id;
INSERT INTO public.legal_services (id, practice_area_id, name) VALUES ('prop-tenant', 'property', 'Tenant / Landlord Rights') ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, practice_area_id = EXCLUDED.practice_area_id;
INSERT INTO public.legal_services (id, practice_area_id, name) VALUES ('fam-divorce', 'family', 'Divorce Consultation') ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, practice_area_id = EXCLUDED.practice_area_id;
INSERT INTO public.legal_services (id, practice_area_id, name) VALUES ('fam-mutual', 'family', 'Mutual Divorce Documentation') ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, practice_area_id = EXCLUDED.practice_area_id;
INSERT INTO public.legal_services (id, practice_area_id, name) VALUES ('fam-custody', 'family', 'Child Custody Consultation') ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, practice_area_id = EXCLUDED.practice_area_id;
INSERT INTO public.legal_services (id, practice_area_id, name) VALUES ('fam-maintenance', 'family', 'Maintenance / Alimony') ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, practice_area_id = EXCLUDED.practice_area_id;
INSERT INTO public.legal_services (id, practice_area_id, name) VALUES ('fam-adoption', 'family', 'Adoption Advisory') ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, practice_area_id = EXCLUDED.practice_area_id;
INSERT INTO public.legal_services (id, practice_area_id, name) VALUES ('crim-consultation', 'criminal', 'Criminal Consultation') ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, practice_area_id = EXCLUDED.practice_area_id;
INSERT INTO public.legal_services (id, practice_area_id, name) VALUES ('crim-bail', 'criminal', 'Bail Application') ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, practice_area_id = EXCLUDED.practice_area_id;
INSERT INTO public.legal_services (id, practice_area_id, name) VALUES ('crim-anticipatory', 'criminal', 'Anticipatory Bail') ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, practice_area_id = EXCLUDED.practice_area_id;
INSERT INTO public.legal_services (id, practice_area_id, name) VALUES ('crim-fir', 'criminal', 'FIR Assistance') ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, practice_area_id = EXCLUDED.practice_area_id;
INSERT INTO public.legal_services (id, practice_area_id, name) VALUES ('crim-defense', 'criminal', 'Criminal Defense') ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, practice_area_id = EXCLUDED.practice_area_id;
INSERT INTO public.legal_services (id, practice_area_id, name) VALUES ('tax-income', 'tax', 'Income Tax Advisory') ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, practice_area_id = EXCLUDED.practice_area_id;
INSERT INTO public.legal_services (id, practice_area_id, name) VALUES ('tax-gst', 'tax', 'GST Advisory') ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, practice_area_id = EXCLUDED.practice_area_id;
INSERT INTO public.legal_services (id, practice_area_id, name) VALUES ('tax-dispute', 'tax', 'Tax Dispute Resolution') ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, practice_area_id = EXCLUDED.practice_area_id;
INSERT INTO public.legal_services (id, practice_area_id, name) VALUES ('tax-appeal', 'tax', 'Tax Appeals') ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, practice_area_id = EXCLUDED.practice_area_id;
INSERT INTO public.legal_services (id, practice_area_id, name) VALUES ('tax-compliance', 'tax', 'Corporate Tax Compliance') ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, practice_area_id = EXCLUDED.practice_area_id;
INSERT INTO public.legal_services (id, practice_area_id, name) VALUES ('cyber-fraud', 'cyber', 'Cyber Fraud Consultation') ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, practice_area_id = EXCLUDED.practice_area_id;
INSERT INTO public.legal_services (id, practice_area_id, name) VALUES ('cyber-privacy', 'cyber', 'Data Privacy & DPDP Act') ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, practice_area_id = EXCLUDED.practice_area_id;
INSERT INTO public.legal_services (id, practice_area_id, name) VALUES ('cyber-defamation', 'cyber', 'Online Defamation') ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, practice_area_id = EXCLUDED.practice_area_id;
INSERT INTO public.legal_services (id, practice_area_id, name) VALUES ('cyber-contract', 'cyber', 'Digital Contract Review') ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, practice_area_id = EXCLUDED.practice_area_id;
INSERT INTO public.legal_services (id, practice_area_id, name) VALUES ('bank-recovery', 'banking', 'Loan Recovery') ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, practice_area_id = EXCLUDED.practice_area_id;
INSERT INTO public.legal_services (id, practice_area_id, name) VALUES ('bank-npa', 'banking', 'NPA / SARFAESI Advisory') ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, practice_area_id = EXCLUDED.practice_area_id;
INSERT INTO public.legal_services (id, practice_area_id, name) VALUES ('bank-agreement', 'banking', 'Financial Agreement Review') ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, practice_area_id = EXCLUDED.practice_area_id;
INSERT INTO public.legal_services (id, practice_area_id, name) VALUES ('bank-compliance', 'banking', 'RBI Compliance') ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, practice_area_id = EXCLUDED.practice_area_id;
INSERT INTO public.legal_services (id, practice_area_id, name) VALUES ('cons-dispute', 'consumer', 'Consumer Dispute Filing') ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, practice_area_id = EXCLUDED.practice_area_id;
INSERT INTO public.legal_services (id, practice_area_id, name) VALUES ('cons-defective', 'consumer', 'Defective Product Claim') ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, practice_area_id = EXCLUDED.practice_area_id;
INSERT INTO public.legal_services (id, practice_area_id, name) VALUES ('cons-service', 'consumer', 'Service Deficiency Claim') ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, practice_area_id = EXCLUDED.practice_area_id;
INSERT INTO public.legal_services (id, practice_area_id, name) VALUES ('imm-visa', 'immigration', 'Visa Advisory') ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, practice_area_id = EXCLUDED.practice_area_id;
INSERT INTO public.legal_services (id, practice_area_id, name) VALUES ('imm-permit', 'immigration', 'Work Permit Advisory') ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, practice_area_id = EXCLUDED.practice_area_id;
INSERT INTO public.legal_services (id, practice_area_id, name) VALUES ('imm-oci', 'immigration', 'OCI / PIO Advisory') ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, practice_area_id = EXCLUDED.practice_area_id;
INSERT INTO public.legal_services (id, practice_area_id, name) VALUES ('imm-nri', 'immigration', 'NRI Legal Matters') ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, practice_area_id = EXCLUDED.practice_area_id;
INSERT INTO public.legal_services (id, practice_area_id, name) VALUES ('arb-commercial', 'arbitration', 'Commercial Arbitration') ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, practice_area_id = EXCLUDED.practice_area_id;
INSERT INTO public.legal_services (id, practice_area_id, name) VALUES ('arb-mediation', 'arbitration', 'Mediation') ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, practice_area_id = EXCLUDED.practice_area_id;
INSERT INTO public.legal_services (id, practice_area_id, name) VALUES ('arb-international', 'arbitration', 'International Arbitration') ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, practice_area_id = EXCLUDED.practice_area_id;
INSERT INTO public.legal_services (id, practice_area_id, name) VALUES ('env-ngt', 'environmental', 'NGT Matter Filing') ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, practice_area_id = EXCLUDED.practice_area_id;
INSERT INTO public.legal_services (id, practice_area_id, name) VALUES ('env-compliance', 'environmental', 'Environmental Compliance') ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, practice_area_id = EXCLUDED.practice_area_id;
INSERT INTO public.legal_services (id, practice_area_id, name) VALUES ('env-clearance', 'environmental', 'Environmental Clearance Advisory') ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, practice_area_id = EXCLUDED.practice_area_id;
INSERT INTO public.legal_services (id, practice_area_id, name) VALUES ('const-writ', 'constitutional', 'Writ Petition Filing') ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, practice_area_id = EXCLUDED.practice_area_id;
INSERT INTO public.legal_services (id, practice_area_id, name) VALUES ('const-pil', 'constitutional', 'PIL Advisory') ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, practice_area_id = EXCLUDED.practice_area_id;
INSERT INTO public.legal_services (id, practice_area_id, name) VALUES ('const-rights', 'constitutional', 'Fundamental Rights Matters') ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, practice_area_id = EXCLUDED.practice_area_id;

-- 3. Lawyer Profiles and Services
INSERT INTO auth.users (
        instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at, confirmation_token, email_change, email_change_token_new, recovery_token
      ) VALUES (
        '00000000-0000-0000-0000-000000000000',
        '00000000-0000-0000-0000-000000000001',
        'authenticated',
        'authenticated',
        'lawyer1@advocato.local',
        crypt('password123', gen_salt('bf')),
        current_timestamp,
        '{"provider":"email","providers":["email"]}',
        '{"full_name":"Sarah Jenkins, Adv.","role":"lawyer"}'::jsonb,
        current_timestamp,
        current_timestamp,
        '',
        '',
        '',
        ''
      ) ON CONFLICT (id) DO NOTHING;
INSERT INTO public.profiles (id, email, full_name, avatar_url, role) VALUES ('00000000-0000-0000-0000-000000000001', 'lawyer1@advocato.local', 'Sarah Jenkins, Adv.', 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=400', 'lawyer') ON CONFLICT (id) DO UPDATE SET full_name = EXCLUDED.full_name, avatar_url = EXCLUDED.avatar_url;
INSERT INTO public.lawyer_profiles (
        id, title, headline, bar_number, state_bar, is_verified, verification_status, availability, accepting_clients,
        years_experience, jurisdiction, state, city, hourly_rate, languages, practice_areas, tags, bio, notable_cases, rating, review_count, verified_review_count
      ) VALUES (
        '00000000-0000-0000-0000-000000000001', 'Senior Employment & Labor Counsel', 'Protecting workplace rights across Delhi and national tribunals for 14 years.', 'D/4921/2012', 'Delhi (DL)', TRUE, 'VERIFIED'::verification_status, 'Available today', TRUE, 14, 'Delhi (DL) • Bar Council #D/4921/2012', 'Delhi (DL)', 'New Delhi', 3500, ARRAY['English', 'Hindi'], ARRAY['Employment & Labour Law', 'Civil Litigation'], ARRAY['Employment Law', 'Severance Negotiation', 'Non-Competes', 'Wrongful Termination'], 'Sarah Jenkins is a seasoned employment advocate with 14 years of dedicated practice across the Delhi High Court and labour tribunals. She specializes in corporate severance negotiations, executive employment agreements, and non-compete enforceability. Sarah has represented clients ranging from junior employees facing wrongful dismissal to C-suite executives negotiating complex exit packages.', '[{"year":"2025","title":"Executive Severance Package Enhancement","summary":"Negotiated a 4.2x enhanced severance settlement for an enterprise VP following contested restructuring."},{"year":"2024","title":"Non-Compete Invalidation Relief","summary":"Secured immediate ad-interim injunction restraining enforcement of an unconscionable 24-month restrictive covenant."}]'::jsonb, 4.9, 48, 34
      ) ON CONFLICT (id) DO UPDATE SET 
        title = EXCLUDED.title, headline = EXCLUDED.headline, bar_number = EXCLUDED.bar_number, state_bar = EXCLUDED.state_bar, is_verified = EXCLUDED.is_verified, verification_status = EXCLUDED.verification_status,
        availability = EXCLUDED.availability, accepting_clients = EXCLUDED.accepting_clients, years_experience = EXCLUDED.years_experience,
        jurisdiction = EXCLUDED.jurisdiction, state = EXCLUDED.state, city = EXCLUDED.city, hourly_rate = EXCLUDED.hourly_rate,
        languages = EXCLUDED.languages, practice_areas = EXCLUDED.practice_areas, tags = EXCLUDED.tags, bio = EXCLUDED.bio, notable_cases = EXCLUDED.notable_cases,
        rating = EXCLUDED.rating, review_count = EXCLUDED.review_count, verified_review_count = EXCLUDED.verified_review_count;
INSERT INTO public.lawyer_services (lawyer_id, service_id) VALUES ('00000000-0000-0000-0000-000000000001', 'emp-severance') ON CONFLICT (lawyer_id, service_id) DO NOTHING;
INSERT INTO public.lawyer_services (lawyer_id, service_id) VALUES ('00000000-0000-0000-0000-000000000001', 'emp-termination') ON CONFLICT (lawyer_id, service_id) DO NOTHING;
INSERT INTO public.lawyer_services (lawyer_id, service_id) VALUES ('00000000-0000-0000-0000-000000000001', 'emp-noncompete') ON CONFLICT (lawyer_id, service_id) DO NOTHING;
INSERT INTO public.lawyer_services (lawyer_id, service_id) VALUES ('00000000-0000-0000-0000-000000000001', 'emp-wages') ON CONFLICT (lawyer_id, service_id) DO NOTHING;
INSERT INTO public.lawyer_services (lawyer_id, service_id) VALUES ('00000000-0000-0000-0000-000000000001', 'emp-discrimination') ON CONFLICT (lawyer_id, service_id) DO NOTHING;
INSERT INTO public.lawyer_services (lawyer_id, service_id) VALUES ('00000000-0000-0000-0000-000000000001', 'emp-contract') ON CONFLICT (lawyer_id, service_id) DO NOTHING;
INSERT INTO auth.users (
        instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at, confirmation_token, email_change, email_change_token_new, recovery_token
      ) VALUES (
        '00000000-0000-0000-0000-000000000000',
        '00000000-0000-0000-0000-000000000002',
        'authenticated',
        'authenticated',
        'lawyer2@advocato.local',
        crypt('password123', gen_salt('bf')),
        current_timestamp,
        '{"provider":"email","providers":["email"]}',
        '{"full_name":"Marcus Vance, Adv.","role":"lawyer"}'::jsonb,
        current_timestamp,
        current_timestamp,
        '',
        '',
        '',
        ''
      ) ON CONFLICT (id) DO NOTHING;
INSERT INTO public.profiles (id, email, full_name, avatar_url, role) VALUES ('00000000-0000-0000-0000-000000000002', 'lawyer2@advocato.local', 'Marcus Vance, Adv.', 'https://images.unsplash.com/photo-1556157382-97eda2d62296?auto=format&fit=crop&q=80&w=400', 'lawyer') ON CONFLICT (id) DO UPDATE SET full_name = EXCLUDED.full_name, avatar_url = EXCLUDED.avatar_url;
INSERT INTO public.lawyer_profiles (
        id, title, headline, bar_number, state_bar, is_verified, verification_status, availability, accepting_clients,
        years_experience, jurisdiction, state, city, hourly_rate, languages, practice_areas, tags, bio, notable_cases, rating, review_count, verified_review_count
      ) VALUES (
        '00000000-0000-0000-0000-000000000002', 'Partner & Commercial Litigation Counsel', 'Resolving complex corporate disputes and protecting business interests across Mumbai.', 'MAH/8291/2008', 'Maharashtra (MH)', TRUE, 'VERIFIED'::verification_status, 'Available today', TRUE, 18, 'Maharashtra (MH) • Bar Council #MAH/8291/2008', 'Maharashtra (MH)', 'Mumbai', 4500, ARRAY['English', 'Hindi', 'Marathi'], ARRAY['Corporate & Commercial Law', 'Dispute Resolution & Arbitration'], ARRAY['Corporate Law', 'Contract Structuring', 'Commercial Disputes', 'Startup Advisory'], 'Marcus Vance leads complex commercial litigation, startup governance, and corporate contract disputes for clients across Mumbai and nationwide before the Bombay High Court and NCLT. He brings 18 years of experience to shareholder deadlocks, M&A transactions, and cross-border commercial disputes.', '[{"year":"2025","title":"Commercial Contract Royalty Settlement","summary":"Recovered ₹1.85 Cr in unpaid software distribution fees and IP licensing royalties for a private technology vendor."},{"year":"2023","title":"Shareholder Deadlock Dissolution","summary":"Successfully restructured ownership terms avoiding prolonged corporate insolvency proceedings."}]'::jsonb, 5, 62, 51
      ) ON CONFLICT (id) DO UPDATE SET 
        title = EXCLUDED.title, headline = EXCLUDED.headline, bar_number = EXCLUDED.bar_number, state_bar = EXCLUDED.state_bar, is_verified = EXCLUDED.is_verified, verification_status = EXCLUDED.verification_status,
        availability = EXCLUDED.availability, accepting_clients = EXCLUDED.accepting_clients, years_experience = EXCLUDED.years_experience,
        jurisdiction = EXCLUDED.jurisdiction, state = EXCLUDED.state, city = EXCLUDED.city, hourly_rate = EXCLUDED.hourly_rate,
        languages = EXCLUDED.languages, practice_areas = EXCLUDED.practice_areas, tags = EXCLUDED.tags, bio = EXCLUDED.bio, notable_cases = EXCLUDED.notable_cases,
        rating = EXCLUDED.rating, review_count = EXCLUDED.review_count, verified_review_count = EXCLUDED.verified_review_count;
INSERT INTO public.lawyer_services (lawyer_id, service_id) VALUES ('00000000-0000-0000-0000-000000000002', 'corp-incorporation') ON CONFLICT (lawyer_id, service_id) DO NOTHING;
INSERT INTO public.lawyer_services (lawyer_id, service_id) VALUES ('00000000-0000-0000-0000-000000000002', 'corp-contract') ON CONFLICT (lawyer_id, service_id) DO NOTHING;
INSERT INTO public.lawyer_services (lawyer_id, service_id) VALUES ('00000000-0000-0000-0000-000000000002', 'corp-review') ON CONFLICT (lawyer_id, service_id) DO NOTHING;
INSERT INTO public.lawyer_services (lawyer_id, service_id) VALUES ('00000000-0000-0000-0000-000000000002', 'corp-shareholder') ON CONFLICT (lawyer_id, service_id) DO NOTHING;
INSERT INTO public.lawyer_services (lawyer_id, service_id) VALUES ('00000000-0000-0000-0000-000000000002', 'corp-compliance') ON CONFLICT (lawyer_id, service_id) DO NOTHING;
INSERT INTO public.lawyer_services (lawyer_id, service_id) VALUES ('00000000-0000-0000-0000-000000000002', 'corp-diligence') ON CONFLICT (lawyer_id, service_id) DO NOTHING;
INSERT INTO public.lawyer_services (lawyer_id, service_id) VALUES ('00000000-0000-0000-0000-000000000002', 'corp-startup') ON CONFLICT (lawyer_id, service_id) DO NOTHING;
INSERT INTO public.lawyer_services (lawyer_id, service_id) VALUES ('00000000-0000-0000-0000-000000000002', 'arb-commercial') ON CONFLICT (lawyer_id, service_id) DO NOTHING;
INSERT INTO auth.users (
        instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at, confirmation_token, email_change, email_change_token_new, recovery_token
      ) VALUES (
        '00000000-0000-0000-0000-000000000000',
        '00000000-0000-0000-0000-000000000003',
        'authenticated',
        'authenticated',
        'lawyer3@advocato.local',
        crypt('password123', gen_salt('bf')),
        current_timestamp,
        '{"provider":"email","providers":["email"]}',
        '{"full_name":"Elena Rostova, Adv.","role":"lawyer"}'::jsonb,
        current_timestamp,
        current_timestamp,
        '',
        '',
        '',
        ''
      ) ON CONFLICT (id) DO NOTHING;
INSERT INTO public.profiles (id, email, full_name, avatar_url, role) VALUES ('00000000-0000-0000-0000-000000000003', 'lawyer3@advocato.local', 'Elena Rostova, Adv.', 'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&q=80&w=400', 'lawyer') ON CONFLICT (id) DO UPDATE SET full_name = EXCLUDED.full_name, avatar_url = EXCLUDED.avatar_url;
INSERT INTO public.lawyer_profiles (
        id, title, headline, bar_number, state_bar, is_verified, verification_status, availability, accepting_clients,
        years_experience, jurisdiction, state, city, hourly_rate, languages, practice_areas, tags, bio, notable_cases, rating, review_count, verified_review_count
      ) VALUES (
        '00000000-0000-0000-0000-000000000003', 'Workplace Rights & Civil Litigator', 'Advocating for IT employees and workplace fairness in Bengaluru''s tech sector.', 'KAR/6391/2015', 'Karnataka (KA)', TRUE, 'VERIFIED'::verification_status, 'Available today', TRUE, 11, 'Karnataka (KA) • Bar Council #KAR/6391/2015', 'Karnataka (KA)', 'Bengaluru', 2500, ARRAY['English', 'Hindi', 'Kannada'], ARRAY['Employment & Labour Law', 'Civil Litigation'], ARRAY['Wage & Hour', 'Workplace Discrimination', 'Severance', 'Civil Litigation'], 'Elena Rostova is an acclaimed workplace rights counsel in Bengaluru focusing on IT employee statutory protection, severance review, and executive workplace disputes. She has represented clients in Karnataka Labour Court, Bengaluru Civil Courts, and High Court.', '[{"year":"2024","title":"Multi-Plaintiff Unpaid Compensation Resolution","summary":"Achieved full statutory back-pay settlement with statutory damages for 12 misclassified technology leads."}]'::jsonb, 4.85, 39, 27
      ) ON CONFLICT (id) DO UPDATE SET 
        title = EXCLUDED.title, headline = EXCLUDED.headline, bar_number = EXCLUDED.bar_number, state_bar = EXCLUDED.state_bar, is_verified = EXCLUDED.is_verified, verification_status = EXCLUDED.verification_status,
        availability = EXCLUDED.availability, accepting_clients = EXCLUDED.accepting_clients, years_experience = EXCLUDED.years_experience,
        jurisdiction = EXCLUDED.jurisdiction, state = EXCLUDED.state, city = EXCLUDED.city, hourly_rate = EXCLUDED.hourly_rate,
        languages = EXCLUDED.languages, practice_areas = EXCLUDED.practice_areas, tags = EXCLUDED.tags, bio = EXCLUDED.bio, notable_cases = EXCLUDED.notable_cases,
        rating = EXCLUDED.rating, review_count = EXCLUDED.review_count, verified_review_count = EXCLUDED.verified_review_count;
INSERT INTO public.lawyer_services (lawyer_id, service_id) VALUES ('00000000-0000-0000-0000-000000000003', 'emp-severance') ON CONFLICT (lawyer_id, service_id) DO NOTHING;
INSERT INTO public.lawyer_services (lawyer_id, service_id) VALUES ('00000000-0000-0000-0000-000000000003', 'emp-wages') ON CONFLICT (lawyer_id, service_id) DO NOTHING;
INSERT INTO public.lawyer_services (lawyer_id, service_id) VALUES ('00000000-0000-0000-0000-000000000003', 'emp-discrimination') ON CONFLICT (lawyer_id, service_id) DO NOTHING;
INSERT INTO public.lawyer_services (lawyer_id, service_id) VALUES ('00000000-0000-0000-0000-000000000003', 'emp-harassment') ON CONFLICT (lawyer_id, service_id) DO NOTHING;
INSERT INTO public.lawyer_services (lawyer_id, service_id) VALUES ('00000000-0000-0000-0000-000000000003', 'emp-contract') ON CONFLICT (lawyer_id, service_id) DO NOTHING;
INSERT INTO auth.users (
        instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at, confirmation_token, email_change, email_change_token_new, recovery_token
      ) VALUES (
        '00000000-0000-0000-0000-000000000000',
        '00000000-0000-0000-0000-000000000004',
        'authenticated',
        'authenticated',
        'lawyer4@advocato.local',
        crypt('password123', gen_salt('bf')),
        current_timestamp,
        '{"provider":"email","providers":["email"]}',
        '{"full_name":"David Chen, Adv.","role":"lawyer"}'::jsonb,
        current_timestamp,
        current_timestamp,
        '',
        '',
        '',
        ''
      ) ON CONFLICT (id) DO NOTHING;
INSERT INTO public.profiles (id, email, full_name, avatar_url, role) VALUES ('00000000-0000-0000-0000-000000000004', 'lawyer4@advocato.local', 'David Chen, Adv.', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=400', 'lawyer') ON CONFLICT (id) DO UPDATE SET full_name = EXCLUDED.full_name, avatar_url = EXCLUDED.avatar_url;
INSERT INTO public.lawyer_profiles (
        id, title, headline, bar_number, state_bar, is_verified, verification_status, availability, accepting_clients,
        years_experience, jurisdiction, state, city, hourly_rate, languages, practice_areas, tags, bio, notable_cases, rating, review_count, verified_review_count
      ) VALUES (
        '00000000-0000-0000-0000-000000000004', 'Technology & Intellectual Property Counsel', 'Safeguarding innovation, brands, and software across Hyderabad''s technology ecosystem.', 'TS/5109/2014', 'Telangana (TS)', TRUE, 'VERIFIED'::verification_status, 'Available today', TRUE, 12, 'Telangana (TS) • Bar Council #TS/5109/2014', 'Telangana (TS)', 'Hyderabad', 3000, ARRAY['English', 'Hindi', 'Telugu'], ARRAY['Intellectual Property', 'Corporate & Commercial Law'], ARRAY['Trademarks', 'Technology Licensing', 'Trade Secrets', 'Software Contracts'], 'David Chen assists technology founders, creators, and established corporations with brand protection, software licensing compliance, and trade secret safeguarding across Hyderabad and pan-India. He regularly appears before the IP Appellate Board and advises startups on IP strategy.', '[{"year":"2025","title":"SaaS Licensing Breach & Copyright Defense","summary":"Defended enterprise developer against unauthorized code fork and enforced perpetual licensing royalties."}]'::jsonb, 4.95, 51, 40
      ) ON CONFLICT (id) DO UPDATE SET 
        title = EXCLUDED.title, headline = EXCLUDED.headline, bar_number = EXCLUDED.bar_number, state_bar = EXCLUDED.state_bar, is_verified = EXCLUDED.is_verified, verification_status = EXCLUDED.verification_status,
        availability = EXCLUDED.availability, accepting_clients = EXCLUDED.accepting_clients, years_experience = EXCLUDED.years_experience,
        jurisdiction = EXCLUDED.jurisdiction, state = EXCLUDED.state, city = EXCLUDED.city, hourly_rate = EXCLUDED.hourly_rate,
        languages = EXCLUDED.languages, practice_areas = EXCLUDED.practice_areas, tags = EXCLUDED.tags, bio = EXCLUDED.bio, notable_cases = EXCLUDED.notable_cases,
        rating = EXCLUDED.rating, review_count = EXCLUDED.review_count, verified_review_count = EXCLUDED.verified_review_count;
INSERT INTO public.lawyer_services (lawyer_id, service_id) VALUES ('00000000-0000-0000-0000-000000000004', 'ip-trademark') ON CONFLICT (lawyer_id, service_id) DO NOTHING;
INSERT INTO public.lawyer_services (lawyer_id, service_id) VALUES ('00000000-0000-0000-0000-000000000004', 'ip-patent') ON CONFLICT (lawyer_id, service_id) DO NOTHING;
INSERT INTO public.lawyer_services (lawyer_id, service_id) VALUES ('00000000-0000-0000-0000-000000000004', 'ip-copyright') ON CONFLICT (lawyer_id, service_id) DO NOTHING;
INSERT INTO public.lawyer_services (lawyer_id, service_id) VALUES ('00000000-0000-0000-0000-000000000004', 'ip-licensing') ON CONFLICT (lawyer_id, service_id) DO NOTHING;
INSERT INTO public.lawyer_services (lawyer_id, service_id) VALUES ('00000000-0000-0000-0000-000000000004', 'ip-secret') ON CONFLICT (lawyer_id, service_id) DO NOTHING;
INSERT INTO public.lawyer_services (lawyer_id, service_id) VALUES ('00000000-0000-0000-0000-000000000004', 'ip-infringement') ON CONFLICT (lawyer_id, service_id) DO NOTHING;
INSERT INTO public.lawyer_services (lawyer_id, service_id) VALUES ('00000000-0000-0000-0000-000000000004', 'corp-contract') ON CONFLICT (lawyer_id, service_id) DO NOTHING;
INSERT INTO auth.users (
        instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at, confirmation_token, email_change, email_change_token_new, recovery_token
      ) VALUES (
        '00000000-0000-0000-0000-000000000000',
        '00000000-0000-0000-0000-000000000005',
        'authenticated',
        'authenticated',
        'lawyer5@advocato.local',
        crypt('password123', gen_salt('bf')),
        current_timestamp,
        '{"provider":"email","providers":["email"]}',
        '{"full_name":"Priya Nair, Adv.","role":"lawyer"}'::jsonb,
        current_timestamp,
        current_timestamp,
        '',
        '',
        '',
        ''
      ) ON CONFLICT (id) DO NOTHING;
INSERT INTO public.profiles (id, email, full_name, avatar_url, role) VALUES ('00000000-0000-0000-0000-000000000005', 'lawyer5@advocato.local', 'Priya Nair, Adv.', 'https://images.unsplash.com/photo-1594744803329-e58b31de8bf5?auto=format&fit=crop&q=80&w=400', 'lawyer') ON CONFLICT (id) DO UPDATE SET full_name = EXCLUDED.full_name, avatar_url = EXCLUDED.avatar_url;
INSERT INTO public.lawyer_profiles (
        id, title, headline, bar_number, state_bar, is_verified, verification_status, availability, accepting_clients,
        years_experience, jurisdiction, state, city, hourly_rate, languages, practice_areas, tags, bio, notable_cases, rating, review_count, verified_review_count
      ) VALUES (
        '00000000-0000-0000-0000-000000000005', 'Family Law & Matrimonial Specialist', 'Compassionate and effective legal representation in family and matrimonial matters.', 'KL/3821/2018', 'Kerala (KL)', TRUE, 'VERIFIED'::verification_status, 'This week', TRUE, 8, 'Kerala (KL) • Bar Council #KL/3821/2018', 'Kerala (KL)', 'Kochi', 2000, ARRAY['English', 'Malayalam', 'Hindi'], ARRAY['Family Law', 'Civil Litigation'], ARRAY['Divorce', 'Child Custody', 'Maintenance', 'Matrimonial Law'], 'Priya Nair practices family law with a client-first philosophy across Kerala Family Courts and the High Court of Kerala. She handles divorce, custody, maintenance, and domestic matters with empathy and discretion.', '[{"year":"2024","title":"Child Custody Favorable Award","summary":"Secured primary custody for mother in contested proceedings with full visitation protocol."}]'::jsonb, 4.8, 31, 22
      ) ON CONFLICT (id) DO UPDATE SET 
        title = EXCLUDED.title, headline = EXCLUDED.headline, bar_number = EXCLUDED.bar_number, state_bar = EXCLUDED.state_bar, is_verified = EXCLUDED.is_verified, verification_status = EXCLUDED.verification_status,
        availability = EXCLUDED.availability, accepting_clients = EXCLUDED.accepting_clients, years_experience = EXCLUDED.years_experience,
        jurisdiction = EXCLUDED.jurisdiction, state = EXCLUDED.state, city = EXCLUDED.city, hourly_rate = EXCLUDED.hourly_rate,
        languages = EXCLUDED.languages, practice_areas = EXCLUDED.practice_areas, tags = EXCLUDED.tags, bio = EXCLUDED.bio, notable_cases = EXCLUDED.notable_cases,
        rating = EXCLUDED.rating, review_count = EXCLUDED.review_count, verified_review_count = EXCLUDED.verified_review_count;
INSERT INTO public.lawyer_services (lawyer_id, service_id) VALUES ('00000000-0000-0000-0000-000000000005', 'fam-divorce') ON CONFLICT (lawyer_id, service_id) DO NOTHING;
INSERT INTO public.lawyer_services (lawyer_id, service_id) VALUES ('00000000-0000-0000-0000-000000000005', 'fam-mutual') ON CONFLICT (lawyer_id, service_id) DO NOTHING;
INSERT INTO public.lawyer_services (lawyer_id, service_id) VALUES ('00000000-0000-0000-0000-000000000005', 'fam-custody') ON CONFLICT (lawyer_id, service_id) DO NOTHING;
INSERT INTO public.lawyer_services (lawyer_id, service_id) VALUES ('00000000-0000-0000-0000-000000000005', 'fam-maintenance') ON CONFLICT (lawyer_id, service_id) DO NOTHING;
INSERT INTO public.lawyer_services (lawyer_id, service_id) VALUES ('00000000-0000-0000-0000-000000000005', 'fam-adoption') ON CONFLICT (lawyer_id, service_id) DO NOTHING;
INSERT INTO auth.users (
        instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at, confirmation_token, email_change, email_change_token_new, recovery_token
      ) VALUES (
        '00000000-0000-0000-0000-000000000000',
        '00000000-0000-0000-0000-000000000006',
        'authenticated',
        'authenticated',
        'lawyer6@advocato.local',
        crypt('password123', gen_salt('bf')),
        current_timestamp,
        '{"provider":"email","providers":["email"]}',
        '{"full_name":"Rahul Sharma, Adv.","role":"lawyer"}'::jsonb,
        current_timestamp,
        current_timestamp,
        '',
        '',
        '',
        ''
      ) ON CONFLICT (id) DO NOTHING;
INSERT INTO public.profiles (id, email, full_name, avatar_url, role) VALUES ('00000000-0000-0000-0000-000000000006', 'lawyer6@advocato.local', 'Rahul Sharma, Adv.', 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=400', 'lawyer') ON CONFLICT (id) DO UPDATE SET full_name = EXCLUDED.full_name, avatar_url = EXCLUDED.avatar_url;
INSERT INTO public.lawyer_profiles (
        id, title, headline, bar_number, state_bar, is_verified, verification_status, availability, accepting_clients,
        years_experience, jurisdiction, state, city, hourly_rate, languages, practice_areas, tags, bio, notable_cases, rating, review_count, verified_review_count
      ) VALUES (
        '00000000-0000-0000-0000-000000000006', 'Senior Property & Real Estate Counsel', 'Protecting real estate investments and resolving property disputes across North India.', 'UP/7129/2010', 'Uttar Pradesh (UP)', TRUE, 'VERIFIED'::verification_status, 'Available today', TRUE, 16, 'Uttar Pradesh (UP) • Bar Council #UP/7129/2010', 'Uttar Pradesh (UP)', 'Lucknow', 2800, ARRAY['English', 'Hindi', 'Urdu'], ARRAY['Property & Real Estate Law', 'Civil Litigation'], ARRAY['Property Title', 'Sale Agreement', 'Property Disputes', 'RERA'], 'Rahul Sharma is a senior property lawyer based in Lucknow with 16 years of experience handling residential and commercial property disputes, RERA matters, title verifications, and registration across Uttar Pradesh.', '[{"year":"2024","title":"RERA Delayed Possession Compensation","summary":"Obtained full compensation and penalty from a builder for 3-year delayed possession of residential units."}]'::jsonb, 4.7, 57, 41
      ) ON CONFLICT (id) DO UPDATE SET 
        title = EXCLUDED.title, headline = EXCLUDED.headline, bar_number = EXCLUDED.bar_number, state_bar = EXCLUDED.state_bar, is_verified = EXCLUDED.is_verified, verification_status = EXCLUDED.verification_status,
        availability = EXCLUDED.availability, accepting_clients = EXCLUDED.accepting_clients, years_experience = EXCLUDED.years_experience,
        jurisdiction = EXCLUDED.jurisdiction, state = EXCLUDED.state, city = EXCLUDED.city, hourly_rate = EXCLUDED.hourly_rate,
        languages = EXCLUDED.languages, practice_areas = EXCLUDED.practice_areas, tags = EXCLUDED.tags, bio = EXCLUDED.bio, notable_cases = EXCLUDED.notable_cases,
        rating = EXCLUDED.rating, review_count = EXCLUDED.review_count, verified_review_count = EXCLUDED.verified_review_count;
INSERT INTO public.lawyer_services (lawyer_id, service_id) VALUES ('00000000-0000-0000-0000-000000000006', 'prop-title') ON CONFLICT (lawyer_id, service_id) DO NOTHING;
INSERT INTO public.lawyer_services (lawyer_id, service_id) VALUES ('00000000-0000-0000-0000-000000000006', 'prop-agreement') ON CONFLICT (lawyer_id, service_id) DO NOTHING;
INSERT INTO public.lawyer_services (lawyer_id, service_id) VALUES ('00000000-0000-0000-0000-000000000006', 'prop-diligence') ON CONFLICT (lawyer_id, service_id) DO NOTHING;
INSERT INTO public.lawyer_services (lawyer_id, service_id) VALUES ('00000000-0000-0000-0000-000000000006', 'prop-registration') ON CONFLICT (lawyer_id, service_id) DO NOTHING;
INSERT INTO public.lawyer_services (lawyer_id, service_id) VALUES ('00000000-0000-0000-0000-000000000006', 'prop-dispute') ON CONFLICT (lawyer_id, service_id) DO NOTHING;
INSERT INTO public.lawyer_services (lawyer_id, service_id) VALUES ('00000000-0000-0000-0000-000000000006', 'prop-tenant') ON CONFLICT (lawyer_id, service_id) DO NOTHING;
INSERT INTO auth.users (
        instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at, confirmation_token, email_change, email_change_token_new, recovery_token
      ) VALUES (
        '00000000-0000-0000-0000-000000000000',
        '00000000-0000-0000-0000-000000000007',
        'authenticated',
        'authenticated',
        'lawyer7@advocato.local',
        crypt('password123', gen_salt('bf')),
        current_timestamp,
        '{"provider":"email","providers":["email"]}',
        '{"full_name":"Arjun Mehta, Adv.","role":"lawyer"}'::jsonb,
        current_timestamp,
        current_timestamp,
        '',
        '',
        '',
        ''
      ) ON CONFLICT (id) DO NOTHING;
INSERT INTO public.profiles (id, email, full_name, avatar_url, role) VALUES ('00000000-0000-0000-0000-000000000007', 'lawyer7@advocato.local', 'Arjun Mehta, Adv.', 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=400', 'lawyer') ON CONFLICT (id) DO UPDATE SET full_name = EXCLUDED.full_name, avatar_url = EXCLUDED.avatar_url;
INSERT INTO public.lawyer_profiles (
        id, title, headline, bar_number, state_bar, is_verified, verification_status, availability, accepting_clients,
        years_experience, jurisdiction, state, city, hourly_rate, languages, practice_areas, tags, bio, notable_cases, rating, review_count, verified_review_count
      ) VALUES (
        '00000000-0000-0000-0000-000000000007', 'Criminal Defense Specialist', 'Two decades of criminal defense advocacy across Gujarat High Court and Sessions Courts.', 'GJ/2291/2006', 'Gujarat (GJ)', TRUE, 'VERIFIED'::verification_status, 'This week', TRUE, 20, 'Gujarat (GJ) • Bar Council #GJ/2291/2006', 'Gujarat (GJ)', 'Ahmedabad', 3200, ARRAY['English', 'Hindi', 'Gujarati'], ARRAY['Criminal Law'], ARRAY['Criminal Defense', 'Bail Applications', 'FIR Matters', 'Sessions Court'], 'Arjun Mehta is one of Ahmedabad''s most experienced criminal defense advocates with 20 years of practice across Sessions Courts and the Gujarat High Court. He handles bail matters, anticipatory bail, white-collar defense, and trial representation.', '[{"year":"2023","title":"Anticipatory Bail in White-Collar Matter","summary":"Secured anticipatory bail for a senior executive accused in a corporate fraud investigation."}]'::jsonb, 4.75, 44, 29
      ) ON CONFLICT (id) DO UPDATE SET 
        title = EXCLUDED.title, headline = EXCLUDED.headline, bar_number = EXCLUDED.bar_number, state_bar = EXCLUDED.state_bar, is_verified = EXCLUDED.is_verified, verification_status = EXCLUDED.verification_status,
        availability = EXCLUDED.availability, accepting_clients = EXCLUDED.accepting_clients, years_experience = EXCLUDED.years_experience,
        jurisdiction = EXCLUDED.jurisdiction, state = EXCLUDED.state, city = EXCLUDED.city, hourly_rate = EXCLUDED.hourly_rate,
        languages = EXCLUDED.languages, practice_areas = EXCLUDED.practice_areas, tags = EXCLUDED.tags, bio = EXCLUDED.bio, notable_cases = EXCLUDED.notable_cases,
        rating = EXCLUDED.rating, review_count = EXCLUDED.review_count, verified_review_count = EXCLUDED.verified_review_count;
INSERT INTO public.lawyer_services (lawyer_id, service_id) VALUES ('00000000-0000-0000-0000-000000000007', 'crim-consultation') ON CONFLICT (lawyer_id, service_id) DO NOTHING;
INSERT INTO public.lawyer_services (lawyer_id, service_id) VALUES ('00000000-0000-0000-0000-000000000007', 'crim-bail') ON CONFLICT (lawyer_id, service_id) DO NOTHING;
INSERT INTO public.lawyer_services (lawyer_id, service_id) VALUES ('00000000-0000-0000-0000-000000000007', 'crim-anticipatory') ON CONFLICT (lawyer_id, service_id) DO NOTHING;
INSERT INTO public.lawyer_services (lawyer_id, service_id) VALUES ('00000000-0000-0000-0000-000000000007', 'crim-fir') ON CONFLICT (lawyer_id, service_id) DO NOTHING;
INSERT INTO public.lawyer_services (lawyer_id, service_id) VALUES ('00000000-0000-0000-0000-000000000007', 'crim-defense') ON CONFLICT (lawyer_id, service_id) DO NOTHING;
INSERT INTO auth.users (
        instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at, confirmation_token, email_change, email_change_token_new, recovery_token
      ) VALUES (
        '00000000-0000-0000-0000-000000000000',
        '00000000-0000-0000-0000-000000000008',
        'authenticated',
        'authenticated',
        'lawyer8@advocato.local',
        crypt('password123', gen_salt('bf')),
        current_timestamp,
        '{"provider":"email","providers":["email"]}',
        '{"full_name":"Amitha Rao, Adv.","role":"lawyer"}'::jsonb,
        current_timestamp,
        current_timestamp,
        '',
        '',
        '',
        ''
      ) ON CONFLICT (id) DO NOTHING;
INSERT INTO public.profiles (id, email, full_name, avatar_url, role) VALUES ('00000000-0000-0000-0000-000000000008', 'lawyer8@advocato.local', 'Amitha Rao, Adv.', 'https://images.unsplash.com/photo-1614644147798-f8c0fc9da7f6?auto=format&fit=crop&q=80&w=400', 'lawyer') ON CONFLICT (id) DO UPDATE SET full_name = EXCLUDED.full_name, avatar_url = EXCLUDED.avatar_url;
INSERT INTO public.lawyer_profiles (
        id, title, headline, bar_number, state_bar, is_verified, verification_status, availability, accepting_clients,
        years_experience, jurisdiction, state, city, hourly_rate, languages, practice_areas, tags, bio, notable_cases, rating, review_count, verified_review_count
      ) VALUES (
        '00000000-0000-0000-0000-000000000008', 'Tax & GST Advisory Counsel', 'Clear, practical tax guidance for individuals and businesses in Hyderabad.', 'TS/9183/2020', 'Telangana (TS)', FALSE, 'PENDING'::verification_status, 'Available today', TRUE, 6, 'Telangana (TS) • Bar Council #TS/9183/2020', 'Telangana (TS)', 'Hyderabad', 2200, ARRAY['English', 'Telugu', 'Hindi'], ARRAY['Tax Law'], ARRAY['Income Tax', 'GST', 'Tax Appeals', 'Corporate Tax'], 'Amitha Rao advises individuals and corporate clients on income tax compliance, GST assessments, and tax dispute resolution before the Income Tax Appellate Tribunal and GST Authority.', '[{"year":"2024","title":"GST Demand Dismissal","summary":"Successfully contested a ₹28L GST demand before the Hyderabad GST Authority citing procedural irregularities."}]'::jsonb, 4.6, 18, 11
      ) ON CONFLICT (id) DO UPDATE SET 
        title = EXCLUDED.title, headline = EXCLUDED.headline, bar_number = EXCLUDED.bar_number, state_bar = EXCLUDED.state_bar, is_verified = EXCLUDED.is_verified, verification_status = EXCLUDED.verification_status,
        availability = EXCLUDED.availability, accepting_clients = EXCLUDED.accepting_clients, years_experience = EXCLUDED.years_experience,
        jurisdiction = EXCLUDED.jurisdiction, state = EXCLUDED.state, city = EXCLUDED.city, hourly_rate = EXCLUDED.hourly_rate,
        languages = EXCLUDED.languages, practice_areas = EXCLUDED.practice_areas, tags = EXCLUDED.tags, bio = EXCLUDED.bio, notable_cases = EXCLUDED.notable_cases,
        rating = EXCLUDED.rating, review_count = EXCLUDED.review_count, verified_review_count = EXCLUDED.verified_review_count;
INSERT INTO public.lawyer_services (lawyer_id, service_id) VALUES ('00000000-0000-0000-0000-000000000008', 'tax-income') ON CONFLICT (lawyer_id, service_id) DO NOTHING;
INSERT INTO public.lawyer_services (lawyer_id, service_id) VALUES ('00000000-0000-0000-0000-000000000008', 'tax-gst') ON CONFLICT (lawyer_id, service_id) DO NOTHING;
INSERT INTO public.lawyer_services (lawyer_id, service_id) VALUES ('00000000-0000-0000-0000-000000000008', 'tax-dispute') ON CONFLICT (lawyer_id, service_id) DO NOTHING;
INSERT INTO public.lawyer_services (lawyer_id, service_id) VALUES ('00000000-0000-0000-0000-000000000008', 'tax-appeal') ON CONFLICT (lawyer_id, service_id) DO NOTHING;
INSERT INTO public.lawyer_services (lawyer_id, service_id) VALUES ('00000000-0000-0000-0000-000000000008', 'tax-compliance') ON CONFLICT (lawyer_id, service_id) DO NOTHING;
INSERT INTO auth.users (
        instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at, confirmation_token, email_change, email_change_token_new, recovery_token
      ) VALUES (
        '00000000-0000-0000-0000-000000000000',
        '00000000-0000-0000-0000-000000000009',
        'authenticated',
        'authenticated',
        'lawyer9@advocato.local',
        crypt('password123', gen_salt('bf')),
        current_timestamp,
        '{"provider":"email","providers":["email"]}',
        '{"full_name":"Vikram Bose, Adv.","role":"lawyer"}'::jsonb,
        current_timestamp,
        current_timestamp,
        '',
        '',
        '',
        ''
      ) ON CONFLICT (id) DO NOTHING;
INSERT INTO public.profiles (id, email, full_name, avatar_url, role) VALUES ('00000000-0000-0000-0000-000000000009', 'lawyer9@advocato.local', 'Vikram Bose, Adv.', 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&q=80&w=400', 'lawyer') ON CONFLICT (id) DO UPDATE SET full_name = EXCLUDED.full_name, avatar_url = EXCLUDED.avatar_url;
INSERT INTO public.lawyer_profiles (
        id, title, headline, bar_number, state_bar, is_verified, verification_status, availability, accepting_clients,
        years_experience, jurisdiction, state, city, hourly_rate, languages, practice_areas, tags, bio, notable_cases, rating, review_count, verified_review_count
      ) VALUES (
        '00000000-0000-0000-0000-000000000009', 'Consumer Rights & Cyber Law Advocate', 'Helping individuals fight online fraud, defective products, and service failures.', 'WB/4471/2017', 'West Bengal (WB)', TRUE, 'VERIFIED'::verification_status, 'Next week', TRUE, 9, 'West Bengal (WB) • Bar Council #WB/4471/2017', 'West Bengal (WB)', 'Kolkata', 1800, ARRAY['English', 'Bengali', 'Hindi'], ARRAY['Consumer Law', 'Cyber Law & Technology'], ARRAY['Consumer Rights', 'Cyber Fraud', 'Online Defamation', 'Data Privacy'], 'Vikram Bose practices consumer rights law and cyber law in Kolkata with appearances before Consumer Disputes Redressal Commissions and Cyber Crime Cells across West Bengal.', '[{"year":"2024","title":"Online Fraud Recovery","summary":"Assisted victim in recovering ₹4.2L from an e-commerce fraudster through parallel civil and police proceedings."}]'::jsonb, 4.65, 26, 18
      ) ON CONFLICT (id) DO UPDATE SET 
        title = EXCLUDED.title, headline = EXCLUDED.headline, bar_number = EXCLUDED.bar_number, state_bar = EXCLUDED.state_bar, is_verified = EXCLUDED.is_verified, verification_status = EXCLUDED.verification_status,
        availability = EXCLUDED.availability, accepting_clients = EXCLUDED.accepting_clients, years_experience = EXCLUDED.years_experience,
        jurisdiction = EXCLUDED.jurisdiction, state = EXCLUDED.state, city = EXCLUDED.city, hourly_rate = EXCLUDED.hourly_rate,
        languages = EXCLUDED.languages, practice_areas = EXCLUDED.practice_areas, tags = EXCLUDED.tags, bio = EXCLUDED.bio, notable_cases = EXCLUDED.notable_cases,
        rating = EXCLUDED.rating, review_count = EXCLUDED.review_count, verified_review_count = EXCLUDED.verified_review_count;
INSERT INTO public.lawyer_services (lawyer_id, service_id) VALUES ('00000000-0000-0000-0000-000000000009', 'cons-dispute') ON CONFLICT (lawyer_id, service_id) DO NOTHING;
INSERT INTO public.lawyer_services (lawyer_id, service_id) VALUES ('00000000-0000-0000-0000-000000000009', 'cons-defective') ON CONFLICT (lawyer_id, service_id) DO NOTHING;
INSERT INTO public.lawyer_services (lawyer_id, service_id) VALUES ('00000000-0000-0000-0000-000000000009', 'cons-service') ON CONFLICT (lawyer_id, service_id) DO NOTHING;
INSERT INTO public.lawyer_services (lawyer_id, service_id) VALUES ('00000000-0000-0000-0000-000000000009', 'cyber-fraud') ON CONFLICT (lawyer_id, service_id) DO NOTHING;
INSERT INTO public.lawyer_services (lawyer_id, service_id) VALUES ('00000000-0000-0000-0000-000000000009', 'cyber-privacy') ON CONFLICT (lawyer_id, service_id) DO NOTHING;
INSERT INTO public.lawyer_services (lawyer_id, service_id) VALUES ('00000000-0000-0000-0000-000000000009', 'cyber-defamation') ON CONFLICT (lawyer_id, service_id) DO NOTHING;
INSERT INTO auth.users (
        instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at, confirmation_token, email_change, email_change_token_new, recovery_token
      ) VALUES (
        '00000000-0000-0000-0000-000000000000',
        '00000000-0000-0000-0000-00000000000a',
        'authenticated',
        'authenticated',
        'lawyer10@advocato.local',
        crypt('password123', gen_salt('bf')),
        current_timestamp,
        '{"provider":"email","providers":["email"]}',
        '{"full_name":"Kavitha Subramaniam, Adv.","role":"lawyer"}'::jsonb,
        current_timestamp,
        current_timestamp,
        '',
        '',
        '',
        ''
      ) ON CONFLICT (id) DO NOTHING;
INSERT INTO public.profiles (id, email, full_name, avatar_url, role) VALUES ('00000000-0000-0000-0000-00000000000a', 'lawyer10@advocato.local', 'Kavitha Subramaniam, Adv.', 'https://images.unsplash.com/photo-1551836022-deb4988cc6c0?auto=format&fit=crop&q=80&w=400', 'lawyer') ON CONFLICT (id) DO UPDATE SET full_name = EXCLUDED.full_name, avatar_url = EXCLUDED.avatar_url;
INSERT INTO public.lawyer_profiles (
        id, title, headline, bar_number, state_bar, is_verified, verification_status, availability, accepting_clients,
        years_experience, jurisdiction, state, city, hourly_rate, languages, practice_areas, tags, bio, notable_cases, rating, review_count, verified_review_count
      ) VALUES (
        '00000000-0000-0000-0000-00000000000a', 'Family & Property Law Counsel', 'Dedicated legal support for families and property matters in Tamil Nadu.', 'TN/8821/2023', 'Tamil Nadu (TN)', TRUE, 'VERIFIED'::verification_status, 'Available today', TRUE, 3, 'Tamil Nadu (TN) • Bar Council #TN/8821/2023', 'Tamil Nadu (TN)', 'Chennai', 1500, ARRAY['English', 'Tamil'], ARRAY['Family Law', 'Property & Real Estate Law'], ARRAY['Family Law', 'Property Law', 'New Advocate', 'Chennai Courts'], 'Kavitha Subramaniam is a dedicated lawyer based in Chennai with 3 years of practice specializing in family and property matters before Chennai City Civil Court, Family Courts, and Revenue Courts.', NULL, 0, 0, 0
      ) ON CONFLICT (id) DO UPDATE SET 
        title = EXCLUDED.title, headline = EXCLUDED.headline, bar_number = EXCLUDED.bar_number, state_bar = EXCLUDED.state_bar, is_verified = EXCLUDED.is_verified, verification_status = EXCLUDED.verification_status,
        availability = EXCLUDED.availability, accepting_clients = EXCLUDED.accepting_clients, years_experience = EXCLUDED.years_experience,
        jurisdiction = EXCLUDED.jurisdiction, state = EXCLUDED.state, city = EXCLUDED.city, hourly_rate = EXCLUDED.hourly_rate,
        languages = EXCLUDED.languages, practice_areas = EXCLUDED.practice_areas, tags = EXCLUDED.tags, bio = EXCLUDED.bio, notable_cases = EXCLUDED.notable_cases,
        rating = EXCLUDED.rating, review_count = EXCLUDED.review_count, verified_review_count = EXCLUDED.verified_review_count;
INSERT INTO public.lawyer_services (lawyer_id, service_id) VALUES ('00000000-0000-0000-0000-00000000000a', 'fam-divorce') ON CONFLICT (lawyer_id, service_id) DO NOTHING;
INSERT INTO public.lawyer_services (lawyer_id, service_id) VALUES ('00000000-0000-0000-0000-00000000000a', 'fam-custody') ON CONFLICT (lawyer_id, service_id) DO NOTHING;
INSERT INTO public.lawyer_services (lawyer_id, service_id) VALUES ('00000000-0000-0000-0000-00000000000a', 'fam-maintenance') ON CONFLICT (lawyer_id, service_id) DO NOTHING;
INSERT INTO public.lawyer_services (lawyer_id, service_id) VALUES ('00000000-0000-0000-0000-00000000000a', 'prop-title') ON CONFLICT (lawyer_id, service_id) DO NOTHING;
INSERT INTO public.lawyer_services (lawyer_id, service_id) VALUES ('00000000-0000-0000-0000-00000000000a', 'prop-agreement') ON CONFLICT (lawyer_id, service_id) DO NOTHING;
INSERT INTO public.lawyer_services (lawyer_id, service_id) VALUES ('00000000-0000-0000-0000-00000000000a', 'prop-dispute') ON CONFLICT (lawyer_id, service_id) DO NOTHING;
import { NextResponse } from "next/server";
import { getAllLawyers } from "@/lib/data/lawyers";
import { Lawyer, IntakeAssessment } from "@/types";

interface RequestBody {
  caseTitle?: string;
  category?: string;
  jurisdiction?: string;
  urgency?: "High" | "Medium" | "Low";
  situation: string;
  documents?: {
    name: string;
    size: string;
    category?: string;
    previewUrl?: string;
    storagePath?: string;
    sha256Hash?: string;
  }[];
  lawyers?: Lawyer[];
}

export async function POST(req: Request) {
  try {
    const body: RequestBody = await req.json();
    const situation = body.situation?.trim() || "";
    const lawyersList: Lawyer[] = body.lawyers && body.lawyers.length > 0 ? body.lawyers : getAllLawyers();

    if (!situation && !body.caseTitle) {
      return NextResponse.json(
        { error: "Legal situation description or case details are required" },
        { status: 400 }
      );
    }

    const effectiveText = situation || body.caseTitle || "Legal consultation matter";
    const openRouterApiKey = process.env.OPENROUTER_API_KEY;
    const model = process.env.OPENROUTER_MODEL || "nvidia/nemotron-3-nano-omni-30b-a3b-reasoning:free";

    if (openRouterApiKey) {
      try {
        const lawyerProfilesBrief = lawyersList.map((l) => ({
          id: l.id,
          name: l.name,
          title: l.title,
          jurisdiction: l.jurisdiction,
          practiceAreas: l.practiceAreas,
          tags: l.tags,
          hourlyRate: l.hourlyRate,
          bio: l.bio,
        }));

        const systemPrompt = `You are the chief legal triage and attorney matching AI for Advocato, an elite legal marketplace.
Analyze the client's case details, documents, and description, then rank every attorney in the provided lawyer roster based on practice area fit, jurisdiction, and track record.
You must return ONLY a single valid JSON object, without markdown formatting or code fences.

The JSON format must strictly follow this structure:
{
  "category": "Primary legal practice category (e.g. Employment & Labor Law, Intellectual Property, Corporate & Commercial Law)",
  "subCategory": "Specific matter type (e.g. Executive Severance & Non-Compete, Trademark Dispute, Wrongful Termination)",
  "jurisdiction": "Detected or default jurisdiction (e.g. Delhi (DL))",
  "urgency": "High | Medium | Low",
  "summary": "Concise 1-2 sentence legal assessment of the client's case and document relevance.",
  "extractedKeyPoints": ["Key fact or document point 1", "Key point 2", "Key point 3"],
  "matches": [
    {
      "lawyerId": "ID of the lawyer from the roster",
      "matchScore": 96,
      "matchReason": "Clear, persuasive explanation of why this specific attorney is best suited for this client's exact problem and documents.",
      "highlights": ["Relevant qualification 1", "Relevant qualification 2"]
    }
  ]
}

Ensure all lawyers in the roster are evaluated and ranked in the "matches" array in order from best fit to lowest fit. The top lawyer should have a match score between 92 and 99.`;

        const documentsInfo = body.documents && body.documents.length > 0
          ? `\nAttached Client Documents:\n${body.documents.map((d, i) => `${i + 1}. ${d.name} (${d.size}) [${d.category || "Case Document"}]`).join("\n")}`
          : "\nNo external documents attached.";

        const userPrompt = `Available Attorneys Roster:
${JSON.stringify(lawyerProfilesBrief, null, 2)}

Case Details Submitted by Client:
- Case Title / Topic: ${body.caseTitle || "Not specified"}
- Selected Practice Area: ${body.category || "Unsure / AI to classify"}
- State / Jurisdiction: ${body.jurisdiction || "Delhi (DL)"}
- Urgency Level: ${body.urgency || "Medium"}
${documentsInfo}

Client Situation Narrative:
"${effectiveText}"`;

        const openRouterResponse = await fetch("https://openrouter.ai/api/v1/chat/completions", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${openRouterApiKey}`,
            "Content-Type": "application/json",
            "HTTP-Referer": "https://advocato.legal",
            "X-Title": "Advocato Legal Intake AI",
          },
          body: JSON.stringify({
            model,
            messages: [
              { role: "system", content: systemPrompt },
              { role: "user", content: userPrompt },
            ],
            temperature: 0.2,
            response_format: { type: "json_object" },
          }),
        });

        if (openRouterResponse.ok) {
          const aiData = await openRouterResponse.json();
          let rawContent = aiData.choices?.[0]?.message?.content || "";

          if (rawContent) {
            // Strip any <think> tags or reasoning text from reasoning models
            rawContent = rawContent.replace(/<think>[\s\S]*?<\/think>/gi, "").trim();

            let cleaned = rawContent
              .replace(/^```(?:json)?\s*/i, "")
              .replace(/\s*```$/i, "")
              .trim();

            // Extract JSON substring if model included preamble
            const firstBrace = cleaned.indexOf("{");
            const lastBrace = cleaned.lastIndexOf("}");
            if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
              cleaned = cleaned.substring(firstBrace, lastBrace + 1);
            }

            const parsed = JSON.parse(cleaned);

            const assessment: IntakeAssessment = {
              id: `intake-${Date.now()}`,
              caseTitle: body.caseTitle || parsed.subCategory || "Legal Consultation Matter",
              rawText: effectiveText,
              category: body.category && body.category !== "all" && !body.category.includes("Unsure")
                ? body.category
                : (parsed.category || "Employment & Labor Law"),
              subCategory: parsed.subCategory || "Matter Assessment",
              jurisdiction: body.jurisdiction || parsed.jurisdiction || "Delhi (DL)",
              urgency: (body.urgency as any) || (parsed.urgency === "High" || parsed.urgency === "Low" ? parsed.urgency : "Medium"),
              summary: parsed.summary || effectiveText.slice(0, 140),
              extractedKeyPoints: Array.isArray(parsed.extractedKeyPoints) ? parsed.extractedKeyPoints : [],
              recommendedLawyerIds: Array.isArray(parsed.matches)
                ? parsed.matches.map((m: any) => m.lawyerId)
                : lawyersList.map((l) => l.id),
              matchedLawyers: Array.isArray(parsed.matches)
                ? parsed.matches.map((m: any) => ({
                    lawyerId: m.lawyerId,
                    matchScore: Number(m.matchScore) || 85,
                    matchReason: m.matchReason || "Matched by legal domain alignment.",
                    highlights: Array.isArray(m.highlights) ? m.highlights : [],
                  }))
                : [],
              documents: body.documents?.map((d) => ({
                name: d.name,
                size: d.size,
                category: d.category || "Case Document",
                previewUrl: d.previewUrl,
                downloadUrl: d.previewUrl,
                storagePath: d.storagePath,
                sha256Hash: d.sha256Hash,
                isReviewed: true,
              })) || [],
              createdAt: new Date().toISOString(),
            };

            return NextResponse.json({ success: true, assessment, source: "openrouter", modelUsed: model });
          }
        } else {
          const errText = await openRouterResponse.text();
          console.warn("OpenRouter returned error, using intelligent fallback:", errText);
        }
      } catch (openRouterErr) {
        console.warn("OpenRouter call failed, using intelligent fallback:", openRouterErr);
      }
    }

    // Heuristic Fallback Matcher
    const fallbackAssessment = generateIntelligentFallback(body, lawyersList);
    return NextResponse.json({
      success: true,
      assessment: fallbackAssessment,
      source: "local-heuristic",
      note: !openRouterApiKey
        ? "Add OPENROUTER_API_KEY to .env.local for live OpenRouter LLM completions."
        : undefined,
    });
  } catch (error: any) {
    console.error("Match API Error:", error);
    return NextResponse.json(
      { error: "Failed to process case matching", details: error?.message },
      { status: 500 }
    );
  }
}

function generateIntelligentFallback(body: RequestBody, lawyers: Lawyer[]): IntakeAssessment {
  const text = (body.situation || body.caseTitle || "").trim();
  const lower = text.toLowerCase();

  let category = body.category && !body.category.includes("Unsure")
    ? body.category
    : "Employment & Labor Law";
  let subCategory = "Severance & Workplace Rights";
  let urgency: "High" | "Medium" | "Low" = (body.urgency as any) || "Medium";
  let jurisdiction = body.jurisdiction || "Delhi (DL)";

  if (
    lower.includes("fired") ||
    lower.includes("severance") ||
    lower.includes("boss") ||
    lower.includes("salary") ||
    lower.includes("wage") ||
    lower.includes("employer") ||
    lower.includes("overtime") ||
    lower.includes("laid off") ||
    lower.includes("bonus")
  ) {
    category = "Employment & Labor Law";
    subCategory = lower.includes("severance")
      ? "Severance Agreement & Executive Rights"
      : "Workplace Termination & Unpaid Compensation";
  } else if (
    lower.includes("patent") ||
    lower.includes("trademark") ||
    lower.includes("copyright") ||
    lower.includes("intellectual property") ||
    lower.includes("ip")
  ) {
    category = "Intellectual Property";
    subCategory = "Trademarks, IP & Technology Licensing";
  } else if (
    lower.includes("contract") ||
    lower.includes("incorporate") ||
    lower.includes("partner") ||
    lower.includes("llc") ||
    lower.includes("startup") ||
    lower.includes("corporate")
  ) {
    category = "Corporate & Commercial Law";
    subCategory = "Contract Structuring & Entity Governance";
  }

  if (
    lower.includes("urgent") ||
    lower.includes("tomorrow") ||
    lower.includes("immediately") ||
    lower.includes("deadline") ||
    lower.includes("signed") ||
    lower.includes("7 days") ||
    lower.includes("court")
  ) {
    urgency = "High";
  } else if (lower.includes("planning") || lower.includes("exploring")) {
    urgency = "Low";
  }

  if (lower.includes("mumbai") || lower.includes("maharashtra") || lower.includes("pune") || lower.includes("bombay")) {
    jurisdiction = "Maharashtra (MH)";
  } else if (lower.includes("bangalore") || lower.includes("bengaluru") || lower.includes("karnataka")) {
    jurisdiction = "Karnataka (KA)";
  } else if (lower.includes("hyderabad") || lower.includes("telangana")) {
    jurisdiction = "Telangana (TS)";
  } else if (lower.includes("chennai") || lower.includes("tamil nadu")) {
    jurisdiction = "Tamil Nadu (TN)";
  } else if (lower.includes("delhi") || lower.includes("noida") || lower.includes("gurgaon") || lower.includes("ncr")) {
    jurisdiction = "Delhi (DL)";
  }

  const keyPoints: string[] = [];
  if (body.caseTitle) {
    keyPoints.push(`Primary matter focus: ${body.caseTitle}`);
  }
  if (body.documents && body.documents.length > 0) {
    keyPoints.push(`${body.documents.length} verified document(s) attached for attorney evidentiary review`);
  }
  if (lower.includes("salary") || lower.includes("bonus") || lower.includes("wage") || lower.includes("severance")) {
    keyPoints.push("Potential unpaid compensation or severance enhancement opportunity identified");
  }
  if (lower.includes("non-compete") || lower.includes("nda") || lower.includes("clause")) {
    keyPoints.push("Restrictive covenants, non-compete scope, and confidentiality enforceability review required");
  }
  if (keyPoints.length === 0) {
    keyPoints.push("Matter involves statutory compliance and expedited contractual consultation");
    keyPoints.push("Client seeks privileged evaluation before taking official action");
  }

  // Score each lawyer
  const scoredLawyers = lawyers.map((lawyer, index) => {
    let score = 75;
    let reason = `${lawyer.name} provides counsel in ${lawyer.practiceAreas[0] || "commercial law"}.`;
    const lawyerText = `${lawyer.name} ${lawyer.title} ${lawyer.bio} ${lawyer.practiceAreas.join(" ")} ${lawyer.tags.join(" ")}`.toLowerCase();

    // Check practice area match
    if (category.toLowerCase().includes("employment") && lawyerText.includes("employment")) {
      score += 16;
      reason = `${lawyer.name} is a senior employment attorney specializing in workplace claims, severance packages, and executive negotiations.`;
    } else if (category.toLowerCase().includes("corporate") && lawyerText.includes("corporate")) {
      score += 16;
      reason = `${lawyer.name} possesses extensive corporate governance and contract structuring counsel tailored to your dispute.`;
    } else if (category.toLowerCase().includes("intellectual") && (lawyerText.includes("ip") || lawyerText.includes("intellectual") || lawyerText.includes("tech"))) {
      score += 18;
      reason = `${lawyer.name} has targeted experience in technology licensing and intellectual property matters.`;
    }

    // Check jurisdiction match
    if (lawyer.jurisdiction.toLowerCase().includes(jurisdiction.slice(0, 2).toLowerCase())) {
      score += 5;
    }

    const finalScore = Math.min(98, Math.max(68, score - index * 4));

    return {
      lawyerId: lawyer.id,
      matchScore: finalScore,
      matchReason: reason,
      highlights: [
        `${lawyer.yearsExperience}+ years of practice`,
        lawyer.jurisdiction,
        lawyer.practiceAreas[0] || "General Law",
      ],
    };
  });

  scoredLawyers.sort((a, b) => b.matchScore - a.matchScore);

  return {
    id: `intake-${Date.now()}`,
    caseTitle: body.caseTitle || subCategory,
    rawText: text,
    category,
    subCategory,
    jurisdiction,
    urgency,
    summary:
      text.length > 130
        ? text.slice(0, 127) + "..."
        : text || "Client requested preliminary legal assessment and attorney matching.",
    extractedKeyPoints: keyPoints,
    recommendedLawyerIds: scoredLawyers.map((s) => s.lawyerId),
    matchedLawyers: scoredLawyers,
    documents: body.documents?.map((d) => ({
      name: d.name,
      size: d.size,
      category: d.category || "Case Document",
      previewUrl: d.previewUrl,
      downloadUrl: d.previewUrl,
      storagePath: d.storagePath,
      sha256Hash: d.sha256Hash,
      isReviewed: true,
    })) || [],
    createdAt: new Date().toISOString(),
  };
}

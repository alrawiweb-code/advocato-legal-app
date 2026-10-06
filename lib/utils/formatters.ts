// Prevents double-prefixing if a user manually typed "Adv."
export function formatAdvocateName(name?: string | null): string {
  if (!name || name.trim() === "") return "Unknown Counsel";
  const cleanName = name.trim();
  const lower = cleanName.toLowerCase();
  
  if (lower.startsWith("adv.") || lower.startsWith("adv ")) {
    return cleanName;
  }
  return `Adv. ${cleanName}`;
}

// Role-aware wrapper for contexts mixing clients and lawyers
export function formatPersonaName(name: string | null | undefined, role: string): string {
  if (role === "lawyer") return formatAdvocateName(name);
  return name?.trim() || "Unknown User";
}

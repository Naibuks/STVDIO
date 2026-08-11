/** Acronyms that should stay uppercase rather than becoming "Ui ux". */
const ACRONYMS: Record<string, string> = { UI_UX: "UI/UX" };

/** GRAPHIC_DESIGN -> Graphic design. Enum values are stored uppercase. */
export const formatCategory = (category?: string): string => {
  if (!category) return "";
  if (ACRONYMS[category]) return ACRONYMS[category];
  const words = category.toLowerCase().replace(/_/g, " ");
  return words.charAt(0).toUpperCase() + words.slice(1);
};

export const formatDate = (iso?: string): string =>
  iso
    ? new Date(iso).toLocaleDateString(undefined, {
        year: "numeric",
        month: "short",
      })
    : "";

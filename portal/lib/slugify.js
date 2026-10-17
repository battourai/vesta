export function slugifyProperty(property) {
  const type = property.property_type || 'property';
  const operation = property.operation || 'sale';
  
  // Clean up location: grab the main city/area or keep only up to the first comma/district keyword
  let location = property.location_address || 'philippines';
  if (location.includes(',')) {
    // If address is comma-separated, pick the primary city/area segment
    location = location.split(',')[0];
  }

  // Remove common repetitive fluff like postal codes or country names if needed
  location = location
    .replace(/\b(philippines|district|subdivision|phase|metro manila)\b/gi, '')
    .trim();

  // Combine into a base string
  const rawBase = `${type}-for-${operation}-in-${location}`
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')    // Remove special characters
    .replace(/\s+/g, '-')        // Replace spaces with hyphens
    .replace(/--+/g, '-');       // Replace multiple hyphens with single hyphen

  // Truncate the base text to a maximum of 45-50 characters so it stays readable
  const trimmedBase = rawBase.length > 45 
    ? rawBase.substring(0, 45).replace(/-$/, '') 
    : rawBase;

  // Append short 6-char UUID suffix
  const shortUuid = property.listing_uuid ? property.listing_uuid.slice(-6) : property.id;
  
  return `${trimmedBase}_${shortUuid}`;
}
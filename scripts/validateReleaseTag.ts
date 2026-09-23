const RELEASE_TAG_PATTERN = /^v(\d{4})\.(0[1-9]|1[0-2])\.(0[1-9]|[12]\d|3[01])\.([1-9]\d*)$/;

export const validateReleaseTag = (tag: string): string | null => {
  const match = RELEASE_TAG_PATTERN.exec(tag);
  if (!match) {
    return 'Release tags must use vYYYY.MM.DD.N with a UTC date and a positive sequence number (for example, v2026.09.23.1).';
  }

  const [, year, month, day] = match;
  const expectedDate = `${year}-${month}-${day}`;
  const parsedDate = new Date(`${expectedDate}T00:00:00.000Z`);
  if (
    Number.isNaN(parsedDate.getTime()) ||
    parsedDate.toISOString().slice(0, 10) !== expectedDate
  ) {
    return `Release tag ${tag} does not contain a valid UTC calendar date.`;
  }

  return null;
};

if (import.meta.main) {
  const tag = Bun.argv[2] ?? '';
  const error = validateReleaseTag(tag);
  if (error) {
    console.error(error);
    process.exit(1);
  }

  console.log(`Validated release tag ${tag}.`);
}

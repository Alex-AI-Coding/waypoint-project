type CookieOptionsLike = Record<string, unknown>;

function isDeletionCookie(value: string, options: CookieOptionsLike = {}) {
  const maxAge =
    typeof options.maxAge === "number" ? (options.maxAge as number) : undefined;

  const expires =
    options.expires instanceof Date ? options.expires : undefined;

  return (
    value === "" ||
    maxAge === 0 ||
    (expires instanceof Date && expires.getTime() <= Date.now())
  );
}

export function toSessionCookieOptions(
  value: string,
  options: CookieOptionsLike = {},
): CookieOptionsLike {
  if (isDeletionCookie(value, options)) {
    return options;
  }

  const { maxAge: _maxAge, expires: _expires, ...rest } = options;
  return rest;
}
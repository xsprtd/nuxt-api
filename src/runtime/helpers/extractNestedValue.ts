export default <T>(
  response: unknown,
  wrapperKey: string | null,
): T | null => {
  if (!wrapperKey) return response as T

  return wrapperKey
    .split('.')
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .reduce((accumulator: any, key: string) => accumulator && accumulator[key], response) as T
}

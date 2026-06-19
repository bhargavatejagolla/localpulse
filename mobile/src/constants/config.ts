export const APP_CONFIG = {
  name: "LocalPulse",
  defaultRadius: 3, // km
  radiusOptions: [1, 3, 5, 10] as number[],
  maxImageSize: 5 * 1024 * 1024, // 5MB
  supportedImageTypes: ["image/jpeg", "image/png", "image/webp"],
  issuesPerPage: 20,
};

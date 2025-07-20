export function validateEnv() {
  const keys = [
    "MONGODB_URI",
    "AWS_ACCESS_KEY_ID",
    "AWS_SECRET_ACCESS_KEY",
    "AWS_REGION",
    "AWS_S3_BUCKET",
    "OPENAI_API_KEY",
    "IG_TOKEN",
    "IG_USER_ID",
    "DROPBOX_ACCESS_TOKEN",
  ];

  keys.forEach((key) => {
    if (!process.env[key]) throw new Error(`${key} is not set`);
  });
} 
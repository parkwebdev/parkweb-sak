// Form validation and helper utilities

export const generateUniqueToken = (length: number = 12): string => {
  return (
    Math.random().toString(36).substring(2, 15) +
    Math.random().toString(36).substring(2, 15)
  ).substring(0, length);
};

export const createOnboardingUrl = (
  clientName: string,
  companyName: string,
  baseUrl: string = window.location.origin
): string => {
  const token = generateUniqueToken();
  return `${baseUrl}/client-onboarding?name=${encodeURIComponent(
    clientName
  )}&company=${encodeURIComponent(companyName)}&token=${token}`;
};

export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const validateRequired = (value: string): boolean => {
  return value.trim().length > 0;
};

export const copyToClipboard = async (text: string): Promise<boolean> => {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (err) {
    console.error('Failed to copy text: ', err);
    return false;
  }
};

export const createEmailTemplate = (
  clientName: string,
  companyName: string,
  onboardingUrl: string
): { subject: string; body: string } => {
  const subject = `Welcome ${clientName} - Let's get started on ${companyName}'s new website!`;
  const body = `Hi ${clientName},

Thank you for choosing us for ${companyName}'s website project! 

To get started, please complete our personalized onboarding form using the link below:
${onboardingUrl}

This will help us understand your needs and create the perfect website for your business.

Best regards,
Your Web Design Team`;

  return { subject, body };
};

export const openEmailClient = (email: string, subject: string, body: string): void => {
  const mailtoUrl = `mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  window.open(mailtoUrl);
};
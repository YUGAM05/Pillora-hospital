import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Pillora | Hospital Portal',
  description: 'Need assistance with finding a blood donor or understanding hospital information? Contact Pillora support for help with our health-tech platform.',
  alternates: {
    canonical: 'https://www.pillora.in/help',
  },
};

export default function HelpLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

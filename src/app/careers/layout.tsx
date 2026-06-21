import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Pillora | Hospital Portal',
  description: 'Explore career opportunities at Pillora. Join our mission to improve healthcare access, blood donor matching, and hospital information in India.',
  alternates: {
    canonical: 'https://www.pillora.in/careers',
  },
};

export default function CareersLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

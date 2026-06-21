import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Pillora | Hospital Portal',
  description: 'Get complete hospital information, verify hospital charges, and check your eligibility for government health schemes in India with Pillora.',
  alternates: {
    canonical: 'https://www.pillora.in/hospitals',
  },
};

export default function HospitalsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

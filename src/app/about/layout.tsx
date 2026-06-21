import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Pillora | Hospital Portal',
  description: 'Learn about Pillora, India\'s leading health-tech platform dedicated to fast blood donor matching and transparent hospital information and charges.',
  alternates: {
    canonical: 'https://www.pillora.in/about',
  },
};

export default function AboutLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

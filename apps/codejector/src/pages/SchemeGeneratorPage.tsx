import React, { Suspense, lazy } from 'react';
import PageLayout from '@/components/layouts/PageLayout';
import Loading from '@/components/Loading';
import PageHeader from '@/components/layouts/PageHeader'; // Import PageHeader

const AiSchemaGenerator = lazy(
  () => import('@/components/schema/AiSchemaGenerator'),
);

/**
 * @component SchemeGeneratorPage
 * @description A page component to host the AI Schema Generator. It provides a consistent layout
 * and handles lazy loading for the AiSchemaGenerator component.
 */
const SchemeGeneratorPage: React.FC = () => (
  <PageLayout
    header={<PageHeader title="AI Schema Generator" sticky={true} />} // Use PageHeader component
    body={
      <Suspense fallback={<Loading message="Loading Schema Generator..." />}>
        <AiSchemaGenerator />
      </Suspense>
    }
    centerBodyContent={false}
  />
);

export default SchemeGeneratorPage;

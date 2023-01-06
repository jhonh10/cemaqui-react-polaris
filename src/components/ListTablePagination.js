import { Pagination, Stack } from '@shopify/polaris';
import React from 'react';
import { getStudents, nextPage } from '../firebase/client';

export const ListTablePagination = () => (
  <div
    style={{
      margin: 'auto',
      padding: 'var(--p-space-3) var(--p-space-4) var(--p-space-5) var(--p-space-4)'
    }}
  >
    <Stack distribution="center">
      <Pagination
        hasPrevious
        previousKeys={[74]}
        previousTooltip="j"
        onPrevious={() => {
          console.log('Previous');
        }}
        hasNext
        nextKeys={[75]}
        nextTooltip="k"
        onNext={async () => nextPage()}
      />
    </Stack>
  </div>
);

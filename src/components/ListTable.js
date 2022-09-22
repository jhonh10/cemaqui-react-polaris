import {
  TextField,
  IndexTable,
  TextStyle,
  Card,
  Filters,
  Select,
  useIndexResourceState
} from '@shopify/polaris';
import { filter } from 'lodash';
import { useState, useCallback, useMemo, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

export default function ListTable() {
  const students = useMemo(
    () => [
      {
        id: '3417',
        url: 'customers/341',
        name: 'Mae Jemison',
        location: 'Decatur, USA',
        orders: 20,
        amountSpent: '$2,400'
      },
      {
        id: '2567',
        url: 'customers/256',
        name: 'Ellen Ochoa',
        location: 'Los Angeles, USA',
        orders: 30,
        amountSpent: '$140'
      },
      {
        id: '2577',
        url: 'customers/257',
        name: 'Jhon Palacios',
        location: 'Bogota, COL',
        orders: 30,
        amountSpent: '$140'
      },
      {
        id: '2587',
        url: 'customers/258',
        name: 'Jhon Palacios',
        location: 'Bogota, COL',
        orders: 30,
        amountSpent: '$140'
      }
    ],
    []
  );
  const resourceName = {
    singular: 'alumno',
    plural: 'alumnos'
  };

  const [filteredStudents, setFilteredStudents] = useState(students);
  const { selectedResources, allResourcesSelected, handleSelectionChange } =
    useIndexResourceState(filteredStudents);
  const navigate = useNavigate();
  const [taggedWith, setTaggedWith] = useState('');
  const [sortValue, setSortValue] = useState('today');
  const [loading, setLoading] = useState(false);
  const [searchParams, setSearchParams] = useSearchParams();
  const query = searchParams.get('query');
  const [queryValue, setQueryValue] = useState(query || '');
  const handleTaggedWithChange = useCallback((value) => setTaggedWith(value), []);
  const handleTaggedWithRemove = useCallback(() => setTaggedWith(''), []);
  const handleSortChange = useCallback((value) => setSortValue(value), []);
  const handleOnClick = useCallback((id) => navigate(id), [navigate]);
  const handleQueryValueRemove = useCallback(() => setQueryValue(''), []);
  const handleClearAll = useCallback(() => {
    handleTaggedWithRemove();
    handleQueryValueRemove();
  }, [handleQueryValueRemove, handleTaggedWithRemove]);

  const addQueryParams = useCallback(() => {
    setSearchParams({ query: queryValue });
  }, [queryValue, setSearchParams]);

  const removeQueryParams = useCallback(() => {
    searchParams.delete('query');
    setSearchParams(searchParams);
  }, [searchParams, setSearchParams]);

  useEffect(() => {
    setLoading(true);
    const timeOutId = setTimeout(() => {
      setLoading(false);
    }, 500);
    return () => clearTimeout(timeOutId);
  }, [filteredStudents]);

  useEffect(() => {
    const timeOutId = setTimeout(() => {
      if (queryValue) addQueryParams();
      if (!queryValue) removeQueryParams();
      setFilteredStudents(applySortFilter(students, queryValue));
    }, 300);
    return () => clearTimeout(timeOutId);
  }, [queryValue, students, addQueryParams, removeQueryParams]);

  const promotedBulkActions = [
    {
      content: 'Edit Students',
      onAction: () => console.log('Todo: implement bulk edit')
    }
  ];
  const bulkActions = [
    {
      content: 'Add tags',
      onAction: () => console.log('Todo: implement bulk add tags')
    },
    {
      content: 'Remove tags',
      onAction: () => console.log('Todo: implement bulk remove tags')
    },
    {
      content: 'Delete students',
      onAction: () => console.log('Todo: implement bulk delete')
    }
  ];

  const filters = [
    {
      key: 'taggedWith',
      label: 'Tagged with',
      filter: (
        <TextField
          label="Taaged with"
          value={taggedWith}
          onChange={handleTaggedWithChange}
          autoComplete="off"
          labelHidden
        />
      ),
      shortcut: false
    }
  ];

  const appliedFilters = !isEmpty(taggedWith)
    ? [
        {
          key: 'taggedWith',
          label: disambiguateLabel('taggedWith', taggedWith),
          onRemove: handleTaggedWithRemove
        }
      ]
    : [];

  const sortOptions = [
    { label: 'Today', value: 'today' },
    { label: 'Yesterday', value: 'yesterday' },
    { label: 'Last 7 days', value: 'lastWeek' }
  ];

  const rowMarkup = filteredStudents.map(({ id, name, location, orders, amountSpent }, index) => (
    <IndexTable.Row
      id={id}
      key={id}
      selected={selectedResources.includes(id)}
      position={index}
      onClick={() => handleOnClick(id)}
    >
      <IndexTable.Cell>
        <TextStyle variation="strong">{name}</TextStyle>
      </IndexTable.Cell>
      <IndexTable.Cell>{location}</IndexTable.Cell>
      <IndexTable.Cell>{orders}</IndexTable.Cell>
      <IndexTable.Cell>{amountSpent}</IndexTable.Cell>
    </IndexTable.Row>
  ));

  return (
    <Card>
      <div style={{ padding: '16px', display: 'flex' }}>
        <div style={{ flex: 1 }}>
          <Filters
            resourceName={resourceName}
            queryPlaceholder="Filtrar estudiantes"
            queryValue={queryValue}
            filters={filters}
            appliedFilters={appliedFilters}
            onQueryChange={setQueryValue}
            onQueryClear={handleQueryValueRemove}
            onClearAll={handleClearAll}
          />
        </div>
        <div style={{ paddingLeft: '0.25rem' }}>
          <Select
            labelInline
            label="Sort by"
            options={sortOptions}
            value={sortValue}
            onChange={handleSortChange}
          />
        </div>
      </div>
      <IndexTable
        resourceName={resourceName}
        itemCount={filteredStudents.length}
        selectedItemsCount={allResourcesSelected ? 'All' : selectedResources.length}
        onSelectionChange={handleSelectionChange}
        hasMoreItems
        bulkActions={bulkActions}
        promotedBulkActions={promotedBulkActions}
        lastColumnSticky
        loading={loading}
        headings={[
          { title: 'Name' },
          { title: 'Location' },
          { title: 'Order count' },
          { title: 'Amount spent', hidden: false }
        ]}
      >
        {rowMarkup}
      </IndexTable>
    </Card>
  );

  function applySortFilter(array, query) {
    const stabilizedThis = array.map((el, index) => [el, index]);
    if (query) {
      return filter(
        array,
        (_user) =>
          _user.name.toLowerCase().includes(query.toLowerCase()) ||
          _user.location.toLowerCase().includes(query.toLowerCase())
      );
    }
    return stabilizedThis.map((el) => el[0]);
  }

  function disambiguateLabel(key, value) {
    switch (key) {
      case 'taggedWith':
        return `Tagged with ${value}`;
      default:
        return value;
    }
  }

  function isEmpty(value) {
    if (Array.isArray(value)) {
      return value.length === 0;
    }
    return value === '' || value == null;
  }
}

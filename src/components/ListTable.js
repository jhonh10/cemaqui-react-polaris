import {
  TextField,
  IndexTable,
  Text,
  Filters,
  Select,
  useIndexResourceState,
  LegacyCard,
  IndexFilters,
} from "@shopify/polaris";
import { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useFilterStudents } from "../hooks/useFilterStudents";
import { ListTablePagination } from "./ListTablePagination";

const ListTable = ({ students }) => {
  const resourceName = {
    singular: "alumno",
    plural: "alumnos",
  };

  const { filteredStudents, isFiltering, queryValue, setQueryValue } =
    useFilterStudents({
      students,
    });
  const { selectedResources, allResourcesSelected, handleSelectionChange } =
    useIndexResourceState(filteredStudents);
  const navigate = useNavigate();
  const [taggedWith, setTaggedWith] = useState("");
  const [sortValue, setSortValue] = useState("today");
  const handleTaggedWithChange = useCallback(
    (value) => setTaggedWith(value),
    []
  );
  const handleTaggedWithRemove = useCallback(() => setTaggedWith(""), []);
  const handleSortChange = useCallback((value) => setSortValue(value), []);
  const handleOnClick = useCallback((value) => navigate(value), [navigate]);
  const handleQueryValueRemove = useCallback(
    () => setQueryValue(""),
    [setQueryValue]
  );
  const handleClearAll = useCallback(() => {
    handleTaggedWithRemove();
    handleQueryValueRemove();
  }, [handleQueryValueRemove, handleTaggedWithRemove]);

  const promotedBulkActions = [
    {
      content: "Editar Alumno",
      onAction: () => console.log("Todo: implement bulk edit"),
    },
    {
      content: "Eliminar Alumno",
      onAction: () => console.log("Todo: implement bulk delete"),
    },
  ];

  const filters = [
    {
      key: "taggedWith",
      label: "Tagged with",
      filter: (
        <TextField
          label="Taaged with"
          value={taggedWith}
          onChange={handleTaggedWithChange}
          autoComplete="off"
          labelHidden
        />
      ),
      shortcut: false,
    },
  ];

  const appliedFilters = !isEmpty(taggedWith)
    ? [
        {
          key: "taggedWith",
          label: disambiguateLabel("taggedWith", taggedWith),
          onRemove: handleTaggedWithRemove,
        },
      ]
    : [];

  const sortOptions = [
    { label: "Hoy", value: "today" },
    { label: "Ayer", value: "yesterday" },
    { label: "Ultimos 7 dias", value: "lastWeek" },
  ];

  const rowMarkup = filteredStudents.map(
    ({ id, firstname, lastname, documentId, resolution, createdAt }, index) => (
      <IndexTable.Row
        id={id}
        key={id}
        selected={selectedResources.includes(id)}
        position={index}
        onClick={() => handleOnClick(id)}
      >
        <IndexTable.Cell>
          <Text variant="headingSm" as="span">
            {firstname} {lastname}
          </Text>
        </IndexTable.Cell>
        <IndexTable.Cell>{documentId}</IndexTable.Cell>
        <IndexTable.Cell>{createdAt}</IndexTable.Cell>
        <IndexTable.Cell>{resolution}</IndexTable.Cell>
      </IndexTable.Row>
    )
  );

  const table = (
    <div style={{ margin: "var(--p-space-4) 0" }}>
      <LegacyCard>
        <div style={{ padding: "16px", display: "flex" }}>
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
          <div style={{ paddingLeft: "0.25rem" }}>
            <Select
              labelInline
              label="Filtrar por"
              options={sortOptions}
              value={sortValue}
              onChange={handleSortChange}
            />
          </div>
        </div>
        <IndexTable
          resourceName={resourceName}
          itemCount={filteredStudents.length}
          selectedItemsCount={
            allResourcesSelected ? "All" : selectedResources.length
          }
          onSelectionChange={handleSelectionChange}
          hasMoreItems
          promotedBulkActions={promotedBulkActions}
          lastColumnSticky
          loading={isFiltering}
          headings={[
            { title: "Nombre" },
            { title: "Numero de Cedula" },
            { title: "Fecha" },
            { title: "Resolucion", hidden: false },
          ]}
        >
          {rowMarkup}
        </IndexTable>
        <ListTablePagination />
      </LegacyCard>
    </div>
  );

  return table;

  function disambiguateLabel(key, value) {
    switch (key) {
      case "taggedWith":
        return `Tagged with ${value}`;
      default:
        return value;
    }
  }

  function isEmpty(value) {
    if (Array.isArray(value)) {
      return value.length === 0;
    }
    return value === "" || value == null;
  }
};
export default ListTable;

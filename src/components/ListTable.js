import {
  TextField,
  IndexTable,
  Text,
  Filters,
  Select,
  useIndexResourceState,
  LegacyCard,
  Spinner,
  EmptySearchResult,
} from "@shopify/polaris";
import { useState, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useFilterStudents } from "../hooks/useFilterStudents";
import { ListTablePagination } from "./ListTablePagination";

const ListTable = ({
  students,
  page,
  isPreviousData,
  setPage,
  hasMore,
  setPageAction,
  firstVisible,
  lastVisible,
  setFirstVisible,
  setLastVisible,
  isReturningFromDetails, // Nuevo prop
}) => {
  const resourceName = {
    singular: "alumno",
    plural: "alumnos",
  };

  const { filteredStudents, isFiltering, queryValue, setQueryValue } =
    useFilterStudents({
      students,
      setPage, // Pasar setPage para sincronizar estados
    });

  // Estado de carga combinado
  // Si estamos volviendo de detalles, no mostrar spinner aunque esté cargando
  const isLoading = (isFiltering || isPreviousData) && !isReturningFromDetails;

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

  const handleRowClick = useCallback(
    (id) => {
      // Usar state para navegación para preservar el estado actual
      console.log(`🔍 Navegando a detalles del alumno ${id} desde página ${page}`);
      navigate(id, {
        state: {
          fromList: true,
          currentPage: page,
          currentQuery: queryValue,
        },
      });
    },
    [navigate, page, queryValue]
  );

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
          label="Tagged with"
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
    { label: "Últimos 7 días", value: "lastWeek" },
  ];

  const sortedAndFilteredStudents = useMemo(() => {
    return filteredStudents;
  }, [filteredStudents, sortValue]);

  const rowMarkup = sortedAndFilteredStudents.map(
    ({ id, firstname, lastname, documentId, resolution, createdAt }, index) => (
      <IndexTable.Row
        id={id}
        key={id}
        selected={selectedResources.includes(id)}
        position={index}
        onClick={() => handleRowClick(id)}
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

  // Mensaje para cuando no hay resultados tras búsqueda
  const emptyStateMarkup = queryValue && !isLoading ? (
    <EmptySearchResult
      title={`No se encontraron alumnos que coincidan con "${queryValue}"`}
      description="Intenta cambiar los términos de búsqueda"
      withIllustration
    />
  ) : null;

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

        {isLoading && (
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              padding: "32px",
            }}
          >
            <Spinner size="large" color="teal" />
          </div>
        )}

        {!isLoading && sortedAndFilteredStudents.length === 0 ? (
          <div style={{ padding: "24px" }}>
            {emptyStateMarkup || (
              <Text alignment="center" variant="bodyMd" color="subdued">
                No hay alumnos disponibles
              </Text>
            )}
          </div>
        ) : (
          <IndexTable
            resourceName={resourceName}
            itemCount={sortedAndFilteredStudents.length}
            selectedItemsCount={
              allResourcesSelected ? "All" : selectedResources.length
            }
            onSelectionChange={handleSelectionChange}
            hasMoreItems
            promotedBulkActions={promotedBulkActions}
            lastColumnSticky
            loading={isLoading}
            headings={[
              { title: "Nombre" },
              { title: "Número de Cédula" },
              { title: "Fecha" },
              { title: "Resolución", hidden: false },
            ]}
          >
            {rowMarkup}
          </IndexTable>
        )}

        <ListTablePagination
          page={page}
          setPage={setPage}
          hasMore={hasMore}
          setPageAction={setPageAction}
          isPreviousData={isPreviousData}
          firstVisible={firstVisible}
          lastVisible={lastVisible}
          setFirstVisible={setFirstVisible}
          setLastVisible={setLastVisible}
          isSearchActive={queryValue.length > 0}
        />
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

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
import { useState, useCallback, useMemo, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { useFilterStudents } from "../hooks/useFilterStudents";
import ListTablePagination from "./ListTablePagination";
import { ensurePageCursors } from "../firebase/client";

// Componente principal que recibe todos los props
const ListTable = (props) => {
  // Extraer isReturningFromDetails primero
  const isReturningFromDetails = props.isReturningFromDetails || false;

  // Pasar todos los props y isReturningFromDetails a ListTableInner
  return (
    <ListTableInner
      {...props}
      isReturningFromDetailsFlag={isReturningFromDetails}
    />
  );
};

// Componente interno que contiene toda la lógica
const ListTableInner = ({
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
  isReturningFromDetailsFlag = false,
  isLoading: propsIsLoading, // Recibir isLoading desde useFetchStudents
  isFetching = false, // Añadir esta prop con un valor por defecto
}) => {
  // Usar el hook directamente aquí
  const queryClient = useQueryClient();

  const resourceName = {
    singular: "alumno",
    plural: "alumnos",
  };

  const { filteredStudents, isFiltering, queryValue, setQueryValue } =
    useFilterStudents({
      students,
      setPage,
    });

  const { selectedResources, allResourcesSelected, handleSelectionChange } =
    useIndexResourceState(filteredStudents);
  const navigate = useNavigate();
  const [taggedWith, setTaggedWith] = useState("");
  const [sortValue, setSortValue] = useState("today");

  // CLAVE: Verificar caché de forma más robusta
  const usingCache = sessionStorage.getItem("using_cached_page") === "true";
  const isPageInMemory =
    queryClient.getQueryData(["students", page, null]) !== undefined;

  // Lógica más precisa para isLoading
  const isLoading =
    (((isFiltering || isPreviousData) && !isReturningFromDetailsFlag) ||
      propsIsLoading) &&
    !usingCache &&
    !isPageInMemory;

  const handleTaggedWithChange = useCallback(
    (value) => setTaggedWith(value),
    []
  );
  const handleTaggedWithRemove = useCallback(() => setTaggedWith(""), []);
  const handleSortChange = useCallback((value) => setSortValue(value), []);

  const handleRowClick = useCallback(
    (id) => {
      // Usar state para navegación para preservar el estado actual
      console.log(
        `🔍 Navegando a detalles del alumno ${id} desde página ${page}`
      );
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

  // Modificar la línea donde se construye rowMarkup
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

  // Mostrar un mensaje cuando detectamos paginación inválida
  const [paginationError, setPaginationError] = useState(false);

  // Modificar el efecto que detecta páginas sin datos
  useEffect(() => {
    // Verificar si estamos retornando de detalles o de una operación de eliminación
    const isComingFromDetails =
      window.history.state?.usr?.fromList || isReturningFromDetailsFlag;
    const isDeletingStudent =
      window.history.state?.usr?.deletedStudent === true;
    const wasOffline = sessionStorage.getItem("wasOffline") === "true";

    // Resetear error de paginación cuando cambia la página
    setPaginationError(false);

    // Condiciones especiales para mostrar o no error
    const isSearchActive = queryValue && queryValue.length > 0;
    const paginationChanged =
      sessionStorage.getItem("pagination_structure_changed") === "true";

    // Si la página está vacía pero no por las razones "esperadas"
    if (
      !isComingFromDetails &&
      !isLoading &&
      students.length === 0 &&
      page > 1 &&
      !isSearchActive
    ) {
      console.log("⚠️ Posible error de paginación: página sin datos");
      setPaginationError(true);

      // Si la página está vacía después de eliminar, manejarlo especialmente
      if (isDeletingStudent) {
        console.log(
          "🗑️ Página vacía después de eliminar un alumno, verificando estructura..."
        );

        // Importar y ejecutar recalculateTotalPages para obtener datos actualizados
        import("../firebase/client").then(({ recalculateTotalPages }) => {
          recalculateTotalPages().then(({ totalPages }) => {
            if (page > totalPages) {
              console.log(
                `⚠️ La página ${page} ya no existe después de eliminar. Redirigiendo a ${totalPages}`
              );

              // Simular carga breve antes de redirigir
              setTimeout(() => {
                setPageAction(null);
                setPage(Math.max(1, totalPages));
              }, 1000);
            }
          });
        });
      } else {
        // Estrategia normal de recuperación
        const attemptRecovery = () => {
          console.log("🔄 Intentando recuperación automática...");

          // Si estuvimos offline o hubo cambio de paginación, usar estrategia robusta
          if (wasOffline || paginationChanged) {
            console.log(
              "🔄 Detectada recuperación post-desconexión o cambio estructural"
            );

            // El resto sigue igual...
          }
        };

        const recoveryTimer = setTimeout(attemptRecovery, 2000);
        return () => clearTimeout(recoveryTimer);
      }
    }
  }, [
    page,
    isLoading,
    students.length,
    queryValue,
    setPage,
    setFirstVisible,
    setLastVisible,
    setPageAction,
  ]);

  // Mensaje para cuando no hay resultados tras búsqueda
  const emptyStateMarkup =
    queryValue && !isLoading ? (
      <EmptySearchResult
        title={`No se encontraron alumnos que coincidan con "${queryValue}"`}
        description="Intenta cambiar los términos de búsqueda"
        withIllustration
      />
    ) : null;

  const table = (
    <div style={{ margin: "var(--p-space-4) 0" }}>
      <LegacyCard>
        {paginationError && (
          <div
            style={{
              padding: "16px",
              backgroundColor: "rgba(253, 201, 73, 0.1)",
              borderRadius: "4px",
              margin: "0 16px 16px 16px",
              border: "1px solid #FDC949",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <Text variant="bodyMd">
              Ha ocurrido un problema al cargar esta página. Volviendo a la
              última página válida...
            </Text>
            <div>
              <Spinner size="small" />
            </div>
          </div>
        )}
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

        {(() => {
          if (isLoading && students.length === 0) {
            // Spinner a pantalla completa durante la carga inicial
            return (
              <div style={{ display: "flex", justifyContent: "center", padding: "32px" }}>
                <Spinner size="large" color="teal" />
              </div>
            );
          } 
          
          if (isFetching && students.length > 0) {
            // Para recargas, mostrar un indicador sutil en la parte superior
            return (
              <div style={{ 
                position: "absolute", 
                top: 0, 
                left: 0, 
                right: 0, 
                height: "3px", 
                backgroundColor: "var(--p-action-primary)",
                opacity: 0.6,
                zIndex: 1000,
                animation: "loading-bar 1s infinite linear"
              }} />
            );
          }
          
          return null;
        })()}

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

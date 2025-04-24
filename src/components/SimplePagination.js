import React, { useEffect, useState } from 'react';
import { 
  Button, 
  Spinner, 
  Text, 
  HorizontalStack, 
  Badge,
  LegacyCard,
  ButtonGroup,
  ProgressBar
} from '@shopify/polaris';
import useFirestorePagination from '../hooks/useFirestorePagination';

const SimplePagination = ({ collection: collectionName = "Alumnos", pageSize = 10 }) => {
  const {
    items,
    loading,
    error,
    hasNext,
    hasPrevious,
    loadNextPage,
    loadPreviousPage,
    refresh,
    
    // Nuevos elementos
    totalDocs,
    getProgressEstimate
  } = useFirestorePagination({
    collectionName,
    pageSize,
    orderByField: 'expeditionDate'
  });
  
  // Estado para mostrar progreso
  const [progress, setProgress] = useState(0);
  // Estado para llevar la cuenta de la página actual
  const [currentPage, setCurrentPage] = useState(1);
  
  // Actualizar progreso cuando cambia la página
  useEffect(() => {
    const updateProgress = async () => {
      if (!loading) {
        const progressValue = await getProgressEstimate();
        if (progressValue !== null) {
          setProgress(progressValue);
        }
      }
    };
    
    updateProgress();
  }, [items, loading, getProgressEstimate]);

  // Actualizar la página cuando navegamos
  useEffect(() => {
    if (!loading) {
      if (!hasPrevious) {
        setCurrentPage(1);
      } else if (!hasNext && items.length > 0) {
        // Estamos en la última página
        setCurrentPage(Math.ceil(totalDocs / pageSize));
      }
    }
  }, [hasPrevious, hasNext, loading, totalDocs, pageSize, items]);

  // Manejar navegación directamente
  const handleNextPage = async () => {
    await loadNextPage();
    setCurrentPage(prev => prev + 1);
  };

  const handlePreviousPage = async () => {
    await loadPreviousPage();
    setCurrentPage(prev => prev - 1);
  };

  if (error) {
    return (
      <div style={{ padding: '1rem', color: 'red' }}>
        <p>Error: {error.message}</p>
        <Button onClick={refresh}>Reintentar</Button>
      </div>
    );
  }

  // Renderizar el contenido basado en el estado
  const renderContent = () => {
    if (loading) {
      return (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '2rem' }}>
          <Spinner size="large" />
        </div>
      );
    }
    
    if (items.length === 0) {
      return <Text variant="bodyLg">No hay elementos disponibles</Text>;
    }
    
    return (
      <>
        <HorizontalStack align="center" gap="2">
          <Text variant="headingMd">Elementos</Text>
          <Badge status="info">
            {Math.min(currentPage * pageSize, totalDocs)} de {totalDocs}
          </Badge>
          <Text variant="bodySm" color="subdued">
            Página: {currentPage} de {Math.ceil(totalDocs / pageSize)}
          </Text>
        </HorizontalStack>
        
        {/* Barra de progreso estimado */}
        {totalDocs > 0 && (
          <div style={{ margin: '1rem 0' }}>
            <ProgressBar progress={progress} size="small" />
            <Text variant="bodySm" alignment="center">
              {progress}%
            </Text>
          </div>
        )}
        
        <ul style={{ marginTop: '1rem' }}>
          {items.map(item => (
            <li key={item.id} style={{ marginBottom: '0.5rem', padding: '0.5rem', border: '1px solid #ddd' }}>
              <Text variant="bodyMd">{item.documentId || item.id}: {item.firstname} {item.lastname}</Text>
            </li>
          ))}
        </ul>
      </>
    );
  };

  return (
    <div style={{ padding: '1rem' }}>
      <LegacyCard>
        <LegacyCard.Section>
          {renderContent()}
        </LegacyCard.Section>
        
        <LegacyCard.Section>
          <HorizontalStack gap="3" align="center" distribution="center">
            <ButtonGroup>
              <Button 
                onClick={handlePreviousPage}
                disabled={loading || !hasPrevious}
              >
                Anterior
              </Button>
              <Button 
                onClick={handleNextPage}
                disabled={loading || !hasNext}
                primary
              >
                Siguiente
              </Button>
            </ButtonGroup>
          </HorizontalStack>
        </LegacyCard.Section>
      </LegacyCard>
    </div>
  );
};

export default SimplePagination;
import { ContextualSaveBar, Frame, Loading, Navigation, Toast } from '@shopify/polaris';
import { HomeMinor, CustomersMinor } from '@shopify/polaris-icons';
import { useIsFetching } from '@tanstack/react-query';
import { useState, useCallback, useRef } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import TopBarDefault from '../components/TopBarDefault';

export default function LayoutPage() {
  const defaultState = useRef({
    emailFieldValue: 'dharma@jadedpixel.com',
    nameFieldValue: 'Cemaqui'
  });
  const skipToContentRef = useRef(null);
  const { pathname } = useLocation();

  const [toastActive, setToastActive] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const isFetching = useIsFetching();
  const [isDirty, setIsDirty] = useState(false);
  const [mobileNavigationActive, setMobileNavigationActive] = useState(false);
  const [storeName, setStoreName] = useState(defaultState.current.nameFieldValue);

  const handleDiscard = useCallback(() => setIsDirty(false), []);
  const toggleToastActive = useCallback(() => setToastActive((toastActive) => !toastActive), []);
  // Refactor - Aplicar principios solid
  const handleToast = useCallback(
    (message) => {
      setToastMessage(message);
      toggleToastActive();
    },
    [toggleToastActive]
  );

  // Refactor - Aplicar principios solid
  const handleSave = useCallback(() => {
    setIsDirty(false);
    setToastActive(true);
    setStoreName(defaultState.current.nameFieldValue);
  }, []);

  const toggleMobileNavigationActive = useCallback(
    () => setMobileNavigationActive((mobileNavigationActive) => !mobileNavigationActive),
    []
  );

  const logo = {
    width: 124,
    topBarSource:
      'https://cdn.shopify.com/s/files/1/0446/6937/files/jaded-pixel-logo-color.svg?6215648040070010999',
    contextualSaveBarSource:
      'https://cdn.shopify.com/s/files/1/0446/6937/files/jaded-pixel-logo-gray.svg?6215648040070010999',
    url: '#',
    accessibilityLabel: 'Jaded Pixel'
  };

  const topBarMarkup = (
    <TopBarDefault setMobileNavigationActive={setMobileNavigationActive} storeName={storeName} />
  );

  const toastMarkup = toastActive ? (
    <Toast onDismiss={toggleToastActive} content={toastMessage} />
  ) : null;

  const contextualSaveBarMarkup = isDirty ? (
    <ContextualSaveBar
      message="Unsaved changes"
      saveAction={{
        onAction: handleSave
      }}
      discardAction={{
        onAction: handleDiscard
      }}
    />
  ) : null;

  const navigationMarkup = (
    <Navigation location={pathname}>
      <Navigation.Section
        items={[
          {
            url: '/admin',
            label: 'Inicio',
            icon: HomeMinor,
            exactMatch: true
          },
          {
            url: '/admin/students',
            label: 'Alumnos',
            icon: CustomersMinor,
            badge: '15'
          }
        ]}
      />
    </Navigation>
  );

  const loadingMarkup = isFetching ? <Loading /> : null;

  const skipToContentTarget = <a id="SkipToContentTarget" ref={skipToContentRef} tabIndex={-1} />;

  const pageMarkup = (
    <Outlet
      context={{
        isDirty,
        isFetching,
        skipToContentTarget,
        setIsDirty,
        handleToast
      }}
    />
  );

  return (
    <div style={{ height: '500px' }}>
      <Frame
        logo={logo}
        topBar={topBarMarkup}
        navigation={navigationMarkup}
        showMobileNavigation={mobileNavigationActive}
        onNavigationDismiss={toggleMobileNavigationActive}
        skipToContentTarget={skipToContentRef.current}
      >
        {contextualSaveBarMarkup}
        {loadingMarkup}
        {pageMarkup}
        {toastMarkup}
      </Frame>
    </div>
  );
}

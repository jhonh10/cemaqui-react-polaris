import { TopBar, ActionList } from '@shopify/polaris';
import { useState, useCallback } from 'react';

export default function TopBarDefault({ storeName, setMobileNavigationActive }) {
  const [searchActive, setSearchActive] = useState(false);

  const [userMenuActive, setUserMenuActive] = useState(false);
  const [searchValue, setSearchValue] = useState('');

  const handleSearchResultsDismiss = useCallback(() => {
    setSearchActive(false);
    setSearchValue('');
  }, []);

  const toggleMobileNavigationActive = useCallback(
    () => setMobileNavigationActive((mobileNavigationActive) => !mobileNavigationActive),
    [setMobileNavigationActive]
  );

  const toggleUserMenuActive = useCallback(
    () => setUserMenuActive((userMenuActive) => !userMenuActive),
    []
  );

  const handleSearchFieldChange = useCallback((value) => {
    setSearchValue(value);
    setSearchActive(value.length > 0);
  }, []);

  const userMenuActions = [
    {
      items: [{ content: 'Community forums' }]
    }
  ];
  const userMenuMarkup = (
    <TopBar.UserMenu
      actions={userMenuActions}
      name="Claudia Otalvaro"
      detail={storeName}
      initials="C"
      open={userMenuActive}
      onToggle={toggleUserMenuActive}
    />
  );
  const searchFieldMarkup = (
    <TopBar.SearchField
      onChange={handleSearchFieldChange}
      value={searchValue}
      placeholder="Buscar"
    />
  );
  const searchResultsMarkup = (
    <ActionList items={[{ content: 'Shopify help center' }, { content: 'Community forums' }]} />
  );

  return (
    <TopBar
      showNavigationToggle
      userMenu={userMenuMarkup}
      searchResultsVisible={searchActive}
      searchField={searchFieldMarkup}
      searchResults={searchResultsMarkup}
      onSearchResultsDismiss={handleSearchResultsDismiss}
      onNavigationToggle={toggleMobileNavigationActive}
    />
  );
}

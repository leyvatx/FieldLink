import { useState, useEffect } from 'react';
import NameColumnHeader from './NameColumnHeader';

const NameColumnHeaderContainer = ({ search, setSearch, onNewPermission, onNewRole }) => {
  const [localSearch, setLocalSearch] = useState(search);

  useEffect(() => setLocalSearch(search), [search]);
  useEffect(() => {
    if (localSearch === '') {
      setSearch('');
      return;
    }
    const id = setTimeout(() => setSearch(localSearch), 1000);
    return () => clearTimeout(id);
  }, [localSearch, setSearch]);

  const handlePressEnter = () => setSearch(localSearch);
  const handleChange = (e) => {
    const value = e.target.value;
    setLocalSearch(value);
  };

  return (
    <NameColumnHeader
      value={localSearch}
      onChange={handleChange}
      onPressEnter={handlePressEnter}
      onNewPermission={onNewPermission}
      onNewRole={onNewRole}
    />
  );
};

NameColumnHeaderContainer.displayName = 'NameColumnHeaderContainer';

export default NameColumnHeaderContainer;

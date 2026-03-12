import { createContext, useState } from 'react';

export const LogContext = createContext<null | any>(null);

export const LogProvider = ({ children }) => {
  const [listType, setListType] = useState(localStorage.getItem('listType') || 'block');
  const [filterInvoice, setFilterInvoice] = useState<any>('');
  const [filterDate, setFilterDate] = useState<any>({ start: '', end: '' });
  const [selectedUsers, setSelectedUsers] = useState<any[]>([]);
  const [selectedMovements, setSelectedMovements] = useState<any[]>([]);
  const [selectedModules, setSelectedModules] = useState<any[]>([]);

  return (
    <LogContext.Provider
      value={{
        listType,
        setListType,
        filterInvoice,
        setFilterInvoice,
        filterDate,
        setFilterDate,
        selectedUsers,
        setSelectedUsers,
        selectedMovements,
        setSelectedMovements,
        selectedModules,
        setSelectedModules,
      }}
    >
      {children}
    </LogContext.Provider>
  );
};

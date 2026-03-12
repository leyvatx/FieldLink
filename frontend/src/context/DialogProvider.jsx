import { createContext, useCallback, useContext, useState } from "react";
import { Drawer, Dropdown, Modal } from "antd";

const DialogContext = createContext();

export const DialogProvider = ({ children }) => {
  const [modal, contextHolder] = Modal.useModal();
  const [drawerOptions, setDrawerOptions] = useState(null);
  const [modalOptions, setModalOptions] = useState(null);
  const [contextMenuOptions, setContextMenuOptions] = useState(null);
  const [modals, setModals] = useState([]);

  // Drawer methods
  const openDrawer = useCallback((props) => {
    setDrawerOptions({ ...props, open: true });
  }, []);

  const closeDrawer = useCallback(() => {
    setDrawerOptions(null);
  }, []);

  // Modal methods
  const openModal = useCallback((props) => {
    setModalOptions({ ...props, open: true });
  }, []);

  const closeModal = useCallback(() => {
    setModalOptions(null);
  }, []);

  const openModalConfirm = useCallback(
    (props) => {
      modal.confirm({ ...props });
    },
    [modal]
  );

  // Context menu methods
  const openContextMenu = useCallback((props) => {
    const { event, ...rest } = props;

    if (!event) return;

    event.preventDefault();

    setContextMenuOptions({
      ...rest,
      left: event.clientX,
      top: event.clientY,
      open: true,
    });
  }, []);

  const closeContextMenu = useCallback(() => {
    setContextMenuOptions(null);
  }, []);

  const openMultipleModal = useCallback((key, props) => {
    setModals((prev) => {
      const exists = prev.find((modal) => modal.key === key);
      if (exists) {
        return prev.map((modal) =>
          modal.key === key ? { ...modal, props } : modal
        );
      }
      return [...prev, { open: true, key, props }];
    });
  }, []);

  const closeMultipleModal = useCallback((key) => {
    setModals((prevValues) =>
      prevValues.map((modal) =>
        modal.key === key ? { ...modal, open: false } : modal
      )
    );
  }, []);

  const destroyMultipleModal = useCallback((key) => {
    setModals((prevValues) => prevValues.filter((modal) => modal.key !== key));
  }, []);

  const closeDialogs = useCallback(() => {
    setDrawerOptions(null);
    setModalOptions(null);
    setContextMenuOptions(null);
    setModals([]);
  }, []);

  return (
    <DialogContext.Provider
      value={{
        openDrawer,
        closeDrawer,
        openModal,
        closeModal,
        openModalConfirm,
        openContextMenu,
        openMultipleModal,
        closeMultipleModal,
        closeDialogs,
      }}>
      {children}
      <Drawer
        {...drawerOptions}
        title={drawerOptions?.title || "Sin título"}
        open={drawerOptions?.open || false}
        onClose={closeDrawer}
        width={drawerOptions?.width || 378}
        destroyOnHidden>
        {drawerOptions?.content}
      </Drawer>
      <Modal
        {...modalOptions}
        styles={{ header: { marginBottom: 16 } }}
        title={modalOptions?.title || "Sin título"}
        open={modalOptions?.open || false}
        onCancel={closeModal}
        width={modalOptions?.width || 520}
        footer={modalOptions?.footer || null}
        destroyOnHidden>
        {modalOptions?.content}
      </Modal>
      <div
        style={{
          position: "fixed",
          top: contextMenuOptions?.top || 0,
          left: contextMenuOptions?.left || 0,
        }}>
        <Dropdown
          {...contextMenuOptions}
          open={contextMenuOptions?.open || false}
          menu={{ items: contextMenuOptions?.items || [] }}
          onOpenChange={(open) => !open && closeContextMenu()}
          trigger={["contextMenu"]}>
          <div></div>
        </Dropdown>
      </div>

      {/* Multiple modals */}
      {modals.map((modal) => (
        <Modal
          {...(modal?.props ?? {})}
          key={modal.key}
          styles={{ header: { marginBottom: 16 } }}
          title={modal?.props?.title || "Sin título"}
          open={modal.open}
          afterOpenChange={(open) => {
            modal?.afterOpenChange?.(open);
            if (!open) {
              destroyMultipleModal(modal.key);
            }
          }}
          onCancel={() => closeMultipleModal(modal.key)}
          width={modal?.props?.width || 520}
          footer={modal?.props?.footer || null}>
          {modal?.props?.content ?? null}
        </Modal>
      ))}
      {contextHolder}
    </DialogContext.Provider>
  );
};

export const useDialog = () => useContext(DialogContext);

// Para mantener compatibilidad con código existente
export const useDrawer = () => {
  const { openDrawer, closeDrawer } = useContext(DialogContext);
  return { openDrawer, closeDrawer };
};

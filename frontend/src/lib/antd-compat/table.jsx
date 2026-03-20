import { Fragment, useEffect, useState } from "react";
import {
  PiCaretDownBold,
  PiCaretLeftBold,
  PiCaretRightBold,
  PiCaretRightBold as PiExpandRight,
} from "react-icons/pi";
import { cn } from "@/lib/utils";
import { Button, Empty, Input, Spin } from "@/lib/antd-compat/base";
import { Select } from "@/lib/antd-compat/selects";

function usePagination(paginationProp, dataSourceLength) {
  const isEnabled = paginationProp !== false;
  const externalCurrent = paginationProp?.current ?? paginationProp?.page ?? 1;
  const externalPageSize = paginationProp?.pageSize ?? 10;
  const [state, setState] = useState({
    current: externalCurrent,
    pageSize: externalPageSize,
  });

  useEffect(() => {
    setState({
      current: externalCurrent,
      pageSize: externalPageSize,
    });
  }, [externalCurrent, externalPageSize]);

  const total = paginationProp?.total ?? dataSourceLength;

  return {
    enabled: isEnabled,
    total,
    current: state.current,
    pageSize: state.pageSize,
    setState,
  };
}

function renderCellContent(column, record, rowIndex) {
  const dataIndex = column.dataIndex;
  const rawValue = Array.isArray(dataIndex)
    ? dataIndex.reduce((acc, key) => acc?.[key], record)
    : dataIndex == null
      ? undefined
      : record?.[dataIndex];

  if (typeof column.render === "function") {
    return column.render(rawValue, record, rowIndex);
  }

  return rawValue ?? null;
}

function TableRows({ rows, columns, rowKey, onRow, expandable, level = 0 }) {
  return rows.map((record, rowIndex) => {
    const key =
      typeof rowKey === "function"
        ? rowKey(record)
        : record?.[rowKey] ?? record?.key ?? rowIndex;
    const rowProps = onRow?.(record) ?? {};
    const children = record?.children ?? [];
    const expanded = expandable?.expandedRowKeys?.includes?.(key);
    const canExpand = children.length > 0;

    return (
      <Fragment key={key}>
        <tr
          className={cn(
            rowProps.className,
            (rowProps.onClick || rowProps.onContextMenu) && "fd-table-row-clickable"
          )}
          onClick={rowProps.onClick}
          onContextMenu={rowProps.onContextMenu}
        >
          {columns.map((column, columnIndex) => (
            <td
              key={column.key ?? column.dataIndex ?? columnIndex}
              className={cn(
                "px-4 py-3 align-top text-sm text-[color:var(--sk-color-text)]",
                column.align === "center" && "text-center",
                column.align === "right" && "text-right"
              )}
              style={{ width: column.width }}
            >
              <div
                className={cn(columnIndex === 0 && "flex items-start gap-2")}
                style={columnIndex === 0 ? { paddingLeft: level * 18 } : undefined}
              >
                {columnIndex === 0 && canExpand ? (
                  <button
                    type="button"
                    className="mt-0.5 rounded p-1 text-[color:var(--sk-color-text-secondary)] hover:bg-[color:var(--sk-control-item-bg-hover)]"
                    onClick={(event) => {
                      event.stopPropagation();
                      expandable?.onExpand?.(!expanded, record);
                    }}
                  >
                    {expanded ? (
                      <PiCaretDownBold size={12} />
                    ) : (
                      <PiExpandRight size={12} />
                    )}
                  </button>
                ) : columnIndex === 0 ? (
                  <span className="w-5 shrink-0" />
                ) : null}
                <div className="min-w-0 flex-1">
                  {renderCellContent(column, record, rowIndex)}
                </div>
              </div>
            </td>
          ))}
        </tr>
        {canExpand && expanded ? (
          <TableRows
            rows={children}
            columns={columns}
            rowKey={rowKey}
            onRow={onRow}
            expandable={expandable}
            level={level + 1}
          />
        ) : null}
      </Fragment>
    );
  });
}

export function Table({
  dataSource = [],
  columns = [],
  rowKey = "key",
  loading = false,
  pagination = { pageSize: 10 },
  onChange,
  onRow,
  bordered = false,
  expandable,
  tableLayout,
  scroll,
  className,
  style,
  showHeader = true,
}) {
  const { enabled, total, current, pageSize, setState } = usePagination(
    pagination,
    dataSource.length
  );
  const startIndex = enabled ? (current - 1) * pageSize : 0;
  const endIndex = enabled ? startIndex + pageSize : dataSource.length;
  const currentRows = enabled ? dataSource.slice(startIndex, endIndex) : dataSource;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  const updatePagination = (nextCurrent, nextPageSize = pageSize) => {
    const next = {
      current: Math.max(
        1,
        Math.min(nextCurrent, Math.ceil(total / nextPageSize) || 1)
      ),
      pageSize: nextPageSize,
    };
    setState(next);
    onChange?.(next);
  };

  return (
    <div className={cn("ant-table-wrapper space-y-3", className)} style={style}>
      <div
        className={cn(
          "overflow-auto rounded-2xl border border-[color:var(--sk-color-border-secondary)] bg-[color:var(--sk-color-bg-container)]",
          bordered && "fd-table-bordered"
        )}
        style={{ maxHeight: scroll?.y, overflowX: scroll?.x ? "auto" : undefined }}
      >
        <table className="fd-table min-w-full" style={{ tableLayout }}>
          {showHeader ? (
            <thead>
              <tr>
                {columns.map((column, index) => (
                  <th
                    key={column.key ?? column.dataIndex ?? index}
                    className={cn(
                      "px-4 py-3 text-left text-sm font-semibold text-[color:var(--sk-color-text)]",
                      column.align === "center" && "text-center",
                      column.align === "right" && "text-right"
                    )}
                    style={{ width: column.width }}
                  >
                    {column.title}
                  </th>
                ))}
              </tr>
            </thead>
          ) : null}
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={columns.length || 1} className="px-4 py-10 text-center">
                  <Spin size="large" />
                </td>
              </tr>
            ) : currentRows.length ? (
              <TableRows
                rows={currentRows}
                columns={columns}
                rowKey={rowKey}
                onRow={onRow}
                expandable={expandable}
              />
            ) : (
              <tr>
                <td colSpan={columns.length || 1} className="px-4 py-8">
                  <Empty />
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {enabled ? (
        <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-[color:var(--sk-color-text-secondary)]">
          <div>
            {pagination?.showTotal
              ? pagination.showTotal(total, [
                  total === 0 ? 0 : startIndex + 1,
                  Math.min(endIndex, total),
                ])
              : `${total} registros`}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {pagination?.showSizeChanger ? (
              <Select
                className="min-w-[132px]"
                showSearch={false}
                value={pageSize}
                options={[8, 10, 20, 50, 100].map((option) => ({
                  value: option,
                  label: `${option} / pagina`,
                }))}
                onChange={(value) => updatePagination(1, Number(value))}
              />
            ) : null}
            <Button
              size="small"
              disabled={current <= 1}
              icon={<PiCaretLeftBold size={12} />}
              onClick={() => updatePagination(current - 1)}
            />
            <span className="min-w-[56px] text-center">
              {current} / {totalPages}
            </span>
            <Button
              size="small"
              disabled={current >= totalPages}
              icon={<PiCaretRightBold size={12} />}
              onClick={() => updatePagination(current + 1)}
            />
            {pagination?.showQuickJumper ? (
              <Input
                type="number"
                min={1}
                max={totalPages}
                className="h-9 w-20"
                placeholder="Ir"
                onKeyDown={(event) => {
                  if (event.key === "Enter" && event.currentTarget.value) {
                    updatePagination(Number(event.currentTarget.value));
                  }
                }}
              />
            ) : null}
          </div>
        </div>
      ) : null}
    </div>
  );
}

export default Table;

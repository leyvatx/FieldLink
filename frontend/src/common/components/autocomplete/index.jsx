import { useState, useRef, useEffect } from 'react';
import debounce from 'lodash/debounce';
import { Select, Spin, Tag } from 'antd';

const tagRender = (props) => {
  const { label, value, closable, onClose } = props;
  const onPreventMouseDown = (event) => {
    event.preventDefault();
    event.stopPropagation();
  };
  return (
    <Tag
      title={value}
      color={value.includes(',') ? 'blue' : 'green'}
      onMouseDown={onPreventMouseDown}
      closable={closable}
      onClose={onClose}
      style={{
        marginInlineEnd: 4,
        cursor: 'default',
      }}
    >
      {label}
    </Tag>
  );
};

export default function Autocomplete({
  fetchOptions,
  type = '',
  debounceTimeout = 600,
  onlyMaker,
  ...props
}) {
  const [fetching, setFetching] = useState(false);
  const [options, setOptions] = useState([]);
  const fetchRef = useRef(0);

  const loadOptions = (value = '') => {
    fetchRef.current += 1;
    const fetchId = fetchRef.current;
    setOptions([]);
    setFetching(true);

    fetchOptions(value, type, onlyMaker).then((newOptions) => {
      if (fetchId !== fetchRef.current) return;
      setOptions(newOptions.data);
      setFetching(false);
    });
  };

  useEffect(() => {
    loadOptions();
  }, [onlyMaker]);

  const debounceFetcher = debounce(loadOptions, debounceTimeout);

  return (
    <Select
      showSearch
      labelInValue
      filterOption={false}
      onSearch={debounceFetcher}
      notFoundContent={fetching ? <Spin size='small' /> : null}
      {...props}
      tagRender={tagRender}
      options={[
        {
          label: 'Materiales',
          title: 'Materiales',
          options: options.materials?.map((d) => ({
            label: d.CodeMaterial,
            value: d.CodeMaterial,
            desc: d.id,
            className: 'material',
          })),
        },
        {
          label: 'Sets',
          title: 'Sets',
          options: options.sets?.map((d) => ({
            label: d.name,
            value: d.materials.map((m) => m.CodeMaterial).join(', '),
            desc: d?.materials[0]?.id,
            className: 'set',
          })),
        },
      ]}
      optionRender={(item) => (
        <div className={`autocomplete-item ${item.className}`}>
          <span>{item.label}</span>
          <span>{item.value.includes(',') ? ` (${item.value})` : ''}</span>
        </div>
      )}
    />
  );
}

import { useState, useEffect } from 'react';
import { Select, Spin } from 'antd';
import { getUsers } from '../../../../api/userService';
import { PiUserCircle } from 'react-icons/pi';

interface IUser {
  label: string;
  value: string;
  picture: string;
}

interface IResponse {
  id: string;
  name: string;
  lastname: string;
  profile_photo_url: string;
  picture: string | null;
  roles: string | null;
}

const optionRender = (item) => (
  <div className='flex gap-2'>
    {item.data.picture ? (
      <img
        height={20}
        width={20}
        className='rounded-full text-blue-500'
        src={item.data.picture}
        onError={(e: React.SyntheticEvent<HTMLImageElement, Event>) => {
          (e.target as HTMLImageElement).onerror = null;
          (e.target as HTMLImageElement).src = '/img/user-circle.svg';
        }}
      />
    ) : (
      <div className='h-[20px] w-[20px]'>
        <PiUserCircle size={20} />
      </div>
    )}
    <span className='text-ellipsis overflow-hidden'>{item.label}</span>
    {item.data?.roles.map((rol) => {
      if (rol.name == 'Baja') {
        return <span key={rol.id}>({rol.name})</span>;
      }
    })}
  </div>
);

export default function Autocomplete({ onChange, value, tagRender = false }) {
  const [filtering, setFiltering] = useState(false);
  const [users, setUsers] = useState<IUser[]>([]);
  const [visibleUsers, setVisibleUsers] = useState<IUser[]>([]);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    getUsers({ page: 1, size: 10 })
      .then((newOptions: IResponse[]) => {
        console.log(newOptions);
        const newUsers = newOptions.map((user) => ({
          label: (user.name?.split(' ')[0] ?? '') + ' ' + (user.lastname?.split(' ')[0] ?? ''),
          value: user.id,
          picture: user.picture ? '/users/' + user.picture : user.profile_photo_url,
          roles: user.roles,
        }));
        setUsers(newUsers);
        setVisibleUsers(newUsers);
      })
      .catch(console.error);
  }, []);

  const filterUsers = (value) => {
    setFiltering(true);
    const usersFound = users.filter((user) =>
      user.label.toLowerCase().includes(value.toLowerCase()),
    );
    setVisibleUsers(usersFound);
    setFiltering(false);
  };

  return (
    <Select
      mode='multiple'
      autoClearSearchValue
      allowClear
      placeholder='Buscar usuarios'
      className='w-full'
      size='middle'
      filterOption={false}
      onSearch={filterUsers}
      notFoundContent={filtering ? <Spin size='small' /> : null}
      tagRender={tagRender ? undefined : () => <></>}
      options={visibleUsers}
      optionRender={optionRender}
      value={value}
      open={open}
      onDropdownVisibleChange={(visible) => setOpen(visible)}
      onSelect={() => {
        filterUsers('');
        //setOpen(false);
      }}
      onChange={(value) => {
        const usersSelected = users.filter((user) => value.includes(user.value));
        onChange(usersSelected);
      }}
    />
  );
}

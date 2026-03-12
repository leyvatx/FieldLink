import { useContext, useEffect, useRef, useState } from 'react';
import { ILog } from '../types';
import TimelineItem from './timeline-item';
import classNames from 'classnames';
import { getMovements } from '@api/logService';
import { Divider, Empty, Spin } from 'antd';
import { LogContext } from '../contexts/log-context';
import './timeline.css';

const TimeLine = () => {
  const { listType, filterInvoice, filterDate, selectedUsers, selectedMovements, selectedModules } =
    useContext(LogContext);
  const [movements, setMovements] = useState<ILog[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const divRef = useRef<HTMLDivElement>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const getMovementsInPage = async (current_page) => {
    setPage(current_page);
    setIsLoading(true);
    const params = new URLSearchParams();
    params.append('page', current_page.toString());
    params.append('invoice', filterInvoice);
    if(filterDate?.start) params.append('dateStart', filterDate?.start);
    if(filterDate?.end) params.append('dateEnd', filterDate?.end);
    selectedUsers.forEach((el) => params.append('users[]', el.value));
    selectedMovements.forEach((el) => params.append('movements[]', el.id));
    selectedModules.forEach((el) => params.append('modules[]', el.id));
    const { data } = await getMovements(params);
    if (current_page === 1) setMovements(data.data);
    else setMovements((prev) => [...prev, ...data.data]);
    setTotalPages(data.last_page);
    setIsLoading(false);
  };

  useEffect(() => {
    getMovementsInPage(1);
    if (divRef.current) divRef.current.scrollTop = 0;
  }, [filterInvoice, filterDate, selectedUsers, selectedMovements, selectedModules]);

  const handleScroll = () => {
    if (divRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = divRef.current;
      const offset = 500; // Cambia este valor según tus necesidades
      if (scrollTop + clientHeight >= scrollHeight - offset) {
        if (page < totalPages && !isLoading) {
          getMovementsInPage(page + 1);
        }
      }
    }
  };

  if (movements.length === 0) {
    return (
      <div className='h-full w-full flex items-center justify-center'>
        {isLoading ? <Spin size='large' /> : <Empty description='Sin movimientos' />}
      </div>
    );
  }
  else {
    console.log('movements', movements);
  }

  const itemList = movements.map((item, index, array) => {
    const isSameDate = index > 0 && array[index].date_time == array[index - 1].date_time;
    return <TimelineItem key={index} data={item} isSameDate={isSameDate} />;
  });
  return (
    <div
      className={classNames('timeline', `timeline--${listType}`)}
      onScroll={() => {
        handleScroll();
      }}
      ref={divRef}
    >
      {itemList}
      {isLoading ? (
        <div className='w-full flex justify-center'>
          <Spin />
        </div>
      ) : (
        page === totalPages && <Divider plain>No hay más movimientos</Divider>
      )}
    </div>
  );
};

export default TimeLine;

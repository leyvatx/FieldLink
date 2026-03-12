export interface ILog {
  id: number;
  date_time: string;
  user: {
    id: number;
    name: string;
    lastname: string;
    picture: string;
  };
  movement_id: number;
  module_id: number;
  data: {
    id?: number;
    name?: string;
    id2?: number;
    name2?: string;
    extra?: {
      files?: {
        name: string;
        url: string;
      }[];
      edited_data?: {
        field: {
          name: string;
          value?: string;
        };
        type: string;
        old_value?: string | number;
        new_value: string | number;
        from?: {
          name: string;
          value: string;
        };
      }[];
      qty_pallets?: number;
      qty_pallets_total?: number;
    };
  };
}

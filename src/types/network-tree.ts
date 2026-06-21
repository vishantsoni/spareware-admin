export interface TreeUser {
  id: number;
  username: string;
  email: string;
  phone: string;
  full_name:string;
  node_path: string;
  referrer_id: number;
  referrer:ReferrerUser;
  referral_code: string;
  created_at: string;
  children: TreeUser[];
  is_active: boolean;
}

export interface ReferrerUser{
  full_name:string;
  phone:string;
}

export interface ApiTreeResponse {
  status: boolean;
  data: TreeUser[];
}


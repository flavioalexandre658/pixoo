export interface IUser {
  id: string;
  email: string;
  name: string;
  emailVerified: boolean;
  image?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface ICreateUser {
  email: string;
  name: string;
  emailVerified?: boolean;
  image?: string;
}

export interface IUpdateUser {
  name?: string;
  emailVerified?: boolean;
  image?: string;
}
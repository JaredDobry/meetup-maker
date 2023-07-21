export type Token = string;

export type User = {
  first_name: string;
  last_name: string;
  email: string;
  password: string;
};

export enum Message {
  INVALID = -1,
  SIGNUP = 0,
  LOGIN = 1,
  TOKEN = 2,
  HEARTBEAT = 3,
  CREATE_EVENT = 4,
}

export type ClientRequest = {
  uuid: string;
  type: Message;
};

export type ServerResponse = {
  uuid: string;
  type: Message;
  ok: boolean;
  reason?: string;
};

export type ClientSignup = ClientRequest & User;

export type ServerSignup = {
  token: string;
} & ServerResponse;

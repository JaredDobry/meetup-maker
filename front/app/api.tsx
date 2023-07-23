import { v4 as uuidv4 } from "uuid";

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
  CREATE_EVENT = 3,
}

export class ClientRequest {
  uuid: string;
  type: Message;

  constructor() {
    this.uuid = uuidv4();
    this.type = Message.INVALID;
  }
}

export type ServerResponse = {
  uuid: string;
  type: Message;
  ok: boolean;
  reason?: string;
};

export class ClientSignup extends ClientRequest {
  first_name: string;
  last_name: string;
  email: string;
  password: string;

  constructor(
    first_name: string,
    last_name: string,
    email: string,
    password: string
  ) {
    super();
    this.type = Message.SIGNUP;
    this.first_name = first_name;
    this.last_name = last_name;
    this.email = email;
    this.password = password;
  }
}

export type ServerSignup = {
  token: string;
} & ServerResponse;

export class ClientLogin extends ClientRequest {
  email: string;
  password: string;

  constructor(email: string, password: string) {
    super();
    this.type = Message.LOGIN;
    this.email = email;
    this.password = password;
  }
}

export type ServerLogin = {
  token: string;
  first_name: string;
} & ServerResponse;

export class ClientToken extends ClientRequest {
  email: string;
  token: string;

  constructor(email: string, token: string) {
    super();
    this.type = Message.TOKEN;
    this.email = email;
    this.token = token;
  }
}

export type ServerToken = {
  first_name: string;
} & ServerResponse;

import * as dotenv from 'dotenv';

dotenv.config();

export const DEFAULT_ENVIRONMENT_NAME = 'Master';
export const DEFAULT_REMOTE_ADDRESS = 'https://api.8base.com';

export const ENVIRONMENT_NAME = process.env.ENVIRONMENT_NAME;
export const WORKSPACE_ID = process.env.WORKSPACE_ID;
export const API_HOST = process.env.API_HOST;

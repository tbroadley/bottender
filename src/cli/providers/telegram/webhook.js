import { TelegramClient } from 'messaging-api-telegram';
import axios from 'axios';
import get from 'lodash/get';
import invariant from 'invariant';

import getConfig from '../../shared/getConfig';
import { print, error, bold } from '../../shared/log';

import help from './help';

export const localClient = axios.create({
  baseURL: 'http://localhost:4040',
});

const getWebhookFromNgrok = async () => {
  const res = await localClient.get('/api/tunnels');
  return get(res, 'data.tunnels[1].public_url'); // tunnels[1] return `https` protocol
};

export async function getWebhook() {
  try {
    const { accessToken } = getConfig('bottender.config.js', 'telegram');

    invariant(accessToken, '`accessToken` is not found in config file');

    const client = TelegramClient.connect(accessToken);
    const { data: { ok, result } } = await client.getWebhookInfo();
    invariant(ok, 'Getting Telegram webhook is failed');

    Object.keys(result).forEach(key => print(`${key}: ${result[key]}`));
  } catch (err) {
    error('Failed to get Telegram webhook');
    if (err.response) {
      error(`status: ${bold(err.response.status)}`);
      if (err.response.data) {
        error(`data: ${bold(JSON.stringify(err.response.data, null, 2))}`);
      }
    } else {
      error(err.message);
    }
    return process.exit(1);
  }
}

export async function setWebhook(_webhook) {
  try {
    const { accessToken } = getConfig('bottender.config.js', 'telegram');

    invariant(accessToken, '`accessToken` is not found in config file');

    const client = TelegramClient.connect(accessToken);
    const webhook = _webhook || (await getWebhookFromNgrok());

    invariant(
      webhook,
      '`webhook` is required but not found. Use -w <webhook> to setup or make sure you are running ngrok server.'
    );

    const { data: { ok } } = await client.setWebhook(webhook);
    invariant(ok, 'Setting for webhook is failed');

    print('Successfully set Telegram webhook callback URL');
  } catch (err) {
    error('Failed to set Telegram webhook');
    if (err.response) {
      error(`status: ${bold(err.response.status)}`);
      if (err.response.data) {
        error(`data: ${bold(JSON.stringify(err.response.data, null, 2))}`);
      }
    } else {
      error(err.message);
    }
    return process.exit(1);
  }
}

export async function deleteWebhook() {
  try {
    const { accessToken } = getConfig('bottender.config.js', 'telegram');

    invariant(accessToken, '`accessToken` is not found in config file');

    const client = TelegramClient.connect(accessToken);
    const { data: { ok } } = await client.deleteWebhook();
    invariant(ok, 'Deleting Telegram webhook is failed');

    print('Successfully delete Telegram webhook');
  } catch (err) {
    error('Failed to delete Telegram webhook');
    if (err.response) {
      error(`status: ${bold(err.response.status)}`);
      if (err.response.data) {
        error(`data: ${bold(JSON.stringify(err.response.data, null, 2))}`);
      }
    } else {
      error(err.message);
    }
    return process.exit(1);
  }
}

export default async function main(ctx) {
  const subcommand = ctx.argv._[2];

  switch (subcommand) {
    case 'get':
      await getWebhook();
      break;
    case 'set': {
      const webhook = ctx.argv.w;
      await setWebhook(webhook);
      break;
    }
    case 'delete':
    case 'del':
      await deleteWebhook();
      break;
    default:
      error(`Please specify a valid subcommand: get, set, delete`);
      help();
  }
}

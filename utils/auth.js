/* eslint-disable import/no-named-as-default */
/* eslint-disable no-unused-vars */
import dbClient from './db';
import monogDBCore from 'mongodb/lib/core';
import redisClient from './redis';
import { Request, Response, NextFunction } from 'express';
import sha1 from 'sha1';

export const userAuthorization = async (request) => {
  try {
    const authHeader = request.headers.authorization || null;

    if (!authHeader) {
      return null;
    }

    const authParts = authHeader.split(' ');

    if (authParts.length !== 2 || authParts[0] !== 'Basic') {
      return null;
    }

    const authToken = Buffer.from(authParts[1], 'base64').toString();
    const delimPos = authToken.indexOf(':');
    const email = authToken.substring(0, delimPos);
    const password = authToken.substring(delimPos + 1);
    const user = await (await dbClient.usersCollection()).findOne({ email });

    if (!user || sha1(password) !== user.password) {
      return null;
    }
    return user;
  } catch (error) {
    console.log(error)
  }
};

export const userFromXTokenHeader = async (request) => {
  const authToken = request.headers['x-token'];

  if (!authToken) {
    return null;
  }

  const userId = await redisClient.get(`auth_${authToken}`);

  if (!userId) {
    return null;
  }
  const user = await (await dbClient.usersCollection()).findOne({ _id: new mongoDBCore.BSON.ObjectId(userId) });

  return user || null;
};

export const basicAuthentication = async (request, response, next) => {
  const user = await userAuthorization(request);

  if (!user) {
    response.status(401).json({ error: 'Unauthorized' });
    return;
  }
  request.user = user;
  next();
};

export const xTokenAuthentication = async (request, response, next) => {
  const user = await userFromXTokenHeader(request);

  if (!user) {
    response.status(401).json({ error: 'Unauthorized' });
     return;
  }
  request.user = user;
  next();
};

export class APIError extends Error {
  constructor(code, msg) {
    super();
    this.code = code || 500;
    this.message = msg;
  }
}

export const errResponse = (error, request, response, next) => {
  const msg = `Failed to process ${request.url}`;

  if (error instanceof APIError) {
    response.status(error.code).json({ error: error.message || msg });
    return;
  }
  response.status(500).json({ error: error ? error.message || error.toString() : msg });
};

export default {
  userAuthorization: async (request) => userAuthorization(request),
  userFromXTokenHeader: async (request) => userFromXTokenHeader(request),
};

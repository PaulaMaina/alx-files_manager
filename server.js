#!/usr/bin/yarn dev
import express from 'express';
import apiEndpoints from './routes/index';
import dbEnvVariables from '../utils/env_db.js';

const server = express();

server.use(express.json({ limit: '200mb' }));

const startServer = (app) => {
  dbEnvVariables();
  const port = process.env.PORT || 5000;
  const env = process.env.npm_lifecycle_event || 'dev';

  app.listen(port, () => {
    console.log(`[${env}] Server listening on localhost at port ${port}`);
  });
};

apiEndpoints(server);
startServer(server);

export default server;

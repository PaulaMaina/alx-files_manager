#!/usr/bin/yarn dev

import AppController from '../controllers/AppController';

const apiEndpoints = (app) => {
  app.get('/status', AppController.getStatus);
  app.get('/stats', AppController.getStats);
};

export default apiEndpoints;

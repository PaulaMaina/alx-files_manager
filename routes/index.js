import AuthController from '../controllers/AuthController';
import AppController from '../controllers/AppController';
import { APIError, errResponse } from '../utils/auth';
import { basicAuthentication, xTokenAuthentication } from '../utils/auth';
// eslint-disable-next-line no-unused-vars
import { Express } from 'express';
import UsersController from '../controllers/UsersController';

const apiEndpoints = (app) => {
  app.get('/status', AppController.getStatus);
  app.get('/stats', AppController.getStats);

  app.post('/users', UsersController.postNew);
  app.get('/users/me', xTokenAuthentication, UsersController.getMe);

  app.get('/connect', basicAuthentication, AuthController.getConnect);
  app.get('/disconnect', xTokenAuthentication, AuthController.getDisconnect);

  app.all('*', (request, response, next) => {
    errResponse(new APIError(404, `Cannot ${request.method} ${request.url}`), request, response, next);
  });
  app.use(errResponse);
};

export default apiEndpoints;

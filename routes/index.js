import AuthController from '../controllers/AuthController';
import AppController from '../controllers/AppController';
import UsersController from '../controllers/UsersController';

const apiEndpoints = (app) => {
  app.get('/status', AppController.getStatus);
  app.get('/stats', AppController.getStats);
  app.post('/users', UsersController.postNew);
  app.get('/connect', AuthController.getConnect);
  app.get('/disconnect', AuthController.getDisconnect);
  app.get('/users/me', UserController.getMe);
};

export default apiEndpoints;

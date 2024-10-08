import AuthController from '../controllers/AuthController';
import AppController from '../controllers/AppController';
import {
  APIError, errResponse, basicAuthentication, xTokenAuthentication
} from '../utils/auth';
import FilesController from '../controllers/FilesController';
import UsersController from '../controllers/UsersController';

const apiEndpoints = (app) => {
  app.get('/status', AppController.getStatus);
  app.get('/stats', AppController.getStats);

  app.post('/users', UsersController.postNew);
  app.get('/users/me', xTokenAuthentication, UsersController.getMe);

  app.get('/connect', basicAuthentication, AuthController.getConnect);
  app.get('/disconnect', xTokenAuthentication, AuthController.getDisconnect);

  app.post('/files', xTokenAuthentication, FilesController.postUpload);
  app.get('/files', xTokenAuthentication, FilesController.getIndex);
  app.get('/files/:id', xTokenAuthentication, FilesController.getShow);
  app.get('/files/:id/data', FilesController.getFile);
  app.put(
    '/files/:id/publish',
    xTokenAuthentication,
    FilesController.putPublish
  );
  app.put(
    '/files/:id/unpublish',
    xTokenAuthentication,
    FilesController.putUnpublish
  );

  app.all('*', (request, response, next) => {
    const error = new APIError(404, `Cannot ${request.method} ${request.url}`);
    errResponse(error, request, response, next);
  });
  app.use(errResponse);
};

export default apiEndpoints;
